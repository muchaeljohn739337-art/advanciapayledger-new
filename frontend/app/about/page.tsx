'use client';

import Link from 'next/link';

export default function AboutPage() {
  const team = [
    {
      name: 'Sarah Chen',
      role: 'CEO & Co-Founder',
      bio: 'Former healthcare executive with 15+ years in medical billing and payment systems.',
      image: '👩‍💼'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'CTO & Co-Founder',
      bio: 'Blockchain and fintech expert, previously led engineering at major payment processors.',
      image: '👨‍💻'
    },
    {
      name: 'Dr. Emily Watson',
      role: 'Chief Medical Officer',
      bio: 'Board-certified physician focused on healthcare technology and patient experience.',
      image: '👩‍⚕️'
    },
    {
      name: 'James Park',
      role: 'Head of Security',
      bio: 'Cybersecurity specialist with expertise in HIPAA compliance and healthcare data protection.',
      image: '👨‍🔒'
    }
  ];

  const stats = [
    { number: '24', label: 'Healthcare Facilities' },
    { number: '$247K', label: 'Monthly Volume' },
    { number: '42%', label: 'Month-over-Month Growth' },
    { number: '99.9%', label: 'Uptime' },
    { number: '50K+', label: 'Transactions Processed' },
    { number: '24/7', label: 'Support' }
  ];

  const values = [
    {
      title: 'Security First',
      description: 'We prioritize the security and privacy of patient data above all else.',
      icon: '🔒'
    },
    {
      title: 'Healthcare Focused',
      description: 'Every feature is designed specifically for healthcare payment workflows.',
      icon: '🏥'
    },
    {
      title: 'Innovation Driven',
      description: 'We continuously push the boundaries of payment technology.',
      icon: '💡'
    },
    {
      title: 'Customer Obsessed',
      description: 'Your success is our success. We\'re here to support you every step of the way.',
      icon: '❤️'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">Advancia Pay</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/playground" className="text-gray-700 hover:text-blue-600">Playground</Link>
              <Link href="/features" className="text-gray-700 hover:text-blue-600">Features</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600">Pricing</Link>
              <Link href="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            About<br />
            <span className="text-blue-600">Advancia Pay</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're revolutionizing healthcare payments by combining cutting-edge technology 
            with deep industry expertise. Our mission is to make healthcare payments 
            simple, secure, and accessible for everyone.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-2xl shadow-lg p-12 mb-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-4">
                To transform healthcare payments through innovative technology that puts patients 
                and providers first. We believe that managing healthcare payments should be 
                as simple and secure as any other modern financial transaction.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                By combining cryptocurrency and traditional payment methods, we're creating a 
                more efficient, cost-effective, and accessible payment ecosystem for the 
                healthcare industry.
              </p>
              <Link href="/contact" className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700">
                Learn more about our vision →
              </Link>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Our Vision</h3>
              <p className="text-gray-600">
                A world where healthcare payments are seamless, secure, and accessible to all.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">{member.image}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-blue-600 font-semibold mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-blue-600 rounded-2xl p-12 text-white text-center mb-16">
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Founded in 2024, Advancia Pay was born from a simple observation: healthcare payments 
            were stuck in the past. Our founders, with backgrounds in healthcare, fintech, and 
            blockchain technology, came together to solve this problem.
          </p>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Today, we're proud to serve healthcare facilities across the country, processing 
            millions in payments and making healthcare more accessible for everyone.
          </p>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Us on Our Journey</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            We're just getting started. Be part of the healthcare payment revolution.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register" className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700">
              Start Using Advancia Pay
            </Link>
            <Link href="/contact" className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50">
              Contact Our Team
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Advancia Pay</h3>
              <p className="text-gray-400">Healthcare payments reimagined</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/security">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/compliance">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            © 2026 Advancia Pay Ledger. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
