const colors = {
  background: "var(--app-bg)",
  surface: "var(--surface)",
  surfaceMuted: "var(--surface-muted)",
  border: "var(--border)",
  borderStrong: "var(--border-strong)",
  text: "var(--text)",
  textMuted: "var(--text-muted)",
  textSoft: "var(--text-soft)",
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
  accent: "var(--accent)",
  accentStrong: "var(--accent-strong)",
  accentSoft: "var(--accent-soft)",
  accentForeground: "var(--accent-foreground)",
};

const typography = {
  heading: "text-stone-950 font-semibold tracking-tight",
  body: "text-sm leading-6 text-stone-600",
  label: "text-sm font-medium text-stone-700",
  subtle: "text-sm text-stone-500",
};

const spacing = {
  pagePadding: "px-4 py-4 sm:px-6 lg:px-8",
  sectionGap: "space-y-6",
  cardPadding: "p-6",
};

const radii = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
};

const shadows = {
  soft: "shadow-[var(--shadow-soft)]",
  lift: "shadow-[var(--shadow-lift)]",
  dialog: "shadow-[var(--shadow-dialog)]",
};

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

const transitions = {
  fast: "transition-all duration-150 ease-out",
  base: "transition-all duration-200 ease-out",
  emphasis: "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
};

const containerWidths = {
  narrow: "max-w-3xl",
  default: "max-w-7xl",
  wide: "max-w-screen-2xl",
};

const buttonVariants = {
  primary:
    "bg-stone-950 text-white shadow-[0_1px_2px_rgba(28,25,23,0.05)] hover:bg-stone-800 hover:shadow-[var(--shadow-lift)] active:bg-stone-900 focus-visible:ring-stone-950/10",
  secondary:
    "bg-white text-stone-950 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 active:bg-stone-100 focus-visible:ring-stone-950/10",
  outline:
    "bg-transparent text-stone-950 border border-stone-200 hover:bg-stone-50 active:bg-stone-100 focus-visible:ring-stone-950/10",
  ghost:
    "bg-transparent text-stone-700 hover:bg-stone-100 active:bg-stone-200 focus-visible:ring-stone-950/10",
  danger:
    "bg-rose-600 text-white shadow-[0_1px_2px_rgba(190,18,60,0.15)] hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-100",
  success:
    "bg-emerald-600 text-white shadow-[0_1px_2px_rgba(4,120,87,0.15)] hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-100",
};

const inputVariants = {
  default:
    "border-stone-200 bg-white text-stone-950 placeholder:text-stone-400 hover:border-stone-300 focus:border-stone-950 focus:ring-stone-950/10",
  error:
    "border-rose-300 bg-white text-stone-950 placeholder:text-stone-400 hover:border-rose-400 focus:border-rose-500 focus:ring-rose-100",
  disabled:
    "border-stone-200 bg-stone-100 text-stone-400 placeholder:text-stone-300 cursor-not-allowed",
};

const badgeVariants = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
  neutral: "bg-stone-100 text-stone-700 border-stone-200",
};

const layout = {
  sidebarWidth: "18rem",
  sidebarCollapsedWidth: "5rem",
  navbarHeight: "4.5rem",
  shellMinHeight: "min-h-screen",
};

export {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  breakpoints,
  transitions,
  containerWidths,
  buttonVariants,
  inputVariants,
  badgeVariants,
  layout,
};
