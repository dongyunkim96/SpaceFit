import { test, expect } from "@playwright/test";
test("pan and pointer dragging stay accurate after zoom, with one undo step", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByLabel("Project title").waitFor();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Pan tool", exact: true }).click();
  const canvas = page.locator("#planner-canvas");
  const view = await canvas.getAttribute("viewBox");
  const rect = await canvas.boundingBox();
  expect(rect).toBeTruthy();
  await page.mouse.move(rect!.x + 80, rect!.y + rect!.height - 100);
  await page.mouse.down();
  await page.mouse.move(rect!.x + 130, rect!.y + rect!.height - 70, {
    steps: 6,
  });
  await page.mouse.up();
  expect(await canvas.getAttribute("viewBox")).not.toBe(view);
  await page
    .getByRole("button", { name: "Selection tool", exact: true })
    .click();
  await page.getByRole("button", { name: "Add Plant", exact: true }).click();
  const x = page.getByLabel("Position X (cm)");
  const before = Number(await x.inputValue());
  const plant = page
    .locator("#planner-canvas title")
    .filter({ hasText: /^Plant/ })
    .last()
    .locator("..")
    .locator(":scope > g")
    .first();
  const box = await plant.boundingBox();
  expect(box).toBeTruthy();
  const cx = box!.x + box!.width / 2,
    cy = box!.y + box!.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 35, cy + 20, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () => Number(await x.inputValue()))
    .toBeGreaterThan(before);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".planner-subbar")).toContainText("10 pieces");
  await page
    .locator("#planner-canvas title")
    .filter({ hasText: /^Plant/ })
    .last()
    .locator("..")
    .click();
  await expect(x).toHaveValue(String(before));
});
