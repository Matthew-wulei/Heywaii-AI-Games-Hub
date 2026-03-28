import { Coins, Users, Gamepad2, Activity } from "lucide-react";

export type PlatformStatValues = {
  todayCoins: string;
  totalUsers: string;
  activeGames: string;
  onlineNow: string;
};

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
      icon: Coins,
    },
    {
      label: "Total Users",
      value: v.totalUsers,
      icon: Users,
    },
    {
      label: "Active Games",
      value: v.activeGames,
      icon: Gamepad2,
    },
    {
      label: "Online Now",
      value: v.onlineNow,
      icon: Activity,
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
            <span className="text-2xl font-bold text-text-primary">{stat.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
