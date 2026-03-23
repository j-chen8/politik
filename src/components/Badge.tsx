interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "yellow" | "red" | "blue" | "gray";
}

const variants = {
  green: "bg-green-light text-green",
  yellow: "bg-yellow-light text-yellow",
  red: "bg-red-light text-red",
  blue: "bg-primary-light text-primary",
  gray: "bg-gray-100 text-muted",
};

export function Badge({ children, variant = "gray" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}
