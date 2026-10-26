import { uid, type Item, type Project, type Room } from "../lib/model";
import { getCatalog } from "./catalog";
export interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  rooms: Room[];
  items: Item[];
  tone: string;
}
const room = (
  name: string,
  width: number,
  depth: number,
  x = 0,
  y = 0,
): Room => ({
  id: name.toLowerCase().replaceAll(" ", "-"),
  name,
  x,
  y,
  width,
  depth,
  notes: "",
});
export function furniture(
  catalogId: string,
  roomId: string,
  x: number,
  y: number,
  rotation: Item["rotation"] = 0,
): Item {
  const c = getCatalog(catalogId);
  return {
    id: uid(),
    catalogId,
    roomId,
    name: c.name,
    x,
    y,
    width: c.width,
    depth: c.depth,
    rotation,
    color: c.color,
  };
}
const bedroom = (r: Room) => [
  furniture("queen-bed", r.id, r.x + 650, r.y + 150),
  furniture("nightstand", r.id, r.x + 100, r.y + 180),
  furniture("dresser", r.id, r.x + 500, r.y + r.depth - 550),
];
const office = (r: Room) => [
  furniture("standard-desk", r.id, r.x + 500, r.y + 100),
  furniture("office-chair", r.id, r.x + 900, r.y + 850),
  furniture("bookshelf", r.id, r.x + 100, r.y + r.depth - 400),
  furniture("plant", r.id, r.x + r.width - 600, r.y + 100),
];
export const livingRoom = room("Living room", 6000, 4800);
export const demoItems = [
  furniture("rug", livingRoom.id, 1750, 1350),
  furniture("three-seat-sofa", livingRoom.id, 1750, 300),
  furniture("coffee-table", livingRoom.id, 2350, 1750),
  furniture("armchair", livingRoom.id, 4350, 1650, 270),
  furniture("tv-console", livingRoom.id, 2000, 4000),
  furniture("plant", livingRoom.id, 700, 500),
  furniture("side-table", livingRoom.id, 1000, 1900),
  furniture("floor-lamp", livingRoom.id, 4800, 650),
  furniture("bookshelf", livingRoom.id, 400, 3300),
];
const compact = room("Bedroom", 3000, 3500),
  standard = room("Bedroom", 3600, 4200),
  work = room("Office", 2700, 3300),
  living = room("Living room", 4500, 5000),
  dining = room("Dining room", 3300, 4000);
const studio = [
  room("Living & sleeping", 5000, 5000),
  room("Kitchen", 2500, 2500, 5000),
  room("Bathroom", 2500, 1500, 5000, 2500),
];
const one = [
  room("Living room", 5000, 5000),
  room("Bedroom", 4000, 4000, 5000),
  room("Kitchen", 5000, 2000, 0, 5000),
  room("Bathroom", 2000, 2000, 5000, 4000),
];
const two = [
  room("Living room", 6000, 5000),
  room("Bedroom", 4000, 4000, 6000),
  room("Bedroom 2", 3500, 4000, 6000, 4000),
  room("Kitchen & dining", 6000, 2000, 0, 5000),
  room("Bathroom", 2000, 1500, 0, 7000),
];
const scene = (r: Room) => [
  furniture("standard-sofa", r.id, r.x + 300, r.y + 150),
  furniture("coffee-table", r.id, r.x + 750, r.y + 1400),
  furniture("rug", r.id, r.x + 300, r.y + 1200),
  furniture("plant", r.id, r.x + r.width - 600, r.y + 150),
  furniture("tv-console", r.id, r.x + 450, r.y + r.depth - 500),
];
export const templates: Template[] = [
  {
    id: "compact-bedroom",
    name: "The quiet corner",
    type: "Bedroom",
    description: "A compact bedroom, thoughtfully balanced.",
    rooms: [compact],
    items: bedroom(compact),
    tone: "sand",
  },
  {
    id: "standard-bedroom",
    name: "Room to unwind",
    type: "Bedroom",
    description: "A little more space for your everyday rituals.",
    rooms: [standard],
    items: bedroom(standard),
    tone: "sage",
  },
  {
    id: "home-office",
    name: "The focused space",
    type: "Home office",
    description: "A fresh perspective on working from home.",
    rooms: [work],
    items: office(work),
    tone: "clay",
  },
  {
    id: "living-room",
    name: "The gathering room",
    type: "Living room",
    description: "Good company starts with a comfortable layout.",
    rooms: [living],
    items: scene(living),
    tone: "sage",
  },
  {
    id: "dining-room",
    name: "A seat at the table",
    type: "Dining room",
    description: "For slow breakfasts and long conversations.",
    rooms: [dining],
    items: [
      furniture("four-seat-dining-table", dining.id, 900, 1400),
      furniture("dining-chair", dining.id, 1000, 800),
      furniture("dining-chair", dining.id, 1700, 800),
      furniture("dining-chair", dining.id, 1000, 2300),
      furniture("dining-chair", dining.id, 1700, 2300),
    ],
    tone: "sand",
  },
  {
    id: "studio",
    name: "Small space, big possibility",
    type: "Studio apartment",
    description: "One open space. Plenty of ways to make it yours.",
    rooms: studio,
    items: [
      ...scene(studio[0]),
      furniture("compact-desk", studio[1].id, 5400, 200),
    ],
    tone: "clay",
  },
  {
    id: "one-bedroom",
    name: "The everyday retreat",
    type: "One-bedroom apartment",
    description: "Separate spaces for a more considered day.",
    rooms: one,
    items: [...scene(one[0]), ...bedroom(one[1])],
    tone: "sand",
  },
  {
    id: "two-bedroom",
    name: "Space for what’s next",
    type: "Two-bedroom apartment",
    description: "A flexible home for life as it unfolds.",
    rooms: two,
    items: [...scene(two[0]), ...bedroom(two[1]), ...office(two[2])],
    tone: "sage",
  },
];
export function createProject(template?: Template, furnished = true): Project {
  const now = new Date().toISOString();
  const rooms = structuredClone(
    template?.rooms || [room("Living room", 4500, 5000)],
  );
  return {
    schemaVersion: 1,
    id: uid(),
    name: template?.name || "My new space",
    rooms,
    openings: rooms.flatMap((r) => [
      {
        id: uid(),
        roomId: r.id,
        kind: "door" as const,
        wall: "bottom" as const,
        position: 0.82,
        width: Math.min(800, r.width * 0.25),
      },
      {
        id: uid(),
        roomId: r.id,
        kind: "window" as const,
        wall: "top" as const,
        position: 0.5,
        width: Math.min(1600, r.width * 0.4),
      },
    ]),
    furniture:
      furnished && template
        ? structuredClone(template.items).map((i) => ({ ...i, id: uid() }))
        : [],
    unit: "imperial",
    createdAt: now,
    updatedAt: now,
    revision: 0,
  };
}
export function createDemo(): Project {
  return {
    ...createProject(),
    name: "A little room to breathe",
    rooms: [structuredClone(livingRoom)],
    openings: [
      {
        id: "demo-window",
        roomId: livingRoom.id,
        kind: "window",
        wall: "top",
        position: 0.5,
        width: 2200,
      },
      {
        id: "demo-door",
        roomId: livingRoom.id,
        kind: "door",
        wall: "bottom",
        position: 0.85,
        width: 850,
      },
    ],
    furniture: structuredClone(demoItems).map((i) => ({ ...i, id: uid() })),
  };
}
