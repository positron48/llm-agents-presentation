/** @jsxImportSource @/app/i18n */
"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";
import digitModel from "@/content/digit-model.json";
import tokenSamples from "@/content/token-samples.json";
import deepDive from "@/content/transformer-visuals.ru.json";
import visuals from "@/content/visuals.ru.json";
import { citationIds, renderMarkdown, type Reference } from "./lib/markdown";
import { LanguageContext } from "./i18n/context";

type Slide = {
  id: string;
  section: string;
  kicker: string;
  title?: string;
  subtitle?: string;
  visual: string;
  minutes: number;
  track?: string;
  body: string;
  notes: string;
};

type TalkDeckProps = {
  slides: readonly Slide[];
  bonusSlides: readonly Slide[];
  references: readonly Reference[];
  meta: {
    brand: string;
    title: string;
    description: string;
    kicker: string;
    totalMinutes: number;
    slideCount: number;
    bonusMinutes: number;
    bonusSlideCount: number;
  };
  initialMode?: "slides" | "read";
  initialSlideId?: string;
  language: "ru" | "en";
};

type EditableField = "kicker" | "title" | "subtitle" | "body" | "notes";

function LanguageSwitcher({ language, hrefFor }: { language: "ru" | "en"; hrefFor: (language: "ru" | "en") => string }) {
  return (
    <nav className="language-switcher" aria-label="Language">
      <a className={language === "en" ? "is-active" : ""} href={hrefFor("en")} lang="en">EN</a>
      <span aria-hidden="true">/</span>
      <a className={language === "ru" ? "is-active" : ""} href={hrefFor("ru")} lang="ru">RU</a>
    </nav>
  );
}

function htmlToMarkdown(element: HTMLElement) {
  const convert = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof HTMLElement)) return "";
    const content = Array.from(node.childNodes).map(convert).join("");
    switch (node.tagName) {
      case "STRONG":
      case "B": return `**${content}**`;
      case "CODE": return `\`${content}\``;
      case "BR": return "\n";
      case "P": return `${content}\n\n`;
      case "UL": return Array.from(node.children)
        .map((item) => `- ${Array.from(item.childNodes).map(convert).join("")}`)
        .join("\n") + "\n\n";
      case "OL": return Array.from(node.children)
        .map((item, index) => `${index + 1}. ${Array.from(item.childNodes).map(convert).join("")}`)
        .join("\n") + "\n\n";
      default: return content;
    }
  };
  return Array.from(element.childNodes).map(convert).join("").trim();
}

function EditableText({
  value,
  as: Tag,
  className,
  editing,
  onSave,
}: {
  value: string;
  as: "div" | "h1" | "h2" | "p";
  className?: string;
  editing: boolean;
  onSave: (value: string) => void;
}) {
  return (
    <Tag
      className={className}
      contentEditable={editing}
      suppressContentEditableWarning
      spellCheck={editing}
      onBlur={(event) => onSave(event.currentTarget.innerText.trim())}
    >
      {value}
    </Tag>
  );
}

function HtmlCopy({
  markdown,
  references,
  className = "",
  editing = false,
  onSave,
}: {
  markdown: string;
  references: readonly Reference[];
  className?: string;
  editing?: boolean;
  onSave?: (markdown: string) => void;
}) {
  const html = useMemo(
    () => renderMarkdown(markdown, references),
    [markdown, references],
  );
  return (
    <div
      className={`markdown-copy ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      contentEditable={editing}
      suppressContentEditableWarning
      spellCheck={editing}
      onBlur={(event) => onSave?.(htmlToMarkdown(event.currentTarget))}
    />
  );
}

function HeroVisual() {
  return (
    <div className="hero-visual">
      {/* eslint-disable-next-line @next/next/no-img-element -- Vinext's local image optimizer returns 500; the static asset is served directly. */}
      <img
        className="hero-image-ru"
        src={visuals.hero.image}
        alt={visuals.hero.alt}
        width="1536"
        height="1024"
        loading="eager"
        fetchPriority="high"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- language-specific static cover; see the Russian asset above. */}
      <img
        className="hero-image-en"
        src="/og.en.png"
        alt="An artificial neuron develops into a neural network, and then into an agent with tools"
        width="1536"
        height="1024"
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
}

function BiologicalNeuronVisual() {
  return (
    <div className="biological-neuron">
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element -- local CC BY scientific asset; Vinext's image optimizer returns 500. */}
        <img
          src={visuals.biologicalNeuron.image}
          alt={visuals.biologicalNeuron.alt}
          width="891"
          height="579"
          loading="eager"
        />
        <figcaption>{visuals.biologicalNeuron.credit}</figcaption>
      </figure>
      <div className="biological-signal-flow">
        {visuals.biologicalNeuron.parts.map((part, index) => (
          <div key={part.title}>
            <article>
              <span>{part.role}</span>
              <strong>{part.title}</strong>
              <small>{part.note}</small>
            </article>
            {index < visuals.biologicalNeuron.parts.length - 1 && <b aria-hidden="true">→</b>}
          </div>
        ))}
      </div>
    </div>
  );
}

function NetworkInput({
  name,
  value,
  onClick,
}: {
  name: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      className={`network-input-node ${value ? "is-on" : ""}`}
      type="button"
      onClick={onClick}
      aria-label={`${name}: ${value}. Нажмите, чтобы изменить`}
    >
      <span>{name}</span>
      <strong>{value}</strong>
    </button>
  );
}

function SumNeuron({
  name,
  operation,
  z,
  active,
}: {
  name: string;
  operation: string;
  z: string;
  active: boolean;
}) {
  return (
    <div className={`network-neuron ${active ? "is-on" : ""}`}>
      <span>{name} · {operation}</span>
      <b>Σ</b>
      <code>z = {z}</code>
    </div>
  );
}

function ThresholdNode({ value }: { value: number }) {
  return (
    <div className={`threshold-node ${value ? "is-on" : ""}`}>
      <svg viewBox="0 0 54 30" aria-hidden="true">
        <path d="M3 25 H27 V5 H51" />
      </svg>
      <span>H(z)</span>
      <strong>{value}</strong>
    </div>
  );
}

function NeuronLab() {
  const [gate, setGate] = useState<"AND" | "OR" | "NOT" | "XOR">("AND");
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const step = (value: number) => Number(value >= 0);
  const format = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(1);
  const parameters = {
    AND: { w1: 1, w2: 1, bias: -1.5 },
    OR: { w1: 1, w2: 1, bias: -0.5 },
    NOT: { w1: -1, w2: 0, bias: 0.5 },
  } as const;
  const single = gate === "XOR" ? parameters.AND : parameters[gate];
  const z = single.w1 * a + single.w2 * b + single.bias;
  const output = step(z);
  const hOrZ = a + b - 0.5;
  const hAndZ = a + b - 1.5;
  const hOr = step(hOrZ);
  const hAnd = step(hAndZ);
  const xorZ = hOr - 2 * hAnd - 0.5;
  const xorOutput = step(xorZ);

  return (
    <div className="neuron-lab">
      <div className="segmented" aria-label={visuals.neuron.controlsAria}>
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

      {gate === "XOR" ? (
        <div className="artificial-network-scroll">
          <svg
            className="artificial-network-svg xor-network"
            viewBox="0 0 1000 420"
            role="img"
            aria-label="Сеть XOR: два входа, два нейрона скрытого слоя и один выходной нейрон"
          >
            <defs>
              <marker id="xor-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" />
              </marker>
            </defs>
            <g className="network-wires" markerEnd="url(#xor-arrow)">
              <line className={a ? "is-active" : ""} x1="110" y1="120" x2="280" y2="105" />
              <line className={b ? "is-active" : ""} x1="110" y1="320" x2="280" y2="155" />
              <line className={a ? "is-active" : ""} x1="110" y1="120" x2="280" y2="275" />
              <line className={b ? "is-active" : ""} x1="110" y1="320" x2="280" y2="325" />
              <line className={hOr ? "is-active" : ""} x1="525" y1="130" x2="615" y2="180" />
              <line className={hAnd ? "is-active negative" : ""} x1="525" y1="300" x2="615" y2="250" />
              <line className={xorOutput ? "is-active" : ""} x1="875" y1="215" x2="905" y2="215" />
              <line className="bias-wire" x1="350" y1="43" x2="350" y2="60" />
              <line className="bias-wire" x1="350" y1="377" x2="350" y2="370" />
              <line className="bias-wire" x1="690" y1="365" x2="690" y2="290" />
            </g>
            <g className="network-weight-labels">
              <text x="180" y="99">w = 1</text>
              <text x="185" y="218">w = 1</text>
              <text x="180" y="245">w = 1</text>
              <text x="180" y="339">w = 1</text>
              <text x="548" y="132">w = 1</text>
              <text x="548" y="303">w = −2</text>
            </g>
            <foreignObject x="20" y="75" width="90" height="90">
              <NetworkInput name="x₁" value={a} onClick={() => setA(a ? 0 : 1)} />
            </foreignObject>
            <foreignObject x="20" y="275" width="90" height="90">
              <NetworkInput name="x₂" value={b} onClick={() => setB(b ? 0 : 1)} />
            </foreignObject>
            <foreignObject x="280" y="60" width="140" height="140">
              <SumNeuron name="h₁" operation="OR" z={format(hOrZ)} active={Boolean(hOr)} />
            </foreignObject>
            <foreignObject x="280" y="230" width="140" height="140">
              <SumNeuron name="h₂" operation="AND" z={format(hAndZ)} active={Boolean(hAnd)} />
            </foreignObject>
            <foreignObject x="435" y="85" width="90" height="90">
              <ThresholdNode value={hOr} />
            </foreignObject>
            <foreignObject x="435" y="255" width="90" height="90">
              <ThresholdNode value={hAnd} />
            </foreignObject>
            <foreignObject x="615" y="140" width="150" height="150">
              <SumNeuron name="y" operation="XOR" z={format(xorZ)} active={Boolean(xorOutput)} />
            </foreignObject>
            <foreignObject x="785" y="170" width="90" height="90">
              <ThresholdNode value={xorOutput} />
            </foreignObject>
            <foreignObject x="905" y="175" width="80" height="80">
              <div className={`network-output-node ${xorOutput ? "is-on" : ""}`}>
                <span>выход</span><strong>{xorOutput}</strong>
              </div>
            </foreignObject>
            <foreignObject x="305" y="5" width="90" height="38">
              <div className="network-bias"><span>bias</span><strong>b = −0.5</strong></div>
            </foreignObject>
            <foreignObject x="305" y="377" width="90" height="38">
              <div className="network-bias"><span>bias</span><strong>b = −1.5</strong></div>
            </foreignObject>
            <foreignObject x="645" y="365" width="90" height="38">
              <div className="network-bias"><span>bias</span><strong>b = −0.5</strong></div>
            </foreignObject>
            <text className="network-layer-label" x="20" y="45">ВХОДЫ</text>
            <text className="network-layer-label" x="280" y="218">СКРЫТЫЙ СЛОЙ</text>
            <text className="network-layer-label" x="615" y="112">ВЫХОДНОЙ НЕЙРОН</text>
          </svg>
        </div>
      ) : (
        <div className="artificial-network-scroll">
          <svg
            className="artificial-network-svg single-network"
            viewBox="0 0 920 360"
            role="img"
            aria-label={`Искусственный нейрон ${gate}: входы умножаются на веса, к сумме прибавляется bias, затем применяется ступенчатая функция`}
          >
            <defs>
              <marker id="single-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" />
              </marker>
            </defs>
            <g className="network-wires" markerEnd="url(#single-arrow)">
              <line className={a ? "is-active" : ""} x1="110" y1="100" x2="320" y2="145" />
              {gate !== "NOT" && <line className={b ? "is-active" : ""} x1="110" y1="260" x2="320" y2="215" />}
              <line className="bias-wire" x1="405" y1="312" x2="405" y2="265" />
              <line className={output ? "is-active" : ""} x1="490" y1="180" x2="565" y2="180" />
              <line className={output ? "is-active" : ""} x1="675" y1="180" x2="805" y2="180" />
            </g>
            <g className="network-weight-labels">
              <text x="190" y="105">w₁ = {single.w1}</text>
              {gate !== "NOT" && <text x="190" y="270">w₂ = {single.w2}</text>}
            </g>
            <foreignObject x="20" y="55" width="90" height="90">
              <NetworkInput name="x₁" value={a} onClick={() => setA(a ? 0 : 1)} />
            </foreignObject>
            {gate !== "NOT" && (
              <foreignObject x="20" y="215" width="90" height="90">
                <NetworkInput name="x₂" value={b} onClick={() => setB(b ? 0 : 1)} />
              </foreignObject>
            )}
            <foreignObject x="320" y="95" width="170" height="170">
              <SumNeuron name="нейрон" operation={gate} z={format(z)} active={Boolean(output)} />
            </foreignObject>
            <foreignObject x="565" y="125" width="110" height="110">
              <ThresholdNode value={output} />
            </foreignObject>
            <foreignObject x="805" y="135" width="90" height="90">
              <div className={`network-output-node ${output ? "is-on" : ""}`}>
                <span>выход</span><strong>{output}</strong>
              </div>
            </foreignObject>
            <foreignObject x="355" y="312" width="100" height="42">
              <div className="network-bias"><span>прибавляем</span><strong>b = {single.bias}</strong></div>
            </foreignObject>
            <text className="network-layer-label" x="20" y="34">ВХОДЫ · НАЖМИТЕ</text>
            <text className="network-layer-label" x="320" y="70">ВЗВЕШЕННАЯ СУММА</text>
            <text className="network-layer-label" x="565" y="103">СТУПЕНЬКА</text>
          </svg>
        </div>
      )}

      <p className="lab-caption">
        {gate === "XOR"
          ? visuals.neuron.xorCaption
          : visuals.neuron.readyCaption}
      </p>
    </div>
  );
}

function runDigitNetwork(input: number[]) {
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
  return {
    hidden,
    logits,
    probabilities: exps.map((value) => value / total),
  };
}

function DigitNetworkCanvas({
  pixels,
  hidden,
  probabilities,
}: {
  pixels: number[];
  hidden: number[];
  probabilities: number[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);

      const width = rect.width;
      const height = rect.height;
      const top = 62;
      const bottom = 28;
      const usableHeight = height - top - bottom;
      const columns = [72, width * 0.52, width - 84];
      const yAt = (index: number, count: number) =>
        top + (count === 1 ? usableHeight / 2 : (usableHeight * index) / (count - 1));

      const line = (
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        signal: number,
        active: boolean,
      ) => {
        const strength = Math.min(1, Math.abs(signal) / 2.5);
        const alpha = active ? 0.08 + strength * 0.55 : 0.025;
        const color = signal >= 0 ? `120,157,255` : `255,118,87`;
        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
        context.strokeStyle = `rgba(${color},${alpha})`;
        context.lineWidth = active ? 0.45 + strength * 1.5 : 0.35;
        context.stroke();
      };

      digitModel.weights.w1.forEach((weights, hiddenIndex) => {
        weights.forEach((weight, inputIndex) => {
          const signal = weight * pixels[inputIndex];
          line(
            columns[0],
            yAt(inputIndex, pixels.length),
            columns[1],
            yAt(hiddenIndex, hidden.length),
            signal,
            Boolean(pixels[inputIndex]),
          );
        });
      });

      digitModel.weights.w2.forEach((weights, outputIndex) => {
        weights.forEach((weight, hiddenIndex) => {
          const signal = weight * hidden[hiddenIndex];
          line(
            columns[1],
            yAt(hiddenIndex, hidden.length),
            columns[2],
            yAt(outputIndex, probabilities.length),
            signal,
            Math.abs(hidden[hiddenIndex]) > 0.12,
          );
        });
      });

      const node = (
        x: number,
        y: number,
        value: number,
        radius: number,
        mode: "input" | "hidden" | "output",
      ) => {
        const magnitude = mode === "hidden" ? Math.abs(value) : Math.max(0, value);
        const positive = value >= 0;
        const base =
          mode === "output"
            ? "217,255,87"
            : positive
              ? "120,157,255"
              : "255,118,87";
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${base},${0.12 + magnitude * 0.88})`;
        context.fill();
        context.strokeStyle = `rgba(${base},${0.35 + magnitude * 0.65})`;
        context.lineWidth = 1.2;
        context.stroke();
      };

      pixels.forEach((value, index) =>
        node(columns[0], yAt(index, pixels.length), value, 5.5, "input"),
      );
      hidden.forEach((value, index) =>
        node(columns[1], yAt(index, hidden.length), value, 5, "hidden"),
      );
      probabilities.forEach((value, index) => {
        const y = yAt(index, probabilities.length);
        node(columns[2], y, value, 7.5, "output");
        context.fillStyle = value === Math.max(...probabilities) ? "#d9ff57" : "#8d9198";
        context.font = "14px SFMono-Regular, Consolas, monospace";
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillText(`${index}  ${Math.round(value * 100)}%`, columns[2] + 14, y);
      });

      const labels = [
        visuals.digits.inputLayer,
        visuals.digits.hiddenLayer,
        visuals.digits.outputLayer,
      ];
      context.font = "700 14px SFMono-Regular, Consolas, monospace";
      context.fillStyle = "#858991";
      context.textBaseline = "top";
      columns.forEach((x, index) => {
        context.textAlign = index === 2 ? "right" : index === 0 ? "left" : "center";
        context.fillText(labels[index], x, 20);
      });
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [hidden, pixels, probabilities]);

  return <canvas className="digit-network-canvas" ref={canvasRef} />;
}

function DigitNetworkModal({
  pixels,
  setPixels,
  onClose,
}: {
  pixels: number[];
  setPixels: Dispatch<SetStateAction<number[]>>;
  onClose: () => void;
}) {
  const network = useMemo(() => runDigitNetwork(pixels), [pixels]);
  const best = network.probabilities.indexOf(Math.max(...network.probabilities));

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="network-modal-backdrop" role="dialog" aria-modal="true">
      <div className="network-modal">
        <header>
          <div>
            <span>{visuals.digits.modalKicker}</span>
            <h2>{visuals.digits.modalTitle}</h2>
            <p>{visuals.digits.modalSubtitle}</p>
          </div>
          <button type="button" onClick={onClose}>{visuals.digits.closeButton}</button>
        </header>
        <div className="network-modal-body">
          <aside>
            <div className="pixel-grid network-pixels" aria-label="Поле для рисования цифры">
              {pixels.map((value, index) => (
                <button
                  aria-label={`Пиксель ${index + 1}`}
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
            <div className="network-prediction">
              <span>Результат</span>
              <strong>{best}</strong>
              <small>{Math.round(network.probabilities[best] * 100)}%</small>
            </div>
          </aside>
          <div className="network-canvas-wrap">
            <DigitNetworkCanvas
              pixels={pixels}
              hidden={network.hidden}
              probabilities={network.probabilities}
            />
            <div className="network-legend">
              <span className="positive">{visuals.digits.positiveLegend}</span>
              <span className="negative">{visuals.digits.negativeLegend}</span>
              <span className="inactive">{visuals.digits.inactiveLegend}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DigitLab() {
  const [pixels, setPixels] = useState<number[]>(() =>
    digitModel.patterns[8].slice(),
  );
  const [expanded, setExpanded] = useState(false);
  const { probabilities } = useMemo(() => runDigitNetwork(pixels), [pixels]);
  const best = probabilities.indexOf(Math.max(...probabilities));
  const ordered = probabilities
    .map((value, digit) => ({ value, digit }))
    .sort((left, right) => right.value - left.value);
  const [inputSize, hiddenSize, outputSize] = digitModel.architecture;
  const parameterCount =
    inputSize * hiddenSize + hiddenSize + hiddenSize * outputSize + outputSize;

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
        <button className="network-expand-button" type="button" onClick={() => setExpanded(true)}>
          {visuals.digits.expandButton}
        </button>
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
        <div className="digit-parameter-card">
          <div>
            <strong>{parameterCount}</strong>
            <span>{visuals.digits.parameterLabel}</span>
          </div>
          <p>{visuals.digits.parameterFormula}</p>
          <small>{visuals.digits.gptComparison}</small>
        </div>
      </div>
      {expanded && (
        <DigitNetworkModal
          pixels={pixels}
          setPixels={setPixels}
          onClose={() => setExpanded(false)}
        />
      )}
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
  const [man, woman, king, queen] = visuals.embeddings.points;
  return (
    <div className="embedding-demo">
      <header>
        <span>{visuals.embeddings.kicker}</span>
        <strong>Каждое слово → точка на плоскости</strong>
      </header>
      <svg
        className="embedding-space"
        viewBox="0 0 700 310"
        role="img"
        aria-label={visuals.embeddings.ariaLabel}
      >
        <defs>
          <marker id="embedding-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        <g className="embedding-axes" markerEnd="url(#embedding-arrow)">
          <line x1="80" y1="280" x2="650" y2="280" />
          <line x1="80" y1="280" x2="80" y2="25" />
        </g>
        <g className="embedding-grid">
          <line x1="80" y1="220" x2="625" y2="220" />
          <line x1="80" y1="160" x2="625" y2="160" />
          <line x1="80" y1="100" x2="625" y2="100" />
          <line x1="80" y1="40" x2="625" y2="40" />
          <line x1="215" y1="280" x2="215" y2="40" />
          <line x1="355" y1="280" x2="355" y2="40" />
          <line x1="490" y1="280" x2="490" y2="40" />
          <line x1="625" y1="280" x2="625" y2="40" />
        </g>
        <g className="embedding-axis-labels">
          <text x="365" y="304" textAnchor="middle">{visuals.embeddings.axes.x}</text>
          <text
            x="22"
            y="152"
            textAnchor="middle"
            transform="rotate(-90 22 152)"
          >
            {visuals.embeddings.axes.y}
          </text>
        </g>
        <g className="embedding-axis-ticks">
          <line x1="80" y1="275" x2="80" y2="285" />
          <line x1="625" y1="275" x2="625" y2="285" />
          <line x1="75" y1="280" x2="85" y2="280" />
          <line x1="75" y1="40" x2="85" y2="40" />
          <text x="80" y="299" textAnchor="middle">0</text>
          <text x="625" y="299" textAnchor="middle">1</text>
          <text x="64" y="284" textAnchor="end">0</text>
          <text x="64" y="44" textAnchor="end">1</text>
        </g>
        <g className="embedding-relations">
          <line x1={man.x} y1={man.y} x2={king.x} y2={king.y} />
          <line x1={woman.x} y1={woman.y} x2={queen.x} y2={queen.y} />
          <line className="gender" x1={man.x} y1={man.y} x2={woman.x} y2={woman.y} />
          <line className="gender" x1={king.x} y1={king.y} x2={queen.x} y2={queen.y} />
        </g>
        {visuals.embeddings.points.map((point) => (
          <g
            className={`embedding-vector-point tone-${point.tone}`}
            key={point.id}
            transform={`translate(${point.x} ${point.y})`}
          >
            <circle r="8" />
            <text className="point-label" x="0" y="-14" textAnchor="middle">{point.label}</text>
          </g>
        ))}
      </svg>
      <div className="embedding-arithmetic">
        <strong>{visuals.embeddings.analogy}</strong>
      </div>
      <footer>{visuals.embeddings.note}</footer>
    </div>
  );
}

function ContextInputVisual() {
  const context = visuals.contextInput;

  return (
    <div className="context-input-simple">
      <header>
        <span>ПРЕДЫДУЩИЙ КОНТЕКСТ</span>
        <strong>{context.sentence}</strong>
      </header>
      <div className="context-token-sequence">
        {context.tokens.map((token, index) => (
          <article className={index === context.tokens.length - 1 ? "is-last" : ""} key={`${token}-${index}`}>
            <span>ПОЗИЦИЯ {index}</span>
            <strong>{token}</strong>
            <div>
              <i>{context.contentLabel}</i>
              <b>+</b>
              <i>{context.positionLabel}</i>
            </div>
          </article>
        ))}
      </div>
      <div className="context-sequence-input">
        <i aria-hidden="true">↓</i>
        <strong>{context.resultLabel}</strong>
        <span>{context.callout}</span>
      </div>
      <footer>{context.note}</footer>
    </div>
  );
}

function ContextRelationsVisual() {
  const relations = visuals.contextRelations;

  return (
    <div className="context-relations-simple">
      <header>
        <span>N ТОКЕНОВ</span>
        <strong>N × N связей между позициями</strong>
      </header>
      <div className="context-relations-layout">
        <section>
          <span className="relations-column-label">{relations.columnLabel} →</span>
          <div className="relations-matrix">
            <span className="relations-corner">↓ / →</span>
            {relations.shortTokens.map((token, index) => (
              <b className="relations-column" style={{ gridColumn: index + 2 }} key={`column-${token}`}>{token}</b>
            ))}
            {relations.tokens.map((token, row) => (
              <div className={`relations-row ${token === relations.focus ? "is-focus" : ""}`} style={{ gridRow: row + 2 }} key={`row-${token}`}>
                <b>{relations.shortTokens[row]}</b>
                {relations.weights[row].map((weight, column) => (
                  <i
                    className={weight === null ? "is-blocked" : ""}
                    style={{ "--relation-strength": weight ?? 0 } as CSSProperties}
                    key={`${token}-${column}`}
                    aria-label={weight === null ? "Будущая позиция недоступна" : `Сила связи ${weight}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <span className="relations-row-label">← {relations.rowLabel}</span>
        </section>
        <aside>
          <span>ФОКУС: «{relations.focus}»</span>
          <div className="relations-focus-tokens">
            {relations.shortTokens.map((token, index) => (
              <i style={{ "--relation-strength": relations.weights.at(-1)?.[index] ?? 0 } as CSSProperties} key={token}>{token}</i>
            ))}
          </div>
          <b aria-hidden="true">↓</b>
          <strong>{relations.focusResult}</strong>
        </aside>
      </div>
      <footer>{relations.note}</footer>
    </div>
  );
}

function TransformerVisual() {
  const scale = visuals.transformer;

  return (
    <div className="transformer-overview-simple">
      <header>
        <span>{scale.model}</span>
        <strong>одна понятная операция → много повторений</strong>
      </header>
      <div className="transformer-overview-route">
        <section className="transformer-one-layer">
          <header>
            <span>{scale.layer.label}</span>
            <strong>контекст стал точнее</strong>
          </header>
          <div className="transformer-layer-steps">
            <article className="layer-context-step">
              <div>{Array.from({ length: 25 }, (_, index) => <i key={index} />)}</div>
              <strong>{scale.layer.mixingTitle}</strong>
              <span>{scale.layer.mixingNote}</span>
            </article>
            <b aria-hidden="true">→</b>
            <article className="layer-network-step">
              <div>{Array.from({ length: 70 }, (_, index) => <i key={index} />)}</div>
              <strong>{scale.layer.networkNumber}</strong>
              <span>{scale.layer.networkUnit}</span>
            </article>
          </div>
          <footer>{scale.layer.inputWidth}</footer>
        </section>

        <div className="transformer-repeat">
          <strong>{scale.repeat}</strong>
          <i aria-hidden="true">→</i>
        </div>

        <section className="transformer-full-model">
          <header>
            <span>МОДЕЛЬ</span>
            <strong>{scale.fullModel.title}</strong>
          </header>
          <div className="transformer-layer-stack" aria-label={`${scale.fullModel.layers} последовательных слоёв`}>
            {Array.from({ length: 96 }, (_, index) => <i className={index % 12 === 0 ? "is-mark" : ""} key={index} />)}
          </div>
          <div className="transformer-main-stats">
            <article><strong>{scale.fullModel.layers}</strong><span>{scale.fullModel.layersLabel}</span></article>
            <article><strong>{scale.fullModel.neurons}</strong><span>{scale.fullModel.neuronsLabel}</span></article>
            <article><strong>{scale.fullModel.width}</strong><span>{scale.fullModel.widthLabel}</span></article>
            <article><strong>{scale.fullModel.parameters}</strong><span>{scale.fullModel.parametersLabel}</span></article>
          </div>
        </section>
      </div>
      <footer>{scale.note}</footer>
    </div>
  );
}

function DeepVector({
  values,
  label,
  tone = "blue",
}: {
  values: readonly number[];
  label?: string;
  tone?: "blue" | "pink" | "acid" | "orange";
}) {
  return (
    <div className={`deep-vector tone-${tone}`}>
      {label && <span>{label}</span>}
      <div>
        {values.map((value, index) => (
          <i
            key={`${value}-${index}`}
            style={{ "--value": Math.abs(value) } as CSSProperties}
            className={value < 0 ? "is-negative" : ""}
          >
            {value.toFixed(2)}
          </i>
        ))}
        <b>…</b>
      </div>
    </div>
  );
}

function DeepTokenStrip({
  focus,
  withIds = false,
  onPick,
}: {
  focus?: string;
  withIds?: boolean;
  onPick?: (token: string) => void;
}) {
  return (
    <div className="deep-token-strip">
      {deepDive.sentence.map(({ token, id }, index) => {
        const content = (
          <>
            <span>{token}</span>
            {withIds && <small>ID {id}</small>}
            {!withIds && <small>pos {index}</small>}
          </>
        );
        return onPick ? (
          <button
            type="button"
            className={focus === token ? "is-focus" : ""}
            onClick={() => onPick(token)}
            key={`${token}-${index}`}
          >
            {content}
          </button>
        ) : (
          <div className={focus === token ? "is-focus" : ""} key={`${token}-${index}`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

function AttentionScoreRows({ mode }: { mode: "score" | "weight" }) {
  const maxScore = Math.max(...deepDive.scores.map((item) => item.score));
  return (
    <div className={`deep-score-list mode-${mode}`}>
      {deepDive.scores.map((item) => {
        const value = mode === "score" ? item.score : item.weight;
        const width = mode === "score"
          ? Math.max(4, ((item.score + 1.2) / (maxScore + 1.2)) * 100)
          : item.weight * 100;
        return (
          <div key={item.token}>
            <span>{item.token}</span>
            <i style={{ width: `${width}%` }} />
            <strong>{mode === "score" ? value.toFixed(1) : `${Math.round(value * 100)}%`}</strong>
          </div>
        );
      })}
    </div>
  );
}

function DeepMatrix({ causal = false, compact = false }: { causal?: boolean; compact?: boolean }) {
  const tokens = deepDive.sentence.slice(0, 7);
  return (
    <div className={`deep-attention-matrix ${causal ? "is-causal" : ""}`}>
      <span className="matrix-corner">Q \ K</span>
      {tokens.map(({ token }, index) => <b className="matrix-column" key={`c-${token}`} style={{ gridColumn: index + 2 }}>{compact ? token.slice(0, 3) : token}</b>)}
      {tokens.map(({ token }, row) => (
        <div className="matrix-row" key={`r-${token}`} style={{ gridRow: row + 2 }}>
          <b>{compact ? token.slice(0, 3) : token}</b>
          {tokens.map((column, col) => {
            const blocked = causal && col > row;
            const strength = blocked ? 0 : Math.max(0.08, 1 - Math.abs(row - col) * 0.16);
            return (
              <i
                key={`${token}-${column.token}`}
                className={blocked ? "is-blocked" : ""}
                style={{ "--strength": strength } as CSSProperties}
              >
                {compact ? "" : blocked ? "−∞" : strength.toFixed(1)}
              </i>
            );
          })}
        </div>
      ))}
    </div>
  );
}

type DeepScene =
  | "route" | "token-ids" | "embedding-lookup" | "context-matrix"
  | "word-order" | "position-encoding" | "isolated-tokens" | "attention-intro"
  | "qkv" | "query" | "key" | "value" | "qk-scores" | "dot-product"
  | "softmax" | "weighted-sum" | "causal-mask" | "attention-parallel"
  | "heads-purpose" | "multi-head" | "residual" | "layernorm" | "mlp-token"
  | "mlp-inside" | "block" | "layers" | "residual-stream" | "gpt3-scale"
  | "logits" | "probabilities" | "randomness" | "kv-cache" | "context-cost"
  | "training" | "train-infer" | "attention-limits" | "summary";

function TransformerDeepDiveVisual({ scene }: { scene: DeepScene }) {
  const attentionKeys = Object.keys(deepDive.attentionProfiles) as Array<keyof typeof deepDive.attentionProfiles>;
  const [attentionFocus, setAttentionFocus] = useState<keyof typeof deepDive.attentionProfiles>("она");
  const [probabilityTemperature, setProbabilityTemperature] = useState(0.8);

  if (scene === "route" || scene === "summary") {
    return (
      <div className={`deep-scene deep-route ${scene === "summary" ? "is-summary" : ""}`}>
        <div className="deep-route-track">
          {deepDive.route.map((step, index) => (
            <div key={step.number} className={index === deepDive.route.length - 1 ? "is-loop" : ""}>
              <article><span>{step.number}</span><strong>{step.title}</strong><small>{step.note}</small></article>
              {index < deepDive.route.length - 1 && <b aria-hidden="true">→</b>}
            </div>
          ))}
        </div>
        <footer>{scene === "summary" ? "Вся генерация — повтор этого маршрута для одного нового токена" : "decoder-only Transformer · один forward pass"}</footer>
      </div>
    );
  }

  if (scene === "token-ids") {
    return <div className="deep-scene deep-tokenizer"><header>«Маша поставила чашку на стол, она горячая»</header><b aria-hidden="true">↓ o200k_base tokenizer ↓</b><div className="deep-real-token-strip">{deepDive.realTokenization.map(({ token, id }) => <span key={id}><strong>{token.startsWith(" ") ? `␠${token.slice(1)}` : token}</strong><small>ID {id}</small></span>)}</div><footer>Реальные токены и ID · дальше для читаемости subword-части объединяются в условные позиции-слова</footer></div>;
  }

  if (scene === "embedding-lookup") {
    return (
      <div className="deep-scene deep-lookup">
        <div className="lookup-token"><span>TOKEN ID</span><strong>{deepDive.embedding.id}</strong><small>«{deepDive.embedding.token}»</small></div>
        <b aria-hidden="true">→</b>
        <div className="lookup-table"><span>EMBEDDING TABLE</span>{Array.from({ length: 9 }, (_, index) => <i className={index === 4 ? "is-selected" : ""} key={index} />)}</div>
        <b aria-hidden="true">→</b>
        <DeepVector values={deepDive.embedding.vector} label="ROW 28 741" tone="acid" />
        <footer>{deepDive.embedding.width}</footer>
      </div>
    );
  }

  if (scene === "context-matrix") {
    return (
      <div className="deep-scene deep-context-matrix">
        <header><span>N = {deepDive.sentence.length} позиций</span><strong>×</strong><span>d_model координат</span></header>
        <div>
          {deepDive.matrix.map((row, rowIndex) => (
            <div className="deep-matrix-row" key={deepDive.sentence[rowIndex].token}>
              <b>{deepDive.sentence[rowIndex].token}</b>
              {row.map((value, index) => <i className={value < 0 ? "is-negative" : ""} key={index}>{value.toFixed(2)}</i>)}
              <em>…</em>
            </div>
          ))}
        </div>
        <footer>форма матрицы сохраняется через все Transformer blocks</footer>
      </div>
    );
  }

  if (scene === "word-order") {
    const orders = [["собака", "укусила", "человека"], ["человек", "укусил", "собаку"]];
    return <div className="deep-scene deep-order">{orders.map((order, row) => <article key={row}><span>ВАРИАНТ {row + 1}</span><div>{order.map((word, index) => <b key={word}><small>pos {index}</small>{word}</b>)}</div><strong>{row === 0 ? "кто? → собака" : "кто? → человек"}</strong></article>)}</div>;
  }

  if (scene === "position-encoding") {
    return (
      <div className="deep-scene deep-position">
        <DeepVector values={deepDive.position.token} label="TOKEN · чашку" tone="blue" />
        <b>+</b>
        <DeepVector values={deepDive.position.position} label="POSITION · 2" tone="pink" />
        <b>=</b>
        <DeepVector values={deepDive.position.result} label="INPUT VECTOR" tone="acid" />
        <footer>современный вариант: RoPE меняет геометрию Q и K внутри attention</footer>
      </div>
    );
  }

  if (scene === "isolated-tokens") {
    return <div className="deep-scene deep-isolated"><DeepTokenStrip /><div className="isolation-row">{deepDive.sentence.map(({ token }) => <i key={token}>?</i>)}</div><footer>векторы стоят рядом, но ещё не обменялись информацией</footer></div>;
  }

  if (scene === "attention-intro") {
    const profile = deepDive.attentionProfiles[attentionFocus];
    return (
      <div className="deep-scene deep-attention-intro">
        <div className="attention-pick">{attentionKeys.map((token) => <button className={attentionFocus === token ? "is-active" : ""} type="button" onClick={() => setAttentionFocus(token)} key={token}>{token}</button>)}</div>
        <div className="attention-focus-card"><span>QUERY</span><strong>{attentionFocus}</strong><small>какой контекст сейчас важен?</small></div>
        <div className="attention-links">{deepDive.sentence.map(({ token }, index) => <div key={token}><span>{token}</span><i style={{ width: `${profile[index] * 100}%` }} /><strong>{Math.round(profile[index] * 100)}%</strong></div>)}</div>
      </div>
    );
  }

  if (["qkv", "query", "key", "value"].includes(scene)) {
    const focus = scene === "qkv" ? null : scene[0].toUpperCase();
    return (
      <div className="deep-scene deep-qkv">
        <div className="qkv-source"><span>INPUT VECTOR</span><strong>«она»</strong><DeepVector values={deepDive.position.result} /></div>
        <div className="qkv-arrow"><b>× W<sub>Q,K,V</sub></b><i aria-hidden="true">→</i></div>
        <div className="qkv-cards">
          {deepDive.qkv.map((item) => <article className={focus === item.id ? "is-focus" : ""} key={item.id}><span>{item.id}</span><strong>{item.title}</strong><small>{item.question}</small><DeepVector values={item.vector} tone={item.id === "Q" ? "blue" : item.id === "K" ? "pink" : "acid"} /></article>)}
        </div>
      </div>
    );
  }

  if (scene === "qk-scores") {
    return <div className="deep-scene deep-qk-scores"><header><div><span>QUERY</span><strong>«она»</strong></div><b>×</b><div><span>ALL KEYS</span><strong>контекст слева</strong></div></header><AttentionScoreRows mode="score" /><footer>один Query → одна строка scores</footer></div>;
  }

  if (scene === "dot-product") {
    const maxAbsoluteScore = Math.max(...deepDive.scores.map(({ score }) => Math.abs(score)));
    return (
      <div className="deep-scene deep-dot-product">
        <header className="dot-query-card">
          <div>
            <span>ОДИН QUERY</span>
            <strong>Q · «она»</strong>
            <small>Что важно для текущего токена?</small>
          </div>
          <DeepVector values={deepDive.qkv[0].vector} tone="blue" />
        </header>
        <div className="dot-repeat-label">
          <b>Q · K</b>
          <span>тот же Query сравниваем с Key каждого доступного токена</span>
        </div>
        <section className="dot-score-board">
          <header>
            <span>KEY-ВЕКТОР</span>
            <span>ОТРИЦАТЕЛЬНЫЙ ← 0 → ПОЛОЖИТЕЛЬНЫЙ SCORE</span>
            <span>РЕЗУЛЬТАТ</span>
          </header>
          {deepDive.scores.map(({ token, score }) => {
            const width = `${(Math.abs(score) / maxAbsoluteScore) * 48}%`;
            return (
              <article className={score === maxAbsoluteScore ? "is-winner" : ""} key={token}>
                <div className="dot-key-token">
                  <b>K</b>
                  <strong>«{token}»</strong>
                  <small>[ … ]</small>
                </div>
                <div className="dot-score-axis">
                  <i
                    className={score >= 0 ? "is-positive" : "is-negative"}
                    style={{ "--score-width": width } as CSSProperties}
                  />
                </div>
                <strong className={score >= 0 ? "is-positive" : "is-negative"}>
                  {score > 0 ? "+" : score < 0 ? "−" : ""}{Math.abs(score).toFixed(1)}
                </strong>
              </article>
            );
          })}
        </section>
        <footer>
          <strong>1 Query × {deepDive.scores.length} Key = {deepDive.scores.length} scores</strong>
          <span>затем каждый score делится на √d<sub>k</sub> и отправляется в softmax</span>
        </footer>
      </div>
    );
  }

  if (scene === "softmax") {
    return <div className="deep-scene deep-softmax"><section><header>RAW SCORES</header><AttentionScoreRows mode="score" /></section><b aria-hidden="true">SOFTMAX →</b><section><header>ATTENTION WEIGHTS</header><AttentionScoreRows mode="weight" /></section><footer>Σ weights = 1.00</footer></div>;
  }

  if (scene === "weighted-sum") {
    return (
      <div className="deep-scene deep-weighted-sum">
        <div className="value-mixture">{deepDive.scores.map((item, index) => <article style={{ opacity: 0.35 + item.weight }} key={item.token}><span>{Math.round(item.weight * 100)}% × V</span><strong>{item.token}</strong><DeepVector values={deepDive.matrix[index].slice(0, 4)} tone={index === 2 ? "acid" : "blue"} /></article>)}</div>
        <b aria-hidden="true">Σ</b>
        <div className="mixed-value"><span>ATTENTION OUTPUT</span><DeepVector values={[0.28, -0.09, 0.71, 0.24]} tone="acid" /><strong>контекст добавлен в вектор «она»</strong></div>
      </div>
    );
  }

  if (scene === "causal-mask" || scene === "attention-parallel") {
    return <div className="deep-scene deep-matrix-scene"><DeepMatrix causal /><footer>{scene === "causal-mask" ? "разрешено: диагональ и всё слева · запрещено: будущее" : "все разрешённые строки считаются параллельно · маска будущего сохраняется"}</footer></div>;
  }

  if (scene === "heads-purpose") {
    return <div className="deep-scene deep-heads">{deepDive.heads.map((head) => <article className={`tone-${head.tone}`} key={head.number}><span>{head.number}</span><strong>{head.title}</strong><small>{head.note}</small><div>{deepDive.sentence.slice(0, 6).map(({ token }, index) => <i style={{ opacity: 0.25 + ((index + Number(head.number.slice(1))) % 4) * 0.2 }} key={token}>{token}</i>)}</div></article>)}</div>;
  }

  if (scene === "multi-head") {
    return <div className="deep-scene deep-multi-head"><div className="multi-input"><span>d_model</span><strong>12 288</strong></div><b>РАЗДЕЛИТЬ</b><div className="multi-head-grid">{Array.from({ length: 8 }, (_, index) => <i key={index}>H{index + 1}<small>attention</small></i>)}</div><b>CONCAT + W<sub>O</sub></b><div className="multi-output"><span>d_model</span><strong>12 288</strong></div></div>;
  }

  if (scene === "residual") {
    return <div className="deep-scene deep-residual"><div className="residual-main"><span>RESIDUAL STREAM</span><strong>x</strong><i /><strong>x + Δ</strong></div><div className="residual-branch"><b>LayerNorm</b><b>Attention</b><b>Δ</b></div><footer>подслой предлагает изменение · исходный сигнал остаётся на магистрали</footer></div>;
  }

  if (scene === "layernorm") {
    const before = [0.9, -1.8, 3.2, 0.2, -2.6, 1.4, 4.1, -0.7];
    const after = [0.14, -1.1, 1.21, -0.18, -1.47, 0.37, 1.62, -0.59];
    const commonScale = 4.5;
    const renderLayerNormChart = (
      values: number[],
      phase: string,
      range: string,
      stats: string,
      caption: string,
      tone: "before" | "after",
    ) => (
      <section className={`layernorm-panel is-${tone}`}>
        <header>
          <span>{phase}</span>
          <strong>{range}</strong>
          <small>{stats}</small>
        </header>
        <div className="layernorm-chart">
          <div className="layernorm-scale" aria-hidden="true">
            <span>+4.5</span><span>+2</span><span>0</span><span>−2</span><span>−4.5</span>
          </div>
          <div className="layernorm-bars">
            {values.map((value, index) => {
              const height = `${(Math.abs(value) / commonScale) * 50}%`;
              return (
                <div className="layernorm-bar-column" key={index}>
                  <i
                    className={value < 0 ? "is-negative" : "is-positive"}
                    style={{ "--bar-height": height } as CSSProperties}
                  />
                  <b
                    className={value < 0 ? "is-negative" : "is-positive"}
                    style={{ "--bar-height": height } as CSSProperties}
                  >
                    {value > 0 ? "+" : value < 0 ? "−" : ""}{Math.abs(value).toFixed(value === 0 ? 0 : 1)}
                  </b>
                </div>
              );
            })}
          </div>
        </div>
        <footer>{caption}</footer>
      </section>
    );
    return (
      <div className="deep-scene deep-layernorm">
        {renderLayerNormChart(before, "ДО LAYERNORM", "−2.6 … +4.1", "μ = +0.59 · σ = 2.17", "значения разъехались по масштабу", "before")}
        <div className="layernorm-operation">
          <b>LayerNorm</b>
          <span>вычесть среднее<br />разделить на σ</span>
          <strong aria-hidden="true">→</strong>
        </div>
        {renderLayerNormChart(after, "ПОСЛЕ LAYERNORM", "−1.5 … +1.6", "μ ≈ 0 · σ ≈ 1", "центр около 0 · стабильный разброс", "after")}
      </div>
    );
  }

  if (scene === "mlp-token") {
    const positions = deepDive.sentence.slice(0, 5);
    return (
      <div className="deep-scene deep-mlp-token">
        <div className="mlp-token-column">
          <header><strong>ВХОД x</strong><span>состояние позиции после attention</span></header>
          {positions.map(({ token }, index) => <article key={token}><b>«{token}»</b><span>{index % 2 === 0 ? "▮ ▯ ▮ ▮" : "▯ ▮ ▮ ▯"}</span></article>)}
        </div>
        <div className="mlp-shared"><span>ОДНА СЕТЬ ДЛЯ КАЖДОЙ СТРОКИ</span><strong>MLP(x)</strong><small>вычисляет поправку к каждой позиции</small></div>
        <div className="mlp-token-column is-output">
          <header><strong>ПОПРАВКА ΔMLP</strong><span>что изменить в состоянии</span></header>
          {positions.map(({ token }, index) => <article key={token}><b>Δ «{token}»</b><span>{index % 2 === 0 ? "+ − + −" : "− + + −"}</span></article>)}
        </div>
        <footer><strong>x + ΔMLP → новое состояние</strong><span>сложение выполняет следующий residual-шаг</span></footer>
      </div>
    );
  }

  if (scene === "mlp-inside") {
    return <div className="deep-scene deep-mlp-inside"><div><span>INPUT</span><strong>{deepDive.mlp.input.toLocaleString("ru-RU")}</strong></div><b>W₁ + b</b><section>{Array.from({ length: 72 }, (_, index) => <i key={index} />)}<span>{deepDive.mlp.activation}</span><strong>{deepDive.mlp.hidden.toLocaleString("ru-RU")}</strong></section><b>W₂ + b</b><div><span>OUTPUT</span><strong>{deepDive.mlp.output.toLocaleString("ru-RU")}</strong></div></div>;
  }

  if (scene === "block") {
    const steps = [["LN", "нормализовать"], ["ATTENTION", "смешать позиции"], ["+", "residual"], ["LN", "нормализовать"], ["MLP", "изменить признаки"], ["+", "residual"]];
    return <div className="deep-scene deep-block"><header>INPUT · N × d_model</header><div>{steps.map(([name, note], index) => <article className={name === "+" ? "is-residual" : ""} key={`${name}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{name}</strong><small>{note}</small></article>)}</div><footer>OUTPUT · N × d_model</footer></div>;
  }

  if (scene === "layers") {
    return <div className="deep-scene deep-layers"><header>EMBEDDINGS</header><div>{Array.from({ length: 12 }, (_, index) => <article key={index} style={{ "--layer": index } as CSSProperties}><span>BLOCK {index + 1}</span><strong>{index < 3 ? `representation v${index + 1}` : "признаки уточняются"}</strong></article>)}</div><footer>слои не имеют жёстко назначенных человеческих ролей · представления уточняются и комбинируются</footer></div>;
  }

  if (scene === "residual-stream") {
    return <div className="deep-scene deep-residual-stream"><div className="stream-line"><span>EMBEDDING</span><i /><span>FINAL STATE</span></div><div className="stream-blocks">{Array.from({ length: 8 }, (_, index) => <article key={index}><b>B{index + 1}</b><span>ATTN + MLP</span><i>+Δ</i></article>)}</div><footer>общая матрица проходит через модель; каждый block добавляет своё изменение</footer></div>;
  }

  if (scene === "gpt3-scale") {
    return <div className="deep-scene deep-gpt3-scale"><div className="gpt3-deep-stack">{Array.from({ length: 96 }, (_, index) => <i className={index % 12 === 0 ? "is-mark" : ""} key={index} title={`Block ${index + 1}`} />)}</div><div className="gpt3-deep-stats">{deepDive.gpt3.map((stat) => <article key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}</div><footer>GPT‑3 175B · decoder-only Transformer</footer></div>;
  }

  if (scene === "logits") {
    return <div className="deep-scene deep-logits"><header><span>FINAL HIDDEN STATE</span><DeepVector values={[0.31, -0.28, 0.66, 0.14, -0.42, 0.59]} tone="blue" /></header><b>× W<sub>vocab</sub> →</b><div>{deepDive.logits.map((item) => <article key={item.token}><span>{item.token}</span><i style={{ width: `${(item.logit / 5) * 100}%` }} /><strong>{item.logit > 0 ? "+" : ""}{item.logit.toFixed(1)}</strong></article>)}</div><footer>по одному logit для каждого токена словаря</footer></div>;
  }

  if (scene === "probabilities") {
    const distribution = logitDistribution(deepDive.logits, probabilityTemperature);
    return <div className="deep-scene deep-probabilities"><div className="probability-bars">{distribution.map((item) => <article key={item.token}><span>{item.token}</span><i style={{ width: `${(item.probability * 100).toFixed(4)}%` }} /><strong>{Math.round(item.probability * 100)}%</strong></article>)}</div><div className="deep-temperature"><label htmlFor="deep-temperature">temperature <strong>{probabilityTemperature.toFixed(1)}</strong></label><input id="deep-temperature" type="range" min="0.3" max="1.6" step="0.1" value={probabilityTemperature} onChange={(event) => setProbabilityTemperature(Number(event.target.value))} /><span>точнее</span><span>разнообразнее</span></div></div>;
  }

  if (scene === "randomness") {
    return <div className="deep-scene deep-randomness"><header>PROMPT · «Маша поставила чашку на стол…»</header>{deepDive.samples.map((sample) => <article key={sample.seed}><span>SEED {sample.seed}</span><strong>{sample.text}</strong><i>{sample.text.split(" ").map((word, index) => <b key={`${word}-${index}`}>{word}</b>)}</i></article>)}<footer>одно распределение · разные допустимые траектории sampling</footer></div>;
  }

  if (scene === "kv-cache") {
    const cached = deepDive.sentence.slice(0, 7);
    return <div className="deep-scene deep-kv-cache"><section><header>БЕЗ CACHE · ШАГ 8</header>{cached.map(({ token }) => <i key={token}><span>{token}</span><b>K заново</b><b>V заново</b></i>)}<strong>повторить 7 старых вычислений</strong></section><b aria-hidden="true">→</b><section className="is-cached"><header>С KV CACHE · ШАГ 8</header>{cached.map(({ token }) => <i key={token}><span>{token}</span><b>K ✓</b><b>V ✓</b></i>)}<i className="is-new"><span>горячая</span><b>K new</b><b>V new</b></i><strong>посчитать только новую позицию</strong></section></div>;
  }

  if (scene === "context-cost") {
    const sharedLogScale = (multiplier: number) => `${8 + (Math.log2(multiplier) / 12) * 88}%`;
    return (
      <div className="deep-scene deep-context-cost">
        <header><span>КОНТЕКСТ</span><strong>ВЫЧИСЛЕНИЯ PREFILL · ~N²</strong><strong>ПАМЯТЬ KV CACHE · ~N</strong></header>
        {deepDive.contextCosts.map((item) => (
          <article key={item.tokens}>
            <span>{item.tokens}</span>
            <div><i style={{ width: sharedLogScale(item.attention) }} /><small>×{item.attention}</small></div>
            <div><i style={{ width: sharedLogScale(item.cache) }} /><small>×{item.cache}</small></div>
          </article>
        ))}
        <footer>множители относительно контекста 1K · единая логарифмическая шкала для обеих колонок</footer>
      </div>
    );
  }

  if (scene === "training") {
    const tokens = deepDive.sentence.slice(0, 7).map((item) => item.token);
    return <div className="deep-scene deep-training"><section><span>INPUT</span>{tokens.slice(0, -1).map((token) => <b key={token}>{token}</b>)}</section><i aria-hidden="true">сдвиг на 1 позицию ↓</i><section className="training-target"><span>TARGET</span>{tokens.slice(1).map((token) => <b key={token}>{token}</b>)}</section><footer>loss считается в каждой колонке · затем обновляются все веса</footer></div>;
  }

  if (scene === "train-infer") {
    return <div className="deep-scene deep-train-infer"><article><span>TRAINING</span><strong>весь правильный текст известен</strong><div>{deepDive.sentence.slice(0, 6).map(({ token }) => <i key={token}>{token}<b>loss</b></i>)}</div><small>позиции считаются параллельно</small></article><article><span>INFERENCE</span><strong>следующий токен ещё неизвестен</strong><div>{deepDive.sentence.slice(0, 4).map(({ token }) => <i key={token}>{token}</i>)}<i className="is-pending">?</i></div><small>выбор → добавить → новый проход</small></article></div>;
  }

  if (scene === "attention-limits") {
    return <div className="deep-scene deep-attention-limits"><section><span>ATTENTION MAP</span><DeepMatrix causal compact /><strong>показывает веса связей</strong></section><b>≠</b><section><span>ПОЛНОЕ ОБЪЯСНЕНИЕ</span><div>{["VALUES", "OTHER HEADS", "MLP", "RESIDUAL", "ALL LAYERS", "OUTPUT"].map((label) => <i key={label}>{label}</i>)}</div><strong>решение зависит от всей системы</strong></section></div>;
  }

  return null;
}

type GenerationOption = {
  token: string;
  probability: number;
};

function logitDistribution(
  options: readonly { token: string; logit: number }[],
  temperature: number,
) {
  const scaled = options.map(({ logit }) => logit / temperature);
  const max = Math.max(...scaled);
  const exps = scaled.map((value) => Math.exp(value - max));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return options.map(({ token }, index) => ({ token, probability: exps[index] / total }));
}

function temperatureDistribution(
  options: readonly GenerationOption[],
  temperature: number,
) {
  const logits = options.map(({ probability }) =>
    Math.log(probability) / temperature,
  );
  const exps = logits.map(Math.exp);
  const total = exps.reduce((sum, value) => sum + value, 0);
  return options.map(({ token }, index) => ({
    token,
    probability: exps[index] / total,
  }));
}

function sampleToken(
  options: readonly GenerationOption[],
  temperature: number,
) {
  const distribution = temperatureDistribution(options, temperature);
  const roll = Math.random();
  let cumulative = 0;
  for (const option of distribution) {
    cumulative += option.probability;
    if (roll <= cumulative) return option.token;
  }
  return distribution.at(-1)?.token ?? "";
}

function formatGeneratedText(prompt: string, tokens: readonly string[]) {
  return [prompt, ...tokens]
    .join(" ")
    .replace(/\s+([.,!?;:…])/g, "$1");
}

function GenerationLab() {
  const [temperature, setTemperature] = useState(0.8);
  const [generatedTokens, setGeneratedTokens] = useState<string[]>([]);
  const step = Math.min(
    generatedTokens.length,
    visuals.generation.steps.length - 1,
  );
  const complete = generatedTokens.length === visuals.generation.steps.length;
  const data = visuals.generation.steps[step];
  const adjusted = useMemo(
    () => temperatureDistribution(data.options, temperature),
    [data, temperature],
  );
  const selectedAtCurrentStep = complete
    ? generatedTokens.at(-1)
    : undefined;

  const chooseToken = (token: string) => {
    if (complete) return;
    setGeneratedTokens((current) => [...current, token]);
  };

  const sampleNext = () => {
    if (complete) {
      setGeneratedTokens([]);
      return;
    }
    chooseToken(sampleToken(data.options, temperature));
  };

  const regenerate = () => {
    setGeneratedTokens(
      visuals.generation.steps.map(({ options }) =>
        sampleToken(options, temperature),
      ),
    );
  };

  return (
    <div className="generation-lab">
      <div className="generated-context">
        {formatGeneratedText(visuals.generation.prompt, generatedTokens)}
        {!complete && <span className="cursor-block" />}
      </div>
      <div className="generation-options">
        {adjusted.map(({ token, probability }, index) => (
          <button
            type="button"
            className={[
              index === 0 ? "is-best" : "",
              selectedAtCurrentStep === token ? "is-picked" : "",
            ].filter(Boolean).join(" ")}
            key={token}
            disabled={complete}
            onClick={() => chooseToken(token)}
          >
            <span>{token}</span>
            <i style={{ width: `${probability * 100}%` }} />
            <small>{Math.round(probability * 100)}%</small>
          </button>
        ))}
      </div>
      <div className="sampling-status" aria-live="polite">
        <span>
          токен {Math.min(generatedTokens.length + 1, visuals.generation.steps.length)}
          {" / "}
          {visuals.generation.steps.length}
        </span>
        {selectedAtCurrentStep && (
          <strong>
            {visuals.generation.pickedLabel}: «{selectedAtCurrentStep}»
          </strong>
        )}
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
        <button type="button" className="sample-button" onClick={sampleNext}>
          {complete ? visuals.generation.resetButton : visuals.generation.nextButton}
        </button>
        <button type="button" onClick={regenerate}>
          {visuals.generation.regenerateButton}
        </button>
      </div>
    </div>
  );
}

function ContextVisual() {
  return (
    <div className="context-flow-diagram">
      <section className="context-package">
        <header>
          <strong>{visuals.context.label}</strong>
          <span>{visuals.context.caption}</span>
        </header>
        <div className="context-source-grid">
          {visuals.context.sources.map(({ kind, badge, title, preview }) => (
            <article className={`context-source source-${kind}`} key={kind}>
              <span>{badge}</span>
              <strong>{title}</strong>
              <small>{preview}</small>
              {kind === "images" && (
                <div className="image-patch-preview" aria-hidden="true">
                  {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
                </div>
              )}
            </article>
          ))}
        </div>
        <footer>{visuals.context.footnote}</footer>
      </section>

      <div className="context-ingress" aria-label={visuals.context.encoding}>
        <span>{visuals.context.encoding}</span>
        <div>
          {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
        </div>
        <b>→</b>
      </div>

      <div className="context-model">
        <span>INPUT</span>
        <strong>{visuals.context.modelLabel}</strong>
        <div className="context-model-stack" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
        </div>
        <small>{visuals.context.modelNote}</small>
      </div>

      <div className="context-egress">
        <b>→</b>
      </div>

      <div className="context-token-output">
        <span>{visuals.context.outputLabel}</span>
        <strong>{visuals.context.outputToken}</strong>
        <small>{visuals.context.outputProbability}</small>
      </div>
    </div>
  );
}

function CapabilityGrowthCanvas({
  showForecast,
}: {
  showForecast: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);

      const padding = { top: 50, right: 24, bottom: 44, left: 82 };
      const width = rect.width - padding.left - padding.right;
      const height = rect.height - padding.top - padding.bottom;
      const xMin = 2019;
      const xMax = 2028.35;
      const yMin = 0.015;
      const yMax = 60000;
      const xAt = (year: number) =>
        padding.left + ((year - xMin) / (xMax - xMin)) * width;
      const yAt = (minutes: number) => {
        const progress =
          (Math.log(minutes) - Math.log(yMin)) /
          (Math.log(yMax) - Math.log(yMin));
        return padding.top + height - progress * height;
      };

      const yTicks = [
        { value: 1 / 60, label: "1 сек" },
        { value: 1, label: "1 мин" },
        { value: 10, label: "10 мин" },
        { value: 60, label: "1 ч" },
        { value: 600, label: "10 ч" },
        { value: 1440, label: "1 день" },
        { value: 10080, label: "1 неделя" },
        { value: 43200, label: "1 месяц" },
      ];

      context.font = "14px SFMono-Regular, Consolas, monospace";
      context.textBaseline = "middle";
      for (const tick of yTicks) {
        const y = yAt(tick.value);
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(rect.width - padding.right, y);
        context.strokeStyle = "rgba(255,255,255,0.075)";
        context.lineWidth = 1;
        context.stroke();
        context.fillStyle = "#686c73";
        context.textAlign = "right";
        context.fillText(tick.label, padding.left - 8, y);
      }

      for (let year = 2020; year <= 2028; year += 1) {
        const x = xAt(year);
        context.beginPath();
        context.moveTo(x, padding.top);
        context.lineTo(x, padding.top + height);
        context.strokeStyle = "rgba(255,255,255,0.04)";
        context.stroke();
        context.fillStyle = "#686c73";
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillText(String(year), x, padding.top + height + 10);
      }

      const warningY = yAt(16 * 60);
      context.fillStyle = "rgba(255,118,87,0.035)";
      context.fillRect(
        padding.left,
        padding.top,
        width,
        warningY - padding.top,
      );
      context.setLineDash([4, 4]);
      context.beginPath();
      context.moveTo(padding.left, warningY);
      context.lineTo(rect.width - padding.right, warningY);
      context.strokeStyle = "rgba(255,118,87,0.52)";
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = "#ff8f75";
      context.textAlign = "right";
      context.textBaseline = "bottom";
      context.fillText(
        "16 ч · граница надёжности",
        rect.width - padding.right,
        warningY - 5,
      );

      visuals.capabilities.milestones.forEach((milestone, index) => {
        const x = xAt(milestone.year);
        context.setLineDash([3, 5]);
        context.beginPath();
        context.moveTo(x, padding.top);
        context.lineTo(x, padding.top + height);
        context.strokeStyle = "rgba(230,156,255,0.36)";
        context.stroke();
        context.setLineDash([]);
        context.save();
        context.translate(x, padding.top - 9);
        context.rotate(Math.PI / 4);
        context.fillStyle = "#e69cff";
        context.fillRect(-4, -4, 8, 8);
        context.restore();
        context.fillStyle = "#e69cff";
        context.textAlign = index === 0 ? "right" : "left";
        context.textBaseline = "bottom";
        context.fillText(
          milestone.label,
          x + (index === 0 ? -8 : 8),
          padding.top - 3,
        );
      });

      const points = visuals.capabilities.points;
      context.beginPath();
      points.forEach((point, index) => {
        const x = xAt(point.year);
        const y = yAt(point.minutes);
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.strokeStyle = "#d9ff57";
      context.lineWidth = 2.2;
      context.stroke();

      const labelledPoints = new Set([0, 3, 7, 13]);
      points.forEach((point, index) => {
        const x = xAt(point.year);
        const y = yAt(point.minutes);
        context.beginPath();
        context.arc(x, y, index === points.length - 1 ? 5 : 3.5, 0, Math.PI * 2);
        context.fillStyle = index === points.length - 1 ? "#d9ff57" : "#789dff";
        context.fill();
        context.strokeStyle = "#0d0f12";
        context.lineWidth = 1.5;
        context.stroke();
        if (labelledPoints.has(index)) {
          context.fillStyle = index === points.length - 1 ? "#d9ff57" : "#b2b5bb";
          context.textAlign = "left";
          context.textBaseline = index === points.length - 1 ? "top" : "bottom";
          context.fillText(
            `${point.model} · ${point.label}`,
            x + 7,
            y + (index === points.length - 1 ? 8 : -6),
          );
        }
      });

      if (showForecast) {
        const forecast = [points.at(-1)!, ...visuals.capabilities.projection];
        context.beginPath();
        forecast.forEach((point, index) => {
          const x = xAt(point.year);
          const y = yAt(point.minutes);
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.setLineDash([7, 6]);
        context.strokeStyle = "#e69cff";
        context.lineWidth = 2;
        context.stroke();
        context.setLineDash([]);

        visuals.capabilities.projection.forEach((point) => {
          const x = xAt(point.year);
          const y = yAt(point.minutes);
          context.beginPath();
          context.arc(x, y, 4, 0, Math.PI * 2);
          context.fillStyle = "#0d0f12";
          context.fill();
          context.strokeStyle = "#e69cff";
          context.lineWidth = 2;
          context.stroke();
          context.fillStyle = "#e69cff";
          context.textAlign = "right";
          context.textBaseline = "bottom";
          context.fillText(point.label, x - 7, y - 6);
        });
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [showForecast]);

  return (
    <canvas
      className="capability-growth-canvas"
      ref={canvasRef}
      role="img"
      aria-label="Рост 50-процентного горизонта выполнения задач frontier-агентами по данным METR"
    />
  );
}

function CapabilitiesVisual() {
  const [showForecast, setShowForecast] = useState(true);

  return (
    <div className="capability-growth">
      <header>
        <div>
          <span>{visuals.capabilities.metric}</span>
          <small>{visuals.capabilities.axis}</small>
        </div>
        <button type="button" onClick={() => setShowForecast((current) => !current)}>
          {showForecast
            ? visuals.capabilities.hideForecastButton
            : visuals.capabilities.forecastButton}
        </button>
      </header>
      <CapabilityGrowthCanvas showForecast={showForecast} />
      <div className="capability-legend">
        <span className="actual">{visuals.capabilities.actualLabel}</span>
        <span className="forecast">{visuals.capabilities.forecastLabel}</span>
        <strong>{visuals.capabilities.doubling}</strong>
      </div>
      <div className="capability-milestones">
        {visuals.capabilities.milestones.map((milestone) => (
          <div key={milestone.label}>
            <span>{milestone.label}</span>
            <small>{milestone.note}</small>
          </div>
        ))}
      </div>
      <p>{visuals.capabilities.warning}. {visuals.capabilities.footnote}</p>
    </div>
  );
}

function LearningVisual() {
  const learning = visuals.learning;

  return (
    <div className="learning-basics">
      <header>
        <span>ОБУЧАЮЩИЙ ПРИМЕР</span>
        <strong>{learning.example}</strong>
      </header>
      <div className="learning-loop">
        <article className="learning-prediction is-before">
          <span>01 · ПРЕДСКАЗАТЬ</span>
          <strong>{learning.predictionBefore}</strong>
        </article>
        <b aria-hidden="true">→</b>
        <article className="learning-compare">
          <span>02 · СРАВНИТЬ</span>
          <strong>{learning.target}</strong>
          <small>{learning.error}</small>
        </article>
        <b aria-hidden="true">→</b>
        <article className="learning-update">
          <span>03 · ПОПРАВИТЬ</span>
          <div>{Array.from({ length: 36 }, (_, index) => <i key={index} />)}</div>
          <strong>{learning.update}</strong>
        </article>
        <b aria-hidden="true">→</b>
        <article className="learning-prediction is-after">
          <span>04 · СНОВА</span>
          <strong>{learning.predictionAfter}</strong>
        </article>
      </div>
      <div className="learning-repeat"><b>↻</b><strong>{learning.repeat}</strong></div>
      <footer><span>{learning.inferenceTitle}</span><strong>{learning.inferenceNote}</strong></footer>
    </div>
  );
}

function TrainingVisual() {
  return (
    <div className="training-stages">
      {visuals.training.map(({ number, title, phase, signal, learns, result }) => (
        <div className="training-stage" key={number}>
          <span className="training-number">{number}</span>
          <header>
            <small>{phase}</small>
            <strong>{title}</strong>
          </header>
          <div className="training-signal">
            <small>НА ЧЁМ УЧИМ</small>
            <span>{signal}</span>
          </div>
          <div className="training-learning">
            <small>ЧЕМУ УЧИТСЯ</small>
            <strong>{learns}</strong>
            <span>→ {result}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ToolsVisual() {
  return (
    <div className="tool-call-diagram" role="img" aria-label={visuals.tools.ariaLabel}>
      <div className="tool-flow-main">
        {visuals.tools.steps.map((step, index) => (
          <div className="tool-flow-segment" key={step.number}>
            <article className={`tool-step tool-step-${step.tone}`}>
              <header>
                <span>{step.number}</span>
                <small>{step.owner}</small>
              </header>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
              {"code" in step && step.code && <code>{step.code}</code>}
              {"checks" in step && step.checks && (
                <div className="tool-checks">
                  {step.checks.map((check) => <span key={check}>✓ {check}</span>)}
                </div>
              )}
            </article>
            {index < visuals.tools.steps.length - 1 && (
              <b className="tool-flow-arrow" aria-hidden="true">→</b>
            )}
          </div>
        ))}
      </div>

      <div className="tool-result-rail">
        <div className="tool-result-payload">
          <span>{visuals.tools.resultNumber} · {visuals.tools.resultLabel}</span>
          <code>{visuals.tools.resultCode}</code>
        </div>
        <b aria-hidden="true">↩</b>
        <div className="tool-result-context">
          <strong>{visuals.tools.returnTitle}</strong>
          <span>{visuals.tools.returnNote}</span>
        </div>
        <small>{visuals.tools.loopLabel}</small>
      </div>
    </div>
  );
}

function HarnessVisual() {
  return (
    <div className="harness-table-wrap">
      <table className="harness-table">
        <thead>
          <tr><th />{visuals.harness.columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {visuals.harness.rows.map(({ label, values }) => (
            <tr key={label}>
              <th>{label}</th>
              {values.map((value, index) => (
                <td key={index} className={value === true ? "yes" : value === false ? "no" : ""}>
                  {value === true ? "+" : value === false ? "−" : value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="harness-table-note">{visuals.harness.note}</footer>
    </div>
  );
}

function AgentSearchVisual() {
  const search = visuals.agentSearch;

  return (
    <div className="agent-search-board" role="img" aria-label="Как агент ищет информацию в репозитории">
      <header>{search.lead}</header>
      <div className="agent-search-list">
        {search.examples.map((example, index) => (
          <article key={example.label}>
            <span>{String(index + 1).padStart(2, "0")} · {example.label}</span>
            <code>{example.query}</code>
            <small>{example.note}</small>
          </article>
        ))}
      </div>
      <footer>{search.footnote}</footer>
    </div>
  );
}

type EffortTask = (typeof visuals.effort.tasks)[keyof typeof visuals.effort.tasks];
type EffortModel = EffortTask["models"][number];

function EffortModelChart({
  task,
  taskId,
}: {
  task: EffortTask;
  taskId: keyof typeof visuals.effort.tasks;
}) {
  const width = 820;
  const height = 430;
  const plot = { left: 74, right: 116, top: 42, bottom: 62 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const xAt = (value: number) => plot.left + (value / 100) * plotWidth;
  const yAt = (value: number) =>
    plot.top + plotHeight - (value / 100) * plotHeight;
  const pathFor = (model: EffortModel) =>
    model.points.reduce((path, point, index) => {
      const x = xAt(point.x);
      const y = yAt(point.y);
      if (index === 0) return `M ${x} ${y}`;
      return `${path} L ${x} ${y}`;
    }, "");
  const effortPoint = (modelId: string, effortId: string) => {
    const model = task.models.find((candidate) => candidate.id === modelId);
    return model?.efforts.find((effort) => effort.id === effortId);
  };
  const comparisonFrom = effortPoint(
    task.comparison.fromModel,
    task.comparison.fromEffort,
  );
  const comparisonTo = effortPoint(
    task.comparison.toModel,
    task.comparison.toEffort,
  );
  const titleId = `effort-${taskId}-chart-title`;
  const descriptionId = `effort-${taskId}-chart-description`;
  const arrowId = `effort-${taskId}-axis-arrow`;

  return (
    <svg
      className="effort-model-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>{task.title}</title>
      <desc id={descriptionId}>
        Две кривые моделей. На каждой одновременно отмечены уровни effort medium и max.
      </desc>
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>

      {[25, 50, 75].map((tick) => (
        <g key={tick}>
          <line
            className="effort-grid-line"
            x1={plot.left}
            y1={yAt(tick)}
            x2={width - plot.right}
            y2={yAt(tick)}
          />
          <line
            className="effort-grid-line"
            x1={xAt(tick)}
            y1={plot.top}
            x2={xAt(tick)}
            y2={height - plot.bottom}
          />
        </g>
      ))}
      <line
        className="effort-axis"
        x1={plot.left}
        y1={height - plot.bottom}
        x2={plot.left}
        y2={plot.top}
        markerEnd={`url(#${arrowId})`}
      />
      <line
        className="effort-axis"
        x1={plot.left}
        y1={height - plot.bottom}
        x2={width - plot.right + 16}
        y2={height - plot.bottom}
        markerEnd={`url(#${arrowId})`}
      />

      {task.models.map((model) => (
        <g key={model.id}>
          <path
            className="effort-series"
            d={pathFor(model)}
            stroke={model.color}
          />
          <text
            className={`effort-series-label effort-series-label-${model.id}`}
            x={width - 18}
            y={yAt(model.points.at(-1)?.y ?? 0) + 4}
            fill={model.color}
            textAnchor="end"
          >
            {model.label}
          </text>
          {model.efforts.map((effort) => (
            <g key={effort.id}>
              <circle
                className="effort-point-halo"
                cx={xAt(effort.x)}
                cy={yAt(effort.y)}
                r="11"
                stroke={model.color}
              />
              <circle
                className="effort-point"
                cx={xAt(effort.x)}
                cy={yAt(effort.y)}
                r="6"
                fill={model.color}
              />
              <text
                className={`effort-point-label effort-point-label-${model.id}-${effort.id}`}
                x={xAt(effort.x)}
                y={yAt(effort.y)}
                fill={model.color}
              >
                {effort.label}
              </text>
            </g>
          ))}
        </g>
      ))}

      <text
        className="effort-axis-label effort-axis-label-y"
        x={18}
        y={plot.top + plotHeight / 2}
        transform={`rotate(-90 18 ${plot.top + plotHeight / 2})`}
      >
        {visuals.effort.yAxis}
      </text>
      <text
        className="effort-axis-label effort-axis-label-x"
        x={plot.left + plotWidth / 2}
        y={height - 16}
      >
        {visuals.effort.xAxis}
      </text>

      {comparisonFrom && comparisonTo ? (
        <g className="effort-comparison-callout">
          <line
            className="effort-comparison-line"
            x1={xAt(comparisonFrom.x) + 10}
            y1={yAt(comparisonFrom.y)}
            x2={xAt(comparisonTo.x) - 10}
            y2={yAt(comparisonTo.y)}
          />
          <text
            className="effort-comparison-label"
            x={(xAt(comparisonFrom.x) + xAt(comparisonTo.x)) / 2}
            y={yAt(comparisonFrom.y) - 48}
          >
            {task.comparison.label}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

function AgentLoopVisual() {
  const loop = visuals.agentLoop;

  return (
    <div className="agent-loop-overview">
      <div className="agent-loop-steps">
        {loop.steps.map((step, index) => (
          <div className="agent-loop-segment" key={step.number}>
            <article>
              <span>{step.number}</span>
              <strong>{step.title}</strong>
              <small>{step.note}</small>
            </article>
            {index < loop.steps.length - 1 && <b aria-hidden="true">→</b>}
          </div>
        ))}
      </div>
      <div className="agent-loop-return"><span>если не готово</span><i /><b>↩ следующий шаг</b></div>
      <div className="agent-loop-domains">
        {loop.domains.map((domain) => <article key={domain.title}><strong>{domain.title}</strong><span>{domain.route}</span></article>)}
      </div>
      <footer>{loop.rule}</footer>
    </div>
  );
}

function ModelLinesVisual() {
  const lines = visuals.modelLines;

  return (
    <div className="model-lines-overview">
      <header>{lines.axes.map((axis) => <span key={axis}>{axis}</span>)}</header>
      <div className="model-line-cards">
        {lines.classes.map((modelClass) => (
          <article className={`model-line-${modelClass.id}`} key={modelClass.id}>
            <header><strong>{modelClass.title}</strong><span>{modelClass.note}</span></header>
            <div><span>способности</span><i><b style={{ width: `${modelClass.capability}%` }} /></i></div>
            <div><span>скорость</span><i><b style={{ width: `${modelClass.speed}%` }} /></i></div>
            <div><span>цена</span><i><b style={{ width: `${modelClass.cost}%` }} /></i></div>
          </article>
        ))}
      </div>
      <div className="model-lines-question"><strong>{lines.question}</strong><span>{lines.next} →</span></div>
    </div>
  );
}

function EffortVisual({ taskId }: { taskId: keyof typeof visuals.effort.tasks }) {
  const task = visuals.effort.tasks[taskId];

  return (
    <div className="effort-comparison">
      <header>
        <span>{task.title}</span>
        <strong>{task.subtitle}</strong>
      </header>

      <EffortModelChart task={task} taskId={taskId} />

      <div className="effort-insights">
        {task.insights.map((insight) => (
          <article key={insight.title}>
            <strong>{insight.title}</strong>
            <p>{insight.note}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ChooserLab() {
  const [risk, setRisk] = useState(1);

  return (
    <div className="chooser-matrix">
      <header>
        <strong>{visuals.chooser.contextRule}</strong>
        <div className="chooser-risk">
          <span>{visuals.chooser.riskLabel}</span>
          <div>
            {visuals.chooser.riskLevels.map((level, index) => (
              <button
                type="button"
                className={index === risk ? "is-active" : ""}
                onClick={() => setRisk(index)}
                key={level.id}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="chooser-table-wrap">
        <table className="chooser-table">
          <thead>
            <tr>
              {visuals.chooser.columns.map((column) => <th key={column}>{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {visuals.chooser.rows.map((row) => {
              const recommendation = row.recommendations[risk];
              return (
                <tr key={row.task}>
                  <th>
                    <strong>{row.task}</strong>
                    <small>{row.examples}</small>
                  </th>
                  <td className={`model-cell model-${recommendation.model.toLowerCase()}`}>
                    {recommendation.model}
                  </td>
                  <td className={`effort-cell effort-${recommendation.effort}`}>
                    {recommendation.effort}
                  </td>
                  <td className="check-cell">{recommendation.check}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p>{visuals.chooser.footnote}</p>
    </div>
  );
}

function AgentExtensionVisual({ kind }: { kind: "skills" | "mcp" | "subagents" }) {
  if (kind === "skills") {
    return (
      <div className="agent-extension agent-extension-skills">
        <div className="agent-extension-file">
          <span>SKILL.md</span>
          <strong>Инструкции</strong>
          <small>ресурсы · скрипты · проверка</small>
        </div>
        <b aria-hidden="true">→</b>
        <div className="agent-extension-result">
          <span>ПОВТОРЯЕМЫЙ WORKFLOW</span>
          <strong>Одинаковый подход</strong>
          <small>для каждого подходящего запроса</small>
        </div>
      </div>
    );
  }

  if (kind === "mcp") {
    return (
      <div className="agent-extension agent-extension-mcp">
        <div className="agent-extension-node agent-extension-primary"><span>CODEX</span><strong>Агент</strong></div>
        <b aria-hidden="true">↔</b>
        <div className="agent-extension-node agent-extension-protocol"><span>ПРОТОКОЛ</span><strong>MCP</strong></div>
        <b aria-hidden="true">↔</b>
        <div className="agent-extension-systems">
          <span>ДАННЫЕ И ДЕЙСТВИЯ</span>
          <div><strong>Docs</strong><strong>Figma</strong><strong>Browser</strong><strong>Logs</strong></div>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-extension agent-extension-subagents">
      <div className="agent-extension-main"><span>ГЛАВНЫЙ АГЕНТ</span><strong>Делит задачу</strong></div>
      <b aria-hidden="true">↓</b>
      <div className="agent-extension-workers">
        <article><span>01</span><strong>Исследование</strong></article>
        <article><span>02</span><strong>Тесты</strong></article>
        <article><span>03</span><strong>Review</strong></article>
      </div>
      <div className="agent-extension-summary"><span>↑</span><strong>Сводный результат</strong></div>
    </div>
  );
}

function SetupFlowVisual() {
  return (
    <div className="setup-flow-board">
      <div className="setup-flow-grid">
        {visuals.setup.flow.map((step, index) => (
          <div className={`setup-flow-step setup-flow-step-${step.number}`} key={step.number}>
            <article>
              <header><span>{step.number}</span><small>{step.actor}</small></header>
              <strong>{step.title}</strong>
              <p>{step.note}</p>
            </article>
            {index < visuals.setup.flow.length - 1 && <b aria-hidden="true">→</b>}
          </div>
        ))}
      </div>
      <div className="setup-flow-retry"><span>↶</span><strong>{visuals.setup.retry}</strong></div>
    </div>
  );
}

function SetupDocsVisual() {
  return (
    <div className="setup-docs-board">
      <div className="setup-file-tree">
        {visuals.setup.tree.map((item, index) => (
          <div className={`setup-tree-row setup-tree-${item.kind}`} key={`${item.name}-${index}`} style={{ paddingLeft: `${16 + item.depth * 28}px` }}>
            <span aria-hidden="true">{item.kind === "folder" ? "▾" : "·"}</span>
            <code>{item.name}</code>
            {item.badge && <b>{item.badge}</b>}
            {item.note && <small>{item.note}</small>}
          </div>
        ))}
      </div>
      <aside className="setup-docs-legend">
        {visuals.setup.docsLegend.map((item) => (
          <article key={item.kind}>
            <span>{item.kind}</span>
            <strong>{item.title}</strong>
            <p>{item.note}</p>
          </article>
        ))}
      </aside>
    </div>
  );
}

function SetupPlanVisual() {
  return (
    <div className="setup-plan-board">
      <header><span>MARKDOWN</span><code>{visuals.setup.plan.path}</code></header>
      <div className="setup-plan-content">
        {visuals.setup.plan.sections.map((section) => (
          <section key={section.title}>
            <strong># {section.title}</strong>
            {section.lines.map((line) => <p key={line}>{line}</p>)}
          </section>
        ))}
      </div>
    </div>
  );
}

function TrajectoryCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);

      const padding = { top: 24, right: 24, bottom: 44, left: 78 };
      const width = rect.width - padding.left - padding.right;
      const height = rect.height - padding.top - padding.bottom;
      const xMin = 2023;
      const xMax = 2028.3;
      const yMin = 0.8;
      const yMax = 60000;
      const xAt = (year: number) =>
        padding.left + ((year - xMin) / (xMax - xMin)) * width;
      const yAt = (minutes: number) => {
        const progress =
          (Math.log(minutes) - Math.log(yMin)) /
          (Math.log(yMax) - Math.log(yMin));
        return padding.top + height - progress * height;
      };

      const ticks = [
        { value: 1, label: "1 мин" },
        { value: 10, label: "10 мин" },
        { value: 60, label: "1 ч" },
        { value: 600, label: "10 ч" },
        { value: 1440, label: "1 день" },
        { value: 10080, label: "1 неделя" },
        { value: 43200, label: "1 месяц" },
      ];
      context.font = "14px SFMono-Regular, Consolas, monospace";
      context.textBaseline = "middle";
      ticks.forEach((tick) => {
        const y = yAt(tick.value);
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(rect.width - padding.right, y);
        context.strokeStyle = "rgba(255,255,255,0.07)";
        context.lineWidth = 1;
        context.stroke();
        context.fillStyle = "#686c73";
        context.textAlign = "right";
        context.fillText(tick.label, padding.left - 8, y);
      });

      for (let year = 2023; year <= 2028; year += 1) {
        const x = xAt(year);
        context.beginPath();
        context.moveTo(x, padding.top);
        context.lineTo(x, padding.top + height);
        context.strokeStyle = "rgba(255,255,255,0.04)";
        context.stroke();
        context.fillStyle = "#686c73";
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillText(String(year), x, padding.top + height + 9);
      }

      const warningY = yAt(16 * 60);
      context.fillStyle = "rgba(255,118,87,0.035)";
      context.fillRect(
        padding.left,
        padding.top,
        width,
        warningY - padding.top,
      );
      context.setLineDash([4, 4]);
      context.beginPath();
      context.moveTo(padding.left, warningY);
      context.lineTo(rect.width - padding.right, warningY);
      context.strokeStyle = "rgba(255,118,87,0.52)";
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = "#ff8f75";
      context.textAlign = "right";
      context.textBaseline = "bottom";
      context.fillText("16 ч", rect.width - padding.right, warningY - 4);

      const actual = visuals.trajectory.actual;
      context.beginPath();
      actual.forEach((point, index) => {
        const x = xAt(point.year);
        const y = yAt(point.minutes);
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.strokeStyle = "#d9ff57";
      context.lineWidth = 2.4;
      context.stroke();

      actual.forEach((point, index) => {
        const x = xAt(point.year);
        const y = yAt(point.minutes);
        context.beginPath();
        context.arc(x, y, index === actual.length - 1 ? 5 : 3.5, 0, Math.PI * 2);
        context.fillStyle = index === actual.length - 1 ? "#d9ff57" : "#789dff";
        context.fill();
        context.strokeStyle = "#0d0f12";
        context.lineWidth = 1.5;
        context.stroke();
      });

      const forecast = [actual.at(-1)!, ...visuals.trajectory.projection];
      context.beginPath();
      forecast.forEach((point, index) => {
        const x = xAt(point.year);
        const y = yAt(point.minutes);
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.setLineDash([7, 6]);
      context.strokeStyle = "#e69cff";
      context.lineWidth = 2;
      context.stroke();
      context.setLineDash([]);

      visuals.trajectory.projection.forEach((point) => {
        const x = xAt(point.year);
        const y = yAt(point.minutes);
        context.beginPath();
        context.arc(x, y, 4, 0, Math.PI * 2);
        context.fillStyle = "#0d0f12";
        context.fill();
        context.strokeStyle = "#e69cff";
        context.lineWidth = 2;
        context.stroke();
        context.fillStyle = "#e69cff";
        context.textAlign = "right";
        context.textBaseline = "bottom";
        context.fillText(point.label, x - 7, y - 6);
      });
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <canvas
      className="trajectory-canvas"
      ref={canvasRef}
      role="img"
      aria-label="График роста 50-процентного горизонта выполнения задач frontier-агентами по данным METR"
    />
  );
}

function TrajectoryVisual() {
  return (
    <div className="trajectory-chart">
      <header>
        <div>
          <span>{visuals.trajectory.metric}</span>
          <small>{visuals.trajectory.method}</small>
        </div>
        <div className="trajectory-growth">
          <strong>{visuals.trajectory.growth}</strong>
          <span>{visuals.trajectory.growthNote}</span>
        </div>
      </header>
      <TrajectoryCanvas />
      <div className="trajectory-values">
        {visuals.trajectory.actual.map((point) => (
          <div key={point.model}>
            <span>{point.model}</span>
            <strong>{point.label}</strong>
          </div>
        ))}
      </div>
      <footer>
        <div className="trajectory-legend">
          <span className="actual">{visuals.trajectory.actualLabel}</span>
          <span className="forecast">{visuals.trajectory.forecastLabel}</span>
          <strong>{visuals.trajectory.doubling}</strong>
        </div>
        <small>{visuals.trajectory.warning}. {visuals.trajectory.footnote}</small>
      </footer>
    </div>
  );
}

function SkillsVisual() {
  return (
    <div className="skills-framework">
      <div className="skills-shift">
        <div className="skills-shift-from">
          <span>{visuals.skills.shift.fromLabel}</span>
          <strong>{visuals.skills.shift.fromTitle}</strong>
          <small>{visuals.skills.shift.fromNote}</small>
        </div>
        <b aria-hidden="true">→</b>
        <div className="skills-shift-to">
          <span>{visuals.skills.shift.toLabel}</span>
          <strong>{visuals.skills.shift.toTitle}</strong>
          <small>{visuals.skills.shift.toNote}</small>
        </div>
      </div>

      <span className="skills-framework-label">{visuals.skills.label}</span>

      <div className="skill-groups">
        {visuals.skills.groups.map((group) => (
          <section className={`skill-group skill-group-${group.id}`} key={group.id}>
            <header>
              <span>{group.number}</span>
              <div>
                <strong>{group.title}</strong>
                <small>{group.note}</small>
              </div>
            </header>
            {group.skills.map((skill) => (
              <article key={skill.title}>
                <strong>{skill.title}</strong>
                <p>{skill.note}</p>
              </article>
            ))}
          </section>
        ))}
      </div>

      <footer>{visuals.skills.footnote}</footer>
    </div>
  );
}

function WorkFutureVisual() {
  const work = visuals.workFuture;

  return (
    <div className="work-future-map">
      <header>
        <span>{work.topLabel}</span>
        <strong>Таксономия Блума × рынок задач</strong>
      </header>

      <div className="work-future-levels">
        {work.levels.map((level) => (
          <article
            className={`work-future-level work-future-level-${level.id}`}
            key={level.id}
            style={{ "--level-width": `${level.width}%` } as CSSProperties}
          >
            <span>{level.number}</span>
            <strong>{level.title}</strong>
            <p>{level.tasks}</p>
            <b>{level.mode}</b>
          </article>
        ))}
      </div>

      <div className="work-future-direction">
        <i aria-hidden="true" />
        <span>{work.bottomLabel}</span>
      </div>

      <section className="work-future-resilience">
        <span>{work.resilienceLabel}</span>
        <div>
          {work.resilience.map((item) => <b key={item}>{item}</b>)}
        </div>
      </section>

      <footer>{work.footnote}</footer>
    </div>
  );
}

function AutomationBoundaryVisual() {
  const boundary = visuals.automationBoundary;

  return (
    <div className="automation-boundary-board">
      <div className="automation-boundary-columns">
        <section className="automation-boundary-agent">
          <header>{boundary.automatesLabel}</header>
          <ol>
            {boundary.automates.map((item, index) => (
              <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>
            ))}
          </ol>
        </section>
        <section className="automation-boundary-human">
          <header>{boundary.humanLabel}</header>
          <ol>
            {boundary.human.map((item, index) => (
              <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>
            ))}
          </ol>
        </section>
      </div>
      <div className="automation-boundary-conditions">
        {boundary.conditions.map((condition) => <small key={condition}>{condition}</small>)}
      </div>
      <footer>{boundary.responsibility}</footer>
    </div>
  );
}

function ModelProductVisual() {
  return (
    <figure className="model-product-visual">
      {/* eslint-disable-next-line @next/next/no-img-element -- static presentation asset is served directly. */}
      <img
        src={visuals.modelProduct.image}
        alt={visuals.modelProduct.alt}
        width="1080"
        height="605"
        loading="eager"
      />
    </figure>
  );
}

function HumanAiComplexityVisual() {
  return (
    <figure className="human-ai-complexity-visual">
      {/* eslint-disable-next-line @next/next/no-img-element -- static presentation asset is served directly. */}
      <img
        className="localized-image-ru"
        src="/human-ai-complexity.png"
        alt="График роста сложности задач: возможности ИИ растут ступенчато, а человек начинает решать более сложные задачи"
        width="903"
        height="655"
        loading="eager"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- English-localized static presentation asset. */}
      <img
        className="localized-image-en"
        src="/human-ai-complexity.en.png"
        alt="Chart of growing task complexity: AI capabilities rise in steps while humans move on to more complex tasks"
        width="903"
        height="655"
        loading="eager"
      />
    </figure>
  );
}

function OutcomeOverImplementationVisual() {
  return (
    <figure className="outcome-over-implementation-visual">
      {/* eslint-disable-next-line @next/next/no-img-element -- static presentation asset is served directly. */}
      <img
        className="localized-image-ru"
        src="/outcome-over-implementation.png"
        alt="Диалог: разработчик рассказывает о сложной реализации, а заказчик просит просто выполнить его заказ"
        width="842"
        height="538"
        loading="eager"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- English-localized static presentation asset. */}
      <img
        className="localized-image-en"
        src="/outcome-over-implementation.en.png"
        alt="Dialogue: a developer describes a complex implementation while the customer asks for the order"
        width="842"
        height="530"
        loading="eager"
      />
    </figure>
  );
}

function RetrospectiveVisual() {
  return (
    <div className="retrospective-board">
      <div className="retrospective-timeline">
        {visuals.retrospective.entries.map((entry, index) => (
          <article key={`${entry.date}-${entry.unit}`}>
            <time>{entry.date}</time>
            <span className="retrospective-dot" aria-hidden="true" />
            <div>
              <b>{entry.unit}</b>
              <strong>{entry.title}</strong>
              <small>{entry.note}</small>
            </div>
            <i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
          </article>
        ))}
      </div>
      <footer>
        <strong>{visuals.retrospective.start}</strong>
        <span>→ {visuals.retrospective.duration} →</span>
        <strong>{visuals.retrospective.finish}</strong>
      </footer>
    </div>
  );
}

function CapabilitiesTodayVisual() {
  return (
    <div className="capabilities-today-board">
      <div>
        {visuals.capabilitiesToday.cards.map((card) => (
          <article className={`capability-now-${card.id}`} key={card.id}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </div>
      <footer>{visuals.capabilitiesToday.note}</footer>
    </div>
  );
}

function CapabilityArtifactsVisual() {
  return (
    <div className="capability-artifacts-board">
      <div className="capability-artifacts-grid">
        {visuals.capabilityArtifacts.cases.map((item) => (
          <article className={`capability-artifact-${item.id}`} key={item.id}>
            <header>{item.owner}</header>
            <h3>{item.title}</h3>
            <div className="capability-artifact-metrics">
              {item.metrics.map((metric) => (
                <div key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong></div>
              ))}
            </div>
            <section><small>КАК ПРОВЕРЯЛИ</small><b>{item.verifier}</b></section>
            <footer>{item.status}</footer>
          </article>
        ))}
      </div>
      <div className="capability-artifacts-formula">
        <strong>{visuals.capabilityArtifacts.formula}</strong>
        <span>{visuals.capabilityArtifacts.warning}</span>
      </div>
    </div>
  );
}

function SecurityControlVisual() {
  const security = visuals.securityControl;

  return (
    <div className="security-control-board">
      <div className="security-control-incidents">
        {security.incidents.map((incident) => (
          <article className={`security-incident-${incident.id}`} key={incident.id}>
            <header>
              <span>{incident.number} · {incident.label}</span>
              <strong>{incident.model}</strong>
            </header>
            <div className="security-control-path">
              {incident.path.map((step, index) => (
                <Fragment key={step}>
                  <span>{step}</span>
                  {index < incident.path.length - 1 && <b aria-hidden="true">→</b>}
                </Fragment>
              ))}
            </div>
            <footer>{incident.result}</footer>
          </article>
        ))}
      </div>
      <section className="security-control-threshold">
        <span>{security.threshold.label}</span>
        <div>
          <strong>{security.threshold.title}</strong>
          <p>{security.threshold.note}</p>
        </div>
      </section>
      <section className="security-control-regulation">
        <header>{security.regulation.label}</header>
        <div>
          {security.regulation.items.map((item) => <span key={item}>{item}</span>)}
        </div>
        <footer>{security.regulation.conclusion}</footer>
      </section>
    </div>
  );
}

function CapabilityResearchVisual() {
  return (
    <div className="capability-research-board">
      <header>{visuals.capabilityResearch.study}</header>
      <div className="capability-research-main">
        <div className="research-comparisons">
          {visuals.capabilityResearch.comparisons.map((comparison) => (
            <article key={comparison.budget}>
              <header><strong>{comparison.budget}</strong><span>WINNER · {comparison.winner}</span></header>
              <div className="research-bar research-bar-agent"><span>AGENT</span><i><b style={{ width: `${comparison.agent}%` }} /></i></div>
              <div className="research-bar research-bar-human"><span>HUMAN</span><i><b style={{ width: `${comparison.human}%` }} /></i></div>
              <footer>{comparison.note}</footer>
            </article>
          ))}
        </div>
        <section className="research-kernel-card">
          <header>{visuals.capabilityResearch.kernel.label}</header>
          <div><span>START</span><strong>{visuals.capabilityResearch.kernel.start}</strong></div>
          <div><span>REFERENCE</span><strong>{visuals.capabilityResearch.kernel.reference}</strong></div>
          <div><span>BEST HUMAN</span><strong>{visuals.capabilityResearch.kernel.human}</strong></div>
          <div className="is-agent"><span>AGENT</span><strong>{visuals.capabilityResearch.kernel.agent}</strong></div>
          <footer>{visuals.capabilityResearch.speed}</footer>
        </section>
      </div>
      <div className="research-limits">
        {visuals.capabilityResearch.limits.map((limit) => <span key={limit}>× {limit}</span>)}
        <strong>{visuals.capabilityResearch.note}</strong>
      </div>
    </div>
  );
}

function ModalitiesVisual() {
  return (
    <div className="modalities-board">
      <header>{visuals.modalities.columns.map((column) => <strong key={column}>{column}</strong>)}</header>
      <div>
        {visuals.modalities.rows.map((row) => (
          <article className={`modality-${row.id}`} key={row.id}>
            <strong>{row.name}</strong>
            <span>{row.understand}</span>
            <span>{row.generate}</span>
            <small>{row.engine}</small>
          </article>
        ))}
      </div>
      <footer>{visuals.modalities.note}</footer>
    </div>
  );
}

function ChatToolsVisual() {
  return (
    <div className="chat-tools-board">
      <div className="chat-tools-grid">
        {visuals.chatTools.tools.map((tool) => (
          <article className={`chat-tool-${tool.id}`} key={tool.id}>
            <strong>{tool.title}</strong>
            <span>{tool.input}</span>
            <b aria-hidden="true">→</b>
            <small>{tool.output}</small>
          </article>
        ))}
      </div>
      <div className="chat-tools-flow">
        {visuals.chatTools.flow.map((step, index) => (
          <div key={step}><strong>{step}</strong>{index < visuals.chatTools.flow.length - 1 && <b>→</b>}</div>
        ))}
      </div>
    </div>
  );
}

function AgentUseCasesVisual() {
  return (
    <div className="agent-use-cases-board">
      <header>{visuals.agentUseCases.lead}</header>
      <div className="agent-use-cases-grid">
        {visuals.agentUseCases.cases.map((useCase) => (
          <article className={`agent-use-case-${useCase.id}`} key={useCase.id}>
            <span>{useCase.role}</span>
            <strong>{useCase.result}</strong>
            <small>{useCase.task}</small>
            <footer>{useCase.tools}</footer>
          </article>
        ))}
      </div>
      <div className="agent-use-cases-formula">
        {visuals.agentUseCases.formula.map((part, index) => (
          <div key={part}><strong>{part}</strong>{index < visuals.agentUseCases.formula.length - 1 && <b>+</b>}</div>
        ))}
      </div>
    </div>
  );
}

function NonCodeAgentVisual() {
  return (
    <div className="non-code-agent-board">
      <header><span>{visuals.nonCodeAgent.goalLabel}</span><strong>{visuals.nonCodeAgent.goal}</strong></header>
      <div className="non-code-agent-steps">
        {visuals.nonCodeAgent.steps.map((step, index) => (
          <div key={step.number}>
            <article><span>{step.number}</span><strong>{step.title}</strong><small>{step.note}</small></article>
            {index < visuals.nonCodeAgent.steps.length - 1 && <b aria-hidden="true">→</b>}
          </div>
        ))}
      </div>
      <footer>
        <span>{visuals.nonCodeAgent.checksLabel}</span>
        <div>{visuals.nonCodeAgent.checks.map((check) => <strong key={check}>✓ {check}</strong>)}</div>
      </footer>
    </div>
  );
}

function AgentWorkInboxVisual() {
  return (
    <div className="agent-work-inbox-board">
      <header><span>{visuals.agentWorkInbox.sourceLabel}</span><strong>{visuals.agentWorkInbox.trigger}</strong></header>
      <div className="agent-work-inbox-flow">
        <section className="work-inbox-inputs">
          <h3>РАЗРОЗНЕННЫЕ ВХОДЫ</h3>
          {visuals.agentWorkInbox.inputs.map((input) => (
            <article key={`${input.kind}-${input.text}`}><span>{input.kind}</span><strong>{input.text}</strong></article>
          ))}
        </section>
        <section className="work-inbox-process">
          <h3>AGENT LOOP</h3>
          {visuals.agentWorkInbox.steps.map((step, index) => <div key={step}><span>0{index + 1}</span><strong>{step}</strong></div>)}
        </section>
        <section className="work-inbox-outputs">
          <h3>ПРОВЕРЯЕМЫЕ ВЫХОДЫ</h3>
          {visuals.agentWorkInbox.outputs.map((output) => (
            <article key={output.kind}>
              <header><span>{output.kind}</span><b className={`mode-${output.mode.toLowerCase()}`}>{output.mode}</b></header>
              <strong>{output.title}</strong><small>{output.note}</small>
            </article>
          ))}
        </section>
      </div>
      <footer>{visuals.agentWorkInbox.result}</footer>
    </div>
  );
}

function AgentAutonomyVisual() {
  return (
    <div className="agent-autonomy-board">
      <header>{visuals.agentAutonomy.axis}</header>
      <div className="agent-autonomy-zones">
        {visuals.agentAutonomy.zones.map((zone) => (
          <article className={`agent-autonomy-${zone.id}`} key={zone.id}>
            <header><span>{zone.number}</span><b>{zone.label}</b></header>
            <strong>{zone.title}</strong>
            <div>{zone.examples.map((example) => <span key={example}>• {example}</span>)}</div>
            <footer>{zone.control}</footer>
          </article>
        ))}
      </div>
      <footer>{visuals.agentAutonomy.note}</footer>
    </div>
  );
}

function IndustryNextVisual() {
  return (
    <div className="industry-next-board">
      <header>{visuals.industryNext.axis}</header>
      <div className="industry-next-stages">
        {visuals.industryNext.stages.map((stage, index) => (
          <div key={stage.id}>
            <article className={`industry-stage-${stage.id}`}>
              <header><span>{stage.era}</span><b>{stage.state}</b></header>
              <strong>{stage.unit}</strong>
              <small>{stage.time}</small>
              <footer>{stage.system}</footer>
            </article>
            {index < visuals.industryNext.stages.length - 1 && <b aria-hidden="true">→</b>}
          </div>
        ))}
      </div>
      <section className="industry-next-bottlenecks">
        <span>{visuals.industryNext.bottlenecksLabel}</span>
        <div>{visuals.industryNext.bottlenecks.map((item) => <strong key={item}>{item}</strong>)}</div>
      </section>
      <footer>{visuals.industryNext.note}</footer>
    </div>
  );
}

function EffortEvolutionVisual() {
  const cards = [visuals.effortEvolution.old, visuals.effortEvolution.new];
  return (
    <div className="effort-evolution-board">
      <div className="effort-evolution-cards">
        {cards.map((card, index) => (
          <div className="effort-evolution-segment" key={card.label}>
            <article className={index === 0 ? "is-old" : "is-new"}>
              <span>{card.label}</span>
              <code>{card.code}</code>
              <strong>{card.title}</strong>
              <div>{card.items.map((item) => <b key={item}>✓ {item}</b>)}</div>
            </article>
            {index === 0 && <i aria-hidden="true">→</i>}
          </div>
        ))}
      </div>
      <footer>{visuals.effortEvolution.note}</footer>
    </div>
  );
}

function FinalVisual() {
  return (
    <div className="final-formula">
      {visuals.final.parts.map((part, index) => (
        <div key={part}>
          {index > 0 && <span>+</span>}
          <strong>{part}</strong>
        </div>
      ))}
      <div className="formula-result">{visuals.final.result}</div>
    </div>
  );
}

function Visual({ name }: { name: string }) {
  switch (name) {
    case "hero": return <HeroVisual />;
    case "biological-neuron": return <BiologicalNeuronVisual />;
    case "neuron": return <NeuronLab />;
    case "digit": return <DigitLab />;
    case "learning": return <LearningVisual />;
    case "tokens": return <TokenLab />;
    case "embeddings": return <EmbeddingVisual />;
    case "context-input": return <ContextInputVisual />;
    case "context-relations": return <ContextRelationsVisual />;
    case "transformer": return <TransformerVisual />;
    case "generation": return <GenerationLab />;
    case "context": return <ContextVisual />;
    case "model-product": return <ModelProductVisual />;
    case "retrospective": return <RetrospectiveVisual />;
    case "capabilities-today": return <CapabilitiesTodayVisual />;
    case "capability-artifacts": return <CapabilityArtifactsVisual />;
    case "security-control": return <SecurityControlVisual />;
    case "capability-research": return <CapabilityResearchVisual />;
    case "modalities": return <ModalitiesVisual />;
    case "capabilities": return <CapabilitiesVisual />;
    case "training": return <TrainingVisual />;
    case "tools": return <ToolsVisual />;
    case "chat-tools": return <ChatToolsVisual />;
    case "harness": return <HarnessVisual />;
    case "agent-search": return <AgentSearchVisual />;
    case "agent-loop": return <AgentLoopVisual />;
    case "agent-use-cases": return <AgentUseCasesVisual />;
    case "non-code-agent": return <NonCodeAgentVisual />;
    case "agent-work-inbox": return <AgentWorkInboxVisual />;
    case "agent-autonomy": return <AgentAutonomyVisual />;
    case "model-lines": return <ModelLinesVisual />;
    case "effort-evolution": return <EffortEvolutionVisual />;
    case "effort-simple": return <EffortVisual taskId="simple" />;
    case "effort-complex": return <EffortVisual taskId="complex" />;
    case "chooser": return <ChooserLab />;
    case "agent-skills": return <AgentExtensionVisual kind="skills" />;
    case "agent-mcp": return <AgentExtensionVisual kind="mcp" />;
    case "agent-subagents": return <AgentExtensionVisual kind="subagents" />;
    case "setup-flow": return <SetupFlowVisual />;
    case "setup-docs": return <SetupDocsVisual />;
    case "setup-plan": return <SetupPlanVisual />;
    case "trajectory": return <TrajectoryVisual />;
    case "industry-next": return <IndustryNextVisual />;
    case "skills": return <SkillsVisual />;
    case "work-future": return <WorkFutureVisual />;
    case "automation-boundary": return <AutomationBoundaryVisual />;
    case "outcome-over-implementation": return <OutcomeOverImplementationVisual />;
    case "human-ai-complexity": return <HumanAiComplexityVisual />;
    case "final": return <FinalVisual />;
    default:
      if (name.startsWith("deep-")) {
        return <TransformerDeepDiveVisual scene={name.slice(5) as DeepScene} />;
      }
      return null;
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

function TalkDeckContent({
  slides,
  bonusSlides,
  references,
  meta,
  initialMode = "slides",
  initialSlideId,
  language,
}: TalkDeckProps) {
  const [mode, setMode] = useState<"slides" | "read">(initialMode);
  // This is deliberately a local drafting aid. Vite builds production bundles
  // with NODE_ENV=production, so a deployed talk never exposes an editable DOM.
  const canEdit = process.env.NODE_ENV !== "production";
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const allSlides = useMemo(
    () => [...slides, ...bonusSlides],
    [slides, bonusSlides],
  );
  const [currentSlideId, setCurrentSlideId] = useState(() =>
    allSlides.some((slide) => slide.id === initialSlideId)
      ? initialSlideId!
      : slides[0].id,
  );
  const [overview, setOverview] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const isBonus = bonusSlides.some((slide) => slide.id === currentSlideId);
  const activeSlides = isBonus ? bonusSlides : slides;
  const currentIndex = Math.max(
    0,
    activeSlides.findIndex((slide) => slide.id === currentSlideId),
  );

  const updateUrl = useCallback(
    (nextMode: "slides" | "read", nextSlideId: string) => {
      const params = new URLSearchParams(window.location.search);
      if (nextMode === "read") params.set("mode", "read");
      else params.delete("mode");
      params.set("slide", nextSlideId);
      window.history.replaceState(null, "", `?${params.toString()}`);
    },
    [],
  );

  const languageHref = useCallback((nextLanguage: "ru" | "en") => {
    const params = new URLSearchParams();
    if (nextLanguage === "en") params.set("lang", "en");
    if (mode === "read") params.set("mode", "read");
    params.set("slide", currentSlideId);
    return `?${params.toString()}`;
  }, [currentSlideId, mode]);

  const goTo = useCallback(
    (nextIndex: number, track: "core" | "bonus" = isBonus ? "bonus" : "core") => {
      const targetSlides = track === "bonus" ? bonusSlides : slides;
      const bounded = Math.max(0, Math.min(targetSlides.length - 1, nextIndex));
      const nextSlide = targetSlides[bounded];
      if (!nextSlide) return;
      setCurrentSlideId(nextSlide.id);
      setOverview(false);
      updateUrl(mode, nextSlide.id);
    },
    [bonusSlides, isBonus, mode, slides, updateUrl],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches("input, select, textarea, button") ||
        target?.closest('[contenteditable="true"]')
      ) return;
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        goTo(currentIndex + 1);
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goTo(currentIndex - 1);
      }
      if (event.key.toLowerCase() === "o") setOverview((current) => !current);
      if (event.key.toLowerCase() === "h") {
        setChromeVisible((current) => !current);
      }
      if (event.key.toLowerCase() === "r") {
        const nextMode = mode === "slides" ? "read" : "slides";
        setMode(nextMode);
        updateUrl(nextMode, currentSlideId);
      }
      if (event.key === "Escape") setOverview(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentIndex, currentSlideId, goTo, mode, updateUrl]);

  const toggleMode = () => {
    const nextMode = mode === "slides" ? "read" : "slides";
    setMode(nextMode);
    setOverview(false);
    updateUrl(nextMode, currentSlideId);
  };

  const saveSlideField = useCallback(async (
    slide: Slide,
    field: EditableField,
    value: string,
  ) => {
    if (!canEdit) return;
    setSaveError(null);
    const response = await fetch("/api/local-talk-editor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slideId: slide.id,
        track: slide.track === "bonus" ? "bonus" : "core",
        field,
        value,
        language,
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { error?: string };
      setSaveError(payload.error ?? "Не удалось сохранить правку");
    }
  }, [canEdit, language]);

  if (mode === "read") {
    return (
      <main className="reading-mode">
        <header className="reading-header">
          <a className="brand" href={languageHref(language).replace(/slide=[^&]*/, "slide=cover")}>{meta.brand}</a>
          <LanguageSwitcher language={language} hrefFor={languageHref} />
          {canEdit && (
            <button
              type="button"
              className={isEditing ? "is-active" : ""}
              onClick={() => setIsEditing((current) => !current)}
              aria-pressed={isEditing}
              title="Локальная правка не сохраняется и сбрасывается после перезагрузки"
            >
              {isEditing ? "Закончить правку" : "Редактировать текст"}
            </button>
          )}
          <button type="button" onClick={toggleMode}>Режим презентации</button>
        </header>
        <div className={`editing-surface ${isEditing ? "is-editing" : ""}`}>
          <section className="reading-hero">
            <span>{meta.kicker} · {meta.totalMinutes} минут · {slides.length} слайдов</span>
            <h1>{meta.title}</h1>
            <p>{meta.description}</p>
          </section>
          <nav className="reading-toc" aria-label="Содержание">
          {slides.map((slide, index) => (
            <a href={`#${slide.id}`} key={slide.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>{slide.title ?? slide.kicker ?? slide.id}
            </a>
          ))}
          {bonusSlides.length > 0 && (
            <div className="reading-toc-bonus">
              <strong>Бонусные слайды</strong>
              {bonusSlides.map((slide, index) => (
                <a href={`#${slide.id}`} key={slide.id}>
                  <span>B{String(index + 1).padStart(2, "0")}</span>{slide.title ?? slide.kicker ?? slide.id}
                </a>
              ))}
            </div>
          )}
          </nav>
          <div className="reading-content">
          {slides.map((slide, index) => (
            <article className="reading-slide" id={slide.id} key={slide.id}>
              <div className="reading-slide-heading">
                <span>{String(index + 1).padStart(2, "0")} · {slide.section}</span>
                {(slide.title || isEditing) && <EditableText value={slide.title ?? ""} as="h2" editing={isEditing} onSave={(value) => void saveSlideField(slide, "title", value)} />}
                {(slide.subtitle || isEditing) && <EditableText value={slide.subtitle ?? ""} as="p" className="editable-subtitle" editing={isEditing} onSave={(value) => void saveSlideField(slide, "subtitle", value)} />}
              </div>
              <div className="reading-visual"><Visual name={slide.visual} /></div>
              <HtmlCopy markdown={slide.body} references={references} editing={isEditing} onSave={(value) => void saveSlideField(slide, "body", value)} />
              <HtmlCopy markdown={slide.notes} references={references} className="speaker-copy" editing={isEditing} onSave={(value) => void saveSlideField(slide, "notes", value)} />
              <SourceList slide={slide} references={references} />
            </article>
          ))}
          {bonusSlides.length > 0 && (
            <section className="reading-bonus" aria-labelledby="reading-bonus-title">
              <header>
                <span>Дополнительные материалы</span>
                <h2 id="reading-bonus-title">Бонусные слайды</h2>
                <p>Не входят в основной маршрут и открываются отдельно из обзора.</p>
              </header>
              {bonusSlides.map((slide, index) => (
                <article className="reading-slide" id={slide.id} key={slide.id}>
                  <div className="reading-slide-heading">
                    <span>B{String(index + 1).padStart(2, "0")} · {slide.section}</span>
                    {(slide.title || isEditing) && <EditableText value={slide.title ?? ""} as="h2" editing={isEditing} onSave={(value) => void saveSlideField(slide, "title", value)} />}
                    {(slide.subtitle || isEditing) && <EditableText value={slide.subtitle ?? ""} as="p" className="editable-subtitle" editing={isEditing} onSave={(value) => void saveSlideField(slide, "subtitle", value)} />}
                  </div>
                  <div className="reading-visual"><Visual name={slide.visual} /></div>
                  <HtmlCopy markdown={slide.body} references={references} editing={isEditing} onSave={(value) => void saveSlideField(slide, "body", value)} />
                  <HtmlCopy markdown={slide.notes} references={references} className="speaker-copy" editing={isEditing} onSave={(value) => void saveSlideField(slide, "notes", value)} />
                  <SourceList slide={slide} references={references} />
                </article>
              ))}
            </section>
          )}
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
        </div>
        {saveError && <p className="editor-error" role="alert">{saveError}</p>}
      </main>
    );
  }

  const slide = activeSlides[currentIndex];
  const slideNumber = `${isBonus ? "B" : ""}${String(currentIndex + 1).padStart(2, "0")}`;
  return (
    <main
      className={[
        "presentation-mode",
        isBonus ? "is-bonus-track" : "",
        chromeVisible ? "" : "is-chrome-hidden",
      ].filter(Boolean).join(" ")}
    >
      {chromeVisible ? (
        <header className="deck-header">
          <button className="brand" type="button" onClick={() => goTo(0, "core")}>{meta.brand}</button>
          <div className="deck-meta">
            <LanguageSwitcher language={language} hrefFor={languageHref} />
            <span>{isBonus ? `Бонус · ${slide.section}` : slide.section}</span>
            <button type="button" onClick={() => setOverview((current) => !current)}>Обзор</button>
            {canEdit && (
              <button
                type="button"
                className={isEditing ? "is-active" : ""}
                onClick={() => setIsEditing((current) => !current)}
                aria-pressed={isEditing}
                title="Локальная правка не сохраняется и сбрасывается после перезагрузки"
              >
                {isEditing ? "Закончить правку" : "Редактировать текст"}
              </button>
            )}
            <button type="button" onClick={toggleMode}>Читать текст</button>
            <button type="button" onClick={() => setChromeVisible(false)}>Скрыть панели</button>
          </div>
        </header>
      ) : (
        <button
          className="chrome-reveal"
          type="button"
          onClick={() => setChromeVisible(true)}
          title="Показать верхнюю и нижнюю панели"
        >
          Показать панели <kbd>H</kbd>
        </button>
      )}
      <article
        className={`slide slide-${slide.visual} ${isEditing ? "is-editing" : ""}`}
        key={slide.id}
      >
        {slide.visual !== "hero" && (
          <div className="slide-copy">
            <EditableText value={slide.kicker} as="div" className="slide-kicker" editing={isEditing} onSave={(value) => void saveSlideField(slide, "kicker", value)} />
            {(slide.title || isEditing) && <EditableText value={slide.title ?? ""} as="h1" editing={isEditing} onSave={(value) => void saveSlideField(slide, "title", value)} />}
            {(slide.subtitle || isEditing) && <EditableText value={slide.subtitle ?? ""} as="p" className="slide-subtitle editable-subtitle" editing={isEditing} onSave={(value) => void saveSlideField(slide, "subtitle", value)} />}
            <HtmlCopy markdown={slide.body} references={references} editing={isEditing} onSave={(value) => void saveSlideField(slide, "body", value)} />
            <SourceList slide={slide} references={references} />
          </div>
        )}
        <div className="slide-visual"><Visual name={slide.visual} /></div>
      </article>
      <div className="slide-reference" aria-label={`Номер текущего слайда: ${slideNumber}`}>
        <span>{slideNumber}</span>
        <small>/ {activeSlides.length}</small>
      </div>
      {chromeVisible && (
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
            <div><i style={{ width: `${((currentIndex + 1) / activeSlides.length) * 100}%` }} /></div>
            <span>{slideNumber} / {activeSlides.length}</span>
          </div>
          <button
            type="button"
            onClick={() => goTo(currentIndex + 1)}
            disabled={currentIndex === activeSlides.length - 1}
            aria-label="Следующий слайд"
          >
            →
          </button>
        </footer>
      )}
      {overview && (
        <div className="overview-backdrop">
          <div className="overview-panel" role="dialog" aria-modal="true" aria-label="Обзор слайдов">
            <div className="overview-heading">
              <div><span>Маршрут доклада</span><strong>{slides.length} слайдов · {meta.totalMinutes} минут</strong></div>
              <button type="button" onClick={() => setOverview(false)}>Закрыть</button>
            </div>
            <section className="overview-section">
              <div className="overview-section-heading">
                <span>Основной доклад</span>
                <strong>{slides.length} слайдов · {meta.totalMinutes} минут</strong>
              </div>
              <div className="overview-grid">
                {slides.map((candidate, index) => (
                  <button
                    type="button"
                    className={!isBonus && index === currentIndex ? "is-current" : ""}
                    onClick={() => goTo(index, "core")}
                    key={candidate.id}
                  >
                    <span>{String(index + 1).padStart(2, "0")} · {candidate.section}</span>
                    <strong>{candidate.title}</strong>
                  </button>
                ))}
              </div>
            </section>
            {bonusSlides.length > 0 && (
              <section className="overview-section overview-bonus">
                <div className="overview-section-heading">
                  <span>Бонусные слайды</span>
                  <strong>{bonusSlides.length} слайдов · {meta.bonusMinutes} минут</strong>
                </div>
                <div className="overview-grid">
                  {bonusSlides.map((candidate, index) => (
                    <button
                      type="button"
                      className={isBonus && index === currentIndex ? "is-current" : ""}
                      onClick={() => goTo(index, "bonus")}
                      key={candidate.id}
                    >
                      <span>B{String(index + 1).padStart(2, "0")} · {candidate.section}</span>
                      <strong>{candidate.title}</strong>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
      {saveError && <p className="editor-error" role="alert">{saveError}</p>}
    </main>
  );
}

export default function TalkDeck(props: TalkDeckProps) {
  return (
    <LanguageContext.Provider value={props.language}>
      <TalkDeckContent {...props} />
    </LanguageContext.Provider>
  );
}
