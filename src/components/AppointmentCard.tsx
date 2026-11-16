import { Stethoscope } from "lucide-react";

interface AppointmentCardProps {
  appointment: {
    appointment_id: string;
    doctor_name?: string;
    specialization?: string;
    patient_name?: string;
    patient_phone?: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: "booked" | "confirmed" | "cancelled" | "completed";
  };
  onCancel?: () => void;
  showPatient?: boolean;
}

export function AppointmentCard({ appointment, onCancel, showPatient = false }: AppointmentCardProps) {
  const statusColors: Record<string, string> = {
    booked: "bg-teal-50 text-teal-700 border-teal-100",
    confirmed: "bg-blue-50 text-blue-700 border-blue-100",
    completed: "bg-green-50 text-green-700 border-green-100",
    cancelled: "bg-red-50 text-red-700 border-red-100",
  };

  const date = new Date(appointment.appointment_date);
  const formattedDate = date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="card p-5 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
            <Stethoscope size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{showPatient ? appointment.patient_name : appointment.doctor_name}</h3>
            <p className="text-sm text-gray-500">
              {showPatient ? appointment.patient_phone : appointment.specialization}
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-900">{formattedDate}</p>
            <p className="text-sm text-gray-500">
              {appointment.start_time} - {appointment.end_time}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[appointment.status]}`}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
          {(appointment.status === "booked" ||
            appointment.status === "confirmed") &&
            onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-red-100 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
