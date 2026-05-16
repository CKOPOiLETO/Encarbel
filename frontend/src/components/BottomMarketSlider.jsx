import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CarCard from './CarCard';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';

export default function BottomMarketSlider({ filters, rates }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false); // Для остановки автоскролла
  const sliderRef = useRef(null);

  // 1. Загрузка данных
  useEffect(() => {
    let isMounted = true;
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const apiParams = { ...filters, sort: 'price_asc', limit: 8, offset: 0 };
        const { data } = await axios.get('/cars', { params: apiParams });
        if (isMounted) setDeals(data);
      } catch (error) {
        console.error("Ошибка загрузки низа рынка", error);
      }
      if (isMounted) setLoading(false);
    };

    fetchDeals();
    return () => { isMounted = false; };
  }, [filters]);

  // 2. Логика кнопок прокрутки
  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // 3. Автоматическая прокрутка (каждые 3 секунды)
  useEffect(() => {
    if (isHovered || deals.length === 0) return;

    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        // Если докрутили до конца — возвращаемся в начало
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scroll('right');
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered, deals]);

  if (loading || deals.length === 0) return null;

  return (
    <div 
      className="mb-10 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-inner relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={24} />
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Низ рынка</h2>
          <span className="text-sm text-gray-500 font-medium sm:ml-2 hidden sm:block">
            Самые доступные предложения по вашему запросу
          </span>
        </div>

        {/* Кнопки навигации */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => scroll('left')} 
            className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-blue-600 hover:shadow transition-all"
          >
            <ChevronLeft size={20}/>
          </button>
          <button 
            onClick={() => scroll('right')} 
            className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-blue-600 hover:shadow transition-all"
          >
            <ChevronRight size={20}/>
          </button>
        </div>
      </div>
      
      {/* Скроллируемый контейнер (заменили hide-scrollbar на custom-scrollbar) */}
      <div 
        ref={sliderRef}
        className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory custom-scrollbar"
      >
        {deals.map(car => (
          <div key={`deal-${car.car_id}`} className="min-w-[280px] w-[280px] snap-start shrink-0">
            <CarCard car={car} rates={rates} />
          </div>
        ))}
      </div>
    </div>
  );
}