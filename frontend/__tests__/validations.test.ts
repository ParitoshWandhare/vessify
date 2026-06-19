import { describe, it, expect } from "@jest/globals";
import { loginSchema, registerSchema } from "../lib/validations";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a short password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "Password123",
      organizationName: "Jane's Org",
    });
    expect(result.success).toBe(true);
  });

  it("rejects password without uppercase letter", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
      organizationName: "Jane's Org",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing organization name", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "Password123",
      organizationName: "",
    });
    expect(result.success).toBe(false);
  });
});
