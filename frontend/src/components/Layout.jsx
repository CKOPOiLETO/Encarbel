import { Outlet, Link, NavLink } from 'react-router-dom'; 
import { MapPin, Phone, Send, FileText, ExternalLink } from 'lucide-react';
import logo from '../assets/logo_without_label.PNG'; 
import { useEffect } from 'react'; 
import { useLocation } from 'react-router-dom';
import FloatingLeadWidget from './FloatingLeadWidget';


export default function Layout() {
  const { pathname } = useLocation();

  // Автоскролл наверх при переключении страниц (кроме каталога)
  useEffect(() => {
    if (pathname !== '/') {
      window.scrollTo(0, 0);
    }

    // Добавляем или обновляем каноническую ссылку, отсекая весь "мусор" (например ?utm=...)
    const cleanUrl = window.location.origin + window.location.pathname;
    let canonicalLink = document.querySelector("link[rel='canonical']");
    
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', cleanUrl);

  }, [pathname]);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* ФИКСИРОВАННАЯ ШАПКА (Топ-бар + Меню в белом цвете) */}
      <div className="sticky top-0 z-50 flex flex-col shadow-sm">
        
        {/* ТОП-БАР С КОНТАКТАМИ (БЕЛЫЙ) */}
        <div className="bg-white text-gray-600 py-2.5 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-xs md:text-sm font-semibold gap-2">
            <div className="flex items-center gap-2 cursor-default text-gray-500">
              <MapPin size={14} className="text-red-600" />
              г. Минск, пр-т. Победителей 102
            </div>
            <a 
              href="tel:+375445307131" 
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <Phone size={14} className="text-red-600" />
              <span className="tracking-wider">+375 (44) 530 71 31</span>
            </a>
          </div>
        </div>

        {/* ОСНОВНОЕ МЕНЮ (БЕЛОЕ) */}
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap justify-between items-center gap-4">
            
            {/* БЛОК: ЛОГОТИП И TELEGRAM */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-red-600 hover:opacity-80 transition-opacity">
                <img src={logo} alt="EncarBel Logo" className="h-8 w-auto object-contain" />
                <span className="text-gray-800">
                  <span className="font-autocapital font-bold tracking-[0.10em]">AUTOCAPITAL</span> 
                  <span className = "text-800"> & </span>
                  <span className="text-red-500">Encar</span>
                </span>
              </Link>
              
              {/* Ссылка на Telegram */}
              <a 
                href="https://t.me/EncarBel" 
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-gray-600 hover:text-blue-500 transition-colors"
                title="Написать в Telegram"
              >
                <Send size={16} className="text-blue-500" />
                <span className="text-sm font-bold tracking-wider hidden sm:block">Telegram</span>
              </a>
            </div>
            
            {/* Навигация */}
            <nav className="flex flex-wrap gap-4 sm:gap-6 font-bold text-sm uppercase tracking-wide">
              <NavLink 
                to="/" 
                className={({ isActive }) => `transition-colors duration-200 ${isActive ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}
              >
                Каталог
              </NavLink>
              <NavLink 
                to="/calculator" 
                className={({ isActive }) => `transition-colors duration-200 ${isActive ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}
              >
                Калькулятор
              </NavLink>
              <NavLink 
              to="/history"
              className = {({ isActive }) => `transition-colors duration-200 ${isActive ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}>
                История</NavLink>
              <NavLink 
                to="/about" 
                className={({ isActive }) => `transition-colors duration-200 ${isActive ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}
              >
                О нас
              </NavLink>
              <NavLink 
                to="/contacts" 
                className={({ isActive }) => `transition-colors duration-200 ${isActive ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}
              >
                Контакты
              </NavLink>
            </nav>
          </div>
        </header>
      </div>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-grow">
        <Outlet />
      </main>

      {/* ПОДВАЛ САЙТА (БЕЛЫЙ, РАСШИРЕННЫЙ) */}
      <footer className="bg-white text-gray-600 pt-12 pb-6 mt-auto border-t-4 border-red-600 shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-10">
            
            {/* 1 Колонка: Бренд и Контакты */}
            <div className="space-y-4">
              <div>
                <p className="font-extrabold text-gray-900 text-lg mb-1">© 2026 AUTOCAPITAL (EncarBel).</p>
                <p className="text-sm font-medium">Прямая доставка авто из Южной Кореи в Беларусь.</p>
              </div>
              <div className="flex flex-col text-sm text-gray-500 font-medium pt-4">
                <a href="tel:+375445307131" className="text-gray-900 font-black text-xl hover:text-red-600 transition-colors mb-1">
                  +375 (44) 530 71 31
                </a>
                <span>г. Минск, пр-т. Победителей 102</span>
              </div>
            </div>

            {/* 2 Колонка: Реквизиты */}
            <div className="text-sm space-y-2 font-medium">
              <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Реквизиты компании</h4>
              <p className="font-bold text-gray-800 text-base">ООО «Никскапитал»</p>
              <p>Юридический адрес: <span className="text-gray-800">г. Минск, ул. Я. Коласа, 4, пом. 5н</span></p>
              <p>УНП: <span className="text-gray-800">193065676</span></p>
              <p>Расчётный счет: <span className="text-gray-800">BY54PJCB30120763001030000933</span><br/>в ОАО «Приорбанк»</p>
              <p>Код банка: <span className="text-gray-800">PJCBBY2X</span></p>
              <p>Директор: <span className="text-gray-800">Светлана Васильевна Никитёнок</span></p>
            </div>

            {/* 3 Колонка: Юридические документы */}
            <div className="text-sm space-y-3 flex flex-col font-medium">
              <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Юридическая информация</h4>
              <a href="/offer.pdf" target="_blank" rel="noreferrer" className="hover:text-red-600 transition-colors flex items-center gap-2">
                <FileText size={16} className="text-gray-400" /> Договор оферты
              </a>
              <a href="/confidentiality.pdf" target="_blank" rel="noreferrer" className="hover:text-red-600 transition-colors flex items-center gap-2">
                <FileText size={16} className="text-gray-400" /> Договор конфиденциальности
              </a>
              <a href="/personal_data.pdf" target="_blank" rel="noreferrer" className="hover:text-red-600 transition-colors flex items-center gap-2">
                <FileText size={16} className="text-gray-400" /> Политика обработки персональных данных
              </a>
              <a href="https://autocapital.by/privacy-policy/" target="_blank" rel="noreferrer" className="hover:text-red-600 transition-colors flex items-center gap-2">
                <ExternalLink size={16} className="text-gray-400" /> Политика конфиденциальности
              </a>
            </div>

          </div>

          {/* Дисклеймер (Нижняя полоса) */}
          <div className="pt-6 border-t border-gray-100 text-center text-[11px] text-gray-400 uppercase tracking-wider font-bold">
            Информация на сайте носит ознакомительный характер и не является публичной офертой.
          </div>
          
        </div>
      </footer>
      <FloatingLeadWidget />

    </div>
  );
}