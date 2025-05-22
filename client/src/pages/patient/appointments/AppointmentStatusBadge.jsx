import { CheckCircle, Clock, XCircle, RotateCw, AlertCircle, CheckCircle2Icon } from 'lucide-react'

const statusConfig = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Clock className="h-4 w-4" />,
    label: 'Pending'
  },
  confirmed: {
    color: 'bg-blue-100 text-blue-800',
    icon: <CheckCircle className="h-4 w-4" />,
    label: 'Confirmed'
  },
  completed: {
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="h-4 w-4" />,
    label: 'Completed'
  },
  cancelled: {
    color: 'bg-red-100 text-red-800',
    icon: <XCircle className="h-4 w-4" />,
    label: 'Cancelled'
  },
  rescheduled: {
    color: 'bg-purple-100 text-purple-800',
    icon: <RotateCw className="h-4 w-4" />,
    label: 'Rescheduled'
  },
    accepted: {
    color: 'bg-sky-100 text-sky-800',
    icon: <CheckCircle2Icon className="h-4 w-4" />,
    label: 'Accepted'
  },
  'no-show': {
    color: 'bg-orange-100 text-orange-800',
    icon: <AlertCircle className="h-4 w-4" />,
    label: 'No Show'
  }
}

export default function AppointmentStatusBadge({ status }) {
  const config = statusConfig[status] || {
    color: 'bg-gray-100 text-gray-800',
    icon: null,
    label: status
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  )
}