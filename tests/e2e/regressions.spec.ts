import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createDemo } from "../../src/data/templates";
test("new room unit switch preserves sizes and immediate navigation saves edits", async ({
  page,
}) => {
  await page.goto("/new");
  await page.getByLabel("Name your space").fill("Metric room");
  await page.getByLabel("Width", { exact: true }).fill(`12' 6"`);
  await page.getByLabel("Depth", { exact: true }).fill(`10' 0"`);
  await page.getByLabel("Display measurements in").selectOption("metric");
  await expect(page.getByLabel("Width", { exact: true })).toHaveValue("381");
  await page.getByRole("button", { name: "Let’s start planning" }).click();
  await expect(page).toHaveURL(/\/planner\//);
  await page.getByRole("button", { name: "Add Plant", exact: true }).click();
  await page.getByRole("link", { name: "Back to my spaces" }).click();
  await page.getByRole("link", { name: "Metric room", exact: true }).click();
  await expect(page.locator(".planner-subbar")).toContainText("1 piece");
  const scan = await new AxeBuilder({ page }).analyze();
  expect(
    scan.violations
      .filter((v) => v.impact === "critical" || v.impact === "serious")
      .map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
});
test("100 pieces remain editable and keyboard actions preserve inputs", async ({
  page,
}) => {
  const p = createDemo();
  p.rooms[0].width = 10000;
  p.rooms[0].depth = 10000;
  p.furniture = Array.from({ length: 100 }, (_, i) => ({
    ...p.furniture[5],
    id: `plant-${i}`,
    x: (i % 10) * 900 + 100,
    y: Math.floor(i / 10) * 900 + 100,
  }));
  await page.goto("/my-spaces");
  const start = Date.now();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "hundred.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(p)),
    });
  await expect(page).toHaveURL(/\/planner\//);
  await expect(page.locator("#planner-canvas title")).toHaveCount(100);
  await page.getByRole("button", { name: "Add Plant", exact: true }).click();
  await expect(page.getByLabel("Item width")).toBeVisible();
  await page.getByLabel("Position X (cm)").fill("125");
  await page.getByLabel("Position X (cm)").press("ArrowRight");
  await expect(page.locator(".planner-subbar")).toContainText("101 pieces");
  console.log(
    `100-piece import and edit: ${Date.now() - start} ms (local development browser)`,
  );
});
