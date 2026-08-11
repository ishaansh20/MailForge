import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { RichTextEditor } from "../../components/ui/RichTextEditor.jsx";

function TemplateFormModal({ open, mode, initialValues, serverError, onClose, onSubmit }) {
  const isEditMode = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: "", subject: "", body: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initialValues?.name || "",
        subject: initialValues?.subject || "",
        body: initialValues?.body || "",
      });
    }
  }, [open, initialValues, reset]);

  async function handleFormSubmit(values) {
    await onSubmit({
      name: values.name.trim(),
      subject: values.subject.trim(),
      body: values.body,
    });
  }

  return (
    <Modal
      open={open}
      title={isEditMode ? "Edit Template" : "New Template"}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        <Input
          label="Template Name"
          placeholder="Welcome Email"
          error={errors.name?.message}
          {...register("name", {
            required: "Name is required",
            minLength: { value: 2, message: "Name must be at least 2 characters" },
          })}
        />

        <Input
          label="Subject"
          placeholder="Welcome, {{name}}!"
          helperText="Use {{name}} to personalize the subject and body with each recipient's name."
          error={errors.subject?.message}
          {...register("subject", { required: "Subject is required" })}
        />

        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <p className="font-medium">Dynamic variables</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sky-700">
            <li>
              <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-xs">{"{{name}}"}</code>{" "}
              — recipient&apos;s name. Works in both the subject and the body.
            </li>
            <li>
              <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-xs">
                {"{{unsubscribe_url}}"}
              </code>{" "}
              — place this anywhere in your HTML to control exactly where the unsubscribe link
              appears. If you leave it out, one is added automatically at the bottom when this
              template is used in a campaign.
            </li>
          </ul>
        </div>

        <Controller
          name="body"
          control={control}
          rules={{ required: "Email body is required" }}
          render={({ field }) => (
            <RichTextEditor
              label="Email Body"
              value={field.value}
              onChange={field.onChange}
              error={errors.body?.message}
            />
          )}
        />

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditMode ? "Save Changes" : "Create Template"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { TemplateFormModal };
