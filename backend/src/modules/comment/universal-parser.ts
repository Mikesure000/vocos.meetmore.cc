/**
 * 通用评论文件解析器 — 支持抖音/小红书多平台
 * 自动检测平台格式，适配不同表头
 */
import * as XLSX from 'xlsx';
import * as fs from 'node:fs';
import { detectSignals, scoreComment } from './comment-signals.js';

// 抖音标准字段
const DOUYIN_FIELDS = {
  comment_id: ['评论ID', '评论id'],
  comment_text: ['评论内容', '评论正文'],
  like_count: ['点赞量', '点赞数', 'like_count'],
  created_at: ['评论时间', '时间', 'created_at'],
  ip_location: ['IP地址', 'ip', '地区'],
  reply_count: ['子评论数', '回复数'],
  video_id: ['视频ID'],
  video_url: ['视频链接'],
  user_uid: ['用户UID'],
  user_name: ['用户名称', '用户名', '昵称'],
  douyin_id: ['抖音号'],
  parent_comment_id: ['一级评论ID'],
  parent_comment_text: ['一级评论内容'],
  parent_user_name: ['一级评论用户名称'],
  quoted_comment_id: ['引用的评论ID'],
  quoted_comment_text: ['引用的评论内容'],
};

// 小红书标准字段
const XHS_FIELDS = {
  comment_id: ['评论ID', 'id'],
  comment_text: ['评论内容', '内容', '评论'],
  like_count: ['点赞数', '点赞', '赞'],
  created_at: ['评论时间', '发布时间', '时间'],
  ip_location: ['IP属地', '地区', '城市'],
  reply_count: ['回复数', '子评论'],
  note_id: ['笔记ID', 'note_id'],
  note_url: ['笔记链接', '链接'],
  user_name: ['用户昵称', '用户名', '昵称'],
  user_id: ['用户ID', 'user_id'],
  parent_comment_id: ['父评论ID'],
  parent_comment_text: ['父评论内容'],
};

export interface ParseResult {
  platform: 'douyin' | 'xiaohongshu' | 'unknown';
  columns: string[];
  mapping: Record<string, string>;
  stats: {
    total: number;
    valid: number;
    spam: number;
    topLevel: number;
    replies: number;
    withSignals: number;
    highValue: number;
    duplicates: number;
  };
  comments: any[];
  preview: any[];
}

function autoDetectPlatform(headers: string[]): 'douyin' | 'xiaohongshu' | 'unknown' {
  const headerStr = headers.join(' ');
  if (headerStr.includes('抖音号') || headerStr.includes('视频ID') || headerStr.includes('一级评论')) return 'douyin';
  if (headerStr.includes('笔记ID') || headerStr.includes('笔记链接')) return 'xiaohongshu';
  if (headerStr.includes('视频链接') || headerStr.includes('用户UID')) return 'douyin';
  return 'unknown';
}

function matchField(header: string, fieldDefs: Record<string, string[]>): string | null {
  const trimmed = header.trim();
  // 优先精确匹配，避免"一级评论ID"误匹配为"评论ID"
  let bestMatch: { key: string; len: number } | null = null;
  for (const [key, aliases] of Object.entries(fieldDefs)) {
    for (const alias of aliases) {
      if (trimmed === alias) {
        return key; // 精确匹配直接返回
      }
      if (trimmed.includes(alias) && alias.length > (bestMatch?.len || 0)) {
        bestMatch = { key, len: alias.length };
      }
    }
  }
  return bestMatch?.key || null;
}

function autoMap(headers: string[], platform: string): Record<string, string> {
  const fieldDefs = platform === 'xiaohongshu' ? XHS_FIELDS : DOUYIN_FIELDS;
  const mapping: Record<string, string> = {};
  for (const h of headers) {
    const matched = matchField(h.trim(), fieldDefs);
    mapping[h] = matched || 'ignore';
  }
  return mapping;
}

function parseExcelDate(val: any): string | null {
  if (!val) return null;
  const num = Number(val);
  if (!isNaN(num) && num > 40000 && num < 100000) {
    return new Date((num - 25569) * 86400000).toISOString();
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function parseValue(row: Record<string, any>, mapping: Record<string, string>, key: string): string {
  for (const [col, mapped] of Object.entries(mapping)) {
    if (mapped === key) return String(row[col] || '').trim();
  }
  return '';
}

function parseFile(filePath: string): ParseResult {
  const ext = filePath.split('.').pop()?.toLowerCase();
  let rawData: Record<string, any>[] = [];
  let columns: string[] = [];

  if (ext === 'xlsx' || ext === 'xls') {
    const buf = fs.readFileSync(filePath);
    const wb = XLSX.read(buf, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rawData = XLSX.utils.sheet_to_json(ws, { defval: '' });
  } else if (ext === 'csv') {
    const text = fs.readFileSync(filePath, 'utf-8');
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return emptyResult();
    columns = parseCSVLine(lines[0]);
    rawData = lines.slice(1).map(line => {
      const vals = parseCSVLine(line);
      const row: Record<string, any> = {};
      columns.forEach((c, i) => { row[c] = vals[i] || ''; });
      return row;
    });
  }

  if (rawData.length === 0) return emptyResult();
  if (columns.length === 0) columns = Object.keys(rawData[0]);

  const platform = autoDetectPlatform(columns);
  const mapping = autoMap(columns, platform);
  const comments: any[] = [];
  const seenIds = new Set<string>();
  let duplicates = 0;

  for (const row of rawData) {
    const text = parseValue(row, mapping, 'comment_text');
    if (!text) continue;

    const cid = parseValue(row, mapping, 'comment_id');
    if (cid && seenIds.has(cid)) { duplicates++; continue; }
    if (cid) seenIds.add(cid);

    const likeCount = Number(parseValue(row, mapping, 'like_count')) || 0;
    const replyCount = Number(parseValue(row, mapping, 'reply_count')) || 0;

    // v4.3: Multi-factor scoring model
    const scoring = scoreComment(text, likeCount, replyCount);
    const signals = scoring.signals;
    const score = scoring.score;

    let cleanStatus = 'valid';
    // v4.2 fix: 中文2字符评论有意义("支持""好！""试试")，只有1字符或无意义短评才标记
    if (text.length <= 1 || (text.length <= 2 && !/[\u4e00-\u9fa5]/.test(text))) {
      cleanStatus = 'short_invalid';
    } else if (/^(ddd+|666+|顶|赞|冲冲冲|牛)$/i.test(text) && text.length <= 3 && !/[\u4e00-\u9fa5]{2,}/.test(text)) {
      cleanStatus = 'spam';
    }

    const parentId = parseValue(row, mapping, 'parent_comment_id') || null;
    const isReply = !!parentId;

    comments.push({
      commentIdExternal: cid,
      commentText: text,
      normalizedText: text.replace(/\s+/g, ' '),
      likeCount,
      replyCount,
      createdAtExternal: parseExcelDate(row[Object.keys(mapping).find(k => mapping[k] === 'created_at') || '']),
      ipLocation: parseValue(row, mapping, 'ip_location'),
      userIdHash: hashId(parseValue(row, mapping, platform === 'xiaohongshu' ? 'user_id' : 'user_uid')),
      userNameHash: hashId(parseValue(row, mapping, 'user_name')),
      parentCommentId: parentId,
      parentCommentText: parseValue(row, mapping, 'parent_comment_text') || null,
      isReply,
      signals,
      valueScore: score,
      cleanStatus,
      platform,
      videoId: parseValue(row, mapping, 'video_id'),
      videoUrl: parseValue(row, mapping, 'video_url'),
      douyinId: parseValue(row, mapping, 'douyin_id'),
    });
  }

  return {
    platform,
    columns,
    mapping,
    stats: {
      total: comments.length,
      valid: comments.filter(c => c.cleanStatus === 'valid').length,
      spam: comments.filter(c => c.cleanStatus === 'spam').length,
      topLevel: comments.filter(c => !c.isReply).length,
      replies: comments.filter(c => c.isReply).length,
      withSignals: comments.filter(c => c.signals.length > 0).length,
      highValue: comments.filter(c => c.valueScore >= 4).length,
      duplicates,
    },
    comments,
    preview: comments.slice(0, 5).map(c => ({
      commentText: c.commentText,
      likeCount: c.likeCount,
      signals: c.signals,
      valueScore: c.valueScore,
      isReply: c.isReply,
      platform: c.platform,
    })),
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) { result.push(current.trim().replace(/^"|"$/g, '')); current = ''; }
    else current += ch;
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

function hashId(id: string): string {
  if (!id) return '';
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = ((h << 5) - h) + id.charCodeAt(i); h |= 0; }
  return 'h_' + Math.abs(h).toString(36);
}

function emptyResult(): ParseResult {
  return { platform: 'unknown', columns: [], mapping: {}, stats: { total: 0, valid: 0, spam: 0, topLevel: 0, replies: 0, withSignals: 0, highValue: 0, duplicates: 0 }, comments: [], preview: [] };
}

export { parseFile as parseCommentFile };
