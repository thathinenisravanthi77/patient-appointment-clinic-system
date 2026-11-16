
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center">
        <div className="container-page text-center py-12">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
            <AlertCircle size={32} />
          </div>

          <h1 className="text-6xl font-bold text-gray-900">404</h1>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Page not found
          </h2>

          <p className="text-gray-500 mb-8">
            The page you are looking for does not exist.
          </p>

          <Link to="/" className="btn-primary">
            Go back home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
