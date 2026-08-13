import { useState } from "react";
import * as XLSX from "xlsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Icon } from "../../components/ui/Icon.jsx";

function ImportContactsModal({
  open,
  isImporting,
  result,
  error,
  onClose,
  onImport,
}) {
  const [fileName, setFileName] = useState("");
  const [contacts, setContacts] = useState([]);
  const [isParsing, setIsParsing] = useState(false);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setIsParsing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();

      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
      });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      if (!rows.length) {
        setContacts([]);
        return;
      }

      const firstRow = rows[0].map((value) =>
        String(value).trim().toLowerCase(),
      );

      const hasHeaders =
        firstRow.includes("name") && firstRow.includes("email");

      let dataRows;

      if (hasHeaders) {
        const nameIndex = firstRow.indexOf("name");
        const emailIndex = firstRow.indexOf("email");

        dataRows = rows.slice(1).map((row) => ({
          name: String(row[nameIndex] || "").trim(),
          email: String(row[emailIndex] || "").trim(),
        }));
      } else {
        dataRows = rows.map((row) => ({
          name: String(row[0] || "").trim(),
          email: String(row[1] || "").trim(),
        }));
      }

      const validRows = dataRows.filter((row) => row.name || row.email);

      setContacts(
        validRows.map((row, index) => ({
          id: `${Date.now()}-${index}`,
          name: row.name,
          email: row.email,
        })),
      );
    } catch (err) {
      console.error("Failed to read contacts file:", err);
    } finally {
      setIsParsing(false);
    }
  }

  function removeContact(id) {
    setContacts((current) => current.filter((contact) => contact.id !== id));
  }

  function handleImport() {
    if (!contacts.length) {
      return;
    }

    const csvRows = [
      ["name", "email"],
      ...contacts.map((contact) => [contact.name, contact.email]),
    ];

    const csvText = csvRows
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    onImport(csvText);
  }

  return (
    <Modal
      open={open}
      title="Import Contacts"
      onClose={onClose}
      maxWidth="max-w-6xl"
    >
      <div className="space-y-5">
        <p className="text-sm leading-6 text-stone-600">
          Upload a CSV or Excel file with{" "}
          <code className="rounded bg-stone-100 px-1.5 py-0.5">name</code> and{" "}
          <code className="rounded bg-stone-100 px-1.5 py-0.5">email</code>{" "}
          <p className="text-sm leading-6 text-stone-600">
            Upload a CSV or Excel file containing contact names and email
            addresses. You can review, edit, add, or remove contacts before
            importing them.
          </p>
        </p>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <label
          htmlFor="contacts-csv-input"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-8 text-center transition hover:border-stone-400"
        >
          <Icon name="upload" size={22} className="text-stone-400" />
          <span className="text-sm font-medium text-stone-700">
            {fileName || "Click to choose a CSV or Excel file"}
          </span>
          <span className="text-xs text-stone-400">
            CSV or Excel files (.csv, .xlsx, .xls)
          </span>
          <input
            id="contacts-csv-input"
            type="file"
            accept=".csv,text/csv,.xlsx,.xls"
            className="hidden"
            disabled={isImporting}
            onChange={handleFileChange}
          />
        </label>

        {isImporting ? (
          <p className="text-center text-sm text-stone-500">
            Importing contacts…
          </p>
        ) : null}

        {contacts.length > 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  Contacts
                </h3>

                <p className="text-sm text-stone-500">
                  {contacts.length} contacts ready to import
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setContacts((current) => [
                    ...current,
                    {
                      id: `${Date.now()}-${Math.random()}`,
                      name: "",
                      email: "",
                    },
                  ])
                }
              >
                + Add Contact
              </Button>
            </div>

            <div className="max-h-[450px] overflow-auto">
              <table className="min-w-full">
                <thead className="sticky top-0 bg-stone-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-stone-500">
                      Name
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-stone-500">
                      Email
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-stone-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-stone-50">
                      <td className="px-5 py-3">
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(event) => {
                            const value = event.target.value;

                            setContacts((current) =>
                              current.map((item) =>
                                item.id === contact.id
                                  ? { ...item, name: value }
                                  : item,
                              ),
                            );
                          }}
                          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
                        />
                      </td>

                      <td className="px-5 py-3">
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(event) => {
                            const value = event.target.value;

                            setContacts((current) =>
                              current.map((item) =>
                                item.id === contact.id
                                  ? { ...item, email: value }
                                  : item,
                              ),
                            );
                          }}
                          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
                        />
                      </td>

                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeContact(contact.id)}
                          className="text-sm font-medium text-rose-600 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {result ? (
          <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{result.imported} imported</Badge>
              <Badge variant={result.skipped > 0 ? "warning" : "neutral"}>
                {result.skipped} skipped
              </Badge>
              <span className="text-xs text-stone-400">
                {result.totalRows} rows total
              </span>
            </div>

            {result.errors.length > 0 ? (
              <div className="max-h-40 space-y-1 overflow-y-auto text-xs text-stone-500">
                {result.errors.map((entry, index) => (
                  <div key={index}>
                    {entry.row ? `Row ${entry.row}: ` : ""}
                    {entry.reason}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-stone-200 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button
            type="button"
            disabled={isImporting || isParsing || contacts.length === 0}
            onClick={handleImport}
          >
            {isImporting
              ? "Importing..."
              : `Import Contacts (${contacts.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export { ImportContactsModal };
