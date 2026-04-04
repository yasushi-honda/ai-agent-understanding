import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const STALENESS_DAYS = 30;

// 「調査日: YYYY-MM-DD」「Updated: YYYY-MM-DD」等のパターン
const DATE_PATTERNS = [
  /調査日[：:]\s*(\d{4}-\d{2}-\d{2})/,
  /Updated[：:]\s*(\d{4}-\d{2}-\d{2})/,
  /最終更新[：:]\s*(\d{4}-\d{2}-\d{2})/,
  /Last updated[：:]\s*(\d{4}-\d{2}-\d{2})/i,
];

interface FreshnessEntry {
  path: string;
  date: string | null;
  daysOld: number | null;
  stale: boolean;
  reason: string;
}

function walkMarkdown(dir: string): string[] {
  const files: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        files.push(...walkMarkdown(fullPath));
      } else if (entry.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  } catch {
    // ディレクトリが存在しない場合は空を返す
  }
  return files;
}

function extractDate(content: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = content.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function checkDocFreshness(docsDir: string): {
  summary: string;
  staleFiles: FreshnessEntry[];
  allFiles: FreshnessEntry[];
} {
  const files = walkMarkdown(docsDir);
  const allFiles: FreshnessEntry[] = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    const date = extractDate(content);
    const relPath = relative(docsDir, filePath);

    if (date === null) {
      allFiles.push({
        path: relPath,
        date: null,
        daysOld: null,
        stale: false,
        reason: "日付情報なし",
      });
    } else {
      const daysOld = daysSince(date);
      const stale = daysOld >= STALENESS_DAYS;
      allFiles.push({
        path: relPath,
        date,
        daysOld,
        stale,
        reason: stale ? `${daysOld}日経過（${STALENESS_DAYS}日以上）` : `${daysOld}日経過（新鮮）`,
      });
    }
  }

  const staleFiles = allFiles.filter((f) => f.stale);

  return {
    summary: `全${allFiles.length}ファイル中、${staleFiles.length}ファイルが${STALENESS_DAYS}日以上更新なし`,
    staleFiles,
    allFiles,
  };
}
