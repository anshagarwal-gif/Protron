import React from "react"
import PublicNavbar from "../components/PublicNavbar"
import bannerImage from "../assets/IMG-20250919-WA0005.jpg"

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Banner */}
      <section className="relative">
        <div className="relative h-[320px] sm:h-[380px] overflow-hidden">
          <img src={bannerImage} alt="About Us" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative h-full flex items-center justify-center px-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight">About Us</h1>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-20 bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
            <p>
              DST Global is a technology-driven startup specializing in the design, development, customization,
              implementation, and lifecycle management of advanced software solutions and digital systems. We deliver
              end-to-end technology services across enterprise software, information technology infrastructure, digital
              platforms, artificial intelligence and machine learning solutions, automation technologies, cloud-based
              systems, and scalable web and mobile applications.
            </p>
            <p>
              Our expertise spans enterprise system integration, IT consulting, digital transformation initiatives,
              project and program management, data-driven application development, managed services, and ongoing
              technical support. We partner closely with organizations to enhance operational efficiency, strengthen
              security frameworks, enable scalability, and drive measurable business performance improvements.
            </p>
            <p>
              At DST Global, we collaborate with enterprises, institutions, and organizations to deliver intelligent,
              reliable, and future-ready technology solutions. Our work is guided by a strong commitment to integrity,
              transparency, innovation, and a customer-centric approach—ensuring that every solution aligns with
              strategic business objectives and long-term growth.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

