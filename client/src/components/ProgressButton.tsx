import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { Link } from "wouter";

interface ProgressButtonProps {
  hasHistory: boolean;
  moduleId?: string;
  label?: string;
}

export const ProgressButton = ({ hasHistory, moduleId, label = "Progress" }: ProgressButtonProps) => {
  return (
    <Button
      variant="outline"
      className="relative overflow-hidden bg-blue-500 hover:bg-blue-600 text-white border-none"
      asChild={hasHistory}
      disabled={!hasHistory}
    >
      {hasHistory ? (
        <Link href={`/progress${moduleId ? `?module=${moduleId}` : ''}`}>
          {/* Background pattern for visual interest - similar to DraggableModuleCard */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id={`progress-grid-${moduleId || 'main'}`} width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#progress-grid-${moduleId || 'main'})`} />
            </svg>
          </div>
          <div className="flex items-center relative z-10">
            <History className="mr-2 h-4 w-4" />
            {label}
          </div>
        </Link>
      ) : (
        <>
          {/* Background pattern for visual interest - similar to DraggableModuleCard but muted */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id={`progress-grid-disabled-${moduleId || 'main'}`} width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#progress-grid-disabled-${moduleId || 'main'})`} />
            </svg>
          </div>
          <div className="flex items-center relative z-10">
            <History className="mr-2 h-4 w-4" />
            {label}
          </div>
        </>
      )}
    </Button>
  );
};