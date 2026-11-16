
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// PATIENT REGISTRATION
router.post("/register", async (req, res) => {
    const {
        fullName,
        email,
        phone,
        password,
        age,
        gender,
        dateOfBirth,
        address
    } = req.body;

    if (!fullName || !email || !phone || !password) {
        return res.status(400).json({
            success: false,
            message: "Please fill all required fields"
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must contain at least 8 characters"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const passwordHash = await bcrypt.hash(password, 10);

        const [userResult] = await connection.query(
            `INSERT INTO users
            (full_name, email, phone, password_hash, role)
            VALUES (?, ?, ?, ?, 'patient')`,
            [fullName, email, phone, passwordHash]
        );

        const [patientResult] = await connection.query(
            `INSERT INTO patients
            (user_id, patient_name, age, date_of_birth, gender, phone, email, address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userResult.insertId,
                fullName,
                age || null,
                dateOfBirth || null,
                gender || null,
                phone,
                email,
                address || null
            ]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Patient registered successfully",
            patientId: patientResult.insertId
        });

    } catch (error) {
        await connection.rollback();

        console.error("Registration error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Email or phone number already registered"
            });
        }

        res.status(500).json({
            success: false,
            message: "Registration failed"
        });

    } finally {
        connection.release();
    }
});

// PATIENT LOGIN


router.post("/login", async (req, res) => {
    const { email, phone, password, role } = req.body;

    if ((!email && !phone) || !password) {
        return res.status(400).json({
            success: false,
            message: "Email or phone and password are required"
        });
    }

    if (role && !["patient", "doctor"].includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user role"
        });
    }

    try {
        const [users] = await db.query(
            `SELECT * FROM users
             WHERE (email = ? OR phone = ?)
             AND is_active = TRUE`,
            [email || "", phone || ""]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid login credentials"
            });
        }

        const user = users[0];

        // Check whether the account belongs to the requested role
        if (role && user.role !== role) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this login"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid login credentials"
            });
        }

        let patientId = null;
        let doctorId = null;

        if (user.role === "patient") {
            const [patients] = await db.query(
                "SELECT patient_id FROM patients WHERE user_id = ?",
                [user.user_id]
            );

            patientId = patients[0]?.patient_id || null;

            if (!patientId) {
                return res.status(403).json({
                    success: false,
                    message: "Patient profile not found"
                });
            }
        }

        if (user.role === "doctor") {
            const [doctors] = await db.query(
                "SELECT doctor_id FROM doctors WHERE user_id = ?",
                [user.user_id]
            );

            doctorId = doctors[0]?.doctor_id || null;

            if (!doctorId) {
                return res.status(403).json({
                    success: false,
                    message: "Doctor profile not found"
                });
            }
        }

        const token = jwt.sign(
            {
                userId: user.user_id,
                role: user.role,
                patientId,
                doctorId
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                userId: user.user_id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                patientId,
                doctorId
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
});


// GET LOGGED-IN PATIENT PROFILE
router.get("/me", verifyToken, async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT user_id, full_name, email, phone, role
             FROM users
             WHERE user_id = ? AND is_active = TRUE`,
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error("Profile error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch profile"
        });
    }
});

module.exports = router;
