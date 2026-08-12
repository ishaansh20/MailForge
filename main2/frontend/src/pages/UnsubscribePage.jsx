import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AuthShell } from "../components/auth/AuthShell.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Icon } from "../components/ui/Icon.jsx";
import { getUnsubscribeInfo, confirmUnsubscribe } from "../services/publicService.js";

function UnsubscribePage() {
  const { token } = useParams();

  const [contact, setContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadContact() {
      setIsLoading(true);
      setLoadError("");

      try {
        const result = await getUnsubscribeInfo(token);

        if (!ignore) {
          setContact(result);
          setIsUnsubscribed(result.status === "unsubscribed");
        }
      } catch (error) {
        if (!ignore) {
          setLoadError(
            error?.response?.data?.message || "This unsubscribe link is invalid or has expired.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadContact();

    return () => {
      ignore = true;
    };
  }, [token]);

  async function handleConfirm() {
    setIsConfirming(true);
    setConfirmError("");

    try {
      await confirmUnsubscribe(token);
      setIsUnsubscribed(true);
    } catch (error) {
      setConfirmError(
        error?.response?.data?.message || "Unable to process your request right now.",
      );
    } finally {
      setIsConfirming(false);
    }
  }

  let content;

  if (isLoading) {
    content = <p className="text-center text-sm text-stone-500">Loading…</p>;
  } else if (loadError) {
    content = (
      <div className="text-center">
        <Icon name="warning" size={28} className="mx-auto text-amber-500" />
        <p className="mt-3 text-sm leading-6 text-stone-600">{loadError}</p>
      </div>
    );
  } else if (isUnsubscribed) {
    content = (
      <div className="text-center">
        <Icon name="check" size={28} className="mx-auto text-emerald-600" />
        <p className="mt-3 text-sm leading-6 text-stone-600">
          <strong>{contact?.email}</strong> has been unsubscribed and will no longer receive
          emails from us.
        </p>
      </div>
    );
  } else {
    content = (
      <div className="space-y-5 text-center">
        <p className="text-sm leading-6 text-stone-600">
          Unsubscribe <strong>{contact?.email}</strong> from future emails?
        </p>

        {confirmError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {confirmError}
          </div>
        ) : null}

        <Button
          variant="danger"
          className="w-full"
          loading={isConfirming}
          onClick={handleConfirm}
        >
          Unsubscribe Me
        </Button>
      </div>
    );
  }

  return (
    <AuthShell title="Unsubscribe" subtitle="Manage your email preferences.">
      {content}
    </AuthShell>
  );
}

export { UnsubscribePage };
