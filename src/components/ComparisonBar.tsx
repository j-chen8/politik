interface ComparisonBarProps {
  label: string;
  personalValue: number;
  averageValue: number;
  unit?: string;
  maxValue?: number;
}

export function ComparisonBar({
  label,
  personalValue,
  averageValue,
  unit = "%",
  maxValue = 100,
}: ComparisonBarProps) {
  const pWidth = Math.min((personalValue / maxValue) * 100, 100);
  const aWidth = Math.min((averageValue / maxValue) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            Abgeordnete/r: {personalValue.toFixed(1)}{unit}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-muted/40" />
            Ø Bundestag: {averageValue.toFixed(1)}{unit}
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${pWidth}%` }}
          />
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-muted/30 rounded-full transition-all duration-700"
            style={{ width: `${aWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
