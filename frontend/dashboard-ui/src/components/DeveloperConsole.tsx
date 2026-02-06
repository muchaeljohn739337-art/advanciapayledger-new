"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Terminal,
  Send,
  Copy,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Command,
  ArrowUp,
  ArrowDown,
  Home,
  MoveHorizontal,
} from "lucide-react";

interface ConsoleCommand {
  id: string;
  command: string;
  output: string;
  timestamp: string;
  type: "input" | "output" | "error" | "success";
}

interface CommandHistory {
  commands: string[];
  index: number;
}

export default function DeveloperConsole() {
  const [commands, setCommands] = useState<ConsoleCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [history, setHistory] = useState<CommandHistory>({
    commands: [],
    index: -1,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const commandSuggestions = [
    "deploy service",
    "restart service",
    "logs service",
    "status service",
    "config get",
    "config set",
    "health check",
    "metrics get",
    "cache clear",
    "db migrate",
    "ai task list",
    "ai task run",
    "web3 events",
    "security scan",
    "help",
  ];

  useEffect(() => {
    // Add welcome message
    const welcomeCommand: ConsoleCommand = {
      id: "welcome",
      command: "",
      output: `🚀 Advancia Developer Console v1.0.0
Type 'help' for available commands or use Tab for suggestions.

Available Services:
• api-gateway (port 3000)
• monitoring-service (port 3002)  
• web3-service (port 3003)
• ai-orchestrator (port 3004)

Quick Commands:
• deploy <service> - Deploy a service
• restart <service> - Restart a service
• logs <service> - View service logs
• status - Check all services status`,
      timestamp: new Date().toISOString(),
      type: "output",
    };
    setCommands([welcomeCommand]);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  const executeCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    const commandId = Date.now().toString();
    const timestamp = new Date().toISOString();

    // Add command to history
    setCommands((prev) => [
      ...prev,
      {
        id: commandId,
        command: commandText,
        output: "",
        timestamp,
        type: "input",
      },
    ]);

    // Add to command history
    setHistory((prev) => ({
      commands: [...prev.commands, commandText],
      index: -1,
    }));

    setIsProcessing(true);
    setCurrentCommand("");

    try {
      // Simulate command execution
      const output = await processCommand(commandText);

      setCommands((prev) => [
        ...prev,
        {
          id: `${commandId}-output`,
          command: "",
          output,
          timestamp: new Date().toISOString(),
          type: output.toLowerCase().includes("error") ? "error" : "success",
        },
      ]);
    } catch (error) {
      setCommands((prev) => [
        ...prev,
        {
          id: `${commandId}-error`,
          command: "",
          output: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date().toISOString(),
          type: "error",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const processCommand = async (commandText: string): Promise<string> => {
    const [command, ...args] = commandText.trim().split(" ");

    switch (command.toLowerCase()) {
      case "help":
        return `Available Commands:
• deploy <service> - Deploy a service
• restart <service> - Restart a service  
• logs <service> - View service logs
• status - Check all services status
• config get <key> - Get configuration
• config set <key> <value> - Set configuration
• health check - Run health check
• metrics get - Get system metrics
• cache clear - Clear cache
• db migrate - Run database migration
• ai task list - List AI tasks
• ai task run <type> - Run AI task
• web3 events - View Web3 events
• security scan - Run security scan
• clear - Clear console
• history - Show command history

Services: api-gateway, monitoring-service, web3-service, ai-orchestrator`;

      case "clear":
        setCommands([]);
        return "Console cleared";

      case "history":
        return history.commands
          .slice(-10)
          .map((cmd, i) => `${i + 1}. ${cmd}`)
          .join("\n");

      case "status":
        return `Service Status:
✅ api-gateway - Running (99.9% uptime)
✅ monitoring-service - Running (CPU: 23%, Memory: 45%)
✅ web3-service - Running (Events: 1,247 processed)
✅ ai-orchestrator - Running (Tasks: 3 active)

Overall: HEALTHY`;

      case "deploy":
        if (!args[0]) {
          return "Error: Service name required. Usage: deploy <service>";
        }
        return `Deploying ${args[0]}...
✅ Build completed
✅ Tests passed
✅ Deployment successful
🚀 ${args[0]} is now running version v2.1.3`;

      case "restart":
        if (!args[0]) {
          return "Error: Service name required. Usage: restart <service>";
        }
        return `Restarting ${args[0]}...
⏹️ Service stopped
▶️ Service starting
✅ ${args[0]} restarted successfully`;

      case "logs":
        if (!args[0]) {
          return "Error: Service name required. Usage: logs <service>";
        }
        return `Recent logs for ${args[0]}:
[${new Date().toISOString()}] INFO: Service started successfully
[${new Date(Date.now() - 60000).toISOString()}] INFO: Health check passed
[${new Date(Date.now() - 120000).toISOString()}] WARN: High memory usage detected
[${new Date(Date.now() - 180000).toISOString()}] INFO: Request processed: GET /health`;

      case "health":
        return `Health Check Results:
✅ API Gateway: All endpoints responding
✅ Database: Connection healthy (45/100 connections)
✅ Redis: Connected (1.2MB memory used)
✅ Web3: All chains connected
✅ AI Services: All models responding

Overall Status: HEALTHY`;

      case "metrics":
        return `System Metrics:
CPU: 23% (4 cores available)
Memory: 45% (8.2GB / 16GB)
Disk: 67% (120GB / 180GB)
Network: 1.2MB/s up, 3.4MB/s down
Uptime: 14d 7h 23m`;

      case "ai":
        if (args[0] === "task" && args[1] === "list") {
          return `Active AI Tasks:
1. Code Generation (running) - 1,247 tokens used
2. Security Analysis (pending) - Queue position: 2
3. Performance Optimization (completed) - 892 tokens used

Queue: 2 pending tasks`;
        }
        if (args[0] === "task" && args[1] === "run") {
          if (!args[2]) {
            return "Error: Task type required. Usage: ai task run <type>";
          }
          return `Running AI task: ${args[2]}
⚡ Processing request...
🧠 Analyzing with Claude...
✅ Task completed successfully
Output: Analysis complete. 3 recommendations generated.
Tokens used: 1,247`;
        }
        return "Usage: ai task <list|run> [type]";

      case "web3":
        if (args[0] === "events") {
          return `Recent Web3 Events:
• Ethereum: Transfer event (0x1234...abcd) - 2 min ago
• Solana: Account change (9Wz2...xyz) - 5 min ago  
• Polygon: Swap event (0x5678...efgh) - 8 min ago
• Base: Mint event (0x9012...ijkl) - 12 min ago

Total events today: 1,247`;
        }
        return "Usage: web3 events";

      case "security":
        if (args[0] === "scan") {
          return `Security Scan Results:
✅ Authentication: No vulnerabilities found
✅ API Endpoints: Rate limiting active
✅ Database: All connections encrypted
✅ Web3: Smart contracts audited
⚠️ Warnings: 2 services using outdated dependencies

Overall: SECURE`;
        }
        return "Usage: security scan";

      default:
        return `Command not found: ${command}
Type 'help' for available commands`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        executeCommand(currentCommand);
        break;

      case "Tab":
        e.preventDefault();
        // Auto-complete
        const matches = commandSuggestions.filter((cmd) =>
          cmd.startsWith(currentCommand.toLowerCase()),
        );
        if (matches.length > 0) {
          setCurrentCommand(matches[0]);
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (history.commands.length > 0) {
          const newIndex = Math.min(
            history.index + 1,
            history.commands.length - 1,
          );
          const command =
            history.commands[history.commands.length - 1 - newIndex];
          setCurrentCommand(command);
          setHistory({ ...history, index: newIndex });
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        if (history.index > 0) {
          const newIndex = history.index - 1;
          const command =
            history.commands[history.commands.length - 1 - newIndex];
          setCurrentCommand(command);
          setHistory({ ...history, index: newIndex });
        } else if (history.index === 0) {
          setCurrentCommand("");
          setHistory({ ...history, index: -1 });
        }
        break;

      case "Home":
        e.preventDefault();
        inputRef.current?.setSelectionRange(0, 0);
        break;

      case "End":
        e.preventDefault();
        const input = inputRef.current;
        if (input) {
          const len = input.value.length;
          input.setSelectionRange(len, len);
        }
        break;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getCommandIcon = (type: string) => {
    switch (type) {
      case "input":
        return <ChevronDown className="w-3 h-3 text-blue-400" />;
      case "output":
        return <CheckCircle className="w-3 h-3 text-emerald-400" />;
      case "error":
        return <AlertTriangle className="w-3 h-3 text-red-400" />;
      default:
        return <Terminal className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="bg-black/90 backdrop-blur-md rounded-[2rem] border border-white/20 p-6 font-mono">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-black text-green-400">
            Developer Console
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              copyToClipboard(
                commands.map((c) => c.command || c.output).join("\n"),
              )
            }
            className="p-2 hover:bg-white/10 rounded transition"
            title="Copy all output"
          >
            <Copy className="w-4 h-4 text-white/60" />
          </button>
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Console Output */}
      <div
        ref={terminalRef}
        className="bg-black/50 rounded-lg p-4 h-96 overflow-y-auto mb-4 text-sm"
      >
        {commands.map((cmd) => (
          <div key={cmd.id} className="mb-2">
            {cmd.command && (
              <div className="flex items-start gap-2">
                <span className="text-green-400">$</span>
                <span className="text-white">{cmd.command}</span>
                <button
                  onClick={() => copyToClipboard(cmd.command)}
                  className="ml-auto opacity-0 hover:opacity-100 transition"
                >
                  <Copy className="w-3 h-3 text-white/40" />
                </button>
              </div>
            )}
            {cmd.output && (
              <div className="ml-4">
                <div className="flex items-start gap-2">
                  {getCommandIcon(cmd.type)}
                  <pre
                    className={`whitespace-pre-wrap ${
                      cmd.type === "error"
                        ? "text-red-400"
                        : cmd.type === "success"
                          ? "text-emerald-400"
                          : "text-gray-300"
                    }`}
                  >
                    {cmd.output}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-center gap-2 text-blue-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Command Input */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="text-green-400">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Enter command..."
            className="flex-1 bg-transparent text-white outline-none placeholder-white/40"
            disabled={isProcessing}
          />
          <button
            onClick={() => executeCommand(currentCommand)}
            disabled={isProcessing || !currentCommand.trim()}
            className="p-2 hover:bg-white/10 rounded transition disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Auto-complete Suggestions */}
        {showSuggestions && currentCommand && (
          <div
            ref={suggestionsRef}
            className="absolute bottom-full left-0 mb-2 bg-black/90 border border-white/20 rounded-lg p-2 z-10"
          >
            {commandSuggestions
              .filter((cmd) =>
                cmd.toLowerCase().startsWith(currentCommand.toLowerCase()),
              )
              .slice(0, 5)
              .map((suggestion, index) => (
                <div
                  key={index}
                  className="px-3 py-1 text-sm text-white/80 hover:bg-white/10 rounded cursor-pointer"
                  onClick={() => {
                    setCurrentCommand(suggestion);
                    inputRef.current?.focus();
                  }}
                >
                  {suggestion}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Command Hints */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span>Tab: Auto-complete</span>
          <span>↑/↓: Command history</span>
          <span>Home/End: Navigate</span>
          <span>Ctrl+C: Clear</span>
        </div>
      </div>
    </div>
  );
}
