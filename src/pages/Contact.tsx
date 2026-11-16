import { Navbar, Footer } from "@/components";

export default function Contact() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container-page py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h1>
          <p className="text-gray-600 leading-relaxed mb-8">
            Have questions about your appointment or account? Reach out to us and we will get back to you shortly.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card p-8">
              <h3 className="font-semibold text-gray-900 mb-4">Clinic Details</h3>
              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">📍</span>
                  Patient Clinic, 123 Medical Street, Mumbai, India
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">📞</span>
                  +91 98765 43210
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">✉</span>
                  support@patientclinic.in
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">🕒</span>
                  Mon - Sat, 9:00 AM - 6:00 PM
                </li>
              </ul>
            </div>
            <div className="card p-8">
              <h3 className="font-semibold text-gray-900 mb-4">Send a message</h3>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="label">Full name</label>
                  <input type="text" className="input" required />
                </div>
                <div>
                  <label className="label">Email address</label>
                  <input type="email" className="input" required />
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea className="input" rows={4} required />
                </div>
                <button type="submit" className="btn-primary w-full py-3">Send message</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
