"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/use-data";
import { useAuth } from "@/providers/auth-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart3, Bell, CalendarDays, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

function notificationHref(notification: Notification, isStaff: boolean): string | null {
  const metadata = notification.metadata as { kind?: string; announcementId?: string } | null;
  switch (metadata?.kind) {
    case "announcement_new":
    case "announcement_reply":
      if (!metadata.announcementId) return null;
      return isStaff
        ? `/academics/announcements/${metadata.announcementId}`
        : `/announcements/${metadata.announcementId}`;
    case "exam_scheduled":
    case "exam_results_published":
    case "report_card_published":
      return isStaff ? null : "/results";
    case "assignment_new":
    case "assignment_graded":
      return isStaff ? null : "/assignments";
    default:
      return null;
  }
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, markRead, unreadCount } = useNotifications({ enabled: open });

  const isStaff =
    user?.role === "teacher" || user?.role === "admin" || user?.role === "super_admin";

  function handleClick(notification: Notification) {
    void markRead(notification.id);
    const href = notificationHref(notification, isStaff);
    if (href) {
      setOpen(false);
      router.push(href);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted">
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-icvf-accent text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-4 py-3">
          <p className="font-semibold">Notifications</p>
        </div>
        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No notifications</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                className={cn(
                  "w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted",
                  !n.read && "bg-icvf-accent/5"
                )}
                onClick={() => handleClick(n)}
              >
                <div className="flex items-start gap-2">
                  {n.type === "class" ? (
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-icvf-accent" />
                  ) : n.type === "announcement" ? (
                    <Megaphone className="mt-0.5 size-4 shrink-0 text-icvf-accent" />
                  ) : n.type === "result" ? (
                    <BarChart3 className="mt-0.5 size-4 shrink-0 text-icvf-accent" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
