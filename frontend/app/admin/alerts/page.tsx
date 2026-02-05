"use client";

import { useState, useEffect } from "react";
import AdminAlertDashboard from "@/components/AdminAlertDashboard";
import { authenticate } from "@/lib/auth";

export default function AlertsPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const user = await authenticate();
      if (user?.role === "SUPER_ADMIN" || user?.role === "FACILITY_ADMIN") {
        setIsAuthorized(true);
      } else {
        window.location.href = "/admin/login";
      }
    } catch (error) {
      console.error("Authorization check failed:", error);
      window.location.href = "/admin/login";
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminAlertDashboard />
      </div>
    </div>
  );
}
