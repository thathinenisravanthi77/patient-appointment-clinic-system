
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "@/services/api";
import {
  Navbar,
  Footer,
  LoadingIndicator,
  ErrorMessage,
  ConfirmationDialog,
} from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Save } from "lucide-react";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface DoctorSchedule {
  schedule_id: number;
  doctor_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_available?: boolean;
}

export default function DoctorSchedule() {
  const { profile } = useAuth();

  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    day_of_week: "Monday",
    start_time: "09:00",
    end_time: "17:00",
    slot_duration: 30,
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // LOAD THE LOGGED-IN DOCTOR'S SCHEDULES
  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest("/doctors/my-schedules");

      setSchedules(result.schedules || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load schedules"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }

    loadSchedules();
  }, [profile]);

  // OPEN ADD OR EDIT FORM
  const openForm = (schedule?: DoctorSchedule) => {
    if (schedule) {
      setEditMode(true);
      setEditingId(schedule.schedule_id);

      setForm({
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time.slice(0, 5),
        end_time: schedule.end_time.slice(0, 5),
        slot_duration: schedule.slot_duration,
      });
    } else {
      setEditMode(false);
      setEditingId(null);

      setForm({
        day_of_week: "Monday",
        start_time: "09:00",
        end_time: "17:00",
        slot_duration: 30,
      });
    }

    setError("");
    setFormOpen(true);
  };

  // ADD OR UPDATE SCHEDULE
  const handleSave = async () => {
    if (form.start_time >= form.end_time) {
      setError("End time must be later than start time.");
      return;
    }

    const payload = {
      dayOfWeek: form.day_of_week,
      startTime: form.start_time,
      endTime: form.end_time,
      slotDuration: form.slot_duration,
    };

    try {
      setSaving(true);
      setError("");

      if (editMode && editingId !== null) {
        await apiRequest(`/doctors/schedules/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/doctors/schedules", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setFormOpen(false);
      setEditingId(null);

      await loadSchedules();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save schedule"
      );
    } finally {
      setSaving(false);
    }
  };

  // DELETE SCHEDULE
  const handleDelete = async () => {
    if (deleteId === null) return;

    try {
      setDeleting(true);
      setError("");

      await apiRequest(`/doctors/schedules/${deleteId}`, {
        method: "DELETE",
      });

      setSchedules((previous) =>
        previous.filter((schedule) => schedule.schedule_id !== deleteId)
      );

      setDeleteOpen(false);
      setDeleteId(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete schedule"
      );
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
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
        <div className="container-page py-12 text-center">
          <p className="text-gray-500">
            Please log in to manage your schedule.
          </p>
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
              Manage Schedule
            </h1>
            <p className="text-gray-500">
              Set your working days and consultation hours
            </p>
          </div>

          <button
            onClick={() => openForm()}
            className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
          >
            <Plus size={18} />
            Add Schedule
          </button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage
              message={error}
              onRetry={() => {
                setError("");
                loadSchedules();
              }}
            />
          </div>
        )}

        {/* SCHEDULE CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {schedules.length === 0 ? (
            <div className="col-span-full card p-12 text-center text-gray-500">
              No schedules configured. Add your first working schedule.
            </div>
          ) : (
            [...schedules]
              .sort(
                (a, b) =>
                  DAYS.indexOf(a.day_of_week) -
                  DAYS.indexOf(b.day_of_week)
              )
              .map((schedule) => (
                <article
                  key={schedule.schedule_id}
                  className="card p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {schedule.day_of_week}
                    </h3>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openForm(schedule)}
                        className="p-1.5 text-gray-400 hover:text-teal-600"
                        title="Edit"
                      >
                        <Save size={18} />
                      </button>

                      <button
                        onClick={() => {
                          setDeleteId(schedule.schedule_id);
                          setDeleteOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Start time</span>
                      <span className="font-medium">
                        {formatTime(schedule.start_time)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">End time</span>
                      <span className="font-medium">
                        {formatTime(schedule.end_time)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Slot duration</span>
                      <span className="font-medium">
                        {schedule.slot_duration} minutes
                      </span>
                    </div>
                  </div>
                </article>
              ))
          )}
        </div>

        <div className="mt-8">
          <Link
            to="/doctor/dashboard"
            className="text-sm text-teal-600 hover:text-teal-700"
          >
            Back to dashboard
          </Link>
        </div>

        {/* ADD / EDIT SCHEDULE DIALOG */}
        <ConfirmationDialog
          open={formOpen}
          onClose={() => {
            if (!saving) {
              setFormOpen(false);
              setError("");
            }
          }}
          onConfirm={handleSave}
          title={editMode ? "Edit schedule" : "Add schedule"}
          description="Configure working day, hours, and appointment slot duration."
          confirmLabel={
            saving
              ? "Saving..."
              : editMode
              ? "Save changes"
              : "Add schedule"
          }
        >
          <div className="space-y-4">
            <div>
              <label className="label">Working day</label>

              <select
                className="input"
                value={form.day_of_week}
                onChange={(e) =>
                  setForm({
                    ...form,
                    day_of_week: e.target.value,
                  })
                }
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start time</label>

                <input
                  type="time"
                  className="input"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      start_time: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="label">End time</label>

                <input
                  type="time"
                  className="input"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      end_time: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">
                Slot duration (minutes)
              </label>

              <select
                className="input"
                value={form.slot_duration}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slot_duration: Number(e.target.value),
                  })
                }
              >
                {[15, 20, 30, 45, 60].map((duration) => (
                  <option key={duration} value={duration}>
                    {duration}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </ConfirmationDialog>

        {/* DELETE CONFIRMATION */}
        <ConfirmationDialog
          open={deleteOpen}
          onClose={() => {
            if (!deleting) {
              setDeleteOpen(false);
              setDeleteId(null);
            }
          }}
          onConfirm={handleDelete}
          title="Remove schedule"
          description="This will remove this working day schedule."
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          cancelLabel="Keep"
          danger
        />
      </div>

      <Footer />
    </div>
  );
}
