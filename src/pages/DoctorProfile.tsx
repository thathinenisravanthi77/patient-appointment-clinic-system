
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "@/services/api";
import {
  Navbar,
  Footer,
  LoadingIndicator,
  ErrorMessage,
} from "@/components";
import { Calendar, Medal, Phone, MapPin } from "lucide-react";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface Doctor {
  doctor_id: number;
  doctor_name: string;
  specialization: string;
  qualification: string | null;
  experience: string | number | null;
  phone: string | null;
  consultation_fee: number;
}

interface DoctorSchedule {
  schedule_id: number;
  doctor_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_duration: number;
}

export default function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // LOAD DOCTOR DETAILS AND SCHEDULES FROM MYSQL
  useEffect(() => {
    const loadDoctor = async () => {
      if (!id) {
        setError("Doctor ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [doctorResult, scheduleResult] = await Promise.all([
          apiRequest(`/doctors/${id}`),
          apiRequest(`/doctors/${id}/schedules`),
        ]);

        setDoctor(doctorResult.doctor || null);
        setSchedules(scheduleResult.schedules || []);

        if (!doctorResult.doctor) {
          setError("Doctor not found");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load doctor details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [id]);

  const handleBook = () => {
    if (doctor) {
      navigate(`/book/${doctor.doctor_id}`);
    }
  };

  const formatTime = (time: string) => time.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container-page py-12">
          <div className="max-w-md mx-auto">
            <LoadingIndicator />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container-page py-12">
          <ErrorMessage
            message={error || "Doctor not found"}
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
        <article className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <div className="h-48 bg-gray-100 relative">
              <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-gray-900">
                {doctor.doctor_name.charAt(0)}
              </div>
            </div>

            <div className="p-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {doctor.doctor_name}
                    </h1>

                    <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">
                      Active
                    </span>
                  </div>

                  <p className="text-lg text-teal-700 font-semibold">
                    {doctor.specialization}
                  </p>

                  {doctor.qualification && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                      <Medal size={16} className="mr-1.5" />
                      {doctor.qualification}
                    </p>
                  )}

                  {doctor.experience && (
                    <p className="text-sm text-gray-500">
                      {doctor.experience} experience
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <span className="text-2xl font-bold text-teal-700">
                    ₹{doctor.consultation_fee}
                  </span>

                  <span className="text-sm text-gray-500">
                    per consultation
                  </span>

                  <button
                    onClick={handleBook}
                    className="btn-primary px-6 py-3"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>

              {/* CONTACT AND LOCATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Phone size={16} className="text-teal-600" />
                    Contact
                  </h3>

                  <p className="text-sm text-gray-600">
                    {doctor.phone ?? "Not available"}
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin size={16} className="text-teal-600" />
                    Location
                  </h3>

                  <p className="text-sm text-gray-600">
                    Patient Clinic, Mumbai
                  </p>
                </div>
              </div>

              {/* WEEKLY SCHEDULE */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-teal-600" />
                  Weekly Schedule
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {DAYS.map((day) => {
                    const schedule = schedules.find(
                      (s) =>
                        s.day_of_week.toLowerCase() === day.toLowerCase()
                    );

                    return (
                      <div
                        key={day}
                        className="flex flex-col items-center gap-2 p-2 rounded-lg bg-gray-50"
                      >
                        <span className="text-xs font-medium text-gray-500">
                          {day.slice(0, 3)}
                        </span>

                        {schedule ? (
                          <div className="text-xs text-gray-900 text-center leading-tight">
                            {formatTime(schedule.start_time)}
                            {" - "}
                            {formatTime(schedule.end_time)}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">
                            Closed
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NEXT STEPS */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Next steps
                </h3>

                <p className="text-sm text-gray-500 mb-4">
                  Select a date from the doctor's working days above to see
                  available time slots and book your appointment.
                </p>

                <Link
                  to={`/book/${doctor.doctor_id}`}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Book Appointment <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>

      <Footer />
    </div>
  );
}
