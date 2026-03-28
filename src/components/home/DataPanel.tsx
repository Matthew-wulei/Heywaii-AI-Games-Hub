import { Coins, Users, Gamepad2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export type PlatformStatValues = {
  todayCoins: string;
  totalUsers: string;
  activeGames: string;
  onlineNow: string;
};

const defaultTrends = ["+12.5%", "+3.2%", "+1", "-2.1%"] as const;
const trendUpFlags = [true, true, true, false] as const;

export function DataPanel({
  values,
}: {
  values?: PlatformStatValues;
}) {
  const v = values ?? {
    todayCoins: "—",
    totalUsers: "—",
    activeGames: "—",
    onlineNow: "—",
  };

  const stats = [
    {
      label: "Today's Coins",
      value: v.todayCoins,
      trend: defaultTrends[0],
      icon: Coins,
      trendUp: trendUpFlags[0],
    },
    {
      label: "Total Users",
      value: v.totalUsers,
      trend: defaultTrends[1],
      icon: Users,
      trendUp: trendUpFlags[1],
    },
    {
      label: "Active Games",
      value: v.activeGames,
      trend: defaultTrends[2],
      icon: Gamepad2,
      trendUp: trendUpFlags[2],
    },
    {
      label: "Online Now",
      value: v.onlineNow,
      trend: defaultTrends[3],
      icon: Activity,
      trendUp: trendUpFlags[3],
    },
  ];

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
