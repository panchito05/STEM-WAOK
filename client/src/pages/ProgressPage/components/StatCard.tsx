import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  trend?: number; // Valor positivo indica tendencia al alza, negativo a la baja
  className?: string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, trend, className, icon }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h4 className="mt-2 text-3xl font-bold">{value}</h4>
            
            {trend !== undefined && (
              <div className="mt-2 flex items-center">
                {trend > 0 ? (
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">+{trend}%</span>
                  </div>
                ) : trend < 0 ? (
                  <div className="flex items-center text-red-600">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    <span className="text-sm">{trend}%</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Sin cambios</span>
                )}
              </div>
            )}
          </div>
          
          {icon && (
            <div className="bg-primary bg-opacity-10 p-3 rounded-full">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}