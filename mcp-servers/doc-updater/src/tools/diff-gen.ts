import { readFileSync } from "node:fs";
import { VertexAI } from "@google-cloud/vertexai";

const GCP_PROJECT = process.env.GCP_PROJECT_ID || "ai-agent-lab-yh";
const GCP_LOCATION = process.env.GCP_LOCATION || "asia-northeast1";

const vertexAI = new VertexAI({ project: GCP_PROJECT, location: GCP_LOCATION });

const gemini = vertexAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function generateUpdateDiff(
  filePath: string,
  latestInfo: string
): Promise<{ updatedContent: string; summary: string }> {
  let existingContent: string;
  try {
    existingContent = readFileSync(filePath, "utf-8");
  } catch {
    throw new Error(`ファイルを読み込めません: ${filePath}`);
  }

  const prompt = `あなたはドキュメント更新の専門家です。
既存のMarkdownドキュメントと最新情報を比較し、ドキュメントを更新してください。

## 更新ルール
1. 既存の構造・フォーマット・文体を維持する
2. 古くなった情報を最新情報で置き換える
3. 「調査日: YYYY-MM-DD」等の日付パターンを今日の日付（${new Date().toISOString().split("T")[0]}）に更新する
4. 新たに追加すべき重要情報があれば適切な場所に追加する
5. 削除すべき情報は削除する
6. 変更理由をコメントとして示す必要はない（クリーンなMarkdownのみ出力）

## 既存ドキュメント
\`\`\`markdown
${existingContent}
\`\`\`

## 最新情報
${latestInfo}

## 出力形式
以下の形式でJSON出力してください:
{
  "updatedContent": "更新後の完全なMarkdown本文",
  "summary": "変更の要約（箇条書き）"
}`;

  const result = await gemini.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const responseText =
    result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // JSONブロックを抽出
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
    responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Geminiからの応答をパースできませんでした");
  }

  const jsonStr = jsonMatch[1] ?? jsonMatch[0];
  let parsed: { updatedContent: string; summary: string };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`JSONパースエラー: ${jsonStr.slice(0, 200)}`);
  }

  return {
    updatedContent: parsed.updatedContent,
    summary: parsed.summary,
  };
}
