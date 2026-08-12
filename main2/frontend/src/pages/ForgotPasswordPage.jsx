import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { AuthShell } from "../components/auth/AuthShell.jsx";
import { forgotPassword } from "../services/authService.js";

function ForgotPasswordPage() {
  const [serverError, setServerError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "" } });

  async function onSubmit(values) {
    setServerError("");

    try {
      await forgotPassword(values.email);
      setIsSubmitted(true);
    } catch (error) {
      setServerError(
        error?.response?.data?.message || "Unable to send a reset link right now.",
      );
    }
  }

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter your email and we'll send you a link to reset your password."
    >
      {isSubmitted ? (
        <div className="space-y-5 text-center">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            If an account with that email exists, a reset link is on its way. Check your
            inbox (and spam folder).
          </div>
          <Link
            to="/login"
            className="inline-block text-sm font-medium text-stone-950 transition hover:underline"
          >
            Back to login
          </Link>
        </div>
      ) : (
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>

          <p className="text-center text-sm text-stone-600">
            Remembered your password?{" "}
            <Link
              to="/login"
              className="font-medium text-stone-950 transition hover:underline"
            >
              Back to login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export { ForgotPasswordPage };