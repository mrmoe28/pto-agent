'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: string
  category: string
}

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs: FAQItem[] = [
    {
      category: 'Getting Started',
      question: 'How do I search for a permit office?',
      answer: 'Simply enter your property address in the search bar on the homepage or search page. Our system will automatically identify your location and find the appropriate permit offices for your area.'
    },
    {
      category: 'Getting Started',
      question: 'What information do I need to search?',
      answer: 'You only need your property address. Enter the street address, city, and state, and our system will handle the rest.'
    },
    {
      category: 'Search Results',
      question: 'Why are multiple permit offices shown for my address?',
      answer: 'Some jurisdictions have multiple permit offices for different types of permits (building, electrical, plumbing, etc.). We show all relevant offices so you can contact the right department for your specific needs.'
    },
    {
      category: 'Search Results',
      question: 'How accurate is the permit office information?',
      answer: 'We maintain an updated database of permit offices with verified contact information, hours, and application processes. Our data is regularly reviewed and updated to ensure accuracy.'
    },
    {
      category: 'Features',
      question: 'Can I save permit offices for later?',
      answer: 'Yes! With a Pro or Enterprise subscription, you can save your favorite permit offices for quick access. This is especially useful if you work on projects in multiple jurisdictions.'
    },
    {
      category: 'Features',
      question: 'Do you provide permit application forms?',
      answer: 'We provide direct links to online application portals and downloadable forms where available. You\'ll see a list of required forms and applications for each permit office in the search results.'
    },
    {
      category: 'Subscriptions',
      question: 'What is included in the free plan?',
      answer: 'The free plan includes 1 permit office search. You can see complete contact information, office hours, and available services for the permit offices in your search results.'
    },
    {
      category: 'Subscriptions',
      question: 'How many searches do I get with Pro?',
      answer: 'Pro subscribers get 40 searches per month, along with advanced filtering, distance-based sorting, and detailed office information including fees and processing times.'
    },
    {
      category: 'Subscriptions',
      question: 'What are the benefits of Enterprise?',
      answer: 'Enterprise includes unlimited searches, the ability to save favorite offices, export search results, team collaboration features, and priority customer support.'
    },
    {
      category: 'Technical',
      question: 'What areas does your service cover?',
      answer: 'We currently cover permit offices throughout Georgia, with ongoing expansion to additional states. Our database includes county and municipal permit offices across covered regions.'
    },
    {
      category: 'Technical',
      question: 'Why am I not finding results for my address?',
      answer: 'If no results appear, it may mean we haven\'t yet added permit offices for your specific area to our database. We\'re continuously expanding coverage. Try searching by county name instead of street address.'
    },
    {
      category: 'Technical',
      question: 'Can I search by county instead of address?',
      answer: 'Yes! If you\'re not sure of the exact address or want to see all permit offices in a county, you can search by county name.'
    },
    {
      category: 'Support',
      question: 'How do I contact support?',
      answer: 'You can reach our support team at support@permitfinder.com. We typically respond within 24 hours during business days.'
    },
    {
      category: 'Support',
      question: 'Can you help me file my permit application?',
      answer: 'We provide the contact information and resources to help you find the right permit office. For specific help with filing applications, you\'ll need to contact the permit office directly or consult with a licensed contractor.'
    }
  ]

  const categories = Array.from(new Set(faqs.map(faq => faq.category)))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              PTO Agent
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-blue-600 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Help & Support Center
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Find answers to common questions and learn how to make the most of our permit office finder
          </p>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-16">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">Quick Tips</h2>
          </div>
          <p className="text-gray-600 mb-6">Make the most of your permit office search</p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Use Location Filters</h3>
                <p className="text-gray-600 text-sm">Filter by distance to find offices closest to you</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Save Favorites</h3>
                <p className="text-gray-600 text-sm">Bookmark offices you visit frequently</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Call Ahead</h3>
                <p className="text-gray-600 text-sm">Check office hours and requirements before visiting</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600">
            Browse by category or click on a question to see the answer
          </p>
        </div>

        {categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              {category}
            </h3>
            <div className="space-y-3">
              {faqs
                .filter(faq => faq.category === category)
                .map((faq, index) => {
                  const globalIndex = faqs.indexOf(faq)
                  const isOpen = openIndex === globalIndex

                  return (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-4">
                          {faq.question}
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                            isOpen ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-gray-600 border-t border-gray-100 pt-4">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Our support team is here to help
          </p>
          <a
            href="mailto:support@permitfinder.com"
            className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
