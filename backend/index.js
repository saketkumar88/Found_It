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
    password: { type: String, required: true } 
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
    status: { type: String, default: 'Open' }, // Open vs Resolved feature
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

// NEW: Claim Model to store verification details
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
        const user = await User.findOne({ collegeId });
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
    if (record && record.otp === otp && Date.now() < record.expires) {
        delete otpStore[email.toLowerCase()];
        return res.status(200).json({ success: true });
    }
    res.status(400).json({ message: "Invalid/Expired OTP" });
});

app.post("/signup", async (req, res) => {
    try {
        const { collegeId, password } = req.body;
        const exists = await User.findOne({ collegeId });
        if (exists) return res.status(400).json({ message: "User exists" });
        await new User({ collegeId, password }).save();
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
            image: req.file ? `/uploads/${req.file.filename}` : "",
            embedding: embedding 
        });
        await newItem.save();

        const targetType = newItem.type === 'lost' ? 'found' : 'lost';
        const potentialMatches = await Item.find({ type: targetType, embedding: { $exists: true, $ne: [] } });

        for (let dbItem of potentialMatches) {
            const score = (cosineSimilarity(embedding, dbItem.embedding) * 100).toFixed(2);
            if (score >= 80) {
                await new Notification({ 
                    recipientId: newItem.reportedBy, 
                    ownerId: dbItem.reportedBy, 
                    message: `🎯 Match Found! ${dbItem.itemName} (${score}%)`, 
                    itemId: dbItem._id, 
                    matchScore: score 
                }).save();

                await new Notification({ 
                    recipientId: dbItem.reportedBy, 
                    ownerId: newItem.reportedBy, 
                    message: `🎯 New Match! ${newItem.itemName} (${score}%)`, 
                    itemId: newItem._id, 
                    matchScore: score 
                }).save();
            }
        }
        res.status(201).json({ success: true, item: newItem });
    } catch (err) { res.status(500).json({ message: "Failed" }); }
});

// NEW: Claim Request Route
app.post("/api/claims/request", async (req, res) => {
    try {
        const { itemId, claimerCollegeId, founderCollegeId, phone, proofDescription, itemName } = req.body;

        const newClaim = new Claim({ itemId, claimerCollegeId, founderCollegeId, phone, proofDescription });
        await newClaim.save();

        const newNotif = new Notification({
            recipientId: founderCollegeId,
            ownerId: claimerCollegeId,
            message: `📦 CLAIM: ${claimerCollegeId} claims your item "${itemName}". Check proof!`,
            itemId: itemId,
            read: false
        });
        await newNotif.save();

        // Real-time update to founder if connected
        io.emit(`notification_${founderCollegeId}`, newNotif);

        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ message: "Claim failed" }); }
});

app.get("/items/:type", async (req, res) => {
    const items = await Item.find({ type: req.params.type }).sort({ createdAt: -1 });
    res.json(items);
});

// NEW: Mark as Resolved (Status Badge Feature)
app.patch("/items/resolve/:id", async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
        res.json(item);
    } catch (e) { res.status(500).send(e); }
});

server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));