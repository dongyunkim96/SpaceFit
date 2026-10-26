import { test, expect } from "@playwright/test";
test.skip(
  !process.env.FIRESTORE_EMULATOR_HOST,
  "Requires the Firebase Auth and Firestore emulators.",
);
test("account signup → cloud save → sign out → sign in → restore and guest import", async ({
  page,
}) => {
  const suffix = Date.now(),
    email = `planner-${suffix}@example.test`,
    password = "Spacefit-test-123!";
  await page.goto("/demo");
  await page.getByLabel("Project title").waitFor();
  await page.getByRole("link", { name: "Back to my spaces" }).click();
  await expect(
    page.getByRole("heading", { name: "A little room to breathe" }),
  ).toBeVisible();
  await page.goto("/sign-up");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/my-spaces$/);
  await page
    .getByRole("button", { name: "Import guest drafts", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A little room to breathe (imported)" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "New space", exact: true }).click();
  await page.getByLabel("Name your space").fill(`Account layout ${suffix}`);
  await page.getByRole("button", { name: "Let’s start planning" }).click();
  await expect(page).toHaveURL(/\/planner\//);
  await page
    .getByRole("button", { name: "Add Compact sofa", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  const savedUrl = page.url();
  await page.getByRole("link", { name: "Account", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/my-spaces");
  await expect(
    page.getByRole("heading", {
      name: "A little room to breathe",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: `Account layout ${suffix}` }),
  ).toHaveCount(0);
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/my-spaces$/);
  await page
    .getByRole("link", { name: `Account layout ${suffix}`, exact: true })
    .click();
  await expect(page).toHaveURL(savedUrl);
  await expect(page.locator(".planner-subbar")).toContainText("1 piece");
  await expect(page.getByRole("status")).toHaveText("Saved");
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Add Plant", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Offline — changes kept locally",
  );
  await page.context().setOffline(false);
  await expect(page.getByRole("status")).toHaveText("Saved");
  await page.reload();
  await expect(page.locator(".planner-subbar")).toContainText("2 pieces");
  const second = await page.context().newPage();
  await second.goto(savedUrl);
  await expect(second.getByRole("status")).toHaveText("Saved");
  await page.getByLabel("Project title").fill("Updated in the first tab");
  await expect(page.getByRole("status")).toHaveText("Saved");
  await second.getByRole("button", { name: "Add Plant", exact: true }).click();
  await expect(second.getByRole("alert")).toContainText(
    "another tab or device",
  );
  await second
    .getByRole("button", { name: "Save a copy", exact: true })
    .click();
  await expect(second).not.toHaveURL(savedUrl);
  await expect(second.getByLabel("Project title")).toHaveValue(
    `Account layout ${suffix} copy`,
  );
  await second.close();
  await page.reload();
  await expect(page.getByLabel("Project title")).toHaveValue(
    "Updated in the first tab",
  );
  await expect(page.locator(".planner-subbar")).toContainText("2 pieces");
});
