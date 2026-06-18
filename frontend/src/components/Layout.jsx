import { Outlet, Link } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react'; // Импортируем иконки
import logo from '../assets/logo.PNG'; 

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* ФИКСИРОВАННАЯ ШАПКА (Топ-бар + Меню) */}
      <div className="sticky top-0 z-50 flex flex-col shadow-sm">
        
        {/* ТОП-БАР С КОНТАКТАМИ */}
        <div className="bg-gray-900 text-gray-300 py-2 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-xs md:text-sm font-medium gap-2">
            <div className="flex items-center gap-2 cursor-default hover:text-white transition-colors">
              <MapPin size={18} className="text-red-500" />
              <span className="font-bold tracking-wider text-base md:text-lg">г. Минск, пр-т. Победителей 102</span>
            </div>
            <a 
              href="tel:+375296892020" 
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Phone size={14} className="text-red-500" />
              <span className="font-bold tracking-wider text-base md:text-lg">+375 (29) 689 20 20</span>
            </a>
          </div>
        </div>

        {/* ОСНОВНОЕ МЕНЮ */}
        <header className="bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold text-red-600 hover:opacity-80 transition-opacity">
              <img src={logo} alt="EncarBel Logo" className="h-20 w-auto object-contain" />
              <span>Encar<span className="text-gray-800">Bel</span></span>
            </Link>
            
            <nav className="flex gap-6 font-bold text-sm uppercase tracking-wide">
            <Link to="/" className="hover:text-red-600 transition-colors">Каталог</Link>
            <Link to="/calculator" className="hover:text-red-600 transition-colors">Калькулятор</Link>
            <Link to="/about" className="hover:text-red-600 transition-colors">О нас</Link>
            <Link to="/contacts" className="hover:text-red-600 transition-colors">Контакты</Link>
            </nav>
          </div>
        </header>
      </div>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-grow">
        <Outlet />
      </main>

      {/* Подвал сайта */}
      <footer className="bg-gray-900 text-white py-8 mt-auto border-t-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="text-gray-400 font-medium text-sm">
            <p>© 2026 AUTOCAPITAL (EncarBel).</p>
            <p>Прямая доставка авто из Южной Кореи в Беларусь.</p>
          </div>
          <div className="flex flex-col items-center md:items-end text-sm text-gray-400 font-medium">
            <a href="tel:+375296892020" className="hover:text-white transition-colors mb-1">+375 (29) 689 20 20</a>
            <span>г. Минск, пр-т. Победителей 102</span>
          </div>
        </div>
      </footer>
    </div>
  );
}