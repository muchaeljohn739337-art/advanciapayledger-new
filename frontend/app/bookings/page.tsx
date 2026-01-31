"use client"

import { useState } from 'react';
import Link from 'next/link';

export default function BookingSystemPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedChamber, setSelectedChamber] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'chambers' | 'list'>('calendar');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Appointment & Chamber Management
              </h1>
              <p className="text-gray-600 mt-1">Manage bookings, rooms, and schedules</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📅 Calendar
              </button>
              <button
                onClick={() => setViewMode('chambers')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'chambers'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🏥 Chambers
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📋 List
              </button>
              <Link
                href="/bookings/new"
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition"
              >
                + New Booking
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {viewMode === 'calendar' && <CalendarView selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
        {viewMode === 'chambers' && <ChambersView selectedChamber={selectedChamber} setSelectedChamber={setSelectedChamber} />}
        {viewMode === 'list' && <ListView />}
      </div>
    </div>
  );
}

// ============================================
// CALENDAR VIEW
// ============================================

function CalendarView({ selectedDate, setSelectedDate }: any) {
  const today = new Date();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const appointments = [
    { date: 5, time: '09:00 AM', patient: 'John Smith', chamber: 'Room 101', type: 'Consultation' },
    { date: 5, time: '02:30 PM', patient: 'Sarah Johnson', chamber: 'Room 102', type: 'Follow-up' },
    { date: 8, time: '10:00 AM', patient: 'Michael Brown', chamber: 'Room 103', type: 'Procedure' },
    { date: 12, time: '11:30 AM', patient: 'Emma Davis', chamber: 'Room 101', type: 'Consultation' },
  ];

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Calendar */}
      <div className="col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              ←
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
          
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayAppointments = appointments.filter(apt => apt.date === day);
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            
            return (
              <div
                key={day}
                className={`aspect-square p-2 border-2 rounded-xl cursor-pointer transition ${
                  isToday
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="text-sm font-semibold text-gray-900 mb-1">{day}</div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map((apt, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded truncate"
                    >
                      {apt.time.split(' ')[0]}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayAppointments.length - 2}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Today&apos;s Schedule</h3>
        <div className="space-y-4">
          <AppointmentCard
            time="09:00 AM"
            patient="John Smith"
            chamber="Room 101"
            type="Consultation"
            status="confirmed"
          />
          <AppointmentCard
            time="11:30 AM"
            patient="Lisa Anderson"
            chamber="Room 102"
            type="Follow-up"
            status="pending"
          />
          <AppointmentCard
            time="02:30 PM"
            patient="Sarah Johnson"
            chamber="Room 103"
            type="Procedure"
            status="confirmed"
          />
          <AppointmentCard
            time="04:00 PM"
            patient="Mark Wilson"
            chamber="Room 101"
            type="Consultation"
            status="cancelled"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// CHAMBERS VIEW - ROOM MANAGEMENT
// ============================================

function ChambersView({ selectedChamber, setSelectedChamber }: any) {
  const chambers = [
    { id: 'room-101', name: 'Room 101', floor: 1, type: 'Consultation', status: 'occupied', patient: 'John Smith', until: '10:30 AM', capacity: 2, equipment: ['ECG', 'BP Monitor'] },
    { id: 'room-102', name: 'Room 102', floor: 1, type: 'Procedure', status: 'available', patient: null, until: null, capacity: 1, equipment: ['Surgical Lights', 'Monitors'] },
    { id: 'room-103', name: 'Room 103', floor: 1, type: 'Consultation', status: 'maintenance', patient: null, until: null, capacity: 2, equipment: ['X-Ray Viewer'] },
    { id: 'room-201', name: 'Room 201', floor: 2, type: 'Procedure', status: 'occupied', patient: 'Sarah Johnson', until: '03:00 PM', capacity: 1, equipment: ['Monitors', 'Oxygen'] },
    { id: 'room-202', name: 'Room 202', floor: 2, type: 'Consultation', status: 'available', patient: null, until: null, capacity: 3, equipment: ['BP Monitor'] },
    { id: 'room-203', name: 'Room 203', floor: 2, type: 'Emergency', status: 'reserved', patient: 'Reserved', until: '05:00 PM', capacity: 2, equipment: ['Defibrillator', 'Monitors'] },
  ];

  const floor1 = chambers.filter(c => c.floor === 1);
  const floor2 = chambers.filter(c => c.floor === 2);

  return (
    <div className="space-y-8">
      {/* Status Legend */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Chamber Status Legend</h3>
        <div className="flex flex-wrap gap-6">
          <StatusBadge color="green" label="Available" count={2} />
          <StatusBadge color="blue" label="Occupied" count={2} />
          <StatusBadge color="yellow" label="Reserved" count={1} />
          <StatusBadge color="red" label="Maintenance" count={1} />
        </div>
      </div>

      {/* Floor 1 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Floor 1 - Ground Level</h3>
        <div className="grid grid-cols-3 gap-6">
          {floor1.map((chamber) => (
            <ChamberCard
              key={chamber.id}
              chamber={chamber}
              isSelected={selectedChamber === chamber.id}
              onClick={() => setSelectedChamber(chamber.id)}
            />
          ))}
        </div>
      </div>

      {/* Floor 2 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Floor 2 - Upper Level</h3>
        <div className="grid grid-cols-3 gap-6">
          {floor2.map((chamber) => (
            <ChamberCard
              key={chamber.id}
              chamber={chamber}
              isSelected={selectedChamber === chamber.id}
              onClick={() => setSelectedChamber(chamber.id)}
            />
          ))}
        </div>
      </div>

      {/* Visual Diagram */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Facility Layout Diagram</h3>
        <FacilityDiagram chambers={chambers} />
      </div>
    </div>
  );
}

// ============================================
// LIST VIEW
// ============================================

function ListView() {
  const bookings = [
    { id: 1, date: '2026-01-30', time: '09:00 AM', patient: 'John Smith', chamber: 'Room 101', doctor: 'Dr. Sarah Chen', type: 'Consultation', status: 'confirmed' },
    { id: 2, date: '2026-01-30', time: '11:30 AM', patient: 'Lisa Anderson', chamber: 'Room 102', doctor: 'Dr. Michael Lee', type: 'Follow-up', status: 'pending' },
    { id: 3, date: '2026-01-30', time: '02:30 PM', patient: 'Sarah Johnson', chamber: 'Room 103', doctor: 'Dr. Sarah Chen', type: 'Procedure', status: 'confirmed' },
    { id: 4, date: '2026-01-31', time: '10:00 AM', patient: 'Michael Brown', chamber: 'Room 201', doctor: 'Dr. James Wilson', type: 'Consultation', status: 'confirmed' },
    { id: 5, date: '2026-01-31', time: '03:00 PM', patient: 'Emma Davis', chamber: 'Room 202', doctor: 'Dr. Sarah Chen', type: 'Follow-up', status: 'pending' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">All Bookings</h2>
          <input
            type="text"
            placeholder="Search patients, doctors, rooms..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Chamber</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{booking.date}</div>
                  <div className="text-sm text-gray-500">{booking.time}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{booking.patient}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{booking.doctor}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    {booking.chamber}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{booking.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm mr-3">Edit</button>
                  <button className="text-red-600 hover:text-red-700 font-medium text-sm">Cancel</button>
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
// COMPONENTS
// ============================================

function AppointmentCard({ time, patient, chamber, type, status }: any) {
  return (
    <div className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-blue-900">{time}</span>
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
          status === 'confirmed' ? 'bg-green-100 text-green-700' :
          status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {status}
        </span>
      </div>
      <div className="font-semibold text-gray-900">{patient}</div>
      <div className="text-sm text-gray-600 mt-1">{chamber} • {type}</div>
    </div>
  );
}

function ChamberCard({ chamber, isSelected, onClick }: any) {
  const statusColors = {
    available: 'border-green-500 bg-green-50',
    occupied: 'border-blue-500 bg-blue-50',
    maintenance: 'border-red-500 bg-red-50',
    reserved: 'border-yellow-500 bg-yellow-50',
  };

  return (
    <div
      onClick={onClick}
      className={`border-2 rounded-2xl p-6 cursor-pointer transition-all ${
        statusColors[chamber.status as keyof typeof statusColors]
      } ${isSelected ? 'ring-4 ring-blue-300 shadow-lg' : 'hover:shadow-lg'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-gray-900">{chamber.name}</h4>
        <span className={`w-4 h-4 rounded-full ${
          chamber.status === 'available' ? 'bg-green-500' :
          chamber.status === 'occupied' ? 'bg-blue-500' :
          chamber.status === 'maintenance' ? 'bg-red-500' :
          'bg-yellow-500'
        }`}></span>
      </div>
      <div className="text-sm text-gray-600 mb-2">{chamber.type}</div>
      <div className="text-sm font-semibold text-gray-900 mb-3">
        {chamber.patient || 'No patient'}
        {chamber.until && <div className="text-xs text-gray-500">Until {chamber.until}</div>}
      </div>
      <div className="text-xs text-gray-500">
        Capacity: {chamber.capacity} • Equipment: {chamber.equipment.join(', ')}
      </div>
    </div>
  );
}

function StatusBadge({ color, label, count }: any) {
  const colors = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`w-3 h-3 rounded-full bg-${color}-500`}></span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${colors[color as keyof typeof colors]}`}>
        {count}
      </span>
    </div>
  );
}

function FacilityDiagram({ chambers }: any) {
  return (
    <div className="space-y-12">
      {/* Floor 2 Diagram */}
      <div>
        <div className="text-center mb-4 font-bold text-gray-700">FLOOR 2</div>
        <div className="border-4 border-gray-300 rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="grid grid-cols-3 gap-6">
            {chambers.filter((c: any) => c.floor === 2).map((chamber: any) => (
              <DiagramRoom key={chamber.id} chamber={chamber} />
            ))}
          </div>
        </div>
      </div>

      {/* Stairs/Elevator */}
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-3xl">🚪</span>
          <span className="ml-2 text-xs font-bold text-gray-600">STAIRS</span>
        </div>
      </div>

      {/* Floor 1 Diagram */}
      <div>
        <div className="text-center mb-4 font-bold text-gray-700">FLOOR 1 (GROUND)</div>
        <div className="border-4 border-gray-300 rounded-2xl p-8 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="grid grid-cols-3 gap-6">
            {chambers.filter((c: any) => c.floor === 1).map((chamber: any) => (
              <DiagramRoom key={chamber.id} chamber={chamber} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <div className="inline-block bg-gray-800 text-white px-6 py-3 rounded-lg font-bold">
              MAIN ENTRANCE ↓
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagramRoom({ chamber }: any) {
  const statusColors = {
    available: 'bg-green-400 border-green-600',
    occupied: 'bg-blue-400 border-blue-600',
    maintenance: 'bg-red-400 border-red-600',
    reserved: 'bg-yellow-400 border-yellow-600',
  };

  return (
    <div className={`aspect-square border-4 rounded-xl p-4 ${statusColors[chamber.status as keyof typeof statusColors]} flex flex-col items-center justify-center text-white shadow-lg`}>
      <div className="text-2xl font-bold mb-1">{chamber.name.split(' ')[1]}</div>
      <div className="text-xs font-semibold">{chamber.type}</div>
      {chamber.patient && (
        <div className="mt-2 text-xs bg-white/20 px-2 py-1 rounded">
          {chamber.patient}
        </div>
      )}
    </div>
  );
}
