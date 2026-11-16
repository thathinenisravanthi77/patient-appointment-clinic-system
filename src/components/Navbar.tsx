import { Link, useNavigate } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export function Navbar() {
  const { profile, signOut, isDoctor } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/doctors", label: "Find Doctors" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="container-page flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
            P
          </div>
          <span className="font-bold text-xl tracking-tight text-teal-700">Patient Clinic</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-gray-600 hover:text-teal-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {profile ? (
            <div className="hidden md:flex items-center gap-3 text-sm font-medium">
              {isDoctor ? (
                <Link to="/doctor/dashboard" className="text-gray-600 hover:text-teal-600 transition-colors">
                  Doctor Dashboard
                </Link>
              ) : (
                <Link to="/patient/dashboard" className="text-gray-600 hover:text-teal-600 transition-colors">
                  My Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3 text-sm font-medium">
              <Link to="/login" className="text-gray-600 hover:text-teal-600 transition-colors">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </div>
          )}

          <button
            className="md:hidden text-gray-600"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="container-page py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-teal-600"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-100">
              {profile ? (
                <>
                  <Link
                    to={isDoctor ? "/doctor/dashboard" : "/patient/dashboard"}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-teal-600"
                  >
                    {isDoctor ? "Doctor Dashboard" : "My Dashboard"}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-teal-600"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-lg btn-primary text-center"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
