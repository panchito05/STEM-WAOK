import { Helmet } from "react-helmet";
import ModuleList from "@/components/ModuleList";
import { AccessibleDndContextProvider } from "@/components/AccessibleDndContext";

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Math W+A+O+K - Interactive Math Learning</title>
        <meta name="description" content="Improve your math skills with interactive exercises in addition, subtraction, multiplication, division, and fractions." />
      </Helmet>
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Math Modules</h1>
            <p className="text-gray-600">Improve your math skills with these interactive exercises</p>
          </div>
          
          <AccessibleDndContextProvider>
            <ModuleList />
          </AccessibleDndContextProvider>
        </div>
      </div>
    </>
  );
}
