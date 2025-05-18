import { StarIcon } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const DoctorCard = ({ doctor, children, ...rest }) => {
  console.log(doctor);
  return (
    <div
      key={doctor._id}
      className={`shadow p-4 bg-white rounded ${rest.className}`}
    >
      <div className="mb-4 min-h-[350px] shadow">
        <img className="rounded-md" src={doctor.profilePhoto} />
      </div>

      <div className="mb-5">
        <h3 className="font-bold text-lg mb-4 flex items-center justify-between gap-1 flex-wrap">
          <span>
            Dr. {doctor.firstName} {doctor.middleName}
          </span>
          {doctor.yearsOfExperience && <span className="text-xs p-px px-2 rounded-full bg-blue-500/10 text-blue-800 border">{doctor.yearsOfExperience} years exp.</span>}
        </h3>

        <div className="flex justify-between gap-4 mb-4">
          <h5 className="px-2.5 py-2.5 font-semibold text-xs bg-sky-500/10 rounded w-fit text-sky-800">
            {doctor.specialization}
          </h5>
          <div className="text-sm font-medium flex items-center gap-2">
            <span>
              <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            </span>
            <span>{doctor.rating}</span>
            <span className="text-gray-500">({doctor.totalReviews})</span>
          </div>
        </div>

        <div>
          <div className="">
            <h6 className="font-medium">${doctor.consultationFee} {doctor.currency} ETB</h6>
            <p>{doctor.experience}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-5">
          <Link to={doctor._id+"/details"} className="text-xs font-medium py-2 px-5 bg-sky-500 border border-sky-500 rounded text-white hover:bg-sky-600/80">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;
