import { Routes, Route, BrowserRouter } from "react-router-dom";
import GoogleCallback from "./components/GoogleCallback";
import EmailVerifyCallback from "./components/EmailVerifyCallback";
import PasswordReset from "./components/PasswordReset";
import MagicLinkVerify from "./components/MagicLinkVerify";
import SelectRole from "./pages/auth/SelectRole";
import RegistrationTab from "./pages/auth/RegistrationTab";
import Login from "./pages/auth/Login";
import Home from "./pages/Public/Home";
import PublicLayout from "./layouts/PublicLayout";

const App = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/select-role" element={<SelectRole />} />
        <Route path="/register" element={<RegistrationTab />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/auth/email/verify" element={<EmailVerifyCallback />} />
        <Route path="/auth/magic-link/verify" element={<MagicLinkVerify />} />
        <Route path="/auth/reset-password" element={<PasswordReset />} />
      </Route>
    </Routes>
  );
};
export default App;
