import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";

function ListFormModal({ open, mode, initialValues, serverError, onClose, onSubmit }) {
  const isEditMode = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initialValues?.name || "",
        description: initialValues?.description || "",
      });
    }
  }, [open, initialValues, reset]);

  async function handleFormSubmit(values) {
    await onSubmit({
      name: values.name.trim(),
      description: values.description.trim(),
    });
  }

  return (
    <Modal
      open={open}
      title={isEditMode ? "Edit List" : "New List"}
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
          label="List Name"
          placeholder="Newsletter Subscribers"
          error={errors.name?.message}
          {...register("name", {
            required: "Name is required",
            minLength: { value: 2, message: "Name must be at least 2 characters" },
          })}
        />
        <Input
          label="Description"
          placeholder="Optional description"
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditMode ? "Save Changes" : "Create List"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { ListFormModal };
