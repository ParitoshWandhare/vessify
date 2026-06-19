"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Zap, ArrowRight, Building2, Check } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../services/auth.service";
import { registerSchema, type RegisterInput } from "../../lib/validations";

type FieldErrors = Partial<Record<keyof RegisterInput, string>>;

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
    organizationName: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof RegisterInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        organizationName: fieldErrors.organizationName?.[0],
      });
      return;
    }

    setIsLoading(true);
    try {
      await authService.register(form);
      toast.success("Account created! Welcome to Vessify.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md relative z-10"
    >
      <div className="glass-strong rounded-2xl p-8 purple-glow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 mb-4">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-slate-400 text-sm">
            Start tracking your finances with Vessify
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Smith"
              className="glass-input w-full rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="glass-input w-full rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="glass-input w-full rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm pr-10 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}

            {/* Password strength indicators */}
            {form.password.length > 0 && (
              <div className="mt-2 space-y-1">
                {passwordRules.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${rule.test(form.password) ? "bg-emerald-500" : "bg-white/10"}`}>
                      {rule.test(form.password) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-xs transition-colors ${rule.test(form.password) ? "text-emerald-400" : "text-slate-500"}`}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Organization */}
          <div>
            <label htmlFor="organizationName" className="block text-sm font-medium text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                Organization name
              </span>
            </label>
            <input
              id="organizationName"
              name="organizationName"
              type="text"
              value={form.organizationName}
              onChange={handleChange}
              placeholder="My Personal Finances"
              className="glass-input w-full rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              Your organization keeps your data isolated from other users.
            </p>
            {errors.organizationName && (
              <p className="mt-1 text-xs text-red-400">{errors.organizationName}</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full mt-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-all duration-200 flex items-center justify-center gap-2 purple-glow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/8" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-transparent text-slate-500">Already have an account?</span>
          </div>
        </div>

        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg glass text-slate-300 hover:text-white text-sm font-medium transition-all duration-200 hover:border-white/15 group"
        >
          Sign in instead
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <p className="text-center text-xs text-slate-600 mt-4">
        Each organization is fully isolated — your data stays yours.
      </p>
    </motion.div>
  );
}
