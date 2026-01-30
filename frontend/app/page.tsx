import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Advancia PayLedger
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Secure healthcare payment processing platform supporting cryptocurrency and traditional payment methods
          </p>
        </header>

        {/* Hero Section */}
        <section className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">
              Modern Healthcare Payments
            </h2>
            <p className="text-gray-600 mb-8">
              Process payments securely with support for credit cards, debit cards, ACH transfers, 
              and major cryptocurrencies including Bitcoin, Ethereum, and Solana.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">HIPAA-compliant security</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Multi-currency support</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Real-time processing</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Comprehensive reporting</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              Get Started
            </h3>
            <div className="space-y-4">
              <Link
                href="/auth/login"
                className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="block w-full bg-gray-200 text-gray-800 text-center py-3 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Create Account
              </Link>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                New to Advancia PayLedger?{" "}
                <Link href="/docs" className="text-blue-600 hover:underline">
                  Learn more
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Compliant</h3>
            <p className="text-gray-600">
              HIPAA-compliant encryption and PCI-DSS standards to protect sensitive healthcare data.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Processing</h3>
            <p className="text-gray-600">
              Real-time payment processing with instant confirmations and automated reconciliation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics & Reporting</h3>
            <p className="text-gray-600">
              Comprehensive dashboard with payment trends, revenue analytics, and detailed reporting.
            </p>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="bg-white p-8 rounded-lg shadow-lg mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Supported Payment Methods
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💳</span>
              </div>
              <p className="text-gray-700 font-medium">Credit Cards</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💳</span>
              </div>
              <p className="text-gray-700 font-medium">Debit Cards</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">₿</span>
              </div>
              <p className="text-gray-700 font-medium">Cryptocurrency</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🏦</span>
              </div>
              <p className="text-gray-700 font-medium">ACH Transfers</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-600">
          <p>&copy; 2026 Advancia PayLedger. All rights reserved.</p>
          <div className="mt-4 space-x-6">
            <Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-600">Terms of Service</Link>
            <Link href="/support" className="hover:text-blue-600">Support</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
