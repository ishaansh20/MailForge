import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
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
import { TemplateFormModal } from "./TemplateFormModal.jsx";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../../services/templateService.js";

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function TemplatesPage() {
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formInitialValues, setFormInitialValues] = useState(null);
  const [formServerError, setFormServerError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [reloadToken, setReloadToken] = useState(0);

  function refetch() {
    setReloadToken((currentValue) => currentValue + 1);
  }

  useEffect(() => {
    let ignore = false;

    async function loadTemplates() {
      setIsLoading(true);
      setFetchError("");

      try {
        const params = { page, limit: 10 };
        if (search) params.search = search;

        const result = await listTemplates(params);

        if (!ignore) {
          setItems(result.items);
          setPagination(result.pagination);
        }
      } catch (error) {
        if (!ignore) {
          setFetchError(
            error?.response?.data?.message || "Unable to load templates right now.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadTemplates();

    return () => {
      ignore = true;
    };
  }, [page, search, reloadToken]);

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

  function openEditModal(template) {
    setFormMode("edit");
    setFormInitialValues(template);
    setEditingId(template.id);
    setFormServerError("");
    setIsFormOpen(true);
  }

  async function handleFormSubmit(payload) {
    setFormServerError("");

    try {
      if (formMode === "edit") {
        await updateTemplate(editingId, payload);
        toast.success("Template updated", `"${payload.name}" was saved successfully.`);
      } else {
        await createTemplate(payload);
        toast.success("Template created", `"${payload.name}" is ready to use.`);
      }

      setIsFormOpen(false);
      refetch();
    } catch (error) {
      setFormServerError(
        error?.response?.data?.message || "Unable to save this template.",
      );
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      await deleteTemplate(deleteTarget.id);
      toast.success("Template deleted", `"${deleteTarget.name}" was removed.`);
      setDeleteTarget(null);
      refetch();
    } catch (error) {
      toast.error(
        "Unable to delete template",
        error?.response?.data?.message || "Something went wrong while deleting this template.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const hasActiveQuery = Boolean(search);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Templates"
        subtitle="Save reusable email content so campaigns don't need to be written from scratch each time."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Templates", to: "/templates" },
        ]}
        actions={
          <Button leftIcon={<Icon name="plus" size={16} />} onClick={openAddModal}>
            New Template
          </Button>
        }
      />

      <FilterBar>
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
          title={hasActiveQuery ? "No matching templates" : "No templates yet"}
          description={
            hasActiveQuery
              ? "Try adjusting your search."
              : "Create your first template to speed up building future campaigns."
          }
          actionLabel={hasActiveQuery ? undefined : "New Template"}
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
                    <TableHeaderCell>Subject</TableHeaderCell>
                    <TableHeaderCell>Last Updated</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {items.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium text-stone-950">{template.name}</TableCell>
                      <TableCell className="max-w-xs truncate text-stone-500">
                        {template.subject}
                      </TableCell>
                      <TableCell>{formatDateTime(template.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Dropdown
                          trigger={
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-150 ease-out hover:border-stone-300 hover:bg-stone-50 hover:text-stone-950 hover:shadow-[var(--shadow-lift)] active:scale-[0.98]">
                              <Icon name="more" size={18} />
                            </span>
                          }
                        >
                          <div className="space-y-1">
                            <DropdownItem onClick={() => openEditModal(template)}>
                              <Icon name="edit" size={14} className="mr-2 inline" />
                              Edit
                            </DropdownItem>
                            <DropdownItem danger onClick={() => setDeleteTarget(template)}>
                              <Icon name="trash" size={14} className="mr-2 inline" />
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

      <TemplateFormModal
        open={isFormOpen}
        mode={formMode}
        initialValues={formInitialValues}
        serverError={formServerError}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete template"
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

export { TemplatesPage };
