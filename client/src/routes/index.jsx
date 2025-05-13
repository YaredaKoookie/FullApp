import App from "@/App";
import EmailVerifyCallback from "@/components/callbacks/EmailVerifyCallback";
import GoogleCallback from "@/components/callbacks/GoogleCallback";
import MagicLinkVerify from "@/components/callbacks/MagicLinkVerify";
import PasswordReset from "@/components/callbacks/PasswordReset";
import ProtectedRoute from "@/components/ProtectedRoute";
import {DoctorProtectedRoute,DoctorProfileRoute} from "@/components/doctorProtectedRoute";

import RedirectIfLoggedIn from "@/components/RedirectIfLoggedIn";
import ErrorBoundary from "@/ErrorBoundary";
import NotFound from "@/NotFound";
import Login from "@/pages/auth/Login";
import RegistrationTab from "@/pages/auth/RegistrationTab";
import SelectRole from "@/pages/auth/SelectRole";
import DoctorLayout from "@/pages/doctor/DoctorLayout";
import DoctorProfileCompletion from "@/pages/doctor/DoctorProfileCompletion";
import AppointmentDetails from "@/pages/patient/AppointmentDetails";
import Appointments from "@/pages/patient/Appointments";
import PatientDashboard from "@/pages/patient/PatientDashboard";
import PatientDoctors from "@/pages/patient/PatientDoctors";
import PatientLayout from "@/pages/patient/PatientLayout";
import PatientProfileComplete from "@/pages/patient/PatientProfileComplete";
import PatientProfile from "@/pages/patient/Profile";
import Home from "@/pages/public/Home";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
} from "react-router-dom";
import DoctorScheduling from "@/pages/doctor/DoctorSchedule";
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorSchedule from "@/pages/doctor/DoctorSchedule";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<ErrorBoundary />}>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
      </Route>

      <Route element={<DoctorProfileRoute />}>
        <Route
          path="/doctor/complete-profile"
          element={<DoctorProfileCompletion />}
        />
      </Route>

      {/* Doctor routes - only accessible if profile IS completed */}
      <Route element={<DoctorLayout><DoctorProtectedRoute /></DoctorLayout>}>
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        {/* <Route path="/doctor/appointments" element={<DoctorAppointments />} /> */}
        <Route path="/doctor/schedule" element={<DoctorSchedule />} />
        {/* Add other doctor routes here */}
      </Route>
      <Route
        path="doctor"
        element={
          <ProtectedRoute role="doctor">
            <DoctorLayout />
          </ProtectedRoute>
        }
      ></Route>

      {/* this is my space */}

      <Route path="/patient" element={<PatientLayout />}>
        <Route
          index
          path="dashboard"
          element={
            <ProtectedRoute>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments"
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctors"
          element={
            <ProtectedRoute>
              <PatientDoctors />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <PatientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile-complete"
          element={
            <ProtectedRoute>
              <PatientProfileComplete />
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments/:id"
          element={
            <ProtectedRoute>
              <AppointmentDetails />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="auth" element={<RedirectIfLoggedIn />}>
        <Route index element={<Navigate to="/auth/login" replace />} />
        <Route path="select-role" element={<SelectRole />} />
        <Route path="register" element={<RegistrationTab />} />
        <Route path="login" element={<Login />} />
        <Route path="google/callback" element={<GoogleCallback />} />
        <Route path="email/verify" element={<EmailVerifyCallback />} />
        <Route path="magic-link/verify" element={<MagicLinkVerify />} />
        <Route path="reset-password" element={<PasswordReset />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Route>
  ),
  { future: { v7_relativeSplatPath: true } }
);

export default router;
