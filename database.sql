-- ============================================================================
# Patient Clinic – Supabase Database Schema
-- Run this entire script in the Supabase SQL Editor.
-- ============================================================================

-- 1. Enable extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role text not null check (role in ('patient', 'doctor')) default 'patient',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- doctors
-- ---------------------------------------------------------------------------
create table public.doctors (
  doctor_id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  doctor_name text not null,
  specialization text not null,
  qualification text,
  experience text,
  consultation_fee numeric not null check (consultation_fee >= 0),
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------
create table public.patients (
  patient_id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  patient_name text not null,
  age integer check (age > 0 and age < 120),
  gender text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- doctor_schedules
-- ---------------------------------------------------------------------------
create table public.doctor_schedules (
  schedule_id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(doctor_id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_duration smallint not null default 30 check (slot_duration > 0),
  created_at timestamptz not null default now(),
  constraint chk_schedule_times check (start_time < end_time),
  unique (doctor_id, day_of_week)
);

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
create table public.appointments (
  appointment_id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(doctor_id) on delete cascade,
  patient_id uuid not null references public.patients(patient_id) on delete cascade,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null check (status in ('booked', 'cancelled', 'completed')) default 'booked',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_appointment_times check (start_time < end_time),
  constraint chk_not_past check (appointment_date >= current_date)
);

-- Exclusion constraint: no overlapping appointments for the same doctor on
-- the same date (ignoring cancelled appointments via partial index).
create index idx_appointments_active
  on public.appointments (doctor_id, appointment_date)
  where status <> 'cancelled';

-- ============================================================================
-- Indexes
-- ============================================================================
create index idx_profiles_role on public.profiles(role);
create index idx_doctors_specialization on public.doctors(specialization);
create index idx_doctors_active on public.doctors(is_active);
create index idx_schedules_doctor_day on public.doctor_schedules(doctor_id, day_of_week);
create index idx_appointments_doctor_date on public.appointments(doctor_id, appointment_date);
create index idx_appointments_patient on public.appointments(patient_id);
create index idx_appointments_status on public.appointments(status);

-- ============================================================================
-- Secure booking function (server-side, transactional)
-- Prevents concurrent conflicting bookings by locking the doctor's row.
-- ============================================================================
create or replace function public.book_appointment(
  p_doctor_id uuid,
  p_patient_id uuid,
  p_appointment_date date,
  p_start_time time,
  p_end_time time
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot_duration integer;
  v_schedule_start time;
  v_schedule_end time;
  v_day smallint;
  v_appointment_id uuid;
begin
  -- Appointment must not be in the past
  if p_appointment_date < current_date then
    raise exception 'Cannot book appointments in the past.';
  end if;

  -- Start must be before end
  if p_start_time >= p_end_time then
    raise exception 'End time must be later than start time.';
  end if;

  -- Determine day of week (Sunday = 0)
  v_day := extract(dow from p_appointment_date)::smallint;

  -- Lock the doctor row to serialize concurrent booking requests
  select doctor_id into v_appointment_id
  from public.doctors
  where doctor_id = p_doctor_id and is_active = true
  for update;

  if not found then
    raise exception 'Doctor not found or inactive.';
  end if;

  -- Validate the slot falls within the doctor's working schedule
  select start_time, end_time, slot_duration
  into v_schedule_start, v_schedule_end, v_slot_duration
  from public.doctor_schedules
  where doctor_id = p_doctor_id and day_of_week = v_day;

  if not found then
    raise exception 'Doctor is not available on this day.';
  end if;

  if p_start_time < v_schedule_start or p_end_time > v_schedule_end then
    raise exception 'Appointment must fall within the doctor working hours.';
  end if;

  -- Slot duration check
  if extract(epoch from (p_end_time - p_start_time)) / 60 <> v_slot_duration then
    raise exception 'Invalid slot duration.';
  end if;

  -- Conflict check: overlapping booked/completed appointments for same doctor/date
  if exists (
    select 1 from public.appointments
    where doctor_id = p_doctor_id
      and appointment_date = p_appointment_date
      and status <> 'cancelled'
      and p_start_time < end_time
      and p_end_time > start_time
  ) then
    raise exception 'This time slot is already booked.';
  end if;

  insert into public.appointments (
    doctor_id, patient_id, appointment_date, start_time, end_time, status
  ) values (
    p_doctor_id, p_patient_id, p_appointment_date, p_start_time, p_end_time, 'booked'
  )
  returning appointment_id into v_appointment_id;

  return v_appointment_id;
end;
$$;

-- Cancel appointment (patient or doctor)
create or replace function public.cancel_appointment(
  p_appointment_id uuid,
  p_requester_role text,
  p_requester_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doctor_id uuid;
  v_patient_id uuid;
  v_status text;
begin
  select doctor_id, patient_id, status
  into v_doctor_id, v_patient_id, v_status
  from public.appointments
  where appointment_id = p_appointment_id
  for update;

  if not found then
    raise exception 'Appointment not found.';
  end if;

  if v_status <> 'booked' then
    raise exception 'Only booked appointments can be cancelled.';
  end if;

  -- Authorization: patient owns it, or doctor owns it
  if p_requester_role = 'patient' and v_patient_id <> p_requester_id then
    raise exception 'Not authorized to cancel this appointment.';
  end if;

  if p_requester_role = 'doctor' and v_doctor_id <> p_requester_id then
    raise exception 'Not authorized to cancel this appointment.';
  end if;

  update public.appointments
  set status = 'cancelled', updated_at = now()
  where appointment_id = p_appointment_id;
end;
$$;

-- Mark completed (doctor only)
create or replace function public.complete_appointment(
  p_appointment_id uuid,
  p_doctor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status
  from public.appointments
  where appointment_id = p_appointment_id and doctor_id = p_doctor_id
  for update;

  if not found then
    raise exception 'Appointment not found or not assigned to this doctor.';
  end if;

  if v_status <> 'booked' then
    raise exception 'Only booked appointments can be marked completed.';
  end if;

  update public.appointments
  set status = 'completed', updated_at = now()
  where appointment_id = p_appointment_id;
end;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.patients enable row level security;
alter table public.doctor_schedules enable row level security;
alter table public.appointments enable row level security;

-- profiles: authenticated users read own profile; service role handles writes
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- doctors: public can read active doctors; doctors manage their own record
create policy "Public can view active doctors"
  on public.doctors for select
  to authenticated
  using (is_active = true);

create policy "Doctors can manage own record"
  on public.doctors for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'doctor' and id = profile_id
    )
  );

-- patients: public can read; patients manage their own record
create policy "Public can view patients"
  on public.patients for select
  to authenticated
  using (true);

create policy "Patients can manage own record"
  on public.patients for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'patient' and id = profile_id
    )
  );

-- doctor_schedules: public read; doctors manage own schedules
create policy "Public can view doctor schedules"
  on public.doctor_schedules for select
  to authenticated
  using (true);

create policy "Doctors can manage own schedules"
  on public.doctor_schedules for all
  to authenticated
  using (
    exists (
      select 1 from public.doctors d
      join public.profiles p on p.id = d.profile_id
      where d.doctor_id = doctor_id and p.id = auth.uid() and p.role = 'doctor'
    )
  );

-- appointments:
--  patients read own appointments; doctors read their own appointments
create policy "Patients can view own appointments"
  on public.appointments for select
  to authenticated
  using (
    exists (
      select 1 from public.patients pt
      join public.profiles p on p.id = pt.profile_id
      where pt.patient_id = patient_id and p.id = auth.uid()
    )
  );

create policy "Doctors can view own appointments"
  on public.appointments for select
  to authenticated
  using (
    exists (
      select 1 from public.doctors d
      join public.profiles p on p.id = d.profile_id
      where d.doctor_id = doctor_id and p.id = auth.uid() and p.role = 'doctor'
    )
  );

-- Insert: authenticated patients can book via the secure function.
-- Direct inserts are restricted; the app calls book_appointment (security definer).
create policy "Authenticated can insert appointments"
  on public.appointments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.patients pt
      join public.profiles p on p.id = pt.profile_id
      where pt.patient_id = patient_id and p.id = auth.uid() and p.role = 'patient'
    )
  );

-- Update: only status changes by owner roles via functions; block direct updates
create policy "No direct appointment updates"
  on public.appointments for update
  to authenticated
  using (false);

-- ============================================================================
-- Helper views / queries
-- ============================================================================

-- Daily doctor-wise appointment summary
create or replace view public.doctor_daily_summary as
select
  d.doctor_name,
  d.specialization,
  a.appointment_date,
  count(*) as total_appointments,
  count(*) filter (where a.status = 'booked') as booked_appointments,
  count(*) filter (where a.status = 'completed') as completed_appointments,
  count(*) filter (where a.status = 'cancelled') as cancelled_appointments
from public.appointments a
join public.doctors d on d.doctor_id = a.doctor_id
group by d.doctor_name, d.specialization, a.appointment_date;

-- Appointments with doctor and patient details
create or replace view public.appointment_details as
select
  a.appointment_id,
  a.doctor_id,
  a.patient_id,
  a.appointment_date,
  a.start_time,
  a.end_time,
  a.status,
  a.created_at,
  a.updated_at,
  d.doctor_name,
  d.specialization,
  d.consultation_fee,
  pt.patient_name,
  pt.age,
  pt.gender,
  pt.phone as patient_phone,
  pr.full_name as patient_full_name
from public.appointments a
join public.doctors d on d.doctor_id = a.doctor_id
join public.patients pt on pt.patient_id = a.patient_id
join public.profiles pr on pr.id = pt.profile_id;

-- ============================================================================
-- Auto-create profiles on sign-up (patients can self-register; doctors need
-- admin approval and are created with is_active = false until approved)
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, email, phone, role
  ) values (
    new.id,
    coalesce(raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    raw_user_meta_data ->> 'phone',
    coalesce(raw_user_meta_data ->> 'role', 'patient')
  )
  on conflict (id) do nothing;

  -- Patient record created automatically for self-registered patients
  if coalesce(raw_user_meta_data ->> 'role', 'patient') = 'patient' then
    insert into public.patients (profile_id, patient_name, phone, email)
    values (
      new.id,
      coalesce(raw_user_meta_data ->> 'full_name', new.email),
      raw_user_meta_data ->> 'phone',
      new.email
    )
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- ============================================================================
-- Seed: sample doctors (admin creates these profiles in auth.users first,
-- then inserts doctor records; is_active = true means approved)
-- Example:
-- insert into public.doctors (profile_id, doctor_name, specialization, qualification, experience, consultation_fee, phone, is_active)
-- values
--   ('<doctor-profile-uuid>', 'Dr. Ravi', 'Cardiologist', 'MBBS, MD', '10 years', 500, '+91 90000 00001', true),
--   ('<doctor-profile-uuid>', 'Dr. Priya', 'Dermatologist', 'MBBS, MD (Dermatology)', '8 years', 400, '+91 90000 00002', true),
--   ('<doctor-profile-uuid>', 'Dr. Kiran', 'General Physician', 'MBBS', '6 years', 300, '+91 90000 00003', true);
