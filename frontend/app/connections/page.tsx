'use client';

import React, { useState } from 'react';
import { Users, Briefcase, Heart, Building2, Coffee, Calendar, MapPin, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

const ConnectionBridge = () => {
  const [selectedContext, setSelectedContext] = useState<any>(null);

  const contexts = [
    {
      id: 'healthcare',
      icon: Heart,
      title: 'Healthcare & Fintech',
      color: 'bg-rose-500',
      digital: ['Patient portals', 'Telehealth', 'Payment platforms', 'Provider networks'],
      physical: [
        'Host monthly "Coffee with Care" sessions at facilities',
        'Organize quarterly health tech meetups for providers',
        'Create patient appreciation events with facility tours',
        'Run financial wellness workshops in-person',
        'Launch referral partner lunch-and-learns'
      ],
      quickWin: 'Start with one facility hosting monthly patient coffee hours - low cost, high trust building'
    },
    {
      id: 'professional',
      icon: Briefcase,
      title: 'Professional Network',
      color: 'bg-blue-500',
      digital: ['LinkedIn connections', 'Slack communities', 'Email threads', 'Virtual conferences'],
      physical: [
        'Convert top LinkedIn engagers into quarterly dinner guests',
        'Transform Slack channels into local chapter meetups',
        'Create "Coffee Roulette" - random pairing of connections monthly',
        'Host skill-swap workshops in shared workspaces',
        'Organize industry field trips to member companies'
      ],
      quickWin: 'Invite your 10 most engaged LinkedIn connections to a casual happy hour next month'
    },
    {
      id: 'social',
      icon: Users,
      title: 'Social Connections',
      color: 'bg-purple-500',
      digital: ['Social media followers', 'Group chats', 'Online gaming friends', 'Forum members'],
      physical: [
        'Turn group chat into monthly brunch crew',
        'Host interest-based meetups (hiking, gaming nights, book clubs)',
        'Create "IRL badges" - achievements for meeting connections',
        'Organize pop-up experiences based on shared interests',
        'Start tradition of annual reunion events'
      ],
      quickWin: 'Poll your group chat and schedule one activity everyone enjoys this month'
    },
    {
      id: 'community',
      icon: Building2,
      title: 'Online Communities',
      color: 'bg-green-500',
      digital: ['Reddit communities', 'Discord servers', 'Facebook groups', 'Subreddits'],
      physical: [
        'Launch local chapter system with monthly meetups',
        'Create ambassador program for IRL event organizers',
        'Host annual community conference',
        'Organize skill-building workshops with community experts',
        'Run collaborative projects requiring in-person work'
      ],
      quickWin: 'Post in your community asking "Who\'s in [your city]?" and plan a casual meetup'
    },
    {
      id: 'remote',
      icon: Coffee,
      title: 'Remote Teams',
      color: 'bg-orange-500',
      digital: ['Zoom calls', 'Team chat', 'Project management tools', 'Virtual standups'],
      physical: [
        'Quarterly team offsites with meaningful activities',
        'Pair programming sessions in co-working spaces',
        'Department retreats focused on bonding, not just work',
        'Cross-functional lunch swaps in cities with multiple team members',
        'Annual all-hands with family-friendly events'
      ],
      quickWin: 'Block one day next quarter for in-person team building - even if just local team members'
    }
  ];

  const universalPrinciples = [
    {
      title: 'Start Small & Local',
      description: 'Begin with connections in your city. Low travel, higher attendance, easier to build momentum.'
    },
    {
      title: 'Make It Regular',
      description: 'One-offs fade. Monthly or quarterly recurring events build real relationships over time.'
    },
    {
      title: 'Remove Friction',
      description: 'Pick central locations, cover basics (coffee/snacks), clear calendar invites, simple RSVP.'
    },
    {
      title: 'Create Shared Experience',
      description: 'Don\'t just "hang out" - do something together. Activity > talking about activity.'
    },
    {
      title: 'Leverage Digital for Logistics',
      description: 'Use your platforms to organize, remind, share photos after. Digital supports physical, not replaces it.'
    },
    {
      title: 'Build Ritual & Tradition',
      description: 'Name your events, create inside jokes, take group photos. Make people want to be part of it.'
    }
  ];

  const implementationFramework = [
    { phase: 'Month 1', action: 'Pick one context, poll your network, schedule first event' },
    { phase: 'Month 2', action: 'Host first gathering, collect feedback, plan next one' },
    { phase: 'Month 3', action: 'Make it recurring, delegate roles, create event template' },
    { phase: 'Month 4-6', action: 'Expand to new locations, cross-pollinate groups, measure engagement' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-slate-900">Digital → Physical</h1>
            <Sparkles className="w-10 h-10 text-indigo-600" />
          </div>
          <p className="text-xl text-slate-600">Transform your online connections into real-world relationships</p>
        </div>

        {/* Context Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {contexts.map((context) => {
            const Icon = context.icon;
            return (
              <button
                key={context.id}
                onClick={() => setSelectedContext(context)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedContext?.id === context.id
                    ? 'border-indigo-600 shadow-lg scale-105 bg-white'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-md bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg ${context.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{context.title}</h3>
                <p className="text-sm text-slate-500">Click to explore strategies</p>
              </button>
            );
          })}
        </div>

        {/* Selected Context Details */}
        {selectedContext && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-12 border-2 border-indigo-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{selectedContext.title} Bridge</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  Digital Touchpoints
                </h3>
                <ul className="space-y-2">
                  {selectedContext.digital.map((item: string, i: number) => (
                    <li key={i} className="text-slate-600 pl-4">{item}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Physical Experiences
                </h3>
                <ul className="space-y-2">
                  {selectedContext.physical.map((item: string, i: number) => (
                    <li key={i} className="text-slate-600 flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-1 text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Quick Win
              </h3>
              <p className="text-slate-700">{selectedContext.quickWin}</p>
            </div>
          </div>
        )}

        {/* Universal Principles */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Universal Principles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {universalPrinciples.map((principle, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-slate-900">{principle.title}</h3>
                </div>
                <p className="text-sm text-slate-600">{principle.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Implementation Timeline */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="w-7 h-7" />
            Your 6-Month Roadmap
          </h2>
          <div className="space-y-4">
            {implementationFramework.map((step, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="bg-white text-indigo-600 font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{step.phase}</h3>
                    <p className="text-indigo-100">{step.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12 p-6 bg-slate-900 rounded-xl">
          <p className="text-slate-300 text-lg mb-4">Remember: The best digital platforms amplify real relationships, they don&apos;t replace them.</p>
          <p className="text-indigo-400 font-semibold">Start with one event. This month. Make it happen.</p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionBridge;
