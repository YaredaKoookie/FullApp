import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog } from "@headlessui/react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  RotateCw,
  Stethoscope,
  X,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import apiClient from "@api/apiClient";
import AppointmentStatusBadge from "./AppointmentStatusBadge";
import { Link } from "react-router-dom"

const AppointmentCard = ({ appointment, refetch }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  const startDate = new Date(appointment.slot.start);
  const endDate = new Date(appointment.slot.end);
  const isPastAppointment = isPast(endDate);
  const isTodayAppointment = isToday(startDate);

  // Payment Mutation
  const { mutate: initiatePayment, isLoading: isPaying } = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(
        `/payments/initiate/${appointment._id}`,
        { currency: "ETB" }
      );
      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.payment_url; // Redirect to Chapa
    },
    onError: (error) => {
      alert(`Payment failed: ${error.message}`);
    },
  });

  // Cancellation Mutation
  const { mutate: cancelAppointment, isLoading: isCancelling } = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/appointments/${appointment._id}/cancel`, {
        reason: cancellationReason,
      });
    },
    onSuccess: () => {
      refetch();
      setIsCancelOpen(false);
    },
  });

  // Reschedule Mutation
  const { mutate: rescheduleAppointment, isLoading: isRescheduling } =
    useMutation({
      mutationFn: async (newSlot) => {
        await apiClient.post(`/appointments/${appointment._id}/reschedule`, {
          newSlot,
          reason: rescheduleReason,
        });
      },
      onSuccess: () => {
        refetch();
        setIsRescheduleOpen(false);
      },
    });

  return (
    <div className="bg-white rounded-lg shadow mb-4">
      {/* Appointment Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {appointment.doctor.profilePhoto ? (
              <img
                src={appointment.doctor.profilePhoto}
                alt={`${appointment.doctor.firstName} ${appointment.doctor.lastName}`}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Stethoscope className="h-5 w-5" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  <Link
                    className="text-blue-800 hover:underline"
                    to={"../doctors/" + appointment.doctor._id + "/details"}
                  >
                    Dr. {appointment.doctor.firstName}{" "}
                    {appointment.doctor.lastName}
                  </Link>
                </h3>
                <AppointmentStatusBadge status={appointment.status} />
              </div>

              <p className="text-sm text-blue-600 font-medium mt-1">
                {appointment.doctor.specialization}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {format(startDate, "MMM d, yyyy")}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {appointment.appointmentType === "virtual"
                    ? "Virtual"
                    : "In-person"}
                </span>
                {isTodayAppointment && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Today
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Reason</h4>
              <p>{appointment.reason || "Not specified"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Fee</h4>
              <p>{appointment.fee} ETB</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            {appointment.status === "PENDING" && (
              <>
                <button
                  onClick={() => setIsCancelOpen(true)}
                  className="px-3 py-1 border border-red-300 text-red-600 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsRescheduleOpen(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Reschedule
                </button>
              </>
            )}

            {appointment.status === "ACCEPTED" && (
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="px-3 py-1 bg-green-600 text-white rounded flex items-center"
              >
                <CreditCard className="mr-1 h-4 w-4" />
                Pay Now
              </button>
            )}

            {appointment.status === "confirmed" && (
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="px-3 py-1 bg-green-600 text-white rounded flex items-center"
              >
                <CreditCard className="mr-1 h-4 w-4" />
                Pay Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onConfirm={initiatePayment}
        isLoading={isPaying}
        amount={appointment.fee}
      />

      {/* Cancellation Dialog */}
      <CancellationDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={cancelAppointment}
        isLoading={isCancelling}
        reason={cancellationReason}
        setReason={setCancellationReason}
      />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onConfirm={rescheduleAppointment}
        isLoading={isRescheduling}
        reason={rescheduleReason}
        setReason={setRescheduleReason}
        doctorId={appointment.doctor._id}
      />
    </div>
  );
};

// Dialog Components
const PaymentDialog = ({ isOpen, onClose, onConfirm, isLoading, amount }) => (
  <Dialog open={isOpen} onClose={onClose}>
    <Dialog.Panel className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <Dialog.Title className="font-bold text-lg mb-2">
          Confirm Payment
        </Dialog.Title>
        <div className="mb-4">
          <p>You will be redirected to Chapa to complete payment of:</p>
          <p className="font-bold text-xl mt-2">{amount} ETB</p>
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {isLoading ? (
              <RotateCw className="animate-spin" />
            ) : (
              "Proceed to Pay"
            )}
          </button>
        </div>
      </div>
    </Dialog.Panel>
  </Dialog>
);

const CancellationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  reason,
  setReason,
}) => (
  <Dialog open={isOpen} onClose={onClose}>
    <Dialog.Panel className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <Dialog.Title className="font-bold text-lg mb-2">
          Cancel Appointment
        </Dialog.Title>
        <div className="mb-4">
          <label className="block mb-2">Reason for cancellation</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded p-2"
            rows={3}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Back
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason || isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
          >
            {isLoading ? (
              <RotateCw className="animate-spin" />
            ) : (
              "Confirm Cancellation"
            )}
          </button>
        </div>
      </div>
    </Dialog.Panel>
  </Dialog>
);

const RescheduleDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  reason,
  setReason,
  doctorId,
}) => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    const fetchSlots = async () => {
      const { data } = await apiClient.get(`/doctors/${doctorId}/slots`);
      setAvailableSlots(data);
    };
    if (isOpen) fetchSlots();
  }, [isOpen, doctorId]);

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Dialog.Panel className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <Dialog.Title className="font-bold text-lg mb-2">
            Reschedule Appointment
          </Dialog.Title>
          <div className="mb-4 space-y-4">
            <div>
              <label className="block mb-2">Available Time Slots</label>
              <div className="max-h-40 overflow-y-auto border rounded p-2">
                {availableSlots.map((slot) => (
                  <div
                    key={slot._id}
                    className={`p-2 mb-2 cursor-pointer ${selectedSlot?._id === slot._id
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                      }`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {format(new Date(slot.start), "MMM d, h:mm a")}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-2">Reason for rescheduling</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border rounded p-2"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button onClick={onClose} className="px-4 py-2 border rounded">
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedSlot)}
              disabled={!selectedSlot || !reason || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {isLoading ? (
                <RotateCw className="animate-spin" />
              ) : (
                "Confirm Reschedule"
              )}
            </button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default AppointmentCard;
