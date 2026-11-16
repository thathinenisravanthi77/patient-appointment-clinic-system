import { useState } from "react";
import { Link } from "react-router-dom";
import { Stethoscope, Clock } from "lucide-react";

const doctorPhotos = [
  "photo-1559839734-2b71ea197ec2",
  "photo-1612349317150-e413f6a5b16d",
  "photo-1594824476967-48c8b964273f",
  "photo-1622253692010-333f2da6031d",
  "photo-1582750433449-648ed127bb54",
  "photo-1537368910025-700350fe46c7",
  "photo-1618498082410-b4aa22193b38",
  "photo-1584515933487-779824d29309",
];

function getDoctorPhotoIndex(doctorId: string | number): number {
  let hash = 0;

  for (const character of String(doctorId)) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash % doctorPhotos.length;
}

interface DoctorCardProps {
  doctor: {
    doctor_id: string | number;
    doctor_name: string;
    specialization: string;
    consultation_fee: number;
    experience?: string;
    qualification?: string;
    is_active?: boolean;
  };
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const photo = doctorPhotos[getDoctorPhotoIndex(doctor.doctor_id)];

  return (
    <article className="card group animate-fade-in">
      <div className="h-40 bg-gradient-to-br from-teal-100 via-sky-50 to-blue-100 relative overflow-hidden">
        {!imageFailed ? (
          <img
            src={`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=800&q=80`}
            alt={`Portrait of ${doctor.doctor_name}`}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-teal-700/60">
            <Stethoscope size={48} strokeWidth={1.25} />
          </div>
        )}
        <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-medium shadow-md">
          {doctor.doctor_name.charAt(0)}
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
          Available
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-900">{doctor.doctor_name}</h3>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
            {doctor.specialization}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Stethoscope size={14} className="text-gray-400" />
            <span>{doctor.experience ?? "5+"} years experience</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-gray-400" />
            <span>30 min slots</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-teal-700">
            ₹{doctor.consultation_fee} <span className="text-sm font-normal text-gray-500">per consult</span>
          </span>
          <Link
            to={`/doctors/${doctor.doctor_id}`}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </article>
  );
}
