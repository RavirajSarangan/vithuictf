"use client";

import { useNotifications } from "@/hooks/use-data";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

export default function ParentNotificationsPage() {
  const { notifications, markRead } = useNotifications();

  return (
    <div className="flex flex-col gap-4">
      {notifications.map((n) => (
        <GlassCard
          key={n.id}
          className={cn("cursor-pointer bg-white", !n.read && "border-icvf-accent/30")}
          onClick={() => markRead(n.id)}
        >
          <div className="flex items-start gap-4">
            <Bell className={cn("size-5 mt-1", !n.read ? "text-icvf-accent" : "text-icvf-text-light")} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{n.title}</h3>
                {!n.read && <Badge className="bg-icvf-accent text-white text-xs">New</Badge>}
              </div>
              <p className="mt-1 text-sm text-icvf-text-light">{n.body}</p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
