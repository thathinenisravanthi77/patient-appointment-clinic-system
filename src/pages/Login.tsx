
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, Footer } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/services/api";
import { Mail, Lock } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { error: err } = await signIn(email.trim(), password);

      if (err) {
        setError(err);
        return;
      }

      const response = await apiRequest("/auth/me");

      if (response.user.role === "patient") {
        setSuccess("Logged in successfully.");
        navigate("/patient/dashboard", { replace: true });
      } else if (response.user.role === "doctor") {
        setSuccess("Logged in successfully.");
        navigate("/doctor/dashboard", { replace: true });
      } else {
        setError("Your account role does not have a dashboard.");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the backend."
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
              Welcome back
            </h2>

            <p className="text-gray-500">
              Sign in to your Patient Clinic account
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
              <label className="label">Email address</label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-3 text-gray-400"
                />

                <input
                  type="email"
                  className="input pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-teal-600 font-medium hover:text-teal-700"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
