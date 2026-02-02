import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FinancialProjections = () => {
  const [scenario, setScenario] = useState('base');
  const [view, setView] = useState('revenue');

  // Base assumptions
  const assumptions = {
    conservative: {
      monthlyGrowth: 0.15, // 15% MoM
      avgRevenuePerFacility: 10300, // $247K / 24 facilities
      churnRate: 0.05,
      targetMargin: 0.70,
    },
    base: {
      monthlyGrowth: 0.25, // 25% MoM (below current 42%)
      avgRevenuePerFacility: 10300,
      churnRate: 0.03,
      targetMargin: 0.75,
    },
    aggressive: {
      monthlyGrowth: 0.35, // 35% MoM (still below current)
      avgRevenuePerFacility: 10300,
      churnRate: 0.02,
      targetMargin: 0.80,
    }
  };

  const currentAssumptions = assumptions[scenario];

  // Generate monthly projections for Year 1
  const generateMonthlyData = () => {
    const data = [];
    let currentMRR = 247000;
    let facilities = 24;
    
    for (let month = 0; month <= 12; month++) {
      const churned = Math.floor(facilities * currentAssumptions.churnRate);
      const netNew = Math.round(currentMRR * currentAssumptions.monthlyGrowth / currentAssumptions.avgRevenuePerFacility);
      
      facilities = facilities - churned + netNew;
      currentMRR = facilities * currentAssumptions.avgRevenuePerFacility;
      
      const grossRevenue = currentMRR;
      const cogs = grossRevenue * (1 - currentAssumptions.targetMargin);
      const grossProfit = grossRevenue - cogs;
      
      // OpEx scaling with revenue
      const salesMarketing = grossRevenue * 0.35;
      const rdEngineering = grossRevenue * 0.25;
      const generalAdmin = grossRevenue * 0.15;
      const totalOpEx = salesMarketing + rdEngineering + generalAdmin;
      
      const ebitda = grossProfit - totalOpEx;
      const cashFlow = ebitda;
      
      data.push({
        period: month === 0 ? 'Current' : `M${month}`,
        month: month,
        revenue: Math.round(grossRevenue),
        facilities: facilities,
        cogs: Math.round(cogs),
        grossProfit: Math.round(grossProfit),
        grossMargin: currentAssumptions.targetMargin,
        salesMarketing: Math.round(salesMarketing),
        rdEngineering: Math.round(rdEngineering),
        generalAdmin: Math.round(generalAdmin),
        totalOpEx: Math.round(totalOpEx),
        ebitda: Math.round(ebitda),
        cashFlow: Math.round(cashFlow),
      });
    }
    
    return data;
  };

  // Generate annual projections for Years 2-5
  const generateAnnualData = () => {
    const monthlyData = generateMonthlyData();
    const lastMonth = monthlyData[12];
    
    const data = [{
      year: 1,
      revenue: monthlyData.slice(1).reduce((sum, m) => sum + m.revenue, 0),
      facilities: lastMonth.facilities,
      ebitda: monthlyData.slice(1).reduce((sum, m) => sum + m.ebitda, 0),
      cashFlow: monthlyData.slice(1).reduce((sum, m) => sum + m.cashFlow, 0),
    }];
    
    let currentMRR = lastMonth.revenue;
    let facilities = lastMonth.facilities;
    
    // Project Years 2-5 with gradually decreasing growth
    const yearlyGrowthRates = {
      conservative: [1.8, 1.5, 1.3, 1.2],
      base: [2.2, 1.8, 1.5, 1.3],
      aggressive: [2.8, 2.2, 1.8, 1.5],
    };
    
    for (let year = 2; year <= 5; year++) {
      const growthMultiplier = yearlyGrowthRates[scenario][year - 2];
      const annualRevenue = data[year - 2].revenue * growthMultiplier;
      facilities = Math.round(facilities * growthMultiplier);
      
      const cogs = annualRevenue * (1 - currentAssumptions.targetMargin);
      const grossProfit = annualRevenue - cogs;
      
      // OpEx as % of revenue (improving with scale)
      const opExRate = Math.max(0.60 - (year * 0.05), 0.40);
      const totalOpEx = annualRevenue * opExRate;
      
      const ebitda = grossProfit - totalOpEx;
      
      data.push({
        year,
        revenue: Math.round(annualRevenue),
        facilities,
        ebitda: Math.round(ebitda),
        cashFlow: Math.round(ebitda),
        ebitdaMargin: ebitda / annualRevenue,
      });
    }
    
    return data;
  };

  // Calculate key metrics
  const calculateMetrics = () => {
    const annualData = generateAnnualData();
    const year1 = annualData[0];
    const year5 = annualData[4];
    
    return {
      year1Revenue: year1.revenue,
      year5Revenue: year5.revenue,
      cagr: Math.pow(year5.revenue / year1.revenue, 1/4) - 1,
      year1Facilities: year1.facilities,
      year5Facilities: year5.facilities,
      avgRevenuePerFacility: currentAssumptions.avgRevenuePerFacility * 12,
      grossMargin: currentAssumptions.targetMargin,
      year5EbitdaMargin: year5.ebitdaMargin,
      seedRaise: 1500000,
      valuation: 8000000,
      runway: calculateRunway(),
    };
  };

  const calculateRunway = () => {
    const monthlyData = generateMonthlyData();
    let cash = 1500000; // Seed raise
    let months = 0;
    
    for (let i = 1; i < monthlyData.length; i++) {
      cash += monthlyData[i].cashFlow;
      months++;
      if (cash <= 0) break;
    }
    
    return months;
  };

  const monthlyData = generateMonthlyData();
  const annualData = generateAnnualData();
  const metrics = calculateMetrics();

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const formatPercent = (value) => `${(value * 100).toFixed(0)}%`;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Advancia Pay Ledger</h1>
        <h2 className="text-xl text-gray-600 mb-6">Financial Projections (5-Year Model)</h2>
        
        {/* Scenario Selector */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setScenario('conservative')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              scenario === 'conservative'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Conservative (15% MoM)
          </button>
          <button
            onClick={() => setScenario('base')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              scenario === 'base'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Base Case (25% MoM)
          </button>
          <button
            onClick={() => setScenario('aggressive')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              scenario === 'aggressive'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Aggressive (35% MoM)
          </button>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Year 1 Revenue</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.year1Revenue)}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Year 5 Revenue</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.year5Revenue)}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Revenue CAGR</div>
            <div className="text-2xl font-bold text-purple-600">{formatPercent(metrics.cagr)}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Runway (Months)</div>
            <div className="text-2xl font-bold text-orange-600">{metrics.runway}M</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Facilities (Y1)</div>
            <div className="text-2xl font-bold text-indigo-600">{metrics.year1Facilities}</div>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Facilities (Y5)</div>
            <div className="text-2xl font-bold text-teal-600">{metrics.year5Facilities}</div>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Gross Margin</div>
            <div className="text-2xl font-bold text-pink-600">{formatPercent(metrics.grossMargin)}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Y5 EBITDA Margin</div>
            <div className="text-2xl font-bold text-yellow-600">{formatPercent(metrics.year5EbitdaMargin)}</div>
          </div>
        </div>

        {/* View Selector */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setView('revenue')}
            className={`px-4 py-2 rounded transition-colors ${
              view === 'revenue' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Revenue Growth
          </button>
          <button
            onClick={() => setView('profitability')}
            className={`px-4 py-2 rounded transition-colors ${
              view === 'profitability' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Profitability
          </button>
          <button
            onClick={() => setView('facilities')}
            className={`px-4 py-2 rounded transition-colors ${
              view === 'facilities' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Customer Growth
          </button>
        </div>

        {/* Charts */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          {view === 'revenue' && (
            <>
              <h3 className="text-lg font-semibold mb-4">Revenue Projections (5-Year)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={annualData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Annual Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {view === 'profitability' && (
            <>
              <h3 className="text-lg font-semibold mb-4">EBITDA Trajectory</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={annualData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="ebitda" stroke="#10B981" strokeWidth={2} name="EBITDA" />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}

          {view === 'facilities' && (
            <>
              <h3 className="text-lg font-semibold mb-4">Healthcare Facilities Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={annualData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="facilities" stroke="#8B5CF6" strokeWidth={3} name="Total Facilities" />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Detailed Monthly Breakdown (Year 1) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold mb-4">Year 1 Monthly Detail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Month</th>
                  <th className="px-4 py-2 text-right">MRR</th>
                  <th className="px-4 py-2 text-right">Facilities</th>
                  <th className="px-4 py-2 text-right">Gross Profit</th>
                  <th className="px-4 py-2 text-right">EBITDA</th>
                  <th className="px-4 py-2 text-right">Cash Flow</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-2 font-medium">{month.period}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(month.revenue)}</td>
                    <td className="px-4 py-2 text-right">{month.facilities}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(month.grossProfit)}</td>
                    <td className={`px-4 py-2 text-right ${month.ebitda < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(month.ebitda)}
                    </td>
                    <td className={`px-4 py-2 text-right ${month.cashFlow < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(month.cashFlow)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Annual Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
          <h3 className="text-lg font-semibold mb-4">5-Year Annual Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Year</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                  <th className="px-4 py-2 text-right">Facilities</th>
                  <th className="px-4 py-2 text-right">EBITDA</th>
                  <th className="px-4 py-2 text-right">EBITDA Margin</th>
                  <th className="px-4 py-2 text-right">Cash Flow</th>
                </tr>
              </thead>
              <tbody>
                {annualData.map((year) => (
                  <tr key={year.year} className={year.year % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-2 font-medium">Year {year.year}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(year.revenue)}</td>
                    <td className="px-4 py-2 text-right">{year.facilities}</td>
                    <td className={`px-4 py-2 text-right ${year.ebitda < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(year.ebitda)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {year.ebitdaMargin ? formatPercent(year.ebitdaMargin) : '-'}
                    </td>
                    <td className={`px-4 py-2 text-right ${year.cashFlow < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(year.cashFlow)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Assumptions */}
        <div className="bg-blue-50 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-semibold mb-3">Key Assumptions ({scenario} scenario)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Monthly Growth Rate</div>
              <div className="font-semibold">{formatPercent(currentAssumptions.monthlyGrowth)}</div>
            </div>
            <div>
              <div className="text-gray-600">Avg Revenue/Facility</div>
              <div className="font-semibold">{formatCurrency(currentAssumptions.avgRevenuePerFacility)}/mo</div>
            </div>
            <div>
              <div className="text-gray-600">Monthly Churn Rate</div>
              <div className="font-semibold">{formatPercent(currentAssumptions.churnRate)}</div>
            </div>
            <div>
              <div className="text-gray-600">Target Gross Margin</div>
              <div className="font-semibold">{formatPercent(currentAssumptions.targetMargin)}</div>
            </div>
            <div>
              <div className="text-gray-600">Seed Raise</div>
              <div className="font-semibold">{formatCurrency(metrics.seedRaise)}</div>
            </div>
            <div>
              <div className="text-gray-600">Post-Money Valuation</div>
              <div className="font-semibold">{formatCurrency(metrics.valuation)}</div>
            </div>
            <div>
              <div className="text-gray-600">Starting MRR</div>
              <div className="font-semibold">{formatCurrency(247000)}</div>
            </div>
            <div>
              <div className="text-gray-600">Starting Facilities</div>
              <div className="font-semibold">24</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialProjections;
