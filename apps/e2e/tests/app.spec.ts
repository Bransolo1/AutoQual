import { test, expect, request } from "@playwright/test";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";
const headers = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user" };

type Project = { id: string; name: string };

async function waitForApi() {
  const apiContext = await request.newContext({ baseURL: apiBaseUrl, extraHTTPHeaders: headers });
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const res = await apiContext.get("/health").catch(() => null);
    if (res && res.ok()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("API did not become ready in time.");
}

test.describe("Sensehub Auto Qual E2E", () => {
  test.beforeEach(async () => {
    await waitForApi();
  });

  test("home and navigation render", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Sensehub Auto Qual" })).toBeVisible();
    await page.getByRole("link", { name: "Projects" }).first().click();
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
    await page.getByRole("link", { name: "Studies" }).click();
    await expect(page.getByRole("heading", { name: "Studies" })).toBeVisible();
  });

  test("study builder flow completes", async ({ page }) => {
    const apiContext = await request.newContext({ baseURL: apiBaseUrl, extraHTTPHeaders: headers });
    const projectsRes = await apiContext.get(`/projects?workspaceId=demo-workspace-id`);
    expect(projectsRes.ok()).toBeTruthy();
    const projects = (await projectsRes.json()) as Project[];
    expect(projects.length).toBeGreaterThan(0);

    await page.goto("/studies");
    await page.getByLabel("Study name").fill("E2E Study");
    await page.getByLabel("Project").selectOption(projects[0].id);
    await page.getByRole("button", { name: "Create study" }).click();
    await expect(page.getByText("Study created.")).toBeVisible();

    const studiesRes = await apiContext.get(`/studies?workspaceId=demo-workspace-id`);
    expect(studiesRes.ok()).toBeTruthy();
    const studies = (await studiesRes.json()) as { id: string }[];
    const studyId = studies[studies.length - 1]?.id;
    expect(studyId).toBeTruthy();

    await page.getByRole("combobox", { name: "Study" }).nth(0).selectOption(studyId);
    await page.getByLabel("Brief").fill("We need feedback on onboarding.");
    await page.getByRole("button", { name: "Generate guide" }).click();
    await expect(page.getByText("Interview guide generated from brief.")).toBeVisible();

    await page.getByRole("combobox", { name: "Study" }).nth(1).selectOption(studyId);
    await page.getByLabel("Prompt").fill("What did you enjoy most?");
    await page.getByRole("button", { name: "Generate preview" }).click();
    await expect(page.getByText("Synthetic preview generated.")).toBeVisible();

    await page.getByRole("combobox", { name: "Study" }).nth(2).selectOption(studyId);
    await page.getByRole("button", { name: "Recruit participants" }).click();
    await expect(page.getByText("Participants recruited.")).toBeVisible();
  });

  test("insights templates are visible", async ({ page }) => {
    await page.goto("/insights");
    await expect(page.getByText("Templates")).toBeVisible();
    await expect(page.getByText("Customer Journey")).toBeVisible();
  });
});
