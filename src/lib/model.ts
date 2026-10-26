import { z } from "zod";
const coordinate = z.number().finite().min(-100000).max(100000);
const dimension = z.number().finite().min(100).max(30000);
export const roomSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  x: coordinate,
  y: coordinate,
  width: dimension,
  depth: dimension,
  notes: z.string().max(2000).default(""),
});
export const openingSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  kind: z.enum(["door", "window"]),
  wall: z.enum(["top", "right", "bottom", "left"]),
  position: z.number().min(0).max(1),
  width: z.number().min(100).max(3000),
});
export const itemSchema = z.object({
  id: z.string(),
  catalogId: z.string(),
  roomId: z.string(),
  name: z.string().min(1).max(100),
  x: coordinate,
  y: coordinate,
  width: z.number().finite().min(100).max(6000),
  depth: z.number().finite().min(100).max(6000),
  rotation: z.union([
    z.literal(0),
    z.literal(90),
    z.literal(180),
    z.literal(270),
  ]),
  color: z.string().regex(/^#[a-fA-F0-9]{6}$/),
});
export const projectSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1).max(100),
    name: z.string().min(1).max(100),
    rooms: z.array(roomSchema).min(1).max(30),
    openings: z.array(openingSchema).max(200),
    furniture: z.array(itemSchema).max(500),
    unit: z.enum(["imperial", "metric"]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    revision: z.number().int().min(0),
  })
  .superRefine((p, ctx) => {
    const rooms = new Set(p.rooms.map((r) => r.id));
    if (
      p.furniture.some((f) => !rooms.has(f.roomId)) ||
      p.openings.some((o) => !rooms.has(o.roomId))
    )
      ctx.addIssue({
        code: "custom",
        message: "An item refers to a room that does not exist.",
      });
    if (
      new Set(p.rooms.map((r) => r.id)).size !== p.rooms.length ||
      new Set(p.furniture.map((f) => f.id)).size !== p.furniture.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Room and furniture IDs must be unique.",
      });
  });
export type Room = z.infer<typeof roomSchema>;
export type Opening = z.infer<typeof openingSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Unit = Project["unit"];
export function parseProject(value: unknown): Project {
  return projectSchema.parse(value);
}
export const uid = () => crypto.randomUUID();
export function copyProject(p: Project, name = `${p.name} copy`): Project {
  const now = new Date().toISOString();
  return {
    ...structuredClone(p),
    id: uid(),
    name: name.slice(0, 100),
    revision: 0,
    createdAt: now,
    updatedAt: now,
  };
}
