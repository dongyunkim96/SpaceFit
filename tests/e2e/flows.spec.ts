import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("home → demo → edit → autosave → reload → export and import", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your space. Thoughtfully arranged." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Explore a demo", exact: true }).click();
  await expect(page).toHaveURL(/\/planner\//);
  await page
    .getByRole("button", { name: "Add Compact sofa", exact: true })
    .click();
  await expect(page.getByLabel("Item width")).toBeVisible();
  const x = page.getByLabel("Position X (cm)");
  const original = Number(await x.inputValue());
  await page.locator("body").click({ position: { x: 350, y: 90 } });
  await page.keyboard.press("ArrowRight");
  await expect(x).toHaveValue(String(original + 5));
  await page.getByRole("button", { name: "Rotate selected furniture" }).click();
  await expect(page.locator(".rotation-control")).toContainText("90°");
  await page.getByLabel("Item width").fill(`5' 0"`);
  await page.getByLabel("Item width").press("Enter");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved on this device");
  const url = page.url();
  await page.reload();
  await expect(page.getByLabel("Project title")).toHaveValue(
    "A little room to breathe",
  );
  await expect(page.getByRole("status")).toContainText("Saved on this device");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  let downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Project backup (.json)" }).click();
  const json = await downloadPromise;
  const file = await json.path();
  expect(file).toBeTruthy();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Floor plan image (.png)" }).click();
  const png = await downloadPromise;
  expect(png.suggestedFilename()).toMatch(/\.png$/);
  const pngPath = await png.path();
  const fs = await import("node:fs/promises");
  const bytes = await fs.readFile(pngPath!);
  expect(bytes.length).toBeGreaterThan(5000);
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  await page.getByRole("link", { name: "Back to my spaces" }).click();
  await expect(
    page.getByRole("heading", { name: "A little room to breathe" }),
  ).toBeVisible();
  await page.locator("input[type=file]").setInputFiles(file!);
  await expect(page).toHaveURL(/\/planner\//);
  expect(page.url()).not.toBe(url);
  expect(errors).toEqual([]);
});
test("templates, validated room creation, dimensions, keyboard, and mobile editing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/templates");
  await page.getByRole("button", { name: "Home office", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The focused space" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Use this layout", exact: true })
    .click();
  await page.getByRole("button", { name: "Let’s start planning" }).click();
  await expect(page).toHaveURL(/\/planner\//);
  await page.getByRole("button", { name: "Room details", exact: true }).click();
  await page.getByLabel("Room width").fill(`10' 0"`);
  await page.getByLabel("Room width").press("Enter");
  await page.getByRole("button", { name: "Close properties" }).click();
  await page.getByRole("button", { name: "Furniture", exact: true }).click();
  await page.getByLabel("Search furniture").fill("plant");
  await page.getByRole("button", { name: "Add Plant", exact: true }).click();
  await page.getByRole("button", { name: "Rotate selected furniture" }).click();
  await expect(page.locator(".rotation-control")).toContainText("90°");
  await page.getByRole("button", { name: "Close properties" }).click();
  await expect(page.getByRole("status")).toContainText("Saved on this device");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("invalid import is handled without a crash", async ({ page }) => {
  await page.goto("/my-spaces");
  await page.locator("input[type=file]").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"not":"a project"}'),
  });
  await expect(page.getByRole("alert")).toContainText(
    "not a valid SPACEFIT project",
  );
});
test("core pages have no serious or critical automated accessibility issues", async ({
  page,
}) => {
  for (const route of [
    "/",
    "/about",
    "/templates",
    "/my-spaces",
    "/sign-in",
    "/new",
  ]) {
    await page.goto(route);
    const scan = await new AxeBuilder({ page }).analyze();
    expect(
      scan.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      ),
      `${route}: ${JSON.stringify(scan.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })))}`,
    ).toEqual([]);
  }
});
