"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useSignOut } from "@/components/auth/useSignOut";

export function ExpiredActions() {
  const router = useRouter();
  const signOut = useSignOut();

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={() => router.refresh()}>
        Qayta tekshirish
      </Button>
      <Button type="button" variant="secondary" onClick={() => void signOut()}>
        Chiqish
      </Button>
    </div>
  );
}
