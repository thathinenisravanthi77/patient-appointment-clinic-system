
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, Footer } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, Phone, User } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validate = (): string | null => {
    if (!form.full_name.trim()) {
      return "Full name is required.";
    }

    if (!form.email.trim()) {
      return "Email is required.";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return "Please enter a valid email.";
    }

    const phoneDigits = form.phone.replace(/\D/g, "");

    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return "Please enter a valid phone number.";
    }

    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (form.password !== form.confirm_password) {
      return "Passwords do not match.";
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const { error: err } = await signUp({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: "patient",
      });

      if (err) {
        setError(err);
        return;
      }

      setSuccess("Account created successfully. You can now log in.");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container-page py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
              P
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Create an account
            </h2>

            <p className="text-gray-500">
              Join Patient Clinic as a patient
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-100 text-sm text-teal-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3.5 top-3 text-gray-400"
                />

                <input
                  type="text"
                  className="input pl-10"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-3 text-gray-400"
                />

                <input
                  type="email"
                  className="input pl-10"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Phone number</label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3.5 top-3 text-gray-400"
                />

                <input
                  type="tel"
                  className="input pl-10"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-3 text-gray-400"
                />

                <input
                  type="password"
                  className="input pl-10"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Confirm password</label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-3 text-gray-400"
                />

                <input
                  type="password"
                  className="input pl-10"
                  value={form.confirm_password}
                  onChange={(e) =>
                    setForm({ ...form, confirm_password: e.target.value })
                  }
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Patient registration only. Doctor accounts are created and
              approved by the clinic administrator.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-teal-600 font-medium hover:text-teal-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
