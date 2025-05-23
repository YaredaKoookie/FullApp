import { format } from "date-fns";
import { Edit } from "lucide-react";

const ImmunizationsSection = ({ immunizations, onEdit }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Immunizations</h3>
      </div>
      
      <div className="px-6 py-4">
        {immunizations.length > 0 ? (
          <ul className="space-y-4">
            {immunizations.map(immunization => (
              <li key={immunization._id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{immunization.vaccine}</p>
                  <p className="text-sm text-gray-600">
                    Received: {format(new Date(immunization.date), 'MMM d, yyyy')}
                    {immunization.administeredBy && ` • By ${immunization.administeredBy}`}
                  </p>
                  {immunization.boosterDue && (
                    <p className={`text-sm ${new Date(immunization.boosterDue) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
                      Booster due: {format(new Date(immunization.boosterDue), 'MMM d, yyyy')}
                      {new Date(immunization.boosterDue) < new Date() && ' (Overdue)'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onEdit(immunization, 'immunization')}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No immunizations recorded</p>
        )}
      </div>
    </div>
  );
};

export default ImmunizationsSection;