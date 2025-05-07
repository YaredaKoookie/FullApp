import App from "@/App";
import ErrorBoundary from "@/ErrorBoundary";
import SelectRole from "@/pages/auth/SelectRole";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

const router = createBrowserRouter(createRoutesFromElements(
  <Route ErrorBoundary={ErrorBoundary}>
    <Route path="/" element={<App />}>
        <Route path="/select-role" element={<SelectRole />} />
    </Route>
  </Route>
));

export default router;