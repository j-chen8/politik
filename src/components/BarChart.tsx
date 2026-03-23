"use client";

interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  maxValue?: number;
  unit?: string;
}

export function BarChart({ data, maxValue, unit = "" }: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-3 h-40">
      {data.map((d, i) => {
        const height = Math.max((d.value / max) * 100, 4);
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {d.value}{unit}
            </span>
            <div className="w-full flex justify-center">
              <div
                className={`w-full max-w-[48px] rounded-t-lg bar-animate ${d.color}`}
                style={{
                  height: `${height}%`,
                  animationDelay: `${i * 100}ms`,
                }}
              />
            </div>
            <span className="text-[10px] text-muted font-medium text-center leading-tight">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
