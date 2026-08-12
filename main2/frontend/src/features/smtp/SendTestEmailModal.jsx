import { useState } from "react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SendTestEmailModal({ open, config, isSending, serverError, onClose, onSend }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!email || !emailPattern.test(email)) {
      setError("Enter a valid email address");
      return;
    }

    setError("");
    onSend(email);
  }

  return (
    <Modal open={open} title="Send Test Email" onClose={onClose} maxWidth="max-w-md">
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <p className="text-sm leading-6 text-stone-600">
          Sends a real email using <strong>{config?.name}</strong> so you can confirm delivery
          actually works, not just that the credentials are valid.
        </p>

        {serverError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        <Input
          label="Recipient Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={error}
        />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSending}>
            Send Test Email
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { SendTestEmailModal };
