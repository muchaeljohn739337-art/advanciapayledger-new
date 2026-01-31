import React from 'react';
import FinancialInsights from "./FinancialInsights";
import CashFlowChart from "./CashFlowChart";

const MOCK_CHART_DATA = [
  { date: "Jan 24", inflow: 4500, outflow: 2100, balance: 2400 },
  { date: "Jan 25", inflow: 5200, outflow: 3400, balance: 4200 },
  { date: "Jan 26", inflow: 3800, outflow: 4100, balance: 3900 },
  { date: "Jan 27", inflow: 6100, outflow: 2800, balance: 7200 },
  { date: "Jan 28", inflow: 5900, outflow: 3200, balance: 9900 },
  { date: "Jan 29", inflow: 7200, outflow: 4500, balance: 12600 },
  { date: "Jan 30", inflow: 8100, outflow: 3900, balance: 16800 },
];

const DashboardSimple: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Analytics Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900">$1,234,567</p>
            <p className="text-sm text-green-600">+12% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Active Patients
            </h3>
            <p className="text-2xl font-bold text-gray-900">1,234</p>
            <p className="text-sm text-green-600">+5% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Transactions</h3>
            <p className="text-2xl font-bold text-gray-900">5,678</p>
            <p className="text-sm text-green-600">+8% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
            <p className="text-2xl font-bold text-gray-900">98.5%</p>
            <p className="text-sm text-green-600">+0.5% from last month</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Cash Flow Trend
          </h2>
          <CashFlowChart data={MOCK_CHART_DATA} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium text-gray-900">
                  Payment processed - John Doe
                </p>
                <p className="text-sm text-gray-500">2 minutes ago</p>
              </div>
              <span className="text-green-600 font-medium">$250.00</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium text-gray-900">
                  Crypto settlement - Solana
                </p>
                <p className="text-sm text-gray-500">15 minutes ago</p>
              </div>
              <span className="text-green-600 font-medium">$1,250.00</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">
                  Payroll processed - Marketing Team
                </p>
                <p className="text-sm text-gray-500">1 hour ago</p>
              </div>
              <span className="text-red-600 font-medium">-$12,500.00</span>
            </div>
          </div>
        </div>

        {/* AI Financial Insights Section */}
        <div className="mt-8">
          <FinancialInsights userId="current-user-id" />
        </div>
      </div>
    </div>
  );
};

export default DashboardSimple;
