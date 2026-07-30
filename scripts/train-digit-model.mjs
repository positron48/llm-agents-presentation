import { writeFile } from "node:fs/promises";
import path from "node:path";

const patterns = [
  "111101101101111",
  "010110010010111",
  "111001111100111",
  "111001111001111",
  "101101111001001",
  "111100111001111",
  "111100111101111",
  "111001001001001",
  "111101111101111",
  "111101111001111",
].map((pattern) => [...pattern].map(Number));

let seed = 42731;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

function normal(scale = 1) {
  const u = Math.max(random(), 1e-9);
  const v = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * scale;
}

function noisySample(pattern, label, forceClean = false) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const sample = pattern.slice();
    const flips = forceClean
      ? 0
      : random() < 0.68
        ? 1
        : random() < 0.9
          ? 2
          : 0;
    for (let i = 0; i < flips; i += 1) {
      const index = Math.floor(random() * sample.length);
      sample[index] = sample[index] ? 0 : 1;
    }
    const collides = patterns.some(
      (candidate, candidateLabel) =>
        candidateLabel !== label &&
        candidate.every((value, index) => value === sample[index]),
    );
    if (!collides) return sample;
  }
  return pattern.slice();
}

const inputSize = 15;
const hiddenSize = 24;
const outputSize = 10;
const w1 = Array.from({ length: hiddenSize }, () =>
  Array.from({ length: inputSize }, () => normal(0.2)),
);
const b1 = Array(hiddenSize).fill(0);
const w2 = Array.from({ length: outputSize }, () =>
  Array.from({ length: hiddenSize }, () => normal(0.2)),
);
const b2 = Array(outputSize).fill(0);

function forward(input) {
  const hidden = w1.map((row, i) => {
    const sum = row.reduce((acc, weight, j) => acc + weight * input[j], b1[i]);
    return Math.tanh(sum);
  });
  const logits = w2.map((row, i) =>
    row.reduce((acc, weight, j) => acc + weight * hidden[j], b2[i]),
  );
  const max = Math.max(...logits);
  const exps = logits.map((value) => Math.exp(value - max));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return { hidden, probabilities: exps.map((value) => value / total) };
}

let learningRate = 0.025;
for (let epoch = 0; epoch < 420; epoch += 1) {
  for (let step = 0; step < 800; step += 1) {
    const label = step % 10;
    const input = noisySample(patterns[label], label, step % 4 === 0);
    const { hidden, probabilities } = forward(input);
    const outputGradient = probabilities.slice();
    outputGradient[label] -= 1;

    const hiddenGradient = Array(hiddenSize).fill(0);
    for (let output = 0; output < outputSize; output += 1) {
      for (let hiddenIndex = 0; hiddenIndex < hiddenSize; hiddenIndex += 1) {
        hiddenGradient[hiddenIndex] +=
          w2[output][hiddenIndex] * outputGradient[output];
        w2[output][hiddenIndex] -=
          learningRate * outputGradient[output] * hidden[hiddenIndex];
      }
      b2[output] -= learningRate * outputGradient[output];
    }

    for (let hiddenIndex = 0; hiddenIndex < hiddenSize; hiddenIndex += 1) {
      const gradient =
        hiddenGradient[hiddenIndex] *
        (1 - hidden[hiddenIndex] * hidden[hiddenIndex]);
      for (let inputIndex = 0; inputIndex < inputSize; inputIndex += 1) {
        w1[hiddenIndex][inputIndex] -=
          learningRate * gradient * input[inputIndex];
      }
      b1[hiddenIndex] -= learningRate * gradient;
    }
  }
  if (epoch === 240) {
    learningRate *= 0.45;
  }
}

function predict(input) {
  const { probabilities } = forward(input);
  return probabilities.indexOf(Math.max(...probabilities));
}

const cleanAccuracy =
  patterns.filter((pattern, label) => predict(pattern) === label).length / 10;
const cleanPredictions = patterns.map((pattern) => predict(pattern));
let noisyCorrect = 0;
let noisyTotal = 0;
for (let label = 0; label < patterns.length; label += 1) {
  for (let bit = 0; bit < inputSize; bit += 1) {
    const input = patterns[label].slice();
    input[bit] = input[bit] ? 0 : 1;
    noisyCorrect += Number(predict(input) === label);
    noisyTotal += 1;
  }
}

const model = {
  architecture: [inputSize, hiddenSize, outputSize],
  activation: "tanh",
  patterns,
  weights: { w1, b1, w2, b2 },
  metrics: {
    cleanAccuracy,
    oneBitAccuracy: noisyCorrect / noisyTotal,
  },
};

if (cleanAccuracy < 1 || model.metrics.oneBitAccuracy < 0.85) {
  throw new Error(
    `Digit model quality is too low: clean=${cleanAccuracy}, oneBit=${model.metrics.oneBitAccuracy}, predictions=${cleanPredictions.join(",")}`,
  );
}

const outputPath = path.resolve(
  import.meta.dirname,
  "..",
  "content",
  "digit-model.json",
);
await writeFile(outputPath, `${JSON.stringify(model)}\n`);
console.log(
  `Digit model: clean ${(cleanAccuracy * 100).toFixed(0)}%, one-bit ${(model.metrics.oneBitAccuracy * 100).toFixed(1)}%`,
);
