"use client"

import withAdminAuth from "@/hoc/withAdminAuth";
import { useState, useEffect } from "react";

// Mock data based on the new schema
const mockUsers: any[] = [
  {
    id: '1',
    firstName: 'Super',
    lastName: 'Admin',
    email: 'super@admin.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    facilityId: 'facility-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    firstName: 'Facility',
    lastName: 'Admin',
    email: 'facility@admin.com',
    role: 'FACILITY_ADMIN',
    status: 'ACTIVE',
    facilityId: 'facility-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    firstName: 'John',
    lastName: 'Patient',
    email: 'john@patient.com',
    role: 'PATIENT',
    status: 'PENDING_VERIFICATION',
    facilityId: 'facility-2',
    createdAt: new Date().toISOString(),
  },
];

function SuperAdminDashboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Super Admin Dashboard</h1>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Facility ID</th>
                    <th className="px-4 py-2 text-left">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="px-4 py-2">{user.firstName} {user.lastName}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.role}</td>
                      <td className="px-4 py-2">{user.status}</td>
                      <td className="px-4 py-2">{user.facilityId}</td>
                      <td className="px-4 py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAdminAuth(SuperAdminDashboardPage, ['SUPER_ADMIN']);
