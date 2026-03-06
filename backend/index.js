const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 8080;
const JWT_SECRET = "your_college_secret_key_2026"; // In a real app, use an environment variable

// --- Middleware ---
app.use(cors()); // Allows your React app (port 3000) to talk to this server
app.use(express.json()); // Essential for reading 'req.body' from your frontend fetch calls

// --- Database Connection ---
async function main() {
    // Note: Ensure MongoDB Community Server is running on your machine
    await mongoose.connect("mongodb://127.0.0.1:27017/found_it");
    console.log("✅ Connected to MongoDB: found_it");
}

main().catch((err) => console.log("❌ MongoDB Connection Error:", err));

// --- User Schema & Model ---
const userSchema = new mongoose.Schema({
    collegeId: { type: String, required: true, unique: true },
    password: { type: String, required: true } 
    // Note: For production, you should hash this password using bcryptjs
});

const User = mongoose.model("User", userSchema);

// --- API Routes ---

// 1. Root Route (For Testing)
app.get("/", (req, res) => {
    res.send("Lost & Found Backend is Running");
});

// 2. Signup Route
app.post("/signup", async (req, res) => {
    try {
        const { collegeId, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ collegeId });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this College ID" });
        }

        const newUser = new User({ collegeId, password });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Error during signup: " + err.message });
    }
});

// 3. Login Route (With JWT Generation)
app.post("/login", async (req, res) => {
    try {
        const { collegeId, password } = req.body;

        // Find user
        const user = await User.findOne({ collegeId });
        if (!user) {
            return res.status(404).json({ message: "User not found. Please sign up." });
        }

        // Check password (Plain text comparison for now)
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id, collegeId: user.collegeId },
            JWT_SECRET,
            { expiresIn: "24h" } // Token expires in 1 day
        );

        res.status(200).json({
            message: "Login successful",
            token: token,
            collegeId: user.collegeId
        });
    } catch (err) {
        res.status(500).json({ message: "Server error during login" });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server is live at http://localhost:${PORT}`);
});