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
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Math Modules
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto mt-2">
              Improve your math skills with these interactive exercises
              <span className="ml-2">✏️ 🔢 🧩</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm">
            <AccessibleDndContextProvider>
              <ModuleList />
            </AccessibleDndContextProvider>
          </div>
        </div>
      </div>
    </>
  );
}
