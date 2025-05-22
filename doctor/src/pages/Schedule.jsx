import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar, Clock, BarChart3, Settings, Plus, Trash2, Ban, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, Tab } from '@headlessui/react';
import { adminAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import {DoctorLayout} from '../layouts/DoctorLayout';
import { TimeSlotGrid } from '../components/TimeSlotGrid';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { ScheduleSettings } from '../components/ScheduleSettings';

const ScheduleContent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfWeek(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfWeek(new Date()), 'yyyy-MM-dd')
  });

  // First, fetch the doctor's profile to get the doctor ID
  const { data: doctorData, isLoading: isDoctorLoading } = useQuery({
    queryKey: ['doctor'],
    queryFn: async () => {
      const response = await adminAPI.doctor.getCurrentDoctor();
      return response.data.data.doctor;
    },
    enabled: !!user?._id,
    onError: (error) => {
      toast.error('Failed to load doctor profile');
      console.error('Doctor profile error:', error);
    }
  });

  // Fetch schedule data
  const { data: schedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: () => adminAPI.schedule.getSchedule(doctorData?._id),
    enabled: !!doctorData?._id,
    onError: (error) => {
      toast.error('Failed to load schedule');
      console.error('Schedule error:', error);
    }
  });

  // Fetch slots for selected date
  const { data: slots, isLoading: isSlotsLoading } = useQuery({
    queryKey: ['slots', selectedDate],
    queryFn: async () => {
      const response = await adminAPI.schedule.getSlots(doctorData?._id, { date: format(selectedDate, 'yyyy-MM-dd') });
      return response.data;
    },
    enabled: !!doctorData?._id,
    onError: (error) => {
      toast.error('Failed to load time slots');
      console.error('Slots error:', error);
    }
  });

  // Fetch analytics
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['scheduleAnalytics'],
    queryFn: () => adminAPI.schedule.getScheduleAnalytics(doctorData?._id),
    enabled: !!doctorData?._id,
    onError: (error) => {
      toast.error('Failed to load analytics');
      console.error('Analytics error:', error);
    }
  });

  // Fetch blocked slots
  const { data: blockedSlots, isLoading: isBlockedSlotsLoading } = useQuery({
    queryKey: ['blockedSlots'],
    queryFn: () => adminAPI.schedule.getBlockedSlots(doctorData?._id),
    enabled: !!doctorData?._id,
    onError: (error) => {
      toast.error('Failed to load blocked slots');
      console.error('Blocked slots error:', error);
    }
  });

  // Mutations
  const generateSlotsMutation = useMutation({
    mutationFn: (data) => {
      if (!doctorData?._id) {
        throw new Error('Doctor ID not available');
      }
      return adminAPI.schedule.generateSlots(doctorData._id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['slots', 'schedule']);
      toast.success('Time slots generated successfully');
      setShowGenerateModal(false);
    },
    onError: (error) => toast.error(error.message || 'Failed to generate slots')
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (slotId) => {
      if (!doctorData?._id) {
        throw new Error('Doctor ID not available');
      }
      return adminAPI.schedule.deleteSlot(doctorData._id, slotId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['slots']);
      toast.success('Slot deleted successfully');
    },
    onError: (error) => toast.error(error.message || 'Failed to delete slot')
  });

  const blockSlotMutation = useMutation({
    mutationFn: (data) => {
      if (!doctorData?._id) {
        throw new Error('Doctor ID not available');
      }
      return adminAPI.schedule.addBlockedSlot(doctorData._id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['blockedSlots', 'slots']);
      toast.success('Slot blocked successfully');
      setShowBlockModal(false);
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error.message || 'Failed to block slot';
      if (msg.toLowerCase().includes('already blocked')) {
        toast.error('This slot is already blocked.');
      } else {
        toast.error(msg);
      }
    }
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (data) => {
      if (!doctorData?._id) {
        throw new Error('Doctor ID not available');
      }
      return adminAPI.schedule.updateSchedule(doctorData._id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule']);
      toast.success('Schedule updated successfully');
      setShowSettingsModal(false);
    },
    onError: (error) => toast.error(error.message || 'Failed to update schedule')
  });

  const updateRecurringScheduleMutation = useMutation({
    mutationFn: (data) => {
      if (!doctorData?._id) {
        throw new Error('Doctor ID not available');
      }
      return adminAPI.schedule.updateRecurringSchedule(doctorData._id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule']);
      toast.success('Recurring schedule updated successfully');
    },
    onError: (error) => toast.error(error.message || 'Failed to update recurring schedule')
  });

  const updateBreakSettingsMutation = useMutation({
    mutationFn: (data) => {
      if (!doctorData?._id) {
        throw new Error('Doctor ID not available');
      }
      return adminAPI.schedule.updateBreakSettings(doctorData._id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule']);
      toast.success('Break settings updated successfully');
    },
    onError: (error) => toast.error(error.message || 'Failed to update break settings')
  });

  // Show loading state while doctor profile is being fetched
  if (isDoctorLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error if doctor profile is not found
  if (!doctorData?._id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Failed to load doctor profile. Please try again later.</div>
      </div>
    );
  }

  // Show loading state while other data is being fetched
  if (isScheduleLoading || isSlotsLoading || isAnalyticsLoading || isBlockedSlotsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handlers
  const handleGenerateSlots = (data) => {
    generateSlotsMutation.mutate(data);
  };

  const handleDeleteSlot = (slotId) => {
    if (window.confirm('Are you sure you want to delete this slot?')) {
      deleteSlotMutation.mutate(slotId);
    }
  };

  const handleBlockSlot = (slot) => {
    // Prepare the data in the format expected by the backend
    const data = {
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: slot.startTime,
      endTime: slot.endTime,
      reason: slot.reason || '',
    };
    blockSlotMutation.mutate(data);
  };

  const handleUpdateSchedule = (data) => {
    updateScheduleMutation.mutate(data);
  };

  const handleUpdateRecurringSchedule = (data) => {
    updateRecurringScheduleMutation.mutate(data);
  };

  const handleUpdateBreakSettings = (data) => {
    updateBreakSettingsMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Schedule Management</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="w-5 h-5 mr-2" />
            Generate Slots
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Settings className="w-5 h-5 mr-2" />
            Settings
          </button>
        </div>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
              }`
            }
          >
            Calendar View
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
              }`
            }
          >
            Analytics
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
              }`
            }
          >
            Settings
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-6">
          <Tab.Panel className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>
              <div className="md:col-span-2">
                <TimeSlotGrid
                  slots={slots}
                  blockedSlots={blockedSlots?.blockedSlots || []}
                  onDelete={handleDeleteSlot}
                  onBlock={handleBlockSlot}
                  selectedDate={selectedDate}
                />
              </div>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <AnalyticsDashboard analytics={analytics} />
          </Tab.Panel>

          <Tab.Panel>
            <ScheduleSettings
              schedule={schedule}
              onUpdateSchedule={handleUpdateSchedule}
              onUpdateRecurringSchedule={handleUpdateRecurringSchedule}
              onUpdateBreakSettings={handleUpdateBreakSettings}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Generate Slots Modal */}
      <Dialog
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
            <Dialog.Title className="text-lg font-medium mb-4">Generate Time Slots</Dialog.Title>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => handleGenerateSlots(dateRange)}
                disabled={generateSlotsMutation.isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {generateSlotsMutation.isLoading ? 'Generating...' : 'Generate Slots'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Block Slot Modal */}
      <Dialog
        open={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
            <Dialog.Title className="text-lg font-medium mb-4">Block Time Slot</Dialog.Title>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <input
                  type="text"
                  placeholder="Enter reason for blocking"
                  value={selectedSlot?.reason || ''}
                  onChange={(e) => setSelectedSlot(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => handleBlockSlot(selectedSlot)}
                disabled={blockSlotMutation.isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {blockSlotMutation.isLoading ? 'Blocking...' : 'Block Slot'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Settings Modal */}
      <Dialog
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl rounded bg-white p-6">
            <Dialog.Title className="text-lg font-medium mb-4">Schedule Settings</Dialog.Title>
            <ScheduleSettings
              schedule={schedule}
              onUpdateSchedule={handleUpdateSchedule}
              onUpdateRecurringSchedule={handleUpdateRecurringSchedule}
              onUpdateBreakSettings={handleUpdateBreakSettings}
            />
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

const Schedule = () => {
  return (
    <DoctorLayout>
      <ScheduleContent />
    </DoctorLayout>
  );
};

export default Schedule; 