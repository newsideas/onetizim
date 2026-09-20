"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { createReferenceItem, updateReferenceItem } from "@/lib/actions/references";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export interface BranchInitial {
  name: string;
  address: string;
  radius: string;
  lat: string;
  lng: string;
  maxGroups: string;
  maxStudents: string;
  ieltsLink: string;
}

const DEFAULT_CENTER = { lat: 41.2995, lng: 69.2401 };
const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";

/** Minimal Leaflet turlari (kutubxona CDN'dan yuklanadi, paket qo'shilmaydi). */
interface LeafletMap {
  on(event: "click", fn: (e: { latlng: { lat: number; lng: number } }) => void): void;
  setView(center: [number, number], zoom?: number): void;
  remove(): void;
}
interface LeafletMarker {
  setLatLng(latlng: [number, number]): void;
  addTo(map: LeafletMap): LeafletMarker;
}
interface LeafletApi {
  map(el: HTMLElement): LeafletMap;
  tileLayer(url: string, options: { attribution: string; maxZoom: number }): { addTo(map: LeafletMap): void };
  marker(latlng: [number, number]): LeafletMarker;
}

function loadLeaflet(): Promise<LeafletApi> {
  const w = window as unknown as { L?: LeafletApi };
  if (w.L) return Promise.resolve(w.L);
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = LEAFLET_CSS;
      document.head.appendChild(css);
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => (w.L ? resolve(w.L) : reject(new Error("Xarita yuklanmadi")));
    script.onerror = () => reject(new Error("Xarita yuklanmadi"));
    document.head.appendChild(script);
  });
}

/** Edu tizimdagi "Filial qo'shish" sahifasi: nom, manzil, radius, xarita, sig'im va IELTS havolasi. */
export function BranchForm({ branchId, initial }: { branchId?: string; initial?: BranchInitial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [mapError, setMapError] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [radius, setRadius] = useState(initial?.radius ?? "100");
  const [lat, setLat] = useState(initial?.lat ?? String(DEFAULT_CENTER.lat));
  const [lng, setLng] = useState(initial?.lng ?? String(DEFAULT_CENTER.lng));
  const [maxGroups, setMaxGroups] = useState(initial?.maxGroups ?? "");
  const [maxStudents, setMaxStudents] = useState(initial?.maxStudents ?? "");
  const [ieltsLink, setIeltsLink] = useState(initial?.ieltsLink ?? "");

  const mapEl = useRef<HTMLDivElement>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const start = useRef({ lat: Number(lat) || DEFAULT_CENTER.lat, lng: Number(lng) || DEFAULT_CENTER.lng });

  useEffect(() => {
    let map: LeafletMap | null = null;
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current) return;
        map = L.map(mapEl.current);
        map.setView([start.current.lat, start.current.lng], 12);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);
        markerRef.current = L.marker([start.current.lat, start.current.lng]).addTo(map);
        map.on("click", (e) => {
          const { lat: la, lng: ln } = e.latlng;
          markerRef.current?.setLatLng([la, ln]);
          setLat(la.toFixed(6));
          setLng(ln.toFixed(6));
        });
      })
      .catch(() => setMapError(true));
    return () => {
      cancelled = true;
      map?.remove();
      markerRef.current = null;
    };
  }, []);

  function save() {
    setError(undefined);
    if (!name.trim()) return setError("Filial nomini kiriting");
    if (!radius.trim()) return setError("Radiusni kiriting");
    const formData = new FormData();
    formData.set("name", name);
    formData.set("address", address);
    formData.set("radius", radius);
    formData.set("lat", lat);
    formData.set("lng", lng);
    formData.set("max_groups", maxGroups);
    formData.set("max_students", maxStudents);
    formData.set("ielts_link", ieltsLink);
    startTransition(async () => {
      const result = branchId
        ? await updateReferenceItem("branches", branchId, formData)
        : await createReferenceItem("branches", formData);
      if (!result.ok) return setError(result.error);
      router.push("/settings/references/branches");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 rounded-xl border border-line bg-surface p-6">
      <div className="flex justify-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-canvas text-ink-muted">
          <Building2 size={36} aria-hidden="true" />
        </span>
      </div>
      <div>
        <Label htmlFor="branch-name">
          Nomi<span className="ml-0.5 text-red-500">*</span>
        </Label>
        <Input id="branch-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nomi" />
      </div>
      <div>
        <Label htmlFor="branch-address">Manzil</Label>
        <Input
          id="branch-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Manzil qidirish"
        />
      </div>
      <div>
        <Label htmlFor="branch-radius">
          Radius<span className="ml-0.5 text-red-500">*</span>
        </Label>
        <Input
          id="branch-radius"
          type="number"
          min={0}
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-muted">Manzil Xarita tanlash</p>
        <div ref={mapEl} className="z-0 h-72 w-full overflow-hidden rounded-lg border border-line bg-canvas" />
        {mapError && (
          <p className="mt-1 text-xs text-amber-700">
            Xarita yuklanmadi (internetni tekshiring). Koordinatalarni qo&apos;lda kiritishingiz mumkin.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="branch-lat">Manzil (Lat)</Label>
          <Input id="branch-lat" value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" />
        </div>
        <div>
          <Label htmlFor="branch-lng">Manzil (Lng)</Label>
          <Input id="branch-lng" value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" />
        </div>
      </div>
      <div>
        <Label htmlFor="branch-max-groups">Filialni maksimal guruhlar sig&apos;imi</Label>
        <Input id="branch-max-groups" type="number" min={0} value={maxGroups} onChange={(e) => setMaxGroups(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="branch-max-students">Filialni maxsimal o&apos;quvchilar sig&apos;imi</Label>
        <Input
          id="branch-max-students"
          type="number"
          min={0}
          value={maxStudents}
          onChange={(e) => setMaxStudents(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="branch-ielts">IELTS registratsiya linki</Label>
        <Input id="branch-ielts" value={ieltsLink} onChange={(e) => setIeltsLink(e.target.value)} />
      </div>

      <FormError message={error} />

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Link
          href="/settings/references/branches"
          className="inline-flex items-center rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
        >
          Orqaga
        </Link>
        <Button type="button" onClick={save} disabled={isPending}>
          {isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </div>
  );
}
