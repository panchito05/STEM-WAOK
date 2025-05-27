import DraggableModuleCard from '../DraggableModuleCard';
import { Module } from '../../types/module';

interface AdditionModuleCardProps {
  module: Module;
  index: number;
}

export default function AdditionModuleCard({ module, index }: AdditionModuleCardProps) {
  return (
    <div className="addition-module-wrapper" data-module-type="addition">
      <DraggableModuleCard module={module} index={index} />
    </div>
  );
}