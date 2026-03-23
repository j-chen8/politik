import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  status?: "green" | "yellow" | "red" | "neutral";
}

const statusStyles = {
  green: "bg-green-light text-green",
  yellow: "bg-yellow-light text-yellow",
  red: "bg-red-light text-red",
  neutral: "bg-gray-100 text-muted",
};

export function StatCard({ icon: Icon, label, value, subtext, status = "neutral" }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusStyles[status]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {subtext && <p className="text-xs text-muted mt-1">{subtext}</p>}
      </div>
    </div>
  );
}
