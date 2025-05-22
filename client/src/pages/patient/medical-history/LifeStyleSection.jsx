import { Edit } from "lucide-react";

const LifestyleSection = ({ lifestyle, onEdit }) => {
  const frequencyLabels = {
    'Never': 'Never',
    'Occasionally': 'Occasionally',
    'Weekly': 'Weekly',
    'Daily': 'Daily'
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Lifestyle Factors</h3>
      </div>
      
      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Smoking */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium text-gray-800">Tobacco Use</h4>
              <p className="mt-1 text-sm text-gray-600">
                {lifestyle?.smoking?.status ? 'Smoker' : 'Non-smoker'}
              </p>
              {lifestyle?.smoking?.status && (
                <>
                  <p className="text-sm text-gray-600">
                    Frequency: {frequencyLabels[lifestyle.smoking.frequency] || 'Unknown'}
                  </p>
                  {lifestyle.smoking.years && (
                    <p className="text-sm text-gray-600">
                      Years: {lifestyle.smoking.years}
                    </p>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => onEdit(lifestyle, 'lifestyle')}
              className="text-indigo-600 hover:text-indigo-900"
            >
              <Edit className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Alcohol */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium text-gray-800">Alcohol Use</h4>
              <p className="mt-1 text-sm text-gray-600">
                {lifestyle?.alcohol?.status ? 'Drinks alcohol' : 'Does not drink'}
              </p>
              {lifestyle?.alcohol?.status && (
                <p className="text-sm text-gray-600">
                  Frequency: {lifestyle.alcohol.frequency || 'Not specified'}
                </p>
              )}
            </div>
            <button
              onClick={() => onEdit(lifestyle, 'lifestyle')}
              className="text-indigo-600 hover:text-indigo-900"
            >
              <Edit className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Exercise */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium text-gray-800">Exercise</h4>
              <p className="mt-1 text-sm text-gray-600">
                {lifestyle?.exerciseFrequency || 'Not specified'}
              </p>
            </div>
            <button
              onClick={() => onEdit(lifestyle, 'lifestyle')}
              className="text-indigo-600 hover:text-indigo-900"
            >
              <Edit className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Diet */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium text-gray-800">Diet</h4>
              <p className="mt-1 text-sm text-gray-600">
                {lifestyle?.diet || 'Not specified'}
              </p>
            </div>
            <button
              onClick={() => onEdit(lifestyle, 'lifestyle')}
              className="text-indigo-600 hover:text-indigo-900"
            >
              <Edit className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default LifestyleSection;