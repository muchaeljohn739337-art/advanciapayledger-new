import React, { useState } from 'react';
import { Wallet, Building2, Brain, Users, TrendingUp, Globe, Shield, Zap, CheckCircle2, Circle, DollarSign } from 'lucide-react';

interface Opportunity {
  name: string;
  revenue: string;
  synergy: string;
  nextStep: string;
  estimatedRevenue?: string;
  timeToMarket?: string;
  capitalRequired?: string;
  priority?: number;
  status?: 'not_started' | 'planning' | 'in_progress' | 'launched';
}

interface Hub {
  icon: any;
  color: string;
  title: string;
  tagline: string;
  opportunities: Opportunity[];
}

interface EcosystemHubs {
  [key: string]: Hub;
}

const BusinessEcosystem = () => {
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [completedOpportunities, setCompletedOpportunities] = useState<string[]>([]);
  const [opportunityStatus, setOpportunityStatus] = useState<{[key: string]: string}>({});

  const ecosystemHubs: EcosystemHubs = {
    crypto: {
      icon: Wallet,
      color: 'from-purple-500 to-indigo-600',
      title: 'Crypto & Payments',
      tagline: 'Your Foundation: Advancia Pay Ledger',
      opportunities: [
        {
          name: 'White-Label Payment Gateway',
          revenue: 'SaaS licensing to healthcare providers',
          synergy: 'Leverage your multi-chain infrastructure',
          nextStep: 'Package admin features as resellable platform',
          estimatedRevenue: '$50K-$200K MRR',
          timeToMarket: '2-3 months',
          capitalRequired: 'Low ($5K)',
          priority: 1,
          status: 'planning'
        },
        {
          name: 'Crypto Payroll for Medical Staff',
          revenue: 'Transaction fees + subscription tiers',
          synergy: 'Use existing wallet + medical facility integration',
          nextStep: 'Add automated salary conversion & tax reporting',
          estimatedRevenue: '$20K-$100K MRR',
          timeToMarket: '1-2 months',
          capitalRequired: 'Low ($3K)',
          priority: 2,
          status: 'not_started'
        },
        {
          name: 'Cross-Border Medical Tourism Payments',
          revenue: 'FX spreads + instant settlement fees',
          synergy: 'Combine healthcare booking + multi-currency',
          nextStep: 'Partner with medical tourism agencies',
          estimatedRevenue: '$30K-$150K MRR',
          timeToMarket: '3-4 months',
          capitalRequired: 'Medium ($15K)',
          priority: 3,
          status: 'not_started'
        },
        {
          name: 'DeFi Health Savings Accounts',
          revenue: 'Yield sharing + management fees',
          synergy: 'Integrate staking protocols with healthcare wallets',
          nextStep: 'Research regulatory compliance per jurisdiction',
          estimatedRevenue: '$100K-$500K MRR',
          timeToMarket: '6-12 months',
          capitalRequired: 'High ($50K)',
          priority: 4,
          status: 'not_started'
        }
      ]
    },
    healthcare: {
      icon: Building2,
      color: 'from-emerald-500 to-teal-600',
      title: 'Healthcare Tech',
      tagline: 'Built-In Medical Facility Management',
      opportunities: [
        {
          name: 'AI-Powered Bed Management Platform',
          revenue: 'Per-bed monthly SaaS fees',
          synergy: 'Enhance existing bed tracking with AI predictions',
          nextStep: 'Add occupancy forecasting & automated transfers',
          estimatedRevenue: '$40K-$200K MRR',
          timeToMarket: '2-3 months',
          capitalRequired: 'Medium ($10K)',
          priority: 1,
          status: 'planning'
        },
        {
          name: 'Telehealth Integration Module',
          revenue: 'Per-consultation fees + API access',
          synergy: 'Connect appointments to video + payment capture',
          nextStep: 'Integrate video SDK + prescription routing',
          estimatedRevenue: '$25K-$120K MRR',
          timeToMarket: '2-3 months',
          capitalRequired: 'Medium ($12K)',
          priority: 2,
          status: 'not_started'
        },
        {
          name: 'Medical Records Marketplace',
          revenue: 'Storage fees + patient data licensing (anonymized)',
          synergy: 'Use blockchain for immutable health records',
          nextStep: 'Implement HIPAA-compliant encryption',
          estimatedRevenue: '$50K-$300K MRR',
          timeToMarket: '6-9 months',
          capitalRequired: 'High ($40K)',
          priority: 4,
          status: 'not_started'
        },
        {
          name: 'Healthcare Analytics Dashboard',
          revenue: 'Tiered subscription for facilities',
          synergy: 'Aggregate audit logs into actionable insights',
          nextStep: 'Build predictive models for patient flow',
          estimatedRevenue: '$30K-$150K MRR',
          timeToMarket: '3-4 months',
          capitalRequired: 'Medium ($8K)',
          priority: 3,
          status: 'not_started'
        }
      ]
    },
    ai: {
      icon: Brain,
      color: 'from-rose-500 to-pink-600',
      title: 'AI Integration',
      tagline: '25+ AI Agents Already Integrated',
      opportunities: [
        {
          name: 'Medical Coding Assistant',
          revenue: 'Per-claim processing fees',
          synergy: 'Train Claude on medical billing codes',
          nextStep: 'Fine-tune on ICD-10 + CPT datasets',
          estimatedRevenue: '$60K-$250K MRR',
          timeToMarket: '3-5 months',
          capitalRequired: 'Medium ($20K)',
          priority: 2,
          status: 'not_started'
        },
        {
          name: 'Smart Contract Auditor',
          revenue: 'Security audit subscriptions',
          synergy: 'Use AI to scan DeFi integrations',
          nextStep: 'Create vulnerability detection agents',
          estimatedRevenue: '$40K-$180K MRR',
          timeToMarket: '4-6 months',
          capitalRequired: 'Medium ($15K)',
          priority: 3,
          status: 'not_started'
        },
        {
          name: 'Patient Support Chatbot',
          revenue: 'White-label licensing to clinics',
          synergy: 'Deploy Ollama models for private data',
          nextStep: 'Build HIPAA-compliant local inference',
          estimatedRevenue: '$20K-$100K MRR',
          timeToMarket: '2-3 months',
          capitalRequired: 'Low ($5K)',
          priority: 1,
          status: 'planning'
        },
        {
          name: 'Fraud Detection Engine',
          revenue: 'Usage-based API pricing',
          synergy: 'Apply AI to transaction audit logs',
          nextStep: 'Train on historical fraud patterns',
          estimatedRevenue: '$35K-$200K MRR',
          timeToMarket: '3-4 months',
          capitalRequired: 'Medium ($12K)',
          priority: 2,
          status: 'not_started'
        }
      ]
    }
  };

  const crossPollination = [
    {
      icon: TrendingUp,
      title: 'Revenue Multipliers',
      items: [
        'Bundle crypto payroll + bed management for hospital networks',
        'Offer AI fraud detection as premium add-on to payment gateway',
        'Cross-sell telehealth to existing Advancia Pay users'
      ]
    },
    {
      icon: Globe,
      title: 'Market Expansion',
      items: [
        'Target emerging markets with medical tourism + crypto needs',
        'Partner with health insurance companies needing blockchain claims',
        'License tech stack to non-competing fintech companies'
      ]
    },
    {
      icon: Shield,
      title: 'Competitive Moats',
      items: [
        'Multi-chain + healthcare combo is unique positioning',
        'Local AI models = data privacy advantage',
        'Integrated audit logging = compliance selling point'
      ]
    }
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'launched': return 'text-green-400';
      case 'in_progress': return 'text-blue-400';
      case 'planning': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status?: string) => {
    return status === 'launched' || status === 'in_progress' ? CheckCircle2 : Circle;
  };

  const calculateTotalRevenue = () => {
    let min = 0, max = 0;
    Object.values(ecosystemHubs).forEach(hub => {
      hub.opportunities.forEach(opp => {
        if (opp.estimatedRevenue) {
          const matches = opp.estimatedRevenue.match(/\$(\d+)K-\$(\d+)K/);
          if (matches) {
            min += parseInt(matches[1]);
            max += parseInt(matches[2]);
          }
        }
      });
    });
    return { min, max };
  };

  const totalRevenue = calculateTotalRevenue();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-teal-400 bg-clip-text text-transparent">
            Your Business Ecosystem
          </h1>
          <p className="text-xl text-slate-300 mb-4">
            Built on your passions: Crypto, Healthcare & AI
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-slate-300">
                Total Potential: <span className="font-bold text-green-400">${totalRevenue.min}K-${totalRevenue.max}K MRR</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-slate-300">
                <span className="font-bold text-yellow-400">12</span> Opportunities
              </span>
            </div>
          </div>
        </div>

        {/* Core Hubs */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {Object.entries(ecosystemHubs).map(([key, hub]) => {
            const Icon = hub.icon;
            const inProgress = hub.opportunities.filter(o => o.status === 'in_progress' || o.status === 'planning').length;
            return (
              <div
                key={key}
                onClick={() => setSelectedHub(selectedHub === key ? null : key)}
                className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 ${
                  selectedHub === key ? 'ring-4 ring-white shadow-2xl' : ''
                } bg-gradient-to-br ${hub.color}`}
              >
                <Icon className="w-12 h-12 mb-4" />
                <h2 className="text-2xl font-bold mb-2">{hub.title}</h2>
                <p className="text-sm opacity-90 mb-3">{hub.tagline}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    {hub.opportunities.length} opportunities
                  </span>
                  {inProgress > 0 && (
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                      {inProgress} active
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Opportunities */}
        {selectedHub && (
          <div className="mb-12 animate-fadeIn">
            <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Zap className="text-yellow-400" />
              {ecosystemHubs[selectedHub].title} Opportunities
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {ecosystemHubs[selectedHub].opportunities.map((opp, idx) => {
                const StatusIcon = getStatusIcon(opp.status);
                return (
                  <div
                    key={idx}
                    className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 hover:border-slate-500 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-xl font-bold text-white flex-1">{opp.name}</h4>
                      <StatusIcon className={`w-5 h-5 ${getStatusColor(opp.status)}`} />
                    </div>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div>
                        <span className="text-green-400 font-semibold">💰 Revenue: </span>
                        <span className="text-slate-300">{opp.revenue}</span>
                      </div>
                      {opp.estimatedRevenue && (
                        <div>
                          <span className="text-emerald-400 font-semibold">📊 Potential: </span>
                          <span className="text-slate-300">{opp.estimatedRevenue}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-blue-400 font-semibold">🔗 Synergy: </span>
                        <span className="text-slate-300">{opp.synergy}</span>
                      </div>
                      {opp.timeToMarket && (
                        <div>
                          <span className="text-orange-400 font-semibold">⏱️ Time: </span>
                          <span className="text-slate-300">{opp.timeToMarket}</span>
                        </div>
                      )}
                      {opp.capitalRequired && (
                        <div>
                          <span className="text-yellow-400 font-semibold">💵 Capital: </span>
                          <span className="text-slate-300">{opp.capitalRequired}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-700">
                      <span className="text-purple-400 font-semibold">✨ Next Step: </span>
                      <span className="text-slate-300 text-sm">{opp.nextStep}</span>
                    </div>

                    {opp.priority && (
                      <div className="mt-3">
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">
                          Priority {opp.priority}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cross-Pollination Strategies */}
        <div className="mt-12">
          <h3 className="text-3xl font-bold mb-6 text-center">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Cross-Pollination Strategies
            </span>
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {crossPollination.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
                >
                  <Icon className="w-10 h-10 mb-4 text-yellow-400" />
                  <h4 className="text-xl font-bold mb-4">{section.title}</h4>
                  <ul className="space-y-3">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">▸</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Action Roadmap */}
        <div className="mt-12 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl p-8 border border-indigo-500/30">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Users className="text-indigo-400" />
            30-Day Quick Wins
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="font-bold text-indigo-400 mb-2">Week 1-2: Package & Position</div>
              <ul className="text-sm space-y-1 text-slate-300">
                <li>• Create white-label demo of Advancia Pay admin panel</li>
                <li>• Draft pitch deck for healthcare facilities</li>
                <li>• Set up productized pricing tiers</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="font-bold text-emerald-400 mb-2">Week 3-4: Validate & Launch</div>
              <ul className="text-sm space-y-1 text-slate-300">
                <li>• Interview 5 clinic managers about pain points</li>
                <li>• Build MVP of bed management AI predictor</li>
                <li>• Launch beta with 2 pilot hospitals</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-400 text-sm">
          <p>Click any hub above to explore specific opportunities</p>
          <p className="mt-2">Built on your existing tech stack + domain expertise</p>
        </div>
      </div>
    </div>
  );
};

export default BusinessEcosystem;
