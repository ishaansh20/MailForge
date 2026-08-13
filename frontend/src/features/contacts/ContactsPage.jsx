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
import { useToast } from "../../hooks/useToast.js";
import { ContactFormModal } from "./ContactFormModal.jsx";
import { ImportContactsModal } from "./ImportContactsModal.jsx";
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  setContactStatus,
  importContacts,
} from "../../services/contactService.js";

const statusBadgeVariant = {
  subscribed: "success",
  unsubscribed: "neutral",
  bounced: "danger",
};

const statusLabel = {
  subscribed: "Subscribed",
  unsubscribed: "Unsubscribed",
  bounced: "Bounced",
};

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Subscribed", value: "subscribed" },
  { label: "Unsubscribed", value: "unsubscribed" },
  { label: "Bounced", value: "bounced" },
];

const allStatuses = ["subscribed", "unsubscribed", "bounced"];

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ContactsPage() {
  const toast = useToast();

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

  const [rowActionId, setRowActionId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formInitialValues, setFormInitialValues] = useState(null);
  const [formServerError, setFormServerError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");

  const [reloadToken, setReloadToken] = useState(0);

  function refetch() {
    setReloadToken((currentValue) => currentValue + 1);
  }

  useEffect(() => {
    let ignore = false;

    async function loadContacts() {
      setIsLoading(true);
      setFetchError("");

      try {
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (statusFilter !== "all") params.status = statusFilter;

        const result = await listContacts(params);

        if (!ignore) {
          setItems(result.items);
          setPagination(result.pagination);
        }
      } catch (error) {
        if (!ignore) {
          setFetchError(
            error?.response?.data?.message ||
              "Unable to load contacts right now.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadContacts();

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

  function openAddModal() {
    setFormMode("create");
    setFormInitialValues(null);
    setEditingId(null);
    setFormServerError("");
    setIsFormOpen(true);
  }

  function openEditModal(contact) {
    setFormMode("edit");
    setFormInitialValues(contact);
    setEditingId(contact.id);
    setFormServerError("");
    setIsFormOpen(true);
  }

  async function handleFormSubmit(payload) {
    setFormServerError("");

    try {
      if (formMode === "edit") {
        await updateContact(editingId, payload);
        toast.success(
          "Contact updated",
          `"${payload.name}" was saved successfully.`,
        );
      } else {
        await createContact(payload);
        toast.success("Contact created", `"${payload.name}" was added.`);
      }

      setIsFormOpen(false);
      refetch();
    } catch (error) {
      setFormServerError(
        error?.response?.data?.message || "Unable to save this contact.",
      );
    }
  }

  async function handleSetStatus(contact, status) {
    setRowActionId(contact.id);

    try {
      await setContactStatus(contact.id, status);
      toast.success(
        "Contact updated",
        `"${contact.name}" is now marked as ${statusLabel[status].toLowerCase()}.`,
      );
      refetch();
    } catch (error) {
      toast.error(
        "Unable to update contact",
        error?.response?.data?.message ||
          "Something went wrong while updating this contact.",
      );
    } finally {
      setRowActionId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      await deleteContact(deleteTarget.id);
      toast.success("Contact deleted", `"${deleteTarget.name}" was removed.`);
      setDeleteTarget(null);
      refetch();
    } catch (error) {
      toast.error(
        "Unable to delete contact",
        error?.response?.data?.message ||
          "Something went wrong while deleting this contact.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function openImportModal() {
    setImportResult(null);
    setImportError("");
    setIsImportOpen(true);
  }

  function closeImportModal() {
    setIsImportOpen(false);
    if (importResult) {
      refetch();
    }
  }

  async function handleImport(csvText) {
    setIsImporting(true);
    setImportError("");
    setImportResult(null);

    try {
      const result = await importContacts(csvText);

      setImportResult(result);

      if (result.imported > 0) {
        setIsImportOpen(false);
        refetch();
      }
    } catch (error) {
      setImportError(
        error?.response?.data?.message ||
          "Unable to import this file right now.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  const hasActiveQuery = Boolean(search) || statusFilter !== "all";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Contacts"
        subtitle="Manage the people you send campaigns and transactional emails to."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Contacts", to: "/contacts" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<Icon name="upload" size={16} />}
              onClick={openImportModal}
            >
              Import CSV
            </Button>
            <Button
              leftIcon={<Icon name="plus" size={16} />}
              onClick={openAddModal}
            >
              Add Contact
            </Button>
          </div>
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
            placeholder="Search by name or email"
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
          title={hasActiveQuery ? "No matching contacts" : "No contacts yet"}
          description={
            hasActiveQuery
              ? "Try adjusting your search or filters."
              : "Add your first contact or import a CSV file to get started."
          }
          actionLabel={hasActiveQuery ? undefined : "Add Contact"}
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
                    <TableHeaderCell>Email</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Added</TableHeaderCell>
                    <TableHeaderCell className="text-right">
                      Actions
                    </TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {items.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium text-stone-950">
                        {contact.name}
                      </TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusBadgeVariant[contact.status] || "neutral"
                          }
                        >
                          {statusLabel[contact.status] || contact.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(contact.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Dropdown
                          trigger={
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-150 ease-out hover:border-stone-300 hover:bg-stone-50 hover:text-stone-950 hover:shadow-[var(--shadow-lift)] active:scale-[0.98]">
                              <Icon name="more" size={18} />
                            </span>
                          }
                        >
                          <div className="space-y-1">
                            <DropdownItem
                              onClick={() => openEditModal(contact)}
                            >
                              <Icon
                                name="edit"
                                size={14}
                                className="mr-2 inline"
                              />
                              Edit
                            </DropdownItem>
                            {allStatuses
                              .filter((status) => status !== contact.status)
                              .map((status) => (
                                <DropdownItem
                                  key={status}
                                  disabled={rowActionId === contact.id}
                                  onClick={() =>
                                    handleSetStatus(contact, status)
                                  }
                                >
                                  Mark {statusLabel[status]}
                                </DropdownItem>
                              ))}
                            <DropdownItem
                              danger
                              onClick={() => setDeleteTarget(contact)}
                            >
                              <Icon
                                name="trash"
                                size={14}
                                className="mr-2 inline"
                              />
                              Delete
                            </DropdownItem>
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

      <ContactFormModal
        open={isFormOpen}
        mode={formMode}
        initialValues={formInitialValues}
        serverError={formServerError}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ImportContactsModal
        open={isImportOpen}
        isImporting={isImporting}
        result={importResult}
        error={importError}
        onClose={closeImportModal}
        onImport={handleImport}
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete contact"
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

export { ContactsPage };
