import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function SoonPage() {
  return (
    <>
      <Helmet>
        <title>Coming Soon - Math W+A+O+K</title>
        <meta name="description" content="This module is currently under development and will be available soon." />
      </Helmet>
      
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Coming Soon</CardTitle>
            <CardDescription>This module is under development</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              We're working hard to bring you this exciting new module. Check back soon!
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
