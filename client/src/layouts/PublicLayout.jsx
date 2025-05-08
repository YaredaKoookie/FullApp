import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/Navbar/PublicNavbar";
import Footer from "../components/Footer";

export default function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      <header className="shadow-md">
        {/* <PublicNavbar /> */}
      </header>

      <main className="flex-grow px-4 py-6 sm:px-6 lg:px-8 bg-gray-50 bg-red-500">
          <Outlet />
      </main>

      <footer className="bg-gray-100 mt-8 border-t">
        <Footer />
      </footer>
    </div>
  );
}
