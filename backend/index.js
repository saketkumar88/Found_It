require('dotenv').config();
const express = require("express");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const http = require('http');
const { Server } = require('socket.io');

const { loadModel, getEmbedding, cosineSimilarity } = require('./visionHelper');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:3000" }
});

const PORT = 8080;
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

let otpStore = {};
let visionModel = null;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

mongoose.connect("mongodb://127.0.0.1:27017/found_it")
    .then(async () => {
        console.log("✅ Connected to MongoDB");
        visionModel = await loadModel();
        console.log("🚀 AI Vision System Online");
    })
    .catch((err) => console.log("❌ MongoDB Connection Error:", err));

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, "uploads/"); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// --- MODELS ---

const User = mongoose.model("User", new mongoose.Schema({
    collegeId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    karma: { type: Number, default: 0 }
}));

const Item = mongoose.model("Item", new mongoose.Schema({
    itemName: { type: String, required: true },
    objectType: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['lost', 'found'], required: true },
    contact: { type: String, required: true },
    reportedBy: { type: String, required: true },
    image: { type: String },
    embedding: { type: Array, default: [] },
    status: { type: String, default: 'Open' },
    createdAt: { type: Date, default: Date.now }
}));

const Notification = mongoose.model("Notification", new mongoose.Schema({
    recipientId: { type: String, required: true },
    ownerId: { type: String, required: true },
    message: { type: String, required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    matchScore: { type: Number },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}));

const Message = mongoose.model("Message", new mongoose.Schema({
    chatId: { type: String, required: true },
    senderId: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}));

const Claim = mongoose.model("Claim", new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    claimerCollegeId: { type: String, required: true },
    founderCollegeId: { type: String, required: true },
    phone: { type: String, required: true },
    proofDescription: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
}));

// --- SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
    });

    socket.on('send_message', async (data) => {
        const newMessage = new Message({
            chatId: data.chatId,
            senderId: data.senderId,
            text: data.text
        });
        await newMessage.save();
        io.to(data.chatId).emit('receive_message', data);
    });
});

// --- AUTH ROUTES ---

app.post("/login", async (req, res) => {
    try {
        const { collegeId, password } = req.body;
        const user = await User.findOne({ collegeId: collegeId.toLowerCase() });
        if (!user || user.password !== password) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });
        res.status(200).json({
            token,
            collegeId: user.collegeId,
            collegeEmailId: user.collegeId
        });
    } catch (err) { res.status(500).json({ message: "Login error" }); }
});

app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore[email.toLowerCase()] = { otp, expires: Date.now() + 600000 };
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your FoundIt Verification Code",
        html: `<div style="text-align: center;"><h1>OTP: <span style="color:#0891b2;">${otp}</span></h1><p>Valid for 10 minutes</p></div>`
    };
    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: "OTP sent" });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore[email.toLowerCase()];
    if (record && record.otp === otp.toString() && Date.now() < record.expires) {
        return res.status(200).json({ success: true });
    }
    res.status(400).json({ message: "Invalid/Expired OTP" });
});

// FIXED: Password Reset Route
app.post("/api/reset-password", async (req, res) => {
    try {
        const { collegeId, password } = req.body;
        if (!collegeId || !password) return res.status(400).json({ message: "Missing data" });

        const user = await User.findOneAndUpdate(
            { collegeId: collegeId.toLowerCase() },
            { password },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: "User not found" });

        delete otpStore[collegeId.toLowerCase()];
        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Update failed" });
    }
});


app.post("/signup", async (req, res) => {
    try {
        const { collegeId, password } = req.body;
        const exists = await User.findOne({ collegeId: collegeId.toLowerCase() });
        if (exists) return res.status(400).json({ message: "User exists" });
        await new User({ collegeId: collegeId.toLowerCase(), password }).save();
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ message: "Error" }); }
});

// --- CHAT & NOTIFICATION ROUTES ---

app.get("/api/messages/:chatId", async (req, res) => {
    try {
        const messages = await Message.find({ chatId: req.params.chatId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (e) { res.status(500).send(e); }
});

app.get("/api/notifications/:collegeId", async (req, res) => {
    try {
        const notifications = await Notification.find({ recipientId: req.params.collegeId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (e) { res.status(500).send(e); }
});

// --- ITEM & CLAIM ROUTES ---

app.post("/report", upload.single("image"), async (req, res) => {
    try {
        let embedding = [];
        if (req.file && visionModel) {
            const vector = await getEmbedding(visionModel, req.file.path);
            if (vector) embedding = Array.from(vector);
        }

        const newItem = new Item({
            ...req.body,
            reportedBy: req.body.reportedBy.toLowerCase(),
            type: req.body.type,
            image: req.file ? `/uploads/${req.file.filename}` : "",
            embedding: embedding
        });
        await newItem.save();


        const targetType = newItem.type === 'lost' ? 'found' : 'lost';

        const potentialMatches = await Item.find({
            type: targetType,
            reportedBy: { $ne: newItem.reportedBy }, // Don't match against the user's own items
            embedding: { $exists: true, $ne: [] }
        });

        for (let dbItem of potentialMatches) {
            if (dbItem._id.toString() === newItem._id.toString()) continue;

            const score = (cosineSimilarity(embedding, dbItem.embedding) * 100).toFixed(2);

            if (score >= 80) {
                await new Notification({
                    recipientId: newItem.reportedBy,
                    ownerId: dbItem.reportedBy,
                    message: `🎯 Match Found! ${dbItem.itemName} (${score}%)\nCheck your "Matches" tab.`,
                    itemId: dbItem._id,
                    matchScore: score
                }).save();

                await new Notification({
                    recipientId: dbItem.reportedBy,
                    ownerId: newItem.reportedBy,
                    message: `🎯 New Match! ${newItem.itemName} (${score}%)\nSomeone posted a matching ${newItem.type} item.`,
                    itemId: newItem._id,
                    matchScore: score
                }).save();
            }
        }
        res.status(201).json({ success: true, item: newItem });
    } catch (err) { res.status(500).json({ message: "Failed" }); }
});

app.post("/api/claims/request", async (req, res) => {
    try {
        const { itemId, claimerCollegeId, founderCollegeId, phone, proofDescription, itemName } = req.body;

        // 1. Create the Claim record
        const newClaim = new Claim({
            itemId,
            claimerCollegeId: claimerCollegeId.toLowerCase(),
            founderCollegeId: founderCollegeId.toLowerCase(),
            phone,
            proofDescription
        });
        await newClaim.save();

        // 2. Create the Notification
        // CRITICAL: We must save the itemId so the Sidebar buttons know which item to resolve
        // --- UPDATED NOTIFICATION MESSAGE IN /api/claims/request ---
        const newNotif = new Notification({
            recipientId: founderCollegeId.toLowerCase(),
            ownerId: claimerCollegeId.toLowerCase(),
            message: `📦 CLAIM: ${claimerCollegeId} found your "${itemName}"\n📞 Phone: ${phone}\n📄 Proof: ${proofDescription}`,
            itemId: itemId,
            read: false
        });
        await newNotif.save();

        io.emit(`notification_${founderCollegeId.toLowerCase()}`, newNotif);
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ message: "Claim failed" });
    }
});

app.get("/items/:type", async (req, res) => {
    const items = await Item.find({ type: req.params.type }).sort({ createdAt: -1 });
    res.json(items);
});

app.patch("/items/resolve/:id", async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
        res.json(item);
    } catch (e) { res.status(500).send(e); }
});

// --- CLAIM MANAGEMENT ROUTES ---

/// --- CLAIM MANAGEMENT ROUTES ---

// Approve a Claim: Award Karma to the FINDER, Resolve Item, and Cleanup
app.patch("/api/claims/approve/:itemId", async (req, res) => {
    try {
        const { itemId } = req.params;

        // 1. Mark item as Resolved in the database
        // We fetch the full item document so we can access the 'reportedBy' field
        const item = await Item.findByIdAndUpdate(itemId, { status: 'Resolved' }, { new: true });

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // 2. LOGIC FIX: Award points to the FINDER (the person who reported it)
        // item.reportedBy contains the collegeId of the person who posted the found item
        if (item.reportedBy) {
            await User.findOneAndUpdate(
                { collegeId: item.reportedBy.toLowerCase() },
                { $inc: { karma: 1 } }
            );
        }

        // 3. Update the claim status to approved for record keeping
        await Claim.findOneAndUpdate({ itemId: itemId }, { status: 'approved' });

        // 4. IMPORTANT: Remove the notifications associated with this item
        await Notification.deleteMany({ itemId: itemId });

        res.status(200).json({
            success: true,
            message: "Claim accepted! Karma point awarded to the finder."
        });
    } catch (err) {
        console.error("Approval error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Reject a Claim: Mark as rejected and clear notification
app.patch("/api/claims/reject/:itemId", async (req, res) => {
    try {
        const { itemId } = req.params;

        await Claim.findOneAndUpdate({ itemId: itemId }, { status: 'rejected' });

        // Remove notification so it doesn't stay in the owner's list
        await Notification.deleteMany({ itemId: itemId });

        res.status(200).json({ success: true, message: "Rejected and notification cleared!" });
    } catch (err) {
        res.status(500).json({ message: "Rejection failed" });
    }
});



// Reject a Claim: Just Delete the Notification
app.patch("/api/claims/reject/:itemId", async (req, res) => {
    try {
        const { itemId } = req.params;

        await Claim.findOneAndUpdate({ itemId: itemId }, { status: 'rejected' });

        // Remove notification so it doesn't stay in the list
        await Notification.deleteOne({ itemId: itemId });

        res.status(200).json({ success: true, message: "Rejected and notification cleared!" });
    } catch (err) {
        res.status(500).json({ message: "Rejection failed" });
    }
});

app.get("/api/karma/:collegeId", async (req, res) => {
    try {
        const user = await User.findOne({ collegeId: req.params.collegeId.toLowerCase() });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ karma: user.karma });
    } catch (err) {
        res.status(500).json({ message: "Error fetching karma" });
    }
});

server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`))