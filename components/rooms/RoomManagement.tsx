"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Drawer } from "@/components/ui/Drawer";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  createEquipment,
  createRoom,
  deleteEquipment,
  deleteRoom,
  setRoomEquipment,
  updateEquipment,
  updateRoom,
} from "@/lib/actions/rooms";
import { formatSom } from "@/lib/utils/currency";

export interface RoomRow {
  id: string;
  name: string;
  capacity: number | null;
  note: string | null;
  responsibleId: string | null;
}

export interface EquipmentRow {
  id: string;
  name: string;
  inventoryCode: string;
  unitPrice: number;
}

export interface StaffOption {
  id: string;
  full_name: string;
}

// ---------------------------------------------------------------- Xona

function RoomForm({
  room,
  staff,
  onDone,
}: {
  room?: RoomRow;
  staff: StaffOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [name, setName] = useState(room?.name ?? "");
  const [capacity, setCapacity] = useState(room?.capacity?.toString() ?? "");
  const [responsibleId, setResponsibleId] = useState(room?.responsibleId ?? "");
  const [note, setNote] = useState(room?.note ?? "");

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    const input = {
      name,
      capacity: capacity.trim() === "" ? null : Number(capacity),
      responsibleId: responsibleId || null,
      note,
    };
    startTransition(async () => {
      const result = room ? await updateRoom(room.id, input) : await createRoom(input);
      if (!result.ok) return setError(result.error);
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div>
        <Label htmlFor="room-name">Xona nomi</Label>
        <Input
          id="room-name"
          placeholder="Xona nomi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
        />
      </div>
      <div>
        <Label htmlFor="room-capacity">O&apos;quvchi sig&apos;imi</Label>
        <Input
          id="room-capacity"
          type="number"
          min={0}
          placeholder="O'quvchi sig'imi"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="room-responsible">Mas&apos;ul shaxs</Label>
        <Select
          id="room-responsible"
          value={responsibleId}
          onChange={(e) => setResponsibleId(e.target.value)}
        >
          <option value="">Tanlang</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="room-note">Izoh</Label>
        <Input
          id="room-note"
          placeholder="Izoh"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
        />
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onDone}>
          Orqaga
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </form>
  );
}

export function NewRoomButton({ staff }: { staff: StaffOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus size={15} aria-hidden="true" />
        Xona qo&apos;shish
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Xona qo'shish">
        <RoomForm staff={staff} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

/** Xonadagi jihozlar: tanlash va soni. */
function RoomEquipmentForm({
  room,
  equipment,
  assigned,
  onDone,
}: {
  room: RoomRow;
  equipment: EquipmentRow[];
  assigned: Record<string, number>;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [quantities, setQuantities] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(assigned).map(([id, q]) => [id, String(q)])),
  );

  function toggle(id: string, on: boolean) {
    setQuantities((prev) => {
      const next = { ...prev };
      if (on) next[id] = next[id] ?? "1";
      else delete next[id];
      return next;
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    const items = Object.entries(quantities).map(([equipmentId, q]) => ({
      equipmentId,
      quantity: Number(q),
    }));
    startTransition(async () => {
      const result = await setRoomEquipment({ roomId: room.id, items });
      if (!result.ok) return setError(result.error);
      router.refresh();
      onDone();
    });
  }

  if (equipment.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Hali jihoz yo&apos;q. Avval{" "}
        <Link href="/education/equipment" className="text-brand-600 hover:underline">
          Jihozlar
        </Link>{" "}
        sahifasida jihoz qo&apos;shing.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line">
        {equipment.map((item) => {
          const checked = item.id in quantities;
          return (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2">
              <input
                type="checkbox"
                id={`eq-${item.id}`}
                checked={checked}
                onChange={(e) => toggle(item.id, e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              <label htmlFor={`eq-${item.id}`} className="min-w-0 flex-1 cursor-pointer">
                <span className="block truncate text-sm text-ink">{item.name}</span>
                <span className="block text-xs text-ink-faint">
                  {item.inventoryCode} · {formatSom(item.unitPrice)}
                </span>
              </label>
              {checked && (
                <input
                  type="number"
                  min={1}
                  aria-label={`${item.name} soni`}
                  value={quantities[item.id]}
                  onChange={(e) => setQuantities((p) => ({ ...p, [item.id]: e.target.value }))}
                  className="w-20 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm"
                />
              )}
            </li>
          );
        })}
      </ul>
      <FormError message={error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Orqaga
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </form>
  );
}

export function RoomRowActions({
  room,
  staff,
  equipment,
  assigned,
}: {
  room: RoomRow;
  staff: StaffOption[];
  equipment: EquipmentRow[];
  /** equipment.id → shu xonadagi soni. */
  assigned: Record<string, number>;
}) {
  const [mode, setMode] = useState<"edit" | "equipment" | null>(null);
  const close = () => setMode(null);

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => setMode("equipment")}
        aria-label="Jihozlar"
        title="Jihozlar"
        className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
      >
        <Package size={15} />
      </button>
      <button
        type="button"
        onClick={() => setMode("edit")}
        aria-label="Tahrirlash"
        title="Tahrirlash"
        className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
      >
        <Pencil size={15} />
      </button>
      <ConfirmActionButton
        action={() => deleteRoom(room.id)}
        confirmText={`"${room.name}" xonasini o'chirmoqchimisiz? Guruh va darslardagi xona ko'rsatkichi bo'shab qoladi.`}
      />

      <Modal open={mode === "edit"} onClose={close} title="Xonani tahrirlash">
        <RoomForm room={room} staff={staff} onDone={close} />
      </Modal>
      <Modal open={mode === "equipment"} onClose={close} title={`${room.name} — jihozlar`}>
        <RoomEquipmentForm room={room} equipment={equipment} assigned={assigned} onDone={close} />
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------- Jihoz

function EquipmentForm({ item, onDone }: { item?: EquipmentRow; onDone: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [name, setName] = useState(item?.name ?? "");
  const [code, setCode] = useState(item?.inventoryCode ?? "");
  const [price, setPrice] = useState(item ? String(item.unitPrice) : "");

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    const input = {
      name,
      inventoryCode: code,
      unitPrice: price.trim() === "" ? 0 : Number(price),
    };
    startTransition(async () => {
      const result = item ? await updateEquipment(item.id, input) : await createEquipment(input);
      if (!result.ok) return setError(result.error);
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="flex h-full flex-col" noValidate>
      <div className="flex-1 space-y-4">
        <div>
          <Label htmlFor="eq-name">Jihoz nomi</Label>
          <Input
            id="eq-name"
            placeholder="Jihoz nomi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </div>
        <div>
          <Label htmlFor="eq-code">Inventar kodi</Label>
          <Input
            id="eq-code"
            placeholder="Bo'sh qoldirilsa avtomatik yaratiladi"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={40}
          />
        </div>
        <div>
          <Label htmlFor="eq-price">Narxi (dona uchun)</Label>
          <Input
            id="eq-price"
            type="number"
            min={0}
            placeholder="Narxi (dona uchun)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <FormError message={error} />
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
          Bekor qilish
        </Button>
        <Button type="submit" className="flex-[2]" disabled={isPending}>
          {isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </form>
  );
}

export function NewEquipmentButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus size={15} aria-hidden="true" />
        Jihoz qo&apos;shish
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Jihoz qo'shish">
        <EquipmentForm onDone={() => setOpen(false)} />
      </Drawer>
    </>
  );
}

export function EquipmentRowActions({ item }: { item: EquipmentRow }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Tahrirlash"
        title="Tahrirlash"
        className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
      >
        <Pencil size={15} />
      </button>
      <ConfirmActionButton
        action={() => deleteEquipment(item.id)}
        confirmText={`"${item.name}" jihozini o'chirmoqchimisiz? U barcha xonalardan ham olib tashlanadi.`}
      />
      <Drawer open={open} onClose={() => setOpen(false)} title="Jihozni tahrirlash">
        <EquipmentForm item={item} onDone={() => setOpen(false)} />
      </Drawer>
    </div>
  );
}
