
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Navbar,
  Footer,
  AppointmentCard,
  SummaryCard,
  LoadingIndicator,
  ErrorMessage,
  ConfirmationDialog,
} from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/services/api";

interface PatientAppointment {
  appointment_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  status: "booked" | "confirmed" | "cancelled" | "completed";
  doctor_name: string;
  specialization: string;
  consultation_fee: number | string;
}

export default function PatientDashboard() {
  const { profile } = useAuth();

  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiRequest("/appointments/my-appointments");

        setAppointments(response.appointments || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load appointments."
        );
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      loadAppointments();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const isUpcoming = (appointment: PatientAppointment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentDate = new Date(
      `${appointment.appointment_date.slice(0, 10)}T00:00:00`
    );

    return (
      (appointment.status === "booked" ||
        appointment.status === "confirmed") &&
      !Number.isNaN(appointmentDate.getTime()) &&
      appointmentDate >= today
    );
  };

  const upcomingCount = appointments.filter(isUpcoming).length;

  const completedCount = appointments.filter(
    (appointment) => appointment.status === "completed"
  ).length;

  const cancelledCount = appointments.filter(
    (appointment) => appointment.status === "cancelled"
  ).length;

  const filteredAppointments = appointments.filter((appointment) => {
    if (filter === "upcoming") return isUpcoming(appointment);
    if (filter === "completed") return appointment.status === "completed";
    if (filter === "cancelled") return appointment.status === "cancelled";
    return true;
  });

  const handleCancel = (id: number) => {
    setCancelId(id);
    setCancelOpen(true);
    setError("");
  };

  const confirmCancel = async () => {
    if (cancelId === null || cancelling) return;

    try {
      setCancelling(true);
      setError("");

      await apiRequest(`/appointments/${cancelId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });

      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.appointment_id === cancelId
            ? { ...appointment, status: "cancelled" }
            : appointment
        )
      );

      setCancelOpen(false);
      setCancelId(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to cancel appointment."
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container-page py-12">
          <LoadingIndicator />
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container-page py-12 text-center">
          <p>Please log in to view your dashboard.</p>
          <Link to="/login" className="text-teal-600">
            Login
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container-page py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Patient Dashboard
            </h1>
            <p className="text-gray-500">
              Welcome back, {profile.full_name}
            </p>
          </div>

          <Link to="/doctors" className="btn-primary px-6 py-2.5">
            Book Appointment
          </Link>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title="Total Appointments"
            value={appointments.length}
          />
          <SummaryCard title="Upcoming" value={upcomingCount} />
          <SummaryCard title="Completed" value={completedCount} />
          <SummaryCard title="Cancelled" value={cancelledCount} />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {["all", "upcoming", "completed", "cancelled"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                filter === item
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <h2 className="font-semibold text-gray-900 mb-4">
          My Appointments
        </h2>

        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              No appointments found.
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.appointment_id}
                appointment={{
                  appointment_id: String(appointment.appointment_id),
                  doctor_name: appointment.doctor_name,
                  specialization: appointment.specialization,
                  appointment_date: appointment.appointment_date,
                  start_time: appointment.start_time,
                  end_time: appointment.end_time,
                  status: appointment.status,
                }}
                onCancel={
                  (appointment.status === "booked" ||
                    appointment.status === "confirmed")
                    ? () => handleCancel(appointment.appointment_id)
                    : undefined
                }
              />
            ))
          )}
        </div>

        <ConfirmationDialog
          open={cancelOpen}
          onClose={() => {
            if (!cancelling) {
              setCancelOpen(false);
              setCancelId(null);
            }
          }}
          onConfirm={confirmCancel}
          title="Cancel Appointment"
          description="Are you sure you want to cancel this appointment?"
          confirmLabel={cancelling ? "Cancelling..." : "Yes, Cancel"}
          cancelLabel="Keep Appointment"
          danger
        />
      </main>

      <Footer />
    </div>
  );
}
