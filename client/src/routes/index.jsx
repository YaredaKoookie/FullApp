import App from "@/App";
import EmailVerifyCallback from "@/components/callbacks/EmailVerifyCallback";
import GoogleCallback from "@/components/callbacks/GoogleCallback";
import MagicLinkVerify from "@/components/callbacks/MagicLinkVerify";
import PasswordReset from "@/components/callbacks/PasswordReset";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  DoctorProtectedRoute,
  DoctorProfileRoute,
} from "@/components/doctorProtectedRoute";

import RedirectIfLoggedIn from "@/components/RedirectIfLoggedIn";
import ErrorBoundary from "@/ErrorBoundary";
import NotFound from "@/NotFound";
import Login from "@/pages/auth/Login";
import RegistrationTab from "@/pages/auth/RegistrationTab";
import SelectRole from "@/pages/auth/SelectRole";
import DoctorLayout from "@/pages/doctor/DoctorLayout";
import DoctorProfileCompletion from "@/pages/doctor/CompleteDoctorProfile";
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
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorSchedule from "@/pages/doctor/DoctorSchedule";
import CureLogicHomepage from "@/pages/public/Home";
import CompleteDoctorProfile from "@/pages/doctor/CompleteDoctorProfile";
import DoctorProfilePage from "@/pages/doctor/DoctorProfilePage";
import AppointmentDetailsPage from "@/pages/patient/AppointmentDetailsPage";
import Payments from "@/pages/patient/Payments";
// import DoctorPatientsPage from "@/pages/doctor/DoctorAppointmentsDashboard";
import AccountSetting from "@/pages/doctor/AccountSetting";
import DoctorAppointmentsDashboard from "@/pages/doctor/DoctorAppointmentsDashboard";
import DoctorListContent from "@/Admin/AdminDoctorListPage";
import AdminPatientListContent from "@/Admin/AdminPatinet";
import PaymentsWithdrawalsContent from "@/Admin/PaymentsWithdrawalsContent";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<ErrorBoundary />}>

      <Route path="/admin/doc" element={<DoctorListContent/>}/>
      <Route path="/admin/pay" element={<PaymentsWithdrawalsContent/>}/>
      <Route path="/admin/pat" element={<AdminPatientListContent/>}/>
      <Route path="/" element={<App />}>
        <Route index element={<CureLogicHomepage />} />
      </Route>

      <Route path="doctor" element={<DoctorProfileRoute />}>
        <Route path="complete-profile" element={<CompleteDoctorProfile />} />
      </Route>
      <Route
        path="doctor"
        element={
          <DoctorProtectedRoute>
            <DoctorLayout />
          </DoctorProtectedRoute>
        }
      >
        <Route index path="dashboard" element={<DoctorDashboard />} />
        <Route path="schedule" element={<DoctorSchedule />} />
        <Route path="profile" element={<DoctorProfilePage />} />
        <Route path="patient" element={<DoctorAppointmentsDashboard/>} />
        <Route path="setting" element={<AccountSetting/>} />
      </Route>

      {/* <Route
        path="doctor"
        element={
          <ProtectedRoute role="doctor">
            <DoctorLayout />
          </ProtectedRoute>
        }
      ></Route> */}

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
