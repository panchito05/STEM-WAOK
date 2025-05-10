import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { ModuleProgress } from "@/context/ProgressContext";
import { operationModules } from "@/utils/operationComponents";

interface AccuracyChartProps {
  moduleProgress: Record<string, ModuleProgress>;
}

export function AccuracyChart({ moduleProgress }: AccuracyChartProps) {
  // Obtener colores para cada módulo
  const getModuleColor = (moduleId: string) => {
    const colorMap: Record<string, string> = {
      addition: "#3B82F6", // primary
      subtraction: "#8B5CF6", // secondary
      multiplication: "#10B981", // success
      division: "#F59E0B", // amber-500
      fractions: "#EF4444", // error
    };
    return colorMap[moduleId] || "#6B7280"; // gray-500 as default
  };

  // Preparar datos para el gráfico
  const chartData = operationModules
    .filter(module => !module.comingSoon)
    .map(module => {
      const progress = moduleProgress[module.id];
      return {
        name: module.displayName,
        accuracy: progress?.averageScore ? Math.round(progress.averageScore * 100) : 0,
        color: getModuleColor(module.id),
        id: module.id
      };
    })
    .sort((a, b) => b.accuracy - a.accuracy); // Ordenar de mayor a menor precisión

  const formatYAxis = (value: number) => `${value}%`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
        <XAxis 
          type="number" 
          domain={[0, 100]} 
          tickFormatter={formatYAxis}
          tick={{ fill: "#6B7280" }}
          axisLine={{ stroke: "#d1d5db" }}
          tickLine={{ stroke: "#d1d5db" }}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          tick={{ fill: "#6B7280" }}
          axisLine={{ stroke: "#d1d5db" }}
          tickLine={{ stroke: "#d1d5db" }}
        />
        <Tooltip 
          formatter={(value) => [`${value}%`, "Precisión"]}
          contentStyle={{ backgroundColor: "white", borderRadius: "0.375rem", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}
        />
        <Legend verticalAlign="bottom" />
        <Bar dataKey="accuracy" name="Precisión">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}