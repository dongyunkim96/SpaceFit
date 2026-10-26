export type Shape =
  | "sofa"
  | "bed"
  | "chair"
  | "table"
  | "round"
  | "storage"
  | "plant"
  | "rug"
  | "desk"
  | "lamp"
  | "sectional";
export type Category =
  | "Living room"
  | "Bedroom"
  | "Office"
  | "Dining & kitchen"
  | "Finishing touches";
export interface CatalogItem {
  id: string;
  name: string;
  category: Category;
  width: number;
  depth: number;
  height: number;
  shape: Shape;
  color: string;
  layer: "floor" | "solid" | "decor";
  min: number;
  max: number;
}
const group = (
  category: Category,
  rows: [string, number, number, Shape, string?][],
): CatalogItem[] =>
  rows.map(([name, width, depth, shape, color]) => ({
    id: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"),
    name,
    category,
    width,
    depth,
    height: shape === "rug" ? 10 : shape === "bed" ? 600 : 750,
    shape,
    color:
      color ||
      {
        sofa: "#a3ad96",
        bed: "#e3dace",
        chair: "#c3a281",
        table: "#c5a17c",
        round: "#c5a17c",
        storage: "#ae9174",
        plant: "#78906b",
        rug: "#e3d8c6",
        desk: "#c8b59c",
        lamp: "#c8b59c",
        sectional: "#a3ad96",
      }[shape],
    layer:
      shape === "rug"
        ? "floor"
        : shape === "plant" || shape === "lamp"
          ? "decor"
          : "solid",
    min: 100,
    max: 6000,
  }));
export const catalog: CatalogItem[] = [
  ...group("Living room", [
    ["Compact sofa", 1600, 850, "sofa"],
    ["Standard sofa", 2100, 900, "sofa"],
    ["Three-seat sofa", 2400, 950, "sofa"],
    ["Sectional footprint", 2700, 1800, "sectional"],
    ["Armchair", 800, 850, "chair"],
    ["Coffee table", 1200, 600, "table"],
    ["Side table", 500, 500, "round"],
    ["TV console", 1800, 400, "storage"],
    ["Bookshelf", 900, 350, "storage"],
    ["Floor lamp", 350, 350, "lamp"],
    ["Rug", 2400, 1700, "rug"],
  ]),
  ...group("Bedroom", [
    ["Twin bed", 1050, 2050, "bed"],
    ["Full bed", 1450, 2050, "bed"],
    ["Queen bed", 1650, 2150, "bed"],
    ["King bed", 2000, 2150, "bed"],
    ["Nightstand", 500, 400, "storage"],
    ["Dresser", 1400, 500, "storage"],
    ["Wardrobe", 1800, 600, "storage"],
    ["Vanity", 1000, 450, "desk"],
    ["Bench", 1200, 400, "table"],
  ]),
  ...group("Office", [
    ["Compact desk", 1000, 500, "desk"],
    ["Standard desk", 1400, 700, "desk"],
    ["Standing desk", 1500, 750, "desk"],
    ["L-shaped desk footprint", 1800, 1500, "sectional"],
    ["Office chair", 600, 600, "chair"],
    ["Filing cabinet", 450, 600, "storage"],
    ["Desk shelf", 800, 300, "storage"],
  ]),
  ...group("Dining & kitchen", [
    ["Two-seat dining table", 800, 700, "table"],
    ["Four-seat dining table", 1400, 800, "table"],
    ["Six-seat dining table", 1800, 900, "table"],
    ["Round dining table", 1100, 1100, "round"],
    ["Dining chair", 450, 500, "chair"],
    ["Bar stool", 400, 400, "round"],
    ["Kitchen island", 1800, 900, "storage"],
    ["Refrigerator", 750, 750, "storage"],
  ]),
  ...group("Finishing touches", [
    ["Entry bench", 1000, 400, "table"],
    ["Shoe cabinet", 900, 350, "storage"],
    ["Storage cabinet", 1200, 450, "storage"],
    ["Plant", 500, 500, "plant"],
    ["Ottoman", 700, 600, "chair"],
    ["Console table", 1200, 350, "table"],
  ]),
];
export const getCatalog = (id: string) =>
  catalog.find((c) => c.id === id) || catalog[0];
export const categories = [...new Set(catalog.map((c) => c.category))];
