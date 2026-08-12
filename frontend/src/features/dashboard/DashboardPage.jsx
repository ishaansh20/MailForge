import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { cn } from "../../utils/cn.js";
import { Button } from "../../components/ui/Button.jsx";
import { Card, CardContent, CardHeader } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../../components/ui/Table.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { ErrorState } from "../../components/ui/ErrorState.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { SubscriberGrowthChart } from "./SubscriberGrowthChart.jsx";
import {
  getOverview,
  getTrends,
  getSubscriberGrowth,
} from "../../services/analyticsService.js";
import { listCampaigns } from "../../services/campaignService.js";
import { listSmtpConfigs } from "../../services/smtpService.js";

const CAMPAIGN_STATUS_BADGE = {
  draft: "neutral",
  scheduled: "info",
  sending: "info",
  completed: "success",
  failed: "danger",
};

const CAMPAIGN_STATUS_LABEL = {
  draft: "Draft",
  scheduled: "Scheduled",
  sending: "Sending",
  completed: "Sent",
  failed: "Failed",
};

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function formatRelativeTime(value) {
  if (!value) {
    return "—";
  }

  const diffMinutes = Math.round(
    (Date.now() - new Date(value).getTime()) / 60000,
  );

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.round(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return formatDate(value);
}

function buildCampaignActivity(campaign) {
  if (campaign.status === "completed") {
    return {
      title: "Campaign sent",
      detail: `${campaign.name} completed — ${campaign.stats.sent} delivered, ${campaign.stats.failed} failed`,
      time: campaign.sentAt || campaign.updatedAt,
      tone: "success",
    };
  }

  if (campaign.status === "sending") {
    return {
      title: "Campaign sending",
      detail: `${campaign.name} is sending to ${campaign.stats.total} recipients`,
      time: campaign.updatedAt,
      tone: "info",
    };
  }

  if (campaign.status === "failed") {
    return {
      title: "Campaign failed",
      detail: `${campaign.name} failed to send: ${campaign.failureReason || "Unknown error"}`,
      time: campaign.updatedAt,
      tone: "danger",
    };
  }

  if (campaign.status === "scheduled") {
    return {
      title: "Campaign scheduled",
      detail: `${campaign.name} will send automatically at ${formatDate(campaign.scheduledAt)}`,
      time: campaign.updatedAt,
      tone: "info",
    };
  }

  return {
    title: "Campaign created",
    detail: `${campaign.name} saved as draft`,
    time: campaign.createdAt,
    tone: "neutral",
  };
}

const ATTENTION_TONE_ICON = {
  warning: "warning",
  danger: "warning",
  info: "info",
};

function buildAttentionItems(overview, defaultSmtp) {
  const items = [];
  const campaignsByStatus = overview.campaignsByStatus || {};

  if (overview.subscribedContacts === 0) {
    items.push({
      key: "no-subscribers",
      tone: "warning",
      title: "No subscribed contacts",
      detail:
        "Campaigns need subscribed contacts to send to. Add or import some.",
      actionLabel: "Go to Contacts",
      to: "/contacts",
    });
  }

  if (!defaultSmtp) {
    items.push({
      key: "no-smtp",
      tone: "warning",
      title: "No SMTP configured",
      detail: "Add an SMTP configuration before sending campaigns.",
      actionLabel: "Go to SMTP",
      to: "/smtp",
    });
  } else if (defaultSmtp.status !== "success") {
    items.push({
      key: "smtp-unverified",
      tone: "warning",
      title: "Default SMTP not verified",
      detail: "Test the connection to make sure sending will work.",
      actionLabel: "Go to SMTP",
      to: "/smtp",
    });
  }

  if (campaignsByStatus.failed > 0) {
    items.push({
      key: "failed-campaigns",
      tone: "danger",
      title: `${campaignsByStatus.failed} campaign${campaignsByStatus.failed === 1 ? "" : "s"} failed to send`,
      detail: "Review the failure reason and retry.",
      actionLabel: "Go to Campaigns",
      to: "/campaigns",
    });
  }

  if (campaignsByStatus.draft > 0) {
    items.push({
      key: "draft-campaigns",
      tone: "info",
      title: `${campaignsByStatus.draft} draft campaign${campaignsByStatus.draft === 1 ? "" : "s"}`,
      detail: "Ready to review and send whenever you are.",
      actionLabel: "Go to Campaigns",
      to: "/campaigns",
    });
  }

  if (overview.bouncedContacts > 0) {
    items.push({
      key: "bounced-contacts",
      tone: "danger",
      title: `${overview.bouncedContacts} bounced contact${overview.bouncedContacts === 1 ? "" : "s"}`,
      detail: "These addresses failed delivery and may need cleanup.",
      actionLabel: "Go to Contacts",
      to: "/contacts",
    });
  }

  return items;
}

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [subscriberGrowth, setSubscriberGrowth] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [defaultSmtp, setDefaultSmtp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  function refetch() {
    setReloadToken((currentValue) => currentValue + 1);
  }

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setIsLoading(true);
      setFetchError("");

      try {
        const [
          overviewResult,
          trendsResult,
          growthResult,
          campaignsResult,
          smtpResult,
        ] = await Promise.all([
          getOverview(),
          getTrends(),
          getSubscriberGrowth(6),
          listCampaigns({ page: 1, limit: 5 }),
          listSmtpConfigs({ page: 1, limit: 50 }),
        ]);

        if (!ignore) {
          setOverview(overviewResult);
          setTrends(trendsResult);
          setSubscriberGrowth(growthResult);
          setRecentCampaigns(campaignsResult.items);
          setDefaultSmtp(
            smtpResult.items.find((config) => config.isDefault) ||
              smtpResult.items[0] ||
              null,
          );
        }
      } catch (error) {
        if (!ignore) {
          setFetchError(
            error?.response?.data?.message ||
              "Unable to load dashboard data right now.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  const greeting =
    new Date().getHours() < 12
      ? "morning"
      : new Date().getHours() < 18
        ? "afternoon"
        : "evening";
  const activity = recentCampaigns.slice(0, 4).map(buildCampaignActivity);
  const attentionItems = overview
    ? buildAttentionItems(overview, defaultSmtp)
    : [];
  const hasGrowthActivity = subscriberGrowth.some((point) => point.count > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Good {greeting}, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="max-w-xl text-sm leading-6 text-stone-500">
            Track your campaign performance and audience growth.
          </p>
        </div>
        <Button
          leftIcon={<Icon name="plus" size={16} />}
          onClick={() => navigate("/campaigns")}
        >
          New Campaign
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : fetchError ? (
        <ErrorState description={fetchError} onAction={refetch} />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {" "}
            <StatCard
              title="Total Contacts"
              value={overview.totalContacts}
              icon="users"
              tone="info"
              changePercent={trends?.contacts.changePercent}
            />
            <StatCard
              title="Subscribed"
              value={overview.subscribedContacts}
              icon="check"
              tone="success"
            />
            <StatCard
              title="Total Campaigns"
              value={overview.totalCampaigns}
              icon="campaigns"
              tone="warning"
              changePercent={trends?.campaigns.changePercent}
            />
            <StatCard
              title="Emails Sent"
              value={overview.totalSent}
              icon="mail"
              tone="accent"
              changePercent={trends?.sent.changePercent}
            />
            <StatCard
              title="Success Rate"
              value={`${overview.successRate}%`}
              icon="chart"
              tone="neutral"
            />
            <StatCard
              title="Open Rate"
              value={`${overview.openRate}%`}
              icon="mail"
              tone="info"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-950">
                      Subscriber Growth
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                      Cumulative subscribers over the last 6 months.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {hasGrowthActivity ? (
                  <SubscriberGrowthChart data={subscriberGrowth} />
                ) : (
                  <EmptyState
                    title="No contacts yet"
                    description="Add or import contacts to see growth over time."
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-stone-950">
                  Activity Timeline
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  What's happened recently in your workspace.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {activity.length === 0 ? (
                  <EmptyState
                    title="No activity yet"
                    description="Campaign activity will show up here as it happens."
                  />
                ) : (
                  activity.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className="flex gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3"
                    >
                      <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white text-stone-500 shadow-[var(--shadow-soft)]">
                        <Icon
                          name={
                            item.tone === "success"
                              ? "check"
                              : item.tone === "danger"
                                ? "warning"
                                : item.tone === "info"
                                  ? "info"
                                  : "activity"
                          }
                          size={16}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-stone-950">
                            {item.title}
                          </p>
                          <span className="whitespace-nowrap text-xs font-medium text-stone-400">
                            {formatRelativeTime(item.time)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-5 text-stone-500">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-950">
                      Recent Campaigns
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                      Latest delivery activity across the workspace.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate("/campaigns")}
                  >
                    View all
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentCampaigns.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title="No campaigns yet"
                      description="Create your first campaign to see delivery activity here."
                      actionLabel="New Campaign"
                      onAction={() => navigate("/campaigns")}
                    />
                  </div>
                ) : (
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>Campaign Name</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Recipients</TableHeaderCell>
                        <TableHeaderCell>Sent</TableHeaderCell>
                        <TableHeaderCell>Failed</TableHeaderCell>
                        <TableHeaderCell>Date</TableHeaderCell>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {recentCampaigns.map((campaign) => (
                        <TableRow
                          key={campaign.id}
                          className="cursor-pointer"
                          onClick={() =>
                            navigate(`/analytics/campaign/${campaign.id}`)
                          }
                        >
                          <TableCell className="font-medium text-stone-950">
                            {campaign.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                CAMPAIGN_STATUS_BADGE[campaign.status] ||
                                "neutral"
                              }
                            >
                              {CAMPAIGN_STATUS_LABEL[campaign.status] ||
                                campaign.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{campaign.stats.total}</TableCell>
                          <TableCell>{campaign.stats.sent}</TableCell>
                          <TableCell>{campaign.stats.failed}</TableCell>
                          <TableCell>
                            {formatDate(campaign.sentAt || campaign.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-stone-950">
                  Quick Actions
                </h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    label: "New Campaign",
                    to: "/campaigns",
                    icon: "campaigns",
                  },
                  { label: "Import Contacts", to: "/contacts", icon: "upload" },
                  {
                    label: "Create Template",
                    to: "/templates",
                    icon: "templates",
                  },
                  {
                    label: "View Analytics",
                    to: "/analytics",
                    icon: "analytics",
                  },
                ].map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => navigate(action.to)}
                    className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(28,25,23,0.03)] transition-all duration-150 ease-out hover:border-stone-300 hover:bg-stone-50 hover:shadow-[var(--shadow-lift)]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                        <Icon name={action.icon} size={16} />
                      </span>
                      {action.label}
                    </span>
                    <Icon
                      name="chevronRight"
                      size={16}
                      className="text-stone-400"
                    />
                  </button>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-stone-950">
                  Sending Health
                </h2>
              </CardHeader>
              <CardContent>
                {defaultSmtp ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-stone-950">
                        {defaultSmtp.name}
                      </p>
                      <Badge
                        variant={defaultSmtp.isActive ? "success" : "neutral"}
                      >
                        {defaultSmtp.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-stone-500">{defaultSmtp.host}</p>
                    <div className="flex items-center justify-between border-t border-stone-200 pt-3">
                      <span className="text-sm text-stone-500">Connection</span>
                      <Badge
                        variant={
                          defaultSmtp.status === "success"
                            ? "success"
                            : defaultSmtp.status === "failed"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {defaultSmtp.status === "success"
                          ? "Verified"
                          : defaultSmtp.status === "failed"
                            ? "Failed"
                            : "Untested"}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-400">
                      Last tested {formatRelativeTime(defaultSmtp.lastTestedAt)}
                    </p>
                  </div>
                ) : (
                  <EmptyState
                    title="No SMTP configured"
                    description="Add an SMTP configuration to start sending campaigns."
                    actionLabel="Set up SMTP"
                    onAction={() => navigate("/smtp")}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-stone-950">
                  Needs Attention
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Things worth a look before you send.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {attentionItems.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-[var(--shadow-soft)]">
                      <Icon name="check" size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        You're all caught up
                      </p>
                      <p className="text-sm text-emerald-700">
                        Nothing needs your attention right now.
                      </p>
                    </div>
                  </div>
                ) : (
                  attentionItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg",
                            item.tone === "danger"
                              ? "bg-rose-100 text-rose-600"
                              : item.tone === "warning"
                                ? "bg-amber-100 text-amber-600"
                                : "bg-sky-100 text-sky-600",
                          )}
                        >
                          <Icon
                            name={ATTENTION_TONE_ICON[item.tone] || "info"}
                            size={16}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-950">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-sm text-stone-500">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(item.to)}
                      >
                        {item.actionLabel}
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

export { DashboardPage };
