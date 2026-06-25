"use client";

import { useNotifications } from "@/hooks/use-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const { notifications, markRead, unreadCount } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger className="relative inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted">
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-icvf-accent text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
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
                className={cn("w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted", !n.read && "bg-icvf-accent/5")}
                onClick={() => markRead(n.id)}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
