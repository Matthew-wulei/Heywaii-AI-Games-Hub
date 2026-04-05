"use client";

import { useEffect } from "react";

function isDatabaseUnreachable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const msg = error instanceof Error ? error.message : String(error);
  if (/P1001|Can't reach database server|reach database server|connection refused/i.test(msg)) {
    return true;
  }
  const code = (error as { code?: string }).code;
  return code === "P1001";
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string; code?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const dbDown = isDatabaseUnreachable(error);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-white mb-2">
        {dbDown ? "Database unreachable" : "Something went wrong"}
      </h1>
      {dbDown ? (
        <div className="max-w-lg space-y-3 text-text-secondary text-sm leading-relaxed mb-8">
          <p>
            The app cannot connect to MySQL (Prisma <code className="text-pink-400">P1001</code>). Your
            dev machine must reach the host in <code className="text-text-muted">DATABASE_URL</code>.
          </p>
          <ul className="text-left list-disc list-inside space-y-1 text-text-muted">
            <li>Turn on VPN if the RDS is only reachable on a corporate network.</li>
            <li>
              In Alibaba Cloud RDS: add your current public IP to the whitelist / security group.
            </li>
            <li>Confirm <code className="text-text-muted">DATABASE_URL</code> in <code className="text-text-muted">.env</code> is correct.</li>
            <li>For fully offline dev, run local MySQL and point <code className="text-text-muted">DATABASE_URL</code> there.</li>
          </ul>
        </div>
      ) : (
        <p className="text-text-secondary text-sm max-w-md mb-8">{error.message || "An unexpected error occurred."}</p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="px-6 py-2.5 rounded-xl bg-gradient-primary text-white font-medium hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
