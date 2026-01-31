"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRevenue: 247000,
    monthlyGrowth: 42,
    activeTransactions: 156,
    pendingPayments: 8,
  });

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch user data
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      setUser(data);
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/login");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">Advancia Pay</h1>
        </div>
        <nav className="px-4 space-y-1">
          <NavItem href="/dashboard" icon="📊" label="Dashboard" active />
          <NavItem href="/ledger" icon="📜" label="Ledger" />
          <NavItem href="/payments" icon="💳" label="Payments" />
          <NavItem href="/payroll" icon="👥" label="Payroll" />
          <NavItem href="/vault" icon="🔐" label="Vault" />
          <NavItem href="/reports" icon="📈" label="Reports" />
          <NavItem href="/settings" icon="⚙️" label="Settings" />
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.facility?.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your payments today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`$${(stats.totalRevenue / 1000).toFixed(0)}K`}
            change="+12.5%"
            trend="up"
            icon="💰"
          />
          <StatCard
            title="Monthly Growth"
            value={`${stats.monthlyGrowth}%`}
            change="+5.2%"
            trend="up"
            icon="📈"
          />
          <StatCard
            title="Active Transactions"
            value={stats.activeTransactions.toString()}
            change="+23"
            trend="up"
            icon="🔄"
          />
          <StatCard
            title="Pending Payments"
            value={stats.pendingPayments.toString()}
            change="-3"
            trend="down"
            icon="⏳"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-4">
            <QuickAction
              icon="💳"
              label="Accept Payment"
              href="/payments/new"
            />
            <QuickAction icon="📤" label="Send Money" href="/vault/send" />
            <QuickAction icon="👥" label="Run Payroll" href="/payroll/run" />
            <QuickAction icon="📊" label="View Reports" href="/reports" />
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
              <Link
                href="/ledger"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              <Transaction
                amount={1250.0}
                description="Patient Payment - Invoice #1234"
                type="received"
                time="2 hours ago"
              />
              <Transaction
                amount={850.5}
                description="Crypto Transfer - SOL"
                type="received"
                time="5 hours ago"
              />
              <Transaction
                amount={2100.0}
                description="Payroll - John Doe"
                type="sent"
                time="1 day ago"
              />
              <Transaction
                amount={450.0}
                description="Patient Payment - Invoice #1231"
                type="received"
                time="2 days ago"
              />
            </div>
          </div>

          {/* Wallet Balances */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Wallet Balances</h2>
              <Link
                href="/vault"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Manage →
              </Link>
            </div>
            <div className="space-y-4">
              <WalletBalance coin="SOL" amount="125.5" usdValue="18,523" />
              <WalletBalance coin="ETH" amount="2.4" usdValue="7,200" />
              <WalletBalance coin="USDC" amount="12,450" usdValue="12,450" />
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">
                    Total Value
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    $38,173
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {stats.pendingPayments > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">
                  Action Required
                </h3>
                <p className="text-sm text-yellow-800 mt-1">
                  You have {stats.pendingPayments} pending payments that need
                  review.
                </p>
                <Link
                  href="/payments?status=pending"
                  className="text-sm text-yellow-900 underline font-medium mt-2 inline-block"
                >
                  Review Now →
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
        active
          ? "bg-blue-50 text-blue-600 font-medium"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span
          className={`text-sm font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}
        >
          {change}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  href,
}: {
  icon: string;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
    >
      <span className="text-3xl mb-2">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );
}

function Transaction({
  amount,
  description,
  type,
  time,
}: {
  amount: number;
  description: string;
  type: "received" | "sent";
  time: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            type === "received" ? "bg-green-100" : "bg-red-100"
          }`}
        >
          <span className="text-xl">{type === "received" ? "↓" : "↑"}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{description}</p>
          <p className="text-xs text-gray-500">{time}</p>
        </div>
      </div>
      <span
        className={`font-semibold ${type === "received" ? "text-green-600" : "text-red-600"}`}
      >
        {type === "received" ? "+" : "-"}${amount.toFixed(2)}
      </span>
    </div>
  );
}

function WalletBalance({
  coin,
  amount,
  usdValue,
}: {
  coin: string;
  amount: string;
  usdValue: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="font-bold text-gray-700">{coin}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {amount} {coin}
          </p>
          <p className="text-xs text-gray-500">${usdValue} USD</p>
        </div>
      </div>
    </div>
  );
}
