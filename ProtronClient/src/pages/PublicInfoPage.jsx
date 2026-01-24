import React from "react"
import { useLocation, useParams } from "react-router-dom"
import PublicNavbar from "../components/PublicNavbar"
import careersHero from "../assets/IMG-20250919-WA0005.jpg"

const PAGES = {
  products: {
    "projects-program-management": {
      title: "Projects/Program Management",
      subtitle: "Plan, execute, and deliver with clarity and control.",
      sections: [
        {
          heading: "Overview",
          body: [
            "End-to-end project and program management built for modern delivery teams.",
            "Track requirements, manage resources, and stay on top of budgets — all in one place.",
          ],
        },
        {
          heading: "Capabilities",
          body: [
            "Requirements/Funnel Management",
            "Timesheet/resource Management",
            "Invoicing & Budget Management",
            "Budget Management",
          ],
          asList: true,
        },
      ],
    },
    "requirements-funnel-management": {
      title: "Requirements/Funnel Management",
      subtitle: "Capture, prioritize, and track requirements from idea to delivery.",
      sections: [
        {
          heading: "Overview",
          body: [
            "Centralize demand intake and convert ideas into structured requirements.",
            "Manage prioritization, visibility, and readiness across stakeholders and delivery teams.",
          ],
        },
      ],
    },
    "timesheet-resource-management": {
      title: "Timesheet/resource Management",
      subtitle: "Track time and utilization with clear capacity visibility.",
      sections: [
        {
          heading: "Overview",
          body: [
            "Accurate timesheets, approvals, and reporting for billable and non-billable work.",
            "Resource allocation and utilization insights to balance workloads and improve delivery predictability.",
          ],
        },
      ],
    },
    "invoicing-budget-management": {
      title: "Invoicing & Budget Management",
      subtitle: "Keep billing and budgets aligned with delivery.",
      sections: [
        {
          heading: "Overview",
          body: [
            "Generate invoices based on tracked effort and milestones.",
            "Monitor budgets in real time to reduce leakage, improve forecasting, and ensure compliance.",
          ],
        },
      ],
    },
    "budget-management": {
      title: "Budget Management",
      subtitle: "Plan, track, and control budgets with confidence.",
      sections: [
        {
          heading: "Overview",
          body: [
            "Track planned vs actual spend and keep stakeholders informed.",
            "Spot overruns early with clear reporting and governance-friendly controls.",
          ],
        },
      ],
    },
    "sales-opportunity": {
      title: "Sales & Opportunity",
      subtitle: "Turn leads into wins with a streamlined opportunity pipeline.",
      sections: [
        {
          heading: "What you get",
          body: [
            "Capture leads, qualify opportunities, and track deal progress from start to close.",
            "Improve forecast accuracy with clear visibility into pipeline health and conversion stages.",
          ],
        },
      ],
    },
    "service-management": {
      title: "Service Management",
      subtitle: "Deliver reliable services with SLAs, workflows, and accountability.",
      sections: [
        {
          heading: "What you get",
          body: [
            "Organize service requests, track work items, and enforce SLAs across teams.",
            "Create repeatable workflows for faster resolution and better customer outcomes.",
          ],
        },
      ],
    },
    "access-management": {
      title: "Access Management",
      subtitle: "Control access with roles, permissions, and secure governance.",
      sections: [
        {
          heading: "Overview",
          body: [
            "Define roles and permissions to ensure users only access what they need.",
            "Support auditability and stronger security posture across teams and applications.",
          ],
        },
      ],
    },
  },
  services: {
    "it-consulting": {
      title: "IT Consulting – Technical & Program Management",
      subtitle: "Expert guidance for technical execution and program governance.",
      sections: [
        {
          heading: "How we help",
          body: [
            "Architecture, delivery planning, and execution support for complex programs.",
            "Hands-on program management to keep timelines, scope, and stakeholders aligned.",
          ],
        },
      ],
    },
    "staff-augmentation": {
      title: "Staff Augmentation",
      subtitle: "Add the right talent to your team—fast.",
      sections: [
        {
          heading: "How we help",
          body: [
            "Flexible staffing to scale up delivery without long hiring cycles.",
            "Role-aligned professionals who integrate smoothly with your tools and process.",
          ],
        },
      ],
    },
    "scrum-agile": {
      title: "Scrum-Agile",
      subtitle: "Adopt Agile practices that improve delivery speed and quality.",
      sections: [
        {
          heading: "How we help",
          body: [
            "Scrum/Agile coaching, ceremonies enablement, and delivery metrics.",
            "Practical ways to improve predictability, collaboration, and continuous improvement.",
          ],
        },
      ],
    },
  },
}

export default function PublicInfoPage() {
  const { slug } = useParams()
  const location = useLocation()

  const category = location.pathname.startsWith("/products/")
    ? "products"
    : location.pathname.startsWith("/services/")
      ? "services"
      : undefined

  const page = PAGES?.[category]?.[slug]

  if (!page) {
    return (
      <div className="min-h-screen bg-white">
        <PublicNavbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8">
            <div className="text-2xl font-bold text-gray-900">Page not found</div>
            <div className="text-gray-600 mt-2">The page you are looking for doesn’t exist.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Banner */}
      <section className="relative">
        <div className="relative h-[320px] sm:h-[380px] overflow-hidden">
          <img src={careersHero} alt={page.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative h-full flex items-center justify-center px-4">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">{page.title}</h1>
              {page.subtitle && <div className="text-white/90 mt-4 text-lg sm:text-xl">{page.subtitle}</div>}
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-20 bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <div className="divide-y divide-gray-200">
            {page.sections.map((section) => (
              <div key={section.heading} className="py-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{section.heading}</h2>
                {section.asList ? (
                  <ul className="list-disc pl-6 space-y-2 text-gray-700 text-lg">
                    {section.body.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-3 text-gray-700 text-lg leading-relaxed">
                    {section.body.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

