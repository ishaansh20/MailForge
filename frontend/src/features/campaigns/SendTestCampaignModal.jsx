import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { Pagination } from "../../components/ui/Pagination.jsx";
import { listContacts, createContact } from "../../services/contactService.js";
import { sendTestCampaignEmail } from "../../services/campaignService.js";
import { ContactFormModal } from "../contacts/ContactFormModal.jsx";
import { useToast } from "../../hooks/useToast.js";

function SendTestCampaignModal({ open, campaign, onClose }) {
  const toast = useToast();

  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [sendingContactId, setSendingContactId] = useState(null);

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactServerError, setContactServerError] = useState("");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let ignore = false;

    async function loadContacts() {
      setIsLoading(true);

      try {
        const result = await listContacts({
          search,
          page,
          limit: 10,
        });

        if (!ignore) {
          setContacts(result.items);
          setPagination(result.pagination);
        }
      } catch {
        if (!ignore) {
          setContacts([]);
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
  }, [open, search, page]);

  function toggleContact(contact) {
    setSelectedContacts((current) => {
      const exists = current.some((item) => item.id === contact.id);

      if (exists) {
        return current.filter((item) => item.id !== contact.id);
      }

      return [...current, contact];
    });
  }

  function removeSelectedContact(contactId) {
    setSelectedContacts((current) =>
      current.filter((contact) => contact.id !== contactId),
    );
  }

  async function handleSendTest() {
    if (!campaign || selectedContacts.length === 0) {
      return;
    }

    for (const contact of selectedContacts) {
      setSendingContactId(contact.id);

      try {
        await sendTestCampaignEmail({
          smtpConfig: campaign.smtpConfig?.id,
          subject: campaign.subject,
          body: campaign.body,
          to: contact.email,
          contactName: contact.name,
        });
      } catch (error) {
        toast.error(
          "Unable to send test email",
          error?.response?.data?.message ||
            `Unable to send test email to ${contact.email}.`,
        );

        setSendingContactId(null);
        return;
      }
    }

    setSendingContactId(null);

    toast.success(
      "Test email sent",
      `Test email sent to ${selectedContacts.length} contact${
        selectedContacts.length > 1 ? "s" : ""
      }.`,
    );

    setSelectedContacts([]);
    onClose();
  }

  async function handleAddContactSubmit(payload) {
    setContactServerError("");

    try {
      const newContact = await createContact(payload);

      setSelectedContacts((current) => [newContact, ...current]);
      setIsAddContactOpen(false);

      setPage(1);
      setSearch("");

      toast.success(
        "Contact added",
        `"${payload.name}" is now available for test sending.`,
      );
    } catch (error) {
      setContactServerError(
        error?.response?.data?.message || "Unable to add this contact.",
      );
    }
  }

  return (
    <>
      <Modal
        open={open}
        title="Send Test Email"
        onClose={onClose}
        maxWidth="max-w-3xl"
      >
        {campaign ? (
          <div className="space-y-5">
            <div>
              <p className="text-lg font-semibold text-stone-950">
                {campaign.name}
              </p>

              <p className="mt-1 text-sm text-stone-500">
                Send From: {campaign.smtpConfig?.name || "—"}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-700">Subject</p>

              <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-950">
                {campaign.subject}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-700">Message</p>

              <div className="overflow-hidden rounded-xl border border-stone-200">
                <iframe
                  title="Campaign email preview"
                  srcDoc={campaign.body}
                  sandbox=""
                  className="h-72 w-full bg-white"
                />
              </div>
            </div>

            <div className="border-t border-stone-200 pt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-stone-700">
                    Test Contacts
                  </p>

                  <p className="text-xs text-stone-400">
                    Select one or more existing contacts.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setContactServerError("");
                    setIsAddContactOpen(true);
                  }}
                >
                  <Icon name="plus" size={14} className="mr-1" />
                  Add Contact
                </Button>
              </div>

              <div className="mt-4">
                <Input
                  leftIcon={<Icon name="search" size={16} />}
                  placeholder="Search contacts..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>

              {selectedContacts.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                    Selected Contacts
                  </p>

                  {selectedContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-stone-950">
                          {contact.name}
                        </p>

                        <p className="text-xs text-stone-500">
                          {contact.email}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSelectedContact(contact.id)}
                        className="text-sm font-medium text-rose-500 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 overflow-hidden rounded-xl border border-stone-200">
                {isLoading ? (
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : contacts.length === 0 ? (
                  <p className="p-5 text-center text-sm text-stone-500">
                    No contacts found.
                  </p>
                ) : (
                  <div>
                    {contacts.map((contact) => {
                      const selected = selectedContacts.some(
                        (item) => item.id === contact.id,
                      );

                      return (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between border-b border-stone-100 p-3 last:border-b-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-stone-950">
                              {contact.name}
                            </p>

                            <p className="text-xs text-stone-500">
                              {contact.email}
                            </p>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant={selected ? "primary" : "secondary"}
                            onClick={() => toggleContact(contact)}
                          >
                            {selected ? "Selected" : "Select"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {pagination.totalPages > 1 ? (
                <div className="mt-2 border-t border-stone-200 p-2">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                  />
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-stone-200 pt-5">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>

              <Button
                type="button"
                disabled={
                  selectedContacts.length === 0 || Boolean(sendingContactId)
                }
                loading={Boolean(sendingContactId)}
                onClick={handleSendTest}
              >
                <Icon name="send" size={14} className="mr-1" />
                Send Test
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ContactFormModal
        open={isAddContactOpen}
        mode="create"
        initialValues={null}
        serverError={contactServerError}
        onClose={() => setIsAddContactOpen(false)}
        onSubmit={handleAddContactSubmit}
      />
    </>
  );
}

export { SendTestCampaignModal };
