import type { Item, Project, Room, Unit } from "./model";
export const MM_PER_INCH = 25.4;
export function formatLength(mm: number, unit: Unit = "imperial") {
  if (unit === "metric") return `${+(mm / 10).toFixed(1)} cm`;
  const inches = Math.round(mm / MM_PER_INCH);
  return `${Math.floor(inches / 12)}′ ${inches % 12}″`;
}
export function formatArea(mm2: number, unit: Unit = "imperial") {
  return unit === "metric"
    ? `${(mm2 / 1e6).toFixed(1)} m²`
    : `${Math.round(mm2 / 92903.04)} sq ft`;
}
export function area(p: Pick<Project, "rooms">) {
  return p.rooms.reduce((a, r) => a + r.width * r.depth, 0);
}
export function parseLength(value: string, unit: Unit): number {
  const s = value.trim();
  let mm: number;
  if (unit === "metric") mm = Number(s) * 10;
  else {
    const match = s.match(
      /^(\d+(?:\.\d+)?)\s*(?:['′]|ft)\s*(\d+(?:\.\d+)?)?\s*(?:["″]|in)?$/,
    );
    if (match && Number(match[2] || 0) >= 12)
      throw Error(
        "The inches part must be less than 12. Or enter total inches.",
      );
    mm = match
      ? (Number(match[1]) * 12 + Number(match[2] || 0)) * 25.4
      : Number(s) * 25.4;
  }
  mm = Number(mm.toFixed(3));
  if (!Number.isFinite(mm) || mm < 100 || mm > 30000)
    throw Error("Enter a size from 10 to 3,000 cm, or 4 to 1,181 inches.");
  return mm;
}
export function inputLength(mm: number, unit: Unit) {
  return unit === "metric"
    ? String(+(mm / 10).toFixed(3))
    : `${Math.floor(mm / 304.8)}' ${+((mm % 304.8) / 25.4).toFixed(3)}"`;
}
export const snap = (n: number, step = 50) => Math.round(n / step) * step;
export function footprint(i: Item) {
  return i.rotation % 180 === 0
    ? { width: i.width, depth: i.depth }
    : { width: i.depth, depth: i.width };
}
export function inRoom(i: Item, r: Room) {
  const b = footprint(i);
  return (
    i.x >= r.x &&
    i.y >= r.y &&
    i.x + b.width <= r.x + r.width + 0.01 &&
    i.y + b.depth <= r.y + r.depth + 0.01
  );
}
export function constrain(i: Item, r: Room): Item {
  const b = footprint(i);
  return {
    ...i,
    x: Math.max(r.x, Math.min(i.x, r.x + r.width - b.width)),
    y: Math.max(r.y, Math.min(i.y, r.y + r.depth - b.depth)),
  };
}
export function overlaps(a: Item, b: Item) {
  const x = footprint(a),
    y = footprint(b);
  return (
    a.x < b.x + y.width &&
    a.x + x.width > b.x &&
    a.y < b.y + y.depth &&
    a.y + x.depth > b.y
  );
}
export function bounds(rooms: Room[]) {
  const x = Math.min(...rooms.map((r) => r.x)),
    y = Math.min(...rooms.map((r) => r.y));
  return {
    x,
    y,
    width: Math.max(...rooms.map((r) => r.x + r.width)) - x,
    depth: Math.max(...rooms.map((r) => r.y + r.depth)) - y,
  };
}
export function pointerToWorld(
  point: { x: number; y: number },
  rect: { left: number; top: number; width: number; height: number },
  view: { x: number; y: number; width: number; height: number },
) {
  const scale = Math.min(rect.width / view.width, rect.height / view.height);
  return {
    x:
      (point.x - rect.left - (rect.width - view.width * scale) / 2) / scale +
      view.x,
    y:
      (point.y - rect.top - (rect.height - view.height * scale) / 2) / scale +
      view.y,
  };
}
