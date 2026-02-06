"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type AdminRole =
  | "SUPER_ADMIN"
  | "FACILITY_ADMIN"
  | "FACILITY_STAFF"
  | "BILLING_MANAGER";

const withAdminAuth = (
  WrappedComponent: React.ComponentType<any>,
  allowedRoles: AdminRole[] = ["SUPER_ADMIN", "FACILITY_ADMIN"],
) => {
  const Wrapper = (props: any) => {
    const router = useRouter();
    const { user, loading } = useAuth();

    const isAuthorized = user && allowedRoles.includes(user.role as AdminRole);

    useEffect(() => {
      if (!loading && !isAuthorized) {
        router.push("/login");
      }
    }, [user, loading, router, isAuthorized]);

    if (loading || !isAuthorized) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  return Wrapper;
};

export default withAdminAuth;
