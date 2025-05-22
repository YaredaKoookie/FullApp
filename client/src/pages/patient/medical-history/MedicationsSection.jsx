import { format } from "date-fns";
import { Edit } from "lucide-react";

const MedicationsSection = ({
  currentMedications,
  pastMedications,
  onEdit,
}) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Medications
          </h3>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {/* Current Medications */}
        <div className="px-6 py-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Current Medications
          </h4>
          {currentMedications.length > 0 ? (
            <ul className="space-y-4">
              {currentMedications.map((med) => (
                <li key={med._id} className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{med.name}</p>
                    <p className="text-sm text-gray-600">
                      {med.dosage} • {med.frequency}
                    </p>
                    <p className="text-sm text-gray-500">
                      Since {format(new Date(med.startDate), "MMM d, yyyy")}
                      {med.purpose && ` • For ${med.purpose}`}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(med, "current")}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No current medications</p>
          )}
        </div>

        {/* Past Medications */}
        <div className="px-6 py-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Past Medications
          </h4>
          {pastMedications.length > 0 ? (
            <ul className="space-y-4">
              {pastMedications.map((med) => (
                <li key={med._id} className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{med.name}</p>
                    <p className="text-sm text-gray-600">
                      {med.dosage} • {med.frequency}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(med.startDate), "MMM d, yyyy")} -
                      {med.endDate
                        ? format(new Date(med.endDate), "MMM d, yyyy")
                        : "Present"}{" "}
                      •{med.reasonStopped && ` Reason: ${med.reasonStopped}`}
                    </p>
                  </div>
                  <button
                    onClick={() => onEdit(med, "past")}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No past medications</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicationsSection;