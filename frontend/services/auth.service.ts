import { signIn, signUp, signOut, organization } from "../lib/auth";
import type { LoginInput, RegisterInput } from "../lib/validations";

export const authService = {
  async register(input: RegisterInput) {
    // 1. Create account via Better Auth
    const result = await signUp.email({
      name: input.name,
      email: input.email,
      password: input.password,
    });

    if (result.error) {
      throw new Error(result.error.message ?? "Registration failed");
    }

    // 2. Create organization via Better Auth organizations plugin
    const orgSlug = input.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const orgResult = await organization.create({
      name: input.organizationName,
      slug: `${orgSlug}-${Date.now()}`,
    });

    if (orgResult.error) {
      // Account was created but org failed — still return success
      // User can create org later. Log error for monitoring.
      console.error("Organization creation failed:", orgResult.error);
    }

    return result;
  },

  async login(input: LoginInput) {
    const result = await signIn.email({
      email: input.email,
      password: input.password,
    });

    if (result.error) {
      throw new Error(result.error.message ?? "Login failed");
    }

    return result;
  },

  async logout() {
    await signOut();
  },
};
