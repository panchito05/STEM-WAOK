import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfessorStudentAnswer } from '../ProfessorModeTypes';

interface ProfessorModeReviewProps {
  studentAnswers: ProfessorStudentAnswer[];
  onSubmit: () => void;
  onBack: () => void;
  onEditExplanation: (problemIndex: number) => void;
}

/**
 * Componente para la fase de revisión del modo profesor
 * Permite revisar todas las respuestas y explicaciones antes de finalizar
 */
export const ProfessorModeReview: React.FC<ProfessorModeReviewProps> = ({
  studentAnswers,
  onSubmit,
  onBack,
  onEditExplanation
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('summary');

  // Calcular estadísticas
  const totalProblems = studentAnswers.length;
  const answeredProblems = studentAnswers.filter(a => a.status === 'answered').length;
  const correctAnswers = studentAnswers.filter(a => a.isCorrect).length;
  const incorrectAnswers = answeredProblems - correctAnswers;
  const skippedProblems = studentAnswers.filter(a => a.status === 'skipped').length;
  const revealedProblems = studentAnswers.filter(a => a.status === 'revealed').length;
  
  return (
    <div className="flex flex-col gap-4">
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-center">{t('professorMode.reviewSession')}</CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="summary">{t('professorMode.summary')}</TabsTrigger>
              <TabsTrigger value="details">{t('professorMode.details')}</TabsTrigger>
              <TabsTrigger value="drawings">{t('professorMode.drawings')}</TabsTrigger>
            </TabsList>
            
            {/* Pestaña de resumen */}
            <TabsContent value="summary" className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary/10 p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground">{t('professorMode.totalProblems')}</div>
                  <div className="text-3xl font-bold">{totalProblems}</div>
                </div>
                
                <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground">{t('professorMode.correctAnswers')}</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{correctAnswers}</div>
                </div>
                
                <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground">{t('professorMode.incorrectAnswers')}</div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">{incorrectAnswers}</div>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground">{t('professorMode.skippedRevealed')}</div>
                  <div className="text-3xl font-bold">{skippedProblems + revealedProblems}</div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">{t('professorMode.sessionOverview')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('professorMode.reviewDescription')}
                </p>
                
                <div className="flex flex-col gap-2">
                  {studentAnswers.map((answer, index) => (
                    <div 
                      key={answer.problemId}
                      className={`p-3 rounded-lg ${
                        answer.isCorrect 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : answer.status === 'skipped' || answer.status === 'revealed'
                            ? 'bg-gray-100 dark:bg-gray-800'
                            : 'bg-red-100 dark:bg-red-900/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium">
                          {t('professorMode.problem')} {index + 1}: {answer.problem.operands[0]} + {answer.problem.operands[1]} = {answer.problem.correctAnswer}
                        </div>
                        <div>
                          {answer.isCorrect ? (
                            <span className="text-green-600 dark:text-green-400">✓</span>
                          ) : answer.status === 'skipped' ? (
                            <span className="text-gray-500">⟳</span>
                          ) : answer.status === 'revealed' ? (
                            <span className="text-blue-500">ℹ</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">✗</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* Pestaña de detalles */}
            <TabsContent value="details" className="pt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {studentAnswers.map((answer, index) => (
                    <Card key={answer.problemId} className="overflow-hidden">
                      <CardHeader className={`py-2 ${
                        answer.isCorrect 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : answer.status === 'skipped' || answer.status === 'revealed'
                            ? 'bg-gray-100 dark:bg-gray-800'
                            : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        <div className="flex justify-between items-center">
                          <h3 className="text-md font-medium">
                            {t('professorMode.problem')} {index + 1}
                          </h3>
                          <div className="text-sm text-muted-foreground">
                            {answer.status === 'answered' ? t('professorMode.answered') : 
                             answer.status === 'skipped' ? t('professorMode.skipped') : 
                             answer.status === 'revealed' ? t('professorMode.revealed') : 
                             t('professorMode.pending')}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="py-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">{t('professorMode.problem')}</h4>
                            <div className="text-2xl font-bold mb-3">
                              {answer.problem.operands[0]} + {answer.problem.operands[1]} = {answer.problem.correctAnswer}
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              <div>{t('professorMode.correctAnswer')}: {answer.problem.correctAnswer}</div>
                              {answer.answer !== null && (
                                <div>
                                  {t('professorMode.studentAnswered')}: {answer.answer} 
                                  {answer.isCorrect 
                                    ? ` (${t('professorMode.correct')})` 
                                    : ` (${t('professorMode.incorrect')})`}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            {answer.explanationDrawing ? (
                              <div>
                                <h4 className="text-sm font-medium mb-1">{t('professorMode.explanation')}</h4>
                                <div className="border rounded-md overflow-hidden">
                                  <img 
                                    src={answer.explanationDrawing} 
                                    alt={t('professorMode.explanation')} 
                                    className="w-full h-auto"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Button 
                                  variant="outline" 
                                  onClick={() => onEditExplanation(index)}
                                >
                                  {t('professorMode.addExplanation')}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* Pestaña de dibujos */}
            <TabsContent value="drawings" className="pt-4">
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentAnswers
                    .filter(answer => answer.explanationDrawing)
                    .map((answer, index) => (
                      <Card key={answer.problemId} className="overflow-hidden">
                        <CardHeader className="py-2">
                          <h3 className="text-md font-medium">
                            {t('professorMode.problem')} {studentAnswers.indexOf(answer) + 1}: {answer.problem.operands[0]} + {answer.problem.operands[1]} = {answer.problem.correctAnswer}
                          </h3>
                        </CardHeader>
                        
                        <CardContent className="py-3">
                          <div className="border rounded-md overflow-hidden">
                            <img 
                              src={answer.explanationDrawing} 
                              alt={t('professorMode.explanation')} 
                              className="w-full h-auto"
                            />
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-2"
                            onClick={() => onEditExplanation(studentAnswers.indexOf(answer))}
                          >
                            {t('professorMode.editExplanation')}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    
                  {studentAnswers.filter(answer => answer.explanationDrawing).length === 0 && (
                    <div className="col-span-2 text-center py-10 text-muted-foreground">
                      {t('professorMode.noExplanationsYet')}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          {t('common.back')}
        </Button>
        
        <Button onClick={onSubmit}>
          {t('professorMode.finishSession')}
        </Button>
      </div>
    </div>
  );
};