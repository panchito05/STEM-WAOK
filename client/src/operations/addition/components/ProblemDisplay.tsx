import React from "react";
import { AdditionProblem } from "../types";

interface ProblemDisplayProps {
  problem: AdditionProblem;
  operandsFormatted: { intStr: string; decStr: string }[];
  maxDecLength: number;
  sumLineTotalCharWidth: number;
}

const verticalOperandStyle = "font-mono text-2xl sm:text-3xl text-right tracking-wider";
const plusSignVerticalStyle = "font-mono text-2xl sm:text-3xl text-gray-600 mr-2";
const sumLineStyle = "border-t-2 border-gray-700 my-1";

/**
 * ProblemDisplay - Componente para mostrar un problema matemático
 * 
 * Este componente maneja la visualización de problemas matemáticos en formato
 * horizontal o vertical, con soporte para múltiples operandos y posible punto decimal.
 */
const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  operandsFormatted,
  maxDecLength,
  sumLineTotalCharWidth
}) => {
  // Renderizado horizontal (por defecto)
  if (problem.layout === 'horizontal') {
    return (
      <div className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
        <span>{problem.operands[0]}</span>
        <span className="text-gray-600 mx-1">+</span>
        <span>{problem.operands.length > 1 ? problem.operands[1] : '?'}</span>
        {problem.operands.length > 2 && (
          <>
            <span className="text-gray-600 mx-1">+</span>
            <span>{problem.operands[2]}</span>
          </>
        )}
        <span className="text-gray-600 mx-1">=</span>
      </div>
    );
  }
  
  // Renderizado vertical
  return (
    <div className="inline-block text-right my-1 sm:my-2">
      {operandsFormatted.map((op, index) => (
        <div key={`op-${index}-${problem.id || index}`} className={verticalOperandStyle}>
          {index === operandsFormatted.length - 1 && operandsFormatted.length > 1 && (
            <span className={plusSignVerticalStyle}>+</span>
          )}
          <span>{op.intStr}</span>
          {maxDecLength > 0 && (
            <>
              <span className="opacity-60">.</span>
              <span>{op.decStr}</span>
            </>
          )}
        </div>
      ))}
      <div
        className={sumLineStyle}
        style={{
          width: `${Math.max(5, sumLineTotalCharWidth + 2)}ch`,
          marginLeft: 'auto',
          marginRight: '0'
        }}
      />
    </div>
  );
};

export default ProblemDisplay;