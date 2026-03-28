import { Coins, Users, Gamepad2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Today's Coins",
    value: "24.5k",
    trend: "+12.5%",
    icon: Coins,
    trendUp: true,
  },
  {
    label: "Total Users",
    value: "1.2M",
    trend: "+3.2%",
    icon: Users,
    trendUp: true,
  },
  {
    label: "Active Games",
    value: "842",
    trend: "+14",
    icon: Gamepad2,
    trendUp: true,
  },
  {
    label: "Online Now",
    value: "15.4k",
    trend: "-2.1%",
    icon: Activity,
    trendUp: false,
  },
];

export function DataPanel() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="p-5 rounded-2xl bg-background-paper border border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-secondary text-sm font-medium">{stat.label}</h3>
            <div className="p-2 rounded-lg bg-white/5">
              <stat.icon className="w-4 h-4 text-text-muted" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-primary">
              {stat.value}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                stat.trendUp ? "text-status-success" : "text-status-error"
              )}
            >
              {stat.trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}