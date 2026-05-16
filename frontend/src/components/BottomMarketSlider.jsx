import { useState, useEffect } from 'react';
import axios from 'axios';
import CarCard from './CarCard';
import { Flame } from 'lucide-react';

export default function BottomMarketSlider({ filters, rates }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDeals = async () => {
      setLoading(true);
      try {
        // Мы отправляем те же фильтры, но ПРИНУДИТЕЛЬНО сортируем по возрастанию цены
        // и берем только 6 самых дешевых машин
        const apiParams = { ...filters, sort: 'price_asc', limit: 6, offset: 0 };
        
        const { data } = await axios.get('/cars', { 
          params: apiParams 
        });
        
        if (isMounted) setDeals(data);
      } catch (error) {
        console.error("Ошибка загрузки низа рынка", error);
      }
      if (isMounted) setLoading(false);
    };

    fetchDeals();
    
    return () => { isMounted = false; };
  }, [filters]);

  // Если грузится или машин по фильтру нет - ничего не показываем
  if (loading || deals.length === 0) return null;

  return (
    <div className="mb-10 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-inner">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={24} />
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Низ рынка</h2>
        </div>
        <span className="text-sm text-gray-500 font-medium sm:ml-2">
          Самые доступные предложения по вашему запросу
        </span>
      </div>
      
      {/* Скроллируемый контейнер */}
      <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory hide-scrollbar">
        {deals.map(car => (
          <div key={`deal-${car.car_id}`} className="min-w-[280px] w-[280px] snap-start shrink-0">
            <CarCard car={car} rates={rates} />
          </div>
        ))}
      </div>
    </div>
  );
}