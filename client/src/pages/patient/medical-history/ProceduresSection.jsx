import { format } from "date-fns";
import { Edit } from "lucide-react";

const ProceduresSection = ({ surgeries, hospitalizations, onEdit }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Procedures & Hospitalizations</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {/* Surgeries */}
        <div className="px-6 py-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Surgeries</h4>
          {surgeries.length > 0 ? (
            <ul className="space-y-4">
              {surgeries.map(surgery => (
                <li key={surgery._id} className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{surgery.name}</p>
                    <p className="text-sm text-gray-600">
                      {surgery.date ? format(new Date(surgery.date), 'MMM d, yyyy') : 'Date not specified'}
                      {surgery.hospital && ` • At ${surgery.hospital}`}
                    </p>
                    {surgery.outcome && (
                      <p className="text-sm text-gray-500">Outcome: {surgery.outcome}</p>
                    )}
                    {surgery.surgeon && (
                      <p className="text-sm text-gray-500">Surgeon: {surgery.surgeon}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onEdit(surgery, 'surgery')}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No surgeries recorded</p>
          )}
        </div>

        {/* Hospitalizations */}
        <div className="px-6 py-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Hospitalizations</h4>
          {hospitalizations.length > 0 ? (
            <ul className="space-y-4">
              {hospitalizations.map(hosp => (
                <li key={hosp._id} className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{hosp.reason}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(hosp.admissionDate), 'MMM d, yyyy')} - 
                      {hosp.dischargeDate ? format(new Date(hosp.dischargeDate), 'MMM d, yyyy') : 'Present'} • 
                      {hosp.hospitalName}
                    </p>
                    {hosp.dischargeSummary && (
                      <p className="text-sm text-gray-500">Summary: {hosp.dischargeSummary}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onEdit(hosp, 'hospitalization')}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No hospitalizations recorded</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProceduresSection;