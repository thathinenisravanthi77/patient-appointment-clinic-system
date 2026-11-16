
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Navbar,
  Footer,
  SummaryCard,
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

export default function DoctorDashboard() {
  const { profile } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeId, setCompleteId] = useState<number | null>(null);

  // LOAD DOCTOR APPOINTMENTS FROM MYSQL
  useEffect(() => {
    const loadAppointments = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await apiRequest(
          "/appointments/doctor-appointments"
        );

        setAppointments(result.appointments || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load appointments"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [profile]);

  // GET TODAY'S DATE IN LOCAL FORMAT
  const today = (() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  })();

  // FILTER APPOINTMENTS
  const filtered = appointments.filter((a) => {
    const appointmentDate = a.appointment_date.slice(0, 10);

    if (dateFilter && appointmentDate !== dateFilter) {
      return false;
    }

    if (statusFilter !== "all" && a.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // DASHBOARD SUMMARY
  const counts = {
    today: appointments.filter(
      (a) =>
        a.appointment_date.slice(0, 10) === today &&
        (a.status === "booked" || a.status === "confirmed")
    ).length,

    total: appointments.length,

    completed: appointments.filter(
      (a) => a.status === "completed"
    ).length,

    cancelled: appointments.filter(
      (a) => a.status === "cancelled"
    ).length,
  };

  // OPEN COMPLETION CONFIRMATION
  const handleComplete = (id: number) => {
    setCompleteId(id);
    setCompleteOpen(true);
  };

  // MARK APPOINTMENT AS COMPLETED USING MYSQL API
  const confirmComplete = async () => {
    if (!completeId) return;

    try {
      setCompleting(true);
      setError("");

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
          : "Failed to complete appointment"
      );
      setCompleteOpen(false);
    } finally {
      setCompleting(false);
    }
  };

  const formatTime = (time: string) => time.slice(0, 5);

  const formatDate = (date: string) => {
    const [year, month, day] = date.slice(0, 10).split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
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
        <div className="container-page py-12 text-center">
          <p className="text-gray-500">
            Please log in to view your dashboard.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container-page py-12">
          <ErrorMessage
            message={error}
            onRetry={() => window.location.reload()}
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
              Doctor Dashboard
            </h1>
            <p className="text-gray-500">
              Manage your appointments and schedule
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/doctor/schedule"
              className="btn-secondary px-5 py-2.5 text-sm"
            >
              Manage Schedule
            </Link>

            <Link
              to="/doctor/appointments"
              className="btn-primary px-6 py-2.5"
            >
              All Appointments
            </Link>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title="Today's Appointments"
            value={counts.today}
            color="teal"
          />

          <SummaryCard
            title="Total Appointments"
            value={counts.total}
            color="blue"
          />

          <SummaryCard
            title="Completed"
            value={counts.completed}
            color="green"
          />

          <SummaryCard
            title="Cancelled"
            value={counts.cancelled}
            color="red"
          />
        </div>

        {/* APPOINTMENTS TABLE */}
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
                    Action
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
                  filtered.map((a) => (
                    <tr
                      key={a.appointment_id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium">
                            {a.patient_name?.charAt(0)}
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {a.patient_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {a.patient_phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(a.appointment_date)}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatTime(a.start_time)} - {formatTime(a.end_time)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            a.status === "booked"
                              ? "bg-teal-50 text-teal-700 border-teal-100"
                              : a.status === "confirmed"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : a.status === "completed"
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}
                        >
                          {a.status.charAt(0).toUpperCase() +
                            a.status.slice(1)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {(a.status === "booked" ||
                          a.status === "confirmed") && (
                          <button
                            onClick={() =>
                              handleComplete(a.appointment_id)
                            }
                            className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition-colors"
                          >
                            Mark Completed
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
          onClose={() => {
            if (!completing) {
              setCompleteOpen(false);
              setCompleteId(null);
            }
          }}
          onConfirm={confirmComplete}
          title="Mark as completed"
          description="Mark this appointment as completed?"
          confirmLabel={completing ? "Processing..." : "Mark Completed"}
        />
      </div>

      <Footer />
    </div>
  );
}
