import { useState } from "react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Icon } from "../../components/ui/Icon.jsx";

function ImportContactsModal({ open, isImporting, result, error, onClose, onImport }) {
  const [fileName, setFileName] = useState("");

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    const csvText = await file.text();
    onImport(csvText);
  }

  return (
    <Modal open={open} title="Import Contacts" onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-5">
        <p className="text-sm leading-6 text-stone-600">
          Upload a CSV file with <code className="rounded bg-stone-100 px-1.5 py-0.5">name</code>{" "}
          and <code className="rounded bg-stone-100 px-1.5 py-0.5">email</code> columns. Rows with
          invalid or duplicate emails are skipped automatically and reported below.
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
            {fileName || "Click to choose a CSV file"}
          </span>
          <span className="text-xs text-stone-400">.csv files only</span>
          <input
            id="contacts-csv-input"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={isImporting}
            onChange={handleFileChange}
          />
        </label>

        {isImporting ? (
          <p className="text-center text-sm text-stone-500">Importing contacts…</p>
        ) : null}

        {result ? (
          <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{result.imported} imported</Badge>
              <Badge variant={result.skipped > 0 ? "warning" : "neutral"}>
                {result.skipped} skipped
              </Badge>
              <span className="text-xs text-stone-400">{result.totalRows} rows total</span>
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

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export { ImportContactsModal };
