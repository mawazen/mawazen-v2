import fs from "fs";
import path from "path";
import { upsertLegalSourceDocument, replaceLegalChunksForDocument } from "../db";

async function main() {
  const filePath = process.argv[2] ?? path.join(process.cwd(), "data_dump_v2.sql");
  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, "utf8");

  // Very naive SQL split by semicolon at end of INSERT statements
  const statements = content
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  let currentDocId: number | null = null;
  let currentChunks: Array<{ chunkIndex: number; text: string; metaJson?: string }> = [];
  let chunkIndex = 0;

  for (const stmt of statements) {
    if (stmt.startsWith("INSERT INTO laws")) {
      // flush previous law
      if (currentDocId !== null) {
        await replaceLegalChunksForDocument({ documentId: currentDocId, chunks: currentChunks });
      }

      const match = stmt.match(/INSERT INTO laws \(law_name, source_url\) VALUES \('([^']+)',\s*'([^']+)'/);
      if (!match) {
        console.warn("Failed to parse law INSERT:", stmt.slice(0, 120));
        continue;
      }
      const [, lawName, sourceUrl] = match;
      const docId = await upsertLegalSourceDocument({
        source: "data_dump_v2",
        url: sourceUrl,
        title: lawName,
        contentText: null,
      } as any);

      currentDocId = docId;
      currentChunks = [];
      chunkIndex = 0;
    } else if (stmt.startsWith("INSERT INTO law_articles")) {
      if (currentDocId === null) {
        console.warn("Article found before any law. Skipping.");
        continue;
      }
      const match = stmt.match(/INSERT INTO law_articles \(law_id, article_number, article_content\) VALUES \(@last_id,\s*'([^']+)',\s*'([\s\S]*)'/);
      if (!match) {
        console.warn("Failed to parse article INSERT:", stmt.slice(0, 120));
        continue;
      }
      const [, articleNumberRaw, articleContentRaw] = match;
      const articleNumber = articleNumberRaw.replace(/\\n/g, " ").trim();
      const articleContent = articleContentRaw.replace(/\\n/g, "\n").trim();

      currentChunks.push({
        chunkIndex: chunkIndex++,
        text: articleContent,
        metaJson: JSON.stringify({ articleNumber }),
      });
    }
  }
  // flush last law
  if (currentDocId !== null) {
    await replaceLegalChunksForDocument({ documentId: currentDocId, chunks: currentChunks });
  }
  console.log("Import completed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
