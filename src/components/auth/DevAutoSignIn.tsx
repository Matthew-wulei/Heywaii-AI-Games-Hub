"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** When AUTH_DEV_LOGGED_IN=true, signs in once via the dev-mock Credentials provider. */
export function DevAutoSignIn({ enabled }: { enabled: boolean }) {
  const { status } = useSession();
  const router = useRouter();
  const attempted = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (status !== "unauthenticated") return;
    if (attempted.current) return;
    attempted.current = true;

    void (async () => {
      const res = await signIn("dev-mock", { redirect: false });
      if (res?.ok) router.refresh();
      else attempted.current = false;
    })();
  }, [enabled, status, router]);

  return null;
}
