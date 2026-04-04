import { VertexAI } from "@google-cloud/vertexai";

const GCP_PROJECT = process.env.GCP_PROJECT_ID || "ai-agent-lab-yh";
const GCP_LOCATION = process.env.GCP_LOCATION || "asia-northeast1";

const vertexAI = new VertexAI({ project: GCP_PROJECT, location: GCP_LOCATION });

// Google Search Grounding 付きモデル
const geminiWithSearch = vertexAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [{ googleSearchRetrieval: {} }],
});

// フォールバック用（Grounding なし）
const geminiPlain = vertexAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

interface SearchResult {
  answer: string;
  sources: string[];
  groundingUsed: boolean;
}

export async function searchLatestInfo(
  topic: string,
  context?: string
): Promise<SearchResult> {
  const prompt = context
    ? `以下のトピックについて最新情報を日本語で詳しく調査してください。\n\nトピック: ${topic}\n\nコンテキスト: ${context}\n\n特に最新の仕様変更、新機能、非推奨化、ベストプラクティスの変化について報告してください。`
    : `以下のトピックについて最新情報を日本語で詳しく調査してください。\n\nトピック: ${topic}\n\n特に最新の仕様変更、新機能、非推奨化、ベストプラクティスの変化について報告してください。`;

  // まず Google Search Grounding で試みる
  try {
    const result = await geminiWithSearch.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const answer =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "情報を取得できませんでした。";

    // Grounding メタデータからソースURLを抽出
    const groundingMeta =
      result.response.candidates?.[0]?.groundingMetadata;
    const sources: string[] = [];
    if (groundingMeta?.groundingChunks) {
      for (const chunk of groundingMeta.groundingChunks) {
        if (chunk.web?.uri) sources.push(chunk.web.uri);
      }
    }

    return { answer, sources, groundingUsed: true };
  } catch (err) {
    // Grounding が利用できない場合は通常生成にフォールバック
    console.error("Google Search Grounding failed, falling back:", err);

    const result = await geminiPlain.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const answer =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "情報を取得できませんでした。";

    return { answer, sources: [], groundingUsed: false };
  }
}
