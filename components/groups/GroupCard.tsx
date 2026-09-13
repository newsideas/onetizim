// TODO: 5-bosqich to'liq amalga oshiriladi.
import type { Group } from "@/types/database";

export function GroupCard({ group }: { group: Group }) {
  return <div>{group.name}</div>;
}
