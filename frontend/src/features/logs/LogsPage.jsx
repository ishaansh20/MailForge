import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Card, CardContent } from "../../components/ui/Card.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
import { Tooltip } from "../../components/ui/Tooltip.jsx";
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
import { FilterBar } from "../../components/ui/FilterBar.jsx";
import { SearchBar } from "../../components/ui/SearchBar.jsx";
import { Pagination } from "../../components/ui/Pagination.jsx";
import { listLogs, getLogStats } from "../../services/logService.js";
import { listCampaigns } from "../../services/campaignService.js";

const statusBadgeVariant = {
  pending: "neutral",
  sent: "success",
  bounced: "danger",
  failed: "danger",
};

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Sent", value: "sent" },
  { label: "Bounced", value: "bounced" },
  { label: "Failed", value: "failed" },
  { label: "Pending", value: "pending" },
];

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function LogsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [stats, setStats] = useState(null);

  const [campaignOptions, setCampaignOptions] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [page, setPage] = useState(1);

  const [reloadToken, setReloadToken] = useState(0);

  function refetch() {
    setReloadToken((currentValue) => currentValue + 1);
  }

  useEffect(() => {
    let ignore = false;

    async function loadLogs() {
      setIsLoading(true);
      setFetchError("");

      try {
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (statusFilter !== "all") params.status = statusFilter;
        if (campaignFilter) params.campaignId = campaignFilter;

        const result = await listLogs(params);

        if (!ignore) {
          setItems(result.items);
          setPagination(result.pagination);
        }
      } catch (error) {
        if (!ignore) {
          setFetchError(
            error?.response?.data?.message || "Unable to load logs right now.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadLogs();

    return () => {
      ignore = true;
    };
  }, [page, search, statusFilter, campaignFilter, reloadToken]);

  useEffect(() => {
    let ignore = false;

    async function loadStatsAndCampaigns() {
      try {
        const [statsResult, campaignsResult] = await Promise.all([
          getLogStats(),
          listCampaigns({ limit: 100 }),
        ]);

        if (!ignore) {
          setStats(statsResult);
          setCampaignOptions(campaignsResult.items);
        }
      } catch {
        // stats/campaign filter options are supplementary; the main log table still works without them
      }
    }

    loadStatsAndCampaigns();

    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const hasActiveQuery = Boolean(search) || statusFilter !== "all" || Boolean(campaignFilter);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Logs"
        subtitle="Browse email send activity across all your campaigns."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Logs", to: "/logs" },
        ]}
      />

      {stats ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Total Sends" value={stats.total} icon="mail" tone="neutral" />
          <StatCard title="Sent" value={stats.sent} icon="check" tone="success" />
          <StatCard title="Bounced" value={stats.bounced} icon="warning" tone="danger" />
          <StatCard title="Failed" value={stats.failed} icon="warning" tone="danger" />
          <StatCard title="Pending" value={stats.pending} icon="clock" tone="info" />
        </section>
      ) : null}

      <FilterBar
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  size="sm"
                  variant={statusFilter === filter.value ? "primary" : "ghost"}
                  onClick={() => {
                    setStatusFilter(filter.value);
                    setPage(1);
                  }}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            <select
              className="h-9 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-stone-950/5"
              value={campaignFilter}
              onChange={(event) => {
                setCampaignFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Campaigns</option>
              {campaignOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="w-full max-w-sm">
          <SearchBar
            placeholder="Search by recipient name or email"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <Card>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : fetchError ? (
        <ErrorState description={fetchError} onAction={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          title={hasActiveQuery ? "No matching log entries" : "No send activity yet"}
          description={
            hasActiveQuery
              ? "Try adjusting your search or filters."
              : "Once you send a campaign, its delivery results will appear here."
          }
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Campaign</TableHeaderCell>
                    <TableHeaderCell>Recipient</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Engagement</TableHeaderCell>
                    <TableHeaderCell>Error</TableHeaderCell>
                    <TableHeaderCell>Sent At</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {items.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-stone-950">
                        {log.campaign?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <div>{log.name}</div>
                        <div className="text-xs text-stone-400">{log.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[log.status] || "neutral"}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {log.deliveredAt ? (
                            <Tooltip label={`Delivered ${formatDateTime(log.deliveredAt)}`}>
                              <Badge variant="success">Delivered</Badge>
                            </Tooltip>
                          ) : null}
                          {log.openedAt ? (
                            <Tooltip label={`Opened ${log.openCount}x, first at ${formatDateTime(log.openedAt)}`}>
                              <Badge variant="info">Opened</Badge>
                            </Tooltip>
                          ) : null}
                          {log.clickedAt ? (
                            <Tooltip label={`Clicked ${log.clickCount}x, first at ${formatDateTime(log.clickedAt)}`}>
                              <Badge variant="info">Clicked</Badge>
                            </Tooltip>
                          ) : null}
                          {!log.deliveredAt && !log.openedAt && !log.clickedAt ? (
                            <span className="text-xs text-stone-400">—</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-stone-400">
                        {log.error || "—"}
                      </TableCell>
                      <TableCell>{formatDateTime(log.sentAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

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
  );
}

export { LogsPage };
