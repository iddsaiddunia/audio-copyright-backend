// Placeholder for future persistent audit logging
export function logAudit(action: string, details: Record<string, any>) {
  // Replace with DB or file logging in production
  console.log(`[AUDIT] ${action}:`, details);
}
