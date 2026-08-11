import { useEffect, useState } from "react";
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
import { Tooltip } from "../../components/ui/Tooltip.jsx";
import { useToast } from "../../hooks/useToast.js";
import { SmtpFormModal } from "./SmtpFormModal.jsx";
import { SendTestEmailModal } from "./SendTestEmailModal.jsx";
import {
  listSmtpConfigs,
  createSmtpConfig,
  updateSmtpConfig,
  deleteSmtpConfig,
  testSmtpConfig,
  sendTestEmail,
  setDefaultSmtpConfig,
  setSmtpConfigStatus,
} from "../../services/smtpService.js";

const statusBadgeVariant = {
  success: "success",
  failed: "danger",
  untested: "neutral",
};

const statusLabel = {
  success: "Verified",
  failed: "Failed",
  untested: "Untested",
};

const activeFilters = [
  { label: "All", value: "all" },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

function formatDateTime(value) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SmtpPage() {
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [rowActionId, setRowActionId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formInitialValues, setFormInitialValues] = useState(null);
  const [formServerError, setFormServerError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sendTestTarget, setSendTestTarget] = useState(null);
  const [sendTestOpenCount, setSendTestOpenCount] = useState(0);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [sendTestServerError, setSendTestServerError] = useState("");

  function openSendTestModal(config) {
    setSendTestTarget(config);
    setSendTestServerError("");
    setSendTestOpenCount((currentValue) => currentValue + 1);
  }

  const [reloadToken, setReloadToken] = useState(0);

  function refetch() {
    setReloadToken((currentValue) => currentValue + 1);
  }

  useEffect(() => {
    let ignore = false;

    async function loadConfigs() {
      setIsLoading(true);
      setFetchError("");

      try {
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (activeFilter !== "all") params.isActive = activeFilter;

        const result = await listSmtpConfigs(params);

        if (!ignore) {
          setItems(result.items);
          setPagination(result.pagination);
        }
      } catch (error) {
        if (!ignore) {
          setFetchError(
            error?.response?.data?.message || "Unable to load SMTP configurations right now.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadConfigs();

    return () => {
      ignore = true;
    };
  }, [page, search, activeFilter, reloadToken]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  function openAddModal() {
    setFormMode("create");
    setFormInitialValues(null);
    setEditingId(null);
    setFormServerError("");
    setIsFormOpen(true);
  }

  function openEditModal(config) {
    setFormMode("edit");
    setFormInitialValues(config);
    setEditingId(config.id);
    setFormServerError("");
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
  }

  async function handleFormSubmit(payload) {
    setFormServerError("");

    try {
      if (formMode === "edit") {
        await updateSmtpConfig(editingId, payload);
        toast.success("SMTP configuration updated", `"${payload.name}" was saved successfully.`);
      } else {
        await createSmtpConfig(payload);
        toast.success("SMTP configuration created", `"${payload.name}" is ready to use.`);
      }

      setIsFormOpen(false);
      refetch();
    } catch (error) {
      setFormServerError(
        error?.response?.data?.message || "Unable to save this SMTP configuration.",
      );
    }
  }

  async function handleTest(config) {
    setRowActionId(config.id);

    try {
      const updated = await testSmtpConfig(config.id);

      if (updated.status === "success") {
        toast.success("Connection verified", `"${config.name}" connected successfully.`);
      } else {
        toast.error("Connection failed", updated.lastTestError || "The SMTP server rejected the connection.");
      }

      refetch();
    } catch (error) {
      toast.error(
        "Unable to test connection",
        error?.response?.data?.message || "Something went wrong while testing this configuration.",
      );
    } finally {
      setRowActionId(null);
    }
  }

  async function handleSendTestEmail(email) {
    if (!sendTestTarget) return;

    setIsSendingTest(true);
    setSendTestServerError("");

    try {
      await sendTestEmail(sendTestTarget.id, email);
      toast.success(
        "Test email sent",
        `Sent to ${email} using "${sendTestTarget.name}". Check the inbox to confirm delivery.`,
      );
      setSendTestTarget(null);
    } catch (error) {
      setSendTestServerError(
        error?.response?.data?.message || "Unable to send the test email right now.",
      );
    } finally {
      setIsSendingTest(false);
    }
  }

  async function handleSetDefault(config) {
    setRowActionId(config.id);

    try {
      await setDefaultSmtpConfig(config.id);
      toast.success("Default SMTP updated", `"${config.name}" is now the default configuration.`);
      refetch();
    } catch (error) {
      toast.error(
        "Unable to set default",
        error?.response?.data?.message || "Something went wrong while updating the default.",
      );
    } finally {
      setRowActionId(null);
    }
  }

  async function handleToggleActive(config) {
    setRowActionId(config.id);

    try {
      await setSmtpConfigStatus(config.id, !config.isActive);
      toast.success(
        config.isActive ? "SMTP configuration disabled" : "SMTP configuration enabled",
        `"${config.name}" is now ${config.isActive ? "inactive" : "active"}.`,
      );
      refetch();
    } catch (error) {
      toast.error(
        "Unable to update status",
        error?.response?.data?.message || "Something went wrong while updating this configuration.",
      );
    } finally {
      setRowActionId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      await deleteSmtpConfig(deleteTarget.id);
      toast.success("SMTP configuration deleted", `"${deleteTarget.name}" was removed.`);
      setDeleteTarget(null);
      refetch();
    } catch (error) {
      toast.error(
        "Unable to delete configuration",
        error?.response?.data?.message || "Something went wrong while deleting this configuration.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const hasActiveQuery = Boolean(search) || activeFilter !== "all";

  return (
    <div className="space-y-8">
      <PageHeader
        title="SMTP Configuration"
        subtitle="Manage the outbound email servers used to send campaigns and transactional messages."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "SMTP", to: "/smtp" },
        ]}
        actions={
          <Button leftIcon={<Icon name="plus" size={16} />} onClick={openAddModal}>
            Add SMTP
          </Button>
        }
      />

      <FilterBar
        actions={
          <div className="flex items-center gap-1">
            {activeFilters.map((filter) => (
              <Button
                key={filter.value}
                size="sm"
                variant={activeFilter === filter.value ? "primary" : "ghost"}
                onClick={() => {
                  setActiveFilter(filter.value);
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
            placeholder="Search by name, host, or from email"
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
          title={hasActiveQuery ? "No matching SMTP configurations" : "No SMTP configurations yet"}
          description={
            hasActiveQuery
              ? "Try adjusting your search or filters."
              : "Add your first SMTP configuration to start sending campaigns and transactional emails."
          }
          actionLabel={hasActiveQuery ? undefined : "Add SMTP"}
          onAction={hasActiveQuery ? undefined : openAddModal}
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Host</TableHeaderCell>
                    <TableHeaderCell>From</TableHeaderCell>
                    <TableHeaderCell>Connection</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Last Tested</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {items.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium text-stone-950">
                        <div className="flex items-center gap-2">
                          {config.name}
                          {config.isDefault ? (
                            <Badge variant="info">
                              <Icon name="star" size={12} className="mr-1" />
                              Default
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {config.transport === "brevo_api" ? (
                          <Badge variant="info">Brevo API</Badge>
                        ) : (
                          <>
                            {config.host}:{config.port}
                            {config.secure ? " (TLS)" : ""}
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{config.fromName}</div>
                        <div className="text-xs text-stone-400">{config.fromEmail}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[config.status] || "neutral"}>
                          {statusLabel[config.status] || config.status}
                        </Badge>
                        {config.status === "failed" && config.lastTestError ? (
                          <Tooltip label={config.lastTestError}>
                            <p className="mt-1 max-w-[200px] truncate text-xs text-rose-500">
                              {config.lastTestError}
                            </p>
                          </Tooltip>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.isActive ? "success" : "neutral"}>
                          {config.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(config.lastTestedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Dropdown
                          trigger={
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-150 ease-out hover:border-stone-300 hover:bg-stone-50 hover:text-stone-950 hover:shadow-[var(--shadow-lift)] active:scale-[0.98]">
                              <Icon name="more" size={18} />
                            </span>
                          }
                        >
                          <div className="space-y-1">
                            <DropdownItem onClick={() => openEditModal(config)}>
                              <Icon name="edit" size={14} className="mr-2 inline" />
                              Edit
                            </DropdownItem>
                            <DropdownItem
                              disabled={rowActionId === config.id}
                              onClick={() => handleTest(config)}
                            >
                              <Icon name="activity" size={14} className="mr-2 inline" />
                              Test Connection
                            </DropdownItem>
                            {config.isActive ? (
                              <DropdownItem onClick={() => openSendTestModal(config)}>
                                <Icon name="mail" size={14} className="mr-2 inline" />
                                Send Test Email
                              </DropdownItem>
                            ) : (
                              <Tooltip label="Inactive SMTP configurations cannot send emails">
                                <DropdownItem disabled>Send Test Email</DropdownItem>
                              </Tooltip>
                            )}
                            {!config.isDefault ? (
                              <DropdownItem
                                disabled={rowActionId === config.id || !config.isActive}
                                onClick={() => handleSetDefault(config)}
                              >
                                <Icon name="star" size={14} className="mr-2 inline" />
                                Set as Default
                              </DropdownItem>
                            ) : null}
                            {config.isDefault && config.isActive ? (
                              <Tooltip label="The default SMTP configuration cannot be disabled">
                                <DropdownItem disabled>Disable</DropdownItem>
                              </Tooltip>
                            ) : (
                              <DropdownItem
                                disabled={rowActionId === config.id}
                                onClick={() => handleToggleActive(config)}
                              >
                                {config.isActive ? "Disable" : "Enable"}
                              </DropdownItem>
                            )}
                            {config.isDefault ? (
                              <Tooltip label="The default SMTP configuration cannot be deleted">
                                <DropdownItem disabled danger>
                                  Delete
                                </DropdownItem>
                              </Tooltip>
                            ) : (
                              <DropdownItem danger onClick={() => setDeleteTarget(config)}>
                                <Icon name="trash" size={14} className="mr-2 inline" />
                                Delete
                              </DropdownItem>
                            )}
                          </div>
                        </Dropdown>
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

      <SmtpFormModal
        open={isFormOpen}
        mode={formMode}
        initialValues={formInitialValues}
        serverError={formServerError}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
      />

      <SendTestEmailModal
        key={sendTestOpenCount}
        open={Boolean(sendTestTarget)}
        config={sendTestTarget}
        isSending={isSendingTest}
        serverError={sendTestServerError}
        onClose={() => {
          setSendTestTarget(null);
          setSendTestServerError("");
        }}
        onSend={handleSendTestEmail}
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete SMTP configuration"
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

export { SmtpPage };
