import { chromium } from 'playwright';

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 850, height: 1100 },
    });
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
