"use client";

import withAdminAuth from "@/hoc/withAdminAuth";

function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-white mb-2">Architecture Visualization</h1>
          <p className="text-white/70 mb-4 text-sm">
            Interactive microservices architecture for Advancia Pay Ledger.
          </p>
          <div className="w-full h-[75vh]">
            <iframe
              src="/architecture-visualization.html"
              title="Microservices Architecture"
              className="w-full h-full rounded-lg border border-white/10 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAdminAuth(ArchitecturePage);
