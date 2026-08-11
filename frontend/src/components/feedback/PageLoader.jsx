import { Loader } from "../ui/Loader.jsx";

function PageLoader({ label = "Loading page" }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow-soft)]">
      <Loader label={label} />
    </div>
  );
}

export { PageLoader };
