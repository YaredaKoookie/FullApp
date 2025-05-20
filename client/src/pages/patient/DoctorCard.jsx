import { StarIcon, MapPin, Languages, Calendar, BriefcaseMedical, Heart } from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";

const DoctorCard = ({ doctor, children, ...rest }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div
      key={doctor._id}
      className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${rest.className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ----- Premium Badge & Like Button ----- */}
      <div className="absolute top-3 left-3 z-10">
        {doctor.verificationStatus === "verified" && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1 rounded-full shadow-md flex items-center">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Verified
          </div>
        )}
      </div>
      
      <button
        onClick={() => setIsLiked(!isLiked)}
        className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:scale-110 transition-transform"
      >
        <Heart
          className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-400"}`}
        />
      </button>

      {/* ----- Animated Doctor Image ----- */}
      <div className="relative h-72 overflow-hidden group">
        <img
          className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? "scale-105" : "scale-100"}`}
          src={doctor.profilePhoto}
          alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* ----- Doctor Info (Elegant Layout) ----- */}
      <div className="p-6">
        {/* Name & Experience */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">
            Dr. {doctor.firstName} {doctor.lastName}
          </h3>
          {doctor.yearsOfExperience && (
            <span className="text-xs px-3 py-1 bg-blue-100/80 text-blue-800 rounded-full border border-blue-200">
              {doctor.yearsOfExperience}+ years
            </span>
          )}
        </div>

        {/* Specialization & Rating */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
            <BriefcaseMedical className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {doctor.specialization}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
            <StarIcon className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-sm font-medium text-amber-800">
              {doctor.rating || "New"}
              {doctor.totalReviews > 0 && (
                <span className="text-xs text-amber-600 ml-1">
                  ({doctor.totalReviews})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Languages & Location (with icons) */}
        <div className="space-y-3 mb-6">
          {doctor.languages?.length > 0 && (
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-600">
                Speaks: <span className="font-medium">{doctor.languages.join(", ")}</span>
              </span>
            </div>
          )}

          {doctor.hospitalName && (
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">
                At <span className="font-medium">{doctor.hospitalName}</span>
              </span>
            </div>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Starting from</p>
              <p className="text-xl font-bold text-blue-600">
                ${doctor.consultationFee} <span className="text-sm font-normal">{doctor.currency || "ETB"}</span>
              </p>
            </div>
            <Link
              to={`${doctor._id}/details`}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;