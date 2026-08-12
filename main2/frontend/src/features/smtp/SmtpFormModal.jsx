import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SmtpFormModal({ open, mode, initialValues, serverError, onClose, onSubmit }) {
  const isEditMode = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      transport: "smtp",
      host: "",
      port: 587,
      secure: false,
      username: "",
      password: "",
      fromName: "",
      fromEmail: "",
    },
  });

  const transport = watch("transport");
  const isBrevoApi = transport === "brevo_api";

  useEffect(() => {
    if (open) {
      reset({
        name: initialValues?.name || "",
        transport: initialValues?.transport || "smtp",
        host: initialValues?.host || "",
        port: initialValues?.port ?? 587,
        secure: initialValues?.secure ?? false,
        username: initialValues?.username || "",
        password: "",
        fromName: initialValues?.fromName || "",
        fromEmail: initialValues?.fromEmail || "",
      });
    }
  }, [open, initialValues, reset]);

  async function handleFormSubmit(values) {
    const payload = {
      name: values.name.trim(),
      transport: values.transport,
      fromName: values.fromName.trim(),
      fromEmail: values.fromEmail.trim(),
    };

    if (values.transport === "brevo_api") {
      if (values.password) {
        payload.password = values.password;
      }
    } else {
      payload.host = values.host.trim();
      payload.port = Number(values.port);
      payload.secure = Boolean(values.secure);
      payload.username = values.username.trim();

      if (values.password) {
        payload.password = values.password;
      }
    }

    await onSubmit(payload);
  }

  return (
    <Modal
      open={open}
      title={isEditMode ? "Edit SMTP Configuration" : "Add SMTP Configuration"}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Configuration Name"
            placeholder="e.g. Primary Transactional"
            error={errors.name?.message}
            {...register("name", {
              required: "Name is required",
              minLength: { value: 2, message: "Name must be at least 2 characters" },
            })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Sending Method</label>
            <select
              className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-950 shadow-[0_1px_2px_rgba(28,25,23,0.04)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              {...register("transport")}
            >
              <option value="smtp">SMTP (host/port)</option>
              <option value="brevo_api">Brevo HTTP API</option>
            </select>
          </div>
        </div>

        {isBrevoApi ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-700">
              Sends over HTTPS via Brevo's API instead of raw SMTP — works even on hosts that
              block outbound SMTP ports. Paste your Brevo API key below (Brevo dashboard &rarr;
              SMTP &amp; API &rarr; API Keys).
            </div>
            <Input
              label="Brevo API Key"
              type="password"
              placeholder={isEditMode ? "Leave blank to keep current key" : "xkeysib-..."}
              helperText={isEditMode ? "Leave blank to keep the current key" : undefined}
              error={errors.password?.message}
              {...register("password", {
                required: isEditMode ? false : "API key is required",
              })}
            />
            <Input
              label="From Name"
              placeholder="Acme Notifications"
              error={errors.fromName?.message}
              {...register("fromName", { required: "From name is required" })}
            />
            <Input
              label="From Email"
              type="email"
              placeholder="notifications@acme.com"
              error={errors.fromEmail?.message}
              {...register("fromEmail", {
                required: "From email is required",
                pattern: { value: emailPattern, message: "Enter a valid email address" },
              })}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Host"
              placeholder="smtp.example.com"
              error={errors.host?.message}
              {...register("host", { required: "Host is required" })}
            />
            <Input
              label="Port"
              type="number"
              placeholder="587"
              error={errors.port?.message}
              {...register("port", {
                required: "Port is required",
                min: { value: 1, message: "Port must be between 1 and 65535" },
                max: { value: 65535, message: "Port must be between 1 and 65535" },
              })}
            />
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-stone-300 accent-[var(--accent)] focus:ring-[var(--accent)]/20"
                  {...register("secure")}
                />
                Use TLS/SSL (secure)
              </label>
            </div>
            <Input
              label="Username"
              placeholder="apikey or SMTP username"
              error={errors.username?.message}
              {...register("username", { required: "Username is required" })}
            />
            <Input
              label="Password"
              type="password"
              placeholder={isEditMode ? "Leave blank to keep current password" : "SMTP password"}
              helperText={isEditMode ? "Leave blank to keep the current password" : undefined}
              error={errors.password?.message}
              {...register("password", {
                required: isEditMode ? false : "Password is required",
              })}
            />
            <Input
              label="From Name"
              placeholder="Acme Notifications"
              error={errors.fromName?.message}
              {...register("fromName", { required: "From name is required" })}
            />
            <Input
              label="From Email"
              type="email"
              placeholder="notifications@acme.com"
              error={errors.fromEmail?.message}
              {...register("fromEmail", {
                required: "From email is required",
                pattern: { value: emailPattern, message: "Enter a valid email address" },
              })}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditMode ? "Save Changes" : "Add SMTP"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { SmtpFormModal };
