"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { Transaction, TransactionStatus, TransactionType } from "../lib/types";
import { analyzeFinancialData } from "../services/geminiService";

interface ChatBotProps {
  onClose: () => void;
  transactions: Transaction[];
}

const ChatBot: React.FC<ChatBotProps> = ({ onClose, transactions }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Hello! I'm your Advancia AI Assistant. How can I help you analyze your financial data today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      text: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await analyzeFinancialData(transactions, input);
      const botMessage: ChatMessage = {
        role: "model",
        text: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: "model",
        text: "I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl z-[60] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold">Advancia AI</h3>
            <p className="text-[10px] text-indigo-100 opacity-80 uppercase tracking-widest font-bold">
              Financial Expert
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-200 text-slate-400"
                }`}
              >
                {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white border border-slate-200 text-slate-400">
                <Bot size={14} />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                <span className="text-xs text-slate-400 font-medium">
                  Advancia is analyzing...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about payroll, expenses, or forecasts..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="mt-3 text-[10px] text-center text-slate-400">
          Powered by Advancia AI Engine. Data accuracy varies by ledger
          completeness.
        </p>
      </div>
    </div>
  );
};

export default ChatBot;
