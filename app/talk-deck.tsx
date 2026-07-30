"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import digitModel from "@/content/digit-model.json";
import tokenSamples from "@/content/token-samples.json";
import { citationIds, renderMarkdown, type Reference } from "./lib/markdown";

type Slide = {
  id: string;
  section: string;
  kicker: string;
  title: string;
  subtitle?: string;
  visual: string;
  minutes: number;
  body: string;
  notes: string;
};

type TalkDeckProps = {
  slides: readonly Slide[];
  references: readonly Reference[];
  totalMinutes: number;
  initialMode?: "slides" | "read";
  initialSlideId?: string;
};

const pollData = [
  ["Что такое LLM", 40],
  ["Возможности моделей", 32],
  ["Контекст, токены, модель, effort", 52],
  ["Как выбрать model и effort", 68],
  ["Чат и агенты не только для разработчиков", 72],
  ["Куда движется индустрия", 64],
] as const;

const generationSteps = [
  {
    context: "Агент",
    options: [["может", 0.58], ["—", 0.16], ["умеет", 0.13], ["будет", 0.08]],
  },
  {
    context: "Агент может",
    options: [["читать", 0.44], ["выполнять", 0.24], ["использовать", 0.2], ["ответить", 0.07]],
  },
  {
    context: "Агент может читать",
    options: [["файлы", 0.61], ["документы", 0.18], ["код", 0.13], ["экран", 0.05]],
  },
  {
    context: "Агент может читать файлы",
    options: [["и", 0.67], [",", 0.15], [".", 0.1], ["проекта", 0.05]],
  },
  {
    context: "Агент может читать файлы и",
    options: [["действовать", 0.48], ["запускать", 0.28], ["проверять", 0.15], ["писать", 0.06]],
  },
] as const;

function HtmlCopy({
  markdown,
  references,
  className = "",
}: {
  markdown: string;
  references: readonly Reference[];
  className?: string;
}) {
  const html = useMemo(
    () => renderMarkdown(markdown, references),
    [markdown, references],
  );
  return (
    <div
      className={`markdown-copy ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function HeroVisual() {
  return (
    <div className="hero-visual" aria-label="Путь от модели к действию">
      <div className="hero-orbit hero-orbit-one" />
      <div className="hero-orbit hero-orbit-two" />
      <div className="hero-word hero-word-model">MODEL</div>
      <div className="hero-arrow">→</div>
      <div className="hero-word hero-word-tool">TOOLS</div>
      <div className="hero-arrow">→</div>
      <div className="hero-word hero-word-action">ACTION</div>
    </div>
  );
}

function SurveyVisual() {
  return (
    <div className="survey-chart" aria-label="Результаты опроса аудитории">
      {pollData.map(([label, value]) => (
        <div className="survey-row" key={label}>
          <div className="survey-label">
            <span>{label}</span>
            <strong>{value}%</strong>
          </div>
          <div className="survey-track">
            <div className="survey-fill" style={{ width: `${value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function NeuronLab() {
  const [gate, setGate] = useState<"AND" | "OR" | "NOT" | "XOR">("AND");
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const output =
    gate === "AND"
      ? a && b
      : gate === "OR"
        ? a || b
        : gate === "NOT"
          ? !a
          : Boolean(a !== b);
  const weights =
    gate === "AND"
      ? ["w₁ = 1", "w₂ = 1", "b = −1.5"]
      : gate === "OR"
        ? ["w₁ = 1", "w₂ = 1", "b = −0.5"]
        : gate === "NOT"
          ? ["w₁ = −1", "b = 0.5"]
          : ["одной границы", "недостаточно"];

  return (
    <div className="neuron-lab">
      <div className="segmented" aria-label="Логическая функция">
        {(["AND", "OR", "NOT", "XOR"] as const).map((item) => (
          <button
            className={gate === item ? "is-active" : ""}
            key={item}
            onClick={() => setGate(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <div className="neuron-stage">
        <div className="binary-inputs">
          <button type="button" onClick={() => setA(a ? 0 : 1)}>
            x₁ <strong>{a}</strong>
          </button>
          {gate !== "NOT" && (
            <button type="button" onClick={() => setB(b ? 0 : 1)}>
              x₂ <strong>{b}</strong>
            </button>
          )}
        </div>
        <div className="signal-lines">
          <i />
          {gate !== "NOT" && <i />}
        </div>
        <div className={`neuron-node ${gate === "XOR" ? "is-impossible" : ""}`}>
          <span>Σ</span>
          <small>{weights.join(" · ")}</small>
        </div>
        <div className="signal-line-out" />
        <div className={`binary-output ${output ? "is-on" : ""}`}>
          y <strong>{Number(output)}</strong>
        </div>
      </div>
      <p className="lab-caption">
        {gate === "XOR"
          ? "XOR нельзя реализовать одним линейным нейроном — нужен скрытый слой."
          : "Нажмите на входы: веса и смещение задают логическую функцию."}
      </p>
    </div>
  );
}

function inferDigit(input: number[]) {
  const { w1, b1, w2, b2 } = digitModel.weights;
  const hidden = w1.map((row, index) => {
    const value = row.reduce(
      (sum, weight, inputIndex) => sum + weight * input[inputIndex],
      b1[index],
    );
    return Math.tanh(value);
  });
  const logits = w2.map((row, index) =>
    row.reduce(
      (sum, weight, hiddenIndex) => sum + weight * hidden[hiddenIndex],
      b2[index],
    ),
  );
  const max = Math.max(...logits);
  const exps = logits.map((value) => Math.exp(value - max));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
}

function DigitLab() {
  const [pixels, setPixels] = useState<number[]>(() =>
    digitModel.patterns[8].slice(),
  );
  const probabilities = useMemo(() => inferDigit(pixels), [pixels]);
  const best = probabilities.indexOf(Math.max(...probabilities));
  const ordered = probabilities
    .map((value, digit) => ({ value, digit }))
    .sort((left, right) => right.value - left.value);

  return (
    <div className="digit-lab">
      <div className="pixel-panel">
        <div className="pixel-grid" aria-label="Поле для рисования цифры">
          {pixels.map((value, index) => (
            <button
              aria-label={`Пиксель ${index + 1}: ${value ? "включён" : "выключен"}`}
              aria-pressed={Boolean(value)}
              className={value ? "is-on" : ""}
              key={index}
              onClick={() =>
                setPixels((current) =>
                  current.map((pixel, pixelIndex) =>
                    pixelIndex === index ? Number(!pixel) : pixel,
                  ),
                )
              }
              type="button"
            />
          ))}
        </div>
        <div className="digit-actions">
          <button type="button" onClick={() => setPixels(Array(15).fill(0))}>
            Очистить
          </button>
          <select
            aria-label="Загрузить пример цифры"
            value={best}
            onChange={(event) =>
              setPixels(digitModel.patterns[Number(event.target.value)].slice())
            }
          >
            {digitModel.patterns.map((_, digit) => (
              <option value={digit} key={digit}>
                Пример {digit}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="probability-panel">
        <div className="prediction">
          <span>Сеть видит</span>
          <strong>{best}</strong>
          <small>{Math.round(probabilities[best] * 100)}% уверенности</small>
        </div>
        <div className="probability-list">
          {ordered.slice(0, 5).map(({ value, digit }) => (
            <div className="probability-row" key={digit}>
              <span>{digit}</span>
              <div>
                <i style={{ width: `${Math.max(2, value * 100)}%` }} />
              </div>
              <small>{Math.round(value * 100)}%</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TokenLab() {
  const [selected, setSelected] = useState(tokenSamples[0].id);
  const sample =
    tokenSamples.find((candidate) => candidate.id === selected) ?? tokenSamples[0];
  return (
    <div className="token-lab">
      <div className="segmented">
        {tokenSamples.map((candidate) => (
          <button
            className={candidate.id === selected ? "is-active" : ""}
            key={candidate.id}
            onClick={() => setSelected(candidate.id)}
            type="button"
          >
            {candidate.label}
          </button>
        ))}
      </div>
      <div className="token-source">{sample.text}</div>
      <div className="token-stream">
        {sample.tokens.map((token, index) => (
          <span className={`token-chip token-color-${index % 5}`} key={`${token.id}-${index}`}>
            <b>{token.text.replaceAll(" ", "·") || "∅"}</b>
            <small>{token.id}</small>
          </span>
        ))}
      </div>
      <p className="lab-caption">
        {sample.tokens.length} токенов · OpenAI <code>o200k_base</code>
      </p>
    </div>
  );
}

function EmbeddingVisual() {
  const points = [
    ["банк", 22, 32, "a"],
    ["кредит", 31, 20, "a"],
    ["деньги", 37, 38, "a"],
    ["река", 72, 67, "b"],
    ["берег", 82, 56, "b"],
    ["вода", 65, 51, "b"],
    ["код", 64, 19, "c"],
    ["функция", 79, 27, "c"],
  ] as const;
  return (
    <div className="embedding-map" role="img" aria-label="Проекция векторного пространства">
      <div className="axis axis-x" />
      <div className="axis axis-y" />
      {points.map(([label, x, y, cluster]) => (
        <span
          className={`embedding-point cluster-${cluster}`}
          key={label}
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          {label}
        </span>
      ))}
      <div className="map-note">2D-проекция многомерного пространства</div>
    </div>
  );
}

function TransformerVisual() {
  return (
    <div className="scale-comparison">
      <div className="scale-card scale-toy">
        <span>Игрушечная сеть</span>
        <strong>15 → 24 → 10</strong>
        <small>≈ 634 параметра</small>
        <div className="mini-network">
          {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
        </div>
      </div>
      <div className="scale-symbol">× 276 000 000</div>
      <div className="scale-card scale-gpt">
        <span>GPT‑3 175B</span>
        <strong>96 слоёв</strong>
        <small>hidden size 12 288</small>
        <div className="layer-stack">
          {Array.from({ length: 12 }, (_, index) => (
            <i style={{ "--layer": index } as CSSProperties} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GenerationLab() {
  const [step, setStep] = useState(0);
  const [temperature, setTemperature] = useState(0.8);
  const data = generationSteps[step];
  const adjusted = useMemo(() => {
    const logits = data.options.map(([, probability]) =>
      Math.log(probability) / temperature,
    );
    const exps = logits.map(Math.exp);
    const total = exps.reduce((sum, value) => sum + value, 0);
    return data.options.map(([token], index) => [token, exps[index] / total] as const);
  }, [data, temperature]);
  return (
    <div className="generation-lab">
      <div className="generated-context">
        {data.context}
        <span className="cursor-block" />
      </div>
      <div className="generation-options">
        {adjusted.map(([token, probability], index) => (
          <button
            type="button"
            className={index === 0 ? "is-best" : ""}
            key={token}
            onClick={() => setStep((current) => Math.min(generationSteps.length - 1, current + 1))}
          >
            <span>{token}</span>
            <i style={{ width: `${probability * 100}%` }} />
            <small>{Math.round(probability * 100)}%</small>
          </button>
        ))}
      </div>
      <div className="temperature-control">
        <label htmlFor="temperature">temperature {temperature.toFixed(1)}</label>
        <input
          id="temperature"
          type="range"
          min="0.3"
          max="1.5"
          step="0.1"
          value={temperature}
          onChange={(event) => setTemperature(Number(event.target.value))}
        />
        <button type="button" onClick={() => setStep(step === generationSteps.length - 1 ? 0 : step + 1)}>
          Следующий токен
        </button>
      </div>
    </div>
  );
}

function ContextVisual() {
  const parts = [
    ["System", 12],
    ["Tools", 22],
    ["История", 26],
    ["Файлы", 25],
    ["Ответ", 15],
  ] as const;
  return (
    <div className="context-visual">
      <div className="context-window">
        {parts.map(([label, width], index) => (
          <div
            className={`context-part context-part-${index}`}
            key={label}
            style={{ width: `${width}%` }}
          >
            <span>{label}</span>
            <small>{width}%</small>
          </div>
        ))}
      </div>
      <div className="context-equation">
        <span>временно</span>
        <strong>≠</strong>
        <span>обучение</span>
        <strong>≠</strong>
        <span>память навсегда</span>
      </div>
    </div>
  );
}

function CapabilitiesVisual() {
  return (
    <div className="capability-grid">
      <div className="medal-card silver">
        <span>IMO · 2024</span>
        <strong>СЕРЕБРО</strong>
        <small>AlphaProof + AlphaGeometry 2</small>
      </div>
      <div className="medal-arrow">→</div>
      <div className="medal-card gold">
        <span>IMO · 2025</span>
        <strong>ЗОЛОТО</strong>
        <small>Gemini Deep Think</small>
      </div>
      <div className="jagged-card">
        <span>Jagged frontier</span>
        <div className="jagged-line">
          <i /><i /><i /><i /><i /><i />
        </div>
        <small>Сложнейшая математика рядом с простыми ошибками</small>
      </div>
    </div>
  );
}

function TrainingVisual() {
  const stages = [
    ["01", "Pretraining", "продолжать"],
    ["02", "Instruction tuning", "отвечать"],
    ["03", "Preferences + safety", "сотрудничать"],
    ["04", "Tool-use training", "действовать"],
  ];
  return (
    <div className="training-stages">
      {stages.map(([number, title, verb]) => (
        <div className="training-stage" key={number}>
          <span>{number}</span>
          <strong>{title}</strong>
          <small>{verb}</small>
        </div>
      ))}
    </div>
  );
}

function ToolsVisual() {
  return (
    <div className="tool-loop" role="img" aria-label="Цикл вызова инструментов">
      <div className="loop-node loop-model">
        <small>1 · решить</small>
        <strong>MODEL</strong>
      </div>
      <div className="loop-edge edge-one">tool call →</div>
      <div className="loop-node loop-harness">
        <small>2 · проверить</small>
        <strong>HARNESS</strong>
      </div>
      <div className="loop-edge edge-two">execute →</div>
      <div className="loop-node loop-tool">
        <small>3 · выполнить</small>
        <strong>TOOL</strong>
      </div>
      <div className="loop-return">← результат возвращается в контекст</div>
    </div>
  );
}

function HarnessVisual() {
  const rows = [
    ["История диалога", true, true, true],
    ["Поиск и Python", false, true, true],
    ["Файлы проекта", false, false, true],
    ["Терминал и тесты", false, false, true],
    ["Длинный цикл", false, "частично", true],
    ["Риск действий", "низкий", "средний", "высокий"],
  ];
  return (
    <div className="harness-table-wrap">
      <table className="harness-table">
        <thead>
          <tr><th /><th>Чат</th><th>Чат + tools</th><th>Агентская IDE</th></tr>
        </thead>
        <tbody>
          {rows.map(([label, ...values]) => (
            <tr key={String(label)}>
              <th>{label}</th>
              {values.map((value, index) => (
                <td key={index} className={value === true ? "yes" : value === false ? "no" : ""}>
                  {value === true ? "●" : value === false ? "—" : value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EffortVisual() {
  return (
    <div className="effort-map">
      <div className="effort-axis effort-axis-y"><span>способности модели ↑</span></div>
      <div className="effort-axis effort-axis-x"><span>объём работы / effort →</span></div>
      <div className="effort-curve curve-small"><span>быстрая модель</span></div>
      <div className="effort-curve curve-frontier"><span>frontier-модель</span></div>
      <div className="effort-dot dot-low"><b>low</b></div>
      <div className="effort-dot dot-high"><b>high</b></div>
      <div className="effort-note">Схема, не benchmark</div>
    </div>
  );
}

function ChooserLab() {
  const [task, setTask] = useState("routine");
  const [risk, setRisk] = useState("medium");
  const [latency, setLatency] = useState("normal");
  const result = useMemo(() => {
    const hard = task === "architecture" || task === "research";
    const highRisk = risk === "high";
    return {
      model: hard || highRisk ? "Frontier" : task === "routine" ? "Fast" : "Balanced",
      effort:
        highRisk || task === "research"
          ? "high"
          : task === "routine" || latency === "fast"
            ? "low"
            : "medium",
      check:
        highRisk ? "Независимая проверка обязательна" : "Автотест или выборочная проверка",
    };
  }, [task, risk, latency]);
  return (
    <div className="chooser-lab">
      <div className="chooser-controls">
        <label>
          Тип задачи
          <select value={task} onChange={(event) => setTask(event.target.value)}>
            <option value="routine">Рутинное изменение</option>
            <option value="analysis">Анализ и объяснение</option>
            <option value="architecture">Архитектурное решение</option>
            <option value="research">Исследование с неизвестными</option>
          </select>
        </label>
        <label>
          Цена ошибки
          <select value={risk} onChange={(event) => setRisk(event.target.value)}>
            <option value="low">Низкая</option>
            <option value="medium">Средняя</option>
            <option value="high">Высокая</option>
          </select>
        </label>
        <label>
          Приоритет
          <select value={latency} onChange={(event) => setLatency(event.target.value)}>
            <option value="fast">Скорость</option>
            <option value="normal">Баланс</option>
            <option value="quality">Качество</option>
          </select>
        </label>
      </div>
      <div className="chooser-result">
        <div><span>Model</span><strong>{result.model}</strong></div>
        <div><span>Effort</span><strong>{result.effort}</strong></div>
        <p>{result.check}</p>
      </div>
    </div>
  );
}

function SetupVisual() {
  const layers = [
    ["IDE", "PhpStorm", "центр разработки"],
    ["Agent", "Codex", "план → действия → проверка"],
    ["Model", "GPT‑5.6 Sol · high", "сложные длинные задачи"],
    ["Context", "repos · memory", "актуальные данные и решения"],
    ["Extensions", "skills · MCP · plugins", "повторяемые workflow"],
    ["Tools", "terminal · browser · computer use", "воздействие на среду"],
  ];
  return (
    <div className="setup-stack">
      {layers.map(([kind, title, note], index) => (
        <div className="setup-layer" key={kind} style={{ "--index": index } as CSSProperties}>
          <span>{kind}</span><strong>{title}</strong><small>{note}</small>
        </div>
      ))}
      <div className="setup-side-note">Cursor · дополнительная агентская IDE</div>
    </div>
  );
}

function TrajectoryVisual() {
  return (
    <div className="trajectory">
      <div className="trajectory-line" />
      <div className="trajectory-point point-2024">
        <b>2024</b><strong>IMO silver</strong><small>формальные системы</small>
      </div>
      <div className="trajectory-point point-2025">
        <b>2025</b><strong>IMO gold</strong><small>естественный язык</small>
      </div>
      <div className="trajectory-point point-2026">
        <b>2026</b><strong>длинные задачи</strong><small>агенты + harness</small>
      </div>
      <div className="trajectory-label">горизонт самостоятельной работы →</div>
    </div>
  );
}

function SkillsVisual() {
  const skills = [
    ["01", "Постановка задачи", "цель, ограничения, критерий готовности"],
    ["02", "Доменная глубина", "понимать, где правдоподобие недостаточно"],
    ["03", "Контекст", "давать данные, а не надеяться на память модели"],
    ["04", "Evals и проверка", "измерять результат, ловить регрессии"],
    ["05", "Безопасность", "права, секреты, границы автономности"],
    ["06", "Продуктовое мышление", "выбирать, какую проблему вообще решать"],
  ];
  return (
    <div className="skills-grid">
      {skills.map(([number, title, note]) => (
        <div className="skill-item" key={number}>
          <span>{number}</span><strong>{title}</strong><small>{note}</small>
        </div>
      ))}
    </div>
  );
}

function FinalVisual() {
  const parts = ["MODEL", "CONTEXT", "TOOLS", "LOOP", "PERMISSIONS", "VERIFICATION"];
  return (
    <div className="final-formula">
      {parts.map((part, index) => (
        <div key={part}>
          {index > 0 && <span>+</span>}
          <strong>{part}</strong>
        </div>
      ))}
      <div className="formula-result">= AGENT</div>
    </div>
  );
}

function Visual({ name }: { name: string }) {
  switch (name) {
    case "hero": return <HeroVisual />;
    case "survey": return <SurveyVisual />;
    case "neuron": return <NeuronLab />;
    case "digit": return <DigitLab />;
    case "tokens": return <TokenLab />;
    case "embeddings": return <EmbeddingVisual />;
    case "transformer": return <TransformerVisual />;
    case "generation": return <GenerationLab />;
    case "context": return <ContextVisual />;
    case "capabilities": return <CapabilitiesVisual />;
    case "training": return <TrainingVisual />;
    case "tools": return <ToolsVisual />;
    case "harness": return <HarnessVisual />;
    case "effort": return <EffortVisual />;
    case "chooser": return <ChooserLab />;
    case "setup": return <SetupVisual />;
    case "trajectory": return <TrajectoryVisual />;
    case "skills": return <SkillsVisual />;
    case "final": return <FinalVisual />;
    default: return null;
  }
}

function SourceList({
  slide,
  references,
}: {
  slide: Slide;
  references: readonly Reference[];
}) {
  const ids = citationIds(`${slide.body}\n${slide.notes}`);
  if (!ids.length) return null;
  return (
    <div className="slide-sources" aria-label="Источники слайда">
      {ids.map((id) => {
        const reference = references.find((candidate) => candidate.id === id);
        if (!reference) return null;
        return (
          <a href={reference.url} target="_blank" rel="noreferrer" key={id}>
            [{id}] <span>{reference.publisher}</span>
          </a>
        );
      })}
    </div>
  );
}

export default function TalkDeck({
  slides,
  references,
  totalMinutes,
  initialMode = "slides",
  initialSlideId,
}: TalkDeckProps) {
  const [mode, setMode] = useState<"slides" | "read">(initialMode);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const index = slides.findIndex((slide) => slide.id === initialSlideId);
    return index >= 0 ? index : 0;
  });
  const [overview, setOverview] = useState(false);

  const updateUrl = useCallback(
    (nextMode: "slides" | "read", nextIndex: number) => {
      const params = new URLSearchParams(window.location.search);
      if (nextMode === "read") params.set("mode", "read");
      else params.delete("mode");
      params.set("slide", slides[nextIndex].id);
      window.history.replaceState(null, "", `?${params.toString()}`);
    },
    [slides],
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      const bounded = Math.max(0, Math.min(slides.length - 1, nextIndex));
      setCurrentIndex(bounded);
      setOverview(false);
      updateUrl(mode, bounded);
    },
    [mode, slides.length, updateUrl],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, select, textarea, button")) return;
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        goTo(currentIndex + 1);
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goTo(currentIndex - 1);
      }
      if (event.key.toLowerCase() === "o") setOverview((current) => !current);
      if (event.key.toLowerCase() === "r") {
        const nextMode = mode === "slides" ? "read" : "slides";
        setMode(nextMode);
        updateUrl(nextMode, currentIndex);
      }
      if (event.key === "Escape") setOverview(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentIndex, goTo, mode, updateUrl]);

  const toggleMode = () => {
    const nextMode = mode === "slides" ? "read" : "slides";
    setMode(nextMode);
    setOverview(false);
    updateUrl(nextMode, currentIndex);
  };

  if (mode === "read") {
    return (
      <main className="reading-mode">
        <header className="reading-header">
          <a className="brand" href="?slide=cover">LLM / AGENTS</a>
          <button type="button" onClick={toggleMode}>Режим презентации</button>
        </header>
        <section className="reading-hero">
          <span>Текст доклада · {totalMinutes} минут · {slides.length} слайдов</span>
          <h1>От нейрона к агенту</h1>
          <p>Как устроены LLM, почему agent — это больше, чем модель, и как выбирать инструменты под задачу.</p>
        </section>
        <nav className="reading-toc" aria-label="Содержание">
          {slides.map((slide, index) => (
            <a href={`#${slide.id}`} key={slide.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>{slide.title}
            </a>
          ))}
        </nav>
        <div className="reading-content">
          {slides.map((slide, index) => (
            <article className="reading-slide" id={slide.id} key={slide.id}>
              <div className="reading-slide-heading">
                <span>{String(index + 1).padStart(2, "0")} · {slide.section}</span>
                <h2>{slide.title}</h2>
                {slide.subtitle && <p>{slide.subtitle}</p>}
              </div>
              <div className="reading-visual"><Visual name={slide.visual} /></div>
              <HtmlCopy markdown={slide.body} references={references} />
              <HtmlCopy markdown={slide.notes} references={references} className="speaker-copy" />
              <SourceList slide={slide} references={references} />
            </article>
          ))}
        </div>
        <section className="bibliography" id="sources">
          <span>Библиография</span>
          <h2>Источники</h2>
          <ol>
            {references.map((reference) => (
              <li key={reference.id}>
                <a href={reference.url} target="_blank" rel="noreferrer">
                  <b>[{reference.id}]</b> {reference.title}
                </a>
                <small>{reference.publisher} · {reference.year}</small>
              </li>
            ))}
          </ol>
        </section>
      </main>
    );
  }

  const slide = slides[currentIndex];
  return (
    <main className="presentation-mode">
      <header className="deck-header">
        <button className="brand" type="button" onClick={() => goTo(0)}>LLM / AGENTS</button>
        <div className="deck-meta">
          <span>{slide.section}</span>
          <button type="button" onClick={() => setOverview((current) => !current)}>Обзор</button>
          <button type="button" onClick={toggleMode}>Читать текст</button>
        </div>
      </header>
      <article className="slide" key={slide.id}>
        <div className="slide-copy">
          <div className="slide-kicker">{slide.kicker}</div>
          <h1>{slide.title}</h1>
          {slide.subtitle && <p className="slide-subtitle">{slide.subtitle}</p>}
          <HtmlCopy markdown={slide.body} references={references} />
          <SourceList slide={slide} references={references} />
        </div>
        <div className="slide-visual"><Visual name={slide.visual} /></div>
      </article>
      <footer className="deck-footer">
        <button
          type="button"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          aria-label="Предыдущий слайд"
        >
          ←
        </button>
        <div className="deck-progress">
          <div><i style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }} /></div>
          <span>{String(currentIndex + 1).padStart(2, "0")} / {slides.length}</span>
        </div>
        <button
          type="button"
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === slides.length - 1}
          aria-label="Следующий слайд"
        >
          →
        </button>
      </footer>
      {overview && (
        <div className="overview-backdrop">
          <div className="overview-panel" role="dialog" aria-modal="true" aria-label="Обзор слайдов">
            <div className="overview-heading">
              <div><span>Маршрут доклада</span><strong>{slides.length} слайдов · {totalMinutes} минут</strong></div>
              <button type="button" onClick={() => setOverview(false)}>Закрыть</button>
            </div>
            <div className="overview-grid">
              {slides.map((candidate, index) => (
                <button
                  type="button"
                  className={index === currentIndex ? "is-current" : ""}
                  onClick={() => goTo(index)}
                  key={candidate.id}
                >
                  <span>{String(index + 1).padStart(2, "0")} · {candidate.section}</span>
                  <strong>{candidate.title}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
