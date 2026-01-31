"use client";

import React, { useState } from "react";
import {
  Users,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
} from "lucide-react";
import { Employee } from "../lib/types";

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "emp_1",
    name: "Sarah Chen",
    role: "Chief Medical Officer",
    salary: 18500,
    lastPaid: "2024-05-01",
    status: "Active",
  },
  {
    id: "emp_2",
    name: "Marcus Rodriguez",
    role: "Head of Operations",
    salary: 12400,
    lastPaid: "2024-05-01",
    status: "Active",
  },
  {
    id: "emp_3",
    name: "Elena Petrova",
    role: "Senior Administrator",
    salary: 9800,
    lastPaid: "2024-05-01",
    status: "Active",
  },
  {
    id: "emp_4",
    name: "David Kim",
    role: "Financial Analyst",
    salary: 11200,
    lastPaid: "2024-05-01",
    status: "Active",
  },
  {
    id: "emp_5",
    name: "Jordan Smith",
    role: "IT Infrastructure",
    salary: 10500,
    lastPaid: "2024-05-01",
    status: "On Leave",
  },
];

const Payroll: React.FC = () => {
  const [employees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [isProcessing, setIsProcessing] = useState(false);
  const totalMonthlyPayroll = employees.reduce(
    (acc, curr) => acc + curr.salary,
    0,
  );

  const runPayroll = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            Payroll Engine
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Managing compensation for 24 healthcare facilities.
          </p>
        </div>
        <button
          onClick={runPayroll}
          disabled={isProcessing}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-3 disabled:opacity-50"
        >
          {isProcessing ? (
            <Clock className="animate-spin" size={16} />
          ) : (
            <DollarSign size={16} />
          )}
          {isProcessing ? "Processing Payouts..." : "Run Monthly Payroll"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Monthly Liability
          </p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">
            ${totalMonthlyPayroll.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Total Headcount
          </p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">
            {employees.length} FTEs
          </p>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
            Next Payout Date
          </p>
          <p className="text-3xl font-black italic tracking-tighter">
            JUNE 01, 2024
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search staff..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-400">
              <Filter size={18} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">
              <Plus size={14} /> Add Staff
            </button>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Employee
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Role
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Monthly Salary
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Last Paid
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees.map((emp) => (
              <tr
                key={emp.id}
                className="hover:bg-slate-50/50 transition-colors group"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                      {emp.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <p className="font-black text-slate-900 tracking-tight">
                      {emp.name}
                    </p>
                  </div>
                </td>
                <td className="px-8 py-6 text-sm font-bold text-slate-500">
                  {emp.role}
                </td>
                <td className="px-8 py-6 text-sm font-black text-slate-900">
                  ${emp.salary.toLocaleString()}
                </td>
                <td className="px-8 py-6 text-sm font-bold text-slate-400">
                  {emp.lastPaid}
                </td>
                <td className="px-8 py-6">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      emp.status === "Active"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payroll;
