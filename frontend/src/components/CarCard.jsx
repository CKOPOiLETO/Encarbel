import { Link } from 'react-router-dom';
import { Calendar, Gauge, Fuel } from 'lucide-react';
import { BelarusCustomsCalculator } from '../utils/calculator';

export default function CarCard({ car, rates }) {
  // Пока курсы не загрузились, показываем "скелет" загрузки
  if (!rates) return <div className="h-[380px] bg-gray-100 animate-pulse rounded-xl border border-gray-200" />;

  const calc = new BelarusCustomsCalculator();

  // 1. Чистая цена в Корее
  const priceBynNetto = car.price_won * rates.KRW;
  const priceEurNetto = priceBynNetto / rates.EUR;

  // 2. Распознавание электромобиля
  const isElectric = car.fuel?.toLowerCase().includes('electric') || car.fuel?.toLowerCase().includes('전기');

  // 3. Точный расчет растаможки
  const duty = calc.calculate({
    engineType: isElectric ? 'electric' : 'fuel',
    personType: 'physical',
    priceEur: priceEurNetto,
    engineVolumeCm3: car.displacement_cc || 1600, // Если парсер не нашел объем, берем 1.6 как среднее
    ageCategory: (new Date().getFullYear() - car.year) <= 5 ? 'medium' : 'old',
    isPrivileged: true // Для превью в каталоге всегда считаем с льготой 50%
  });

  // 4. Суммируем всё в BYN
  const shippingByn = 6600 * rates.USD;
  const customsByn = (duty.customsDuty + duty.customsFee) * rates.EUR;
  const utilByn = duty.utilizationFee; // Утильсбор уже считается в BYN в классе
  const fixedFeesByn = 300 + 400 + 950; // Декларант + СВХ + Услуги

  // Итоговая цена под ключ
  const totalPriceByn = Math.round(priceBynNetto + shippingByn + customsByn + utilByn + fixedFeesByn);
  
  // Итоговая цена под ключ в Долларах
  const totalPriceUsd = Math.round(totalPriceByn / rates.USD);

  const photo = car.photos && car.photos.length > 0 
    ? car.photos[0] 
    : 'https://via.placeholder.com/400x300?text=Нет+Фото';

  return (
    <Link 
      to={`/car/${car.car_id}`} 
      className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 flex flex-col h-full relative"
    >
      
      {/* Бейдж "Под Ключ" */}
      <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded font-bold z-10 uppercase tracking-widest shadow-md">
        Под ключ в Минск
      </div>

      <div className="relative h-52 overflow-hidden bg-gray-100">
        <img 
          src={photo} 
          alt={car.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          loading="lazy"
        />
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded">
          {car.year}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-base text-gray-800 leading-snug mb-3 line-clamp-2 min-h-[2.5rem]" title={car.title}>
          {car.title}
        </h3>

        <div className="mb-4">
          <div className="text-blue-600 font-black text-2xl tracking-tight">
            {totalPriceByn.toLocaleString('ru-RU')} BYN
          </div>
          <div className="text-gray-500 font-semibold text-sm mt-1">
            ≈ {totalPriceUsd.toLocaleString('ru-RU')} $
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-50 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
            <Calendar size={13} className="text-gray-400"/> {car.year}
          </span>
          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
            <Gauge size={13} className="text-gray-400"/> {car.mileage?.toLocaleString('ru-RU')} КМ
          </span>
          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
            <Fuel size={13} className="text-gray-400"/> {isElectric ? 'Электро' : car.fuel}
          </span>
        </div>
      </div>
    </Link>
  );
}