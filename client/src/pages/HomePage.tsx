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
          <div className="mb-6 sm:mb-8 text-center px-2">
            <h1 className="text-xl min-[320px]:text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl font-bold gradient-text-blue mb-2 leading-tight">
              Math Modules
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto mt-2 text-sm min-[320px]:text-base sm:text-lg leading-relaxed px-2">
              Improve your math skills with these interactive exercises
              <span className="ml-1 sm:ml-2 animate-float inline-block text-sm min-[320px]:text-base">✏️ 🔢 🧩</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-8 rounded-xl shadow-md border border-blue-100">
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
