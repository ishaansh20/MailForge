import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "../ui/SearchBar.jsx";
import { Loader } from "../ui/Loader.jsx";
import { globalSearch } from "../../services/searchService.js";
import { cn } from "../../utils/cn.js";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 350;

const CATEGORIES = [
  { key: "contacts", label: "Contacts", to: "/contacts", titleField: "name", subtitleField: "email" },
  { key: "campaigns", label: "Campaigns", to: "/campaigns", titleField: "name", subtitleField: "subject" },
  { key: "templates", label: "Templates", to: "/templates", titleField: "name", subtitleField: "subject" },
  { key: "lists", label: "Lists", to: "/lists", titleField: "name", subtitleField: "description" },
  { key: "smtp", label: "SMTP", to: "/smtp", titleField: "name", subtitleField: "host" },
  { key: "logs", label: "Logs", to: "/logs", titleField: "name", subtitleField: "email" },
];

function GlobalSearch() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const data = await globalSearch(trimmed);
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(to) {
    setIsOpen(false);
    setQuery("");
    setResults(null);
    navigate(to);
  }

  const trimmedQuery = query.trim();
  const showPanel = isOpen && trimmedQuery.length >= MIN_QUERY_LENGTH;
  const totalResults = results
    ? CATEGORIES.reduce((sum, category) => sum + (results[category.key]?.length || 0), 0)
    : 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <SearchBar
        placeholder="Global search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsOpen(true)}
      />

      {showPanel ? (
        <div
          className={cn(
            "absolute left-0 top-[calc(100%+8px)] z-50 max-h-96 w-full min-w-72 overflow-y-auto",
            "rounded-xl border border-stone-200 bg-white p-2 shadow-[var(--shadow-dialog)]",
            "[animation:ems-scale-in_150ms_var(--ease-out)]",
          )}
        >
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader label="Searching" />
            </div>
          ) : totalResults === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-stone-500">
              No results for &quot;{trimmedQuery}&quot;.
            </p>
          ) : (
            <div className="space-y-3">
              {CATEGORIES.map((category) => {
                const items = results?.[category.key] || [];

                if (items.length === 0) {
                  return null;
                }

                return (
                  <div key={category.key}>
                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-stone-400">
                      {category.label}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelect(category.to)}
                          className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors duration-150 ease-out hover:bg-stone-100"
                        >
                          <span className="truncate text-sm font-medium text-stone-950">
                            {item[category.titleField] || "Untitled"}
                          </span>
                          {item[category.subtitleField] ? (
                            <span className="truncate text-xs text-stone-500">
                              {item[category.subtitleField]}
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export { GlobalSearch };
