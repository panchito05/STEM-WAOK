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
      
      <div className="max-w-7xl mx-auto py-6 px-2 sm:px-4 lg:px-6">
        <div className="py-6">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold gradient-text-blue mb-2">
              Math Modules
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto mt-2">
              Improve your math skills with these interactive exercises
              <span className="ml-2 animate-float inline-block">✏️ 🔢 🧩</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 sm:p-4 md:p-6 rounded-xl shadow-md border border-blue-100">
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -top-12 -right-12 h-24 w-24 bg-yellow-400 opacity-10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-8 -left-8 h-20 w-20 bg-blue-500 opacity-10 rounded-full blur-xl"></div>
              
              {/* Content */}
              <AccessibleDndContextProvider>
                <ModuleList />
              </AccessibleDndContextProvider>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
