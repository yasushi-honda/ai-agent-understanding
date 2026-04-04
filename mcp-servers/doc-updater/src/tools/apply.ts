import { readFileSync, writeFileSync } from "node:fs";

export interface ApplyResult {
  dryRun: boolean;
  filePath: string;
  preview: string;
  written: boolean;
  message: string;
}

export function applyDocUpdate(
  filePath: string,
  updatedContent: string,
  dryRun: boolean = true
): ApplyResult {
  if (dryRun) {
    return {
      dryRun: true,
      filePath,
      preview: updatedContent,
      written: false,
      message: `[DRY RUN] ${filePath} への変更プレビュー（実際には書き込まれていません）`,
    };
  }

  // 現在の内容を確認
  let currentContent: string;
  try {
    currentContent = readFileSync(filePath, "utf-8");
  } catch {
    throw new Error(`ファイルを読み込めません: ${filePath}`);
  }

  if (currentContent === updatedContent) {
    return {
      dryRun: false,
      filePath,
      preview: updatedContent,
      written: false,
      message: "変更なし（内容が同一です）",
    };
  }

  writeFileSync(filePath, updatedContent, "utf-8");

  return {
    dryRun: false,
    filePath,
    preview: updatedContent,
    written: true,
    message: `${filePath} を更新しました`,
  };
}
