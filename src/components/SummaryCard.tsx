interface SummaryCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: "teal" | "blue" | "red" | "green" | "gray";
}

export function SummaryCard({ title, value, subtitle, color = "teal" }: SummaryCardProps) {
  const colorMap: Record<string, string> = {
    teal: "bg-teal-50 text-teal-700 border-teal-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    red: "bg-red-50 text-red-700 border-red-100",
    green: "bg-green-50 text-green-700 border-green-100",
    gray: "bg-gray-50 text-gray-700 border-gray-100",
  };

  return (
    <div className={`card p-5 ${colorMap[color]}`}>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
