import {Routes, Route, BrowserRouter} from "react-router-dom"
import GoogleCallback from "./components/GoogleCallback"
import EmailVerifyCallback from "./components/EmailVerifyCallback"
import PasswordReset from "./components/PasswordReset"
import { ToastContainer } from "react-toastify"
import MagicLinkVerify from "./components/MagicLinkVerify"
import SelectRole from "./pages/auth/SelectRole";
import RegistrationTab from "./pages/auth/RegistrationTab";
import { Theme } from "@chakra-ui/react"
import Login from "./pages/auth/Login"
import PublicNavbar from "./components/Navbar/PublicNavbar"

const App = () => {
  return (
    <div style={{minHeight: "100vh", background: "#fff", overflow: "hidden"}}>
      <Theme appearance="light">
      <BrowserRouter>   
      {/* <PublicNavbar/> */}
        <Routes>
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/register" element={<RegistrationTab />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/auth/email/verify" element={<EmailVerifyCallback />} />
          <Route path="/auth/magic-link/verify" element={<MagicLinkVerify />} />
          <Route path="/auth/reset-password" element={<PasswordReset />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer />
      </Theme>
    </div>
  )
}

export default App