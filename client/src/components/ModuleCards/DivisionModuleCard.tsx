import DraggableModuleCard from '../DraggableModuleCard';
import { Module } from '../../types/module';

interface DivisionModuleCardProps {
  module: Module;
  index: number;
}

export default function DivisionModuleCard({ module, index }: DivisionModuleCardProps) {
  return (
    <div className="division-module-wrapper" data-module-type="division">
      <DraggableModuleCard module={module} index={index} />
    </div>
  );
}