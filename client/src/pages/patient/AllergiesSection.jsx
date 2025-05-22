import { format } from "date-fns";
import { Edit } from "lucide-react";

const AllergiesSection = ({ allergies, onEdit }) => {
  const severityColors = {
    'Mild': 'bg-green-100 text-green-800',
    'Moderate': 'bg-yellow-100 text-yellow-800',
    'Severe': 'bg-orange-100 text-orange-800',
    'Life-threatening': 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Allergies</h3>
      </div>
      
      <div className="px-6 py-4">
        {allergies.length > 0 ? (
          <ul className="space-y-4">
            {allergies.map(allergy => (
              <li key={allergy._id} className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{allergy.substance}</p>
                    {allergy.isCritical && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{allergy.reaction}</p>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[allergy.severity]}`}>
                      {allergy.severity}
                    </span>
                    {allergy.firstObserved && (
                      <span className="text-xs text-gray-500">
                        First observed: {format(new Date(allergy.firstObserved), 'MMM yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onEdit(allergy, 'allergy')}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No allergies recorded</p>
        )}
      </div>
    </div>
  );
};

export default AllergiesSection;