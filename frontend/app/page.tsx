"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">
                Advancia Pay
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/playground"
                className="text-gray-700 hover:text-blue-600"
              >
                Playground
              </Link>
              <Link
                href="/features"
                className="text-gray-700 hover:text-blue-600"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-gray-700 hover:text-blue-600"
              >
                Pricing
              </Link>
              <Link
                href="/dev"
                className="text-gray-700 hover:text-blue-600 font-mono text-sm"
              >
                Dev
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-blue-600">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
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
            Healthcare Payments.
            <br />
            <span className="text-blue-600">Crypto & Fiat. Seamless.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Accept both cryptocurrency and traditional payments. Built for
            healthcare facilities with HIPAA compliance, real-time processing,
            and zero complexity.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700"
            >
              Start Free Trial
            </Link>
            <Link
              href="/demo"
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50"
            >
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
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need
          </h2>
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
              title="Real-Time Processing"
              description="Instant payment confirmation with real-time balance updates and notifications"
            />
            <FeatureCard
              icon="🏥"
              title="Healthcare-First"
              description="Built specifically for medical facilities, clinics, and healthcare providers"
            />
            <FeatureCard
              icon="📊"
              title="Smart Analytics"
              description="AI-powered insights, payment trends, and revenue optimization recommendations"
            />
            <FeatureCard
              icon="🌐"
              title="Multi-Currency"
              description="Support for 10+ cryptocurrencies and 50+ fiat currencies worldwide"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to modernize your payments?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join 24+ healthcare facilities already using Advancia Pay
          </p>
          <Link
            href="/register"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">Advancia Pay Ledger</span>
            <div className="space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">
                Terms
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">
                Contact
              </Link>
            </div>
          </div>
          <p className="mt-8 text-gray-400 text-center">
            © 2026 Advancia Pay Ledger. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
