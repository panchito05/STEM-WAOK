import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Volume2, Settings } from 'lucide-react';
import { ModuleSettings } from '@/context/SettingsContext';
import { AlphabetLanguageProvider } from './context/AlphabetLanguageContext';
import { AlphabetDataProvider, useAlphabetData } from './providers/AlphabetDataProvider';
import { useAlphabetUI } from './components/AlphabetUI';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

function AlphabetExerciseCore({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { alphabet, currentLanguage, isReady } = useAlphabetData();
  const { ui } = useAlphabetUI();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!isReady || alphabet.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
        <div className="text-center">Loading alphabet...</div>
      </div>
    );
  }

  const currentLetter = alphabet[currentIndex];
  const progress = ((currentIndex + 1) / alphabet.length) * 100;

  const nextLetter = () => {
    setCurrentIndex((prev) => (prev + 1) % alphabet.length);
  };

  const previousLetter = () => {
    setCurrentIndex((prev) => (prev - 1 + alphabet.length) % alphabet.length);
  };

  const getTitle = () => {
    return `${currentLetter.letter} ${ui.letterFor(currentLetter.word)}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{ui.title}</h1>
          <p className="text-gray-600">{ui.subtitle}</p>
        </div>
        <Button variant="outline" onClick={onOpenSettings}>
          <Settings className="w-4 h-4 mr-2" />
          {ui.settings}
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{ui.progress}</span>
          <span>{currentIndex + 1} / {alphabet.length}</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Main Card */}
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">
            {getTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Letter Display */}
          <motion.div
            key={`${currentLetter.letter}-${currentLanguage}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="text-8xl font-bold text-blue-600 mb-4">
              {currentLetter.letter}
            </div>
            <div className="text-6xl mb-4">
              {currentLetter.lowercase}
            </div>
          </motion.div>

          {/* Word and Image */}
          <div className="text-center space-y-4">
            <motion.div 
              key={`word-${currentLetter.word}-${currentLanguage}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-2xl font-semibold text-gray-700"
            >
              {currentLetter.word}
            </motion.div>
            
            {/* SVG Image */}
            <div className="flex justify-center">
              <motion.div 
                key={`image-${currentLetter.id}-${currentLanguage}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: currentLetter.image || '' }}
              />
            </div>

            {/* Audio Button */}
            <Button variant="outline" className="mx-auto">
              <Volume2 className="w-4 h-4 mr-2" />
              {ui.playSound}
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={previousLetter}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {ui.previous}
            </Button>

            <span className="text-sm text-gray-500">
              {ui.letter} {currentIndex + 1}
            </span>

            <Button 
              variant="outline" 
              onClick={nextLetter}
              disabled={currentIndex === alphabet.length - 1}
            >
              {ui.next}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <div className="text-xs text-gray-400 p-2 bg-gray-50 rounded">
        Debug: Language = {currentLanguage} | Letter = {currentLetter.letter} | Word = {currentLetter.word} | Ready = {isReady}
      </div>
    </div>
  );
}

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  return (
    <AlphabetLanguageProvider moduleSettings={settings}>
      <AlphabetDataProvider>
        <AlphabetExerciseCore onOpenSettings={onOpenSettings} />
      </AlphabetDataProvider>
    </AlphabetLanguageProvider>
  );
}