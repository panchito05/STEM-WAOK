import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center">
            <span className="text-gray-500 text-sm">© {new Date().getFullYear()} Math W+A+O+K. All rights reserved.</span>
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/about" className="text-gray-500 hover:text-gray-700 text-sm">
              About
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-gray-700 text-sm">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700 text-sm">
              Terms
            </Link>
            <Link href="/contact" className="text-gray-500 hover:text-gray-700 text-sm">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
