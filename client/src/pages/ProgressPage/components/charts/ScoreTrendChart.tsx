import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ExerciseResult } from "@/context/ProgressContext";
import { format, subDays, parseISO } from "date-fns";
import { operationModules } from "@/utils/operationComponents";

interface ScoreTrendChartProps {
  data: ExerciseResult[];
  daysToShow?: number;
}

export function ScoreTrendChart({ data, daysToShow = 14 }: ScoreTrendChartProps) {
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
  const chartData = useMemo(() => {
    // Crear array con días anteriores
    const lastDays = Array.from({ length: daysToShow }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, "MMM dd"),
        dateObj: date,
      };
    }).reverse();

    // Mapear resultados de ejercicios a los días
    return lastDays.map(day => {
      const dayResults = data.filter(result => {
        const resultDate = parseISO(result.date);
        return (
          resultDate.getDate() === day.dateObj.getDate() &&
          resultDate.getMonth() === day.dateObj.getMonth() &&
          resultDate.getFullYear() === day.dateObj.getFullYear()
        );
      });

      const dayData: any = {
        date: day.date,
      };

      // Calcular puntuación promedio por módulo
      operationModules.forEach(module => {
        if (!module.comingSoon) {
          const moduleResults = dayResults.filter(result => result.operationId === module.id);
          if (moduleResults.length > 0) {
            const avgScore = moduleResults.reduce((sum, result) => sum + (result.score / result.totalProblems), 0) / moduleResults.length;
            dayData[module.id] = Math.round(avgScore * 100);
          } else {
            dayData[module.id] = null; // Usar null en lugar de 0 para días sin datos
          }
        }
      });

      return dayData;
    });
  }, [data, daysToShow]);

  const formatYAxis = (value: number) => `${value}%`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tick={{ fill: "#6B7280" }}
          axisLine={{ stroke: "#d1d5db" }}
          tickLine={{ stroke: "#d1d5db" }}
        />
        <YAxis 
          tickFormatter={formatYAxis} 
          domain={[0, 100]} 
          tick={{ fill: "#6B7280" }}
          axisLine={{ stroke: "#d1d5db" }}
          tickLine={{ stroke: "#d1d5db" }}
        />
        <Tooltip 
          formatter={(value) => [`${value}%`, ""]}
          contentStyle={{ backgroundColor: "white", borderRadius: "0.375rem", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}
        />
        <Legend 
          verticalAlign="bottom"
          wrapperStyle={{ paddingTop: "10px" }}
        />
        {operationModules
          .filter(module => !module.comingSoon)
          .map(module => (
            <Line
              key={module.id}
              type="monotone"
              dataKey={module.id}
              name={module.displayName}
              stroke={getModuleColor(module.id)}
              activeDot={{ r: 8 }}
              connectNulls={true}
              dot={{ strokeWidth: 2, r: 4 }}
            />
          ))
        }
      </LineChart>
    </ResponsiveContainer>
  );
}