import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isDemoMode =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes("example.supabase.co") ||
  supabaseAnonKey === "demo-anon-key";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars are missing. Falling back to demo data so the app still runs locally.",
  );
}

export const supabase = createClient(supabaseUrl ?? "https://example.supabase.co", supabaseAnonKey ?? "demo-anon-key");

export type UserRole = "patient" | "doctor";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  created_at: string;
}

export interface Doctor {
  doctor_id: string;
  profile_id: string;
  doctor_name: string;
  specialization: string;
  qualification?: string;
  experience?: string;
  consultation_fee: number;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export const demoDoctors: Doctor[] = [
  {
    doctor_id: "doc-001",
    profile_id: "profile-doc-001",
    doctor_name: "Dr. Asha Mehta",
    specialization: "Cardiology",
    qualification: "MD, Cardiology",
    experience: "12",
    consultation_fee: 900,
    phone: "+91 98765 10001",
    is_active: true,
    created_at: "2024-01-01T00:00:00.000Z",
  },
  {
    doctor_id: "doc-002",
    profile_id: "profile-doc-002",
    doctor_name: "Dr. Rohan Kapoor",
    specialization: "Dermatology",
    qualification: "MBBS, MD Dermatology",
    experience: "8",
    consultation_fee: 700,
    phone: "+91 98765 10002",
    is_active: true,
    created_at: "2024-01-02T00:00:00.000Z",
  },
  {
    doctor_id: "doc-003",
    profile_id: "profile-doc-003",
    doctor_name: "Dr. Neha Sharma",
    specialization: "General Physician",
    qualification: "MD, Internal Medicine",
    experience: "10",
    consultation_fee: 650,
    phone: "+91 98765 10003",
    is_active: true,
    created_at: "2024-01-03T00:00:00.000Z",
  },
  {
    doctor_id: "doc-004",
    profile_id: "profile-doc-004",
    doctor_name: "Dr. Vikram Singh",
    specialization: "Pediatrics",
    qualification: "MBBS, DCH",
    experience: "9",
    consultation_fee: 750,
    phone: "+91 98765 10004",
    is_active: true,
    created_at: "2024-01-04T00:00:00.000Z",
  },
  {
    doctor_id: "doc-005",
    profile_id: "profile-doc-005",
    doctor_name: "Dr. Priya Nair",
    specialization: "Orthopedics",
    qualification: "MS Orthopedics",
    experience: "11",
    consultation_fee: 850,
    phone: "+91 98765 10005",
    is_active: true,
    created_at: "2024-01-05T00:00:00.000Z",
  },
  {
    doctor_id: "doc-006",
    profile_id: "profile-doc-006",
    doctor_name: "Dr. Meera Iyer",
    specialization: "Gynecology",
    qualification: "MBBS, DGO",
    experience: "13",
    consultation_fee: 800,
    phone: "+91 98765 10006",
    is_active: true,
    created_at: "2024-01-06T00:00:00.000Z",
  },
  {
    doctor_id: "doc-007",
    profile_id: "profile-doc-007",
    doctor_name: "Dr. Arjun Malhotra",
    specialization: "Cardiology",
    qualification: "DM Cardiology",
    experience: "15",
    consultation_fee: 950,
    phone: "+91 98765 10007",
    is_active: true,
    created_at: "2024-01-07T00:00:00.000Z",
  },
  {
    doctor_id: "doc-008",
    profile_id: "profile-doc-008",
    doctor_name: "Dr. Sanya Joshi",
    specialization: "General Physician",
    qualification: "MBBS, MD General Medicine",
    experience: "7",
    consultation_fee: 600,
    phone: "+91 98765 10008",
    is_active: true,
    created_at: "2024-01-08T00:00:00.000Z",
  },
];

export interface Patient {
  patient_id: string;
  profile_id: string;
  patient_name: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export interface DoctorSchedule {
  schedule_id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  created_at: string;
}

export const demoSchedules: DoctorSchedule[] = [
  { schedule_id: "sched-001", doctor_id: "doc-001", day_of_week: 1, start_time: "09:00", end_time: "13:00", slot_duration: 30, created_at: "2024-01-01T00:00:00.000Z" },
  { schedule_id: "sched-002", doctor_id: "doc-001", day_of_week: 3, start_time: "15:00", end_time: "18:00", slot_duration: 30, created_at: "2024-01-01T00:00:00.000Z" },
  { schedule_id: "sched-003", doctor_id: "doc-002", day_of_week: 2, start_time: "10:00", end_time: "14:00", slot_duration: 30, created_at: "2024-01-02T00:00:00.000Z" },
  { schedule_id: "sched-004", doctor_id: "doc-003", day_of_week: 1, start_time: "11:00", end_time: "16:00", slot_duration: 30, created_at: "2024-01-03T00:00:00.000Z" },
  { schedule_id: "sched-005", doctor_id: "doc-004", day_of_week: 4, start_time: "09:30", end_time: "13:30", slot_duration: 30, created_at: "2024-01-04T00:00:00.000Z" },
  { schedule_id: "sched-006", doctor_id: "doc-005", day_of_week: 5, start_time: "12:00", end_time: "17:00", slot_duration: 30, created_at: "2024-01-05T00:00:00.000Z" },
  { schedule_id: "sched-007", doctor_id: "doc-006", day_of_week: 2, start_time: "09:00", end_time: "12:00", slot_duration: 30, created_at: "2024-01-06T00:00:00.000Z" },
  { schedule_id: "sched-008", doctor_id: "doc-007", day_of_week: 6, start_time: "10:00", end_time: "15:00", slot_duration: 30, created_at: "2024-01-07T00:00:00.000Z" },
  { schedule_id: "sched-009", doctor_id: "doc-008", day_of_week: 3, start_time: "08:30", end_time: "12:30", slot_duration: 30, created_at: "2024-01-08T00:00:00.000Z" },
];

export async function fetchDoctors() {
  if (isDemoMode) {
    return { data: demoDoctors, error: null };
  }

  return supabase.from("doctors").select("*").eq("is_active", true).order("doctor_name");
}

export async function fetchDoctorById(id: string) {
  if (isDemoMode) {
    const doctor = demoDoctors.find((item) => item.doctor_id === id) ?? null;
    return {
      data: doctor,
      error: doctor ? null : { message: "Doctor not found" },
    };
  }

  return supabase.from("doctors").select("*").eq("doctor_id", id).single();
}

export async function fetchDoctorSchedules(id: string) {
  if (isDemoMode) {
    return {
      data: demoSchedules.filter((item) => item.doctor_id === id),
      error: null,
    };
  }

  return supabase.from("doctor_schedules").select("*").eq("doctor_id", id).order("day_of_week");
}

export interface Appointment {
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: "booked" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithDetails extends Appointment {
  doctor_name?: string;
  specialization?: string;
  consultation_fee?: number;
  patient_name?: string;
  patient_phone?: string;
}

export interface DoctorSummary {
  doctor_name: string;
  specialization: string;
  total_appointments: number;
  booked_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}
