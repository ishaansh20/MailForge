import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { Pagination } from "../../components/ui/Pagination.jsx";
import { Tooltip } from "../../components/ui/Tooltip.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../../components/ui/Table.jsx";
import { getCampaignRecipients } from "../../services/campaignService.js";

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const statusBadgeVariant = {
  pending: "neutral",
  sent: "success",
  bounced: "danger",
  failed: "danger",
};

function CampaignRecipientsModal({ open, campaign, onClose }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!open || !campaign) {
      return undefined;
    }

    let ignore = false;

    async function loadRecipients() {
      setIsLoading(true);

      try {
        const result = await getCampaignRecipients(campaign.id, { page, limit: 10 });

        if (!ignore) {
          setItems(result.items);
          setPagination(result.pagination);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadRecipients();

    return () => {
      ignore = true;
    };
  }, [open, campaign, page]);

  return (
    <Modal
      open={open}
      title={`Recipients — ${campaign?.name || ""}`}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {campaign?.rates ? (
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 text-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Open Rate</p>
              <p className="mt-1 text-lg font-semibold text-stone-950">{campaign.rates.openRate}%</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Click Rate</p>
              <p className="mt-1 text-lg font-semibold text-stone-950">{campaign.rates.clickRate}%</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Bounce Rate</p>
              <p className="mt-1 text-lg font-semibold text-stone-950">{campaign.rates.bounceRate}%</p>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No recipients yet"
            description="Recipients appear here once this campaign has been sent."
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Engagement</TableHeaderCell>
                  <TableHeaderCell>Error</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {items.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell>{recipient.name}</TableCell>
                    <TableCell>{recipient.email}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[recipient.status] || "neutral"}>
                        {recipient.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {recipient.deliveredAt ? (
                          <Tooltip label={`Delivered ${formatDateTime(recipient.deliveredAt)}`}>
                            <Badge variant="success">Delivered</Badge>
                          </Tooltip>
                        ) : null}
                        {recipient.openedAt ? (
                          <Tooltip
                            label={`Opened ${recipient.openCount}x, first at ${formatDateTime(recipient.openedAt)}`}
                          >
                            <Badge variant="info">Opened</Badge>
                          </Tooltip>
                        ) : null}
                        {recipient.clickedAt ? (
                          <Tooltip
                            label={`Clicked ${recipient.clickCount}x, first at ${formatDateTime(recipient.clickedAt)}`}
                          >
                            <Badge variant="info">Clicked</Badge>
                          </Tooltip>
                        ) : null}
                        {!recipient.deliveredAt && !recipient.openedAt && !recipient.clickedAt ? (
                          <span className="text-xs text-stone-400">—</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-stone-400">
                      {recipient.error || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pagination.totalPages > 1 ? (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}

export { CampaignRecipientsModal };
