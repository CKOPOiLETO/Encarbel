import { Outlet, Link } from 'react-router-dom';
import { Car } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold text-blue-600">
            <Car size={32} />
            <span>Encar<span className="text-gray-800">Export</span></span>
          </Link>
          <nav className="flex gap-6 font-medium">
            <Link to="/" className="hover:text-blue-600 transition-colors">Каталог</Link>
            <Link to="/calculator" className="hover:text-blue-600 transition-colors">Калькулятор</Link>
            <Link to="/about" className="hover:text-blue-600 transition-colors">О нас</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-grow">
        <Outlet />
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>© 2026 EncarExport. Доставка авто из Южной Кореи.</p>
        </div>
      </footer>
    </div>
  );
}