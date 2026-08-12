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
import { ListFormModal } from "./ListFormModal.jsx";
import { ListMembersModal } from "./ListMembersModal.jsx";
import {
  listContactLists,
  createContactList,
  updateContactList,
  deleteContactList,
} from "../../services/listService.js";

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ListsPage() {
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

  const [membersTarget, setMembersTarget] = useState(null);

  const [reloadToken, setReloadToken] = useState(0);

  function refetch() {
    setReloadToken((currentValue) => currentValue + 1);
  }

  useEffect(() => {
    let ignore = false;

    async function loadLists() {
      setIsLoading(true);
      setFetchError("");

      try {
        const params = { page, limit: 10 };
        if (search) params.search = search;

        const result = await listContactLists(params);

        if (!ignore) {
          setItems(result.items);
          setPagination(result.pagination);
        }
      } catch (error) {
        if (!ignore) {
          setFetchError(
            error?.response?.data?.message || "Unable to load lists right now.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadLists();

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

  function openEditModal(list) {
    setFormMode("edit");
    setFormInitialValues(list);
    setEditingId(list.id);
    setFormServerError("");
    setIsFormOpen(true);
  }

  async function handleFormSubmit(payload) {
    setFormServerError("");

    try {
      if (formMode === "edit") {
        await updateContactList(editingId, payload);
        toast.success("List updated", `"${payload.name}" was saved successfully.`);
      } else {
        await createContactList(payload);
        toast.success("List created", `"${payload.name}" is ready to use.`);
      }

      setIsFormOpen(false);
      refetch();
    } catch (error) {
      setFormServerError(
        error?.response?.data?.message || "Unable to save this list.",
      );
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      await deleteContactList(deleteTarget.id);
      toast.success("List deleted", `"${deleteTarget.name}" was removed.`);
      setDeleteTarget(null);
      refetch();
    } catch (error) {
      toast.error(
        "Unable to delete list",
        error?.response?.data?.message || "Something went wrong while deleting this list.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const hasActiveQuery = Boolean(search);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lists"
        subtitle="Group contacts into lists so campaigns can target a specific audience."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Lists", to: "/lists" },
        ]}
        actions={
          <Button leftIcon={<Icon name="plus" size={16} />} onClick={openAddModal}>
            New List
          </Button>
        }
      />

      <FilterBar>
        <div className="w-full max-w-sm">
          <SearchBar
            placeholder="Search by name or description"
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
          title={hasActiveQuery ? "No matching lists" : "No lists yet"}
          description={
            hasActiveQuery
              ? "Try adjusting your search."
              : "Create your first list to start targeting specific groups of contacts."
          }
          actionLabel={hasActiveQuery ? undefined : "New List"}
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
                    <TableHeaderCell>Description</TableHeaderCell>
                    <TableHeaderCell>Members</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {items.map((list) => (
                    <TableRow key={list.id}>
                      <TableCell className="font-medium text-stone-950">{list.name}</TableCell>
                      <TableCell className="max-w-xs truncate text-stone-500">
                        {list.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{list.memberCount}</Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(list.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Dropdown
                          trigger={
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-150 ease-out hover:border-stone-300 hover:bg-stone-50 hover:text-stone-950 hover:shadow-[var(--shadow-lift)] active:scale-[0.98]">
                              <Icon name="more" size={18} />
                            </span>
                          }
                        >
                          <div className="space-y-1">
                            <DropdownItem onClick={() => setMembersTarget(list)}>
                              <Icon name="users" size={14} className="mr-2 inline" />
                              Manage Members
                            </DropdownItem>
                            <DropdownItem onClick={() => openEditModal(list)}>
                              <Icon name="edit" size={14} className="mr-2 inline" />
                              Edit
                            </DropdownItem>
                            <DropdownItem danger onClick={() => setDeleteTarget(list)}>
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

      <ListFormModal
        open={isFormOpen}
        mode={formMode}
        initialValues={formInitialValues}
        serverError={formServerError}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ListMembersModal
        open={Boolean(membersTarget)}
        list={membersTarget}
        onClose={() => setMembersTarget(null)}
        onChanged={refetch}
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete list"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Contacts in this list will not be deleted, only the list itself. This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export { ListsPage };
