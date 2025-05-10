import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { ModuleProgress } from "@/context/ProgressContext";
import { operationModules } from "@/utils/operationComponents";

interface SkillRadarChartProps {
  moduleProgress: Record<string, ModuleProgress>;
}

export function SkillRadarChart({ moduleProgress }: SkillRadarChartProps) {
  // Preparar datos para el gráfico
  const chartData = operationModules
    .filter(module => !module.comingSoon)
    .map(module => {
      const progress = moduleProgress[module.id];
      return {
        subject: module.displayName,
        accuracy: progress?.averageScore ? Math.round(progress.averageScore * 100) : 0,
        speed: progress?.averageTime 
          ? Math.max(0, 100 - Math.min(100, Math.round((progress.averageTime / 60) * 100))) 
          : 0, // Invertimos para que menor tiempo = mayor valor
        experience: progress?.totalCompleted ? Math.min(100, progress.totalCompleted * 5) : 0,
        fullMark: 100
      };
    });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis 
          dataKey="subject" 
          tick={{ fill: "#6B7280" }}
        />
        <PolarRadiusAxis 
          angle={30} 
          domain={[0, 100]} 
          tick={{ fill: "#6B7280" }}
        />
        <Tooltip 
          formatter={(value) => [`${value}`, ""]}
          contentStyle={{ backgroundColor: "white", borderRadius: "0.375rem", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}
        />
        <Radar 
          name="Precisión" 
          dataKey="accuracy" 
          stroke="#3B82F6" 
          fill="#3B82F6" 
          fillOpacity={0.6} 
        />
        <Radar 
          name="Velocidad" 
          dataKey="speed" 
          stroke="#10B981" 
          fill="#10B981" 
          fillOpacity={0.6} 
        />
        <Radar 
          name="Experiencia" 
          dataKey="experience" 
          stroke="#F59E0B" 
          fill="#F59E0B" 
          fillOpacity={0.6} 
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}