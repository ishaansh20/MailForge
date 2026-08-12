import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch, Controller } from "react-hook-form";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { Card, CardContent, CardFooter } from "../../components/ui/Card.jsx";
import { Stepper } from "../../components/ui/Stepper.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../../components/ui/Table.jsx";
import { Pagination } from "../../components/ui/Pagination.jsx";
import { useToast } from "../../hooks/useToast.js";
import { listSmtpConfigs } from "../../services/smtpService.js";
import {
  listContactLists,
  getListMembers,
  addContactsToList,
} from "../../services/listService.js";
import { listTemplates } from "../../services/templateService.js";
import {
  listContacts,
  createContact,
  updateContact,
} from "../../services/contactService.js";
import { createCampaign } from "../../services/campaignService.js";
import { ContactFormModal } from "../contacts/ContactFormModal.jsx";
import { RichTextEditor } from "../../components/ui/RichTextEditor.jsx";

const STEPS = ["Details", "Audience", "Review"];

const statusBadgeVariant = {
  subscribed: "success",
  unsubscribed: "neutral",
  bounced: "danger",
};

function CampaignWizardPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [serverError, setServerError] = useState("");

  const [smtpOptions, setSmtpOptions] = useState([]);
  const [isLoadingSmtp, setIsLoadingSmtp] = useState(false);

  const [listOptions, setListOptions] = useState([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  const [templateOptions, setTemplateOptions] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  const [previewContacts, setPreviewContacts] = useState([]);
  const [previewPagination, setPreviewPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [previewPage, setPreviewPage] = useState(1);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewReloadToken, setPreviewReloadToken] = useState(0);
  const [excludedContacts, setExcludedContacts] = useState([]);

  const [selectedPreviewContact, setSelectedPreviewContact] = useState(null);

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactServerError, setContactServerError] = useState("");
  const [editingContact, setEditingContact] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      smtpConfig: "",
      targetList: "",
    },
  });

  const watchedTargetList = useWatch({ control, name: "targetList" });
  const [previewedTargetList, setPreviewedTargetList] =
    useState(watchedTargetList);

  if (watchedTargetList !== previewedTargetList) {
    setPreviewedTargetList(watchedTargetList);
    setPreviewPage(1);
  }

  useEffect(() => {
    let ignore = false;

    async function loadOptions() {
      setIsLoadingSmtp(true);
      setIsLoadingLists(true);
      setIsLoadingTemplates(true);

      try {
        const [smtpResult, listResult, templateResult] = await Promise.all([
          listSmtpConfigs({ isActive: "true", limit: 100 }),
          listContactLists({ limit: 100 }),
          listTemplates({ limit: 100 }),
        ]);

        if (!ignore) {
          setSmtpOptions(smtpResult.items);
          setListOptions(listResult.items);
          setTemplateOptions(templateResult.items);
        }
      } finally {
        if (!ignore) {
          setIsLoadingSmtp(false);
          setIsLoadingLists(false);
          setIsLoadingTemplates(false);
        }
      }
    }

    loadOptions();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadPreviewContacts() {
      setIsLoadingPreview(true);

      try {
        const result = watchedTargetList
          ? await getListMembers(watchedTargetList, {
              page: previewPage,
              limit: 5,
            })
          : await listContacts({
              status: "subscribed",
              page: previewPage,
              limit: 5,
            });

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
  }, [watchedTargetList, previewPage, previewReloadToken]);

  function handleApplyTemplate(event) {
    const templateId = event.target.value;
    const template = templateOptions.find((option) => option.id === templateId);

    if (template) {
      setValue("subject", template.subject);
      setValue("body", template.body);
    }
  }

  async function handleAddContactSubmit(payload) {
    setContactServerError("");

    try {
      const newContact = await createContact(payload);

      if (watchedTargetList) {
        await addContactsToList(watchedTargetList, [newContact.id]);
      }

      toast.success(
        "Contact added",
        `"${payload.name}" is now part of this campaign's audience.`,
      );
      setIsAddContactOpen(false);
      setPreviewReloadToken((currentValue) => currentValue + 1);
    } catch (error) {
      setContactServerError(
        error?.response?.data?.message || "Unable to add this contact.",
      );
    }
  }

  function handleRemoveFromCampaign(contact) {
    setExcludedContacts((current) => {
      if (current.includes(contact.id)) {
        return current;
      }

      return [...current, contact.id];
    });

    toast.success(
      "Contact removed",
      `"${contact.name}" was removed from this campaign.`,
    );
  }

  async function handleEditContactSubmit(payload) {
    setContactServerError("");

    try {
      await updateContact(editingContact.id, payload);
      toast.success(
        "Contact updated",
        `"${payload.name}" was saved successfully.`,
      );
      setEditingContact(null);
      setPreviewReloadToken((currentValue) => currentValue + 1);
    } catch (error) {
      setContactServerError(
        error?.response?.data?.message || "Unable to save this contact.",
      );
    }
  }

  async function goNext() {
    const fieldsByStep = [["name", "subject", "body"], ["smtpConfig"], []];

    const isValid = await trigger(fieldsByStep[currentStep] || []);

    if (isValid) {
      setCurrentStep((current) => Math.min(current + 1, STEPS.length - 1));
    }
  }

  function goBack() {
    setCurrentStep((current) => Math.max(current - 1, 0));
  }

  async function handleFinalSubmit(values) {
    setServerError("");

    try {
      await createCampaign({
        ...values,
        excludedContacts,
      });
      toast.success(
        "Campaign created",
        `"${values.name}" was saved as a draft.`,
      );
      navigate("/campaigns");
    } catch (error) {
      setServerError(
        error?.response?.data?.message || "Unable to create this campaign.",
      );
    }
  }

  const values = getValues();
  const selectedSmtp = smtpOptions.find(
    (option) => option.id === values.smtpConfig,
  );
  const selectedList = listOptions.find(
    (option) => option.id === values.targetList,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="New Campaign"
        subtitle="Build your campaign step by step — details, audience, then review."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Campaigns", to: "/campaigns" },
          { label: "New" },
        ]}
      />

      <Card>
        <CardContent className="border-b border-stone-200 pb-6">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </CardContent>

        <div>
          <CardContent className="space-y-5">
            {serverError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {serverError}
              </div>
            ) : null}

            {currentStep === 0 ? (
              <div className="space-y-5">
                <Input
                  label="Campaign Name"
                  placeholder="July Newsletter"
                  error={errors.name?.message}
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">
                    Start from Template (optional)
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-950 outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-stone-950/5 disabled:cursor-not-allowed disabled:bg-stone-100"
                    disabled={isLoadingTemplates}
                    defaultValue=""
                    onChange={handleApplyTemplate}
                  >
                    <option value="">
                      {isLoadingTemplates
                        ? "Loading..."
                        : "None — write from scratch"}
                    </option>
                    {templateOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Subject"
                  placeholder="Hello {{name}}, check this out!"
                  helperText="Use {{name}} to personalize the subject and body with each recipient's name."
                  error={errors.subject?.message}
                  {...register("subject", { required: "Subject is required" })}
                />

                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  <p className="font-medium">Dynamic variables</p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sky-700">
                    <li>
                      <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-xs">
                        {"{{name}}"}
                      </code>{" "}
                      — recipient&apos;s name. Works in both the subject and the
                      body.
                    </li>
                    <li>
                      <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-xs">
                        {"{{unsubscribe_url}}"}
                      </code>{" "}
                      — place this anywhere in your HTML to control exactly
                      where the unsubscribe link appears. Left out, one is added
                      automatically at the bottom.
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
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">
                    Send From
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-950 outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-stone-950/5 disabled:cursor-not-allowed disabled:bg-stone-100"
                    disabled={isLoadingSmtp}
                    {...register("smtpConfig", {
                      required: "Select an SMTP configuration",
                    })}
                  >
                    <option value="">
                      {isLoadingSmtp
                        ? "Loading..."
                        : "Select an SMTP configuration"}
                    </option>
                    {smtpOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  {errors.smtpConfig ? (
                    <p className="text-sm text-rose-600">
                      {errors.smtpConfig.message}
                    </p>
                  ) : null}
                  {!isLoadingSmtp && smtpOptions.length === 0 ? (
                    <p className="text-sm text-amber-600">
                      No active SMTP configurations available. Add one on the
                      SMTP page first.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">
                    Send To
                  </label>
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
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-700">
                    Audience Preview
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsAddContactOpen(true)}
                  >
                    <Icon name="plus" size={14} className="mr-1" />
                    Add Contact
                  </Button>
                </div>
                {selectedPreviewContact ? (
                  <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                          Recipient Details
                        </p>

                        <h3 className="mt-1 text-xl font-semibold text-stone-950">
                          {selectedPreviewContact.name || "Unnamed Contact"}
                        </h3>

                        <p className="mt-1 text-sm text-stone-500">
                          {selectedPreviewContact.email || "No email address"}
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedPreviewContact(null)}
                      >
                        Back to Recipients
                      </Button>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                          Name
                        </p>
                        <p className="mt-1 text-sm font-medium text-stone-950">
                          {selectedPreviewContact.name || "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                          Email
                        </p>
                        <p className="mt-1 break-all text-sm font-medium text-stone-950">
                          {selectedPreviewContact.email || "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                          Status
                        </p>

                        <div className="mt-2">
                          <Badge
                            variant={
                              statusBadgeVariant[
                                selectedPreviewContact.status
                              ] || "neutral"
                            }
                          >
                            {selectedPreviewContact.status || "subscribed"}
                          </Badge>
                        </div>
                      </div>

                      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                          Contact ID
                        </p>

                        <p className="mt-1 break-all text-sm text-stone-700">
                          {selectedPreviewContact.id || "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                          Added
                        </p>

                        <p className="mt-1 text-sm text-stone-700">
                          {selectedPreviewContact.createdAt
                            ? new Intl.DateTimeFormat("en", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(
                                new Date(selectedPreviewContact.createdAt),
                              )
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
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
                        ? "This list has no contacts yet. Add one above."
                        : "There are no subscribed contacts yet. Add one above."}
                    </p>
                  ) : (
                    <>
                      <Table>
                        <TableHead>
                          <tr>
                            <TableHeaderCell>Name</TableHeaderCell>
                            <TableHeaderCell>Email</TableHeaderCell>
                            <TableHeaderCell>Status</TableHeaderCell>
                            <TableHeaderCell className="text-right">
                              Actions
                            </TableHeaderCell>
                          </tr>
                        </TableHead>
                        <TableBody>
                          {previewContacts
                            .filter(
                              (contact) =>
                                !excludedContacts.includes(contact.id),
                            )
                            .map((contact) => (
                              <TableRow
                                key={contact.id}
                                className="cursor-pointer transition-colors hover:bg-stone-50"
                                onClick={() =>
                                  setSelectedPreviewContact(contact)
                                }
                              >
                                <TableCell className="font-medium text-stone-950">
                                  {contact.name}
                                </TableCell>
                                <TableCell>{contact.email}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      statusBadgeVariant[contact.status] ||
                                      "neutral"
                                    }
                                  >
                                    {contact.status || "subscribed"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setEditingContact(contact);
                                      }}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-150 ease-out hover:border-stone-300 hover:bg-stone-50 hover:text-stone-950"
                                      aria-label={`Edit ${contact.name}`}
                                    >
                                      <Icon name="edit" size={14} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleRemoveFromCampaign(contact);
                                      }}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-500 transition-all duration-150 ease-out hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                      aria-label={`Remove ${contact.name} from campaign`}
                                      title="Remove from campaign"
                                    >
                                      <Icon name="trash" size={14} />
                                    </button>
                                  </div>
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
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-stone-200 p-4">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wider text-stone-400">
                        Name
                      </dt>
                      <dd className="mt-1 text-sm text-stone-950">
                        {values.name || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wider text-stone-400">
                        Subject
                      </dt>
                      <dd className="mt-1 text-sm text-stone-950">
                        {values.subject || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wider text-stone-400">
                        Send From
                      </dt>
                      <dd className="mt-1 text-sm text-stone-950">
                        {selectedSmtp?.name || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wider text-stone-400">
                        Send To
                      </dt>
                      <dd className="mt-1 text-sm text-stone-950">
                        {selectedList?.name || "All Subscribed Contacts"}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                    Body Preview
                  </p>
                  <div
                    className="max-h-64 overflow-y-auto rounded-xl border border-stone-200 p-4 text-sm"
                    dangerouslySetInnerHTML={{ __html: values.body || "" }}
                  />
                </div>
                <p className="text-xs text-stone-400">
                  Creating the campaign saves it as a draft — you can send it
                  now or schedule it for later from the campaigns list.
                </p>
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/campaigns")}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              {currentStep > 0 ? (
                <Button type="button" variant="secondary" onClick={goBack}>
                  Back
                </Button>
              ) : null}
              {currentStep < STEPS.length - 1 ? (
                <Button type="button" onClick={goNext}>
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  loading={isSubmitting}
                  onClick={handleSubmit(handleFinalSubmit)}
                >
                  Create Campaign
                </Button>
              )}
            </div>
          </CardFooter>
        </div>
      </Card>

      <ContactFormModal
        open={isAddContactOpen}
        mode="create"
        initialValues={null}
        serverError={contactServerError}
        onClose={() => setIsAddContactOpen(false)}
        onSubmit={handleAddContactSubmit}
      />

      <ContactFormModal
        open={Boolean(editingContact)}
        mode="edit"
        initialValues={editingContact}
        serverError={contactServerError}
        onClose={() => setEditingContact(null)}
        onSubmit={handleEditContactSubmit}
      />
    </div>
  );
}

export { CampaignWizardPage };
