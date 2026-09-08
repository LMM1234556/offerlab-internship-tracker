import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const baseUrl = process.env.OFFERLAB_URL ?? 'http://127.0.0.1:5173';
const artifactsUrl = new URL('../artifacts/', import.meta.url);
const artifactsDir = fileURLToPath(artifactsUrl);
await mkdir(artifactsDir, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const browserErrors = [];
const failedResponses = [];

page.on('console', (message) => {
  if (message.type() === 'error') {
    const location = message.location();
    browserErrors.push(`console: ${message.text()} ${location.url || ''}`.trim());
  }
});
page.on('pageerror', (error) => browserErrors.push(`page: ${error.message}`));
page.on('response', (response) => {
  if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
});

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /让每一次投递/ }).waitFor();

  const bodyText = (await page.locator('body').innerText()).trim();
  if (bodyText.length < 300) throw new Error('页面正文内容异常偏少');
  if (await page.locator('.vite-error-overlay').count()) throw new Error('检测到 Vite 错误浮层');
  await page.screenshot({ path: fileURLToPath(new URL('offerlab-desktop.png', artifactsUrl)), fullPage: true });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 CSV' }).click();
  const download = await downloadPromise;
  if (!download.suggestedFilename().endsWith('.csv')) throw new Error('CSV 导出文件名异常');
  await page.screenshot({ path: fileURLToPath(new URL('offerlab-desktop.png', artifactsUrl)), fullPage: true });

  await page.getByRole('button', { name: /添加岗位/ }).first().click();
  await page.getByRole('dialog', { name: '添加岗位' }).waitFor();
  await page.getByLabel('公司 *').fill('浏览器验收公司');
  await page.getByLabel('岗位 *').fill('数据分析实习生');
  await page.getByLabel('当前阶段').selectOption({ label: '已投递' });
  await page.getByRole('button', { name: /添加 JD 要求/ }).click();
  await page.getByPlaceholder('例如：熟练使用 SQL 完成多表分析').fill('熟练使用 SQL');
  await page.getByPlaceholder('例如：Olist 项目中建立订单级模型并完成独立复算').fill('Olist 项目多表分析');
  await page.getByLabel('证据状态').selectOption({ label: '有证据' });
  await page.getByRole('button', { name: '保存记录' }).click();

  await page.getByRole('button', { name: '投递管理' }).click();
  await page.getByPlaceholder('搜索公司、岗位、渠道…').fill('浏览器验收公司');
  await page.getByText('浏览器验收公司', { exact: true }).waitFor();
  await page.getByText('100%', { exact: true }).waitFor();
  await page.screenshot({ path: fileURLToPath(new URL('offerlab-applications.png', artifactsUrl)), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (horizontalOverflow > 1) throw new Error(`移动端存在 ${horizontalOverflow}px 横向溢出`);
  await page.screenshot({ path: fileURLToPath(new URL('offerlab-mobile.png', artifactsUrl)), fullPage: true });

  if (browserErrors.length || failedResponses.length) {
    throw new Error([...browserErrors, ...failedResponses].join('\n'));
  }
  console.log(JSON.stringify({
    status: 'PASS',
    title: await page.title(),
    bodyCharacters: bodyText.length,
    horizontalOverflow,
    checks: ['首屏渲染', 'CSV 导出', 'JD 证据矩阵', '自动覆盖度', '新增记录', '投递搜索', '桌面截图', '移动端无横向溢出', '控制台无错误'],
  }, null, 2));
} finally {
  await browser.close();
}
