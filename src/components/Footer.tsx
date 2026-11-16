import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-auto">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">
                P
              </div>
              <span className="font-bold text-lg tracking-tight text-teal-700">Patient Clinic</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">
              Your health is our priority. Book appointments with trusted doctors and manage your care online.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">For Patients</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/doctors" className="hover:text-teal-600 transition-colors">Find a Doctor</Link></li>
              <li><Link to="/patient/dashboard" className="hover:text-teal-600 transition-colors">My Appointments</Link></li>
              <li><Link to="/contact" className="hover:text-teal-600 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">For Doctors</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/doctor/dashboard" className="hover:text-teal-600 transition-colors">Doctor Dashboard</Link></li>
              <li><Link to="/doctor/schedule" className="hover:text-teal-600 transition-colors">Manage Schedule</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2"><Phone size={16} /><span>+91 98765 43210</span></li>
              <li className="flex items-center gap-2"><Mail size={16} /><span>support@patientclinic.in</span></li>
              <li className="flex items-center gap-2"><MapPin size={16} /><span>123 Medical Street, Mumbai, India</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 text-sm text-gray-500">
          <p className="text-center">© {new Date().getFullYear()} Patient Clinic. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
