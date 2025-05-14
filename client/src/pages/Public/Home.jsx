import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { 
  ArrowRight, Check, Shield, Clock, Star, Calendar, 
  HeartPulse, X, ChevronRight, Play
} from "lucide-react";

const CureLogicHomepage = () => {
  const [symptomInput, setSymptomInput] = useState("");
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  
  // Sample data
  // const doctors = [
  //   { id: 1, name: "Dr. Alemnesh Kassahun", specialty: "Cardiology", rating: 4.9 },
  //   { id: 2, name: "Dr. Michael Getachew", specialty: "Pediatrics", rating: 4.8 },
  //   { id: 3, name: "Dr. Selamawit Y.", specialty: "Dermatology", rating: 4.7 },
  // ];

  const features = [
    { icon: Shield, title: "Verified Doctors", desc: "All specialists are licensed and vetted" },
    { icon: Clock, title: "24/7 Access", desc: "Get care anytime with telemedicine" },
    { icon: Calendar, title: "Instant Booking", desc: "Real-time availability matching" },
    { icon: HeartPulse, title: "AI Triage", desc: "Smart symptom assessment" }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Animated Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-50 py-28 overflow-hidden">
        {/* Background shapes */}
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
                NEW
              </span>
              <span className="text-sm">AI Symptom Checker now available</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </motion.div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Healthcare <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">reimagined</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              AI-powered medical guidance and seamless doctor appointments. 
              Precision care tailored just for you.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Start Symptom Check
                <ArrowRight className="inline ml-2 h-5 w-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsDemoOpen(true)}
                className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <Play className="h-5 w-5 text-blue-600" />
                Watch Demo
              </motion.button>
            </div>
          </motion.div>

          {/* Floating doctor illustration */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-16 flex justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-100 rounded-2xl blur-lg opacity-30"></div>
              <img 
                src="/doctor-illustration.svg" 
                alt="Doctor consultation" 
                className="relative w-full max-w-md"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works - Animated Steps */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium mb-4">
              SIMPLE PROCESS
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How CureLogic Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to better health
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-b from-white to-gray-50 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex items-center mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-xl mr-4">
                    {step}
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-blue-100 to-transparent"></div>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                  {index === 0 && "Describe Symptoms"}
                  {index === 1 && "Get Recommendations"}
                  {index === 2 && "Book Appointment"}
                </h3>
                <p className="text-gray-600">
                  {index === 0 && "Use our AI assistant to describe how you're feeling in natural language."}
                  {index === 1 && "Receive tailored suggestions for specialists and next steps."}
                  {index === 2 && "Schedule instantly with verified doctors in your area."}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Symptom Checker Preview */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="md:flex">
              <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white">
                <h3 className="text-2xl font-bold mb-3">AI Symptom Checker</h3>
                <p className="mb-6 opacity-90">
                  Get instant preliminary assessment based on your symptoms and medical history.
                </p>
                <ul className="space-y-3">
                  {["No wait times", "Privacy-first", "Evidence-based", "Doctor-reviewed"].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-5 w-5 mr-2 text-blue-200" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:w-1/2 p-8">
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Describe your symptoms
                  </label>
                  <textarea
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    placeholder="Example: Headache and fever for 2 days with nausea"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium"
                >
                  Analyze Symptoms
                </motion.button>
                <p className="text-sm text-gray-500 mt-3 text-center">
                  For full analysis, <a href="/signup" className="text-blue-600 hover:underline">create a free account</a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose CureLogic?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Healthcare designed around your needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
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

      {/* Demo Video Modal */}
      <AnimatePresence>
        {isDemoOpen && (
          <Dialog 
            open={isDemoOpen} 
            onClose={() => setIsDemoOpen(false)} 
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />

            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel
                as={motion.div}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-xl"
              >
                <div className="relative pt-[56.25%] bg-gray-900">
                  {/* Replace with actual video embed */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button 
                      onClick={() => setIsDemoOpen(false)}
                      className="absolute top-4 right-4 text-white hover:text-gray-200"
                    >
                      <X className="h-6 w-6" />
                    </button>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="h-6 w-6 text-white ml-1" />
                      </div>
                      <p className="text-white font-medium">Product Demo</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <Dialog.Title className="text-2xl font-bold text-gray-900 mb-2">
                    CureLogic Platform Demo
                  </Dialog.Title>
                  <p className="text-gray-600 mb-4">
                    See how our platform helps patients find the right care quickly and easily.
                  </p>
                  <button
                    onClick={() => setIsDemoOpen(false)}
                    className="px-6 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CureLogicHomepage;