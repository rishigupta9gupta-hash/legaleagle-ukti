import React, { useState } from "react";
import {
  ArrowRight,
  Send,
  CheckCircle,
  Loader2,
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const USE_CASES = [
  {
    title: "For Platform Integration (API)",
    description:
      "Seamlessly add our live interview simulation to your product using API, Widget, or LMS toolkit.",
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600",
    link: "#",
  },
  {
    title: "For Colleges and Universities",
    description:
      "Prepare your students for their upcoming job/internship interviews, career fairs, and campus placements.",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600",
    link: "#",
  },
  {
    title: "For Recruiters",
    description:
      "Get connected to job seekers who go the extra mile in job preparation and verify skills effectively.",
    image:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=600",
    link: "#",
  },
  {
    title: "For Schools",
    description:
      "Help students improve their learning capabilities with the help of conversational AI tutors.",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600",
    link: "#",
  },
];

export default function ContactUs() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        location: "",
        message: "",
      });
    }, 1500);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-6 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                Use Cases
              </h1>
              <a
                href="#"
                className="text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center gap-1"
              >
                More <ArrowRight size={16} />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {USE_CASES.map((item, index) => (
                <div
                  key={index}
                  className="group relative h-80 rounded-2xl overflow-hidden shadow-lg cursor-pointer"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-60 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-zinc-300 text-sm mb-4">
                      {item.description}
                    </p>
                    <span className="text-white font-semibold text-sm border-b border-white">
                      Learn More
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Info */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Info icon={<MapPin size={20} />} title="Headquarters" text="Uttar Pradesh, India" />
              <Info icon={<Mail size={20} />} title="Email Us" text="sanginitripathi28@gmail.com" />
              <Info icon={<Phone size={20} />} title="Call Us" text="+1 (555) 123-4567" />
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
              {submitted ? (
                <div className="text-center py-12">
                  <CheckCircle size={40} className="mx-auto text-green-500 mb-4" />
                  <h3 className="text-xl font-bold">Message Sent!</h3>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-purple-600 mt-4"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {["firstName", "lastName", "email", "phone", "location"].map(
                    (field) => (
                      <input
                        key={field}
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        placeholder={field}
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    )
                  )}
                  <textarea
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin mx-auto" />
                    ) : (
                      "SUBMIT"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ icon, title, text }) {
  return (
    <div className="flex items-center gap-3 text-zinc-600">
      <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-full">
        {icon}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm">{text}</div>
      </div>
    </div>
  );
}
