
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "@/services/api";
import type { Doctor } from "@/lib/supabase";
import { Stethoscope, Calendar, ArrowRight, Users } from "lucide-react";
import { DoctorCard } from "@/components/DoctorCard";
import { Footer } from "@/components/Footer";

const specializations = [
  { name: "Cardiology", count: 12, icon: <Stethoscope size={24} className="text-teal-600" /> },
  { name: "Dermatology", count: 8, icon: <Users size={24} className="text-blue-600" /> },
  { name: "General Physician", count: 15, icon: <Calendar size={24} className="text-teal-600" /> },
  { name: "Pediatrics", count: 6, icon: <Users size={24} className="text-blue-600" /> },
  { name: "Orthopedics", count: 7, icon: <Stethoscope size={24} className="text-teal-600" /> },
  { name: "Gynecology", count: 5, icon: <Users size={24} className="text-blue-600" /> },
];

export default function Home() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);

        const response = await apiRequest("/doctors");

        setDoctors(response.doctors ?? []);
      } catch (error) {
        console.error("Failed to load doctors:", error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-teal-900 text-white pt-20 pb-16 px-4">
        <div className="container-page">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-100 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-teal-400" /> Open 24x7 · Online Booking
            </span>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Your Health, <span className="text-teal-400">Our Priority</span>
            </h1>

            <p className="text-teal-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
              Book appointments with verified doctors, choose your preferred time slot, and manage all your visits
              from one dashboard. Simple, secure, and built for you and your family.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/doctors" className="btn-primary px-8 py-3 text-lg flex items-center justify-center gap-2">
                Find a Doctor <ArrowRight size={18} />
              </Link>

              <Link to="/register" className="px-8 py-3 text-lg bg-white text-teal-900 rounded-xl font-medium hover:bg-teal-50 transition-colors">
                Book an Appointment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Specializations */}
      <section className="section bg-gray-50">
        <div className="container-page">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">Specializations</h2>
            <p className="text-gray-500">Find the right specialist for your care</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {specializations.map((spec) => (
              <div
                key={spec.name}
                className="card p-6 text-center hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  {spec.icon}
                </div>

                <h3 className="font-semibold text-gray-900">{spec.name}</h3>
                <p className="text-sm text-gray-500">{spec.count} doctors available</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Doctors */}
      <section className="section">
        <div className="container-page">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Featured Doctors</h2>
              <p className="text-gray-500 text-sm">Trusted specialists near you</p>
            </div>

            <Link to="/doctors" className="text-sm font-medium text-teal-600 hover:text-teal-700">
              View all doctors
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 flex justify-center py-10">
                <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-[spin_1s_linear_infinite]" />
              </div>
            ) : doctors.length === 0 ? (
              <div className="col-span-3 text-center py-10 text-gray-500">
                No doctors available at the moment.
              </div>
            ) : (
              doctors.slice(0, 6).map((doctor) => (
                <DoctorCard key={doctor.doctor_id} doctor={doctor} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-gray-50">
        <div className="container-page">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">How It Works</h2>
            <p className="text-gray-500">Book your appointment in four simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Find a Doctor", desc: "Search doctors by name or specialization and view their profiles." },
              { step: "2", title: "Choose an Available Slot", desc: "Pick a date and an open time slot from the doctor's schedule." },
              { step: "3", title: "Book Your Appointment", desc: "Confirm your booking and receive instant confirmation." },
              { step: "4", title: "Visit the Clinic", desc: "Visit the clinic on time for your consultation." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center mx-auto mb-4 font-bold">
                  {item.step}
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white border-t border-gray-100 px-4 pb-12">
        <div className="container-page max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Need help?</h2>
          <p className="text-gray-500 mb-6">
            Contact us for any queries about appointments or your account.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
            <div className="flex items-center gap-2">
              <MailIcon className="text-teal-600" />
              <span className="text-gray-700">+91 98765 43210</span>
            </div>

            <span className="text-gray-300">|</span>

            <div className="flex items-center gap-2">
              <MailIcon className="text-teal-600" />
              <a href="mailto:support@patientclinic.in" className="text-teal-600 hover:underline">
                support@patientclinic.in
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
