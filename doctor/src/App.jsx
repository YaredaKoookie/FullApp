import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard';
import Users from './pages/Users';
import { Appointments } from './pages/Appointments';
import DoctorManagement from './pages/DoctorManagement';
import {Patients} from './pages/Patients';
import Schedule from './pages/Schedule';
import ProfileManagement from './pages/ProfileManagement';
import ReviewsRatings from './pages/ReviewsRatings';
import Notifications from './pages/Notifications';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/doctors" element={<DoctorManagement />} />
        <Route path="/users" element={<Users />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/profile" element={<ProfileManagement />} />
        <Route path="/reviews" element={<ReviewsRatings />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App; 