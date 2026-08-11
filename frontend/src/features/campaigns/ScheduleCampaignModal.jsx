import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";

function toLocalDateTimeInputValue(date) {
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function ScheduleCampaignModal({ open, campaign, serverError, onClose, onSubmit }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { scheduledAt: "" } });

  useEffect(() => {
    if (!open) {
      return;
    }

    const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
    reset({ scheduledAt: toLocalDateTimeInputValue(defaultDate) });
  }, [open, reset]);

  async function handleFormSubmit(values) {
    await onSubmit(new Date(values.scheduledAt).toISOString());
  }

  return (
    <Modal open={open} title="Schedule Campaign" onClose={onClose} maxWidth="max-w-md">
      <form className="space-y-5" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        <p className="text-sm text-stone-500">
          "{campaign?.name}" will automatically send to{" "}
          {campaign?.targetList ? `"${campaign.targetList.name}"` : "every subscribed contact"} at
          the date and time you choose below.
        </p>

        <Input
          type="datetime-local"
          label="Send at"
          error={errors.scheduledAt?.message}
          {...register("scheduledAt", { required: "Choose a date and time" })}
        />

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { ScheduleCampaignModal };
