import React from 'react';

const DashboardSimple: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900">$1,234,567</p>
            <p className="text-sm text-green-600">+12% from last month</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active Patients</h3>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium text-gray-900">Payment processed - John Doe</p>
                <p className="text-sm text-gray-500">2 minutes ago</p>
              </div>
              <span className="text-green-600 font-medium">$250.00</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium text-gray-900">Crypto settlement - Solana</p>
                <p className="text-sm text-gray-500">15 minutes ago</p>
              </div>
              <span className="text-green-600 font-medium">$1,250.00</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Payroll processed - Marketing Team</p>
                <p className="text-sm text-gray-500">1 hour ago</p>
              </div>
              <span className="text-red-600 font-medium">-$12,500.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSimple;
