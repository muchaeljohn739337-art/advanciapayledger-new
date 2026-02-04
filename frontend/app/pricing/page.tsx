'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      name: 'Starter',
      price: billingCycle === 'monthly' ? 99 : 79,
      period: billingCycle === 'monthly' ? '/month' : '/month (billed annually)',
      originalPrice: billingCycle === 'annual' ? 99 : null,
      features: [
        'Up to $50K monthly volume',
        'Crypto + Fiat payments',
        'HIPAA compliance',
        'Basic reporting',
        'Email support',
        '2 user accounts',
        'Standard API access'
      ],
      highlighted: false,
      cta: 'Start Free Trial'
    },
    {
      name: 'Professional',
      price: billingCycle === 'monthly' ? 299 : 239,
      period: billingCycle === 'monthly' ? '/month' : '/month (billed annually)',
      originalPrice: billingCycle === 'annual' ? 299 : null,
      features: [
        'Up to $500K monthly volume',
        'All Starter features',
        'Advanced analytics',
        'Priority API access',
        'Priority support',
        '10 user accounts',
        'Custom integrations',
        'Webhook support',
        'Advanced reporting'
      ],
      highlighted: true,
      cta: 'Most Popular'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      originalPrice: null,
      features: [
        'Unlimited volume',
        'All Professional features',
        'Dedicated account manager',
        'Custom development',
        'SLA guarantee',
        'Unlimited users',
        'White-label options',
        'On-premise deployment',
        'Custom compliance support'
      ],
      highlighted: false,
      cta: 'Contact Sales'
    }
  ];

  const faqs = [
    {
      question: 'What payment methods do you support?',
      answer: 'We support all major cryptocurrencies (Bitcoin, Ethereum, Solana, USDC) and traditional payment methods (credit cards, ACH, wire transfers, checks).'
    },
    {
      question: 'Is my data HIPAA compliant?',
      answer: 'Yes, we are fully HIPAA and HITECH compliant. All data is encrypted end-to-end, and we provide business associate agreements (BAAs) for all healthcare clients.'
    },
    {
      question: 'How quickly can I get started?',
      answer: 'You can sign up and start accepting payments in minutes. Our onboarding process typically takes less than 15 minutes for basic setup.'
    },
    {
      question: 'Can I change plans anytime?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for all new customers. No questions asked.'
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
              <Link href="/pricing" className="text-blue-600 font-semibold">Pricing</Link>
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
            Simple, Transparent<br />
            <span className="text-blue-600">Pricing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your healthcare facility. 
            No hidden fees, no surprise charges.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-lg ${billingCycle === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-8 w-16 items-center rounded-full bg-blue-600 transition-colors"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg ${billingCycle === 'annual' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Annual <span className="text-green-600 font-bold">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-blue-600 text-white transform scale-105 shadow-xl'
                  : 'bg-white border-2 border-gray-200 shadow-lg'
              } ${
                selectedPlan === plan.name ? 'ring-4 ring-blue-400' : ''
              }`}
              onClick={() => setSelectedPlan(selectedPlan === plan.name ? null : plan.name)}
            >
              {plan.highlighted && (
                <div className="bg-yellow-400 text-gray-900 text-sm font-bold px-3 py-1 rounded-full text-center mb-4">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              
              <div className="mb-6">
                {plan.originalPrice && (
                  <span className="text-sm line-through opacity-75 mr-2">
                    ${plan.originalPrice}
                  </span>
                )}
                <span className="text-4xl font-bold">
                  {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                </span>
                <span className={plan.highlighted ? 'text-blue-100' : 'text-gray-600'}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2">{plan.highlighted ? '✓' : '•'}</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === 'Enterprise' ? '/contact' : '/register'}
                className={`block text-center px-6 py-3 rounded-lg font-semibold ${
                  plan.highlighted
                    ? 'bg-white text-blue-600 hover:bg-gray-100'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-12 mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join healthcare facilities already processing millions in payments with our secure platform.
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
