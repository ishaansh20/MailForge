import { useEffect, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { RichTextEditor } from "../../components/ui/RichTextEditor.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../../components/ui/Table.jsx";
import { Pagination } from "../../components/ui/Pagination.jsx";
import { listSmtpConfigs } from "../../services/smtpService.js";
import { listContactLists, getListMembers } from "../../services/listService.js";
import { listTemplates } from "../../services/templateService.js";
import { listContacts, updateContact } from "../../services/contactService.js";
import { ContactFormModal } from "../contacts/ContactFormModal.jsx";
import { useToast } from "../../hooks/useToast.js";

const statusBadgeVariant = {
  subscribed: "success",
  unsubscribed: "neutral",
  bounced: "danger",
};

function CampaignFormModal({ open, mode, initialValues, serverError, onClose, onSubmit }) {
  const isEditMode = mode === "edit";
  const toast = useToast();

  const [smtpOptions, setSmtpOptions] = useState([]);
  const [isLoadingSmtp, setIsLoadingSmtp] = useState(false);

  const [listOptions, setListOptions] = useState([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  const [templateOptions, setTemplateOptions] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  const [previewContacts, setPreviewContacts] = useState([]);
  const [previewPagination, setPreviewPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [previewPage, setPreviewPage] = useState(1);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewReloadToken, setPreviewReloadToken] = useState(0);

  const [editingContact, setEditingContact] = useState(null);
  const [contactServerError, setContactServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: "", subject: "", body: "", smtpConfig: "", targetList: "" },
  });

  const watchedTargetList = useWatch({ control, name: "targetList" });
  const [previewedTargetList, setPreviewedTargetList] = useState(watchedTargetList);

  if (watchedTargetList !== previewedTargetList) {
    setPreviewedTargetList(watchedTargetList);
    setPreviewPage(1);
  }

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    reset({
      name: initialValues?.name || "",
      subject: initialValues?.subject || "",
      body: initialValues?.body || "",
      smtpConfig: initialValues?.smtpConfig?.id || "",
      targetList: initialValues?.targetList?.id || "",
    });

    let ignore = false;

    async function loadSmtpOptions() {
      setIsLoadingSmtp(true);

      try {
        const result = await listSmtpConfigs({ isActive: "true", limit: 100 });

        if (!ignore) {
          setSmtpOptions(result.items);
        }
      } finally {
        if (!ignore) {
          setIsLoadingSmtp(false);
        }
      }
    }

    async function loadListOptions() {
      setIsLoadingLists(true);

      try {
        const result = await listContactLists({ limit: 100 });

        if (!ignore) {
          setListOptions(result.items);
        }
      } finally {
        if (!ignore) {
          setIsLoadingLists(false);
        }
      }
    }

    async function loadTemplateOptions() {
      setIsLoadingTemplates(true);

      try {
        const result = await listTemplates({ limit: 100 });

        if (!ignore) {
          setTemplateOptions(result.items);
        }
      } finally {
        if (!ignore) {
          setIsLoadingTemplates(false);
        }
      }
    }

    loadSmtpOptions();
    loadListOptions();
    loadTemplateOptions();

    return () => {
      ignore = true;
    };
  }, [open, initialValues, reset]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let ignore = false;

    async function loadPreviewContacts() {
      setIsLoadingPreview(true);

      try {
        const result = watchedTargetList
          ? await getListMembers(watchedTargetList, { page: previewPage, limit: 5 })
          : await listContacts({ status: "subscribed", page: previewPage, limit: 5 });

        if (!ignore) {
          setPreviewContacts(result.items);
          setPreviewPagination(result.pagination);
        }
      } catch {
        if (!ignore) {
          setPreviewContacts([]);
        }
      } finally {
        if (!ignore) {
          setIsLoadingPreview(false);
        }
      }
    }

    loadPreviewContacts();

    return () => {
      ignore = true;
    };
  }, [open, watchedTargetList, previewPage, previewReloadToken]);

  function handleApplyTemplate(event) {
    const templateId = event.target.value;
    const template = templateOptions.find((option) => option.id === templateId);

    if (template) {
      setValue("subject", template.subject);
      setValue("body", template.body);
    }
  }

  function openEditContact(contact) {
    setContactServerError("");
    setEditingContact(contact);
  }

  async function handleEditContactSubmit(payload) {
    setContactServerError("");

    try {
      await updateContact(editingContact.id, payload);
      toast.success("Contact updated", `"${payload.name}" was saved successfully.`);
      setEditingContact(null);
      setPreviewReloadToken((currentValue) => currentValue + 1);
    } catch (error) {
      setContactServerError(
        error?.response?.data?.message || "Unable to save this contact.",
      );
    }
  }

  async function handleFormSubmit(values) {
    await onSubmit(values);
  }

  return (
    <Modal
      open={open}
      title={isEditMode ? "Edit Campaign" : "New Campaign"}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        <Input
          label="Campaign Name"
          placeholder="July Newsletter"
          error={errors.name?.message}
          {...register("name", {
            required: "Name is required",
            minLength: { value: 2, message: "Name must be at least 2 characters" },
          })}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Start from Template (optional)</label>
          <select
            key={`${open}-${initialValues?.id || "new"}`}
            className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-950 outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-stone-950/5 disabled:cursor-not-allowed disabled:bg-stone-100"
            disabled={isLoadingTemplates}
            defaultValue=""
            onChange={handleApplyTemplate}
          >
            <option value="">
              {isLoadingTemplates ? "Loading..." : "None — write from scratch"}
            </option>
            {templateOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-stone-400">
            Copies the template's subject and body into the fields below — you can still edit them
            afterward.
          </p>
        </div>

        <Input
          label="Subject"
          placeholder="Hello {{name}}, check this out!"
          helperText="Use {{name}} to personalize the subject and body with each recipient's name."
          error={errors.subject?.message}
          {...register("subject", { required: "Subject is required" })}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Send From</label>
          <select
            className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-950 outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-stone-950/5 disabled:cursor-not-allowed disabled:bg-stone-100"
            disabled={isLoadingSmtp}
            {...register("smtpConfig", { required: "Select an SMTP configuration" })}
          >
            <option value="">
              {isLoadingSmtp ? "Loading..." : "Select an SMTP configuration"}
            </option>
            {smtpOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          {errors.smtpConfig ? (
            <p className="text-sm text-rose-600">{errors.smtpConfig.message}</p>
          ) : null}
          {!isLoadingSmtp && smtpOptions.length === 0 ? (
            <p className="text-sm text-amber-600">
              No active SMTP configurations available. Add one on the SMTP page first.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Send To</label>
          <select
            className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-950 outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-stone-950/5 disabled:cursor-not-allowed disabled:bg-stone-100"
            disabled={isLoadingLists}
            {...register("targetList")}
          >
            <option value="">All Subscribed Contacts</option>
            {listOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} ({option.memberCount})
              </option>
            ))}
          </select>

          <div className="overflow-hidden rounded-xl border border-stone-200">
            {isLoadingPreview ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : previewContacts.length === 0 ? (
              <p className="p-4 text-sm text-stone-500">
                {watchedTargetList
                  ? "This list has no contacts yet."
                  : "There are no subscribed contacts yet."}
              </p>
            ) : (
              <>
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeaderCell>Name</TableHeaderCell>
                      <TableHeaderCell>Email</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell className="text-right">Edit</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {previewContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium text-stone-950">{contact.name}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[contact.status] || "neutral"}>
                            {contact.status || "subscribed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            type="button"
                            onClick={() => openEditContact(contact)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-150 ease-out hover:border-stone-300 hover:bg-stone-50 hover:text-stone-950"
                            aria-label={`Edit ${contact.name}`}
                          >
                            <Icon name="edit" size={14} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {previewPagination.totalPages > 1 ? (
                  <div className="border-t border-stone-200 p-2">
                    <Pagination
                      currentPage={previewPagination.page}
                      totalPages={previewPagination.totalPages}
                      onPageChange={setPreviewPage}
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
          <p className="text-xs text-stone-400">
            {watchedTargetList
              ? "Contacts in the selected list. Click the edit icon to update a contact without leaving this form."
              : "All currently subscribed contacts. Click the edit icon to update a contact without leaving this form."}
          </p>
        </div>

        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <p className="font-medium">Dynamic variables</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sky-700">
            <li>
              <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-xs">{"{{name}}"}</code>{" "}
              — recipient&apos;s name. Works in both the subject and the body.
            </li>
            <li>
              <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-xs">
                {"{{unsubscribe_url}}"}
              </code>{" "}
              — place this anywhere in your HTML to control exactly where the unsubscribe link
              appears. If you leave it out, one is added automatically at the bottom.
            </li>
          </ul>
        </div>

        <Controller
          name="body"
          control={control}
          rules={{ required: "Email body is required" }}
          render={({ field }) => (
            <RichTextEditor
              label="Email Body"
              value={field.value}
              onChange={field.onChange}
              error={errors.body?.message}
            />
          )}
        />

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditMode ? "Save Changes" : "Create Campaign"}
          </Button>
        </div>
      </form>

      <ContactFormModal
        open={Boolean(editingContact)}
        mode="edit"
        initialValues={editingContact}
        serverError={contactServerError}
        onClose={() => setEditingContact(null)}
        onSubmit={handleEditContactSubmit}
      />
    </Modal>
  );
}

export { CampaignFormModal };
