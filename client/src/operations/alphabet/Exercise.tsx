import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Volume2, Settings } from 'lucide-react';
import { ModuleSettings } from '@/context/SettingsContext';
import { useAlphabetLanguage } from './hooks/useAlphabetLanguage';
import { getCompleteAlphabet } from './alphabetData';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const language = useAlphabetLanguage(settings);
  const alphabet = getCompleteAlphabet();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const currentLetter = alphabet[currentIndex];
  const progress = ((currentIndex + 1) / alphabet.length) * 100;

  const nextLetter = () => {
    setCurrentIndex((prev) => (prev + 1) % alphabet.length);
  };

  const previousLetter = () => {
    setCurrentIndex((prev) => (prev - 1 + alphabet.length) % alphabet.length);
  };

  // Get word based on language
  const getWord = () => {
    if (language === 'spanish') {
      return currentLetter.words.spanish;
    }
    return currentLetter.words.english;
  };

  const getTitle = () => {
    const word = getWord();
    if (language === 'spanish') {
      return `${currentLetter.letter} para ${word}`;
    }
    return `${currentLetter.letter} for ${word}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'spanish' ? 'Aprendizaje del Alfabeto' : 'Alphabet Learning'}
          </h1>
          <p className="text-gray-600">
            {language === 'spanish' ? 'Explora cada letra del alfabeto' : 'Explore each letter of the alphabet'}
          </p>
        </div>
        <Button variant="outline" onClick={onOpenSettings}>
          <Settings className="w-4 h-4 mr-2" />
          {language === 'spanish' ? 'Configuración' : 'Settings'}
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{language === 'spanish' ? 'Progreso' : 'Progress'}</span>
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
            key={currentLetter.letter}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="text-8xl font-bold text-blue-600 mb-4">
              {currentLetter.letter}
            </div>
            <div className="text-6xl mb-4">
              {currentLetter.letter.toLowerCase()}
            </div>
          </motion.div>

          {/* Word and Image */}
          <div className="text-center space-y-4">
            <div className="text-2xl font-semibold text-gray-700">
              {getWord()}
            </div>
            
            {/* SVG Image */}
            <div className="flex justify-center">
              <div 
                className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: currentLetter.image }}
              />
            </div>

            {/* Audio Button */}
            <Button variant="outline" className="mx-auto">
              <Volume2 className="w-4 h-4 mr-2" />
              {language === 'spanish' ? 'Reproducir Sonido' : 'Play Sound'}
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
              {language === 'spanish' ? 'Anterior' : 'Previous'}
            </Button>

            <span className="text-sm text-gray-500">
              {language === 'spanish' ? 'Letra' : 'Letter'} {currentIndex + 1}
            </span>

            <Button 
              variant="outline" 
              onClick={nextLetter}
              disabled={currentIndex === alphabet.length - 1}
            >
              {language === 'spanish' ? 'Siguiente' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <div className="text-xs text-gray-400 p-2 bg-gray-50 rounded">
        Debug: Language = {language} | Letter = {currentLetter.letter} | Word = {getWord()}
      </div>
    </div>
  );
}