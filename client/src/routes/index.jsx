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
import SelectRole from "@/pages/auth/SelectRole";
import DoctorLayout from "@/pages/doctor/DoctorLayout";
import PatientLayout from "@/pages/patient/PatientLayout";
import Home from "@/pages/public/Home";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
} from "react-router-dom";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<ErrorBoundary />}>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
      </Route>

      <Route
        path="doctor"
        element={
          <ProtectedRoute>
            <DoctorLayout />
          </ProtectedRoute>
        }
      ></Route>

      <Route
        path="patient"
        element={
          <ProtectedRoute>
            <PatientLayout />
          </ProtectedRoute>
        }
      ></Route>

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
