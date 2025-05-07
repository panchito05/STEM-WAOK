import { useState } from 'react';
import { ModuleSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Mic, 
  PenTool, 
  Map, 
  Compass, 
  Award,
  Cog,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

interface ActivityItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  detail: string;
}

// Este componente muestra el módulo Alphabet Journey con un estilo similar al de Alphabet Learning
export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const [activeTab, setActiveTab] = useState('activities');
  const { user } = useAuth();
  const selectedLanguage = settings.language || 'spanish';
  
  // Actividades disponibles
  const activities: ActivityItem[] = [
    {
      title: selectedLanguage === 'spanish' ? 'Espejo de Sonidos' : 'Sound Mirror',
      description: selectedLanguage === 'spanish' ? 'Practica la pronunciación de las letras' : 'Practice letter pronunciation',
      icon: <Mic className="h-16 w-16 text-white" />,
      color: 'from-blue-500 to-cyan-400',
      detail: selectedLanguage === 'spanish' 
        ? 'Repite los sonidos de las letras y recibe retroalimentación inmediata sobre tu pronunciación. Esta actividad utiliza reconocimiento de voz para ayudarte a perfeccionar el habla.'
        : 'Repeat the sounds of letters and receive immediate feedback on your pronunciation. This activity uses voice recognition to help you perfect speech.'
    },
    {
      title: selectedLanguage === 'spanish' ? 'Constructor de Palabras' : 'Word Builder',
      description: selectedLanguage === 'spanish' ? 'Forma palabras con las letras aprendidas' : 'Form words with learned letters',
      icon: <BookOpen className="h-16 w-16 text-white" />,
      color: 'from-amber-500 to-orange-400',
      detail: selectedLanguage === 'spanish'
        ? 'Arrastra y suelta letras para formar palabras sencillas. A medida que aprendes más letras, podrás construir palabras más complejas y enriquecer tu vocabulario.'
        : 'Drag and drop letters to form simple words. As you learn more letters, you can build more complex words and enrich your vocabulary.'
    },
    {
      title: selectedLanguage === 'spanish' ? 'Reconocimiento de Movimiento' : 'Motion Recognition',
      description: selectedLanguage === 'spanish' ? 'Practica la escritura de letras' : 'Practice letter writing',
      icon: <PenTool className="h-16 w-16 text-white" />,
      color: 'from-pink-500 to-rose-400',
      detail: selectedLanguage === 'spanish'
        ? 'Aprende a escribir las letras siguiendo patrones guiados. El sistema reconoce tus movimientos y te ayuda a mejorar tu caligrafía con práctica interactiva.'
        : 'Learn to write letters by following guided patterns. The system recognizes your movements and helps you improve your handwriting with interactive practice.'
    }
  ];
  
  // Características del mundo
  const worldFeatures: ActivityItem[] = [
    {
      title: selectedLanguage === 'spanish' ? 'Exploración de Islas' : 'Island Exploration',
      description: selectedLanguage === 'spanish' ? 'Una experiencia narrativa envolvente' : 'An immersive narrative experience',
      icon: <Map className="h-16 w-16 text-white" />,
      color: 'from-indigo-500 via-purple-500 to-pink-400',
      detail: selectedLanguage === 'spanish'
        ? 'Explora islas temáticas para cada letra del alfabeto. Cada isla tiene su propio ecosistema y habitantes que te ayudarán a aprender las letras a través de historias interactivas.'
        : 'Explore themed islands for each letter of the alphabet. Each island has its own ecosystem and inhabitants that will help you learn letters through interactive stories.'
    },
    {
      title: selectedLanguage === 'spanish' ? 'Ecosistema Creciente' : 'Growing Ecosystem',
      description: selectedLanguage === 'spanish' ? 'Observa cómo crece tu mundo al aprender' : 'Watch your world grow as you learn',
      icon: <Compass className="h-16 w-16 text-white" />,
      color: 'from-green-500 via-emerald-500 to-teal-400',
      detail: selectedLanguage === 'spanish'
        ? 'Cada letra que aprendes añade nuevos elementos a tu ecosistema. Plantas, animales y características geográficas relacionadas con la letra aparecerán, creando un mundo visualmente rico.'
        : 'Each letter you learn adds new elements to your ecosystem. Plants, animals, and geographical features related to the letter will appear, creating a visually rich world.'
    }
  ];
  
  // Función para obtener el texto de dificultad basado en la configuración
  const getDifficultyText = () => {
    switch (settings.difficulty) {
      case 'beginner':
        return selectedLanguage === 'spanish' ? 'Principiante' : 'Beginner';
      case 'elementary':
        return selectedLanguage === 'spanish' ? 'Elemental' : 'Elementary';
      case 'intermediate':
        return selectedLanguage === 'spanish' ? 'Intermedio' : 'Intermediate';
      case 'advanced':
        return selectedLanguage === 'spanish' ? 'Avanzado' : 'Advanced';
      case 'expert':
        return selectedLanguage === 'spanish' ? 'Experto' : 'Expert';
      default:
        return settings.difficulty;
    }
  };
  
  // Renderiza una actividad específica
  const renderActivity = (activity: ActivityItem) => (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">{activity.title}</h3>
        <p className="text-gray-600">{activity.description}</p>
      </div>
      
      <div className={`bg-gradient-to-r ${activity.color} rounded-lg flex items-center justify-center p-8 mb-6`}>
        {activity.icon}
      </div>
      
      <p className="flex-grow text-center mb-6">
        {activity.detail}
      </p>
      
      <Button className="w-full" disabled>
        {selectedLanguage === 'spanish' ? 'Próximamente' : 'Coming Soon'}
      </Button>
    </div>
  );
  
  // Renderiza el contenido principal del ejercicio
  const renderExerciseContent = () => {
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="activities">
            {selectedLanguage === 'spanish' ? 'Actividades' : 'Activities'}
          </TabsTrigger>
          <TabsTrigger value="world">
            {selectedLanguage === 'spanish' ? 'Mundo' : 'World'}
          </TabsTrigger>
          <TabsTrigger value="progress">
            {selectedLanguage === 'spanish' ? 'Progreso' : 'Progress'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="activities" className="flex items-center justify-center">
          {renderActivity(activities[0])}
        </TabsContent>
        
        <TabsContent value="world" className="flex items-center justify-center">
          {renderActivity(worldFeatures[0])}
        </TabsContent>
        
        <TabsContent value="progress" className="flex flex-col items-center justify-center">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">
              {selectedLanguage === 'spanish' ? 'Tu Progreso' : 'Your Progress'}
            </h3>
            <p className="text-gray-600">
              {selectedLanguage === 'spanish' 
                ? 'Sigue tu avance en el aprendizaje del alfabeto' 
                : 'Track your progress in learning the alphabet'}
            </p>
          </div>
          
          <div className="w-full max-w-md mb-6">
            <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all" 
                style={{ width: '15%' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>{selectedLanguage === 'spanish' ? 'Letras dominadas: 4/26' : 'Mastered letters: 4/26'}</span>
              <span>{selectedLanguage === 'spanish' ? 'Nivel: Principiante' : 'Level: Beginner'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-6">
            <Award className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium">
              {selectedLanguage === 'spanish' ? 'Logros desbloqueados: 2' : 'Achievements unlocked: 2'}
            </span>
          </div>
          
          <Button className="w-full max-w-md" disabled>
            {selectedLanguage === 'spanish' ? 'Ver todos los logros' : 'View all achievements'}
          </Button>
        </TabsContent>
      </Tabs>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          {selectedLanguage === 'spanish' ? 'Alphabet Journey' : 'Alphabet Journey'}
        </h2>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            {selectedLanguage === 'spanish' ? 'Nivel: ' : 'Level: '}
            {getDifficultyText()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            className="flex items-center"
          >
            <Cog className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card className="flex-1 mb-4">
        <CardContent className="flex flex-col items-center justify-center h-full pt-6">
          {renderExerciseContent()}
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            const tabs = ['activities', 'world', 'progress'];
            const currentIndex = tabs.indexOf(activeTab);
            const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            setActiveTab(tabs[prevIndex]);
          }} 
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {selectedLanguage === 'spanish' ? 'Anterior' : 'Previous'}
        </Button>
        <Button 
          onClick={() => {
            const tabs = ['activities', 'world', 'progress'];
            const currentIndex = tabs.indexOf(activeTab);
            const nextIndex = (currentIndex + 1) % tabs.length;
            setActiveTab(tabs[nextIndex]);
          }} 
          className="flex items-center"
        >
          {selectedLanguage === 'spanish' ? 'Siguiente' : 'Next'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}