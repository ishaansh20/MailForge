import { Loader } from "../ui/Loader.jsx";

function GlobalLoadingOverlay({ message = "Loading workspace" }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/30 px-4">
      <div className="rounded-2xl border border-stone-200 bg-white px-6 py-5 shadow-[var(--shadow-dialog)]">
        <Loader label={message} />
      </div>
    </div>
  );
}

export { GlobalLoadingOverlay };
