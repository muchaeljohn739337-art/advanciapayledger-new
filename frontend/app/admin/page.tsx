"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'activity' | 'security' | 'settings'>('dashboard');
  const [timeRange, setTimeRange] = useState('24h');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Admin Header */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/50">
                <span className="text-white font-bold text-xl">⚡</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Console</h1>
                <p className="text-white/60 text-sm">System Management & Monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition">
                <span className="text-2xl">🔔</span>
              </button>
              <Link href="/dashboard" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition">
                Exit Admin
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mt-6">
            <TabButton icon="📊" label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <TabButton icon="👥" label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <TabButton icon="📋" label="Activity" active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
            <TabButton icon="🔒" label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
            <TabButton icon="⚙️" label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'users' && <UsersView />}
        {activeTab === 'activity' && <ActivityView />}
        {activeTab === 'security' && <SecurityView />}
        {activeTab === 'settings' && <SettingsView />}
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD VIEW - OVERVIEW
// ============================================

function DashboardView() {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value="1,247"
          change="+12%"
          trend="up"
          icon="👥"
          gradient="from-blue-500 to-cyan-400"
        />
        <MetricCard
          title="Active Sessions"
          value="342"
          change="+8%"
          trend="up"
          icon="🟢"
          gradient="from-green-500 to-emerald-400"
        />
        <MetricCard
          title="Failed Logins"
          value="18"
          change="-24%"
          trend="down"
          icon="⚠️"
          gradient="from-yellow-500 to-orange-400"
        />
        <MetricCard
          title="Blocked IPs"
          value="5"
          change="+2"
          trend="up"
          icon="🚫"
          gradient="from-red-500 to-pink-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Login Activity */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Login Activity (24h)</h3>
          <LoginActivityChart />
        </div>

        {/* User Distribution */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">User Role Distribution</h3>
          <UserRoleChart />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Recent Critical Events</h3>
        <div className="space-y-3">
          <ActivityRow
            icon="🔴"
            event="Failed Login Attempt"
            user="unknown@suspicious.com"
            time="2 minutes ago"
            ip="192.168.1.100"
            severity="high"
          />
          <ActivityRow
            icon="🟡"
            event="Password Reset"
            user="john.smith@example.com"
            time="15 minutes ago"
            ip="10.0.0.45"
            severity="medium"
          />
          <ActivityRow
            icon="🟢"
            event="New User Registration"
            user="sarah.jones@example.com"
            time="1 hour ago"
            ip="192.168.1.55"
            severity="low"
          />
          <ActivityRow
            icon="🔴"
            event="Multiple Failed Logins"
            user="admin@example.com"
            time="2 hours ago"
            ip="203.0.113.0"
            severity="high"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// USERS VIEW - USER MANAGEMENT
// ============================================

function UsersView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const users = [
    { id: 1, name: 'Dr. Sarah Chen', email: 'sarah.chen@facility.com', role: 'OWNER', status: 'active', lastLogin: '2 min ago', sessions: 3, facility: 'Metro Health' },
    { id: 2, name: 'John Smith', email: 'john.smith@facility.com', role: 'ADMIN', status: 'active', lastLogin: '15 min ago', sessions: 1, facility: 'Metro Health' },
    { id: 3, name: 'Lisa Anderson', email: 'lisa.a@facility.com', role: 'MANAGER', status: 'active', lastLogin: '1 hour ago', sessions: 2, facility: 'Wellness Clinic' },
    { id: 4, name: 'Michael Brown', email: 'michael.b@facility.com', role: 'STAFF', status: 'inactive', lastLogin: '3 days ago', sessions: 0, facility: 'Metro Health' },
    { id: 5, name: 'Emma Davis', email: 'emma.d@facility.com', role: 'ACCOUNTANT', status: 'active', lastLogin: '30 min ago', sessions: 1, facility: 'Wellness Clinic' },
    { id: 6, name: 'James Wilson', email: 'james.w@suspicious.net', role: 'STAFF', status: 'suspended', lastLogin: '5 days ago', sessions: 0, facility: 'Unknown' },
  ];

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatBadge label="Total Users" value="1,247" color="blue" />
        <StatBadge label="Active Now" value="342" color="green" />
        <StatBadge label="Suspended" value="8" color="red" />
        <StatBadge label="Pending" value="23" color="yellow" />
        <StatBadge label="New Today" value="15" color="purple" />
      </div>

      {/* Filters & Search */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search users by name, email, facility..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-96 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg placeholder-white/50 focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
              <option value="ACCOUNTANT">Accountant</option>
            </select>
          </div>
          <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition">
            + Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase">User</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase">Role</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase">Facility</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase">Last Login</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase">Sessions</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-semibold text-white">{user.name}</div>
                    <div className="text-sm text-white/60">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    user.role === 'OWNER' ? 'bg-purple-500/20 text-purple-300' :
                    user.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-300' :
                    user.role === 'MANAGER' ? 'bg-cyan-500/20 text-cyan-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/80">{user.facility}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    user.status === 'active' ? 'bg-green-500/20 text-green-300' :
                    user.status === 'inactive' ? 'bg-gray-500/20 text-gray-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/80">{user.lastLogin}</td>
                <td className="px-6 py-4">
                  <span className="text-white font-semibold">{user.sessions}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button className="p-1 hover:bg-white/10 rounded">
                      <span className="text-lg">👁️</span>
                    </button>
                    <button className="p-1 hover:bg-white/10 rounded">
                      <span className="text-lg">✏️</span>
                    </button>
                    <button className="p-1 hover:bg-white/10 rounded">
                      <span className="text-lg">🚫</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// ACTIVITY VIEW - LOGS & AUDIT TRAIL
// ============================================

function ActivityView() {
  return (
    <div className="space-y-6">
      {/* Activity Filters */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-4 gap-4">
          <select className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg">
            <option>All Events</option>
            <option>Login</option>
            <option>Logout</option>
            <option>User Created</option>
            <option>User Updated</option>
            <option>Password Changed</option>
            <option>Failed Login</option>
            <option>Blocked</option>
          </select>
          <select className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg">
            <option>All Users</option>
            <option>Admins Only</option>
            <option>Suspicious Only</option>
          </select>
          <input
            type="text"
            placeholder="Search IP, User, Action..."
            className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg placeholder-white/50"
          />
          <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold">
            Export Logs
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Activity Timeline</h3>
        <div className="space-y-4">
          <TimelineEvent
            time="2:35 PM"
            event="User Login"
            user="sarah.chen@facility.com"
            details="Successfully logged in from Chrome on Windows"
            ip="192.168.1.50"
            type="success"
          />
          <TimelineEvent
            time="2:32 PM"
            event="Failed Login Attempt"
            user="admin@facility.com"
            details="Invalid password (Attempt 3 of 5)"
            ip="203.0.113.45"
            type="warning"
          />
          <TimelineEvent
            time="2:28 PM"
            event="User Created"
            user="emma.davis@facility.com"
            details="New user registered by john.smith@facility.com"
            ip="10.0.0.25"
            type="info"
          />
          <TimelineEvent
            time="2:15 PM"
            event="Password Changed"
            user="michael.brown@facility.com"
            details="Password reset via email verification"
            ip="192.168.1.75"
            type="info"
          />
          <TimelineEvent
            time="2:10 PM"
            event="IP Blocked"
            user="unknown"
            details="Automatic block after 5 failed login attempts"
            ip="198.51.100.0"
            type="error"
          />
          <TimelineEvent
            time="2:05 PM"
            event="User Logout"
            user="lisa.anderson@facility.com"
            details="Session ended normally"
            ip="192.168.1.60"
            type="success"
          />
          <TimelineEvent
            time="1:50 PM"
            event="Role Changed"
            user="james.wilson@facility.com"
            details="Role changed from STAFF to MANAGER by sarah.chen@facility.com"
            ip="192.168.1.50"
            type="info"
          />
          <TimelineEvent
            time="1:40 PM"
            event="2FA Enabled"
            user="john.smith@facility.com"
            details="Two-factor authentication activated"
            ip="10.0.0.30"
            type="success"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// SECURITY VIEW - THREATS & MONITORING
// ============================================

function SecurityView() {
  return (
    <div className="space-y-6">
      {/* Security Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <SecurityMetric
          title="Failed Logins (24h)"
          value="18"
          status="warning"
          icon="⚠️"
        />
        <SecurityMetric
          title="Blocked IPs"
          value="5"
          status="error"
          icon="🚫"
        />
        <SecurityMetric
          title="Active 2FA Users"
          value="87%"
          status="success"
          icon="🔐"
        />
        <SecurityMetric
          title="Suspicious Activity"
          value="3"
          status="warning"
          icon="🔍"
        />
      </div>

      {/* Threat Detection */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Active Threats</h3>
        <div className="space-y-4">
          <ThreatCard
            severity="high"
            title="Brute Force Attack Detected"
            description="Multiple failed login attempts from IP 203.0.113.45"
            time="5 minutes ago"
            action="Auto-blocked after 5 attempts"
          />
          <ThreatCard
            severity="medium"
            title="Unusual Access Pattern"
            description="User login from new country (Vietnam) - user@example.com"
            time="1 hour ago"
            action="Verification email sent"
          />
          <ThreatCard
            severity="low"
            title="Password Weakness"
            description="3 users with passwords not meeting policy requirements"
            time="2 hours ago"
            action="Warning emails sent"
          />
        </div>
      </div>

      {/* Blocked IPs */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Blocked IP Addresses</h3>
        <div className="space-y-3">
          <BlockedIPRow ip="203.0.113.45" reason="Brute force attack" blocked="5 min ago" attempts={8} />
          <BlockedIPRow ip="198.51.100.0" reason="Multiple failed logins" blocked="2 hours ago" attempts={12} />
          <BlockedIPRow ip="192.0.2.100" reason="SQL injection attempt" blocked="1 day ago" attempts={3} />
          <BlockedIPRow ip="203.0.113.88" reason="DDoS pattern detected" blocked="2 days ago" attempts={150} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// SETTINGS VIEW - SYSTEM CONFIGURATION
// ============================================

function SettingsView() {
  return (
    <div className="space-y-6">
      {/* Security Settings */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Security Settings</h3>
        <div className="space-y-4">
          <SettingRow
            label="Require 2FA for All Users"
            description="Enforce two-factor authentication for all accounts"
            enabled={false}
          />
          <SettingRow
            label="Auto-block After Failed Logins"
            description="Automatically block IP after 5 failed login attempts"
            enabled={true}
          />
          <SettingRow
            label="Password Expiry"
            description="Require password change every 90 days"
            enabled={true}
          />
          <SettingRow
            label="Session Timeout"
            description="Auto-logout after 30 minutes of inactivity"
            enabled={true}
          />
        </div>
      </div>

      {/* Access Control */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Access Control</h3>
        <div className="space-y-4">
          <SettingRow
            label="Allow Registration"
            description="Enable public user registration"
            enabled={true}
          />
          <SettingRow
            label="Email Verification Required"
            description="Users must verify email before login"
            enabled={true}
          />
          <SettingRow
            label="API Access"
            description="Enable REST API access for integrations"
            enabled={true}
          />
          <SettingRow
            label="Webhooks"
            description="Send webhook notifications for events"
            enabled={false}
          />
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Admin Notifications</h3>
        <div className="space-y-4">
          <SettingRow
            label="Email on Failed Login"
            description="Notify admins of failed login attempts"
            enabled={true}
          />
          <SettingRow
            label="Email on New User"
            description="Notify admins when new users register"
            enabled={false}
          />
          <SettingRow
            label="Email on Security Event"
            description="Notify admins of security incidents"
            enabled={true}
          />
          <SettingRow
            label="Daily Security Report"
            description="Send daily summary of security events"
            enabled={true}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTS
// ============================================

function TabButton({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition ${
        active
          ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg'
          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function MetricCard({ title, value, change, trend, icon, gradient }: any) {
  return (
    <div className="group relative">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-20 rounded-2xl blur-xl group-hover:opacity-30 transition`}></div>
      <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-4xl">{icon}</span>
          <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
            trend === 'up' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {change}
          </span>
        </div>
        <p className="text-sm text-white/60 mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }: any) {
  const colors: any = {
    blue: 'from-blue-500 to-cyan-400',
    green: 'from-green-500 to-emerald-400',
    red: 'from-red-500 to-pink-400',
    yellow: 'from-yellow-500 to-orange-400',
    purple: 'from-purple-500 to-pink-400',
  };

  return (
    <div className={`bg-gradient-to-r ${colors[color]} rounded-xl p-4 text-center`}>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/90 mt-1">{label}</div>
    </div>
  );
}

function ActivityRow({ icon, event, user, time, ip, severity }: any) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border-l-4 ${
      severity === 'high' ? 'border-red-500 bg-red-500/10' :
      severity === 'medium' ? 'border-yellow-500 bg-yellow-500/10' :
      'border-green-500 bg-green-500/10'
    }`}>
      <div className="flex items-center space-x-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <div className="font-semibold text-white">{event}</div>
          <div className="text-sm text-white/60">{user} • {ip}</div>
        </div>
      </div>
      <div className="text-sm text-white/60">{time}</div>
    </div>
  );
}

function LoginActivityChart() {
  return (
    <div className="h-64 flex items-end justify-between space-x-2">
      {[45, 52, 48, 65, 58, 72, 68, 85, 78, 92, 88, 95, 82, 98, 87, 100, 94, 88, 92, 85, 89, 93, 97, 91].map((height, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end group">
          <div
            className="bg-gradient-to-t from-purple-600 to-pink-400 rounded-t-lg group-hover:from-purple-500 group-hover:to-pink-300 transition cursor-pointer"
            style={{ height: `${height}%` }}
          ></div>
        </div>
      ))}
    </div>
  );
}

function UserRoleChart() {
  const roles = [
    { name: 'Owner', count: 12, percentage: 5, color: 'from-purple-500 to-pink-400' },
    { name: 'Admin', count: 45, percentage: 18, color: 'from-blue-500 to-cyan-400' },
    { name: 'Manager', count: 78, percentage: 31, color: 'from-cyan-500 to-teal-400' },
    { name: 'Staff', count: 95, percentage: 38, color: 'from-green-500 to-emerald-400' },
    { name: 'Accountant', count: 20, percentage: 8, color: 'from-yellow-500 to-orange-400' },
  ];

  return (
    <div className="space-y-4">
      {roles.map((role, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white font-medium">{role.name}</span>
            <span className="text-white/60">{role.count} users ({role.percentage}%)</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${role.color} rounded-full transition-all duration-500`}
              style={{ width: `${role.percentage}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineEvent({ time, event, user, details, ip, type }: any) {
  const colors = {
    success: 'border-green-500 bg-green-500/10',
    warning: 'border-yellow-500 bg-yellow-500/10',
    error: 'border-red-500 bg-red-500/10',
    info: 'border-blue-500 bg-blue-500/10',
  };

  return (
    <div className={`border-l-4 ${colors[type as keyof typeof colors]} rounded-lg p-4`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold text-white">{event}</div>
          <div className="text-sm text-white/80">{user}</div>
        </div>
        <div className="text-sm text-white/60">{time}</div>
      </div>
      <div className="text-sm text-white/70">{details}</div>
      <div className="text-xs text-white/50 mt-2">IP: {ip}</div>
    </div>
  );
}

function ThreatCard({ severity, title, description, time, action }: any) {
  const colors = {
    high: 'border-red-500 bg-red-500/10',
    medium: 'border-yellow-500 bg-yellow-500/10',
    low: 'border-blue-500 bg-blue-500/10',
  };

  return (
    <div className={`border-l-4 ${colors[severity as keyof typeof colors]} rounded-lg p-4`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 text-xs font-bold rounded ${
              severity === 'high' ? 'bg-red-500 text-white' :
              severity === 'medium' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              {severity.toUpperCase()}
            </span>
            <span className="font-semibold text-white">{title}</span>
          </div>
          <div className="text-sm text-white/80 mt-2">{description}</div>
        </div>
        <div className="text-sm text-white/60">{time}</div>
      </div>
      <div className="text-sm text-white/70 mt-2">
        <span className="text-green-400">Action: </span>{action}
      </div>
    </div>
  );
}

function BlockedIPRow({ ip, reason, blocked, attempts }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div className="flex items-center space-x-4">
        <span className="text-2xl">🚫</span>
        <div>
          <div className="font-bold text-white">{ip}</div>
          <div className="text-sm text-white/70">{reason}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-white/80">Blocked {blocked}</div>
        <div className="text-xs text-red-400">{attempts} failed attempts</div>
      </div>
      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition">
        Unblock
      </button>
    </div>
  );
}

function SecurityMetric({ title, value, status, icon }: any) {
  const colors = {
    success: 'from-green-500 to-emerald-400',
    warning: 'from-yellow-500 to-orange-400',
    error: 'from-red-500 to-pink-400',
  };

  return (
    <div className={`bg-gradient-to-r ${colors[status as keyof typeof colors]} rounded-xl p-6 text-white`}>
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-sm opacity-90 mb-1">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

function SettingRow({ label, description, enabled }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
      <div>
        <div className="font-semibold text-white">{label}</div>
        <div className="text-sm text-white/60">{description}</div>
      </div>
      <button
        className={`relative w-14 h-8 rounded-full transition ${
          enabled ? 'bg-green-500' : 'bg-gray-600'
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
            enabled ? 'translate-x-6' : ''
          }`}
        ></div>
      </button>
    </div>
  );
}
