
require("dotenv").config();

const doctorRoutes = require("./routes/doctorRoutes");
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const app = express();

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"]
}));

app.use(express.json());

// Test backend
app.get("/", (req, res) => {
    res.send("Patient Clinic API is running!");
});

// Test MySQL connection
app.get("/api/health", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS result");

        res.json({
            api: "Working",
            database: "Connected",
            result: rows[0].result
        });
    } catch (error) {
        console.error("Database error:", error.message);

        res.status(500).json({
            api: "Working",
            database: "Connection failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.use("/api/doctors", doctorRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
