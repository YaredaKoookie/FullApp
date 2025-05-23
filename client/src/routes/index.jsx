import App from "@/App";
import EmailVerifyCallback from "@/components/callbacks/EmailVerifyCallback";
import GoogleCallback from "@/components/callbacks/GoogleCallback";
import MagicLinkVerify from "@/components/callbacks/MagicLinkVerify";
import PasswordReset from "@/components/callbacks/PasswordReset";
import ProtectedRoute from "@/components/ProtectedRoute";

import RedirectIfLoggedIn from "@/components/RedirectIfLoggedIn";
import ErrorBoundary from "@/ErrorBoundary";
import NotFound from "@/NotFound";
import Login from "@/pages/auth/Login";
import RegistrationTab from "@/pages/auth/RegistrationTab";
import AppointmentDetails from "@/pages/patient/appointments/AppointmentDetails";
import Appointments from "@/pages/patient/appointments";
import PatientDashboard from "@/pages/patient/overview/index";
import PatientDoctors from "@/pages/patient/doctors";
import PatientLayout from "@/pages/patient/PatientLayout";
import PatientProfileComplete from "@/pages/patient/profile/PatientProfileComplete";
import PatientProfile from "@/pages/patient/profile";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
} from "react-router-dom";
import CureLogicHomepage from "@/pages/public/Home";
import AppointmentDetailsPage from "@/pages/patient/appointments/AppointmentDetailsPage";
import Payments from "@/pages/patient/payments";
import AppProtector from "@/components/AppProtector";
import DoctorProfileDetails from "@/pages/patient/doctors/DoctorProfileDetails";
import MedicalHistoryPage from "@/pages/patient/medical-history";
import VideoCall from "@/pages/patient/VideoCall";
import SecurityPage from "@/pages/patient/security";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<ErrorBoundary />}>

      <Route path="/" element={<App />}>
        <Route index element={<CureLogicHomepage />} />
      </Route>



      <Route
        path="/patient"
        element={
          <AppProtector allowedRoles={["patient"]}>
            <PatientLayout />
          </AppProtector>
        }
      >
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
          path="appointments/:appointmentId/join"
          element={
            <ProtectedRoute>
              <VideoCall />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctors/:doctorId/details"
          element={
            <ProtectedRoute>
              <DoctorProfileDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments/:appointmentId/details"
          element={
            <ProtectedRoute>
              <AppointmentDetailsPage />
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
          path="payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="medical-history"
          element={
            <ProtectedRoute>
              <MedicalHistoryPage />
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
          path="appointments/:id"
          element={
            <ProtectedRoute>
              <AppointmentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="security"
          element={
            <ProtectedRoute>
              <SecurityPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="patient/complete-profile"
        element={
          <ProtectedRoute skipProfileCheck>
            <PatientProfileComplete />
          </ProtectedRoute>
        }
      />


      <Route path="auth" element={<RedirectIfLoggedIn />}>
        <Route index element={<Navigate to="/auth/login" replace />} />
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
