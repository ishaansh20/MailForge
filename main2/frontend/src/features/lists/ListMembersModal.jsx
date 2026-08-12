import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { Checkbox } from "../../components/ui/Checkbox.jsx";
import { useToast } from "../../hooks/useToast.js";
import {
  getListMembers,
  getAvailableContacts,
  addContactsToList,
  removeContactsFromList,
  addNewContactsToList,
} from "../../services/listService.js";

function emptyManualRow() {
  return { name: "", email: "" };
}

function ListMembersModal({ open, list, onClose, onChanged }) {
  const toast = useToast();

  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set());
  const [isRemovingSelected, setIsRemovingSelected] = useState(false);

  const [availableSearchInput, setAvailableSearchInput] = useState("");
  const [availableSearch, setAvailableSearch] = useState("");
  const [availableContacts, setAvailableContacts] = useState([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [selectedAvailableIds, setSelectedAvailableIds] = useState(new Set());
  const [isAddingSelected, setIsAddingSelected] = useState(false);

  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualRows, setManualRows] = useState([emptyManualRow()]);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState("");

  const [reloadToken, setReloadToken] = useState(0);

  function refetch() {
    setReloadToken((currentValue) => currentValue + 1);
    onChanged?.();
  }

  useEffect(() => {
    if (!open || !list) {
      return undefined;
    }

    let ignore = false;

    async function loadMembers() {
      setIsLoadingMembers(true);

      try {
        const result = await getListMembers(list.id, { limit: 50 });

        if (!ignore) {
          setMembers(result.items);
          setSelectedMemberIds(new Set());
        }
      } finally {
        if (!ignore) {
          setIsLoadingMembers(false);
        }
      }
    }

    loadMembers();

    return () => {
      ignore = true;
    };
  }, [open, list, reloadToken]);

  useEffect(() => {
    if (!open || !list) {
      return undefined;
    }

    let ignore = false;

    async function loadAvailable() {
      setIsLoadingAvailable(true);

      try {
        const result = await getAvailableContacts(list.id, {
          limit: 20,
          search: availableSearch,
        });

        if (!ignore) {
          setAvailableContacts(result.items);
          setSelectedAvailableIds(new Set());
        }
      } finally {
        if (!ignore) {
          setIsLoadingAvailable(false);
        }
      }
    }

    loadAvailable();

    return () => {
      ignore = true;
    };
  }, [open, list, availableSearch, reloadToken]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAvailableSearch(availableSearchInput.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [availableSearchInput]);

  useEffect(() => {
    if (open) {
      setShowManualAdd(false);
      setManualRows([emptyManualRow()]);
      setManualError("");
    }
  }, [open, list]);

  function toggleAvailableSelected(contactId) {
    setSelectedAvailableIds((current) => {
      const next = new Set(current);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  }

  function toggleAllAvailable() {
    setSelectedAvailableIds((current) =>
      current.size === availableContacts.length
        ? new Set()
        : new Set(availableContacts.map((contact) => contact.id)),
    );
  }

  function toggleMemberSelected(contactId) {
    setSelectedMemberIds((current) => {
      const next = new Set(current);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  }

  function toggleAllMembers() {
    setSelectedMemberIds((current) =>
      current.size === members.length ? new Set() : new Set(members.map((contact) => contact.id)),
    );
  }

  async function handleAddSelected() {
    if (selectedAvailableIds.size === 0) {
      return;
    }

    setIsAddingSelected(true);

    try {
      await addContactsToList(list.id, Array.from(selectedAvailableIds));
      toast.success("Contacts added", `${selectedAvailableIds.size} contact(s) added to "${list.name}".`);
      refetch();
    } catch (error) {
      toast.error(
        "Unable to add contacts",
        error?.response?.data?.message || "Something went wrong while adding the selected contacts.",
      );
    } finally {
      setIsAddingSelected(false);
    }
  }

  async function handleRemoveSelected() {
    if (selectedMemberIds.size === 0) {
      return;
    }

    setIsRemovingSelected(true);

    try {
      await removeContactsFromList(list.id, Array.from(selectedMemberIds));
      toast.success("Contacts removed", `${selectedMemberIds.size} contact(s) removed from "${list.name}".`);
      refetch();
    } catch (error) {
      toast.error(
        "Unable to remove contacts",
        error?.response?.data?.message || "Something went wrong while removing the selected contacts.",
      );
    } finally {
      setIsRemovingSelected(false);
    }
  }

  function updateManualRow(index, field, value) {
    setManualRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    );
  }

  function addManualRow() {
    setManualRows((current) => [...current, emptyManualRow()]);
  }

  function removeManualRow(index) {
    setManualRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  async function handleManualSubmit() {
    setManualError("");

    const rows = manualRows
      .map((row) => ({ name: row.name.trim(), email: row.email.trim() }))
      .filter((row) => row.name || row.email);

    if (rows.length === 0) {
      setManualError("Add at least one contact with a name and email.");
      return;
    }

    setIsSubmittingManual(true);

    try {
      const result = await addNewContactsToList(list.id, rows);

      if (result.added > 0) {
        toast.success(
          "Contacts added",
          `${result.added} contact(s) added to "${list.name}"${result.skipped ? `, ${result.skipped} skipped` : ""}.`,
        );
      }

      if (result.skipped > 0 && result.added === 0) {
        setManualError(
          result.errors?.[0]?.reason
            ? `Nothing was added: ${result.errors[0].reason}.`
            : "Nothing was added — check the rows for errors.",
        );
      } else {
        setShowManualAdd(false);
        setManualRows([emptyManualRow()]);
        refetch();
      }
    } catch (error) {
      setManualError(
        error?.response?.data?.message || "Something went wrong while adding these contacts.",
      );
    } finally {
      setIsSubmittingManual(false);
    }
  }

  const allAvailableSelected =
    availableContacts.length > 0 && selectedAvailableIds.size === availableContacts.length;
  const someAvailableSelected = selectedAvailableIds.size > 0 && !allAvailableSelected;

  const allMembersSelected = members.length > 0 && selectedMemberIds.size === members.length;
  const someMembersSelected = selectedMemberIds.size > 0 && !allMembersSelected;

  return (
    <Modal open={open} title={`Manage Members — ${list?.name || ""}`} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-stone-700">Add Contacts</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowManualAdd((current) => !current)}
            >
              {showManualAdd ? "Search Existing Instead" : "Add New Contacts"}
            </Button>
          </div>

          {showManualAdd ? (
            <div className="space-y-3 rounded-xl border border-stone-200 p-3">
              {manualError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {manualError}
                </div>
              ) : null}
              <div className="space-y-2">
                {manualRows.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Name"
                      value={row.name}
                      onChange={(event) => updateManualRow(index, "name", event.target.value)}
                      containerClassName="flex-1"
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={row.email}
                      onChange={(event) => updateManualRow(index, "email", event.target.value)}
                      containerClassName="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove row"
                      disabled={manualRows.length === 1}
                      onClick={() => removeManualRow(index)}
                    >
                      <Icon name="x" size={16} />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <Button size="sm" variant="ghost" onClick={addManualRow}>
                  <Icon name="plus" size={14} className="mr-1" />
                  Add another row
                </Button>
                <Button size="sm" loading={isSubmittingManual} onClick={handleManualSubmit}>
                  Add to List
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Input
                leftIcon={<Icon name="search" size={16} />}
                placeholder="Search contacts to add"
                value={availableSearchInput}
                onChange={(event) => setAvailableSearchInput(event.target.value)}
              />
              <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-stone-200 p-2">
                {isLoadingAvailable ? (
                  <Skeleton className="h-10 w-full" />
                ) : availableContacts.length === 0 ? (
                  <p className="px-2 py-3 text-center text-sm text-stone-400">
                    No matching contacts to add.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-3 py-1">
                      <Checkbox
                        checked={allAvailableSelected}
                        indeterminate={someAvailableSelected}
                        onChange={toggleAllAvailable}
                        aria-label="Select all available contacts"
                      />
                      <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                        Select all
                      </p>
                    </div>
                    {availableContacts.map((contact) => (
                      <label
                        key={contact.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-stone-50"
                      >
                        <Checkbox
                          checked={selectedAvailableIds.has(contact.id)}
                          onChange={() => toggleAvailableSelected(contact.id)}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-stone-950">{contact.name}</p>
                          <p className="truncate text-xs text-stone-400">{contact.email}</p>
                        </div>
                      </label>
                    ))}
                  </>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={selectedAvailableIds.size === 0}
                  loading={isAddingSelected}
                  onClick={handleAddSelected}
                >
                  Add Selected ({selectedAvailableIds.size})
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-stone-700">
            Current Members{" "}
            <Badge variant="neutral">{members.length}</Badge>
          </p>
          <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-stone-200 p-2">
            {isLoadingMembers ? (
              <Skeleton className="h-10 w-full" />
            ) : members.length === 0 ? (
              <p className="px-2 py-3 text-center text-sm text-stone-400">
                No members yet. Add contacts above.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-3 px-3 py-1">
                  <Checkbox
                    checked={allMembersSelected}
                    indeterminate={someMembersSelected}
                    onChange={toggleAllMembers}
                    aria-label="Select all members"
                  />
                  <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                    Select all
                  </p>
                </div>
                {members.map((contact) => (
                  <label
                    key={contact.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-stone-50"
                  >
                    <Checkbox
                      checked={selectedMemberIds.has(contact.id)}
                      onChange={() => toggleMemberSelected(contact.id)}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-950">{contact.name}</p>
                      <p className="truncate text-xs text-stone-400">{contact.email}</p>
                    </div>
                  </label>
                ))}
              </>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              disabled={selectedMemberIds.size === 0}
              loading={isRemovingSelected}
              onClick={handleRemoveSelected}
            >
              Remove Selected ({selectedMemberIds.size})
            </Button>
          </div>
        </div>

        <div className="flex justify-end border-t border-stone-200 pt-5">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export { ListMembersModal };
