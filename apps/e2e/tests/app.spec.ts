import { test, expect, request, APIRequestContext } from "@playwright/test";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";
const headers = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user" };

type Project = { id: string; name: string };

async function createStudy(apiContext: APIRequestContext, projectId: string, name: string) {
  const res = await apiContext.post("/studies", {
    data: {
      workspaceId: "demo-workspace-id",
      projectId,
      name,
      status: "draft",
      language: "en",
      mode: "voice",
      allowMultipleEntries: false,
      allowIncomplete: false,
      syntheticEnabled: false,
    },
  });
  expect(res.ok()).toBeTruthy();
  const payload = (await res.json()) as { id?: string };
  return payload.id;
}

async function createInsight(
  apiContext: APIRequestContext,
  studyId: string,
  statement: string,
  supportingVideoClips: string[],
  supportingTranscriptSpans: string[],
) {
  const res = await apiContext.post("/insights", {
    data: {
      studyId,
      statement,
      supportingTranscriptSpans,
      supportingVideoClips,
      confidenceScore: 0.6,
      businessImplication: "demo",
      tags: ["driver"],
      status: "approved",
      reviewerComments: [],
    },
  });
  expect(res.ok()).toBeTruthy();
  const payload = (await res.json()) as { id?: string };
  return payload.id;
}

async function addInsightVersion(
  apiContext: APIRequestContext,
  insightId: string,
  statement: string,
  supportingVideoClips: string[],
  supportingTranscriptSpans: string[],
) {
  const res = await apiContext.post(`/insights/${insightId}/versions`, {
    data: {
      statement,
      supportingTranscriptSpans,
      supportingVideoClips,
      confidenceScore: 0.7,
      businessImplication: "updated",
      tags: ["driver"],
      reviewerComments: [],
    },
  });
  expect(res.ok()).toBeTruthy();
}

async function createApproval(
  apiContext: APIRequestContext,
  linkedEntityType: string,
  linkedEntityId: string,
) {
  const res = await apiContext.post("/approvals", {
    data: {
      linkedEntityType,
      linkedEntityId,
      status: "requested",
      requestedByUserId: "demo-user",
      workspaceId: "demo-workspace-id",
      actorUserId: "demo-user",
    },
  });
  expect(res.ok()).toBeTruthy();
}

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

  test("analysis quality panel loads coverage", async ({ page }) => {
    const apiContext = await request.newContext({ baseURL: apiBaseUrl, extraHTTPHeaders: headers });
    const projectsRes = await apiContext.get(`/projects?workspaceId=demo-workspace-id`);
    expect(projectsRes.ok()).toBeTruthy();
    const projects = (await projectsRes.json()) as Project[];
    const projectId = projects[0]?.id;
    expect(projectId).toBeTruthy();

    const studyId = await createStudy(apiContext, projectId, "E2E Analysis Quality Study");
    expect(studyId).toBeTruthy();

    await page.goto("/studies");
    const analysisSection = page.locator("section", {
      has: page.getByRole("heading", { name: "Analysis quality" }),
    });
    await analysisSection.getByRole("combobox", { name: "Study" }).selectOption(studyId);
    await expect(analysisSection.getByText("0%")).toBeVisible();
    await expect(analysisSection.getByText("0/0 insights linked")).toBeVisible();
  });

  test("analysis quality shows evidence gaps", async ({ page }) => {
    const apiContext = await request.newContext({ baseURL: apiBaseUrl, extraHTTPHeaders: headers });
    const projectsRes = await apiContext.get(`/projects?workspaceId=demo-workspace-id`);
    expect(projectsRes.ok()).toBeTruthy();
    const projects = (await projectsRes.json()) as Project[];
    const projectId = projects[0]?.id;
    expect(projectId).toBeTruthy();

    const studyId = await createStudy(apiContext, projectId, "E2E Evidence Coverage Study");
    expect(studyId).toBeTruthy();

    await createInsight(apiContext, studyId, "Insight with evidence", ["clip-1"], []);
    const gapInsightId = await createInsight(apiContext, studyId, "Insight missing evidence", [], []);
    expect(gapInsightId).toBeTruthy();

    await page.goto("/studies");
    const analysisSection = page.locator("section", {
      has: page.getByRole("heading", { name: "Analysis quality" }),
    });
    await expect(analysisSection.getByRole("option", { name: studyId })).toBeVisible();
    await analysisSection.getByRole("combobox", { name: "Study" }).selectOption(studyId);
    await expect(analysisSection.getByText("50%")).toBeVisible();
    await expect(analysisSection.getByText("1/2 insights linked")).toBeVisible();
    await expect(analysisSection.getByText("1 insights missing evidence")).toBeVisible();
    await expect(analysisSection.getByText("Insight missing evidence")).toBeVisible();
  });

  test("analysis quality clears gaps after evidence update", async ({ page }) => {
    const apiContext = await request.newContext({ baseURL: apiBaseUrl, extraHTTPHeaders: headers });
    const projectsRes = await apiContext.get(`/projects?workspaceId=demo-workspace-id`);
    expect(projectsRes.ok()).toBeTruthy();
    const projects = (await projectsRes.json()) as Project[];
    const projectId = projects[0]?.id;
    expect(projectId).toBeTruthy();

    const studyId = await createStudy(apiContext, projectId, "E2E Evidence Fix Study");
    expect(studyId).toBeTruthy();

    const gapInsightId = await createInsight(apiContext, studyId, "Needs evidence", [], []);
    expect(gapInsightId).toBeTruthy();

    await page.goto("/studies");
    const analysisSection = page.locator("section", {
      has: page.getByRole("heading", { name: "Analysis quality" }),
    });
    await analysisSection.getByRole("combobox", { name: "Study" }).selectOption(studyId);
    await expect(analysisSection.getByText("Evidence gaps")).toBeVisible();

    await addInsightVersion(apiContext, gapInsightId as string, "Needs evidence", [], ["span-1"]);

    await analysisSection.getByRole("combobox", { name: "Study" }).selectOption("");
    await analysisSection.getByRole("combobox", { name: "Study" }).selectOption(studyId);
    await expect(analysisSection.getByText("Evidence gaps")).toHaveCount(0);
  });

  test("approvals warn when evidence gaps exist", async ({ page }) => {
    const apiContext = await request.newContext({ baseURL: apiBaseUrl, extraHTTPHeaders: headers });
    const projectsRes = await apiContext.get(`/projects?workspaceId=demo-workspace-id`);
    expect(projectsRes.ok()).toBeTruthy();
    const projects = (await projectsRes.json()) as Project[];
    const projectId = projects[0]?.id;
    expect(projectId).toBeTruthy();

    const studyId = await createStudy(apiContext, projectId, "E2E Approval Evidence Study");
    expect(studyId).toBeTruthy();

    const insightId = await createInsight(apiContext, studyId, "Needs evidence", [], []);
    expect(insightId).toBeTruthy();

    await createApproval(apiContext, "insight_set", studyId);

    await page.goto(`/approvals?linkedEntityId=${studyId}&linkedEntityType=insight_set`);
    await expect(page.getByText("Evidence gaps detected")).toBeVisible();

    await addInsightVersion(apiContext, insightId as string, "Needs evidence", [], ["span-1"]);

    await page.reload();
    await expect(page.getByText("Evidence gaps detected")).toHaveCount(0);
  });
});
