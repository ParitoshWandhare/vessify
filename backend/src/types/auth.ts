export interface AuthContext {
  userId: string;
  organizationId: string;
  role: string;
  sessionId: string;
}

declare module "hono" {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}
