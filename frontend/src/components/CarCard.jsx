import { Link } from 'react-router-dom';
import { Calendar, Gauge, Fuel } from 'lucide-react';
import { BelarusCustomsCalculator } from '../utils/calculator';

export default function CarCard({ car, rates }) {
  if (!rates) return <div className="h-[380px] bg-gray-100 animate-pulse rounded-xl border border-gray-200" />;

  const calc = new BelarusCustomsCalculator();

  // 1. Распознавание электромобиля
  const isElectric = car.fuel?.toLowerCase().includes('electric') || car.fuel?.toLowerCase().includes('전기');

  // 2. Расчет цены (только для НЕ лизинговых авто)
  let totalPriceByn = null;
  let totalPriceUsd = null;

  if (!car.is_lease) {
    const priceBynNetto = car.price_won * rates.KRW;
    const priceEurNetto = priceBynNetto / rates.EUR;
    
    const duty = calc.calculate({
      engineType: isElectric ? 'electric' : 'fuel',
      personType: 'physical',
      priceEur: priceEurNetto,
      engineVolumeCm3: car.displacement_cc || 1600,
      ageCategory: (new Date().getFullYear() - (car.manufacture_date ? new Date(car.manufacture_date).getFullYear() : car.year)) <= 5 ? 'medium' : 'old',
      isPrivileged: true
    });

    const shippingByn = 6600 * rates.USD;
    const customsByn = (duty.customsDuty + duty.customsFee) * rates.EUR;
    const utilByn = duty.utilizationFee;
    const fixedFeesByn = 300 + 400 + 950;

    totalPriceByn = Math.round(priceBynNetto + shippingByn + customsByn + utilByn + fixedFeesByn);
    totalPriceUsd = Math.round(totalPriceByn / rates.USD);
  }

  const photo = car.photos && car.photos.length > 0 
    ? car.photos[0] 
    : 'https://via.placeholder.com/400x300?text=Нет+Фото';

  return (
    <Link 
      to={`/car/${car.car_id}`} 
      className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 flex flex-col h-full relative"
    >
      
      {/* Бейдж статуса */}
      <div className={`absolute top-2 right-2 text-white text-[10px] px-2 py-1 rounded font-bold z-10 uppercase tracking-widest shadow-md ${car.is_lease ? 'bg-orange-500' : 'bg-blue-600'}`}>
        {car.is_lease ? 'Лизинг' : 'Под ключ в Минск'}
      </div>

      <div className="relative h-52 overflow-hidden bg-gray-100">
        <img 
          src={photo} 
          alt={car.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          loading="lazy"
        />
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded">
          {car.manufacture_date ? new Date(car.manufacture_date).getFullYear() : car.year}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-base text-gray-800 leading-snug mb-3 line-clamp-2 min-h-[2.5rem]" title={car.title}>
          {car.title}
        </h3>

        {/* Блок Цены */}
        <div className="mb-4 min-h-[60px] flex flex-col justify-center">
          {car.is_lease ? (
            <div>
              <div className="text-orange-600 font-black text-xl tracking-tight leading-none">
                Цена по запросу
              </div>
              <div className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mt-1">
                Уточняйте у менеджера
              </div>
            </div>
          ) : (
            <div>
              <div className="text-blue-600 font-black text-2xl tracking-tight leading-none">
                {totalPriceByn?.toLocaleString('ru-RU')} BYN
              </div>
              <div className="text-gray-500 font-semibold text-sm mt-1">
                ≈ {totalPriceUsd?.toLocaleString('ru-RU')} $
              </div>
            </div>
          )}
        </div>
        
        {/* Характеристики (Теперь всегда на месте) */}
        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-50 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
            <Calendar size={13} className="text-gray-400"/> 
            {car.manufacture_date ? new Date(car.manufacture_date).getFullYear() : car.year}
          </span>
          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
            <Gauge size={13} className="text-gray-400"/> 
            {car.mileage?.toLocaleString('ru-RU')} КМ
          </span>
          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
            <Fuel size={13} className="text-gray-400"/> 
            {isElectric ? 'Электро' : car.fuel}
          </span>
        </div>
      </div>
    </Link>
  );
}