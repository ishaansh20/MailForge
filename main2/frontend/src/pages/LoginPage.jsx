import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { AuthShell } from "../components/auth/AuthShell.jsx";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  async function onSubmit(values) {
    setServerError("");

    try {
      await login(values);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message || "Unable to sign in right now.";
      setServerError(message);
    }
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to manage campaigns, contacts, and account activity from one place."
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {serverError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-stone-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-950 outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-stone-950/5"
            placeholder="you@company.com"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email address",
              },
            })}
          />
          {errors.email ? (
            <p className="text-sm text-rose-600">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-stone-700"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 pr-20 text-sm text-stone-950 outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-stone-950/5"
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((currentValue) => !currentValue)}
              className="absolute inset-y-0 right-3 my-auto rounded-lg px-2 text-sm font-medium text-stone-500 transition hover:text-stone-950"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password ? (
            <p className="text-sm text-rose-600">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-stone-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-stone-300 accent-[var(--accent)] focus:ring-[var(--accent)]/20"
              {...register("rememberMe")}
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="font-medium text-stone-600 transition hover:text-stone-950"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>

        <p className="text-center text-sm text-stone-600">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-stone-950 transition hover:underline"
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export { LoginPage };
