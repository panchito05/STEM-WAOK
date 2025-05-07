import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, ArrowLeft, ArrowRight, Cog, Check, EyeIcon } from 'lucide-react';
import { ModuleSettings } from '@/context/SettingsContext';
import { useProgress } from '@/context/ProgressContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import { useTranslations } from '@/hooks/use-translations';
import { useAlphabetStore, Letter, ExerciseType } from '@/store/alphabetStore';
import { englishAlphabet, spanishAlphabet } from './data';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

export function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const { t } = useTranslations();
  const { saveExerciseResult } = useProgress();
  
  // Obtenemos todo del store centralizado
  const { 
    currentIndex, showDetails, isCorrect, exerciseType,
    quizOptions, quizCorrectLetter, selectedOption,
    matchingImage, matchingOptions, matchingSelection,
    lettersToOrder, 
    adjacentInputs, adjacentResults,
    showReward, score, attempts, correctStreak,
    
    // Acciones
    setCurrentIndex, setExerciseType, reset,
    prepareQuizOptions, prepareMatchingOptions, prepareOrderingLetters,
    handleQuizOptionSelect, handleMatchingSelect, checkLetterOrder,
    checkAdjacentLetters, showAnswer, updateAdjacentInputs, moveCard,
    getCurrentLetter
  } = useAlphabetStore();
  
  // Handle audio playback
  const playSound = (text: string) => {
    if (settings.enableSoundEffects && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8; // Slower for clarity
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Set exercise type based on difficulty level
  useEffect(() => {
    let newType: ExerciseType = 'basic';
    
    if (settings.difficulty === 'expert' && correctStreak >= 10) {
      // After 10 correct answers in expert mode, mix all types
      const types: ExerciseType[] = ['basic', 'matching', 'quiz', 'ordering', 'adjacentLetters'];
      const randomIndex = Math.floor(Math.random() * types.length);
      newType = types[randomIndex];
    } else {
      // Set type based on difficulty
      switch (settings.difficulty) {
        case 'beginner':
          newType = 'basic';
          break;
        case 'elementary':
          newType = 'matching';
          break;
        case 'intermediate':
          newType = 'quiz';
          break;
        case 'advanced':
          newType = 'ordering';
          break;
        case 'expert':
          newType = 'adjacentLetters';
          break;
        default:
          newType = 'basic';
      }
    }
    
    setExerciseType(newType);
    
    // Preparamos ejercicio basado en el nuevo tipo
    const language = settings.language || 'english';
    if (newType === 'quiz') {
      prepareQuizOptions(language);
    } else if (newType === 'matching') {
      prepareMatchingOptions(language);
    } else if (newType === 'ordering') {
      prepareOrderingLetters(language);
    }
  }, [settings.difficulty, correctStreak]);
  
  // Navigation handlers
  const handleNext = () => {
    setCurrentIndex((currentIndex + 1) % (settings.language === 'spanish' ? spanishAlphabet.length : englishAlphabet.length));
  };
  
  const handlePrevious = () => {
    const alphabetLength = settings.language === 'spanish' ? spanishAlphabet.length : englishAlphabet.length;
    setCurrentIndex(currentIndex === 0 ? alphabetLength - 1 : currentIndex - 1);
  };
  
  // Handle clicks in basic mode
  const handleLetterClick = () => {
    if (exerciseType === 'basic') {
      const language = settings.language || 'english';
      const currentLetter = getCurrentLetter(language);
      showAnswer('basic', language);
      playSound(`${currentLetter.uppercase}. ${currentLetter.word}`);
    }
  };
  
  // Wrapper to handle show answer with language
  const handleShowAnswer = () => {
    const language = settings.language || 'english';
    showAnswer(exerciseType, language);
    
    // Play appropriate sound
    const currentLetter = getCurrentLetter(language);
    if (exerciseType === 'basic' || exerciseType === 'matching' || exerciseType === 'quiz') {
      playSound(`${currentLetter.uppercase} is for ${currentLetter.word}`);
    } else if (exerciseType === 'adjacentLetters') {
      const alphabet = language === 'spanish' ? spanishAlphabet : englishAlphabet;
      const currentIdx = alphabet.findIndex(l => l.id === currentLetter.id);
      let before = '';
      let after = '';
      
      if (currentIdx > 0) {
        before = alphabet[currentIdx - 1].uppercase;
      }
      
      if (currentIdx < alphabet.length - 1) {
        after = alphabet[currentIdx + 1].uppercase;
      }
      
      playSound(`The letter before ${currentLetter.uppercase} is ${before || "none"} and the letter after is ${after || "none"}.`);
    }
  };
  
  // Wrapper para los manejadores que necesitan audio
  const handleQuizSelection = (letter: Letter) => {
    handleQuizOptionSelect(letter);
    
    // Sonido basado en resultado
    if (letter.id === quizCorrectLetter?.id) {
      playSound("Correct! Good job!");
    } else if (quizCorrectLetter) {
      playSound(`Incorrect. The letter is ${quizCorrectLetter.uppercase} for ${quizCorrectLetter.word}`);
    }
  };
  
  const handleMatchingSelection = (letter: Letter) => {
    const language = settings.language || 'english';
    const currentLetter = getCurrentLetter(language);
    
    handleMatchingSelect(letter);
    
    // Sonido basado en resultado
    if (letter.id === currentLetter.id) {
      playSound("Correct! Good job!");
    } else {
      playSound(`Incorrect. The letter is ${currentLetter.uppercase} for ${currentLetter.word}`);
    }
  };
  
  const handleCheckLetterOrder = () => {
    checkLetterOrder();
    
    // Sonido basado en resultado (tenemos que esperar a que se actualice isCorrect)
    // Aquí asumimos que isCorrect está actualizado inmediatamente
    if (isCorrect) {
      playSound("Correct! The letters are in the right order!");
    } else {
      playSound("Try again. The letters are not in the correct order.");
    }
  };
  
  const handleCheckAdjacentLetters = () => {
    checkAdjacentLetters();
    
    // Sonido basado en resultados
    if (adjacentResults.before && adjacentResults.after) {
      playSound("Perfect! You got both adjacent letters right!");
    } else if (adjacentResults.before || adjacentResults.after) {
      playSound("Partially correct! One of your answers is right.");
    } else {
      playSound("Try again. Neither of your answers is correct.");
    }
  };
  
  // Letter component for drag and drop
  const DraggableLetter = ({ 
    id, 
    letter, 
    index
  }: { 
    id: string, 
    letter: string, 
    index: number
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    
    const [{ isDragging }, drag] = useDrag({
      type: 'letter',
      item: () => ({ id, index }),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });
    
    const [, drop] = useDrop({
      accept: 'letter',
      hover(item: { id: string, index: number }, monitor) {
        if (!ref.current) return;
        
        const dragIndex = item.index;
        const hoverIndex = index;
        
        // Don't replace items with themselves
        if (dragIndex === hoverIndex) return;
        
        const hoverBoundingRect = ref.current.getBoundingClientRect();
        const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
        const clientOffset = monitor.getClientOffset();
        
        if (!clientOffset) return;
        
        const hoverClientX = clientOffset.x - hoverBoundingRect.left;
        
        // Only perform the move when cursor has crossed half of the item's width
        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;
        
        moveCard(dragIndex, hoverIndex);
        item.index = hoverIndex;
      },
    });
    
    drag(drop(ref));
    
    return (
      <div 
        ref={ref}
        className="h-16 w-16 flex items-center justify-center text-3xl font-bold 
                  bg-blue-100 dark:bg-blue-900 rounded-md cursor-move border-2 
                  border-blue-300 transition-opacity"
        style={{ opacity: isDragging ? 0.4 : 1 }}
      >
        {letter}
      </div>
    );
  };
  
  // Render reward animation
  const renderReward = () => {
    if (!showReward) return null;
    
    const rewardType = settings.rewardType as string || 'stars';
    let rewardElements: JSX.Element[] = [];
    
    switch (rewardType) {
      case 'stars':
        rewardElements = Array(5).fill(0).map((_, i) => (
          <div 
            key={`star-${i}`} 
            className="text-4xl animate-bounce" 
            style={{ 
              animation: `bounce 1s infinite ${i * 0.2}s`,
              color: `hsl(${45 + i * 10}, 100%, 50%)`
            }}
          >
            ⭐
          </div>
        ));
        break;
      case 'medals':
        rewardElements = Array(3).fill(0).map((_, i) => (
          <div 
            key={`medal-${i}`} 
            className="text-5xl animate-bounce" 
            style={{ animation: `bounce 1s infinite ${i * 0.3}s` }}
          >
            {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
          </div>
        ));
        break;
      case 'trophies':
        rewardElements = Array(3).fill(0).map((_, i) => (
          <div 
            key={`trophy-${i}`} 
            className="text-5xl animate-bounce" 
            style={{ 
              animation: `bounce 1s infinite ${i * 0.3}s`,
              transform: `rotate(${(i - 1) * 15}deg)`
            }}
          >
            🏆
          </div>
        ));
        break;
    }
    
    return (
      <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center pointer-events-none">
        <div className="flex gap-4 items-center">
          {rewardElements}
        </div>
      </div>
    );
  };
  
  // Render functions for each exercise type
  const renderBasicMode = () => {
    const language = settings.language || 'english';
    const currentLetter = getCurrentLetter(language);
    
    return (
      <div className="flex flex-col items-center justify-center">
        <div 
          className="cursor-pointer text-9xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text"
          onClick={handleLetterClick}
        >
          {currentLetter.uppercase}
          {settings.showImmediateFeedback && (
            <span className="text-7xl ml-4">{currentLetter.lowercase}</span>
          )}
        </div>
        
        {!showDetails && (
          <Button 
            variant="outline"
            onClick={handleShowAnswer}
            className="mt-2 mb-4"
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            {t('showAnswer')}
          </Button>
        )}
        
        {showDetails && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="text-6xl mb-4">{currentLetter.image}</div>
            <div className="text-2xl font-medium">{currentLetter.word}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => playSound(`${currentLetter.uppercase}. ${currentLetter.word}`)}
            >
              <Volume2 className="mr-2 h-4 w-4" />
              {t('hearIt')}
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  const renderQuizMode = () => {
    // Si no hay opciones disponibles o letra correcta, mostramos un estado de carga
    if (quizOptions.length === 0 || !quizCorrectLetter) {
      return <div className="flex flex-col items-center">
        <div className="text-xl">Loading quiz options...</div>
      </div>;
    }
    
    return (
      <div className="flex flex-col items-center">
        <div className="text-2xl font-medium mb-4">
          {t('whichLetterMakesThisSound')}
        </div>
        {/* Usamos la imagen de la letra almacenada en el estado independiente */}
        <div className="text-6xl mb-6">{quizCorrectLetter.image}</div>
        
        <div className="grid grid-cols-2 gap-4">
          {quizOptions.map((option) => {
            // Comparamos con la letra correcta desde el estado independiente
            const isThisCorrect = option.id === quizCorrectLetter.id;
            const isSelected = selectedOption?.id === option.id;
            
            return (
              <Button
                key={`quiz-option-${option.id}`}
                size="lg"
                variant={isSelected 
                  ? (isThisCorrect ? "default" : "destructive")
                  : "outline"
                }
                className={`text-4xl h-20 w-20 ${
                  selectedOption && isThisCorrect
                    ? "ring-2 ring-green-500" 
                    : ""
                }`}
                onClick={() => handleQuizSelection(option)}
                disabled={selectedOption !== null}
              >
                {option.uppercase}
              </Button>
            );
          })}
        </div>
        
        {selectedOption === null && (
          <Button 
            variant="outline"
            onClick={handleShowAnswer}
            className="mt-4"
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            {t('showAnswer')}
          </Button>
        )}
        
        {showDetails && (
          <div className="mt-6 flex flex-col items-center animate-fade-in">
            <div className="text-2xl font-medium">
              {`${quizCorrectLetter.uppercase} ${t('isFor')} ${quizCorrectLetter.word}`}
            </div>
            <div className="text-6xl mt-2">{quizCorrectLetter.image}</div>
          </div>
        )}
      </div>
    );
  };
  
  const renderMatchingMode = () => {
    const language = settings.language || 'english';
    const currentLetter = getCurrentLetter(language);
    
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-medium mb-6">
          {t('whichLetterGoesWithThisImage')}
        </h2>
        <div className="text-6xl mb-6">{matchingImage}</div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {matchingOptions.map((letter) => {
            const isThisCorrect = letter.id === currentLetter.id;
            const isSelected = matchingSelection?.id === letter.id;
            
            return (
              <Button
                key={`matching-option-${letter.id}`}
                size="lg"
                variant={isSelected 
                  ? (isThisCorrect ? "default" : "destructive") 
                  : "outline"}
                className={`text-3xl h-16 w-16 ${
                  matchingSelection && isThisCorrect
                    ? "ring-2 ring-green-500" 
                    : ""
                }`}
                onClick={() => handleMatchingSelection(letter)}
                disabled={matchingSelection !== null}
              >
                {letter.uppercase}
              </Button>
            );
          })}
        </div>
        
        {matchingSelection === null && (
          <Button 
            variant="outline"
            onClick={handleShowAnswer}
            className="mt-4"
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            {t('showAnswer')}
          </Button>
        )}
        
        {showDetails && (
          <div className="mt-6 flex flex-col items-center animate-fade-in">
            <div className="text-2xl font-medium">
              {`${currentLetter.uppercase} ${t('isFor')} ${currentLetter.word}`}
            </div>
            <div className="text-6xl mt-2">{currentLetter.image}</div>
          </div>
        )}
      </div>
    );
  };
  
  const renderOrderingMode = () => (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-medium mb-6">
          {t('orderAlphabetLetters')}
        </h2>
        
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {lettersToOrder.map((item, index) => (
            <DraggableLetter 
              key={item.id}
              id={item.id}
              letter={item.letter}
              index={index}
            />
          ))}
        </div>
        
        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleCheckLetterOrder}
            disabled={showDetails && isCorrect === true}
          >
            <Check className="mr-2 h-4 w-4" />
            {t('checkOrder')}
          </Button>
          
          {!showDetails && (
            <Button
              variant="outline"
              onClick={handleShowAnswer}
            >
              <EyeIcon className="mr-2 h-4 w-4" />
              {t('showAnswer')}
            </Button>
          )}
        </div>
        
        {showDetails && (
          <div className="mt-6 animate-fade-in">
            {isCorrect ? (
              <div className="text-center text-green-600 font-medium">
                {t('correctLettersInOrder')}
              </div>
            ) : (
              <div className="text-center text-red-600 font-medium">
                {t('incorrectTryArrangeAlphabetically')}
              </div>
            )}
          </div>
        )}
      </div>
    </DndProvider>
  );
  
  const renderAdjacentLettersMode = () => {
    const language = settings.language || 'english';
    const currentLetter = getCurrentLetter(language);
    
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-medium mb-4">
          {t('whichLettersBeforeAfter')}
        </h2>
        
        <div className="text-9xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
          {currentLetter.uppercase}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-2 mb-6">
          <div>
            <Label htmlFor="before-letter" className="block mb-2">
              {t('letterBefore')}:
            </Label>
            <Input
              id="before-letter"
              maxLength={1}
              className={`text-center text-2xl h-12 w-16 ${
                showDetails 
                  ? adjacentResults.before ? "border-green-500" : "border-red-500" 
                  : ""
              }`}
              value={adjacentInputs.before}
              onChange={(e) => updateAdjacentInputs('before', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="after-letter" className="block mb-2">
              {t('letterAfter')}:
            </Label>
            <Input
              id="after-letter"
              maxLength={1}
              className={`text-center text-2xl h-12 w-16 ${
                showDetails 
                  ? adjacentResults.after ? "border-green-500" : "border-red-500" 
                  : ""
              }`}
              value={adjacentInputs.after}
              onChange={(e) => updateAdjacentInputs('after', e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-2">
          <Button onClick={handleCheckAdjacentLetters} disabled={showDetails}>
            <Check className="mr-2 h-4 w-4" />
            {t('check')}
          </Button>
          
          {!showDetails && (
            <Button variant="outline" onClick={handleShowAnswer}>
              <EyeIcon className="mr-2 h-4 w-4" />
              {t('showAnswer')}
            </Button>
          )}
        </div>
        
        {showDetails && (
          <div className="mt-6 text-center animate-fade-in">
            {adjacentResults.before && adjacentResults.after ? (
              <div className="text-green-600 font-medium">
                {t('correctBothAdjacentLetters')}
              </div>
            ) : adjacentResults.before || adjacentResults.after ? (
              <div className="text-yellow-600 font-medium">
                {t('partiallyCorrectOneAnswer')}
              </div>
            ) : (
              <div className="text-red-600 font-medium">
                {t('incorrectTryIdentifyLetters')}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Render the appropriate exercise based on type
  const renderExercise = () => {
    switch (exerciseType) {
      case 'basic':
        return renderBasicMode();
      case 'quiz':
        return renderQuizMode();
      case 'matching':
        return renderMatchingMode();
      case 'ordering':
        return renderOrderingMode();
      case 'adjacentLetters':
        return renderAdjacentLettersMode();
      default:
        return renderBasicMode();
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-6 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {t('alphabetLearning')}
          </h2>
          <div className="flex items-center">
            <div className="mr-2 text-sm opacity-70">
              {t(settings.difficulty)}
            </div>
            <Button variant="ghost" size="icon" onClick={onOpenSettings}>
              <Cog className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="mb-8">
          {renderExercise()}
        </div>
        
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={handlePrevious}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('previous')}
          </Button>
          
          <Button variant="outline" onClick={handleNext}>
            {t('next')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        {/* Reward system */}
        {renderReward()}
      </CardContent>
    </Card>
  );
}