import { useEffect, useState } from "react";
import { Badge } from "../ui/Badge.jsx";
import { Button } from "../ui/Button.jsx";
import { Dropdown, DropdownItem } from "../ui/Dropdown.jsx";
import { Icon } from "../ui/Icon.jsx";
import { Loader } from "../ui/Loader.jsx";
import { useToast } from "../../hooks/useToast.js";
import {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/notificationService.js";

const POLL_INTERVAL_MS = 60 * 1000;

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function NotificationBell() {
  const toast = useToast();

  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  async function refreshUnreadCount() {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // Silently ignore — the badge just won't update this cycle.
    }
  }

  useEffect(() => {
    refreshUnreadCount();
    const intervalId = window.setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  async function handleOpenChange(open) {
    if (!open) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await listNotifications({ limit: 20 });
      setItems(result.items);
      setHasLoadedOnce(true);
    } catch {
      toast.error("Unable to load notifications", "Something went wrong while fetching notifications.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkRead(notification) {
    if (notification.isRead) {
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
    );

    try {
      await markNotificationRead(notification.id);
      refreshUnreadCount();
    } catch {
      toast.error("Unable to update notification", "Something went wrong while marking this as read.");
    }
  }

  async function handleMarkAllRead() {
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));

    try {
      await markAllNotificationsRead();
      refreshUnreadCount();
    } catch {
      toast.error("Unable to update notifications", "Something went wrong while marking all as read.");
    }
  }

  return (
    <Dropdown
      onOpenChange={handleOpenChange}
      triggerAriaLabel="Notifications"
      menuClassName="w-80 p-0"
      trigger={
        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 transition-colors duration-150 ease-out hover:bg-stone-100 hover:text-stone-950">
          <Icon name="bell" size={18} />
          {unreadCount > 0 ? (
            <Badge
              variant="danger"
              className="absolute -right-1 -top-1 min-w-4 justify-center px-1 py-0 text-[10px] leading-4"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          ) : null}
        </span>
      }
    >
      <div className="flex items-center justify-between border-b border-stone-200 px-3 py-2.5">
        <p className="text-sm font-semibold text-stone-950">Notifications</p>
        {items.some((item) => !item.isRead) ? (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        ) : null}
      </div>

      <div className="max-h-96 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader label="Loading notifications" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-stone-500">
            {hasLoadedOnce ? "No notifications yet." : "Loading notifications..."}
          </p>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <DropdownItem key={item.id} onClick={() => handleMarkRead(item)}>
                <div className="flex w-full items-start gap-2">
                  {!item.isRead ? (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  ) : (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-950">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{item.message}</p>
                    <p className="mt-1 text-[11px] text-stone-400">{formatDateTime(item.createdAt)}</p>
                  </div>
                </div>
              </DropdownItem>
            ))}
          </div>
        )}
      </div>
    </Dropdown>
  );
}

export { NotificationBell };
