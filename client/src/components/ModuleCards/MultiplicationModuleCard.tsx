import DraggableModuleCard from '../DraggableModuleCard';
import { Module } from '../../types/module';

interface MultiplicationModuleCardProps {
  module: Module;
  index: number;
}

export default function MultiplicationModuleCard({ module, index }: MultiplicationModuleCardProps) {
  return (
    <div className="multiplication-module-wrapper" data-module-type="multiplication">
      <DraggableModuleCard module={module} index={index} />
    </div>
  );
}