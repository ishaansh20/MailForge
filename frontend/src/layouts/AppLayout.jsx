import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { Avatar } from "../components/ui/Avatar.jsx";
import { Breadcrumbs } from "../components/ui/Breadcrumbs.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Dropdown, DropdownItem } from "../components/ui/Dropdown.jsx";
import { Icon } from "../components/ui/Icon.jsx";
import { SidebarItem } from "../components/ui/SidebarItem.jsx";
import { Drawer } from "../components/ui/Drawer.jsx";
import { NotificationBell } from "../components/layout/NotificationBell.jsx";
import { GlobalSearch } from "../components/layout/GlobalSearch.jsx";
import { ToastViewport } from "../components/feedback/ToastViewport.jsx";
import { cn } from "../utils/cn.js";

const navigationGroups = [
  {
    label: "Main",
    items: [{ label: "Dashboard", to: "/dashboard", icon: "dashboard" }],
  },
  {
    label: "Messaging",
    items: [
      { label: "Campaigns", to: "/campaigns", icon: "campaigns" },
      { label: "Templates", to: "/templates", icon: "templates" },
      { label: "Lists", to: "/lists", icon: "lists" },
      { label: "Contacts", to: "/contacts", icon: "contacts" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", to: "/analytics", icon: "analytics" },
      { label: "Logs", to: "/logs", icon: "logs" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "SMTP", to: "/smtp", icon: "smtp" },
      { label: "Settings", to: "/settings", icon: "settings" },
    ],
  },
];

function AppLayout() {
  const { user, logout } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const breadcrumbItems = useMemo(() => {
    if (location.pathname.startsWith("/dashboard")) {
      return [{ label: "Dashboard", to: "/dashboard" }];
    }

    if (location.pathname.startsWith("/smtp")) {
      return [
        { label: "Dashboard", to: "/dashboard" },
        { label: "SMTP", to: "/smtp" },
      ];
    }

    if (location.pathname.startsWith("/contacts")) {
      return [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Contacts", to: "/contacts" },
      ];
    }

    if (location.pathname.startsWith("/lists")) {
      return [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Lists", to: "/lists" },
      ];
    }

    if (location.pathname.startsWith("/templates")) {
      return [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Templates", to: "/templates" },
      ];
    }

    if (location.pathname.startsWith("/campaigns")) {
      return [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Campaigns", to: "/campaigns" },
      ];
    }

    if (location.pathname.startsWith("/logs")) {
      return [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Logs", to: "/logs" },
      ];
    }

    if (location.pathname.startsWith("/analytics")) {
      return [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Analytics", to: "/analytics" },
      ];
    }

    if (location.pathname.startsWith("/settings")) {
      return [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Settings", to: "/settings" },
      ];
    }

    return [];
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function handleComingSoon(label) {
    info(label, "This module is not available yet.");
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-18 items-center justify-between border-b border-stone-200 px-4">
        {!isSidebarCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-[var(--accent)] text-sm font-semibold text-white">
              MF
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-950">Nuform Social Workspace</p>
            </div>
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-[var(--accent)] text-sm font-semibold text-white">
            MF
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="hidden text-stone-500 lg:inline-flex"
          onClick={() => setIsSidebarCollapsed((currentValue) => !currentValue)}
          aria-label="Toggle sidebar"
        >
          <Icon
            name={isSidebarCollapsed ? "chevronRight" : "chevronLeft"}
            size={16}
          />
        </Button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {navigationGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!isSidebarCollapsed ? (
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => (
              <SidebarItem
                key={item.label}
                to={item.to}
                label={item.label}
                icon={item.icon}
                disabled={item.disabled}
                comingSoon={item.comingSoon}
                collapsed={isSidebarCollapsed}
                onClick={
                  item.disabled
                    ? () => handleComingSoon(item.label)
                    : () => setIsMobileSidebarOpen(false)
                }
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-stone-200 p-4">
        <Card className="border-stone-200 bg-stone-50 shadow-none">
          <div
            className={cn(
              "flex items-center gap-3",
              isSidebarCollapsed ? "justify-center" : "",
            )}
          >
            <Avatar name={user?.name || "User"} size="md" />
            {!isSidebarCollapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-950">
                  {user?.name || "Account"}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {user?.email || "Signed in"}
                </p>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-stone-950">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen border-r border-stone-200 bg-white lg:block",
            "transition-[width] duration-200 ease-out",
            isSidebarCollapsed ? "w-20" : "w-72",
          )}
        >
          {sidebarContent}
        </aside>

        <Drawer
          open={isMobileSidebarOpen}
          title="Navigation"
          onClose={() => setIsMobileSidebarOpen(false)}
          width="w-[18rem]"
        >
          <div className="h-full">{sidebarContent}</div>
        </Drawer>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
            <div className="flex h-[4.5rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <Icon name="menu" size={18} />
              </Button>

              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="hidden min-w-0 items-center gap-3 md:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-[var(--accent)] text-xs font-semibold text-white">
                    MF
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-950">
                      Nuform Social Workspace
                    </p>
                  </div>
                </div>

                <div className="hidden max-w-md flex-1 lg:block">
                  <GlobalSearch />
                </div>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <Breadcrumbs items={breadcrumbItems} />
              </div>

              <NotificationBell />

              <Dropdown
                trigger={
                  <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-2 py-1.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
                    <Avatar name={user?.name || "User"} size="sm" />
                    <div className="hidden text-left sm:block">
                      <p className="text-sm font-medium text-stone-950">
                        {user?.name || "Account"}
                      </p>
                    </div>
                    <Icon
                      name="chevronDown"
                      size={16}
                      className="text-stone-400"
                    />
                  </div>
                }
              >
                <div className="space-y-1">
                  <div className="border-b border-stone-200 px-3 py-2">
                    <p className="text-sm font-semibold text-stone-950">
                      {user?.name || "Account"}
                    </p>
                    <p className="text-xs text-stone-500">
                      {user?.email || ""}
                    </p>
                  </div>
                  <DropdownItem onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </DropdownItem>
                  <DropdownItem disabled>Profile</DropdownItem>
                  <DropdownItem danger onClick={handleLogout}>
                    Logout
                  </DropdownItem>
                </div>
              </Dropdown>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1600px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <ToastViewport />
    </div>
  );
}

export { AppLayout };
