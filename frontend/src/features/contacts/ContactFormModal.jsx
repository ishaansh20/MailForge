import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ContactFormModal({ open, mode, initialValues, serverError, onClose, onSubmit }) {
  const isEditMode = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initialValues?.name || "",
        email: initialValues?.email || "",
      });
    }
  }, [open, initialValues, reset]);

  async function handleFormSubmit(values) {
    await onSubmit({
      name: values.name.trim(),
      email: values.email.trim(),
    });
  }

  return (
    <Modal
      open={open}
      title={isEditMode ? "Edit Contact" : "Add Contact"}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        <Input
          label="Name"
          placeholder="Jane Doe"
          error={errors.name?.message}
          {...register("name", { required: "Name is required" })}
        />
        <Input
          label="Email"
          type="email"
          placeholder="jane@example.com"
          error={errors.email?.message}
          {...register("email", {
            required: "Email is required",
            pattern: { value: emailPattern, message: "Enter a valid email address" },
          })}
        />

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditMode ? "Save Changes" : "Add Contact"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { ContactFormModal };
