import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import RealTimeNotifications from "../components/RealTimeNotifications";
import { AuthProvider } from "../contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Advancia PayLedger - Healthcare Payment Processing",
  description: "Secure healthcare payment processing platform with cryptocurrency and traditional payment methods",
  keywords: ["healthcare", "payments", "cryptocurrency", "medical billing"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Real-time WebSocket notifications */}
            <RealTimeNotifications />
            {children}
            {/* AI Chatbot will be globally available */}
            <div id="ai-chatbot-root" />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
