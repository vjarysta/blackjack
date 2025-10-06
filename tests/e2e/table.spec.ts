import { test, expect, type Page } from "@playwright/test";

const seatLocator = (page: Page, index: number) => page.getByTestId(`bet-spot-${index}`);
const betValueLocator = (page: Page, index: number) => page.getByTestId(`seat-${index}-bet`);

const euro = (amount: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(amount);

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('[data-testid="table-stage"]');
  await page.waitForSelector('[data-testid="table-hud"]');
});

test("table fits within the viewport without scrolling", async ({ page }) => {
  const { scrollHeight, innerHeight } = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight
  }));

  expect(scrollHeight).toBeLessThanOrEqual(innerHeight + 16);
});

test("felt stage is horizontally centered", async ({ page }) => {
  const { containerCenter, stageCenter } = await page.evaluate(() => {
    const container = document.querySelector('[data-testid="table-layout"]');
    const stage = document.querySelector('[data-testid="table-stage"]');
    if (!container || !stage) {
      return { containerCenter: 0, stageCenter: 0 };
    }
    const containerRect = container.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    return {
      containerCenter: containerRect.left + containerRect.width / 2,
      stageCenter: stageRect.left + stageRect.width / 2
    };
  });

  expect(Math.abs(containerCenter - stageCenter)).toBeLessThanOrEqual(4);
});

test("hud spans at least the felt stage width", async ({ page }) => {
  const { stageWidth, hudWidth } = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="table-stage"]');
    const hud = document.querySelector('[data-testid="table-hud"]');
    const stageWidth = stage ? stage.getBoundingClientRect().width : 0;
    const hudWidth = hud ? hud.getBoundingClientRect().width : 0;
    return { stageWidth, hudWidth };
  });
  expect(hudWidth).toBeGreaterThanOrEqual(stageWidth - 2);
});

test("five betting seats are available", async ({ page }) => {
  const seatCount = await page.evaluate(() => {
    return document.querySelectorAll('[data-testid^="bet-spot-"]').length;
  });
  expect(seatCount).toBe(5);
});

test("chips can be added and removed individually", async ({ page }) => {
  const seat = seatLocator(page, 0);

  await page.getByTestId("chip-100").click();
  await seat.click();
  await page.getByTestId("chip-25").click();
  await seat.click();

  await expect(betValueLocator(page, 0)).toHaveText(euro(125));

  const twentyFiveChip = page.locator('[data-testid="seat-0"] [data-chip-value="25"]').first();
  await twentyFiveChip.click({ button: "right" });

  await expect(betValueLocator(page, 0)).toHaveText(euro(100));

  await page.getByTestId("chip-5").click();
  await seat.click();

  await seat.click({ button: "right" });
  await expect(betValueLocator(page, 0)).toHaveText(euro(100));
});

test("deal button enables once a qualifying bet is placed", async ({ page }) => {
  const seat = seatLocator(page, 0);
  const dealButton = page.getByRole("button", { name: "Deal", exact: true });

  await expect(dealButton).toBeDisabled();

  await page.getByTestId("chip-25").click();
  await seat.click();

  await expect(dealButton).toBeEnabled();
});
