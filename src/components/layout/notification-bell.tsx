"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/notifications", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && typeof d.count === "number") setCount(d.count);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <button
      type="button"
      className="relative p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-white/5"
      aria-label={count > 0 ? `${count} notifications` : "Notifications"}
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-[8px] h-2 px-0.5 bg-status-error rounded-full ring-2 ring-background-paper" />
      )}
    </button>
  );
}
