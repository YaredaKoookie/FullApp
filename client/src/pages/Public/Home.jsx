import React from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import {
  Users,
  Star,
  HeartPulse,
  Stethoscope,
  CalendarCheck,
  User,
  Settings,
  UserPlus,
} from "lucide-react";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import HereImage from "../../assets/assets_frontend/header_img.png";
import AboutImage from "../../assets/assets_frontend/about_image.png";

const Home = () => {
  const features = [
    {
      title: "AI Symptom Checker",
      desc: "Enter symptoms and receive real-time predictions with AI-powered precision.",
      icon: <HeartPulse className="text-blue-600 w-10 h-10" />,
    },
    {
      title: "Verified Doctor Access",
      desc: "Easily connect with licensed doctors for trusted medical advice.",
      icon: <Stethoscope className="text-blue-600 w-10 h-10" />,
    },
    {
      title: "Seamless Appointments",
      desc: "Book, reschedule, and manage consultations from anywhere.",
      icon: <CalendarCheck className="text-blue-600 w-10 h-10" />,
    },
  ];

  const users = [
    {
      title: "Patients",
      desc: "Get fast, intelligent health support and connect to doctors.",
      icon: <UserPlus className="text-blue-600 w-10 h-10" />,
    },
    {
      title: "Doctors",
      desc: "Manage profiles, receive requests, and track appointments.",
      icon: <Stethoscope className="text-blue-600 w-10 h-10" />,
    },
  ];

  const testimonials = [
    {
      name: "Sara Kebede",
      role: "Patient",
      feedback:
        "Prescripto has transformed how I manage my health. Booking appointments is now effortless, and the reminders help me stay on track.",
      avatar: "https://i.pravatar.cc/100?img=32",
    },
    {
      name: "Dr. Henok Lemma",
      role: "Doctor",
      feedback:
        "This platform connects me directly to patients in need. It’s simple, intuitive, and efficient for both sides.",
      avatar: "https://i.pravatar.cc/100?img=45",
    },
    {
      name: "Samuel Getachew",
      role: "Patient",
      feedback:
        "The chat and video consultations make follow-ups seamless. I highly recommend Prescripto to anyone!",
      avatar: "https://i.pravatar.cc/100?img=12",
    },
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <div className="bg-red-500">
      {/* Hero Section */}
      <section className="bg-blue-700 text-white px-6 py-20 min-h-screen flex items-center">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between w-full gap-12">
          {/* Left */}
          <div className="md:w-1/2 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Smart Medical Recommendations
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-md">
              Instantly check symptoms, get expert consultations, and manage
              appointments—all in one place.
            </p>
            <div className="flex justify-center md:justify-start gap-4 flex-wrap">
              <Link
                to="/register"
                className="border border-white px-6 py-2 rounded hover:bg-white hover:text-blue-700 transition"
              >
                Register
              </Link>
            </div>
          </div>
          {/* Right Image */}
          <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
            <img
              src={HereImage}
              alt="Medical Illustration"
              className="max-w-xs md:max-w-sm lg:max-w-md h-auto object-contain"
            />
          </div>
        </div>
      </section>
      {/* Features */}
      <section className="py-20 px-6 max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-semibold mb-12">
          Powerful Features, Simplified
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white shadow-md rounded-xl p-6 text-left hover:shadow-xl transition hover:-translate-y-1 duration-300"
            >
              <div className="flex justify-center mb-4">{f.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-blue-700">
                {f.title}
              </h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* section about */}

      <section className="w-full bg-white py-20 px-6 md:px-10" id="about">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <h2 className="text-4xl font-bold text-center text-blue-700 mb-12">
            ABOUT <span className="text-black">US</span>
          </h2>

          {/* Main About Section */}
          <div className="flex flex-col md:flex-row items-center gap-10">
            <img
              src={AboutImage}
              alt="Doctors"
              className="w-full md:w-1/2 rounded-3xl shadow-lg "
            />
            <div className="text-gray-700 space-y-5 md:w-1/2 text-justify">
              <p>
                Welcome to <strong>Prescripto</strong>, your trusted partner in
                managing your healthcare needs conveniently and efficiently. We
                understand the challenges individuals face when scheduling
                doctor appointments and managing health records.
              </p>
              <p>
                Prescripto is committed to excellence in healthcare technology.
                Whether you're booking your first appointment or managing
                ongoing care, we’re here to support you every step of the way.
              </p>
              <p className="font-semibold text-blue-700">Our Vision</p>
              <p>
                To bridge the gap between patients and healthcare providers,
                creating a seamless and stress-free healthcare experience.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <Users className="mx-auto text-blue-600 w-10 h-10" />
              <h3 className="text-3xl font-bold text-blue-700 mt-2">2,500+</h3>
              <p className="text-gray-600">Patients Served</p>
            </div>
            <div>
              <CalendarCheck className="mx-auto text-blue-600 w-10 h-10" />
              <h3 className="text-3xl font-bold text-blue-700 mt-2">1,200+</h3>
              <p className="text-gray-600">Appointments Scheduled</p>
            </div>
            <div>
              <HeartPulse className="mx-auto text-blue-600 w-10 h-10" />
              <h3 className="text-3xl font-bold text-blue-700 mt-2">300+</h3>
              <p className="text-gray-600">Doctors Onboarded</p>
            </div>
          </div>

          {/* Why Choose Us */}
          <h3 className="text-3xl font-bold text-center text-blue-700 mt-24 mb-10">
            WHY <span className="text-black">CHOOSE US</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-blue-50 p-6 rounded-2xl shadow hover:shadow-lg transition duration-300">
              <Star className="mx-auto text-blue-700 mb-2 w-8 h-8" />
              <h4 className="text-xl font-semibold text-blue-700 mb-2">
                EFFICIENCY
              </h4>
              <p className="text-gray-600">
                Streamlined appointment scheduling that fits your lifestyle.
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl shadow hover:shadow-lg transition duration-300">
              <Users className="mx-auto text-blue-700 mb-2 w-8 h-8" />
              <h4 className="text-xl font-semibold text-blue-700 mb-2">
                CONVENIENCE
              </h4>
              <p className="text-gray-600">
                Connect with verified doctors in your area anytime.
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl shadow hover:shadow-lg transition duration-300">
              <HeartPulse className="mx-auto text-blue-700 mb-2 w-8 h-8" />
              <h4 className="text-xl font-semibold text-blue-700 mb-2">
                PERSONALIZATION
              </h4>
              <p className="text-gray-600">
                Smart health reminders and tailored recommendations.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-24 text-center">
            <h3 className="text-3xl font-bold text-blue-700 mb-4">
              Ready to take control of your health?
            </h3>
            <p className="text-gray-600 mb-6">
              Sign up now and experience smarter healthcare with Prescripto.
            </p>
            <Link
              to="/register"
              className="inline-block bg-blue-700 text-white font-semibold px-6 py-3 rounded-full hover:bg-blue-800 transition duration-300"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
      {/* Who Can Use It */}
      <section className="bg-gray-100 py-20 px-6 text-center">
        <h2 className="text-3xl font-semibold mb-6">Who Is This For?</h2>
        <div className="flex flex-col md:flex-row justify-center gap-12">
          {users.map((user, i) => (
            <div
              key={i}
              className="bg-white shadow-md rounded-xl p-6 text-left w-80 hover:shadow-xl transition hover:-translate-y-1 duration-300"
            >
              <div className="flex justify-center mb-4">{user.icon}</div>
              <h4 className="text-xl font-bold mb-2 text-blue-700">
                {user.title}
              </h4>
              <p className="text-gray-600 text-sm">{user.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works - Detailed & Large */}
      <section className="bg-gray-50 py-24 px-6 min-h-[700px] text-center">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-blue-700 mb-16">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl shadow-lg p-10 hover:shadow-2xl transition duration-300">
              <div className="text-4xl mb-4 text-blue-600">📝</div>
              <h3 className="text-2xl font-semibold text-blue-700 mb-2">
                Step 1: Enter Your Symptoms
              </h3>
              <p className="text-gray-700 mb-4">
                Easily describe your symptoms using text or voice. Our intuitive
                input system understands natural language and supports multiple
                languages like Amharic.
              </p>
              <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                <li>Autocomplete symptom search</li>
                <li>Support for common and rare symptoms</li>
                <li>AI language model powered parsing</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl shadow-lg p-10 hover:shadow-2xl transition duration-300">
              <div className="text-4xl mb-4 text-blue-600">🤖</div>
              <h3 className="text-2xl font-semibold text-blue-700 mb-2">
                Step 2: AI-Powered Recommendations
              </h3>
              <p className="text-gray-700 mb-4">
                Our system analyzes your input and generates intelligent
                recommendations based on a vast medical dataset.
              </p>
              <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                <li>Predicts possible diseases</li>
                <li>Offers treatment suggestions</li>
                <li>Risk level indicator</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl shadow-lg p-10 hover:shadow-2xl transition duration-300">
              <div className="text-4xl mb-4 text-blue-600">💬📹</div>
              <h3 className="text-2xl font-semibold text-blue-700 mb-2">
                Step 3: Connect With Doctors
              </h3>
              <p className="text-gray-700 mb-4">
                Book secure, real-time video consultations or chat directly with
                verified doctors through our encrypted platform.
              </p>
              <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                <li>End-to-end encrypted chat</li>
                <li>HD video consultations</li>
                <li>Easy appointment booking & calendar sync</li>
              </ul>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-3xl shadow-lg p-10 hover:shadow-2xl transition duration-300">
              <div className="text-4xl mb-4 text-blue-600">📊</div>
              <h3 className="text-2xl font-semibold text-blue-700 mb-2">
                Step 4: Track Your Health
              </h3>
              <p className="text-gray-700 mb-4">
                Access your medical history, receive reminders, and follow up
                seamlessly — all in one dashboard.
              </p>
              <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                <li>Health history logs</li>
                <li>Follow-up recommendations</li>
                <li>Appointment reminders and notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      {/* Testimonials Slider */}
      <section className="bg-gray-100 dark:bg-gray-900 py-20 px-4 md:px-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-blue-700 dark:text-white mb-12">
            What Our Users Say
          </h2>
          <Slider {...settings}>
            {testimonials.map((testimonial, index) => (
              <div key={index} className="px-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 max-w-3xl mx-auto">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-500"
                    />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 italic mb-4">
                    “{testimonial.feedback}”
                  </p>
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-500" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </section>
    </div>
  );
};

export default Home;
