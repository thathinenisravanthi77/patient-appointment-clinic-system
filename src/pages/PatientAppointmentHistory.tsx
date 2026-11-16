
import { useEffect, useState } from "react";
import {
  Navbar,
  Footer,
  LoadingIndicator,
  ErrorMessage,
} from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/services/api";

interface PatientAppointment {
  appointment_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  status: "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
  doctor_name: string;
  specialization: string;
  consultation_fee: number;
}

type AppointmentFilter = "all" | "upcoming" | "completed" | "cancelled";

export default function PatientAppointmentHistory() {
  const { profile } = useAuth();

  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [filter, setFilter] = useState<AppointmentFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAppointments = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await apiRequest("/appointments/my-appointments");

        setAppointments(response.appointments ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load appointment history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [profile]);

  const filteredAppointments = appointments.filter((appointment) => {
    if (filter === "upcoming") {
      return (
        appointment.status === "booked" ||
        appointment.status === "confirmed"
      );
    }

    if (filter === "completed") {
      return appointment.status === "completed";
    }

    if (filter === "cancelled") {
      return appointment.status === "cancelled";
    }

    return true;
  });

  const formatDate = (date: string) => {
    const parsedDate = new Date(`${date.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return time;
    }

    const parsedTime = new Date();
    parsedTime.setHours(hours, minutes, 0, 0);

    return parsedTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusStyle = (status: PatientAppointment["status"]) => {
    switch (status) {
      case "booked":
        return "bg-blue-100 text-blue-700";

      case "confirmed":
        return "bg-teal-100 text-teal-700";

      case "completed":
        return "bg-green-100 text-green-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      case "no_show":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
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
          <p className="text-gray-500">
            Please log in to view your appointment history.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container-page py-12">
          <ErrorMessage message={error} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container-page py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Appointment History
          </h1>
          <p className="text-gray-500">
            All your past and upcoming appointments
          </p>
        </div>

        {/* Appointment Filter */}
        <div className="mb-6">
          <select
            className="input max-w-xs"
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as AppointmentFilter)
            }
          >
            <option value="all">All appointments</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Appointment List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="card p-10 text-center text-gray-500">
              No appointments found.
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div
                key={appointment.appointment_id}
                className="card p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {appointment.doctor_name}
                    </h2>

                    <p className="text-sm text-teal-600">
                      {appointment.specialization}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                      appointment.status
                    )}`}
                  >
                    {appointment.status.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 text-sm">
                  <div>
                    <p className="text-gray-500">Appointment Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(appointment.appointment_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Appointment Time</p>
                    <p className="font-medium text-gray-900">
                      {formatTime(appointment.start_time)} -{" "}
                      {formatTime(appointment.end_time)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Consultation Fee</p>
                    <p className="font-medium text-gray-900">
                      ₹{Number(appointment.consultation_fee).toLocaleString("en-IN")}
                    </p>
                  </div>

                  {appointment.reason && (
                    <div>
                      <p className="text-gray-500">Reason for Visit</p>
                      <p className="font-medium text-gray-900">
                        {appointment.reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
