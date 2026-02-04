'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FeaturesPage() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features = [
    {
      id: 'payments',
      icon: '💳',
      title: 'Multi-Payment Support',
      description: 'Accept crypto (SOL, ETH, USDC) and traditional payments (cards, ACH, wire) in one platform',
      details: [
        'Real-time processing for all payment types',
        'Support for 10+ cryptocurrencies',
        'Traditional payment gateway integration',
        'Automatic currency conversion',
        'Zero-fee crypto transactions'
      ],
      color: 'bg-blue-500'
    },
    {
      id: 'security',
      icon: '🔒',
      title: 'HIPAA Compliant',
      description: 'Bank-level security with end-to-end encryption and full compliance for healthcare data',
      details: [
        'End-to-end encryption for all data',
        'HIPAA and HITECH compliant',
        'Regular security audits',
        'Role-based access control',
        'Audit trails for all transactions'
      ],
      color: 'bg-green-500'
    },
    {
      id: 'settlement',
      icon: '⚡',
      title: 'Instant Settlement',
      description: 'Crypto payments settle in seconds. Traditional payments in 1-2 business days',
      details: [
        'Real-time crypto settlement',
        'Same-day ACH processing',
        'Instant wallet funding',
        'Automated reconciliation',
        'Multi-currency support'
      ],
      color: 'bg-yellow-500'
    },
    {
      id: 'dashboard',
      icon: '📊',
      title: 'Real-Time Dashboard',
      description: 'Track all transactions, revenue, and analytics in one unified dashboard',
      details: [
        'Live transaction monitoring',
        'Customizable reports',
        'Revenue analytics',
        'Patient payment insights',
        'Mobile-responsive interface'
      ],
      color: 'bg-purple-500'
    },
    {
      id: 'payroll',
      icon: '👥',
      title: 'Payroll Management',
      description: 'Pay employees in crypto or fiat. Automate payroll with tax calculations',
      details: [
        'Multi-currency payroll',
        'Automated tax calculations',
        'Employee self-service portal',
        'Direct deposit options',
        'Payroll analytics'
      ],
      color: 'bg-red-500'
    },
    {
      id: 'integration',
      icon: '🔗',
      title: 'Easy Integration',
      description: 'Connect existing systems with our REST API. SDKs for all major languages',
      details: [
        'RESTful API with comprehensive docs',
        'Webhook support',
        'SDKs for Python, JavaScript, Java',
        'Sandbox environment',
        '24/7 developer support'
      ],
      color: 'bg-indigo-500'
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
              <Link href="/features" className="text-blue-600 font-semibold">Features</Link>
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
            Everything You Need for<br />
            <span className="text-blue-600">Healthcare Payments</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive payment solutions designed specifically for healthcare facilities. 
            From patient payments to payroll, we've got you covered.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`bg-white rounded-xl shadow-lg p-8 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl ${
                selectedFeature === feature.id ? 'ring-4 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedFeature(selectedFeature === feature.id ? null : feature.id)}
            >
              <div className={`w-16 h-16 ${feature.color} rounded-lg flex items-center justify-center text-3xl mb-6`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              
              {selectedFeature === feature.id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Key Benefits:</h4>
                  <ul className="space-y-2">
                    {feature.details.map((detail, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">✓</span>
                        <span className="text-gray-700 text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Payment System?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join healthcare facilities already processing millions in payments with our secure, compliant platform.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register" className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100">
              Start Free Trial
            </Link>
            <Link href="/contact" className="border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600">
              Schedule Demo
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
