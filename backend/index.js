const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 8080;
const JWT_SECRET = "your_college_secret_key_2026"; 

// --- Middleware ---
app.use(cors()); 
app.use(express.json()); 

// --- Database Connection ---
mongoose.connect("mongodb://127.0.0.1:27017/found_it")
    .then(() => console.log("✅ Connected to MongoDB: found_it"))
    .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// --- 1. User Schema ---
const userSchema = new mongoose.Schema({
    collegeId: { type: String, required: true, unique: true },
    password: { type: String, required: true } 
});
const User = mongoose.model("User", userSchema);

// --- 2. Item Schema (Lost & Found Reports) ---
const itemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    objectType: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['lost', 'found'], required: true },
    contact: { type: String, required: true },
    reportedBy: { type: String, required: true }, // College ID of the owner
    createdAt: { type: Date, default: Date.now }
});
const Item = mongoose.model("Item", itemSchema);

// --- Authentication Routes ---

// Signup
app.post("/signup", async (req, res) => {
    try {
        const { collegeId, password } = req.body;
        const existingUser = await User.findOne({ collegeId });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const newUser = new User({ collegeId, password });
        await newUser.save();
        res.status(201).json({ message: "Registration successful!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        const { collegeId, password } = req.body;
        const user = await User.findOne({ collegeId });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid College ID or Password" });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });
        res.status(200).json({ token, collegeId: user.collegeId });
    } catch (err) {
        res.status(500).json({ message: "Server error during login" });
    }
});

// --- Item Management Routes ---

// 1. Submit a Report
app.post("/report", async (req, res) => {
    try {
        const newItem = new Item(req.body);
        await newItem.save();
        res.status(201).json({ message: "Report saved!" });
    } catch (err) {
        res.status(500).json({ message: "Error saving report" });
    }
});

// 2. Get LOST items
app.get("/items/lost", async (req, res) => {
    try {
        const items = await Item.find({ type: "lost" }).sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: "Error fetching lost items" });
    }
});

// 3. Get FOUND items
app.get("/items/found", async (req, res) => {
    try {
        const items = await Item.find({ type: "found" }).sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: "Error fetching found items" });
    }
});

// 4. DELETE an item (Ownership Check Included)
app.delete("/items/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { collegeId } = req.body; // Sent from frontend to verify owner

        const item = await Item.findById(id);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // --- SECURITY CHECK ---
        // Only allow deletion if the logged-in user is the one who posted it
        if (item.reportedBy !== collegeId) {
            return res.status(403).json({ message: "Unauthorized: You can only delete your own reports" });
        }

        await Item.findByIdAndDelete(id);
        res.status(200).json({ message: "Report deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error during deletion" });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server is live at http://localhost:${PORT}`);
});
