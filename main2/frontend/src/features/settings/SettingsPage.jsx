import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { updateProfile, changePassword } from "../../services/authService.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ProfileCard() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: user?.name || "", email: user?.email || "" },
  });

  async function onSubmit(values) {
    setServerError("");

    try {
      const result = await updateProfile({
        name: values.name.trim(),
        email: values.email.trim(),
      });
      updateUser(result.user);
      toast.success("Profile updated", "Your account details were saved successfully.");
    } catch (error) {
      setServerError(
        error?.response?.data?.message || "Unable to update your profile right now.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-stone-950">Profile</h2>
        <p className="mt-1 text-sm text-stone-500">Update your account name and email address.</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
          {serverError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {serverError}
            </div>
          ) : null}

          <Input
            label="Name"
            error={errors.name?.message}
            {...register("name", {
              required: "Name is required",
              minLength: { value: 2, message: "Name must be at least 2 characters" },
            })}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: { value: emailPattern, message: "Enter a valid email address" },
            })}
          />

          <div className="flex justify-end border-t border-stone-200 pt-5">
            <Button type="submit" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard() {
  const toast = useToast();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  async function onSubmit(values) {
    setServerError("");

    try {
      await changePassword(values);
      toast.success("Password changed", "Your password was updated successfully.");
      reset();
    } catch (error) {
      setServerError(
        error?.response?.data?.message || "Unable to change your password right now.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-stone-950">Change Password</h2>
        <p className="mt-1 text-sm text-stone-500">
          Choose a strong password you don&apos;t use anywhere else.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
          {serverError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {serverError}
            </div>
          ) : null}

          <Input
            label="Current Password"
            type="password"
            error={errors.currentPassword?.message}
            {...register("currentPassword", { required: "Current password is required" })}
          />
          <Input
            label="New Password"
            type="password"
            error={errors.newPassword?.message}
            {...register("newPassword", {
              required: "New password is required",
              minLength: { value: 8, message: "Password must be at least 8 characters" },
            })}
          />
          <Input
            label="Confirm New Password"
            type="password"
            error={errors.confirmNewPassword?.message}
            {...register("confirmNewPassword", {
              required: "Please confirm your new password",
              validate: (value) => value === getValues("newPassword") || "Passwords do not match",
            })}
          />

          <div className="flex justify-end border-t border-stone-200 pt-5">
            <Button type="submit" loading={isSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        subtitle="Manage your account profile and security."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Settings", to: "/settings" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <ProfileCard />
        <ChangePasswordCard />
      </div>
    </div>
  );
}

export { SettingsPage };
