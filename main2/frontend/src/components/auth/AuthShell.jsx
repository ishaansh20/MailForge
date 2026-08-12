function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10 text-stone-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center">
        <div className="w-full max-w-[420px]">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-[var(--accent)] text-sm font-semibold tracking-tight text-white shadow-[0_1px_2px_rgba(234,88,12,0.2)]">
              MF
            </div>
          </div>

          <div className="mb-6 text-center">
            <p className="text-sm font-medium text-stone-500">Nuform Social Workspace</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-stone-500">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-[0_10px_40px_rgba(28,25,23,0.06)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export { AuthShell };