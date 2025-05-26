import React, { useState } from 'react'
import { motion } from 'framer-motion';
import { HeartPulse, Shield, Clock, Users, ChevronRight } from 'lucide-react';
import Footer from '@/components/Footer';

const aboutFeatures = [
  {
    icon: HeartPulse,
    title: 'Patient-Centered Care',
    desc: 'We put your health and comfort first, always.'
  },
  {
    icon: Shield,
    title: 'Trusted & Secure',
    desc: 'Your privacy and data are protected with industry-leading security.'
  },
  {
    icon: Clock,
    title: '24/7 Access',
    desc: 'Get support and care anytime, anywhere.'
  },
  {
    icon: Users,
    title: 'Expert Team',
    desc: 'Our doctors and staff are highly qualified and compassionate.'
  }
];

const faqs = [
  {
    question: 'What is CureLogic?',
    answer: 'CureLogic is a digital healthcare platform that connects patients with trusted doctors and provides smart, accessible care.'
  },
  {
    question: 'How do I book an appointment?',
    answer: 'Simply sign up, search for a doctor or specialty, and book an appointment instantly through our platform.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we use industry-leading security measures to protect your personal and medical information.'
  },
  {
    question: 'Can I access CureLogic 24/7?',
    answer: 'Absolutely! Our platform and support are available around the clock.'
  }
];

function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden"
        >
          <button
            className="w-full flex justify-between items-center px-6 py-4 text-left text-lg font-medium text-gray-900 focus:outline-none hover:bg-blue-50 transition-all"
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            aria-expanded={openIdx === idx}
          >
            <span>{faq.question}</span>
            <ChevronRight className={`h-6 w-6 transform transition-transform duration-300 ${openIdx === idx ? 'rotate-90 text-blue-600' : 'text-gray-400'}`} />
          </button>
          <div
            className={`px-6 pb-4 text-gray-700 text-base transition-all duration-300 ${openIdx === idx ? 'block' : 'hidden'}`}
          >
            {faq.answer}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-50 py-20 overflow-hidden">
        <motion.div 
          initial={{ x: -100, y: -100, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 0.1 }}
          transition={{ duration: 1 }}
          className="absolute -left-20 -top-20 w-96 h-96 rounded-full bg-blue-200 blur-3xl"
        />
        <motion.div 
          initial={{ x: 100, y: 100, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 0.1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-indigo-200 blur-3xl"
        />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm mb-6"
            >
              <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                ABOUT US
              </span>
              <span className="text-sm">Empowering Health, Empowering You</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Story</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              CureLogic is on a mission to make healthcare accessible, personalized, and seamless for everyone. Discover our journey and values below.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            {/* Mission Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7 }}
              whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(59,130,246,0.15)' }}
              className="flex-1 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl shadow-lg p-8 text-center border-t-4 border-blue-500 hover:shadow-2xl transition-all"
            >
              <HeartPulse className="mx-auto h-10 w-10 text-blue-600 mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold text-blue-700 mb-2">Our Mission</h2>
              <p className="text-gray-700 text-lg mb-2">
                To revolutionize healthcare by connecting patients with trusted professionals and smart technology, ensuring everyone receives the care they deserve.
              </p>
            </motion.div>
            {/* Vision Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: 0.2 }}
              whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(99,102,241,0.15)' }}
              className="flex-1 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl shadow-lg p-8 text-center border-t-4 border-indigo-500 hover:shadow-2xl transition-all"
            >
              <Shield className="mx-auto h-10 w-10 text-indigo-600 mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-indigo-700 mb-2">Our Vision</h2>
              <p className="text-gray-700 text-lg mb-2">
                A world where quality healthcare is just a click away—personal, secure, and always available.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features/Values Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose CureLogic?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We blend technology and compassion to deliver the best care experience.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {aboutFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -5, scale: 1.03 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story / Team Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-600">
              Our passionate team of doctors, engineers, and innovators is dedicated to making healthcare better for all.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[{
              name: 'Dr. Hana Mekonnen',
              role: 'Chief Medical Officer',
              img: '/doctor_profile_image.jpg',
              desc: 'Leading our clinical vision with 15+ years of experience.'
            }, {
              name: 'Samuel Tadesse',
              role: 'Lead Engineer',
              img: '/vite.svg',
              desc: 'Building secure, scalable, and user-friendly technology.'
            }, {
              name: 'Lily Assefa',
              role: 'Patient Success Lead',
              img: '/doctor_profile_image.jpg',
              desc: 'Ensuring every patient feels heard and cared for.'
            }].map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-md flex flex-col items-center text-center hover:shadow-xl transition-all"
              >
                <img src={member.img} alt={member.name} className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-blue-100 shadow" />
                <h4 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h4>
                <span className="text-blue-600 font-medium mb-2">{member.role}</span>
                <p className="text-gray-600 text-sm">{member.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Find answers to common questions about CureLogic and our services.</p>
          </motion.div>
          <FAQAccordion />
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Ready to experience the future of healthcare?
          </motion.h2>
          <motion.a
            href="/contact"
            whileHover={{ scale: 1.05 }}
            className="inline-block mt-4 px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition-all"
          >
            Contact Us
          </motion.a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;