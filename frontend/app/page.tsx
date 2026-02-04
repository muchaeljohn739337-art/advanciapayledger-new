"use client"

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">Advancia Pay</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/playground" className="text-gray-700 hover:text-blue-600">Playground</Link>
              <Link href="/features" className="text-gray-700 hover:text-blue-600">Features</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600">Pricing</Link>
              <Link href="/dev" className="text-gray-700 hover:text-blue-600 font-mono text-sm">Dev</Link>
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
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Healthcare Payments.<br />
            <span className="text-blue-600">Crypto & Fiat. Seamless.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Accept both cryptocurrency and traditional payments. Built for healthcare facilities with HIPAA compliance, real-time processing, and zero complexity.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register" className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700">
              Start Free Trial
            </Link>
            <Link href="/demo" className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50">
              Request Demo
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600">$247K</div>
            <div className="text-gray-600 mt-2">Monthly Volume</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600">24</div>
            <div className="text-gray-600 mt-2">Healthcare Facilities</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600">42%</div>
            <div className="text-gray-600 mt-2">Month-over-Month Growth</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="💳"
              title="Multi-Payment Support"
              description="Accept crypto (SOL, ETH, USDC) and traditional payments (cards, ACH, wire) in one platform"
            />
            <FeatureCard
              icon="🔒"
              title="HIPAA Compliant"
              description="Bank-level security with end-to-end encryption and full compliance for healthcare data"
            />
            <FeatureCard
              icon="⚡"
              title="Instant Settlement"
              description="Crypto payments settle in seconds. Traditional payments in 1-2 business days"
            />
            <FeatureCard
              icon="📊"
              title="Real-Time Dashboard"
              description="Track all transactions, revenue, and analytics in one unified dashboard"
            />
            <FeatureCard
              icon="👥"
              title="Payroll Management"
              description="Pay employees in crypto or fiat. Automate payroll with tax calculations"
            />
            <FeatureCard
              icon="🔗"
              title="Easy Integration"
              description="Connect existing systems with our REST API. SDKs for all major languages"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard
              name="Starter"
              price="$99"
              period="/ month"
              features={[
                'Up to $50K monthly volume',
                'Crypto + Fiat payments',
                'HIPAA compliance',
                'Basic reporting',
                'Email support',
              ]}
            />
            <PricingCard
              name="Professional"
              price="$299"
              period="/ month"
              features={[
                'Up to $500K monthly volume',
                'All Starter features',
                'Advanced analytics',
                'API access',
                'Priority support',
                'Custom integrations',
              ]}
              highlighted
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              period=""
              features={[
                'Unlimited volume',
                'All Professional features',
                'Dedicated account manager',
                'Custom development',
                'SLA guarantee',
                'White-label options',
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to modernize your payments?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 24 healthcare facilities already processing $247K monthly
          </p>
          <Link href="/register" className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 inline-block">
            Start Free Trial →
          </Link>
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
                <li><Link href="/compliance">Compliance</li>
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

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  features,
  highlighted = false,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div className={`rounded-lg p-8 ${highlighted ? 'bg-blue-600 text-white transform scale-105' : 'bg-white border-2 border-gray-200'}`}>
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className={highlighted ? 'text-blue-100' : 'text-gray-600'}>{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start">
            <span className="mr-2">{highlighted ? '✓' : '•'}</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/register"
        className={`block text-center px-6 py-3 rounded-lg font-semibold ${
          highlighted
            ? 'bg-white text-blue-600 hover:bg-gray-100'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}
