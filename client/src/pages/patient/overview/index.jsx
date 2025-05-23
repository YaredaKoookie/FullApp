import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Heart,
  Pill,
  Stethoscope,
  TrendingUp,
  User,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Home,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  LineChart,
  Line,
} from "recharts";
import apiClient from "@api/apiClient";
import { format } from "date-fns";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className={`w-4 h-4 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm ml-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend}% from last month
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const AppointmentCard = ({ appointment }) => (
  <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
    <div className="flex items-start gap-4">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Calendar className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">
            Dr. {appointment?.doctor?.firstName} {appointment?.doctor?.lastName}
          </h4>
          <span className="text-sm text-gray-500">
            {format(new Date(appointment?.slot?.start), "MMM dd, yyyy")}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{appointment?.doctor?.specialization}</p>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(appointment?.slot?.start), "MMM dd, yyyy")}</span>
          <Clock className="w-4 h-4 ml-2" />
          <span>{format(new Date(appointment?.slot?.start), "hh:mm a")}</span>
        </div>
      </div>
    </div>
  </div>
);

const MedicalRecordCard = ({ record }) => (
  <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
    <div className="flex items-start gap-4">
      <div className="bg-blue-50 p-2 rounded-lg">
        <FileText className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">
            {record.diagnoses?.[0]?.name || "Medical Record"}
          </h4>
          <span className="text-sm text-gray-500">
            {new Date(record.date || record.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Dr. {record.doctor?.fullName} - {record.doctor?.specialization}
        </p>
        {record.diagnoses?.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700">Diagnoses:</p>
            <ul className="mt-1 space-y-1">
              {record.diagnoses.map((diagnosis, index) => (
                <li key={index} className="text-sm text-gray-600">
                  • {diagnosis.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  </div>
);

const AppointmentChart = ({ data }) => {
  const chartData = [
    { name: "Completed", value: data?.completed || 0 },
    { name: "Upcoming", value: data?.confirmed || 0 },
    { name: "Cancelled", value: data?.cancelled || 0 },
  ];

  const COLORS = ["#10B981", "#3B82F6", "#EF4444"];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Overview</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value) => [`${value} appointments`, ""]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => (
                <span className="text-sm text-gray-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const PaymentChart = ({ data }) => {
  if (!data) return <EmptyState icon={CreditCard} title="No Payment Data" description="Your payment history will appear here" />;

  const chartData = [
    { name: "Paid", value: data.paid || 0, color: "#10B981" },
    { name: "Pending", value: data.pending || 0, color: "#F59E0B" },
    { name: "Refunded", value: data.refunded || 0, color: "#8B5CF6" },
    { name: "Cancelled", value: data.cancelled || 0, color: "#EF4444" },
  ].filter(item => item.value > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Overview</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
            <XAxis type="number" axisLine={false} tickLine={false} />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
            />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              barSize={20}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-gray-600">{item.name}</span>
            <span className="text-sm font-medium text-gray-900 ml-auto">
              ${item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TrendsChart = ({ data }) => {
  // Transform the data for the last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toLocaleString('default', { month: 'short' });
  }).reverse();

  const chartData = last6Months.map(month => ({
    month,
    appointments: Math.floor(Math.random() * 10), // Replace with actual data
    records: Math.floor(Math.random() * 5),      // Replace with actual data
    payments: Math.floor(Math.random() * 1000),   // Replace with actual data
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Trends</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value, name) => {
                const formattedValue = name === 'payments' 
                  ? `$${value.toLocaleString()}`
                  : value;
                return [formattedValue, name.charAt(0).toUpperCase() + name.slice(1)];
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={(value) => (
                <span className="text-sm text-gray-600">
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="appointments"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorAppointments)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="records"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorRecords)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="payments"
              stroke="#8B5CF6"
              fillOpacity={1}
              fill="url(#colorPayments)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl border border-gray-100">
    <div className="p-3 bg-gray-100 rounded-full mb-4">
      <Icon className="w-6 h-6 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500">{description}</p>
  </div>
);

const OverviewPage = () => {
  const navigate = useNavigate();
  const { data: overview, isLoading, error } = useQuery({
    queryKey: ["patientOverview"],
    queryFn: async () => {
      const response = await apiClient.get("/patient/overview");
      return response.data;
    },
  });

  console.log("overview", overview)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Overview</h2>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">Please complete your profile to see your overview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Home className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Overview</h1>
              <p className="text-gray-500 mt-1">
                Welcome back, {overview.patient?.fullName}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Appointments"
            value={overview.appointments?.stats?.total || 0}
            icon={Calendar}
            color="bg-blue-500"
            trend={5}
          />
          <StatCard
            title="Total Spent"
            value={`$${overview.appointments?.stats?.totalSpent || 0}`}
            icon={DollarSign}
            color="bg-green-500"
            trend={-2}
          />
          <StatCard
            title="Active Medications"
            value={overview.medical?.history?.currentMedications?.length || 0}
            icon={Pill}
            color="bg-purple-500"
          />
          <StatCard
            title="Active Conditions"
            value={overview.medical?.history?.activeConditions?.length || 0}
            icon={Heart}
            color="bg-red-500"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AppointmentChart data={overview.appointments?.stats} />
          <PaymentChart data={overview.payments?.stats} />
        </div>

        {/* Trends Chart */}
        <div className="mb-8">
          <TrendsChart data={overview} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Medical Records */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Medical Records</h3>
                <button
                  onClick={() => navigate("/patient/medical-records")}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              {overview?.medical?.recentRecords?.length > 0 ? (
                <div className="space-y-4">
                  {overview.medical.recentRecords.map((record) => (
                    <MedicalRecordCard key={record.id} record={record} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No Medical Records"
                  description="Your medical records will appear here after your appointments."
                />
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
                <button
                  onClick={() => navigate("/patient/appointments")}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              {overview?.appointments?.upcoming?.length > 0 ? (
                <div className="space-y-4">
                  {overview.appointments.upcoming.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No Upcoming Appointments"
                  description="You don't have any scheduled appointments at the moment."
                />
              )}
            </div>

            {/* Health Alerts */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Alerts</h3>
              {overview?.medical?.history?.activeConditions?.length > 0 || 
               overview?.medical?.history?.allergies?.length > 0 ? (
                <div className="space-y-4">
                  {overview.medical.history.activeConditions?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Active Conditions</h4>
                      <ul className="space-y-2">
                        {overview.medical.history.activeConditions.map((condition, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            {condition.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {overview.medical.history.allergies?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Allergies</h4>
                      <ul className="space-y-2">
                        {overview.medical.history.allergies.map((allergy, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            {allergy.substance} - {allergy.reaction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title="No Health Alerts"
                  description="You don't have any active health conditions or allergies recorded."
                />
              )}
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
              {overview?.payments?.recent?.length > 0 ? (
                <div className="space-y-4">
                  {overview.payments.recent.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <CreditCard className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {format(new Date(payment.date), "MMM dd, yyyy")}
                          </p>
                          <p className="text-sm text-gray-500">
                            Dr. {payment.doctor?.firstName} {payment.doctor?.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${payment.amount}</p>
                        <span className={`text-sm ${
                          payment.status === 'paid' ? 'text-green-600' : 
                          payment.status === 'pending' ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No Recent Payments"
                  description="Your payment history will appear here after your appointments."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;