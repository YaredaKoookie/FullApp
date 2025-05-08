import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {/* Footer Info */}
          <div className="footer-info">
            <h3 className="text-2xl font-bold mb-4">LOGO</h3>
            <p className="text-sm">
              Your smart companion for medical recommendations, doctor bookings,
              and health management.
            </p>
          </div>

          {/* Footer Links */}
          <div className="footer-links space-y-2">
            <h4 className="text-xl font-semibold mb-4 fle">Quick Links</h4>
            <Link to="/" className="text-gray-600 hover:text-blue-600">
              Home
            </Link>
            <br/>
            <br/>
            <Link
              to="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Register
            </Link>
          </div>
          {/* Footer Contact */}
          <div className="footer-contact">
            <h4 className="text-xl font-semibold mb-4">Contact Us</h4>
            <p className="text-sm">Phone: +123 456 7890</p>
            <p className="text-sm">Email: support@medibook.com</p>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="bg-gray-800 text-center py-4 mt-8">
        <p className="text-sm">
          Developed by <strong>YourName</strong>
        </p>
        <p className="text-sm">© 2025 MediBook. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
