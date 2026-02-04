"use client";

import { useState, useEffect } from 'react';
import DevDashboard from '@/components/DevDashboard';

export default function DevPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none italic mb-4">
            Developer Dashboard
          </h1>
          <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs">
            System Monitoring • API Status • Development Tools
          </p>
        </div>
        <DevDashboard />
      </div>
    </div>
  );
}
