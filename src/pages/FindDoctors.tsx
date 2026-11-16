
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { apiRequest } from "@/services/api";
import type { Doctor } from "@/lib/supabase";
import {
  Navbar,
  Footer,
  DoctorCard,
  LoadingIndicator,
  ErrorMessage,
} from "@/components";
import { Search, Filter } from "lucide-react";

export default function FindDoctors() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [specFilter, setSpecFilter] = useState(
    searchParams.get("spec") ?? ""
  );

  // LOAD DOCTORS FROM MYSQL API
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiRequest("/doctors");

        const doctorList: Doctor[] = response.doctors ?? [];

        setDoctors(doctorList);

        const specs = [
          ...new Set(
            doctorList.map((doctor) => doctor.specialization)
          ),
        ].sort();

        setSpecializations(specs);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load doctors"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  // SEARCH AND FILTER DOCTORS
  const filtered = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchQuery = doctor.doctor_name
        .toLowerCase()
        .includes(query.trim().toLowerCase());

      const matchSpec = specFilter
        ? doctor.specialization === specFilter
        : true;

      return matchQuery && matchSpec;
    });
  }, [doctors, query, specFilter]);

  // HANDLE SEARCH INPUT
  const handleQueryChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    setQuery(value);

    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }

    setSearchParams(params);
  };

  // HANDLE SPECIALIZATION FILTER
  const handleSpecChange = (value: string) => {
    setSpecFilter(value);

    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set("spec", value);
    } else {
      params.delete("spec");
    }

    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container-page">
        <div className="max-w-5xl mx-auto">

          {/* PAGE HEADING */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Find a Doctor
              </h1>

              <p className="text-gray-500">
                Book an appointment with a specialist
              </p>
            </div>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <ErrorMessage message={error} />
          )}

          {/* SEARCH AND FILTER */}
          <div className="card p-6 mb-8 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">

              {/* SEARCH BY DOCTOR NAME */}
              <div className="flex-1 relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  className="input pl-10"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Search doctors by name..."
                />
              </div>

              {/* FILTER BY SPECIALIZATION */}
              <div className="relative">
                <Filter
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <select
                  className="input pl-10"
                  value={specFilter}
                  onChange={(e) =>
                    handleSpecChange(e.target.value)
                  }
                >
                  <option value="">All specializations</option>

                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              {/* DOCTOR COUNT */}
              <span className="text-sm text-gray-500 self-center sm:self-auto">
                {filtered.length} doctor
                {filtered.length !== 1 ? "s" : ""} found
              </span>
            </div>
          </div>

          {/* DOCTOR LIST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {loading ? (
              <div className="col-span-3 flex justify-center py-16">
                <LoadingIndicator />
              </div>
            ) : error ? (
              <div className="col-span-3 text-center py-8">
                <p className="text-gray-500">
                  Unable to display doctors.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-3 text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <Search size={32} />
                </div>

                <h3 className="font-semibold text-gray-900">
                  No doctors found
                </h3>

                <p className="text-gray-500">
                  Try adjusting your search or filter.
                </p>
              </div>
            ) : (
              filtered.map((doctor) => (
                <DoctorCard
                  key={doctor.doctor_id}
                  doctor={doctor}
                />
              ))
            )}

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
