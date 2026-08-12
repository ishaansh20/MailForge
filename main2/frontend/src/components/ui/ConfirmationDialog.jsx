import { Button } from "./Button.jsx";
import { Modal } from "./Modal.jsx";

function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onClose,
  isLoading = false,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} maxWidth="max-w-md">
      <p className="text-sm leading-6 text-stone-600">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={confirmVariant}
          loading={isLoading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export { ConfirmationDialog };
