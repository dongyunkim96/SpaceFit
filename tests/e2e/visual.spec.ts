import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
test("responsive visual review at 360, 768, and 1440 pixels", async ({
  page,
}) => {
  test.setTimeout(120000);
  await mkdir("qa", { recursive: true });
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, route] of [
      ["home", "/"],
      ["about", "/about"],
      ["templates", "/templates"],
      ["empty-dashboard", "/my-spaces"],
      ["account", "/sign-in"],
    ]) {
      await page.goto(route);
      await page.locator("h1").waitFor();
      await page.screenshot({
        path: `qa/${name}-${width}.png`,
        fullPage: true,
      });
      if (width === 1440 && name === "home")
        await page.screenshot({
          path: "qa/spacefit-preview.png",
          fullPage: false,
        });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${name} at ${width}px overflows`,
      ).toBe(true);
    }
    await page.goto("/demo");
    await page.getByLabel("Project title").waitFor();
    if (width < 700) {
      await page
        .getByRole("button", { name: "Furniture", exact: true })
        .click();
    }
    await page
      .getByRole("button", { name: "Add Armchair", exact: true })
      .click();
    await page.screenshot({ path: `qa/planner-${width}.png`, fullPage: true });
    await expect(page.getByRole("status")).toContainText(
      "Saved on this device",
    );
    await page.goto("/my-spaces");
    await page.locator(".saved-card").first().waitFor();
    await page.screenshot({
      path: `qa/dashboard-${width}.png`,
      fullPage: true,
    });
  }
});
