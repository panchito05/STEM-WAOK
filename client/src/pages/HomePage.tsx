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
      
      <div className="max-w-7xl mx-auto py-3 sm:py-6 lg:px-8 px-4 sm:px-6">
        <div className="sm:px-0">
          <div className="mb-4 sm:mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text-blue mb-1 sm:mb-2">
              Math Modules
            </h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
              Improve your math skills with these interactive exercises
              <span className="ml-2 animate-float inline-block">✏️ 🔢 🧩</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8 rounded-xl shadow-md border border-blue-100">
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
