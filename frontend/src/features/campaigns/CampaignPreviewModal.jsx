import { Modal } from "../../components/ui/Modal.jsx";
import { Badge } from "../../components/ui/Badge.jsx";

const statusBadgeVariant = {
  draft: "neutral",
  scheduled: "info",
  sending: "info",
  completed: "success",
  failed: "danger",
};

function CampaignPreviewModal({ open, campaign, onClose }) {
  return (
    <Modal open={open} title="Campaign Preview" onClose={onClose} maxWidth="max-w-3xl">
      {campaign ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-stone-950">{campaign.name}</p>
              <p className="mt-1 text-sm text-stone-500">
                {campaign.smtpConfig?.name || "—"} → {campaign.targetList?.name || "All Contacts"}
              </p>
            </div>
            <Badge variant={statusBadgeVariant[campaign.status] || "neutral"}>
              {campaign.status}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-700">Subject</p>
            <p className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-950">
              {campaign.subject}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-700">Email Body</p>
            <div className="overflow-hidden rounded-xl border border-stone-200">
              <iframe
                title="Campaign email preview"
                srcDoc={campaign.body}
                sandbox=""
                className="h-96 w-full bg-white"
              />
            </div>
            <p className="text-xs text-stone-400">
              Rendered as-is, including any unreplaced <code>{"{{name}}"}</code> or{" "}
              <code>{"{{unsubscribe_url}}"}</code> placeholders — these are filled in per recipient
              at send time.
            </p>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export { CampaignPreviewModal };
