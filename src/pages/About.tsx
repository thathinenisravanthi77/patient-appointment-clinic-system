import { Navbar, Footer } from "@/components";
import { Stethoscope, Users } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container-page py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">About Patient Clinic</h1>
          <p className="text-gray-600 leading-relaxed mb-6">
            Patient Clinic is a modern appointment and scheduling management system connecting patients with trusted
            doctors. Our platform makes it simple to find specialists, view real-time availability, and book
            appointments online — anytime, anywhere.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="card p-8">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 mb-4">
                <Stethoscope size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Verified Doctors</h3>
              <p className="text-gray-500 text-sm">All doctors on our platform are verified professionals with valid qualifications.</p>
            </div>
            <div className="card p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Users size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Booking</h3>
              <p className="text-gray-500 text-sm">Your data is protected through secure authentication and role-based access control.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
