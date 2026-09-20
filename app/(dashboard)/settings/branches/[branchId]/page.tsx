import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { BranchForm } from "@/components/settings/BranchForm";

interface BranchRow {
  name: string;
  address: string | null;
  radius: number | null;
  lat: number | null;
  lng: number | null;
  max_groups: number | null;
  max_students: number | null;
  ielts_link: string | null;
}

const str = (v: number | string | null | undefined) => (v == null ? "" : String(v));

/** Filialni tahrirlash. */
export default async function EditBranchPage({ params }: { params: Promise<{ branchId: string }> }) {
  const { branchId } = await params;
  const { supabase } = await requirePermission("settings.manage");

  const { data } = await supabase
    .from("branches")
    .select("name, address, radius, lat, lng, max_groups, max_students, ielts_link")
    .eq("id", branchId)
    .maybeSingle();
  const row = data as BranchRow | null;
  if (!row) notFound();

  return (
    <BranchForm
      branchId={branchId}
      initial={{
        name: row.name,
        address: row.address ?? "",
        radius: str(row.radius) || "100",
        lat: str(row.lat),
        lng: str(row.lng),
        maxGroups: str(row.max_groups),
        maxStudents: str(row.max_students),
        ieltsLink: row.ielts_link ?? "",
      }}
    />
  );
}
