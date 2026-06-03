import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CarCard from './CarCard';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';

export default function BottomMarketSlider({ filters, rates }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const sliderRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchDeals = async () => {
      // Ждем, пока загрузятся курсы валют (нам нужен курс USD)
      if (!rates || !rates.USD) return; 

      setLoading(true);
      try {
        // 1. ОГРАНИЧЕНИЕ ПО ГОДУ (не старше 5 лет)
        const currentYear = new Date().getFullYear();
        const absoluteMinYear = currentYear - 5;
        const effectiveYearMin = filters.year_min 
          ? Math.max(Number(filters.year_min), absoluteMinYear) 
          : absoluteMinYear;

        // 2. ОГРАНИЧЕНИЕ ПО ЦЕНЕ (от 25 000 $)
        // Переводим 25 000$ в BYN по актуальному курсу НБРБ
        const absoluteMinPriceByn = Math.round(25000 * rates.USD);
        
        // Если пользователь сам поставил фильтр "От" (например, от 100 000 BYN), 
        // берем то значение, которое больше.
        const effectivePriceMin = filters.price_min 
          ? Math.max(Number(filters.price_min), absoluteMinPriceByn) 
          : absoluteMinPriceByn;

        // 3. ФОРМИРУЕМ ЗАПРОС
        const apiParams = { 
          ...filters, 
          sort: 'price_asc', 
          year_min: effectiveYearMin, 
          price_min: effectivePriceMin, // Добавили фильтр цены
          hide_lease: true,             // Скрыли лизинг!
          limit: 8, 
          offset: 0 
        };

        const { data } = await axios.get('/cars', { params: apiParams });
        
        if (isMounted) {
          setDeals(data);
        }
      } catch (error) {
        console.error("Ошибка загрузки низа рынка", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDeals();
    return () => { isMounted = false; };
  }, [filters, rates]); // Добавили rates в зависимости

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isHovered || deals.length === 0) return;

    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
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
            Лучшие предложения от 25 000 $
          </span>
        </div>

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