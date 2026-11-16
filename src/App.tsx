import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import FindDoctors from "@/pages/FindDoctors";
import DoctorProfile from "@/pages/DoctorProfile";
import BookAppointment from "@/pages/BookAppointment";
import PatientDashboard from "@/pages/PatientDashboard";
import PatientAppointmentHistory from "@/pages/PatientAppointmentHistory";
import DoctorDashboard from "@/pages/DoctorDashboard";
import DoctorAppointments from "@/pages/DoctorAppointments";
import DoctorAppointmentDetails from "@/pages/DoctorAppointmentDetails";
import DoctorSchedule from "@/pages/DoctorSchedule";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";
import DoctorLogin from "@/pages/DoctorLogin";

function AppWithAuth() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoutesWithAuth />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  );
}

function RoutesWithAuth() {
  const { profile, loading, isPatient, isDoctor } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-[spin_1s_linear_infinite]" />
          <p className="text-sm text-gray-500">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/doctors" element={<FindDoctors />} />
      <Route path="/doctors/:id" element={<DoctorProfile />} />
      <Route path="/book/:id" element={
        profile && isPatient ? <BookAppointment /> : <Navigate to="/login" replace />
      } />
      <Route path="/patient/dashboard" element={
        profile && isPatient ? <PatientDashboard /> : <Navigate to="/login" replace />
      } />
      <Route path="/patient/appointments" element={
        profile && isPatient ? <PatientAppointmentHistory /> : <Navigate to="/login" replace />
      } />
      <Route path="/doctor/dashboard" element={
        profile && isDoctor ? <DoctorDashboard /> : <Navigate to="/login" replace />
      } />
      <Route path="/doctor/appointments" element={
        profile && isDoctor ? <DoctorAppointments /> : <Navigate to="/login" replace />
      } />
      <Route path="/doctor/appointments/:id" element={
        profile && isDoctor ? <DoctorAppointmentDetails /> : <Navigate to="/login" replace />
      } />
      <Route path="/doctor/schedule" element={
        profile && isDoctor ? <DoctorSchedule /> : <Navigate to="/login" replace />
      } />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/doctor/login" element={<DoctorLogin />} />
    </Routes>
  );
}

export default function App() {
  return <AppWithAuth />;
}
