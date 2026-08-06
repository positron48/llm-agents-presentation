import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getEncoding } from "js-tiktoken";

const encoder = getEncoding("o200k_base");
const sourcePath = path.resolve(
  import.meta.dirname,
  "..",
  "content",
  "token-samples.ru.json",
);
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const samples = source.map((sample) => {
  const ids = encoder.encode(sample.text);
  return {
    ...sample,
    tokens: ids.map((id) => ({
      id,
      text: encoder.decode([id]),
    })),
  };
});

const outputPath = path.resolve(
  import.meta.dirname,
  "..",
  "content",
  "token-samples.json",
);
await writeFile(outputPath, `${JSON.stringify(samples, null, 2)}\n`);
console.log(`Generated ${samples.length} token samples with o200k_base`);
