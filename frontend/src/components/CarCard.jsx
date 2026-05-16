import { Link } from 'react-router-dom';
import { Calendar, Gauge, Fuel } from 'lucide-react';
import { CarCalculator } from '../utils/calculator';

export default function CarCard({ car, rates }) {
  // Проверка наличия фото
  const photo = car.photos && car.photos.length > 0 
    ? car.photos[0] 
    : 'https://via.placeholder.com/400x300?text=Нет+Фото';

  // Расчет цен только если курсы переданы
  // 1. Вона -> Белорусский рубль
  const priceByn = rates ? Math.round(car.price_won * rates.KRW) : null;
  // 2. Белорусский рубль -> Доллар США
  const priceUsd = (priceByn && rates) ? Math.round(priceByn / rates.USD) : null;

// Полная стоимость "под ключ"
let finalPrice = { totalByn: null, totalUsd: null };
if (rates && priceByn !== null) {
  const priceEur = priceByn / rates.EUR;
  const volume = car.displacement_cc || 0;
  const ageCategory = (new Date().getFullYear() - car.year) <= 3 ? 'new' : ((new Date().getFullYear() - car.year) <= 5 ? 'medium' : 'old');
  const calc = new CarCalculator();
  const dutyResult = calc.calculate({
    engineType: 'fuel',
    personType: 'physical',
    priceEur,
    engineVolumeCm3: volume,
    ageCategory,
    isPrivileged: true,
  });
  const bynToUsd = (byn) => byn / rates.USD;
  const eurToUsd = (eur) => (eur * rates.EUR) / rates.USD;
  const dutyUsd = Math.round(eurToUsd(dutyResult.customsDuty));
  const utilizationUsd = Math.round(bynToUsd(dutyResult.utilizationFee));
  const customsFeeUsd = Math.round(eurToUsd(dutyResult.customsFee));
  const declarantUsd = Math.round(bynToUsd(300));
  const warehouseUsd = Math.round(bynToUsd(400));
  const companyFeeUsd = Math.round(bynToUsd(950));
  const shippingUsd = 6600;
  const totalUsd = priceUsd + shippingUsd + dutyUsd + utilizationUsd + customsFeeUsd + declarantUsd + warehouseUsd + companyFeeUsd;
  const totalByn = Math.round(totalUsd * rates.USD);
  finalPrice = { totalByn, totalUsd };
}

  return (
    <Link 
      to={`/car/${car.car_id}`} 
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100 flex flex-col h-full"
    >
      {/* Изображение */}
      <div className="relative h-52 overflow-hidden bg-gray-100">
        <img 
          src={photo} 
          alt={car.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          loading="lazy"
        />
        {/* Бейдж года (опционально для красоты) */}
        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded">
          {car.year}
        </div>
      </div>

      {/* Контент */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-base text-gray-800 leading-snug mb-3 line-clamp-2 min-h-[2.5rem]" title={car.title}>
          {car.title}
        </h3>

        {/* Блок цен */}
        <div className="mb-4">
          <div className="text-blue-600 font-black text-2xl tracking-tight">
            {finalPrice.totalByn !== null ? (
              `${finalPrice.totalByn.toLocaleString('ru-RU')} BYN`
            ) : (
              <span className="text-gray-300 animate-pulse">... BYN</span>
            )}
          </div>
          <div className="text-gray-400 font-semibold text-sm">
            {finalPrice.totalUsd !== null ? (
              `${finalPrice.totalUsd.toLocaleString('en-US')} $`
            ) : (
              <span className="text-gray-200 animate-pulse">... $</span>
            )}
          </div>
        </div>
        
        {/* Характеристики внизу */}
        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-50 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
            <Calendar size={13} className="text-gray-400"/> {car.year}
          </span>
          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
            <Gauge size={13} className="text-gray-400"/> {car.mileage?.toLocaleString('ru-RU')} КМ
          </span>
          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
            <Fuel size={13} className="text-gray-400"/> {car.fuel}
          </span>
        </div>
      </div>
    </Link>
  );
}