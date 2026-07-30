import { writeFile } from "node:fs/promises";
import path from "node:path";
import { getEncoding } from "js-tiktoken";

const encoder = getEncoding("o200k_base");
const samples = [
  {
    id: "en",
    label: "English",
    text: "An agent turns a language model into a system that can act.",
  },
  {
    id: "ru",
    label: "Русский",
    text: "Агент превращает языковую модель в систему, способную действовать.",
  },
  {
    id: "code",
    label: "Код",
    text: "const answer = await agent.run({ effort: \"high\" });",
  },
].map((sample) => {
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
