// Новый вариант дизайна

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CarCard from './CarCard';
import { Gem, ChevronLeft, ChevronRight } from 'lucide-react';

export default function BottomMarketSlider({ filters, rates }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const sliderRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchDeals = async () => {
      if (!rates || !rates.USD) return; 

      setLoading(true);
      try {
        const premiumParams = { ...filters, sort: 'random', price_min: 60000, price_max: 110000, hide_lease: true, limit: 8, offset: 0 };
        const response = await axios.get('/cars', { params: premiumParams });
        
        let carsList = response.data.items; // БЕРЕМ .items
        
        if (carsList.length === 0) {
          const fallbackParams = { sort: 'random', price_min: 60000, price_max: 110000, hide_lease: true, limit: 8, offset: 0 };
          const fallbackResponse = await axios.get('/cars', { params: fallbackParams });
          carsList = fallbackResponse.data.items; // БЕРЕМ .items
        }
        
        if (isMounted) setDeals(carsList);
      } catch (error) {
        console.error("Ошибка загрузки премиум сегмента", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDeals();
    return () => { isMounted = false; };
  }, [filters, rates]);

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
    // Изменили фон на стильный светло-серый с красным акцентом
    <div 
      className="mb-10 bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl border border-gray-800 shadow-2xl relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-600/30">
            <Gem className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Лучшие предложения</h2>
            
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => scroll('left')} aria-label="Влево"
            className="p-2 bg-white/10 rounded-full shadow-sm text-white hover:bg-red-600 transition-all"
          >
            <ChevronLeft size={20}/>
          </button>
          <button 
            onClick={() => scroll('right')} aria-label="Вправо"
            className="p-2 bg-white/10 rounded-full shadow-sm text-white hover:bg-red-600 transition-all"
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
            {/* Чтобы карточки на темном фоне смотрелись круто, они остаются белыми */}
            <CarCard car={car} rates={rates} />
          </div>
        ))}
      </div>
    </div>
  );
}







