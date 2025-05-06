import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const profileFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional().or(z.literal("")),
  confirmNewPassword: z.string().optional().or(z.literal("")),
}).refine(
  data => !data.newPassword || data.newPassword === data.confirmNewPassword,
  {
    message: "New passwords don't match",
    path: ["confirmNewPassword"],
  }
);

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { exerciseHistory } = useProgress();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username || "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    setError(null);
    
    try {
      const payload = {
        username: data.username,
        currentPassword: data.currentPassword,
        ...(data.newPassword ? { newPassword: data.newPassword } : {}),
      };
      
      await apiRequest("PUT", "/api/auth/profile", payload);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      form.reset({
        username: data.username,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate statistics
  const totalExercises = exerciseHistory.length;
  const totalProblems = exerciseHistory.reduce((sum, ex) => sum + ex.totalProblems, 0);
  const correctAnswers = exerciseHistory.reduce((sum, ex) => sum + ex.score, 0);
  const accuracy = totalProblems > 0 ? Math.round((correctAnswers / totalProblems) * 100) : 0;
  const totalTime = exerciseHistory.reduce((sum, ex) => sum + ex.timeSpent, 0);
  const averageTime = totalExercises > 0 ? Math.round(totalTime / totalExercises) : 0;

  return (
    <>
      <Helmet>
        <title>Profile - Math W+A+O+K</title>
        <meta name="description" content="View and edit your profile and see your learning statistics." />
      </Helmet>
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormDescription>
                          Leave blank to keep your current password
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Profile"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Your Learning Statistics</CardTitle>
              <CardDescription>Overview of your progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Total Exercises</p>
                    <p className="text-2xl font-bold">{totalExercises}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Problems Solved</p>
                    <p className="text-2xl font-bold">{totalProblems}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Accuracy</p>
                    <p className="text-2xl font-bold">{accuracy}%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Avg. Time per Exercise</p>
                    <p className="text-2xl font-bold">{averageTime}s</p>
                  </div>
                </div>
                
                {totalExercises === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Complete exercises to see your statistics</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <a href="/progress">View Detailed Progress</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
