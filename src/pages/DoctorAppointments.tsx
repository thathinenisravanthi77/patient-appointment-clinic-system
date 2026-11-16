
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Navbar,
  Footer,
  LoadingIndicator,
  ErrorMessage,
  ConfirmationDialog,
} from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/services/api";
import { Search } from "lucide-react";

interface Appointment {
  appointment_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  status: "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
  patient_name: string;
  patient_phone: string;
  age: number | null;
  gender: string | null;
}

export default function DoctorAppointments() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeId, setCompleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // LOAD DOCTOR APPOINTMENTS FROM MYSQL
  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/appointments/doctor-appointments");

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

  useEffect(() => {
    if (profile) {
      loadAppointments();
    } else {
      setLoading(false);
    }
  }, [profile]);

  // FILTER APPOINTMENTS
  const filtered = appointments.filter((appointment) => {
    if (
      dateFilter &&
      appointment.appointment_date.slice(0, 10) !== dateFilter
    ) {
      return false;
    }

    if (
      statusFilter !== "all" &&
      appointment.status !== statusFilter
    ) {
      return false;
    }

    return true;
  });

  // OPEN COMPLETION CONFIRMATION
  const handleComplete = (id: number) => {
    setCompleteId(id);
    setCompleteOpen(true);
  };

  // MARK APPOINTMENT AS COMPLETED
  const confirmComplete = async () => {
    if (!completeId) return;

    setSaving(true);
    setError("");

    try {
      await apiRequest(
        `/appointments/doctor-appointments/${completeId}/complete`,
        {
          method: "PATCH",
        }
      );

      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.appointment_id === completeId
            ? { ...appointment, status: "completed" }
            : appointment
        )
      );

      setCompleteOpen(false);
      setCompleteId(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to complete appointment."
      );
    } finally {
      setSaving(false);
    }
  };

  // FORMAT DATE
  const formatDate = (date: string) => {
    const [year, month, day] = date.slice(0, 10).split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => time.slice(0, 5);

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
        <div className="container-page py-12">
          <p className="text-center text-gray-500">
            Please log in to view your appointments.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && appointments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container-page py-12">
          <ErrorMessage
            message={error}
            onRetry={loadAppointments}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container-page">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Appointments
            </h1>

            <p className="text-gray-500">
              View and manage all your appointments
            </p>
          </div>

          <Link
            to="/doctor/dashboard"
            className="btn-secondary px-5 py-2.5 text-sm"
          >
            Back to dashboard
          </Link>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="date"
                  className="input pl-10"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>

              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="booked">Booked</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Patient
                  </th>

                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>

                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>

                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>

                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No appointments found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((appointment) => (
                    <tr
                      key={appointment.appointment_id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium">
                            {appointment.patient_name?.charAt(0) ?? "?"}
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {appointment.patient_name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {appointment.patient_phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(appointment.appointment_date)}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatTime(appointment.start_time)} -{" "}
                        {formatTime(appointment.end_time)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            appointment.status === "booked" ||
                            appointment.status === "confirmed"
                              ? "bg-teal-50 text-teal-700 border-teal-100"
                              : appointment.status === "completed"
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}
                        >
                          {appointment.status.charAt(0).toUpperCase() +
                            appointment.status.slice(1)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            navigate(
                              `/doctor/appointments/${appointment.appointment_id}`
                            )
                          }
                          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                        >
                          View details
                        </button>

                        {(appointment.status === "booked" ||
                          appointment.status === "confirmed") && (
                          <button
                            onClick={() =>
                              handleComplete(appointment.appointment_id)
                            }
                            className="mt-2 block text-sm text-teal-600 hover:text-teal-700 font-medium"
                            disabled={saving}
                          >
                            Mark completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmationDialog
          open={completeOpen}
          onClose={() => setCompleteOpen(false)}
          onConfirm={confirmComplete}
          title="Mark as completed"
          description="Mark this appointment as completed?"
          confirmLabel={saving ? "Processing..." : "Mark Completed"}
        />
      </div>

      <Footer />
    </div>
  );
}
