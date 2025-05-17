import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { Download, FileType } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExerciseResult } from "@/context/ProgressContext";
import { es, enUS } from 'date-fns/locale';
import { useSettings } from '@/context/SettingsContext';

interface ExercisePdfExportProps {
  exerciseResult: ExerciseResult;
  buttonClassName?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  includeTitle?: boolean;
}

const ExercisePdfExport = ({ 
  exerciseResult,
  buttonClassName = "",
  buttonVariant = "outline",
  buttonSize = "sm",
  includeTitle = true
}: ExercisePdfExportProps) => {
  const { getGlobalSettings } = useSettings();
  const globalSettings = getGlobalSettings();
  const language = globalSettings.language || 'eng';
  
  const dateLocale = language === 'esp' ? es : enUS;
  const translations = {
    eng: {
      title: "Exercise Results",
      subtitle: "Math Learning Platform",
      date: "Date",
      time: "Total Time",
      score: "Score",
      accuracy: "Accuracy",
      avgTime: "Avg. Time",
      attempts: "Avg. Attempts",
      revealed: "Revealed",
      finalLevel: "Final Level",
      problemReview: "Problem Review",
      problem: "Problem",
      correct: "Correct",
      userAnswer: "Your Answer",
      correctAnswer: "Correct Answer",
      level: "Level",
      timePerProblem: "Time",
      attemptsPerProblem: "Attempts",
      yes: "Yes",
      no: "No",
      seconds: "s",
      fileName: "math_exercise_results",
      generatePdf: "Save as PDF",
      operation: "Operation",
      beginner: "Beginner",
      elementary: "Elementary",
      intermediate: "Intermediate",
      advanced: "Advanced",
      expert: "Expert",
      addition: "Addition",
      subtraction: "Subtraction",
      multiplication: "Multiplication",
      division: "Division",
      fractions: "Fractions",
      equivalentFractions: "Equivalent Fractions",
      counting: "Counting",
      numberConversions: "Number Conversions",
      combinedOperations: "Combined Operations",
      fractionReducer: "Fraction Reducer",
    },
    esp: {
      title: "Resultados del Ejercicio",
      subtitle: "Plataforma de Aprendizaje de Matemáticas",
      date: "Fecha",
      time: "Tiempo Total",
      score: "Puntuación",
      accuracy: "Precisión",
      avgTime: "Tiempo Prom.",
      attempts: "Intentos Prom.",
      revealed: "Revelados",
      finalLevel: "Nivel Final",
      problemReview: "Revisión de Problemas",
      problem: "Problema",
      correct: "Correcto",
      userAnswer: "Tu Respuesta",
      correctAnswer: "Respuesta Correcta",
      level: "Nivel",
      timePerProblem: "Tiempo",
      attemptsPerProblem: "Intentos",
      yes: "Sí",
      no: "No",
      seconds: "s",
      fileName: "resultados_ejercicio_matematicas",
      generatePdf: "Guardar como PDF",
      operation: "Operación",
      beginner: "Principiante",
      elementary: "Elemental",
      intermediate: "Intermedio",
      advanced: "Avanzado",
      expert: "Experto",
      addition: "Suma",
      subtraction: "Resta",
      multiplication: "Multiplicación",
      division: "División",
      fractions: "Fracciones",
      equivalentFractions: "Fracciones Equivalentes",
      counting: "Conteo",
      numberConversions: "Conversiones Numéricas",
      combinedOperations: "Operaciones Combinadas",
      fractionReducer: "Reducción de Fracciones",
    }
  };

  const t = translations[language === 'esp' ? 'esp' : 'eng'];

  const getOperationName = (operationId: string): string => {
    return t[operationId as keyof typeof t] || operationId;
  };

  const getDifficultyName = (difficulty: string): string => {
    return t[difficulty as keyof typeof t] || difficulty;
  };
  
  const generatePdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Título del documento
    doc.setFontSize(18);
    doc.text(t.title, pageWidth / 2, 20, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(12);
    doc.text(t.subtitle, pageWidth / 2, 28, { align: 'center' });
    
    // Información general del ejercicio
    doc.setFontSize(11);
    const exerciseDate = exerciseResult.date 
      ? new Date(exerciseResult.date) 
      : new Date();
    
    const formattedDate = formatDistanceToNow(exerciseDate, { 
      addSuffix: true,
      locale: dateLocale
    });
    
    // Tabla de resumen
    autoTable(doc, {
      startY: 35,
      head: [['', '']],
      body: [
        [`${t.operation}:`, getOperationName(exerciseResult.operationId)],
        [`${t.date}:`, formattedDate],
        [`${t.time}:`, `${Math.floor(exerciseResult.timeSpent / 60)}:${(exerciseResult.timeSpent % 60).toString().padStart(2, '0')}`],
        [`${t.score}:`, `${exerciseResult.score} / ${exerciseResult.totalProblems}`],
        [`${t.accuracy}:`, exerciseResult.accuracy ? `${exerciseResult.accuracy}%` : '100%'],
        [`${t.avgTime}:`, exerciseResult.avgTimePerProblem ? `${exerciseResult.avgTimePerProblem}${t.seconds}` : '-'],
        [`${t.attempts}:`, exerciseResult.avgAttempts ? exerciseResult.avgAttempts.toFixed(1) : '1.0'],
        [`${t.revealed}:`, exerciseResult.revealedAnswers ? exerciseResult.revealedAnswers.toString() : '0'],
        [`${t.finalLevel}:`, getDifficultyName(exerciseResult.difficulty)],
      ],
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: 30, right: 30 },
    });
    
    // Tabla de problemas
    if (exerciseResult.problemDetails && exerciseResult.problemDetails.length > 0) {
      doc.setFontSize(14);
      doc.text(t.problemReview, pageWidth / 2, doc.previousAutoTable.finalY + 15, { align: 'center' });
      
      const problemTableData = exerciseResult.problemDetails.map((detail, index) => [
        `${index + 1}`,
        detail.problem,
        detail.isCorrect ? t.yes : t.no,
        detail.userAnswer?.toString() || '-',
        detail.correctAnswer.toString(),
        detail.attempts.toString(),
        `${detail.timeSpent}${t.seconds}`,
        getDifficultyName(detail.level),
      ]);
      
      autoTable(doc, {
        startY: doc.previousAutoTable.finalY + 20,
        head: [[
          '#', 
          t.problem, 
          t.correct, 
          t.userAnswer, 
          t.correctAnswer, 
          t.attemptsPerProblem, 
          t.timePerProblem, 
          t.level
        ]],
        body: problemTableData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
        },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 25 },
        },
        margin: { left: 15, right: 15 },
      });
    }
    
    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Math Learning Platform - ${new Date().toLocaleDateString()}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
    
    // Guardar el PDF
    const fileName = `${t.fileName}_${exerciseResult.operationId}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };
  
  return (
    <>
      {includeTitle && <h4 className="text-md font-semibold mb-2">{t.generatePdf}</h4>}
      <Button 
        variant={buttonVariant}
        size={buttonSize}
        onClick={generatePdf} 
        className={buttonClassName}
      >
        <Download className="w-4 h-4 mr-2" />
        <span>{t.generatePdf}</span>
      </Button>
    </>
  );
};

export default ExercisePdfExport;