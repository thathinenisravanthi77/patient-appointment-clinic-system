
const express = require("express");
const router = express.Router();

const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

// BOOK AN APPOINTMENT
router.post("/", verifyToken, async (req, res) => {
    const { doctorId, appointmentDate, startTime, reason } = req.body;

    if (!doctorId || !appointmentDate || !startTime) {
        return res.status(400).json({
            success: false,
            message: "Doctor, appointment date and start time are required"
        });
    }

    if (req.user.role !== "patient" || !req.user.patientId) {
        return res.status(403).json({
            success: false,
            message: "Only patients can book appointments"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Lock the doctor row to prevent simultaneous bookings
        const [doctors] = await connection.query(
            "SELECT doctor_id FROM doctors WHERE doctor_id = ? AND is_active = TRUE FOR UPDATE",
            [doctorId]
        );

        if (doctors.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        // Check doctor's schedule for the selected day and time
        const [schedules] = await connection.query(
            `SELECT
                start_time,
                end_time,
                slot_duration,
                ADDTIME(?, SEC_TO_TIME(slot_duration * 60)) AS appointment_end
             FROM doctor_schedules
             WHERE doctor_id = ?
             AND day_of_week = DAYNAME(?)
             AND is_available = TRUE
             AND ? >= start_time
             AND ADDTIME(?, SEC_TO_TIME(slot_duration * 60)) <= end_time
             LIMIT 1`,
            [
                startTime,
                doctorId,
                appointmentDate,
                startTime,
                startTime
            ]
        );

        if (schedules.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Doctor is not available at this time"
            });
        }

        const endTime = schedules[0].appointment_end;

        // Check for overlapping appointments
        const [existingAppointments] = await connection.query(
            `SELECT appointment_id
             FROM appointments
             WHERE doctor_id = ?
             AND appointment_date = ?
             AND status IN ('booked', 'confirmed')
             AND start_time < ?
             AND end_time > ?
             LIMIT 1`,
            [doctorId, appointmentDate, endTime, startTime]
        );

        if (existingAppointments.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "This time slot is already booked"
            });
        }

        // Insert appointment
        const [result] = await connection.query(
            `INSERT INTO appointments
             (patient_id, doctor_id, appointment_date, start_time, end_time, reason)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.patientId,
                doctorId,
                appointmentDate,
                startTime,
                endTime,
                reason || null
            ]
        );

        // Record initial appointment status
        await connection.query(
            `INSERT INTO appointment_status_history
             (appointment_id, old_status, new_status, changed_by, remarks)
             VALUES (?, NULL, 'booked', ?, 'Appointment created')`,
            [result.insertId, req.user.userId]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Appointment booked successfully",
            appointmentId: result.insertId,
            endTime
        });

    } catch (error) {
        await connection.rollback();

        console.error("Appointment booking error:", error.message);

        res.status(500).json({
            success: false,
            message: "Appointment booking failed"
        });

    } finally {
        connection.release();
    }
});


// GET PATIENT APPOINTMENT HISTORY
router.get("/my-appointments", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "patient" || !req.user.patientId) {
            return res.status(403).json({
                success: false,
                message: "Only patients can view their appointments"
            });
        }

        const [appointments] = await db.query(
            `SELECT
                a.appointment_id,
                a.appointment_date,
                a.start_time,
                a.end_time,
                a.reason,
                a.status,
                a.created_at,
                d.doctor_name,
                d.specialization,
                d.consultation_fee
             FROM appointments a
             JOIN doctors d ON a.doctor_id = d.doctor_id
             WHERE a.patient_id = ?
             ORDER BY a.appointment_date DESC, a.start_time DESC`,
            [req.user.patientId]
        );

        res.json({
            success: true,
            count: appointments.length,
            appointments
        });

    } catch (error) {
        console.error("Appointment history error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch appointment history"
        });
    }
});


// CANCEL PATIENT APPOINTMENT
router.patch("/:id/cancel", verifyToken, async (req, res) => {
    const appointmentId = req.params.id;
    const { cancellationReason } = req.body || {};

    if (req.user.role !== "patient" || !req.user.patientId) {
        return res.status(403).json({
            success: false,
            message: "Only patients can cancel appointments"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [appointments] = await connection.query(
            `SELECT appointment_id, status
             FROM appointments
             WHERE appointment_id = ?
             AND patient_id = ?
             FOR UPDATE`,
            [appointmentId, req.user.patientId]
        );

        if (appointments.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        const appointment = appointments[0];

        if (!["booked", "confirmed"].includes(appointment.status)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This appointment cannot be cancelled"
            });
        }

        await connection.query(
            `UPDATE appointments
             SET status = 'cancelled',
                 cancellation_reason = ?
             WHERE appointment_id = ?`,
            [cancellationReason || null, appointmentId]
        );

        await connection.query(
            `INSERT INTO appointment_status_history
             (appointment_id, old_status, new_status, changed_by, remarks)
             VALUES (?, ?, 'cancelled', ?, ?)`,
            [
                appointmentId,
                appointment.status,
                req.user.userId,
                cancellationReason || "Appointment cancelled by patient"
            ]
        );

        await connection.commit();

        res.json({
            success: true,
            message: "Appointment cancelled successfully"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Cancellation error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to cancel appointment"
        });

    } finally {
        connection.release();
    }
});


// DOCTOR VIEWS OWN APPOINTMENTS
router.get("/doctor-appointments", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "doctor" || !req.user.doctorId) {
            return res.status(403).json({
                success: false,
                message: "Only doctors can view their appointments"
            });
        }

        const [appointments] = await db.query(
            `SELECT
                a.appointment_id,
                a.appointment_date,
                a.start_time,
                a.end_time,
                a.reason,
                a.status,
                p.patient_name,
                p.age,
                p.gender,
                p.phone AS patient_phone
             FROM appointments a
             JOIN patients p ON a.patient_id = p.patient_id
             WHERE a.doctor_id = ?
             ORDER BY a.appointment_date ASC, a.start_time ASC`,
            [req.user.doctorId]
        );

        res.json({
            success: true,
            count: appointments.length,
            appointments
        });

    } catch (error) {
        console.error("Doctor appointments error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch doctor appointments"
        });
    }
});


// DOCTOR CONFIRMS APPOINTMENT
router.patch("/:id/confirm", verifyToken, async (req, res) => {
    const appointmentId = req.params.id;

    if (req.user.role !== "doctor" || !req.user.doctorId) {
        return res.status(403).json({
            success: false,
            message: "Only doctors can confirm appointments"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [appointments] = await connection.query(
            `SELECT appointment_id, status
             FROM appointments
             WHERE appointment_id = ?
             AND doctor_id = ?
             FOR UPDATE`,
            [appointmentId, req.user.doctorId]
        );

        if (appointments.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        const appointment = appointments[0];

        if (appointment.status !== "booked") {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: "Only booked appointments can be confirmed"
            });
        }

        await connection.query(
            `UPDATE appointments
             SET status = 'confirmed'
             WHERE appointment_id = ?`,
            [appointmentId]
        );

        await connection.query(
            `INSERT INTO appointment_status_history
             (appointment_id, old_status, new_status, changed_by, remarks)
             VALUES (?, 'booked', 'confirmed', ?, 'Confirmed by doctor')`,
            [appointmentId, req.user.userId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: "Appointment confirmed successfully"
        });

    } catch (error) {
        await connection.rollback();
        console.error("Confirmation error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to confirm appointment"
        });

    } finally {
        connection.release();
    }
});


// GET BOOKED SLOTS FOR A DOCTOR ON A SELECTED DATE
router.get("/doctor/:doctorId/booked-slots", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "patient" || !req.user.patientId) {
            return res.status(403).json({
                success: false,
                message: "Only patients can view available slots"
            });
        }

        const { doctorId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Appointment date is required"
            });
        }

        const [slots] = await db.query(
            `SELECT start_time, end_time
             FROM appointments
             WHERE doctor_id = ?
             AND appointment_date = ?
             AND status IN ('booked', 'confirmed')
             ORDER BY start_time ASC`,
            [doctorId, date]
        );

        res.json({
            success: true,
            count: slots.length,
            slots
        });

    } catch (error) {
        console.error("Booked slots error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch booked slots"
        });
    }
});


// GET ONE APPOINTMENT DETAILS FOR DOCTOR
router.get("/doctor-appointments/:id", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "doctor" || !req.user.doctorId) {
            return res.status(403).json({
                success: false,
                message: "Only doctors can view appointment details"
            });
        }

        const [appointments] = await db.query(
            `SELECT
                a.appointment_id,
                a.appointment_date,
                a.start_time,
                a.end_time,
                a.reason,
                a.status,
                p.patient_name,
                p.phone AS patient_phone,
                d.doctor_name,
                d.specialization,
                d.consultation_fee
             FROM appointments a
             JOIN patients p ON a.patient_id = p.patient_id
             JOIN doctors d ON a.doctor_id = d.doctor_id
             WHERE a.appointment_id = ?
             AND a.doctor_id = ?`,
            [req.params.id, req.user.doctorId]
        );

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        res.json({
            success: true,
            appointment: appointments[0]
        });

    } catch (error) {
        console.error("Appointment details error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch appointment details"
        });
    }
});


// DOCTOR MARKS APPOINTMENT AS COMPLETED
router.patch("/doctor-appointments/:id/complete", verifyToken, async (req, res) => {
    if (req.user.role !== "doctor" || !req.user.doctorId) {
        return res.status(403).json({
            success: false,
            message: "Only doctors can complete appointments"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [appointments] = await connection.query(
            `SELECT appointment_id, status
             FROM appointments
             WHERE appointment_id = ?
             AND doctor_id = ?
             FOR UPDATE`,
            [req.params.id, req.user.doctorId]
        );

        if (appointments.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        const appointment = appointments[0];

        if (!["booked", "confirmed"].includes(appointment.status)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This appointment cannot be completed"
            });
        }

        await connection.query(
            `UPDATE appointments
             SET status = 'completed'
             WHERE appointment_id = ?`,
            [req.params.id]
        );

        await connection.query(
            `INSERT INTO appointment_status_history
             (appointment_id, old_status, new_status, changed_by, remarks)
             VALUES (?, ?, 'completed', ?, 'Completed by doctor')`,
            [req.params.id, appointment.status, req.user.userId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: "Appointment marked as completed"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Complete appointment error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to complete appointment"
        });

    } finally {
        connection.release();
    }
});


// DOCTOR CANCELS APPOINTMENT
router.patch("/doctor-appointments/:id/cancel", verifyToken, async (req, res) => {
    if (req.user.role !== "doctor" || !req.user.doctorId) {
        return res.status(403).json({
            success: false,
            message: "Only doctors can cancel appointments"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [appointments] = await connection.query(
            `SELECT appointment_id, status
             FROM appointments
             WHERE appointment_id = ?
             AND doctor_id = ?
             FOR UPDATE`,
            [req.params.id, req.user.doctorId]
        );

        if (appointments.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        const appointment = appointments[0];

        if (!["booked", "confirmed"].includes(appointment.status)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This appointment cannot be cancelled"
            });
        }

        await connection.query(
            `UPDATE appointments
             SET status = 'cancelled',
                 cancellation_reason = 'Cancelled by doctor'
             WHERE appointment_id = ?`,
            [req.params.id]
        );

        await connection.query(
            `INSERT INTO appointment_status_history
             (appointment_id, old_status, new_status, changed_by, remarks)
             VALUES (?, ?, 'cancelled', ?, 'Cancelled by doctor')`,
            [req.params.id, appointment.status, req.user.userId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: "Appointment cancelled successfully"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Doctor cancellation error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to cancel appointment"
        });

    } finally {
        connection.release();
    }
});

module.exports = router;
