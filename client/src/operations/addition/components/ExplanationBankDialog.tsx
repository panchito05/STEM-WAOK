import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { professorModeStorage } from '../services/ProfessorModeStorage';

interface ExplanationBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExplanation: (drawingData: string) => void;
  currentOperands?: number[];
}

/**
 * Diálogo para gestionar el banco de explicaciones
 * - Ver explicaciones guardadas
 * - Buscar explicaciones similares
 * - Importar/exportar explicaciones
 */
export const ExplanationBankDialog: React.FC<ExplanationBankDialogProps> = ({
  open,
  onOpenChange,
  onSelectExplanation,
  currentOperands = []
}) => {
  const { t } = useTranslation();
  const [explanations, setExplanations] = useState<any[]>([]);
  const [selectedExplanation, setSelectedExplanation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importData, setImportData] = useState('');
  const [showImportExport, setShowImportExport] = useState(false);
  const [showSimilarOnly, setShowSimilarOnly] = useState(!!currentOperands.length);

  // Cargar explicaciones al abrir el diálogo
  useEffect(() => {
    if (open) {
      loadExplanations();
    }
  }, [open, showSimilarOnly]);

  // Carga todas las explicaciones o solo las similares
  const loadExplanations = () => {
    if (showSimilarOnly && currentOperands.length > 0) {
      setExplanations(professorModeStorage.findSimilarExplanations(currentOperands));
    } else {
      setExplanations(professorModeStorage.getExplanationBank());
    }
  };

  // Filtrar explicaciones según el término de búsqueda
  const filteredExplanations = explanations.filter(exp => {
    if (!searchQuery) return true;
    
    // Buscar en título y operandos
    return (
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.operands.join(' + ').includes(searchQuery)
    );
  });

  // Manejar la selección de una explicación
  const handleSelectExplanation = () => {
    if (!selectedExplanation) return;
    
    const explanation = explanations.find(exp => exp.id === selectedExplanation);
    if (explanation) {
      onSelectExplanation(explanation.drawingData);
      onOpenChange(false);
    }
  };

  // Exportar explicaciones a JSON
  const handleExport = () => {
    const jsonData = professorModeStorage.exportExplanations();
    setImportData(jsonData);
  };

  // Importar explicaciones desde JSON
  const handleImport = () => {
    if (!importData) return;
    
    const success = professorModeStorage.importExplanations(importData);
    if (success) {
      setImportData('');
      loadExplanations();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('professorMode.explanationBank')}</DialogTitle>
          <DialogDescription>
            {t('professorMode.explanationBankDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-[300px]"
          />
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSimilarOnly(!showSimilarOnly)}
            >
              {showSimilarOnly
                ? t('professorMode.showAll')
                : t('professorMode.showSimilar')}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportExport(!showImportExport)}
            >
              {showImportExport ? t('common.close') : t('professorMode.importExport')}
            </Button>
          </div>
        </div>

        {showImportExport ? (
          <div className="space-y-4 border rounded-md p-4">
            <div>
              <Label htmlFor="importExport">{t('professorMode.importExportData')}</Label>
              <div className="mt-1">
                <textarea
                  id="importExport"
                  className="w-full h-32 p-2 border rounded-md"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder={t('professorMode.pasteJsonData')}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                {t('professorMode.exportData')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                {t('professorMode.importData')}
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[400px] border rounded-md p-1">
            {filteredExplanations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('professorMode.noExplanationsFound')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                {filteredExplanations.map((explanation) => (
                  <div
                    key={explanation.id}
                    className={`border rounded-md p-2 cursor-pointer ${
                      selectedExplanation === explanation.id
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedExplanation(explanation.id)}
                  >
                    <div className="font-medium">{explanation.title}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(explanation.timestamp).toLocaleDateString()}
                    </div>
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <img
                        src={explanation.drawingData}
                        alt={explanation.title}
                        className="w-full h-auto max-h-32 object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="default"
            onClick={handleSelectExplanation}
            disabled={!selectedExplanation}
          >
            {t('professorMode.useExplanation')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};