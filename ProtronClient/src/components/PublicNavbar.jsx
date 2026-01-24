import React from "react"
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import dstGlobalLogo from "../assets/DST Global logo.png"

const productItems = [
  {
    label: "Projects/Program Management",
    to: "/products/projects-program-management",
    children: [
      { label: "Requirements/Funnel Management", to: "/products/requirements-funnel-management" },
      { label: "Timesheet/resource Management", to: "/products/timesheet-resource-management" },
      { label: "Invoicing & Budget Management", to: "/products/invoicing-budget-management" },
      { label: "Budget Management", to: "/products/budget-management" },
    ],
  },
  { label: "Sales & Opportunity", to: "/products/sales-opportunity" },
  { label: "Service Management", to: "/products/service-management" },
  { label: "Access Management", to: "/products/access-management" },
]

const serviceItems = [
  { label: "IT Consulting – Technical & Program Management", to: "/services/it-consulting" },
  { label: "Staff Augmentation", to: "/services/staff-augmentation" },
  { label: "Scrum-Agile", to: "/services/scrum-agile" },
]

export default function PublicNavbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [mobileProductsOpen, setMobileProductsOpen] = React.useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = React.useState(false)
  const [mobileProjectsOpen, setMobileProjectsOpen] = React.useState(false)

  const isLanding = location.pathname === "/landing"
  const isCareers = location.pathname === "/careers"
  const isAbout = location.pathname === "/about"

  const landingHref = (hash) => (isLanding ? hash : `/landing${hash}`)

  const goLanding = (hash) => (e) => {
    if (!isLanding) e.preventDefault()
    setIsMenuOpen(false)
    setMobileProductsOpen(false)
    setMobileServicesOpen(false)
    navigate(`/landing${hash}`)
  }

  const goTo = (to) => (e) => {
    e.preventDefault()
    setIsMenuOpen(false)
    setMobileProductsOpen(false)
    setMobileServicesOpen(false)
    navigate(to)
  }

  const handleStartedClick = () => {
    setIsMenuOpen(false)
    setMobileProductsOpen(false)
    setMobileServicesOpen(false)
    navigate("/login")
  }

  return (
    <nav className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-green-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <a href="/landing" onClick={goLanding("#home")} className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img src={dstGlobalLogo} alt="DST Global" className="h-12 w-auto mr-4" />
              <div>
                <span className="text-2xl font-bold text-gray-900">DST Global</span>
                <div className="text-xs text-green-600 font-medium">Value with trust</div>
              </div>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <a
              href={landingHref("#home")}
              onClick={isLanding ? undefined : goLanding("#home")}
              className="text-gray-700 hover:text-green-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-green-50"
            >
              Home
            </a>

            {/* Products dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="text-gray-700 hover:text-green-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-green-50 inline-flex items-center gap-2"
              >
                Products <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 top-full pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                <div className="w-[360px] bg-white rounded-2xl shadow-2xl border border-green-100 overflow-visible">
                  {productItems.map((item) =>
                    item.children ? (
                      <div key={item.to} className="relative">
                        <a
                          href={item.to}
                          onClick={goTo(item.to)}
                          className="peer w-full flex items-center justify-between px-5 py-4 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors font-medium"
                        >
                          <span>{item.label}</span>
                          <ChevronRight className="h-4 w-4" />
                        </a>
                        <div className="absolute top-0 left-full pl-2 z-50 opacity-0 pointer-events-none transition-opacity peer-hover:opacity-100 peer-hover:pointer-events-auto hover:opacity-100 hover:pointer-events-auto">
                          <div className="w-[360px] bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden">
                            {item.children.map((child) => (
                              <a
                                key={child.to}
                                href={child.to}
                                onClick={goTo(child.to)}
                                className="block px-5 py-4 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors font-medium"
                              >
                                {child.label}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <a
                        key={item.to}
                        href={item.to}
                        onClick={goTo(item.to)}
                        className="block px-5 py-4 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors font-medium"
                      >
                        {item.label}
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Services dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="text-gray-700 hover:text-green-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-green-50 inline-flex items-center gap-2"
              >
                Services <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 top-full pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                <div className="w-[360px] bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden">
                  {serviceItems.map((item) => (
                    <a
                      key={item.to}
                      href={item.to}
                      onClick={goTo(item.to)}
                      className="block px-5 py-4 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors font-medium"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <a
              href="/careers"
              onClick={goTo("/careers")}
              className={`transition-colors px-3 py-2 rounded-lg font-medium ${
                isCareers ? "text-green-600 bg-green-50 font-semibold" : "text-gray-700 hover:text-green-600 hover:bg-green-50"
              }`}
            >
              Careers
            </a>

            <a
              href="/about"
              onClick={goTo("/about")}
              className={`transition-colors px-3 py-2 rounded-lg font-medium ${
                isAbout ? "text-green-600 bg-green-50 font-semibold" : "text-gray-700 hover:text-green-600 hover:bg-green-50"
              }`}
            >
              About Us
            </a>

            <div className="flex items-center space-x-3">
              <a
                href={landingHref("#contact")}
                onClick={isLanding ? undefined : goLanding("#contact")}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get in touch
              </a>
              <button
                onClick={handleStartedClick}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-green-600 transition-colors p-2 rounded-lg hover:bg-green-50"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white/98 backdrop-blur-xl border-t border-green-100">
          <div className="px-4 pt-4 pb-6 space-y-2">
            <a
              href={landingHref("#home")}
              onClick={isLanding ? () => setIsMenuOpen(false) : goLanding("#home")}
              className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
            >
              Home
            </a>

            {/* Mobile Products */}
            <button
              type="button"
              onClick={() => {
                setMobileProductsOpen((v) => !v)
                setMobileServicesOpen(false)
                setMobileProjectsOpen(false)
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
            >
              <span>Products</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileProductsOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileProductsOpen && (
              <div className="pl-4 space-y-1">
                {productItems.map((item) =>
                  item.children ? (
                    <div key={item.to}>
                      <button
                        type="button"
                        onClick={() => setMobileProjectsOpen((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
                      >
                        <span>{item.label}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${mobileProjectsOpen ? "rotate-180" : ""}`} />
                      </button>
                      {mobileProjectsOpen && (
                        <div className="pl-4 space-y-1">
                          {item.children.map((child) => (
                            <a
                              key={child.to}
                              href={child.to}
                              onClick={goTo(child.to)}
                              className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
                            >
                              {child.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <a
                      key={item.to}
                      href={item.to}
                      onClick={goTo(item.to)}
                      className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
                    >
                      {item.label}
                    </a>
                  )
                )}
              </div>
            )}

            {/* Mobile Services */}
            <button
              type="button"
              onClick={() => {
                setMobileServicesOpen((v) => !v)
                setMobileProductsOpen(false)
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
            >
              <span>Services</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileServicesOpen && (
              <div className="pl-4 space-y-1">
                {serviceItems.map((item) => (
                  <a
                    key={item.to}
                    href={item.to}
                    onClick={goTo(item.to)}
                    className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}

            <a
              href="/careers"
              onClick={goTo("/careers")}
              className={`block px-4 py-3 rounded-lg transition-colors font-medium ${
                isCareers ? "text-green-600 bg-green-50 font-semibold" : "text-gray-700 hover:text-green-600 hover:bg-green-50"
              }`}
            >
              Careers
            </a>

            <a
              href="/about"
              onClick={goTo("/about")}
              className={`block px-4 py-3 rounded-lg transition-colors font-medium ${
                isAbout ? "text-green-600 bg-green-50 font-semibold" : "text-gray-700 hover:text-green-600 hover:bg-green-50"
              }`}
            >
              About Us
            </a>

            <div className="pt-4 space-y-2">
              <a
                href={landingHref("#contact")}
                onClick={isLanding ? () => setIsMenuOpen(false) : goLanding("#contact")}
                className="block w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg text-center"
              >
                Get in touch
              </a>
              <button
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                onClick={handleStartedClick}
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

