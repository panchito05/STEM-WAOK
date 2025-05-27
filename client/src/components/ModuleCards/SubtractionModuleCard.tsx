import DraggableModuleCard from '../DraggableModuleCard';
import { Module } from '../../types/module';

interface SubtractionModuleCardProps {
  module: Module;
  index: number;
}

export default function SubtractionModuleCard({ module, index }: SubtractionModuleCardProps) {
  return (
    <div className="subtraction-module-wrapper" data-module-type="subtraction">
      <DraggableModuleCard module={module} index={index} />
    </div>
  );
}