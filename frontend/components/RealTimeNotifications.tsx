"use client";

import React, { useEffect, useState } from "react";
import { socketService } from "../lib/socket";
import { Bell, CheckCircle2, AlertCircle, X } from "lucide-react";

interface Notification {
  id: string;
  type: "payment_completed" | "payment_failed";
  message: string;
  data: any;
  timestamp: Date;
}

const RealTimeNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const socket = socketService.connect();

    socketService.on("payment_completed", (data) => {
      const newNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        type: "payment_completed",
        message: `Payment of ${data.amount} ${data.currency} has been successfully reconciled.`,
        data,
        timestamp: new Date(),
      };
      setNotifications((prev) => [newNotification, ...prev]);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 10000);
    });

    socketService.on("payment_failed", (data) => {
      const newNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        type: "payment_failed",
        message: `Payment reconciliation failed: ${data.reason}`,
        data,
        timestamp: new Date(),
      };
      setNotifications((prev) => [newNotification, ...prev]);
    });

    return () => {
      socketService.off("payment_completed");
      socketService.off("payment_failed");
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] space-y-4 max-w-sm w-full">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`p-5 rounded-2xl border shadow-2xl animate-in slide-in-from-right-10 duration-500 flex gap-4 ${
            n.type === "payment_completed"
              ? "bg-emerald-50 border-emerald-100 text-emerald-900"
              : "bg-rose-50 border-rose-100 text-rose-900"
          }`}
        >
          <div className={`p-2 rounded-xl h-fit ${
            n.type === "payment_completed" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          }`}>
            {n.type === "payment_completed" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          </div>
          
          <div className="flex-1 space-y-1">
            <p className="text-xs font-black uppercase tracking-widest opacity-60">
              {n.type === "payment_completed" ? "Payment Confirmed" : "Payment Alert"}
            </p>
            <p className="text-sm font-bold leading-tight">{n.message}</p>
            <p className="text-[10px] font-medium opacity-50">
              {n.timestamp.toLocaleTimeString()}
            </p>
          </div>

          <button
            onClick={() => removeNotification(n.id)}
            className="p-1 hover:bg-black/5 rounded-lg h-fit transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default RealTimeNotifications;
