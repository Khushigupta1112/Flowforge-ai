import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Lightbulb,
  PenLine,
  ShieldCheck,
} from "lucide-react";

const NODES = [
  { icon: ArrowUpFromLine, label: "Input", color: "#38bdf8", x: 0 },
  { icon: Lightbulb, label: "Idea Generator", color: "#a78bfa", x: 1 },
  { icon: PenLine, label: "Writer", color: "#34d399", x: 2 },
  { icon: ShieldCheck, label: "Quality", color: "#fb7185", x: 3 },
  { icon: ArrowDownToLine, label: "Output", color: "#4ade80", x: 4 },
];

const WIDTH = 620;
const HEIGHT = 130;
const PAD = 14;
const NODE_W = 108;
const NODE_H = 54;
const GAP = 10;

export function WorkflowPreview() {
  const startX = PAD;
  const startY = (HEIGHT - NODE_H) / 2;
  const positions = NODES.map((_, index) => ({
    x: startX + index * (NODE_W + GAP),
  }));

  return (
    <div className="relative w-full max-w-[640px] overflow-hidden rounded-2xl border border-[var(--color-edge)] bg-gradient-to-b from-white/[0.03] to-transparent p-2 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="A visual workflow connecting Input to Idea Generator to Writer to Quality to Output"
      >
        <defs>
          <linearGradient id="preview-bg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1a2030" stopOpacity="0" />
            <stop offset="0.5" stopColor="#1a2030" stopOpacity="1" />
            <stop offset="1" stopColor="#1a2030" stopOpacity="0" />
          </linearGradient>
        </defs>

        {positions.slice(0, -1).map((pos, index) => (
          <g key={index}>
            <line
              x1={pos.x + NODE_W}
              y1={startY + NODE_H / 2}
              x2={positions[index + 1].x}
              y2={startY + NODE_H / 2}
              stroke="#3b4660"
              strokeWidth="1.5"
            />
            <line
              x1={pos.x + NODE_W}
              y1={startY + NODE_H / 2}
              x2={positions[index + 1].x}
              y2={startY + NODE_H / 2}
              stroke={NODES[index].color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="4 5"
              opacity="0.9"
              className="flowdash"
            />
            <path
              d={`M ${positions[index + 1].x - 3} ${startY + NODE_H / 2 - 4} L ${positions[index + 1].x + 2} ${startY + NODE_H / 2} L ${positions[index + 1].x - 3} ${startY + NODE_H / 2 + 4}`}
              fill="none"
              stroke="#5b6a8a"
              strokeWidth="1.2"
            />
          </g>
        ))}

        {NODES.map((node, index) => (
          <g key={node.label}>
            <rect
              x={positions[index].x}
              y={startY}
              width={NODE_W}
              height={NODE_H}
              rx="12"
              fill="#12151d"
              stroke="#282f40"
              strokeWidth="1"
            />
            <rect
              x={positions[index].x + 10}
              y={startY + 10}
              width="22"
              height="22"
              rx="6"
              fill={index === 3 ? "none" : `${node.color}1e`}
              stroke={`${node.color}55`}
              strokeWidth="1"
            />
            <g transform={`translate(${positions[index].x + 21} ${startY + 21})`}>
              <circle cx="0" cy="0" r="7" fill={node.color} opacity={index === 3 ? 0.9 : 1} />
            </g>
            <text
              x={positions[index].x + 42}
              y={startY + 22}
              fontSize="11"
              fontWeight="600"
              fill="#e7ebf1"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {node.label.split(" ")[0]}
            </text>
            <text
              x={positions[index].x + 42}
              y={startY + 36}
              fontSize="9"
              fill="#5f6b7c"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {node.label.split(" ").slice(1).join(" ") || "node"}
            </text>
            {index === 2 && (
              <text
                x={positions[index].x + NODE_W}
                y={startY - 8}
                fontSize="8.5"
                fill="#34d399"
                opacity="0.85"
                fontFamily="Inter, system-ui, sans-serif"
              >
                ● running
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}