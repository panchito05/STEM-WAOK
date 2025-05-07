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
  Settings as SettingsIcon 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

// Este componente muestra una vista previa de Alphabet Journey mientras se completa la integración
export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Alphabet Journey
          </h2>
          <p className="text-gray-500 mt-1">
            Una aventura interactiva para aprender el alfabeto
          </p>
        </div>
        <Button onClick={onOpenSettings} variant="outline">
          <SettingsIcon className="h-4 w-4 mr-2" />
          Configuración
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="activities">Actividades</TabsTrigger>
          <TabsTrigger value="coming-soon">Próximamente</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Exploración de Islas</CardTitle>
                <CardDescription>
                  Una experiencia narrativa envolvente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400 rounded-lg flex items-center justify-center mb-4">
                  <Map className="h-16 w-16 text-white" />
                </div>
                <p>
                  Explora islas temáticas para cada letra del alfabeto. Cada isla tiene su propio ecosistema y 
                  habitantes que te ayudarán a aprender las letras a través de historias interactivas.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ecosistema Creciente</CardTitle>
                <CardDescription>
                  Observa cómo crece tu mundo al aprender
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-400 rounded-lg flex items-center justify-center mb-4">
                  <Compass className="h-16 w-16 text-white" />
                </div>
                <p>
                  Cada letra que aprendes añade nuevos elementos a tu ecosistema. Plantas, animales y 
                  características geográficas relacionadas con la letra aparecerán, creando un mundo visualmente rico.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Tu Progreso</CardTitle>
              <CardDescription>
                Sigue tu avance en el aprendizaje del alfabeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all" 
                  style={{ width: '15%' }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>Letras dominadas: 4/26</span>
                <span>Nivel: Principiante</span>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium">Logros desbloqueados: 2</span>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="activities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Espejo de Sonidos</CardTitle>
                <CardDescription>
                  Practica la pronunciación de las letras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center mb-4">
                  <Mic className="h-12 w-12 text-white" />
                </div>
                <p className="text-sm">
                  Repite los sonidos de las letras y recibe retroalimentación inmediata sobre tu pronunciación.
                  Esta actividad utiliza reconocimiento de voz para ayudarte a perfeccionar el habla.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>Próximamente</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Constructor de Palabras</CardTitle>
                <CardDescription>
                  Forma palabras con las letras aprendidas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gradient-to-r from-amber-500 to-orange-400 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-12 w-12 text-white" />
                </div>
                <p className="text-sm">
                  Arrastra y suelta letras para formar palabras sencillas. A medida que aprendes más letras,
                  podrás construir palabras más complejas y enriquecer tu vocabulario.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>Próximamente</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Reconocimiento de Movimiento</CardTitle>
                <CardDescription>
                  Practica la escritura de letras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gradient-to-r from-pink-500 to-rose-400 rounded-lg flex items-center justify-center mb-4">
                  <PenTool className="h-12 w-12 text-white" />
                </div>
                <p className="text-sm">
                  Aprende a escribir las letras siguiendo patrones guiados. El sistema reconoce tus
                  movimientos y te ayuda a mejorar tu caligrafía con práctica interactiva.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>Próximamente</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="coming-soon">
          <Card>
            <CardHeader>
              <CardTitle>
                Próximas Funcionalidades
              </CardTitle>
              <CardDescription>
                Estas características estarán disponibles pronto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-2">Compañero Virtual</h3>
                <p>Un guía animado que te acompaña en tu viaje de aprendizaje, ofreciendo consejos y celebrando tus logros.</p>
              </div>
              
              <div className="border p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-2">Modo Multijugador</h3>
                <p>Aprende junto a amigos o familiares en desafíos cooperativos que hacen el aprendizaje más divertido.</p>
              </div>
              
              <div className="border p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-2">Personalización Avanzada</h3>
                <p>Personaliza tu avatar, tu isla principal y los elementos del ecosistema según tus preferencias.</p>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <p className="text-sm text-gray-500">
                Estamos trabajando constantemente para mejorar Alphabet Journey. ¡Mantente atento a las actualizaciones!
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}