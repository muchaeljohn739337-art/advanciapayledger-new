import OpenAI from "openai";
import fs from "fs";
import path from "path";

// Security: API key must be set, no defaults
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

// Security: Validate API key format
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey.startsWith("sk-") || apiKey.length < 40) {
  throw new Error("Invalid OPENAI_API_KEY format");
}

const client = new OpenAI({ 
  apiKey,
  // Security: Set timeout to prevent hanging requests
  timeout: 30000,
  // Security: Limit retries
  maxRetries: 2
});

// Security: Whitelist allowed prompt files
const ALLOWED_PROMPTS = [
  "code_review.md",
  "security_audit.md",
  "deployment_check.md",
  "refactor.md"
];

// Security: Validate prompt file path to prevent directory traversal
function validatePromptFile(promptFile: string): string {
  // Remove any path traversal attempts
  const sanitized = path.basename(promptFile);
  
  if (!ALLOWED_PROMPTS.includes(sanitized)) {
    throw new Error(`Prompt file not allowed: ${sanitized}. Allowed: ${ALLOWED_PROMPTS.join(", ")}`);
  }
  
  const promptPath = path.join(process.cwd(), "ai", "prompts", sanitized);
  
  // Security: Verify file exists and is readable
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt file not found: ${sanitized}`);
  }
  
  // Security: Verify file is within allowed directory
  const resolvedPath = path.resolve(promptPath);
  const allowedDir = path.resolve(process.cwd(), "ai", "prompts");
  
  if (!resolvedPath.startsWith(allowedDir)) {
    throw new Error("Path traversal attempt detected");
  }
  
  return promptPath;
}

// Security: Sanitize and validate input
function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }
  
  // Security: Limit input size to prevent abuse
  const MAX_INPUT_LENGTH = 50000; // ~50KB
  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error(`Input too large. Max: ${MAX_INPUT_LENGTH} characters`);
  }
  
  // Security: Check for potential secret leakage patterns
  const secretPatterns = [
    /sk-[a-zA-Z0-9]{32,}/g,           // OpenAI API keys
    /ghp_[a-zA-Z0-9]{36,}/g,          // GitHub tokens
    /AIza[a-zA-Z0-9_-]{35}/g,         // Google API keys
    /[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}/g, // Credit cards
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g // Emails (potential PII)
  ];
  
  for (const pattern of secretPatterns) {
    if (pattern.test(input)) {
      throw new Error("Input contains potential secrets or PII. Sanitize before sending.");
    }
  }
  
  return input.trim();
}

// Security: Filter response for any leaked secrets
function filterResponse(response: string | null): string {
  if (!response) {
    return "";
  }
  
  // Remove any API keys that might have been echoed
  let filtered = response
    .replace(/sk-[a-zA-Z0-9]{32,}/g, "[REDACTED_API_KEY]")
    .replace(/ghp_[a-zA-Z0-9]{36,}/g, "[REDACTED_TOKEN]")
    .replace(/AIza[a-zA-Z0-9_-]{35}/g, "[REDACTED_API_KEY]");
  
  return filtered;
}

/**
 * Run an AI prompt with security safeguards
 * @param promptFile - Name of prompt file (e.g., "code_review.md")
 * @param input - User input to analyze
 * @returns AI response with secrets filtered
 */
export async function runPrompt(
  promptFile: string, 
  input: string
): Promise<string> {
  try {
    // Security: Validate prompt file
    const promptPath = validatePromptFile(promptFile);
    
    // Security: Sanitize input
    const sanitizedInput = sanitizeInput(input);
    
    // Read prompt file
    const systemPrompt = fs.readFileSync(promptPath, "utf8");
    
    // Security: Validate system prompt size
    if (systemPrompt.length > 100000) {
      throw new Error("System prompt too large");
    }
    
    // Call OpenAI API
    const response = await client.chat.completions.create({
      model: "gpt-4", // Use gpt-4, not gpt-5-mini (doesn't exist)
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: sanitizedInput }
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 4000, // Limit response size
    });
    
    // Security: Filter response
    const content = response.choices[0]?.message?.content || "";
    const filtered = filterResponse(content);
    
    // Logging: Log usage for monitoring (without sensitive data)
    console.log(`AI Prompt executed: ${promptFile}, tokens: ${response.usage?.total_tokens || 0}`);
    
    return filtered;
    
  } catch (error) {
    // Security: Don't expose internal errors to caller
    if (error instanceof Error) {
      // Log full error internally
      console.error("AI Client Error:", error.message);
      
      // Return sanitized error
      if (error.message.includes("API key")) {
        throw new Error("Authentication failed");
      }
      if (error.message.includes("rate limit")) {
        throw new Error("Rate limit exceeded. Try again later.");
      }
      if (error.message.includes("timeout")) {
        throw new Error("Request timeout. Try again.");
      }
    }
    
    throw new Error("AI request failed. Check logs for details.");
  }
}

/**
 * Run code review prompt
 */
export async function reviewCode(code: string): Promise<string> {
  return runPrompt("code_review.md", code);
}

/**
 * Run security audit prompt
 */
export async function auditSecurity(code: string): Promise<string> {
  return runPrompt("security_audit.md", code);
}

/**
 * Run deployment check prompt
 */
export async function checkDeployment(deploymentPlan: string): Promise<string> {
  return runPrompt("deployment_check.md", deploymentPlan);
}

/**
 * Run refactoring prompt
 */
export async function suggestRefactor(code: string): Promise<string> {
  return runPrompt("refactor.md", code);
}
