import React from "react"
import { useLocation, useParams } from "react-router-dom"
import PublicNavbar from "../components/PublicNavbar"
import careersHero from "../assets/IMG-20250919-WA0005.png"
import funnelImage from "../assets/Funnel.jpeg"
import timesheetImage from "../assets/Timesheet and resources.jpeg"
import invoicingBudgetImage from "../assets/Invoice and budget.jpeg"
import budgetManagementImage from "../assets/budgetmanagement1.png"
import budgetManagementFeatureImage from "../assets/image.png"
import salesOpportunityImage from "../assets/sales and oppurtuity.jpeg"
import serviceManagementImage from "../assets/Service management.jpeg"
import accessManagementImage from "../assets/Access management.png"
import itConsultingImage from "../assets/IT Consulting – Technical & Program Management.jpeg"
import staffAugmentationImage from "../assets/Staff augmentation.png"
import scrumAgileImage from "../assets/Scrum Agile facility.jpeg"

const PAGES = {
  products: {
    "requirements-funnel-management": {
      title: "Requirements/Funnel Management",
      subtitle: "Capture, prioritize, and track business needs from idea to delivery.",
      bannerImage: funnelImage,
      sections: [
        {
          heading: "Overview",
          body: [
            "We provide Requirements and Funnel Management services to help organizations capture, prioritize, and track business needs from idea to delivery. Our approach ensures clear visibility, structured decision-making, and alignment between business and technology teams.",
          ],
        },
      ],
    },
    "timesheet-resource-management": {
      title: "Timesheet/resource Management",
      subtitle: "Track effort, optimize utilization, and improve project visibility.",
      bannerImage: timesheetImage,
      sections: [
        {
          heading: "Overview",
          body: [
            "We provide Timesheet and Resource Management services that help organizations track effort, optimize resource utilization, and improve project visibility. Our solutions ensure accurate time capture, better capacity planning, and informed decision-making.",
          ],
        },
      ],
    },
    "invoicing-budget-management": {
      title: "Invoicing & Budget Management",
      subtitle: "Track costs, manage budgets, and generate accurate invoices with confidence.",
      bannerImage: invoicingBudgetImage,
      sections: [
        {
          heading: "Overview",
          body: [
            "We provide Invoicing and Budget Management services that help organizations track costs, manage budgets, and generate accurate invoices with confidence. Our solutions improve financial visibility, control spending, and support timely billing.",
          ],
        },
      ],
    },
    "budget-management": {
      title: "Budget Management",
      subtitle: "Effective financial governance across projects and initiatives.",
      bannerImage: budgetManagementImage,
      sections: [
        {
          heading: "Overview",
          body: [
            "Our Budget Management services enable effective financial governance across projects and initiatives. We help you monitor spend, manage forecasts, and align budgets with business priorities.",
          ],
          image: budgetManagementFeatureImage,
          imagePosition: "right",
        },
      ],
    },
    "sales-opportunity": {
      title: "Sales & Opportunity",
      subtitle: "Manage leads, pipelines, and revenue opportunities effectively.",
      bannerImage: salesOpportunityImage,
      sections: [
        {
          heading: "Overview",
          body: [
            "We provide Sales and Opportunity Management services that help organizations effectively manage leads, pipelines, and revenue opportunities. Our solutions improve visibility, prioritize high-value deals, and support consistent sales growth.",
          ],
        },
      ],
    },
    "service-management": {
      title: "Service Management",
      subtitle: "Centralized control over service operations, requests, and performance.",
      bannerImage: serviceManagementImage,
      sections: [
        {
          heading: "Overview",
          body: [
            "Our Service Management services enable centralized control over service operations, requests, and performance. We help businesses enforce processes, meet service-level commitments, and continuously improve service outcomes.",
          ],
        },
      ],
    },
    "access-management": {
      title: "Access Management",
      subtitle: "Control access with roles, permissions, and secure governance.",
      bannerImage: accessManagementImage,
      sections: [
        {
          heading: "Overview",
          body: [
            "Our Access Management feature empowers organizations to maintain complete control over who can view, edit, and manage critical resources within the platform. Designed with both security and simplicity in mind, it ensures that the right people have the right level of access at the right time.",
          ],
        },
        {
          heading: "Key Features",
          body: [
            "Granular Permissions: Assign roles and permissions tailored to specific teams, projects, or individuals.",
            "Centralized Control: Manage all user access from a single, intuitive dashboard.",
            "Scalable Security: Whether you're a growing startup or a large enterprise, our system adapts to your needs without compromising safety.",
            "Audit & Compliance: Track user activity with detailed logs to meet regulatory requirements and strengthen accountability.",
          ],
          asList: true,
        },
        {
          heading: "Benefits",
          body: [
            "By combining robust security with ease of use, our Access Management feature helps safeguard sensitive data while enabling collaboration across your organization.",
          ],
        },
      ],
    },
  },
  services: {
    "it-consulting": {
      title: "IT Consulting – Technical & Program Management",
      subtitle: "Technical leadership and program management for complex initiatives.",
      bannerImage: itConsultingImage,
      sections: [
        {
          heading: "Overview",
          body: [
            "We provide IT consulting services covering technical leadership and program management to help organizations deliver complex initiatives successfully. Our experts align technology, processes, and teams to ensure predictable execution and measurable outcomes.",
          ],
        },
      ],
    },
    "staff-augmentation": {
      title: "Staff Augmentation",
      subtitle: "Access qualified technical and functional talent when you need it most.",
      bannerImage: staffAugmentationImage,
      sections: [
        {
          heading: "Overview",
          body: [
            "Our Staff Augmentation services give you access to qualified technical and functional talent when you need it most. We help you bridge skill gaps, manage workloads, and maintain momentum across critical initiatives.",
          ],
        },
      ],
    },
    "scrum-agile": {
      title: "Scrum-Agile",
      subtitle: "Deliver high-quality solutions faster and with greater flexibility.",
      bannerImage: scrumAgileImage,
      sections: [
        {
          heading: "Overview",
          body: [
            "We provide Scrum and Agile services to help organizations deliver high-quality solutions faster and with greater flexibility. Our experts support Agile adoption, Scrum execution, and continuous improvement across teams.",
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
        <div className="relative h-[480px] sm:h-[540px] md:h-[580px] overflow-hidden">
          <img src={page.bannerImage || careersHero} alt={page.title} className="absolute inset-0 w-full h-full object-cover object-center blur-[2px]" />
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
                {section.image ? (
                  <div className={`flex flex-col ${section.imagePosition === 'right' ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 items-center`}>
                    <div className={`flex-1 ${section.imagePosition === 'right' ? 'lg:pr-8' : 'lg:pl-8'}`}>
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
                    <div className={`flex-1 ${section.imagePosition === 'right' ? 'lg:pl-8' : 'lg:pr-8'} flex justify-center`}>
                      <img 
                        src={section.image} 
                        alt={section.heading} 
                        className="w-full max-w-md rounded-lg shadow-lg object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

