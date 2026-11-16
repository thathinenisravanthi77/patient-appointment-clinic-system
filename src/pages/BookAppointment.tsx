
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Navbar,
  Footer,
  LoadingIndicator,
  ErrorMessage,
  ConfirmationDialog,
  TimeSlotSelector,
  DatePicker,
} from "@/components";
import { apiRequest } from "@/services/api";
import { Calendar, CheckCircle2, ArrowLeft } from "lucide-react";

interface Doctor {
  doctor_id: number;
  doctor_name: string;
  specialization: string;
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

interface BookedSlot {
  start_time: string;
  end_time: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function getLocalDate(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekday(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
  });
}

export default function BookAppointment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [step, setStep] = useState<"select" | "success">("select");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const today = getLocalDate();

  // LOAD DOCTOR DETAILS AND SCHEDULES FROM MYSQL
  useEffect(() => {
    const loadDoctor = async () => {
      if (!id) {
        setError("Invalid doctor.");
        setLoading(false);
        return;
      }

      try {
        const [doctorResponse, scheduleResponse] = await Promise.all([
          apiRequest(`/doctors/${id}`),
          apiRequest(`/doctors/${id}/schedules`),
        ]);

        setDoctor(doctorResponse.doctor);
        setSchedules(scheduleResponse.schedules || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load doctor details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [id]);

  // GENERATE AVAILABLE SLOTS USING MYSQL DATA
  const generateAvailableSlots = async (selectedDate: string) => {
    if (!doctor) return;

    setSelectedSlot(null);
    setSlots([]);
    setError("");

    const selectedDay = getWeekday(selectedDate);

    const schedule = schedules.find(
      (item) => item.day_of_week === selectedDay
    );

    if (!schedule) {
      return;
    }

    try {
      const response = await apiRequest(
        `/appointments/doctor/${doctor.doctor_id}/booked-slots?date=${selectedDate}`
      );

      const bookedSlots: BookedSlot[] = response.slots || [];

      const booked = bookedSlots.map((slot) => ({
        start: timeToMinutes(slot.start_time),
        end: timeToMinutes(slot.end_time),
      }));

      const result: TimeSlot[] = [];

      let current = timeToMinutes(schedule.start_time);
      const end = timeToMinutes(schedule.end_time);

      while (current + schedule.slot_duration <= end) {
        const slotEnd = current + schedule.slot_duration;

        const isBooked = booked.some(
          (slot) => current < slot.end && slotEnd > slot.start
        );

        result.push({
          start_time: minutesToTime(current),
          end_time: minutesToTime(slotEnd),
          available: !isBooked,
        });

        current = slotEnd;
      }

      setSlots(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch available slots."
      );
    }
  };

  // WHEN PATIENT SELECTS A DATE
  const handleDateChange = (value: string) => {
    setDate(value);
    generateAvailableSlots(value);
  };

  // BOOK APPOINTMENT USING MYSQL API
  const handleBook = async () => {
    console.log("Confirm Booking button clicked");
    if (!doctor || !selectedSlot || !date) return;

    setSubmitting(true);
    setError("");

    try {
      await apiRequest("/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorId: doctor.doctor_id,
          appointmentDate: date,
          startTime: selectedSlot,
        }),
      });

      setConfirmOpen(false);
      setStep("success");
    } catch (err) {
      setConfirmOpen(false);

      const message =
        err instanceof Error
          ? err.message
          : "Booking failed. Please try again.";

      setError(message);

      // Refresh slots in case another patient booked the selected slot.
      await generateAvailableSlots(date);
    } finally {
      setSubmitting(false);
    }
  };

  const scheduleToday = date
    ? schedules.find((schedule) => schedule.day_of_week === getWeekday(date))
    : undefined;

  const selectedEndTime = slots.find(
    (slot) => slot.start_time === selectedSlot
  )?.end_time;

  if (loading || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container-page py-12">
          {error ? (
            <ErrorMessage
              message={error}
              onRetry={() => window.location.reload()}
            />
          ) : (
            <LoadingIndicator />
          )}
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !date) {
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

      <div className="container-page py-6">
        <Link
          to={`/doctors/${doctor.doctor_id}`}
          className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 mb-6"
        >
          <ArrowLeft size={16} />
          Back to {doctor.doctor_name}
        </Link>

        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-medium">
                  {doctor.doctor_name.charAt(0)}
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    {doctor.doctor_name}
                  </h2>

                  <p className="text-sm text-gray-500">
                    {doctor.specialization} · ₹
                    {doctor.consultation_fee} per consult
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {step === "select" && (
                <>
                  <h3 className="font-semibold text-gray-900 mb-6">
                    Select appointment date
                  </h3>

                  <DatePicker
                    value={date}
                    onChange={handleDateChange}
                    min={today}
                    label="Appointment date"
                  />

                  {date && (
                    <div className="mt-8">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar size={16} className="text-teal-600" />
                        Choose a time slot
                      </h3>

                      {!scheduleToday && (
                        <p className="text-gray-500">
                          The doctor is not available on this day.
                        </p>
                      )}

                      {scheduleToday && slots.length === 0 && !error && (
                        <p className="text-gray-500">
                          No available slots for this date.
                        </p>
                      )}

                      {error && (
                        <p className="text-red-600 text-sm mb-4">
                          {error}
                        </p>
                      )}

                      <TimeSlotSelector
                        slots={slots}
                        selected={selectedSlot}
                        onSelect={setSelectedSlot}
                      />

                      {selectedSlot && (
                        <div className="mt-6 flex items-center gap-3">
                          <button
                            onClick={() => setConfirmOpen(true)}
                            className="btn-primary px-6 py-2.5 text-sm"
                            disabled={submitting}
                          >
                            Confirm booking
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {step === "success" && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4 text-teal-600">
                    <CheckCircle2 size={32} />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Appointment booked!
                  </h2>

                  <p className="text-gray-500 mb-6">
                    Your appointment with {doctor.doctor_name} has been
                    booked successfully.
                  </p>

                  <div className="card p-6 mb-6 inline-block">
                    <p className="text-sm text-gray-500 mb-1">Doctor</p>
                    <p className="font-semibold text-gray-900">
                      {doctor.doctor_name}
                    </p>

                    <p className="text-sm text-gray-500 mb-1 mt-4">
                      Date
                    </p>

                    <p className="font-semibold text-gray-900">
                      {new Date(`${date}T00:00:00`).toLocaleDateString(
                        "en-IN"
                      )}
                    </p>

                    <p className="text-sm text-gray-500 mb-1 mt-4">
                      Time
                    </p>

                    <p className="font-semibold text-gray-900">
                      {selectedSlot} - {selectedEndTime}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate("/patient/dashboard")}
                    className="btn-primary"
                  >
                    Go to My Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <ConfirmationDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleBook}
          title="Confirm appointment"
          description={`Book an appointment with ${doctor.doctor_name} (${doctor.specialization}) on ${new Date(
            `${date}T00:00:00`
          ).toLocaleDateString("en-IN")} at ${selectedSlot}. Consultation fee: ₹${
            doctor.consultation_fee
          }.`}
          confirmLabel="Confirm Booking"
        />
      </div>

      <Footer />
    </div>
  );
}
