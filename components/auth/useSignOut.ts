"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useSignOut(redirectTo = "/login") {
  const router = useRouter();

  return useCallback(async () => {
    await createClient().auth.signOut();
    router.push(redirectTo);
    router.refresh();
  }, [router, redirectTo]);
}
