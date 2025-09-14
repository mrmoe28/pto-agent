export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Enter Your Address",
      description: "Simply type in the address where you need permit information. Our system works with any property address in the United States.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      number: "2",
      title: "Get Instant Results",
      description: "Our advanced system instantly identifies the correct permit office for your location, including specialized departments.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      number: "3",
      title: "Contact & Apply",
      description: "Get complete contact information including phone numbers, addresses, office hours, and online application links.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    }
  ]

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Getting permit office information has never been easier. Our simple 3-step process gets you the information you need in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connection lines for desktop */}
          <div className="hidden md:block absolute top-24 left-1/2 w-full h-0.5 bg-blue-200 transform -translate-x-1/2 -translate-y-1/2 z-0" />
          
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              {/* Step number circle */}
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 relative z-10">
                {step.number}
              </div>
              
              {/* Icon */}
              <div className="text-blue-600 mb-4 flex justify-center">
                {step.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Find Your Permit Office?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of property owners and contractors who save time with our service.
            </p>
            <button className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Get Started Now
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}