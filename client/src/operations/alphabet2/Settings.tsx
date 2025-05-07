import { useState } from 'react';
import { ModuleSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { CardContent, Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const settingsSchema = z.object({
  difficulty: z.enum(['beginner', 'elementary', 'intermediate', 'advanced', 'expert']),
  showImmediateFeedback: z.boolean(),
  enableSoundEffects: z.boolean(),
  showAnswerWithExplanation: z.boolean(),
  enableRewards: z.boolean(),
  language: z.enum(['english', 'spanish']),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsProps {
  settings: ModuleSettings;
  onBack: () => void;
}

export default function Settings({ settings, onBack }: SettingsProps) {
  const { updateModuleSettings, resetModuleSettings } = useSettings();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      difficulty: (settings.difficulty as any) || 'beginner',
      showImmediateFeedback: settings.showImmediateFeedback,
      enableSoundEffects: settings.enableSoundEffects,
      showAnswerWithExplanation: settings.showAnswerWithExplanation,
      enableRewards: settings.enableRewards,
      language: (settings.language as any) || 'spanish',
    },
  });
  
  const onSubmit = async (data: SettingsFormValues) => {
    setIsSaving(true);
    
    try {
      console.log('[ALPHABET2] Guardando configuración:', data);
      
      // Guardar configuración primero
      await updateModuleSettings('alphabet2', data);
      
      // Breve retraso para asegurar que la configuración se guarde completamente
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mostrar notificación de éxito
      toast({
        title: "Configuración guardada",
        description: `Nivel de dificultad cambiado a: ${data.difficulty}`,
        variant: "default",
      });
      
      console.log(`[ALPHABET2] Configuración guardada exitosamente. Dificultad: ${data.difficulty}`);
      
      // Volver a la pantalla anterior (ejercicio)
      onBack();
    } catch (error) {
      console.error('[ALPHABET2] Error al guardar la configuración:', error);
      
      // Mostrar notificación de error
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la configuración. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleReset = async () => {
    try {
      await resetModuleSettings('alphabet2');
      form.reset({
        difficulty: 'beginner',
        showImmediateFeedback: true,
        enableSoundEffects: true,
        showAnswerWithExplanation: true,
        enableRewards: true,
        language: 'spanish',
      });
    } catch (error) {
      console.error('Error al restablecer la configuración:', error);
    }
  };
  
  return (
    <div className="container max-w-3xl py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Configuración de Alphabet Journey</h1>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="general">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="advanced">Avanzado</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TabsContent value="general">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Nivel de Dificultad</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="beginner"
                            checked={form.watch("difficulty") === "beginner"}
                            onChange={() => form.setValue("difficulty", "beginner")}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>Beginner</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="elementary"
                            checked={form.watch("difficulty") === "elementary"}
                            onChange={() => form.setValue("difficulty", "elementary")}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>Elementary</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="intermediate"
                            checked={form.watch("difficulty") === "intermediate"}
                            onChange={() => form.setValue("difficulty", "intermediate")}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>Intermediate</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="advanced"
                            checked={form.watch("difficulty") === "advanced"}
                            onChange={() => form.setValue("difficulty", "advanced")}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>Advanced</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="expert"
                            checked={form.watch("difficulty") === "expert"}
                            onChange={() => form.setValue("difficulty", "expert")}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>Expert</span>
                        </label>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold mb-3">Ejemplos de Dificultad</h4>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                          <div className={`p-3 rounded-md ${form.watch("difficulty") === "beginner" ? "bg-blue-800 text-white" : "bg-gray-100"}`}>
                            <div className="font-bold mb-2 text-center">Beginner</div>
                            <div className="text-center">Reconocimiento básico</div>
                            <div className="text-center font-mono text-sm mt-2">A → Apple 🍎</div>
                          </div>
                          
                          <div className={`p-3 rounded-md ${form.watch("difficulty") === "elementary" ? "bg-blue-800 text-white" : "bg-gray-100"}`}>
                            <div className="font-bold mb-2 text-center">Elementary</div>
                            <div className="text-center">Emparejamiento</div>
                            <div className="text-center font-mono text-sm mt-2">B = ? [Ball ⚽]</div>
                          </div>
                          
                          <div className={`p-3 rounded-md ${form.watch("difficulty") === "intermediate" ? "bg-blue-800 text-white" : "bg-gray-100"}`}>
                            <div className="font-bold mb-2 text-center">Intermediate</div>
                            <div className="text-center">Quiz de letras</div>
                            <div className="text-center font-mono text-sm mt-2">🍌 = ? [A, C, P, R]</div>
                          </div>
                          
                          <div className={`p-3 rounded-md ${form.watch("difficulty") === "advanced" ? "bg-blue-800 text-white" : "bg-gray-100"}`}>
                            <div className="font-bold mb-2 text-center">Advanced</div>
                            <div className="text-center">Drag & Drop</div>
                            <div className="text-center font-mono text-sm mt-2">Ordenar: A, C, B</div>
                          </div>
                          
                          <div className={`p-3 rounded-md ${form.watch("difficulty") === "expert" ? "bg-blue-800 text-white" : "bg-gray-100"}`}>
                            <div className="font-bold mb-2 text-center">Expert</div>
                            <div className="text-center">Anterior/Siguiente</div>
                            <div className="text-center font-mono text-sm mt-2">K → J y L</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-4">
                        <strong>Beginner:</strong> Reconocimiento básico de letras y palabras<br/>
                        <strong>Elementary:</strong> Emparejamiento de letras con imágenes correspondientes<br/>
                        <strong>Intermediate:</strong> Quiz de múltiples opciones con letras<br/>
                        <strong>Advanced:</strong> Ejercicios de arrastrar y soltar para ordenar letras<br/>
                        <strong>Expert:</strong> Secuencias de letras, reconocimiento de anterior y siguiente
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idioma</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el idioma" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="spanish">Español</SelectItem>
                              <SelectItem value="english">English</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            El idioma en que se presentarán las instrucciones y actividades.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="showImmediateFeedback"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Retroalimentación inmediata
                            </FormLabel>
                            <FormDescription>
                              Mostrar resultados inmediatamente después de cada respuesta.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="enableSoundEffects"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Efectos de sonido
                            </FormLabel>
                            <FormDescription>
                              Habilitar efectos de sonido durante las actividades.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="showAnswerWithExplanation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Mostrar respuestas con explicación
                            </FormLabel>
                            <FormDescription>
                              Permitir ver la respuesta correcta con una explicación.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="enableRewards"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Sistema de recompensas
                            </FormLabel>
                            <FormDescription>
                              Activar el sistema de recompensas por logros.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleReset}
                  >
                    Restablecer valores predeterminados
                  </Button>
                  <div className="space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onBack}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSaving}
                    >
                      {isSaving ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}