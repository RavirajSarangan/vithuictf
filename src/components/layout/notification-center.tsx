"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/use-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, markRead, unreadCount } = useNotifications({ enabled: open });

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
                onClick={() => markRead(n.id)}
              >
                <div className="flex items-start gap-2">
                  {n.type === "class" ? (
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-icvf-accent" />
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
