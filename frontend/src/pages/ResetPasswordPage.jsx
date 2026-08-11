import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthShell } from "../components/auth/AuthShell.jsx";
import { useToast } from "../hooks/useToast.js";
import { resetPassword } from "../services/authService.js";

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { newPassword: "", confirmNewPassword: "" } });

  async function onSubmit(values) {
    setServerError("");

    try {
      await resetPassword(token, values);
      toast.success("Password reset", "You can now sign in with your new password.");
      navigate("/login", { replace: true });
    } catch (error) {
      setServerError(
        error?.response?.data?.message ||
          "Unable to reset your password right now.",
      );
    }
  }

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Choose a new password for your account."
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {serverError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm font-medium text-stone-700">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-950 outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-stone-950/5"
            placeholder="Create a new password"
            {...register("newPassword", {
              required: "New password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
          />
          {errors.newPassword ? (
            <p className="text-sm text-rose-600">{errors.newPassword.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmNewPassword"
            className="text-sm font-medium text-stone-700"
          >
            Confirm New Password
          </label>
          <input
            id="confirmNewPassword"
            type="password"
            autoComplete="new-password"
            className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-950 outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-stone-950/5"
            placeholder="Confirm your new password"
            {...register("confirmNewPassword", {
              required: "Please confirm your new password",
              validate: (value) =>
                value === getValues("newPassword") || "Passwords do not match",
            })}
          />
          {errors.confirmNewPassword ? (
            <p className="text-sm text-rose-600">{errors.confirmNewPassword.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Resetting..." : "Reset Password"}
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
    </AuthShell>
  );
}

export { ResetPasswordPage };