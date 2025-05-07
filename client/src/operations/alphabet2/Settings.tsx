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
      await updateModuleSettings('alphabet2', data);
      onBack();
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
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
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dificultad</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona la dificultad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="elementary">Elementary</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            La dificultad determina qué tipo de ejercicios y desafíos se presentarán.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
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