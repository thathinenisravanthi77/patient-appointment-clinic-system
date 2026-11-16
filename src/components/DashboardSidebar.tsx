import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Calendar, Stethoscope, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export function DashboardSidebar() {
  const { profile, signOut, isDoctor } = useAuth();
  const navigate = useNavigate();

  const items: SidebarItem[] = isDoctor
    ? [
        { label: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
        { label: "Appointments", href: "/doctor/appointments", icon: Calendar },
        { label: "Schedule", href: "/doctor/schedule", icon: Stethoscope },
      ]
    : [
        { label: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
        { label: "Appointments", href: "/patient/appointments", icon: Calendar },
        { label: "Profile", href: "/patient/profile", icon: User },
      ];

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside className="hidden lg:flex lg:w-72 flex-col border-r border-gray-100 bg-white h-screen sticky top-0">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
            P
          </div>
          <span className="font-bold text-lg tracking-tight text-teal-700">Patient Clinic</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-teal-600 transition-colors"
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-xs font-medium text-gray-900">{profile?.full_name}</p>
          <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 w-full px-4 py-2 rounded-xl border border-red-100 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
