import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "../../components/ui/Card.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../../components/ui/Table.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { ErrorState } from "../../components/ui/ErrorState.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { SendsOverTimeChart } from "./SendsOverTimeChart.jsx";
import {
  getOverview,
  getSendsOverTime,
  getTopCampaigns,
} from "../../services/analyticsService.js";

function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [sendsOverTime, setSendsOverTime] = useState([]);
  const [topCampaigns, setTopCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [campaignFilter, setCampaignFilter] = useState("all");

  useEffect(() => {
    let ignore = false;

    async function loadAnalytics() {
      setIsLoading(true);
      setFetchError("");

      try {
        const [overviewResult, sendsResult, topCampaignsResult] =
          await Promise.all([
            getOverview(),
            getSendsOverTime(14),
            getTopCampaigns(100, sortBy, campaignFilter),
          ]);

        if (!ignore) {
          setOverview(overviewResult);
          setSendsOverTime(sendsResult);
          setTopCampaigns(topCampaignsResult);
        }
      } catch (error) {
        if (!ignore) {
          setFetchError(
            error?.response?.data?.message ||
              "Unable to load analytics right now.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      ignore = true;
    };
  }, [sortBy, campaignFilter]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        subtitle="Real send volume, contact growth, and campaign performance."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Analytics", to: "/analytics" },
        ]}
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : fetchError ? (
        <ErrorState description={fetchError} />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Contacts"
              value={overview.totalContacts}
              icon="users"
              tone="neutral"
            />
            <StatCard
              title="Total Campaigns"
              value={overview.totalCampaigns}
              icon="campaigns"
              tone="info"
            />
            <StatCard
              title="Emails Sent"
              value={overview.totalSent}
              icon="mail"
              tone="success"
            />
            <StatCard
              title="Success Rate"
              value={`${overview.successRate}%`}
              icon="check"
              tone="success"
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Open Rate"
              value={`${overview.openRate}%`}
              icon="mail"
              tone="info"
            />
            <StatCard
              title="Click Rate"
              value={`${overview.clickRate}%`}
              icon="activity"
              tone="info"
            />
            <StatCard
              title="Bounce Rate"
              value={`${overview.bounceRate}%`}
              icon="warning"
              tone="danger"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-stone-950">
                  Sends — Last 14 Days
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Delivery outcomes for every campaign send, by day.
                </p>
              </CardHeader>
              <CardContent>
                {sendsOverTime.every(
                  (day) => day.sent === 0 && day.failed === 0,
                ) ? (
                  <EmptyState
                    title="No send activity in this window"
                    description="Send a campaign to see daily volume here."
                  />
                ) : (
                  <SendsOverTimeChart data={sendsOverTime} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-stone-950">
                  Contacts by Status
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="success">Subscribed</Badge>
                  <span className="text-sm font-semibold text-stone-950">
                    {overview.subscribedContacts}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="neutral">Unsubscribed</Badge>
                  <span className="text-sm font-semibold text-stone-950">
                    {overview.unsubscribedContacts}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="danger">Bounced</Badge>
                  <span className="text-sm font-semibold text-stone-950">
                    {overview.bouncedContacts}
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-stone-950">
                    Campaign Performance
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Live campaign delivery and engagement metrics.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "All", value: "all" },
                    { label: "Sent", value: "sent" },
                    { label: "Not Sent", value: "not_sent" },
                    { label: "Scheduled", value: "scheduled" },
                    { label: "Sending", value: "sending" },
                    { label: "Completed", value: "completed" },
                    { label: "Failed", value: "failed" },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setCampaignFilter(filter.value)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        campaignFilter === filter.value
                          ? "bg-stone-900 text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="total">Most Recipients</option>
                  <option value="latest">Latest Campaigns</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {topCampaigns.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title={
                      campaignFilter === "all"
                        ? "No campaigns found"
                        : `No ${campaignFilter.replace("_", " ")} campaigns found`
                    }
                    description="Create or send a campaign to see it here."
                  />
                </div>
              ) : (
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeaderCell>Campaign</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Total</TableHeaderCell>
                      <TableHeaderCell>Sent</TableHeaderCell>
                      <TableHeaderCell>Delivered</TableHeaderCell>
                      <TableHeaderCell>Failed</TableHeaderCell>
                      <TableHeaderCell>Bounced</TableHeaderCell>
                      <TableHeaderCell>Opened</TableHeaderCell>
                      <TableHeaderCell>Not Opened</TableHeaderCell>
                      <TableHeaderCell>Clicked</TableHeaderCell>
                      <TableHeaderCell>Not Clicked</TableHeaderCell>
                      <TableHeaderCell>Delivery Rate</TableHeaderCell>
                      <TableHeaderCell>Open Rate</TableHeaderCell>
                      <TableHeaderCell>Click Rate</TableHeaderCell>
                      <TableHeaderCell>Bounce Rate</TableHeaderCell>
                    </tr>
                  </TableHead>

                  <TableBody>
                    {topCampaigns.map((campaign) => {
                      const statusLabel =
                        campaign.sendStatus === "not_sent"
                          ? "Not Sent"
                          : campaign.sendStatus.charAt(0).toUpperCase() +
                            campaign.sendStatus.slice(1);

                      const statusVariant =
                        campaign.sendStatus === "sent" ||
                        campaign.sendStatus === "completed"
                          ? "success"
                          : campaign.sendStatus === "failed"
                            ? "danger"
                            : campaign.sendStatus === "sending"
                              ? "info"
                              : "neutral";

                      return (
                        <TableRow key={campaign.id}>
                          <TableCell className="min-w-48 font-medium text-stone-950">
                            <div>{campaign.name}</div>
                            <div className="mt-1 max-w-xs truncate text-xs font-normal text-stone-500">
                              {campaign.subject}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant={statusVariant}>{statusLabel}</Badge>
                          </TableCell>

                          <TableCell>{campaign.total}</TableCell>
                          <TableCell>{campaign.sent}</TableCell>
                          <TableCell>{campaign.delivered}</TableCell>
                          <TableCell>{campaign.failed}</TableCell>
                          <TableCell>{campaign.bounced}</TableCell>
                          <TableCell>{campaign.opened}</TableCell>
                          <TableCell>{campaign.notOpened}</TableCell>
                          <TableCell>{campaign.clicked}</TableCell>
                          <TableCell>{campaign.notClicked}</TableCell>
                          <TableCell>{campaign.deliveryRate}%</TableCell>
                          <TableCell>{campaign.openRate}%</TableCell>
                          <TableCell>{campaign.clickRate}%</TableCell>
                          <TableCell>{campaign.bounceRate}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export { AnalyticsPage };
