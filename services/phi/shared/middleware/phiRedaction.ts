// PHI Redaction Middleware for Express
// Prevents accidental PHI logging

interface PHIPatterns {
  ssn: RegExp;
  memberID: RegExp;
  dob: RegExp;
  email: RegExp;
  phone: RegExp;
}

const PHI_PATTERNS: PHIPatterns = {
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  memberID: /\b[A-Z]{2,3}\d{6,12}\b/g,
  dob: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
};

const PHI_FIELDS = [
  "first_name",
  "last_name",
  "dob",
  "ssn",
  "member_id",
  "diagnosis_codes",
  "procedure_codes",
  "patient_id",
  "insurance_card",
  "raw_payload",
];

export function redactPHI(obj: any): any {
  if (typeof obj === "string") {
    let redacted = obj;
    Object.values(PHI_PATTERNS).forEach((pattern) => {
      redacted = redacted.replace(pattern, "[REDACTED]");
    });
    return redacted;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactPHI);
  }

  if (obj && typeof obj === "object") {
    const redacted: any = {};
    for (const key in obj) {
      if (PHI_FIELDS.includes(key)) {
        redacted[key] = "[REDACTED]";
      } else {
        redacted[key] = redactPHI(obj[key]);
      }
    }
    return redacted;
  }

  return obj;
}

export function phiRedactionMiddleware(req: any, res: any, next: any) {
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    // In production, log redacted version
    if (process.env.NODE_ENV === "production") {
      console.log("Response:", redactPHI(body));
    }
    return originalJson(body);
  };

  // Redact request body in logs
  if (req.body && process.env.NODE_ENV === "production") {
    console.log("Request body:", redactPHI(req.body));
  }

  next();
}
