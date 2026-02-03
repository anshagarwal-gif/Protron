
"use client"

import React from "react"
import { useState } from "react"
import { Users, CheckCircle, Zap, ArrowRight, Shield, Globe, TrendingUp, Award, MessageSquare } from "lucide-react"
import { useNavigate } from "react-router-dom"
import PublicNavbar from "../components/PublicNavbar"
import dstGlobalLogo from "../assets/DST Global logo.png"

export default function ProjectMatricsLanding() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    message: "",
  })
  const [status, setStatus] = useState("")

  const handleStartedClick = () => {
    navigate("/login")
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "")
      setFormData({ ...formData, [name]: digitsOnly })
      return
    }
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus("Sending...")

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8282"
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.text()
      if (response.ok) {
        setStatus("Message sent successfully!")
        setFormData({ name: "", companyName: "", email: "", phone: "", message: "" })
      } else {
        setStatus(result || "Failed to send message. Please try again.")
      }
    } catch (error) {
      console.error(error)
      setStatus("An error occurred. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      <section id="home" className="relative h-[calc(100vh-80px)] min-h-[520px] w-full bg-gray-100" />

      {/* About Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-green-200 text-green-700 rounded-full text-sm font-semibold mb-6">
              <Award className="h-4 w-4 mr-2" />
              About DST Global
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built on Trust,
              <span className="block text-green-500">Designed for Delivery</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              DST Global helps teams plan, track, and deliver projects with clear visibility into time, cost, and
              outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-green-50 rounded-3xl p-8 border border-green-100 shadow-lg">
              <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Security & Compliance</h3>
              <p className="text-gray-700 leading-relaxed">
                Enterprise-ready controls and reliability so your teams can move fast without losing governance.
              </p>
            </div>

            <div className="bg-green-50 rounded-3xl p-8 border border-green-100 shadow-lg">
              <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time Insights</h3>
              <p className="text-gray-700 leading-relaxed">
                Understand performance as it happens — spot risks early and keep delivery on track.
              </p>
            </div>

            <div className="bg-green-50 rounded-3xl p-8 border border-green-100 shadow-lg">
              <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Built for Scale</h3>
              <p className="text-gray-700 leading-relaxed">
                From small teams to global organizations — DST Global grows with your delivery needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-green-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-green-500 opacity-10">
          <div
            className="absolute top-10 left-10 w-32 h-32 border-2 border-white/20 rounded-full animate-spin"
            style={{ animationDuration: "20s" }}
          ></div>
          <div
            className="absolute bottom-10 right-10 w-24 h-24 border-2 border-white/20 rounded-full animate-spin"
            style={{ animationDuration: "15s", animationDirection: "reverse" }}
          ></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white/10 rounded-full animate-pulse"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center px-6 py-3 bg-white/20 text-white rounded-full text-sm font-semibold mb-8">
            <Zap className="h-4 w-4 mr-2" />
            Join 150,000+ Teams Worldwide
          </div>

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Transform Your Project Management?
          </h2>
          <p className="text-xl text-green-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            Start your free 14-day trial today. No credit card required. Experience the future of project management
            with AI-powered insights and automation.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <button className="group bg-white text-green-700 px-12 py-5 rounded-2xl text-lg font-bold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center">
              Start Free Trial Today
              <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-12 py-5 border-2 border-white text-white rounded-2xl text-lg font-bold hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
              Schedule Live Demo
            </button>
          </div>

          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">14 Days</div>
              <div className="text-green-200 text-sm">Free Trial</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">No Setup</div>
              <div className="text-green-200 text-sm">Ready in Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">24/7</div>
              <div className="text-green-200 text-sm">Expert Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gradient-to-b from-green-50 via-white to-green-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-green-200 text-green-700 rounded-full text-sm font-semibold mb-6">
              <MessageSquare className="h-4 w-4 mr-2" />
              Get in Touch
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Let's Start a<span className="block text-green-500">Conversation</span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Have questions about Project Matrics? Our team is here to help you find the perfect solution for your
              needs.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-stretch">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-green-100 h-full">
              <form onSubmit={handleSubmit} className="h-full flex flex-col">
                <div className="space-y-6 flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-700 font-semibold mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:outline-none transition-colors placeholder:text-gray-400"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 font-semibold mb-2">Company Name</label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:outline-none transition-colors placeholder:text-gray-400"
                        placeholder="Enter your company name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:outline-none transition-colors placeholder:text-gray-400"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Phone Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:outline-none transition-colors placeholder:text-gray-400"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 font-semibold mb-2">How can I help you?</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="6"
                      required
                      className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:outline-none transition-colors resize-none placeholder:text-gray-400 min-h-[160px]"
                      placeholder="How can I help you?"
                    ></textarea>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="group w-full bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    Send Message
                    <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  {status && (
                    <p
                      className={`text-center font-semibold mt-4 ${status.includes("success") ? "text-green-600" : "text-red-600"}`}
                    >
                      {status}
                    </p>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl border border-green-100 h-full flex flex-col">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Get Started Today</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-sm">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Free 14-Day Trial</div>
                      <div className="text-gray-600">No credit card required</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Expert Onboarding</div>
                      <div className="text-gray-600">Dedicated setup assistance</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-sm">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">24/7 Support</div>
                      <div className="text-gray-600">Always here when you need us</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-2xl p-6 border border-green-100 mt-10">
                <h4 className="font-bold text-gray-900 mb-4">Contact Information</h4>
                <div className="space-y-3 text-gray-600">
                  <p className="flex items-center">
                    <span className="mr-3">📧</span>
                    contact@deepspheretech.com
                  </p>
                  <p className="flex items-center">
                    <span className="mr-3">📞</span>
                    +91-9960 012 274
                  </p>
                  <p className="flex items-center">
                    <span className="mr-3">📍</span>
                    Magarpatta City, Pune, Maharastra, India 411028
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <img src={dstGlobalLogo} alt="DST Global" className="h-12 w-auto mr-3" />
                <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  DST Global
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">DST Global Pvt Ltd</p>
              <div className="text-gray-400">
                <p className="mb-2">📧 contact@deepspheretech.com</p>
                <p className="mb-2">📞 +91-9960 012 274</p>
                <p>📍 Magarpatta City, Pune, Maharastra, India 411028</p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-green-400">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Products
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-green-400">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/careers" className="hover:text-green-400 transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">© 2025 Project Matrics. All rights reserved.</p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-green-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-green-400 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-green-400 transition-colors">
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
