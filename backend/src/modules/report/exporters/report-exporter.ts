/**
 * 报告导出器 - 支持 Markdown/PDF/Word/Excel/HTML/PPT 六种格式
 */

import { marked } from 'marked';
import * as fs from 'node:fs';
import * as path from 'node:path';

export class ReportExporter {
  private outputDir: string;

  constructor() {
    this.outputDir = path.resolve('data/exports');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async export(reportJson: string, format: string, title: string): Promise<{ filePath: string; fileSize: number }> {
    const markdown = this.jsonToMarkdown(reportJson, title);

    switch (format) {
      case 'markdown':
        return this.exportMarkdown(markdown, title);
      case 'html':
        return this.exportHtml(markdown, title);
      case 'excel':
        return this.exportExcel(reportJson, title);
      case 'pdf':
        return this.exportPdf(markdown, title);
      case 'word':
        return this.exportWord(markdown, title);
      case 'ppt':
        return this.exportPpt(reportJson, title);
      default:
        return this.exportMarkdown(markdown, title);
    }
  }

  // === Markdown ===
  private async exportMarkdown(content: string, title: string) {
    const filename = `${this.sanitize(title)}.md`;
    const filePath = path.join(this.outputDir, filename);
    fs.writeFileSync(filePath, content, 'utf-8');
    return { filePath, fileSize: fs.statSync(filePath).size };
  }

  // === HTML ===
  private async exportHtml(markdown: string, title: string) {
    const htmlBody = await marked.parse(markdown);
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'PingFang SC','Microsoft YaHei',sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; color: #333; line-height: 1.8; }
    h1 { color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px; }
    h2 { color: #15803d; margin-top: 30px; }
    h3 { color: #166534; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th,td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f0fdf4; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-p0 { background: #f44336; color: #fff; }
    .badge-p1 { background: #ff9800; color: #fff; }
    .badge-p2 { background: #2196f3; color: #fff; }
    blockquote { border-left: 4px solid #16a34a; padding-left: 16px; color: #666; margin: 16px 0; }
  </style>
</head>
<body>${htmlBody}</body>
</html>`;
    const filename = `${this.sanitize(title)}.html`;
    const filePath = path.join(this.outputDir, filename);
    fs.writeFileSync(filePath, html, 'utf-8');
    return { filePath, fileSize: fs.statSync(filePath).size };
  }

  // === Excel (CSV simplified) ===
  private async exportExcel(reportJson: string, title: string) {
    const data = JSON.parse(reportJson);
    const rows: string[] = [];
    rows.push('模块,内容');

    if (data.strategyCards) {
      data.strategyCards.forEach((card: any) => {
        rows.push(`策略卡 ${card.priority},${card.title}`);
        if (card.commentEvidence) {
          card.commentEvidence.forEach((e: string) => rows.push(`评论证据,"${e}"`));
        }
      });
    }

    if (data.insights) {
      rows.push('洞察类型,内容');
      if (data.insights.demands) {
        data.insights.demands.forEach((d: any) => rows.push(`需求,${d.category}:${d.evidence}`));
      }
    }

    const csv = '\uFEFF' + rows.join('\n');
    const filename = `${this.sanitize(title)}.csv`;
    const filePath = path.join(this.outputDir, filename);
    fs.writeFileSync(filePath, csv, 'utf-8');
    return { filePath, fileSize: fs.statSync(filePath).size };
  }

  // === PDF (HTML-based) ===
  private async exportPdf(markdown: string, title: string): Promise<{ filePath: string; fileSize: number }> {
    // Use puppeteer for real PDF; fallback to HTML for now
    const { filePath: htmlPath } = await this.exportHtml(markdown, title);
    const pdfPath = htmlPath.replace('.html', '.pdf');

    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({ headless: true });
      const page = await browser.newPage();
      const html = fs.readFileSync(htmlPath, 'utf-8');
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({ path: pdfPath, format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
      await browser.close();
      fs.unlinkSync(htmlPath); // Clean up temp HTML
      return { filePath: pdfPath, fileSize: fs.statSync(pdfPath).size };
    } catch {
      // Puppeteer not available, return HTML as fallback
      return { filePath: htmlPath, fileSize: fs.statSync(htmlPath).size };
    }
  }

  // === Word (DOCX via markdown→HTML→docx) ===
  private async exportWord(markdown: string, title: string): Promise<{ filePath: string; fileSize: number }> {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      const lines = markdown.split('\n');
      const children: any[] = [];

      for (const line of lines) {
        if (line.startsWith('# ')) {
          children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 }));
        } else if (line.startsWith('## ')) {
          children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 }));
        } else if (line.startsWith('### ')) {
          children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }));
        } else if (line.trim()) {
          children.push(new Paragraph({ children: [new TextRun(line)] }));
        }
      }

      const doc = new Document({ sections: [{ children }] });
      const buffer = await Packer.toBuffer(doc);
      const filename = `${this.sanitize(title)}.docx`;
      const filePath = path.join(this.outputDir, filename);
      fs.writeFileSync(filePath, buffer);
      return { filePath, fileSize: buffer.length };
    } catch {
      return this.exportMarkdown(markdown, title);
    }
  }

  // === PPT (PPTX) ===
  private async exportPpt(reportJson: string, title: string): Promise<{ filePath: string; fileSize: number }> {
    try {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();
      const data = JSON.parse(reportJson);

      pptx.layout = 'LAYOUT_WIDE';
      pptx.defineSlideMaster({
        title: 'VOCOS_MASTER',
        background: { color: 'FFFFFF' },
      });

      // Title slide
      const slide1 = pptx.addSlide();
      slide1.addText(title, { x: 1, y: 1.5, w: 8, h: 1.5, fontSize: 32, color: '16a34a', bold: true, align: 'center' });
      slide1.addText('Voice of Consumer OS — AI 分析报告', { x: 1, y: 3.5, w: 8, h: 1, fontSize: 16, color: '666666', align: 'center' });

      // Strategy cards slides
      if (data.strategyCards) {
        for (const card of data.strategyCards) {
          const slide = pptx.addSlide();
          slide.addText(`${card.priority} — ${card.title}`, { x: 0.5, y: 0.3, w: 9, h: 0.8, fontSize: 20, bold: true, color: '16a34a' });
          if (card.commentEvidence) {
            slide.addText('评论证据：' + card.commentEvidence.join(' | '), { x: 0.5, y: 1.3, w: 9, h: 0.6, fontSize: 12, color: '666666' });
          }
          if (card.coreJudgment) {
            slide.addText(card.coreJudgment, { x: 0.5, y: 2.2, w: 9, h: 1, fontSize: 14 });
          }
        }
      }

      const filename = `${this.sanitize(title)}.pptx`;
      const filePath = path.join(this.outputDir, filename);
      await pptx.writeFile({ fileName: filePath });
      return { filePath, fileSize: fs.statSync(filePath).size };
    } catch {
      return this.exportMarkdown(this.jsonToMarkdown(reportJson, title), title);
    }
  }

  // === JSON → Markdown ===
  private jsonToMarkdown(reportJson: string, title: string): string {
    const data = JSON.parse(reportJson);
    const wl = data.whiteLabel || {};
    const brand = wl.companyName || 'VocosAI';
    const hideBrand = wl.hideVocosBrand || false;

    let md = `# ${title}\n\n`;
    if (wl.companyName) md += `**${wl.companyName}**  \n`;
    md += `> 生成时间：${new Date().toLocaleString('zh-CN')}\n`;
    if (!hideBrand) md += `> 生成工具：VocosAI — Voice of Consumer OS\n`;
    md += `\n---\n\n`;

    // Content analysis
    if (data.contentAnalysis) {
      md += `## 一、内容拆解\n\n`;
      md += `| 维度 | 分析 |\n|------|------|\n`;
      const ca = data.contentAnalysis;
      if (ca.titleStructure) md += `| 标题结构 | 痛点:${ca.titleStructure.hasPainPoint ? '✅' : '❌'} 关键词:${ca.titleStructure.hasKeyword ? '✅' : '❌'} 利益:${ca.titleStructure.hasBenefit ? '✅' : '❌'} |\n`;
      if (ca.contentTheme) md += `| 内容主题 | ${ca.contentTheme} |\n`;
      if (ca.platformFit) md += `| 平台适配 | 抖音:${ca.platformFit.douyin} 小红书:${ca.platformFit.xiaohongshu} |\n`;
      md += `\n`;
    }

    // Comment cleaning
    if (data.commentCleaning) {
      md += `## 二、评论清洗\n\n`;
      const cc = data.commentCleaning;
      md += `| 指标 | 数值 |\n|------|------|\n`;
      md += `| 原始评论数 | ${cc.originalCount || 0} |\n`;
      md += `| 有效评论数 | ${cc.validCount || 0} |\n`;
      md += `| 去重数 | ${cc.exactDuplicates || 0} |\n`;
      md += `| 水军/无效 | ${cc.spamCount || 0} |\n`;
      md += `\n`;
    }

    // Insights
    if (data.insights) {
      md += `## 三、评论洞察\n\n`;
      if (data.insights.demands) {
        md += `### 用户需求\n\n`;
        data.insights.demands.forEach((d: any) => {
          md += `- **${d.category}**（${d.frequency}）：${d.evidence}\n`;
        });
        md += `\n`;
      }
      if (data.insights.barriers) {
        md += `### 购买障碍\n\n`;
        data.insights.barriers.forEach((b: any) => {
          md += `- **${b.type}**（${b.level}）：${b.action}\n`;
        });
        md += `\n`;
      }
    }

    // Strategy cards
    if (data.strategyCards) {
      md += `## 四、策略卡\n\n`;
      data.strategyCards.forEach((card: any, i: number) => {
        const badge = card.priority === 'P0' ? '🔴' : card.priority === 'P1' ? '🟠' : '🔵';
        md += `### ${badge} ${card.priority} — ${card.title}\n\n`;
        if (card.contentOpportunity) md += `> ${card.contentOpportunity}\n\n`;
        if (card.commentEvidence) {
          md += `**评论证据：**\n`;
          card.commentEvidence.forEach((e: string) => md += `- "${e}"\n`);
          md += `\n`;
        }
        if (card.coreJudgment) md += `**核心判断：** ${card.coreJudgment}\n\n`;
        if (card.nextAction) md += `**下一步：** ${card.nextAction}\n\n`;
      });
    }

    // Production cards
    if (data.productionCards) {
      md += `## 五、内容生产卡\n\n`;
      data.productionCards.forEach((card: any, i: number) => {
        md += `### ${card.platform === 'douyin' ? '抖音' : '小红书'} 生产卡\n\n`;
        if (card.titleOptions) {
          md += `**标题版本：**\n`;
          card.titleOptions.forEach((t: string) => md += `- ${t}\n`);
          md += `\n`;
        }
        if (card.hook) md += `**前3秒钩子：** ${card.hook}\n\n`;
        if (card.structure) {
          md += `**内容结构：**\n`;
          card.structure.forEach((s: string) => md += `1. ${s}\n`);
          md += `\n`;
        }
      });
    }

    // Ad fit
    if (data.adFit) {
      md += `## 六、投流适配\n\n`;
      md += `- **评分：** ${data.adFit.score}/100\n`;
      md += `- **结论：** ${data.adFit.conclusion}\n`;
      md += `- **建议人群：** ${data.adFit.targetAudience}\n`;
      md += `\n`;
    }

    md += `---\n\n`;
    if (!hideBrand || !wl.companyName) {
      md += `*本报告由 VocosAI 自动生成，基于评论区真实用户数据分析*\n`;
    }

    return md;
  }

  private sanitize(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').slice(0, 100);
  }
}

export const reportExporter = new ReportExporter();
