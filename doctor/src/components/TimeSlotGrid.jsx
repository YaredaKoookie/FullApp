import { format } from 'date-fns';
import { Trash2, Ban, Check, User, Clock } from 'lucide-react';

export const TimeSlotGrid = ({
  slots,
  blockedSlots,
  onDelete,
  onBlock,
  selectedDate
}) => {
  const isSlotBlocked = (slot) => {
    return blockedSlots.some(
      blocked =>
        format(new Date(blocked.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
        blocked.startTime === slot.startTime &&
        blocked.endTime === slot.endTime
    );
  };

  const isSlotPast = (slot) => {
    const now = new Date();
    const slotDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${slot.startTime}`);
    return slotDateTime < now;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Time Slots for {format(selectedDate, 'MMMM d, yyyy')}
        </h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 ring-2 ring-green-300"></div>
            <span className="text-sm font-medium">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 ring-2 ring-red-300"></div>
            <span className="text-sm font-medium">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-500 ring-2 ring-gray-300"></div>
            <span className="text-sm font-medium">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-300 ring-2 ring-gray-200"></div>
            <span className="text-sm font-medium">Past</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots?.slots?.map((slot) => {
          const isBlocked = isSlotBlocked(slot);
          const isPast = isSlotPast(slot);
          const isBooked = slot.isBooked;

          return (
            <div
              key={slot._id}
              className={`p-4 rounded-lg shadow transition-all duration-200 hover:shadow-lg ${
                isBlocked
                  ? 'bg-gray-50 border-2 border-gray-400 hover:bg-gray-100'
                  : isBooked
                  ? 'bg-red-50 border-2 border-red-400 hover:bg-red-100'
                  : isPast
                  ? 'bg-gray-50 border-2 border-gray-300 hover:bg-gray-100'
                  : 'bg-white border-2 border-green-400 hover:bg-green-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="font-medium text-lg">
                    {slot.startTime} - {slot.endTime}
                  </p>
                  {isBooked && (
                    <div className="space-y-1">
                      <p className="text-sm text-red-600 font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Booked
                      </p>
                      {slot.patientName && (
                        <p className="text-sm text-gray-600">
                          Patient: {slot.patientName}
                        </p>
                      )}
                      {slot.appointmentType && (
                        <p className="text-sm text-gray-600">
                          Type: {slot.appointmentType}
                        </p>
                      )}
                    </div>
                  )}
                  {isBlocked && (
                    <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
                      <Ban className="h-4 w-4" />
                      Blocked
                      {slot.blockReason && (
                        <span className="text-gray-500">- {slot.blockReason}</span>
                      )}
                    </p>
                  )}
                  {isPast && (
                    <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Past
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isBooked && !isPast && (
                    <>
                      <button
                        onClick={() => onBlock(slot)}
                        disabled={isBlocked}
                        className={`p-2 rounded-full transition-colors ${
                          isBlocked
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title={isBlocked ? "Slot is already blocked" : "Block this slot"}
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(slot._id)}
                        disabled={isBlocked}
                        className={`p-2 rounded-full transition-colors ${
                          isBlocked
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title={isBlocked ? "Cannot delete blocked slot" : "Delete this slot"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {isBooked && (
                    <button
                      className="p-2 text-green-600 cursor-not-allowed rounded-full bg-green-50"
                      disabled
                      title="Slot is booked"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 