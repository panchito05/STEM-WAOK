import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FilterControlsProps {
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onTimeRangeChange: (range: string) => void;
  locale?: "es" | "en";
}

export function FilterControls({
  onDateRangeChange,
  onTimeRangeChange,
  locale = "es"
}: FilterControlsProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const dateLocale = locale === "es" ? es : enUS;

  const handleDateRangeSelect = (date: Date | undefined) => {
    const range = {
      from: dateRange.from,
      to: dateRange.to,
    };

    if (!dateRange.from) {
      range.from = date;
    } else if (!dateRange.to && date && date > dateRange.from) {
      range.to = date;
    } else {
      range.from = date;
      range.to = undefined;
    }

    setDateRange(range);
    onDateRangeChange(range);
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Select onValueChange={onTimeRangeChange} defaultValue="7days">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Rango de tiempo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7days">Últimos 7 días</SelectItem>
          <SelectItem value="30days">Últimos 30 días</SelectItem>
          <SelectItem value="90days">Últimos 3 meses</SelectItem>
          <SelectItem value="year">Último año</SelectItem>
          <SelectItem value="all">Todo el historial</SelectItem>
          <SelectItem value="custom">Rango personalizado</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "d MMM, yyyy", { locale: dateLocale })} -{" "}
                  {format(dateRange.to, "d MMM, yyyy", { locale: dateLocale })}
                </>
              ) : (
                format(dateRange.from, "d MMMM, yyyy", { locale: dateLocale })
              )
            ) : (
              <span>Seleccionar fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={{
              from: dateRange.from,
              to: dateRange.to,
            }}
            onSelect={(range) => {
              setDateRange(range || { from: undefined, to: undefined });
              onDateRangeChange(range || { from: undefined, to: undefined });
            }}
            numberOfMonths={2}
            locale={dateLocale}
          />
        </PopoverContent>
      </Popover>

      {(dateRange.from || dateRange.to) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDateRange({ from: undefined, to: undefined });
            onDateRangeChange({ from: undefined, to: undefined });
          }}
        >
          Limpiar fechas
        </Button>
      )}
    </div>
  );
}