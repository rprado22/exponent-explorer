import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Info, RotateCcw } from "lucide-react";

// Exponent Explorer
// Tech: React + Tailwind + Framer Motion
// Main component: App.tsx

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function normalize(mantissa: number, exponent: number) {
  if (mantissa === 0) return { m: 0, e: 0 };
  let m = mantissa;
  let e = exponent;
  while (m !== 0 && (m >= 10 || m < 1)) {
    if (m >= 10) {
      m = m / 10;
      e += 1;
    } else if (m < 1) {
      m = m * 10;
      e -= 1;
    }
  }
  return { m, e };
}

function toExpString(mantissa: number, exponent: number) {
  const { m, e } = normalize(mantissa, exponent);
  const mStr = m.toLocaleString(undefined, { maximumFractionDigits: 6 });
  return { mStr, e };
}

function approxDecimalString(mantissa: number, exponent: number) {
  const log10 = Math.log10(mantissa) + exponent;
  const { mStr, e } = toExpString(mantissa, exponent);
  if (Math.abs(log10) <= 6) {
    const value = mantissa * Math.pow(10, exponent);
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 8,
      useGrouping: true,
    });
  }
  const compact = new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(Math.pow(10, Math.min(308, Math.max(-308, log10))));
  return `${mStr} × 10^${e}  (≈ ${compact})`;
}

function repeatedFactorText(mantissa: number, exponent: number) {
  const { m, e } = normalize(mantissa, exponent);
  const times = Math.abs(e);
  if (times === 0)
    return `${m.toLocaleString()} (no tens factors / sin factores de diez)`;
  if (times > 6) return `…(pattern continues / el patrón continúa)…`;
  const factor = e >= 0 ? "× 10" : "÷ 10";
  return `${m.toLocaleString()} ${Array.from({ length: times })
    .map(() => factor)
    .join(" ")}`;
}

function magnitudeColor(log10: number) {
  if (log10 <= -6) return "bg-sky-500";
  if (log10 < 0) return "bg-teal-500";
  if (log10 === 0) return "bg-emerald-500";
  if (log10 <= 6) return "bg-amber-500";
  return "bg-rose-500";
}

function tickLabel(n: number) {
  if (n === 0) return "1";
  if (n === 3) return "1,000";
  if (n === -3) return "0.001";
  return `10^${n}`;
}

function Slider({
  label,
  subLabel,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  subLabel?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm sm:text-base font-semibold text-slate-800">
          {label}
        </span>
        {subLabel && (
          <span className="text-xs text-slate-500">{subLabel}</span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-slate-200 accent-indigo-500"
      />
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>{min}</span>
        <span className="font-medium text-slate-700">{value}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function MagnitudeBar({ log10Value }: { log10Value: number }) {
  const min = -12,
    max = 12;
  const pos = ((Math.min(max, Math.max(min, log10Value)) - min) / (max - min)) * 100;
  const color = magnitudeColor(log10Value);
  return (
    <div className="w-full">
      <div className="text-sm font-semibold text-slate-700 mb-2">
        Magnitude / Magnitud (log₁₀)
      </div>
      <div className="relative h-5 rounded-full bg-gradient-to-r from-sky-100 via-emerald-100 to-rose-100 border border-slate-200">
        <div className="absolute inset-0 grid grid-cols-6 pointer-events-none">
          <div className="border-r border-slate-200/60" />
          <div className="border-r border-slate-200/60" />
          <div className="border-r border-slate-200/60" />
          <div className="border-r border-slate-200/60" />
          <div className="border-r border-slate-200/60" />
        </div>
        <motion.div
          className={`absolute top-0 -mt-[2px] h-6 w-[10px] rounded ${color} shadow`}
          style={{ left: `calc(${pos}% - 5px)` }}
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-slate-600">
        {[-12, -9, -6, -3, 0, 3, 6, 9, 12].map((t) => (
          <span key={t} className="tabular-nums">
            {tickLabel(t)}
          </span>
        ))}
      </div>
    </div>
  );
}

function InfoCard({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="text-sm text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}

const PRESETS = [-12, -9, -6, -3, 0, 3, 6, 9, 12];

export default function App() {
  const [mantissa, setMantissa] = useState(3.2);
  const [exponent, setExponent] = useState(4);

  const { mStr, e } = useMemo(
    () => toExpString(mantissa, exponent),
    [mantissa, exponent]
  );
  const log10Value = useMemo(
    () => Math.log10(mantissa) + exponent,
    [mantissa, exponent]
  );
  const approxStr = useMemo(
    () => approxDecimalString(mantissa, exponent),
    [mantissa, exponent]
  );
  const repeated = useMemo(
    () => repeatedFactorText(mantissa, exponent),
    [mantissa, exponent]
  );

  const reset = () => {
    setMantissa(3.2);
    setExponent(4);
  };

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 text-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Exponent Explorer • Explorador de Exponentes
            </h1>
            <p className="text-sm text-slate-600">
              Interact with very big and very small numbers / Interactúa con
              números muy grandes y muy pequeños.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset / Reiniciar
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 p-4 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <Slider
                label="Mantissa (1 to <10) / Mantisa (1 a <10)"
                subLabel="m in m × 10^e"
                value={mantissa}
                min={1}
                max={9.9}
                step={0.1}
                onChange={(v) => setMantissa(parseFloat(v.toFixed(1)))}
              />
              <Slider
                label="Exponent / Exponente"
                subLabel="e in m × 10^e"
                value={exponent}
                min={-12}
                max={12}
                step={1}
                onChange={(v) => setExponent(Math.round(v))}
              />
            </div>

            <div className="mt-4">
              <div className="text-xs text-slate-600 mb-1">
                Quick presets (10^n) / Preajustes rápidos (10^n)
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setMantissa(1);
                      setExponent(n);
                    }}
                    className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs hover:bg-slate-700"
                  >
                    10^{n}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setMantissa(6.02);
                    setExponent(23);
                  }}
                  className="px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs hover:bg-amber-400"
                >
                  Avogadro-ish (≈6.02×10^23)
                </button>
                <button
                  onClick={() => {
                    setMantissa(3.14);
                    setExponent(-7);
                  }}
                  className="px-3 py-1.5 rounded-full bg-sky-500 text-white text-xs hover:bg-sky-400"
                >
                  Small π (3.14×10^-7)
                </button>
              </div>
            </div>

            <div className="mt-6">
              <MagnitudeBar log10Value={log10Value} />
              <div className="mt-2 text-xs text-slate-600">
                <div>
                  Very small / Muy pequeño: 10^-12 … 10^0 • Very big / Muy
                  grande: 10^0 … 10^12
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-indigo-600 text-white p-4 shadow-sm">
            <div className="font-semibold mb-2">
              WIDA Sentence Frames / Marcos de oraciones
            </div>
            <ul className="text-sm space-y-2">
              <li>
                I can describe the number as{" "}
                <span className="font-semibold">__ × 10^__</span>.
                <br />
                Puedo describir el número como{" "}
                <span className="font-semibold">__ × 10^__</span>.
              </li>
              <li>
                When the exponent changes by 1, the value becomes{" "}
                <span className="font-semibold">ten times bigger/smaller</span>.
                <br />
                Cuando el exponente cambia por 1, el valor se hace{" "}
                <span className="font-semibold">
                  diez veces más grande/pequeño
                </span>
                .
              </li>
              <li>
                The number is{" "}
                <span className="font-semibold">(greater/less) than</span> 1
                because the exponent is{" "}
                <span className="font-semibold">(positive/negative)</span>.
                <br />
                El número es{" "}
                <span className="font-semibold">(mayor/menor) que</span> 1
                porque el exponente es{" "}
                <span className="font-semibold">(positivo/negativo)</span>.
              </li>
            </ul>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <InfoCard
            title="Scientific Notation / Notación científica"
            icon={<Info className="w-4 h-4 text-indigo-600" />}
          >
            <div className="text-2xl font-bold tracking-tight">
              <motion.span layout>{mStr}</motion.span>
              <span className="mx-1">×</span>
              <span>10</span>
              <sup className="align-top ml-0.5">{e}</sup>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              m in [1,10) & e is an integer / m en [1,10) y e es un entero
            </div>
          </InfoCard>

          <InfoCard
            title="Approximate Value / Valor aproximado"
            icon={<ArrowUpRight className="w-4 h-4 text-emerald-600" />}
          >
            <div className="text-xl font-semibold tabular-nums">{approxStr}</div>
            <div className="text-xs text-slate-500 mt-1">
              Shows decimal when manageable; otherwise stays in scientific form
              / Muestra decimal cuando es posible; si no, se queda en forma
              científica.
            </div>
          </InfoCard>

          <InfoCard
            title="Ten-times Pattern / Patrón de veces diez"
            icon={<ArrowDownLeft className="w-4 h-4 text-rose-600" />}
          >
            <div className="text-sm font-mono">{repeated}</div>
            <div className="text-xs text-slate-500 mt-1">
              Each step in the exponent multiplies or divides by 10 / Cada paso
              en el exponente multiplica o divide por 10.
            </div>
          </InfoCard>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <InfoCard
            title="Try This! / ¡Intenta esto!"
            icon={<Info className="w-4 h-4 text-sky-600" />}
          >
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Set m=1 and slide e from -6 to 6. What pattern do you notice? /
                Fija m=1 y mueve e de -6 a 6. ¿Qué patrón notas?
              </li>
              <li>
                Keep e=0. How does changing m affect the value? / Mantén e=0.
                ¿Cómo cambia el valor al cambiar m?
              </li>
              <li>
                Find a number between 10^3 and 10^4. Explain your reasoning. /
                Encuentra un número entre 10^3 y 10^4. Explica tu razonamiento.
              </li>
            </ul>
          </InfoCard>
          <InfoCard
            title="Vocabulary / Vocabulario"
            icon={<Info className="w-4 h-4 text-violet-600" />}
          >
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                "mantissa / mantisa",
                "exponent / exponente",
                "power of ten / potencia de diez",
                "magnitude / magnitud",
                "scientific notation / notación científica",
              ].map((w) => (
                <span
                  key={w}
                  className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200"
                >
                  {w}
                </span>
              ))}
            </div>
          </InfoCard>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          Built for classroom use. Deployed with GitHub Pages. / Hecho para el
          aula. Desplegado con GitHub Pages.
        </div>
      </div>
    </div>
  );
}
