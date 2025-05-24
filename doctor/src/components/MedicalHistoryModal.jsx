// components/MedicalHistoryModal.jsx
import { FaTimes } from "react-icons/fa";
import { format } from "date-fns";

const MedicalHistoryModal = ({
  patient,
  medicalHistory,
  onClose,
  isLoading,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            Medical History - {patient.firstName}{" "}
            {patient.lastName}
          </h3>
          <button
            onClick={() => onClose(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !medicalHistory?.data?.data?.data ? (
          <div className="text-center text-gray-500 py-4">
            No medical history data available
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vital Health Data */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-3">Vital Health Data</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Blood Type</p>
                  <p className="font-medium">
                    {medicalHistory.data.data.data.bloodType || "Not recorded"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Height</p>
                  <p className="font-medium">
                    {medicalHistory.data.data.data.height
                      ? `${medicalHistory.data.data.data.height} cm`
                      : "Not recorded"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Weight</p>
                  <p className="font-medium">
                    {medicalHistory.data.data.data.weight
                      ? `${medicalHistory.data.data.data.weight} kg`
                      : "Not recorded"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Physical Exam</p>
                  <p className="font-medium">
                    {medicalHistory.data.data.data.lastPhysicalExam
                      ? format(
                          new Date(
                            medicalHistory.data.data.data.lastPhysicalExam
                          ),
                          "MMM d, yyyy"
                        )
                      : "Not recorded"}
                  </p>
                </div>
              </div>
            </section>

            {/* Current Conditions */}
            <section className="bg-white p-4 rounded-lg border">
              <h4 className="text-lg font-medium mb-3">Current Conditions</h4>
              {medicalHistory.data.data.data.conditions?.length > 0 ? (
                <div className="space-y-2">
                  {medicalHistory.data.data.data.conditions.map(
                    (condition, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium">{condition.name}</p>
                          <p className="text-sm text-gray-600">
                            {condition.diagnosisDate &&
                              `Diagnosed: ${format(
                                new Date(condition.diagnosisDate),
                                "MMM d, yyyy"
                              )}`}
                            {condition.isChronic && " (Chronic)"}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-sm rounded-full ${
                            condition.status === "Active"
                              ? "bg-blue-100 text-blue-800"
                              : condition.status === "In Remission"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {condition.status}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No conditions recorded</p>
              )}
            </section>

            {/* Allergies */}
            <section className="bg-white p-4 rounded-lg border">
              <h4 className="text-lg font-medium mb-3">Allergies</h4>
              {medicalHistory.data.data.data.allergies?.length > 0 ? (
                <div className="space-y-2">
                  {medicalHistory.data.data.data.allergies.map(
                    (allergy, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{allergy.substance}</p>
                            <p className="text-sm text-gray-600">
                              Reaction: {allergy.reaction}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-sm rounded-full ${
                              allergy.isCritical
                                ? "bg-red-100 text-red-800"
                                : allergy.severity === "Life-threatening"
                                ? "bg-red-100 text-red-800"
                                : allergy.severity === "Severe"
                                ? "bg-orange-100 text-orange-800"
                                : allergy.severity === "Moderate"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {allergy.severity}
                          </span>
                        </div>
                        {allergy.firstObserved && (
                          <p className="text-sm text-gray-500 mt-1">
                            First observed:{" "}
                            {format(
                              new Date(allergy.firstObserved),
                              "MMM d, yyyy"
                            )}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No allergies recorded</p>
              )}
            </section>

            {/* Current Medications */}
            <section className="bg-white p-4 rounded-lg border">
              <h4 className="text-lg font-medium mb-3">Current Medications</h4>
              {medicalHistory.data.data.data.currentMedications?.length > 0 ? (
                <div className="space-y-2">
                  {medicalHistory.data.data.data.currentMedications.map(
                    (med, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-gray-600">
                          {med.dosage} - {med.frequency}
                          {med.purpose && ` (${med.purpose})`}
                        </p>
                        {med.startDate && (
                          <p className="text-sm text-gray-500">
                            Started:{" "}
                            {format(new Date(med.startDate), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No current medications</p>
              )}
            </section>

            {/* Past Medications */}
            <section className="bg-white p-4 rounded-lg border">
              <h4 className="text-lg font-medium mb-3">Past Medications</h4>
              {medicalHistory.data.data.data.pastMedications?.length > 0 ? (
                <div className="space-y-2">
                  {medicalHistory.data.data.data.pastMedications.map(
                    (med, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-gray-600">
                          {med.dosage} - {med.frequency}
                          {med.purpose && ` (${med.purpose})`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {med.startDate &&
                            `Started: ${format(
                              new Date(med.startDate),
                              "MMM d, yyyy"
                            )}`}
                          {med.endDate &&
                            ` - Ended: ${format(
                              new Date(med.endDate),
                              "MMM d, yyyy"
                            )}`}
                        </p>
                        {med.reasonStopped && (
                          <p className="text-sm text-gray-500">
                            Reason stopped: {med.reasonStopped}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No past medications</p>
              )}
            </section>

            {/* Surgeries */}
            <section className="bg-white p-4 rounded-lg border">
              <h4 className="text-lg font-medium mb-3">Surgeries</h4>
              {medicalHistory.data.data.data.surgeries?.length > 0 ? (
                <div className="space-y-2">
                  {medicalHistory.data.data.data.surgeries.map(
                    (surgery, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">{surgery.name}</p>
                        <p className="text-sm text-gray-600">
                          {surgery.date &&
                            `Date: ${format(
                              new Date(surgery.date),
                              "MMM d, yyyy"
                            )}`}
                          {surgery.hospital &&
                            ` - Hospital: ${surgery.hospital}`}
                        </p>
                        {surgery.surgeon?.doctorId && (
                          <p className="text-sm text-gray-500">
                            Surgeon: {surgery.surgeon.doctorId.name}
                            {surgery.surgeon.doctorId.specialty &&
                              ` (${surgery.surgeon.doctorId.specialty})`}
                          </p>
                        )}
                        {surgery.outcome && (
                          <p className="text-sm text-gray-500">
                            Outcome: {surgery.outcome}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No surgeries recorded</p>
              )}
            </section>

            {/* Hospitalizations */}
            <section className="bg-white p-4 rounded-lg border">
              <h4 className="text-lg font-medium mb-3">Hospitalizations</h4>
              {medicalHistory.data.data.data.hospitalizations?.length > 0 ? (
                <div className="space-y-2">
                  {medicalHistory.data.data.data.hospitalizations.map(
                    (hosp, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">{hosp.reason}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(hosp.admissionDate), "MMM d, yyyy")}
                          {hosp.dischargeDate &&
                            ` - ${format(
                              new Date(hosp.dischargeDate),
                              "MMM d, yyyy"
                            )}`}
                          {hosp.hospitalName && ` - ${hosp.hospitalName}`}
                        </p>
                        {hosp.dischargeSummary && (
                          <p className="text-sm text-gray-500 mt-1">
                            {hosp.dischargeSummary}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No hospitalizations recorded</p>
              )}
            </section>

            {/* Family History */}
            <section className="bg-white p-4 rounded-lg border">
              <h4 className="text-lg font-medium mb-3">Family History</h4>
              {medicalHistory.data.data.data.familyHistory?.length > 0 ? (
                <div className="space-y-2">
                  {medicalHistory.data.data.data.familyHistory.map(
                    (history, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">{history.condition}</p>
                        <p className="text-sm text-gray-600">
                          {history.relation}
                          {history.ageAtDiagnosis &&
                            ` - Diagnosed at age ${history.ageAtDiagnosis}`}
                          {history.deceased && " (Deceased)"}
                        </p>
                        {history.notes && (
                          <p className="text-sm text-gray-500 mt-1">
                            {history.notes}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No family history recorded</p>
              )}
            </section>

            {/* Lifestyle */}
            <section className="bg-white p-4 rounded-lg border">
              <h4 className="text-lg font-medium mb-3">Lifestyle</h4>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Smoking</p>
                  <p className="text-sm text-gray-600">
                    Status:{" "}
                    {medicalHistory.data.data.data.lifestyle?.smoking?.status
                      ? "Yes"
                      : "No"}
                    {medicalHistory.data.data.data.lifestyle?.smoking
                      ?.frequency &&
                      ` - ${medicalHistory.data.data.data.lifestyle.smoking.frequency}`}
                    {medicalHistory.data.data.data.lifestyle?.smoking?.years &&
                      ` (${medicalHistory.data.data.data.lifestyle.smoking.years} years)`}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Alcohol</p>
                  <p className="text-sm text-gray-600">
                    Status:{" "}
                    {medicalHistory.data.data.data.lifestyle?.alcohol?.status
                      ? "Yes"
                      : "No"}
                    {medicalHistory.data.data.data.lifestyle?.alcohol
                      ?.frequency &&
                      ` - ${medicalHistory.data.data.data.lifestyle.alcohol.frequency}`}
                  </p>
                </div>
                {medicalHistory.data.data.data.lifestyle?.exerciseFrequency && (
                  <div>
                    <p className="font-medium">Exercise</p>
                    <p className="text-sm text-gray-600">
                      {
                        medicalHistory.data.data.data.lifestyle
                          .exerciseFrequency
                      }
                    </p>
                  </div>
                )}
                {medicalHistory.data.data.data.lifestyle?.diet && (
                  <div>
                    <p className="font-medium">Diet</p>
                    <p className="text-sm text-gray-600">
                      {medicalHistory.data.data.data.lifestyle.diet}
                    </p>
                  </div>
                )}
                {medicalHistory.data.data.data.lifestyle?.occupation && (
                  <div>
                    <p className="font-medium">Occupation</p>
                    <p className="text-sm text-gray-600">
                      {medicalHistory.data.data.data.lifestyle.occupation}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Immunizations */}
            <section className="bg-white p-4 rounded-lg border">
              <h4 className="text-lg font-medium mb-3">Immunizations</h4>
              {medicalHistory.data.data.data.immunizations?.length > 0 ? (
                <div className="space-y-2">
                  {medicalHistory.data.data.data.immunizations.map(
                    (immunization, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">{immunization.vaccine}</p>
                        <p className="text-sm text-gray-600">
                          Date:{" "}
                          {format(new Date(immunization.date), "MMM d, yyyy")}
                          {immunization.administeredBy &&
                            ` - Administered by: ${immunization.administeredBy}`}
                        </p>
                        {immunization.boosterDue && (
                          <p className="text-sm text-gray-500">
                            Booster due:{" "}
                            {format(
                              new Date(immunization.boosterDue),
                              "MMM d, yyyy"
                            )}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No immunizations recorded</p>
              )}
            </section>

            {/* Women's Health (if applicable) */}
            {medicalHistory.data.data.data.patient?.gender === "Female" && (
              <section className="bg-white p-4 rounded-lg border">
                <h4 className="text-lg font-medium mb-3">Women's Health</h4>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">
                      Pregnancies:{" "}
                      {medicalHistory.data.data.data.womenHealth?.pregnancies ||
                        0}
                    </p>
                    <p className="text-sm text-gray-600">
                      Live Births:{" "}
                      {medicalHistory.data.data.data.womenHealth?.liveBirths ||
                        0}
                    </p>
                    {medicalHistory.data.data.data.womenHealth
                      ?.lastMenstrualPeriod && (
                      <p className="text-sm text-gray-600">
                        Last Menstrual Period:{" "}
                        {format(
                          new Date(
                            medicalHistory.data.data.data.womenHealth.lastMenstrualPeriod
                          ),
                          "MMM d, yyyy"
                        )}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Contraceptive Use:{" "}
                      {medicalHistory.data.data.data.womenHealth
                        ?.contraceptiveUse
                        ? "Yes"
                        : "No"}
                    </p>
                    {medicalHistory.data.data.data.womenHealth
                      ?.menstrualCycleRegular !== null && (
                      <p className="text-sm text-gray-600">
                        Regular Menstrual Cycle:{" "}
                        {medicalHistory.data.data.data.womenHealth
                          ?.menstrualCycleRegular
                          ? "Yes"
                          : "No"}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalHistoryModal;
