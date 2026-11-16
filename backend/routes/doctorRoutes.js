
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

// GET all doctors
router.get("/", async (req, res) => {
    try {
        const [doctors] = await db.query(
            "SELECT * FROM doctors WHERE is_active = TRUE"
        );

        res.status(200).json({
            success: true, 
            count: doctors.length,
            doctors: doctors
        });

    } catch (error) {
        console.error("Error fetching doctors:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch doctors"
        });
    }
});

// DOCTOR ADDS AVAILABLE SCHEDULE
router.post("/schedules", verifyToken, async (req, res) => {
    const { dayOfWeek, startTime, endTime, slotDuration } = req.body;

    const validDays = [
        "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday", "Sunday"
    ];

    if (
        !dayOfWeek ||
        !startTime ||
        !endTime ||
        !slotDuration
    ) {
        return res.status(400).json({
            success: false,
            message: "All schedule fields are required"
        });
    }

    if (
        req.user.role !== "doctor" ||
        !req.user.doctorId
    ) {
        return res.status(403).json({
            success: false,
            message: "Only doctors can add schedules"
        });
    }

    if (
        !validDays.includes(dayOfWeek) ||
        !/^\d{2}:\d{2}(:\d{2})?$/.test(startTime) ||
        !/^\d{2}:\d{2}(:\d{2})?$/.test(endTime) ||
        startTime >= endTime ||
        !Number.isInteger(Number(slotDuration)) ||
        Number(slotDuration) <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid schedule details"
        });
    }

    try {
        const [existing] = await db.query(
            `SELECT schedule_id
             FROM doctor_schedules
             WHERE doctor_id = ?
             AND day_of_week = ?
             AND start_time < ?
             AND end_time > ?`,
            [
                req.user.doctorId,
                dayOfWeek,
                endTime,
                startTime
            ]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This schedule overlaps an existing schedule"
            });
        }

        const [result] = await db.query(
            `INSERT INTO doctor_schedules
             (doctor_id, day_of_week, start_time, end_time, slot_duration)
             VALUES (?, ?, ?, ?, ?)`,
            [
                req.user.doctorId,
                dayOfWeek,
                startTime,
                endTime,
                Number(slotDuration)
            ]
        );

        res.status(201).json({
            success: true,
            message: "Doctor schedule added successfully",
            scheduleId: result.insertId
        });

    } catch (error) {
        console.error("Schedule creation error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to add doctor schedule"
        });
    }
});

// DOCTOR VIEWS OWN SCHEDULES
router.get("/my-schedules", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "doctor" || !req.user.doctorId) {
            return res.status(403).json({
                success: false,
                message: "Only doctors can view their schedules"
            });
        }

        const [schedules] = await db.query(
            `SELECT
                schedule_id,
                day_of_week,
                start_time,
                end_time,
                slot_duration,
                is_available
             FROM doctor_schedules
             WHERE doctor_id = ?
             ORDER BY FIELD(
                day_of_week,
                'Monday', 'Tuesday', 'Wednesday',
                'Thursday', 'Friday', 'Saturday', 'Sunday'
             )`,
            [req.user.doctorId]
        );

        res.json({
            success: true,
            count: schedules.length,
            schedules
        });

    } catch (error) {
        console.error("My schedules error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch your schedules"
        });
    }
});

// GET DOCTOR AVAILABLE SCHEDULES
router.get("/:id/schedules", async (req, res) => {
    try {
        const doctorId = req.params.id;

        const [schedules] = await db.query(
            `SELECT
                schedule_id,
                doctor_id,
                day_of_week,
                start_time,
                end_time,
                slot_duration
             FROM doctor_schedules
             WHERE doctor_id = ?
             AND is_available = TRUE
             ORDER BY FIELD(
                day_of_week,
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday'
             )`,
            [doctorId]
        );

        res.status(200).json({
            success: true,
            count: schedules.length,
            schedules
        });

    } catch (error) {
        console.error("Schedule fetching error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch doctor schedules"
        });
    }
});

// GET doctor by ID
router.get("/:id", async (req, res) => {
    try {
        const [doctors] = await db.query(
            "SELECT * FROM doctors WHERE doctor_id = ? AND is_active = TRUE",
            [req.params.id]
        );

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        res.json({
            success: true,
            doctor: doctors[0]
        });

    } catch (error) {
        console.error("Error fetching doctor:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch doctor"
        });
    }
});


// DOCTOR UPDATES OWN SCHEDULE
router.put("/schedules/:id", verifyToken, async (req, res) => {
    const { dayOfWeek, startTime, endTime, slotDuration } = req.body;
    const scheduleId = req.params.id;

    const validDays = [
        "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday", "Sunday"
    ];

    if (
        !validDays.includes(dayOfWeek) ||
        !/^\d{2}:\d{2}(:\d{2})?$/.test(startTime || "") ||
        !/^\d{2}:\d{2}(:\d{2})?$/.test(endTime || "") ||
        startTime >= endTime ||
        !Number.isInteger(Number(slotDuration)) ||
        Number(slotDuration) <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid schedule details"
        });
    }

    try {
        if (req.user.role !== "doctor" || !req.user.doctorId) {
            return res.status(403).json({
                success: false,
                message: "Only doctors can update schedules"
            });
        }

        const [existing] = await db.query(
            `SELECT schedule_id
             FROM doctor_schedules
             WHERE schedule_id = ?
             AND doctor_id = ?`,
            [scheduleId, req.user.doctorId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found"
            });
        }

        const [overlaps] = await db.query(
            `SELECT schedule_id
             FROM doctor_schedules
             WHERE doctor_id = ?
             AND day_of_week = ?
             AND schedule_id != ?
             AND start_time < ?
             AND end_time > ?`,
            [
                req.user.doctorId,
                dayOfWeek,
                scheduleId,
                endTime,
                startTime
            ]
        );

        if (overlaps.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Schedule overlaps another schedule"
            });
        }

        await db.query(
            `UPDATE doctor_schedules
             SET day_of_week = ?,
                 start_time = ?,
                 end_time = ?,
                 slot_duration = ?
             WHERE schedule_id = ?
             AND doctor_id = ?`,
            [
                dayOfWeek,
                startTime,
                endTime,
                Number(slotDuration),
                scheduleId,
                req.user.doctorId
            ]
        );

        res.json({
            success: true,
            message: "Schedule updated successfully"
        });

    } catch (error) {
        console.error("Schedule update error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update schedule"
        });
    }
});


// DOCTOR DELETES OWN SCHEDULE
router.delete("/schedules/:id", verifyToken, async (req, res) => {
    const scheduleId = req.params.id;

    try {
        if (req.user.role !== "doctor" || !req.user.doctorId) {
            return res.status(403).json({
                success: false,
                message: "Only doctors can delete schedules"
            });
        }

        const [result] = await db.query(
            `DELETE FROM doctor_schedules
             WHERE schedule_id = ?
             AND doctor_id = ?`,
            [scheduleId, req.user.doctorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found"
            });
        }

        res.json({
            success: true,
            message: "Schedule deleted successfully"
        });

    } catch (error) {
        console.error("Schedule deletion error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete schedule"
        });
    }
});

module.exports = router;
