import { useState } from "react";
import { Helmet } from "react-helmet";
import { useSettings, GlobalSettings } from "@/context/SettingsContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { globalSettings, updateGlobalSettings, resetAllSettings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleUpdateSetting = async (key: keyof GlobalSettings, value: any) => {
    setIsSaving(true);
    await updateGlobalSettings({ [key]: value });
    setIsSaving(false);
  };

  const handleResetAllSettings = async () => {
    setIsResetting(true);
    await resetAllSettings();
    setShowResetConfirm(false);
    setIsResetting(false);
  };

  return (
    <>
      <Helmet>
        <title>Settings - Math W+A+O+K</title>
        <meta name="description" content="Customize your math learning experience with personalized settings." />
      </Helmet>
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure general application settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sound-effects">Sound Effects</Label>
                    <p className="text-sm text-gray-500">Enable sound effects for interactions</p>
                  </div>
                  <Switch
                    id="sound-effects"
                    checked={globalSettings.soundEffects}
                    onCheckedChange={(checked) => handleUpdateSetting('soundEffects', checked)}
                    disabled={isSaving}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="immediate-feedback">Immediate Feedback</Label>
                    <p className="text-sm text-gray-500">Show feedback immediately after answering</p>
                  </div>
                  <Switch
                    id="immediate-feedback"
                    checked={globalSettings.immediateFeedback}
                    onCheckedChange={(checked) => handleUpdateSetting('immediateFeedback', checked)}
                    disabled={isSaving}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="language">Language</Label>
                    <p className="text-sm text-gray-500">Select application language</p>
                  </div>
                  <Select
                    value={globalSettings.language}
                    onValueChange={(value) => handleUpdateSetting('language', value)}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the appearance of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-gray-500">Enable dark mode for the application</p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={globalSettings.darkMode}
                    onCheckedChange={(checked) => handleUpdateSetting('darkMode', checked)}
                    disabled={isSaving}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="font-size">Font Size</Label>
                    <p className="text-sm text-gray-500">Adjust the text size</p>
                  </div>
                  <Select
                    value={globalSettings.fontSize}
                    onValueChange={(value) => handleUpdateSetting('fontSize', value)}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select font size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="accessibility">
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Settings</CardTitle>
                <CardDescription>Configure accessibility features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="high-contrast">High Contrast Mode</Label>
                    <p className="text-sm text-gray-500">Increase contrast for better visibility</p>
                  </div>
                  <Switch
                    id="high-contrast"
                    checked={globalSettings.highContrast}
                    onCheckedChange={(checked) => handleUpdateSetting('highContrast', checked)}
                    disabled={isSaving}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-solutions">Show Solutions</Label>
                    <p className="text-sm text-gray-500">Show solutions after incorrect answers</p>
                  </div>
                  <Switch
                    id="show-solutions"
                    checked={globalSettings.showSolutions}
                    onCheckedChange={(checked) => handleUpdateSetting('showSolutions', checked)}
                    disabled={isSaving}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="extra-time">Extended Time</Label>
                    <p className="text-sm text-gray-500">Add extra time for timed exercises</p>
                  </div>
                  <Switch
                    id="extra-time"
                    checked={globalSettings.extendedTime}
                    onCheckedChange={(checked) => handleUpdateSetting('extendedTime', checked)}
                    disabled={isSaving}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          {showResetConfirm ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertDescription className="flex items-center justify-between">
                <span>This will reset all settings to default values. Are you sure?</span>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowResetConfirm(false)}
                    disabled={isResetting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleResetAllSettings}
                    disabled={isResetting}
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Confirm Reset"
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setShowResetConfirm(true)}
              disabled={isSaving || isResetting}
            >
              Reset to Default Settings
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
