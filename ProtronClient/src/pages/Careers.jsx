import React, { useMemo, useState } from "react"
import { X, Plus, Minus, Upload } from "lucide-react"
import careersHero from "../assets/Whisk.png";
import PublicNavbar from "../components/PublicNavbar"

const emptyForm = {
  name: "",
  email: "",
  contactNo: "",
  qualification: "",
  message: "",
}

export default function Careers() {
  const [expandedId, setExpandedId] = useState(null)
  const [applyFor, setApplyFor] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [resumeFile, setResumeFile] = useState(null)
  const [submitStatus, setSubmitStatus] = useState("")

  const jobs = useMemo(
    () => [
      {
        id: "fsd-react-spring",
        title: "Full Stack Developer (React / Spring Boot)",
        experience: "1 - 5 Years",
        highlights: ["React", "Spring Boot", "IT Services & Consulting"],
        descriptionLines: [
          "1 - 5 Years of IT development experience on React/Springboot technologies.",
          "Looking for smart working, quick learners, immediate joiners and positions are flexible to work from home.",
        ],
        details: {
          role: "Full Stack Developer",
          industryType: "IT Services & Consulting",
          department: "Engineering - Software & QA",
          employmentType: "Full Time, Permanent",
          roleCategory: "Software Development",
          educationUG: "Any Graduate",
          keySkillsNote: "Skills highlighted with '' are preferred keyskills.",
          keySkills: ["React", "Spring Boot", "Java", "REST APIs", "SQL"],
        },
      },
      {
        id: "fsd-cicd",
        title: "Full Stack Developer (CI/CD Focus)",
        experience: "1 - 5 Years",
        highlights: ["Jenkins", "Git", "CI/CD"],
        descriptionLines: [
          "Good and hands-on knowledge on Jenkin, Git, CI/CD.",
          "Looking for smart working, quick learners, immediate joiners and positions are flexible to work from home.",
        ],
        details: {
          role: "Full Stack Developer",
          industryType: "IT Services & Consulting",
          department: "Engineering - Software & QA",
          employmentType: "Full Time, Permanent",
          roleCategory: "Software Development",
          educationUG: "Any Graduate",
          keySkillsNote: "Skills highlighted with '' are preferred keyskills.",
          keySkills: ["Jenkins", "Git", "CI/CD", "Build pipelines", "Release automation"],
        },
      },
    ],
    []
  )

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const openApply = (job) => {
    setApplyFor(job)
    setSubmitStatus("")
    setForm(emptyForm)
    setResumeFile(null)
  }

  const closeApply = () => {
    setApplyFor(null)
    setSubmitStatus("")
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitStatus("Submitting...")

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8282"
      const formDataToSend = new FormData()
      formDataToSend.append("name", form.name)
      formDataToSend.append("email", form.email)
      formDataToSend.append("contactNo", form.contactNo)
      formDataToSend.append("qualification", form.qualification)
      formDataToSend.append("message", form.message || "")
      formDataToSend.append("jobTitle", applyFor.title)
      if (resumeFile) {
        formDataToSend.append("resume", resumeFile)
      }

      const response = await fetch(`${apiUrl}/api/career`, {
        method: "POST",
        body: formDataToSend,
      })

      const result = await response.text()
      if (response.ok) {
        setSubmitStatus("Application submitted successfully!")
        setForm(emptyForm)
        setResumeFile(null)
      } else {
        setSubmitStatus(result || "Failed to submit. Please try again.")
      }
    } catch (error) {
      console.error(error)
      setSubmitStatus("An error occurred. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative">
        <div className="relative h-[360px] sm:h-[420px] overflow-hidden">
          <img src={careersHero} alt="Careers" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative h-full flex items-center justify-center px-4">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-white tracking-tight">Careers</h1>
          </div>
        </div>
      </section>

      {/* Current Openings */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">CURRENT OPENINGS</h2>
            <div className="mx-auto mt-6 h-[3px] w-44 bg-gray-900/40" />
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
            {jobs.map((job, idx) => {
              const isOpen = expandedId === job.id
              return (
                <div key={job.id} className={idx === 0 ? "" : "border-t border-gray-200"}>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(job.id)}
                    className="w-full flex items-center justify-between gap-6 px-6 sm:px-10 py-6 text-left hover:bg-gray-50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="min-w-0">
                      <div className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{job.title}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                          {job.experience}
                        </span>
                        {job.highlights.map((h) => (
                          <span
                            key={h}
                            className="px-3 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl border border-gray-300 flex items-center justify-center bg-white">
                      {isOpen ? <Minus className="h-6 w-6 text-gray-700" /> : <Plus className="h-6 w-6 text-gray-700" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 sm:px-10 pb-10">
                      <div className="grid lg:grid-cols-2 gap-10">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-3">Job Description</h3>
                          <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            {job.descriptionLines.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>

                          <div className="mt-8">
                            <button
                              type="button"
                              onClick={() => openApply(job)}
                              className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-xl font-bold shadow-lg transition-all duration-300"
                            >
                              APPLY NOW
                            </button>
                          </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Role Details</h3>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <dt className="text-gray-500">Role</dt>
                              <dd className="font-semibold text-gray-900">{job.details.role}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Industry Type</dt>
                              <dd className="font-semibold text-gray-900">{job.details.industryType}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Department</dt>
                              <dd className="font-semibold text-gray-900">{job.details.department}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Employment Type</dt>
                              <dd className="font-semibold text-gray-900">{job.details.employmentType}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Role Category</dt>
                              <dd className="font-semibold text-gray-900">{job.details.roleCategory}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Education (UG)</dt>
                              <dd className="font-semibold text-gray-900">{job.details.educationUG}</dd>
                            </div>
                          </dl>

                          <div className="mt-6">
                            <div className="text-gray-500 text-sm mb-2">{job.details.keySkillsNote}</div>
                            <div className="flex flex-wrap gap-2">
                              {job.details.keySkills.map((s) => (
                                <span
                                  key={s}
                                  className="px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 text-sm"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Apply Modal */}
      {applyFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeApply} />

          <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 sm:p-10">
              <button
                type="button"
                onClick={closeApply}
                className="absolute top-5 right-5 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>

              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                APPLYING FOR: <span className="text-red-600 font-medium">{applyFor.title}</span>
              </div>
              <div className="text-gray-500 mt-2">Request you to kindly fill all the required details.</div>

              <form onSubmit={handleSubmit} className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Name"
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="Email ID"
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    name="contactNo"
                    value={form.contactNo}
                    onChange={handleChange}
                    required
                    placeholder="Contact No"
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    name="qualification"
                    value={form.qualification}
                    onChange={handleChange}
                    required
                    placeholder="Qualification"
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-5">
                  <label className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl border border-dashed border-gray-300 text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="h-5 w-5" />
                    <span className="font-medium">{resumeFile ? resumeFile.name : "Upload Resume"}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    />
                  </label>

                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Message"
                    rows={8}
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>

                <div className="lg:col-span-2 flex flex-col items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-16 py-4 rounded-xl font-bold shadow-lg transition-all duration-300"
                  >
                    SEND MESSAGE
                  </button>
                  {submitStatus && <div className="text-green-600 font-semibold">{submitStatus}</div>}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
