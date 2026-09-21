"use client";

import { cn } from "@/lib/utils";

type SparklineProps = {
  values: number[];
  className?: string;
  stroke?: string;
  fill?: string;
  invert?: boolean;
};

export function Sparkline({
  values,
  className,
  stroke = "currentColor",
  fill = "color-mix(in oklch, currentColor 18%, transparent)",
  invert = false,
}: SparklineProps) {
  if (!values.length) {
    return <div className={cn("h-10 w-full rounded bg-muted/60", className)} />;
  }

  const width = 120;
  const height = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const pts = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * width;
    const norm = invert ? (max - v) / range : (v - min) / range;
    const y = height - norm * (height - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-10 w-full overflow-visible", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
