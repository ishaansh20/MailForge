import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { ErrorState } from "../../components/ui/ErrorState.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../../components/ui/Table.jsx";
import {
  getCampaign,
  getCampaignRecipients,
} from "../../services/campaignService.js";

const statusBadgeVariant = {
  pending: "neutral",
  sent: "success",
  delivered: "success",
  bounced: "danger",
  failed: "danger",
};

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function CampaignAnalyticsPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadCampaignDetails() {
      setIsLoading(true);
      setFetchError("");

      try {
        const [campaignResult, recipientsResult] = await Promise.all([
          getCampaign(campaignId),
          getCampaignRecipients(campaignId, {
            page,
            limit: 10,
          }),
        ]);

        if (!ignore) {
          setCampaign(campaignResult);
          setRecipients(recipientsResult.items);
          setPagination(recipientsResult.pagination);
        }
      } catch (error) {
        if (!ignore) {
          setFetchError(
            error?.response?.data?.message ||
              "Unable to load campaign details.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadCampaignDetails();

    const refreshInterval = window.setInterval(() => {
      loadCampaignDetails();
    }, 10000);

    return () => {
      ignore = true;
      window.clearInterval(refreshInterval);
    };
  }, [campaignId, page]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (fetchError) {
    return <ErrorState description={fetchError} />;
  }

  if (!campaign) {
    return (
      <EmptyState
        title="Campaign not found"
        description="This campaign could not be found."
      />
    );
  }

  const stats = campaign.stats || {};

  const deliveryRate =
    stats.total > 0
      ? ((stats.delivered / stats.total) * 100).toFixed(1)
      : "0.0";

  const openRate =
    stats.total > 0 ? ((stats.opened / stats.total) * 100).toFixed(1) : "0.0";

  const clickRate =
    stats.total > 0 ? ((stats.clicked / stats.total) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          leftIcon={<Icon name="arrow-left" size={16} />}
          onClick={() => navigate("/analytics")}
        >
          Back to Analytics
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-stone-500">Campaign Analytics</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-950">
            {campaign.name}
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            {campaign.subject || "No subject"}
          </p>
        </div>

        <Badge
          variant={
            campaign.status === "completed"
              ? "success"
              : campaign.status === "failed"
                ? "danger"
                : "neutral"
          }
        >
          {campaign.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-stone-950">
            Campaign Overview
          </h2>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <Stat label="Total" value={stats.total ?? 0} />
            <Stat label="Sent" value={stats.sent ?? 0} />
            <Stat label="Delivered" value={stats.delivered ?? 0} />
            <Stat label="Failed" value={stats.failed ?? 0} />
            <Stat label="Bounced" value={stats.bounced ?? 0} />
            <Stat label="Opened" value={stats.opened ?? 0} />
            <Stat label="Clicked" value={stats.clicked ?? 0} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-stone-950">Engagement</h2>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Delivery Rate" value={`${deliveryRate}%`} />
            <Stat label="Open Rate" value={`${openRate}%`} />
            <Stat label="Click Rate" value={`${clickRate}%`} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-stone-950">Recipients</h2>

            <p className="mt-1 text-sm text-stone-500">
              People who received or were targeted by this campaign.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {recipients.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No recipients"
                description="No recipient information is available for this campaign."
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Email</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Delivered</TableHeaderCell>
                    <TableHeaderCell>Opened</TableHeaderCell>
                    <TableHeaderCell>Clicked</TableHeaderCell>
                    <TableHeaderCell>Error</TableHeaderCell>
                  </tr>
                </TableHead>

                <TableBody>
                  {recipients.map((recipient) => (
                    <TableRow
                      key={recipient.id}
                      className="transition-colors duration-150 hover:bg-stone-100"
                    >
                      <TableCell className="font-medium text-stone-950">
                        {recipient.name || "—"}
                      </TableCell>

                      <TableCell>{recipient.email || "—"}</TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            statusBadgeVariant[recipient.status] || "neutral"
                          }
                        >
                          {recipient.status || "pending"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {recipient.deliveredAt ? (
                          <div>
                            <span className="font-medium text-stone-950">
                              Yes
                            </span>
                            <p className="mt-1 text-xs text-stone-400">
                              {formatDateTime(recipient.deliveredAt)}
                            </p>
                          </div>
                        ) : (
                          "No"
                        )}
                      </TableCell>

                      <TableCell>
                        {recipient.openedAt ? (
                          <div>
                            <span className="font-medium text-stone-950">
                              Yes
                            </span>

                            <p className="mt-1 text-xs text-stone-400">
                              {recipient.openCount || 0} time
                              {recipient.openCount === 1 ? "" : "s"}
                            </p>

                            <p className="text-xs font-medium text-stone-500">
                              {formatDateTime(recipient.openedAt)}
                            </p>
                          </div>
                        ) : (
                          "No"
                        )}
                      </TableCell>

                      <TableCell>
                        {recipient.clickedAt ? (
                          <div>
                            <span className="font-medium text-stone-950">
                              Yes
                            </span>

                            <p className="mt-1 text-xs text-stone-400">
                              {recipient.clickCount || 0} time
                              {recipient.clickCount === 1 ? "" : "s"}
                            </p>

                            <p className="text-xs font-medium text-stone-500">
                              {formatDateTime(recipient.clickedAt)}
                            </p>
                          </div>
                        ) : (
                          "No"
                        )}
                      </TableCell>

                      <TableCell className="max-w-xs text-xs text-rose-500">
                        {recipient.error || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.totalPages > 1 ? (
                <div className="border-t border-stone-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-stone-500">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={page <= 1}
                        onClick={() =>
                          setPage((currentPage) => currentPage - 1)
                        }
                      >
                        Previous
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={page >= pagination.totalPages}
                        onClick={() =>
                          setPage((currentPage) => currentPage + 1)
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}

export { CampaignAnalyticsPage };
