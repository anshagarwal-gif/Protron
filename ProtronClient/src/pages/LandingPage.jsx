
"use client"

import React from "react"
import { useState } from "react"
import {
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  Calendar,
  BarChart3,
  Target,
  Zap,
  ArrowRight,
  Menu,
  X,
  Star,
  Play,
  Shield,
  Globe,
  Smartphone,
  TrendingUp,
  Award,
  Layers,
  Database,
  Settings,
  MessageSquare,
  ChevronRight,
  Building,
  Code,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import dashboard from "../assets/dashboard.png"
import budgetmanagement from "../assets/budgetmanagement.png"
import timesheet from "../assets/timesheet.png"
import usermanagement from "../assets/usermanagement.png"
import projectmanagement from "../assets/projectmanagement.png"

export default function ProjectMatricsLanding() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [activeFeature, setActiveFeature] = React.useState(0)
  const [activeTestimonial, setActiveTestimonial] = React.useState(0)
  const [activePricingPeriod, setActivePricingPeriod] = React.useState("monthly")
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [status, setStatus] = useState("")

  const handleSignInClick = () =>{
    navigate("/login")
  }

  const features = [
    {
      icon: Clock,
      title: "Timesheet Management",
      description:
        "AI-powered time tracking with automatic project detection, billable hours calculation, and productivity insights.",
      category: "Productivity",
      highlight: "Save 40% time on reporting",
      screenshot: timesheet,
    },
    {
      icon: DollarSign,
      title: "Budget Tracking",
      description:
        "Real-time budget monitoring with predictive analytics, cost forecasting, and automated alerts for budget overruns.",
      category: "Finance",
      highlight: "Reduce costs by 25%",
      screenshot: budgetmanagement,
    },
    {
      icon: Users,
      title: "User Management",
      description:
        "AI-driven resource allocation with capacity planning, skill matching, and workload balancing across teams.",
      category: "Management",
      highlight: "Optimize team efficiency",
      screenshot: usermanagement,
    },
    {
      icon: CheckCircle,
      title: "Project Management",
      description:
        "Automated milestone tracking with dependency management, critical path analysis, and progress visualization.",
      category: "Tracking",
      highlight: "Never miss deadlines",
      screenshot: projectmanagement,
    },
    {
      icon: BarChart3,
      title: "Executive Dashboards",
      description: "Customizable executive dashboards with KPI tracking, performance metrics, and automated reporting.",
      category: "Analytics",
      highlight: "Data-driven decisions",
      screenshot: dashboard,
    },
    
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "VP of Operations",
      company: "TechFlow Solutions",
      image: "/professional-woman-smiling.png",
      content:
        "Project Matrics revolutionized our project delivery. We've seen a 45% improvement in on-time delivery and our team productivity has never been higher.",
      rating: 5,
      metrics: "45% faster delivery",
      companySize: "500+ employees",
    },
    {
      name: "Michael Chen",
      role: "Chief Technology Officer",
      company: "InnovateLabs",
      image: "/professional-man-suit.png",
      content:
        "The AI-powered insights and automation features have transformed how we manage our development cycles. Our sprint velocity increased by 60% in just 3 months.",
      rating: 5,
      metrics: "60% velocity increase",
      companySize: "200+ employees",
    },
    {
      name: "Emily Rodriguez",
      role: "Director of Project Management",
      company: "GlobalTech Corp",
      image: "/professional-woman-glasses.png",
      content:
        "Finally, a project management platform that scales with our enterprise needs. The executive dashboards provide incredible visibility into our portfolio.",
      rating: 5,
      metrics: "Enterprise scale",
      companySize: "2000+ employees",
    },
  ]

  const pricingTiers = [
    {
      name: "Starter",
      price: activePricingPeriod === "monthly" ? "$39" : "$390",
      originalPrice: activePricingPeriod === "monthly" ? "$49" : "$490",
      period: activePricingPeriod === "monthly" ? "per month" : "per year",
      description: "Perfect for small teams and startups",
      features: [
        "Up to 10 team members",
        "Basic time tracking & reporting",
        "Project templates library",
        "Mobile app access",
        "Email support",
        "Basic integrations",
        "5GB storage",
      ],
      popular: false,
      savings: activePricingPeriod === "yearly" ? "Save 20%" : null,
    },
    {
      name: "Professional",
      price: activePricingPeriod === "monthly" ? "$99" : "$990",
      originalPrice: activePricingPeriod === "monthly" ? "$129" : "$1290",
      period: activePricingPeriod === "monthly" ? "per month" : "per year",
      description: "Advanced features for growing businesses",
      features: [
        "Up to 50 team members",
        "Advanced analytics & forecasting",
        "Custom workflows & automation",
        "Scrum & Kanban boards",
        "Priority support & training",
        "Advanced integrations",
        "100GB storage",
        "Custom reporting",
        "API access",
      ],
      popular: true,
      savings: activePricingPeriod === "yearly" ? "Save 23%" : null,
    },
    {
      name: "Enterprise",
      price: "Custom",
      originalPrice: null,
      period: "pricing",
      description: "Tailored solutions for large organizations",
      features: [
        "Unlimited team members",
        "White-label solution",
        "Advanced security & compliance",
        "Dedicated success manager",
        "Custom development",
        "SLA guarantee (99.9%)",
        "Unlimited storage",
        "Advanced permissions",
        "Single sign-on (SSO)",
        "24/7 phone support",
      ],
      popular: false,
      savings: null,
    },
  ]

  const stats = [
    { number: "150K+", label: "Active Users", icon: Users, growth: "+127% YoY" },
    { number: "99.99%", label: "Uptime SLA", icon: Shield, growth: "Industry leading" },
    { number: "5M+", label: "Projects Delivered", icon: CheckCircle, growth: "+89% YoY" },
    { number: "180+", label: "Countries", icon: Globe, growth: "Global reach" },
  ]

  const integrations = [
    { name: "Slack", logo: "🔗" },
    { name: "Microsoft Teams", logo: "💬" },
    { name: "Jira", logo: "🎯" },
    { name: "GitHub", logo: "🐙" },
    { name: "Google Workspace", logo: "📊" },
    { name: "Salesforce", logo: "☁" },
  ]

  const companyLogos = [
    { name: "TechFlow", size: "Fortune 500" },
    { name: "InnovateLabs", size: "Series B" },
    { name: "GlobalTech", size: "Enterprise" },
    { name: "StartupXYZ", size: "Y Combinator" },
    { name: "DevCorp", size: "Unicorn" },
    { name: "CloudSys", size: "Public" },
  ]

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const handleStartedClick = () => {
    navigate("/login")
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus("Sending...")

    try {
      const response = await fetch("https://your-backend-api.com/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setStatus("Message sent successfully!")
        setFormData({ name: "", email: "", message: "" })
      } else {
        setStatus("Failed to send message. Please try again.")
      }
    } catch (error) {
      console.error(error)
      setStatus("An error occurred. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900">Project Matrics</span>
                  <div className="text-xs text-green-600 font-medium">Enterprise Ready</div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <a
                href="#home"
                className="text-gray-700 hover:text-green-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-green-50"
              >
                Home
              </a>
              <a
                href="#features"
                className="text-gray-700 hover:text-green-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-green-50"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-gray-700 hover:text-green-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-green-50"
              >
                Pricing
              </a>
              <a
                href="#contact"
                className="text-gray-700 hover:text-green-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-green-50"
              >
                Contact
              </a>
              <div className="flex items-center space-x-3">
                <button onClick={handleSignInClick} className="text-gray-700 hover:text-green-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-green-50">
                  Sign In
                </button>
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
                href="#home"
                className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
              >
                Home
              </a>
              <a
                href="#features"
                className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
              >
                Pricing
              </a>
              <a
                href="#contact"
                className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
              >
                Contact
              </a>
              <div className="pt-4 space-y-2">
                <button className="w-full text-left px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium">
                  Sign In
                </button>
                <button className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg">
                  Start Free Trial
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50">
        {/* Clean Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply opacity-30"></div>
          <div className="absolute top-40 right-20 w-64 h-64 bg-green-500 rounded-full mix-blend-multiply opacity-20"></div>
          <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-green-700 rounded-full mix-blend-multiply opacity-10"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          {/* Announcement Banner */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
              <Award className="h-4 w-4 mr-2" />🎉 Winner: Best Project Management Tool 2024
              <ChevronRight className="h-4 w-4 ml-2" />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-30 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl font-black text-gray-900 mb-8 leading-tight">
                The Future of
                <span className="block text-green-500 relative">
                  Project Management
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-green-300 rounded-full"></div>
                </span>
              </h1>

              <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Powered by AI, trusted by 150,000+ teams worldwide. Transform your project delivery with intelligent
                automation and real-time insights.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center mb-12">
                <button
                  onClick={handleStartedClick}
                  className="group bg-green-500 hover:bg-green-600 text-white px-10 py-5 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center"
                >
                  Start Free 14-Day Trial
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="group flex items-center px-8 py-5 text-gray-700 hover:text-green-600 font-semibold transition-colors">
                  <div className="w-12 h-12 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center mr-4 transition-colors">
                    <Play className="h-5 w-5 text-green-600 ml-1" />
                  </div>
                  Watch 2-min Demo
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-6 text-center lg:text-left">
                <div>
                  <div className="text-3xl font-black text-gray-900 mb-1">150K+</div>
                  <div className="text-sm text-gray-600 font-medium">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-900 mb-1">99.99%</div>
                  <div className="text-sm text-gray-600 font-medium">Uptime SLA</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-900 mb-1">4.9/5</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center lg:justify-start font-medium">
                    <Star className="h-4 w-4 text-yellow-400 mr-1 fill-current" />
                    G2 Rating
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Dashboard Mockup */}
            <div className="relative">
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className="bg-green-500 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-white font-bold text-lg">Project Dashboard</div>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="text-white/80 text-xs mb-1">Active Projects</div>
                      <div className="text-white text-xl font-bold">24</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="text-white/80 text-xs mb-1">Team Members</div>
                      <div className="text-white text-xl font-bold">156</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="text-white/80 text-xs mb-1">Completion</div>
                      <div className="text-white text-xl font-bold">87%</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                        <Code className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">Website Redesign</div>
                        <div className="text-sm text-gray-600">Due in 3 days</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-bold text-xl">92%</div>
                      <div className="w-16 h-2 bg-green-200 rounded-full mt-1">
                        <div className="w-full h-full bg-green-500 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                        <Smartphone className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">Mobile App</div>
                        <div className="text-sm text-gray-600">Due in 1 week</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-600 font-bold text-xl">67%</div>
                      <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                        <div className="w-full h-full bg-gray-400 rounded-full" style={{ width: '67%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                Live Updates
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">3,247 users online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Company Logos */}
          <div className="mt-24 text-center">
            <p className="text-gray-600 font-medium mb-8">Trusted by industry leaders worldwide</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center opacity-70">
              {companyLogos.map((company, index) => (
                <div key={index} className="text-center hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl mx-auto mb-2 flex items-center justify-center border border-gray-200">
                    <Building className="h-8 w-8 text-gray-500" />
                  </div>
                  <div className="text-xs text-gray-600 font-medium">{company.name}</div>
                  <div className="text-xs text-gray-400">{company.size}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white border-y border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Numbers That Speak for Themselves</h2>
            <p className="text-xl text-gray-600">Join the fastest-growing project management platform</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <IconComponent className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium mb-2">{stat.label}</div>
                  <div className="text-sm text-green-600 font-semibold">{stat.growth}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section - Alternating Feature/Screenshot */}
      <section id="features" className="py-24 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-green-200 text-green-700 rounded-full text-sm font-semibold mb-6">
              <Layers className="h-4 w-4 mr-2" />
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Everything You Need to
              <span className="block text-green-500">Scale Your Success</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From AI-powered insights to enterprise-grade security, Project Matrics provides all the tools your team
              needs to deliver exceptional results.
            </p>
          </div>

          {/* Alternating Feature/Screenshot Layout */}
          <div className="space-y-24">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className={`flex flex-col md:flex-row items-center ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''} gap-10 md:gap-24`}
              >
                {/* Feature Text */}
                <div className="flex-1 flex flex-col items-start md:items-start px-0 md:px-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-green-600 font-semibold text-base">{feature.category}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 text-lg leading-relaxed">{feature.description}</p>
                  <div className="text-green-600 font-semibold text-base mb-2">{feature.highlight}</div>
                </div>
                {/* Screenshot - Jira style, no box, open layout */}
                <div className="flex-1 flex justify-center items-center">
                  <img
                    src={feature.screenshot}
                    alt={feature.title + ' screenshot'}
                    className="min-w-[700px] min-h-[280px] object-cover"
                    style={{ boxShadow: '0 8px 32px 0 rgba(16, 185, 129, 0.10)', borderRadius: '1.5rem', border: 'none', background: 'none' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-green-200 text-green-700 rounded-full text-sm font-semibold mb-6">
              <Star className="h-4 w-4 mr-2" />
              Customer Success Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Loved by Teams
              <span className="block text-green-500">Around the World</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how industry leaders are transforming their project management with Project Matrics.
            </p>
          </div>

          <div className="relative">
            <div className="bg-green-50 rounded-3xl p-8 lg:p-12 border border-green-100">
              <div className="grid lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-2">
                  <div className="flex space-x-1 mb-6">
                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-2xl lg:text-3xl font-medium text-gray-900 leading-relaxed mb-8">
                    "{testimonials[activeTestimonial].content}"
                  </blockquote>
                  <div className="flex items-center space-x-6">
                    <img
                      src={testimonials[activeTestimonial].image || "/placeholder.svg"}
                      alt={testimonials[activeTestimonial].name}
                      className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                    />
                    <div>
                      <div className="font-bold text-gray-900 text-lg">{testimonials[activeTestimonial].name}</div>
                      <div className="text-green-600 font-semibold">{testimonials[activeTestimonial].role}</div>
                      <div className="text-gray-600">{testimonials[activeTestimonial].company}</div>
                    </div>
                    <div className="hidden md:block">
                      <div className="bg-white rounded-xl p-4 shadow-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {testimonials[activeTestimonial].metrics}
                        </div>
                        <div className="text-sm text-gray-600">{testimonials[activeTestimonial].companySize}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="space-y-4">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveTestimonial(index)}
                        className={`w-full h-3 rounded-full transition-all duration-300 ${
                          activeTestimonial === index ? "bg-green-500" : "bg-green-200 hover:bg-green-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-green-200 text-green-700 rounded-full text-sm font-semibold mb-6">
              <DollarSign className="h-4 w-4 mr-2" />
              Transparent Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your
              <span className="block text-green-500">Perfect Plan</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Start free, scale as you grow. All plans include our core features with no hidden fees or setup costs.
            </p>

            {/* Pricing Toggle */}
            <div className="inline-flex items-center bg-white rounded-full p-1 shadow-lg border border-green-100">
              <button
                onClick={() => setActivePricingPeriod("monthly")}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  activePricingPeriod === "monthly"
                    ? "bg-green-500 text-white shadow-lg"
                    : "text-gray-600 hover:text-green-600"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setActivePricingPeriod("yearly")}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 relative ${
                  activePricingPeriod === "yearly"
                    ? "bg-green-500 text-white shadow-lg"
                    : "text-gray-600 hover:text-green-600"
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-700 text-white text-xs px-2 py-1 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-3xl p-8 transition-all duration-300 transform hover:-translate-y-2 border-2 ${
                  tier.popular
                    ? "border-green-500 shadow-2xl scale-105"
                    : "border-green-100 shadow-lg hover:shadow-xl hover:border-green-200"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-green-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                {tier.savings && (
                  <div className="absolute -top-2 -right-2 bg-green-700 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {tier.savings}
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-gray-600 mb-6">{tier.description}</p>
                  <div className="mb-6">
                    {tier.originalPrice && tier.price !== "Custom" && (
                      <div className="text-lg text-gray-400 line-through mb-1">{tier.originalPrice}</div>
                    )}
                    <span className="text-5xl font-bold text-gray-900">{tier.price}</span>
                    {tier.price !== "Custom" && <span className="text-gray-600 ml-2">/{tier.period}</span>}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
                    tier.popular
                      ? "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl"
                      : tier.name === "Enterprise"
                        ? "border-2 border-green-500 text-green-600 hover:bg-green-50"
                        : "border-2 border-green-500 text-green-600 hover:bg-green-50"
                  }`}
                >
                  {tier.name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}
                </button>
              </div>
            ))}
          </div>

          {/* Additional Pricing Info */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-6">All plans include:</p>
            <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">14-day free trial</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">No setup fees</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Cancel anytime</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">24/7 support</span>
              </div>
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
      <section id="contact" className="py-24 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-3">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-6 py-4 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-3">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-6 py-4 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition-colors"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-3">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="6"
                    required
                    className="w-full px-6 py-4 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition-colors resize-none"
                    placeholder="Tell us about your project management needs..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="group w-full bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  Send Message
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                {status && (
                  <p
                    className={`text-center font-semibold ${status.includes("success") ? "text-green-600" : "text-red-600"}`}
                  >
                    {status}
                  </p>
                )}
              </form>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Get Started Today</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Free 14-Day Trial</div>
                      <div className="text-gray-600">No credit card required</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Expert Onboarding</div>
                      <div className="text-gray-600">Dedicated setup assistance</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">24/7 Support</div>
                      <div className="text-gray-600">Always here when you need us</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
                <h4 className="font-bold text-gray-900 mb-4">Contact Information</h4>
                <div className="space-y-3 text-gray-600">
                  <p className="flex items-center">
                    <span className="mr-3">📧</span>
                    support@projectmatrics.com
                  </p>
                  <p className="flex items-center">
                    <span className="mr-3">📞</span>
                    +1 (555) 123-4567
                  </p>
                  <p className="flex items-center">
                    <span className="mr-3">📍</span>
                    123 Business Ave, Suite 100, City, State 12345
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
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Project Matrics
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                Empowering teams worldwide with comprehensive project management solutions. Track, manage, and deliver
                exceptional results.
              </p>
              <div className="text-gray-400">
                <p className="mb-2">📧 support@projectmatrics.com</p>
                <p className="mb-2">📞 +1 (555) 123-4567</p>
                <p>📍 123 Business Ave, Suite 100, City, State 12345</p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-green-400">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Features
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
                  <a href="#" className="hover:text-green-400 transition-colors">
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
