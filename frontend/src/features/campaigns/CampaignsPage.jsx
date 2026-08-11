import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Card, CardContent } from "../../components/ui/Card.jsx";
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
import { Icon } from "../../components/ui/Icon.jsx";
import { FilterBar } from "../../components/ui/FilterBar.jsx";
import { SearchBar } from "../../components/ui/SearchBar.jsx";
import { Pagination } from "../../components/ui/Pagination.jsx";
import { Dropdown, DropdownItem } from "../../components/ui/Dropdown.jsx";
import { ConfirmationDialog } from "../../components/ui/ConfirmationDialog.jsx";
import { useToast } from "../../hooks/useToast.js";
import { CampaignFormModal } from "./CampaignFormModal.jsx";
import { CampaignRecipientsModal } from "./CampaignRecipientsModal.jsx";
import { CampaignPreviewModal } from "./CampaignPreviewModal.jsx";
import { ScheduleCampaignModal } from "./ScheduleCampaignModal.jsx";
import { SendTestCampaignModal } from "./SendTestCampaignModal.jsx";
import {
  listCampaigns,
  duplicateCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  scheduleCampaign,
  unscheduleCampaign,
} from "../../services/campaignService.js";

const statusBadgeVariant = {
  draft: "neutral",
  scheduled: "info",
  sending: "info",
  completed: "success",
  failed: "danger",
};

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Sending", value: "sending" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
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

function CampaignsPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialValues, setFormInitialValues] = useState(null);
  const [formServerError, setFormServerError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sendTarget, setSendTarget] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendTestTarget, setSendTestTarget] = useState(null);

  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [scheduleServerError, setScheduleServerError] = useState("");

  const [unscheduleTarget, setUnscheduleTarget] = useState(null);
  const [isUnscheduling, setIsUnscheduling] = useState(false);

  const [recipientsTarget, setRecipientsTarget] = useState(null);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const [reloadToken, setReloadToken] = useState(0);

  function refetch() {
    setReloadToken((currentValue) => currentValue + 1);
  }

  useEffect(() => {
    let ignore = false;

    async function loadCampaigns() {
      setIsLoading(true);
      setFetchError("");

      try {
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (statusFilter !== "all") params.status = statusFilter;

        const result = await listCampaigns(params);

        if (!ignore) {
          setItems(result.items);
          setPagination(result.pagination);
        }
      } catch (error) {
        if (!ignore) {
          setFetchError(
            error?.response?.data?.message ||
              "Unable to load campaigns right now.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadCampaigns();

    return () => {
      ignore = true;
    };
  }, [page, search, statusFilter, reloadToken]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const hasSendingCampaign = items.some((item) => item.status === "sending");
    const hasScheduledCampaign = items.some(
      (item) => item.status === "scheduled",
    );

    if (!hasSendingCampaign && !hasScheduledCampaign) {
      return undefined;
    }

    const intervalId = window.setInterval(
      () => {
        refetch();
      },
      hasSendingCampaign ? 3000 : 30000,
    );

    return () => window.clearInterval(intervalId);
  }, [items]);

  function openEditModal(campaign) {
    setFormInitialValues(campaign);
    setEditingId(campaign.id);
    setFormServerError("");
    setIsFormOpen(true);
  }

  async function handleFormSubmit(payload) {
    setFormServerError("");

    try {
      await updateCampaign(editingId, payload);
      toast.success(
        "Campaign updated",
        `"${payload.name}" was saved successfully.`,
      );
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      setFormServerError(
        error?.response?.data?.message || "Unable to save this campaign.",
      );
    }
  }

  async function handleDuplicate(campaign) {
    setDuplicatingId(campaign.id);

    try {
      const duplicated = await duplicateCampaign(campaign.id);
      toast.success(
        "Campaign duplicated",
        `"${duplicated.name}" was created as a draft — hit "Send Now" when you're ready.`,
      );
      refetch();
    } catch (error) {
      toast.error(
        "Unable to duplicate campaign",
        error?.response?.data?.message ||
          "Something went wrong while duplicating this campaign.",
      );
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleConfirmSend() {
    if (!sendTarget) return;

    setIsSending(true);

    try {
      await sendCampaign(sendTarget.id);
      toast.success(
        "Campaign send started",
        `"${sendTarget.name}" is now sending to subscribed contacts.`,
      );
      setSendTarget(null);
      refetch();
    } catch (error) {
      toast.error(
        "Unable to send campaign",
        error?.response?.data?.message ||
          "Something went wrong while starting this send.",
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleConfirmSchedule(scheduledAt) {
    if (!scheduleTarget) return;

    setScheduleServerError("");

    try {
      await scheduleCampaign(scheduleTarget.id, scheduledAt);
      toast.success(
        "Campaign scheduled",
        `"${scheduleTarget.name}" will send automatically at the chosen time.`,
      );
      setScheduleTarget(null);
      refetch();
    } catch (error) {
      setScheduleServerError(
        error?.response?.data?.message || "Unable to schedule this campaign.",
      );
    }
  }

  async function handleConfirmUnschedule() {
    if (!unscheduleTarget) return;

    setIsUnscheduling(true);

    try {
      await unscheduleCampaign(unscheduleTarget.id);
      toast.success(
        "Schedule cancelled",
        `"${unscheduleTarget.name}" was moved back to draft.`,
      );
      setUnscheduleTarget(null);
      refetch();
    } catch (error) {
      toast.error(
        "Unable to cancel schedule",
        error?.response?.data?.message ||
          "Something went wrong while cancelling this schedule.",
      );
    } finally {
      setIsUnscheduling(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      await deleteCampaign(deleteTarget.id);
      toast.success("Campaign deleted", `"${deleteTarget.name}" was removed.`);
      setDeleteTarget(null);
      refetch();
    } catch (error) {
      toast.error(
        "Unable to delete campaign",
        error?.response?.data?.message ||
          "Something went wrong while deleting this campaign.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const hasActiveQuery = Boolean(search) || statusFilter !== "all";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Campaigns"
        subtitle="Create and send bulk email campaigns to your subscribed contacts."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Campaigns", to: "/campaigns" },
        ]}
        actions={
          <Button
            leftIcon={<Icon name="plus" size={16} />}
            onClick={() => navigate("/campaigns/new")}
          >
            New Campaign
          </Button>
        }
      />

      <FilterBar
        actions={
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
        }
      >
        <div className="w-full max-w-sm">
          <SearchBar
            placeholder="Search by name or subject"
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
          title={hasActiveQuery ? "No matching campaigns" : "No campaigns yet"}
          description={
            hasActiveQuery
              ? "Try adjusting your search or filters."
              : "Create your first campaign to start sending bulk emails."
          }
          actionLabel={hasActiveQuery ? undefined : "New Campaign"}
          onAction={
            hasActiveQuery ? undefined : () => navigate("/campaigns/new")
          }
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Send From</TableHeaderCell>
                    <TableHeaderCell>Send To</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Progress</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                    <TableHeaderCell className="text-right">
                      Actions
                    </TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {items.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium text-stone-950">
                        <div>{campaign.name}</div>
                        <div className="text-xs text-stone-400">
                          {campaign.subject}
                        </div>
                      </TableCell>
                      <TableCell>{campaign.smtpConfig?.name || "—"}</TableCell>
                      <TableCell>
                        {campaign.targetList?.name || "All Contacts"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusBadgeVariant[campaign.status] || "neutral"
                          }
                        >
                          {campaign.status}
                        </Badge>
                        {campaign.status === "scheduled" ? (
                          <div className="mt-1 text-xs text-stone-400">
                            {formatDateTime(campaign.scheduledAt)}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {campaign.stats.total > 0 ? (
                          <span>
                            {campaign.stats.sent} sent
                            {campaign.stats.failed > 0
                              ? `, ${campaign.stats.failed} failed`
                              : ""}{" "}
                            / {campaign.stats.total}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(campaign.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {campaign.status === "draft" ? (
                            <Button
                              size="sm"
                              leftIcon={<Icon name="mail" size={14} />}
                              onClick={() => setSendTarget(campaign)}
                            >
                              Send Now
                            </Button>
                          ) : null}

                          <Dropdown
                            trigger={
                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-150 ease-out hover:border-stone-300 hover:bg-stone-50 hover:text-stone-950 hover:shadow-[var(--shadow-lift)] active:scale-[0.98]">
                                <Icon name="more" size={18} />
                              </span>
                            }
                          >
                            <div className="space-y-1">
                              <DropdownItem
                                onClick={() => setPreviewTarget(campaign)}
                              >
                                <Icon
                                  name="search"
                                  size={14}
                                  className="mr-2 inline"
                                />
                                Preview
                              </DropdownItem>
                              <DropdownItem
                                onClick={() => setSendTestTarget(campaign)}
                              >
                                <Icon
                                  name="send"
                                  size={14}
                                  className="mr-2 inline"
                                />
                                Send Test
                              </DropdownItem>

                              {campaign.status === "draft" ? (
                                <>
                                  <DropdownItem
                                    onClick={() => openEditModal(campaign)}
                                  >
                                    <Icon
                                      name="edit"
                                      size={14}
                                      className="mr-2 inline"
                                    />
                                    Edit
                                  </DropdownItem>
                                  <DropdownItem
                                    onClick={() => setScheduleTarget(campaign)}
                                  >
                                    <Icon
                                      name="clock"
                                      size={14}
                                      className="mr-2 inline"
                                    />
                                    Schedule
                                  </DropdownItem>
                                </>
                              ) : null}
                              {campaign.status === "scheduled" ? (
                                <DropdownItem
                                  onClick={() => setUnscheduleTarget(campaign)}
                                >
                                  <Icon
                                    name="x"
                                    size={14}
                                    className="mr-2 inline"
                                  />
                                  Cancel Schedule
                                </DropdownItem>
                              ) : null}
                              {campaign.stats.total > 0 ? (
                                <DropdownItem
                                  onClick={() => setRecipientsTarget(campaign)}
                                >
                                  <Icon
                                    name="users"
                                    size={14}
                                    className="mr-2 inline"
                                  />
                                  View Recipients
                                </DropdownItem>
                              ) : null}
                              {campaign.status === "completed" ||
                              campaign.status === "failed" ? (
                                <DropdownItem
                                  disabled={duplicatingId === campaign.id}
                                  onClick={() => handleDuplicate(campaign)}
                                >
                                  <Icon
                                    name="copy"
                                    size={14}
                                    className="mr-2 inline"
                                  />
                                  {duplicatingId === campaign.id
                                    ? "Duplicating..."
                                    : "Duplicate & Resend"}
                                </DropdownItem>
                              ) : null}
                              {campaign.status === "draft" ? (
                                <DropdownItem
                                  danger
                                  onClick={() => setDeleteTarget(campaign)}
                                >
                                  <Icon
                                    name="trash"
                                    size={14}
                                    className="mr-2 inline"
                                  />
                                  Delete
                                </DropdownItem>
                              ) : null}
                            </div>
                          </Dropdown>
                        </div>
                      </TableCell>
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

      <CampaignFormModal
        open={isFormOpen}
        mode="edit"
        initialValues={formInitialValues}
        serverError={formServerError}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <CampaignRecipientsModal
        open={Boolean(recipientsTarget)}
        campaign={recipientsTarget}
        onClose={() => setRecipientsTarget(null)}
      />

      <CampaignPreviewModal
        open={Boolean(previewTarget)}
        campaign={previewTarget}
        onClose={() => setPreviewTarget(null)}
      />

      <SendTestCampaignModal
        open={Boolean(sendTestTarget)}
        campaign={sendTestTarget}
        onClose={() => setSendTestTarget(null)}
      />

      <ConfirmationDialog
        open={Boolean(sendTarget)}
        title="Send campaign"
        description={`This will send "${sendTarget?.name}" to ${sendTarget?.targetList ? `everyone subscribed in "${sendTarget.targetList.name}"` : "every subscribed contact"} using "${sendTarget?.smtpConfig?.name}". This cannot be undone.`}
        confirmLabel="Send Now"
        confirmVariant="primary"
        isLoading={isSending}
        onConfirm={handleConfirmSend}
        onClose={() => setSendTarget(null)}
      />

      <ScheduleCampaignModal
        open={Boolean(scheduleTarget)}
        campaign={scheduleTarget}
        serverError={scheduleServerError}
        onClose={() => setScheduleTarget(null)}
        onSubmit={handleConfirmSchedule}
      />

      <ConfirmationDialog
        open={Boolean(unscheduleTarget)}
        title="Cancel schedule"
        description={`"${unscheduleTarget?.name}" will be moved back to draft and won't send automatically. You can reschedule or send it manually anytime.`}
        confirmLabel="Cancel Schedule"
        confirmVariant="danger"
        isLoading={isUnscheduling}
        onConfirm={handleConfirmUnschedule}
        onClose={() => setUnscheduleTarget(null)}
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete campaign"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export { CampaignsPage };
