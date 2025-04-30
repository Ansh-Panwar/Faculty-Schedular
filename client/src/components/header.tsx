import { Link } from 'wouter';
import { CalendarCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <CalendarCheck className="text-primary h-6 w-6 mr-2" />
            <h1 className="text-xl font-semibold text-gray-900">Faculty Finder</h1>
          </div>
          <nav className="flex space-x-4">
            <Link href="/" className="text-primary hover:text-primary/90 px-3 py-2 rounded-md text-sm font-medium">
              Search
            </Link>
            <Link href="/appointments" className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium">
              My Appointments
            </Link>
            <Link href="/help" className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium">
              Help
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
