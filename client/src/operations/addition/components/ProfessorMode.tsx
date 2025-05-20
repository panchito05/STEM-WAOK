import React from 'react';
import { ProfessorModeDialog } from './ProfessorModeDialog';

interface ProfessorModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfessorMode({ isOpen, onClose }: ProfessorModeProps) {
  return (
    <ProfessorModeDialog isOpen={isOpen} onClose={onClose} />
  );
}