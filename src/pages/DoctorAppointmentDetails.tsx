
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Navbar,
  Footer,
  LoadingIndicator,
  ErrorMessage,
  ConfirmationDialog,
} from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/services/api";
import { CheckCircle2, Ban, ChevronLeft } from "lucide-react";

interface Appointment {
  appointment_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  status: "booked" | "confirmed" | "cancelled" | "completed" | "no_show";
  patient_name: string;
  patient_phone: string;
  doctor_name: string;
  specialization: string;
  consultation_fee: number;
}

export default function DoctorAppointmentDetails() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // FETCH APPOINTMENT DETAILS FROM MYSQL
  useEffect(() => {
    const loadAppointment = async () => {
      if (!profile || !id) {
        setError("Invalid appointment or login session.");
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest(
          `/appointments/doctor-appointments/${id}`
        );

        setAppointment(response.appointment);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load appointment details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [profile, id]);

  // MARK APPOINTMENT AS COMPLETED
  const handleComplete = async () => {
    if (!appointment) return;

    setSaving(true);
    setError("");

    try {
      await apiRequest(
        `/appointments/doctor-appointments/${appointment.appointment_id}/complete`,
        {
          method: "PATCH",
        }
      );

      setAppointment({
        ...appointment,
        status: "completed",
      });

      setCompleteOpen(false);
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

  // DOCTOR CANCELS APPOINTMENT
  const handleCancel = async () => {
    if (!appointment) return;

    setSaving(true);
    setError("");

    try {
      await apiRequest(
        `/appointments/doctor-appointments/${appointment.appointment_id}/cancel`,
        {
          method: "PATCH",
        }
      );

      setAppointment({
        ...appointment,
        status: "cancelled",
      });

      setCancelOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to cancel appointment."
      );
    } finally {
      setSaving(false);
    }
  };

  // FORMAT DATE
  const formatDate = (date: string) => {
    const [year, month, day] = date.slice(0, 10).split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
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

  if (error && !appointment) {
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

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container-page py-12">
          <div className="max-w-md mx-auto text-center">
            <p className="text-gray-500">Appointment not found.</p>
          </div>
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
          <Link
            to="/doctor/appointments"
            className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
          >
            <ChevronLeft size={16} />
            Back
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Appointment Details
            </h1>

            <p className="text-gray-500">
              Appointment #{String(appointment.appointment_id).slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="card p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm text-gray-500 uppercase tracking-wider">
                  Patient
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                    {appointment.patient_name?.charAt(0) ?? "?"}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {appointment.patient_name ?? "—"}
                    </p>

                    <p className="text-xs text-gray-500">
                      {appointment.patient_phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-500 uppercase tracking-wider">
                  Doctor
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {appointment.doctor_name}
                </p>

                <p className="text-xs text-gray-500">
                  {appointment.specialization}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-500 uppercase tracking-wider">
                  Date
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {formatDate(appointment.appointment_date)}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-500 uppercase tracking-wider">
                  Time
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {appointment.start_time.slice(0, 5)} -{" "}
                  {appointment.end_time.slice(0, 5)}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-500 uppercase tracking-wider">
                  Fee
                </p>

                <p className="text-sm font-medium text-gray-900">
                  ₹{appointment.consultation_fee ?? "—"}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-500 uppercase tracking-wider">
                  Status
                </p>

                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
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
              </div>

              {appointment.reason && (
                <div className="space-y-3 md:col-span-2">
                  <p className="text-sm text-gray-500 uppercase tracking-wider">
                    Reason for appointment
                  </p>

                  <p className="text-sm text-gray-900">
                    {appointment.reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}

          {(appointment.status === "booked" ||
            appointment.status === "confirmed") && (
            <div className="flex gap-3">
              <button
                onClick={() => setCompleteOpen(true)}
                className="flex-1 btn-primary py-3"
                disabled={saving}
              >
                <CheckCircle2 size={18} />
                Mark Completed
              </button>

              <button
                onClick={() => setCancelOpen(true)}
                className="flex-1 btn-danger py-3"
                disabled={saving}
              >
                <Ban size={18} />
                Cancel
              </button>
            </div>
          )}
        </div>

        <ConfirmationDialog
          open={completeOpen}
          onClose={() => setCompleteOpen(false)}
          onConfirm={handleComplete}
          title="Mark as completed"
          description="Mark this appointment as completed?"
          confirmLabel={saving ? "Processing..." : "Mark Completed"}
        />

        <ConfirmationDialog
          open={cancelOpen}
          onClose={() => setCancelOpen(false)}
          onConfirm={handleCancel}
          title="Cancel appointment"
          description="Cancel this appointment and release the time slot?"
          confirmLabel={saving ? "Processing..." : "Cancel"}
          cancelLabel="Keep appointment"
          danger
        />
      </div>

      <Footer />
    </div>
  );
}
