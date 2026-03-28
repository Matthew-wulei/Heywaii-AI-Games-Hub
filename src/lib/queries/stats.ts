import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@prisma/client";

export async function getPlatformStats() {
  const [gameCount, userCount, agg] = await Promise.all([
    prisma.game.count({ where: { status: ContentStatus.PUBLISHED } }),
    prisma.user.count(),
    prisma.game.aggregate({ _sum: { plays: true } }),
  ]);
  const plays = agg._sum.plays ?? 0;
  const coins = Math.max(1, Math.floor(plays / 200));
  const online = Math.max(1, Math.floor(plays / 8000));
  return {
    todayCoins: coins >= 1000 ? `${(coins / 1000).toFixed(1)}k` : `${coins}`,
    totalUsers:
      userCount >= 1_000_000
        ? `${(userCount / 1_000_000).toFixed(1)}M`
        : userCount >= 1000
          ? `${(userCount / 1000).toFixed(1)}k`
          : String(userCount),
    activeGames: String(gameCount),
    onlineNow: online >= 1000 ? `${(online / 1000).toFixed(1)}k` : String(online),
  };
}
