"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ROLE_LABELS, type Permission, type Role } from "@/lib/auth/permissions";

interface PermissionsContextValue {
  role: Role;
  roleLabel: string;
  displayName: string;
  permissions: readonly Permission[];
  can: (permission: Permission) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

/**
 * Rol va ruxsatlarni client komponentlarga uzatadi — faqat UI'ni
 * (tugma, menyu bandi) yashirish uchun. Himoya serverda va RLS'da.
 */
export function PermissionsProvider({
  role,
  displayName,
  permissions,
  children,
}: {
  role: Role;
  displayName: string;
  permissions: readonly Permission[];
  children: ReactNode;
}) {
  const value = useMemo<PermissionsContextValue>(() => {
    const set = new Set(permissions);
    return {
      role,
      roleLabel: ROLE_LABELS[role],
      displayName,
      permissions,
      can: (permission) => set.has(permission),
    };
  }, [role, displayName, permissions]);

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions faqat PermissionsProvider ichida ishlatiladi");
  return ctx;
}

export function Can({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { can } = usePermissions();
  return can(permission) ? <>{children}</> : null;
}
