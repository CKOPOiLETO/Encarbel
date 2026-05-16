import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calculator, Info, ShieldCheck, Truck, ExternalLink } from 'lucide-react';
import { BelarusCustomsCalculator } from '../utils/calculator';

export default function CarDetail() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [rates, setRates] = useState(null);
  const [mainPhoto, setMainPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isPrivileged, setIsPrivileged] = useState(true);
  const [volume, setVolume] = useState(1600);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [carRes, ratesRes] = await Promise.all([
          axios.get(`/cars/${id}`),
          axios.get(`/rates`)
        ]);
        
        const carData = carRes.data;
        setCar(carData);
        setRates(ratesRes.data);

        if (carData.displacement_cc) {
          setVolume(carData.displacement_cc);
        }
        if (carData.photos && carData.photos.length > 0) {
          setMainPhoto(carData.photos[0]);
        }
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const costs = useMemo(() => {
    if (!car || !rates) return null;

    const calc = new BelarusCustomsCalculator();
    
    const priceByn = car.price_won * rates.KRW;
    const priceUsd = Math.round(priceByn / rates.USD);
    const priceEur = priceByn / rates.EUR;

    const age = (new Date().getFullYear() - car.year) <= 3 ? 'new' : (new Date().getFullYear() - car.year) <= 5 ? 'medium' : 'old';
    const isElectric = car.fuel?.toLowerCase().includes('electric') || car.fuel?.toLowerCase().includes('전기');
    
    const dutyResult = calc.calculate({
      engineType: isElectric ? 'electric' : 'fuel',
      personType: 'physical',
      priceEur: priceEur,
      engineVolumeCm3: volume || 1600,
      ageCategory: age,
      isPrivileged: isPrivileged
    });

    const bynToUsd = (byn) => byn / rates.USD;
    const eurToUsd = (eur) => (eur * rates.EUR) / rates.USD;

    const items = {
      carUsd: priceUsd,
      shippingUsd: 6600,
      dutyUsd: Math.round(eurToUsd(dutyResult.customsDuty)),
      utilizationUsd: Math.round(bynToUsd(dutyResult.utilizationFee)), 
      customsFeeUsd: Math.round(eurToUsd(dutyResult.customsFee)),
      declarantUsd: Math.round(bynToUsd(300)),
      warehouseUsd: Math.round(bynToUsd(400)),
      companyFeeUsd: Math.round(bynToUsd(950)),
    };

    const total = Object.values(items).reduce((a, b) => a + b, 0);

    return { ...items, total, priceEur };
  }, [car, rates, isPrivileged, volume]);

  // --- ФУНКЦИЯ ПЕРЕВОДА ЦЕН ОПЦИЙ ---
  const renderOption = (opt, index) => {
    // Ищем паттерн цены, который оставляет парсер: "(1,100,000₩)"
    const match = opt.match(/\(([\d,]+)₩\)/);
    
    if (match && rates) {
      // Достаем чистое число вон
      const wonPrice = parseInt(match[1].replace(/,/g, ''), 10);
      
      // Конвертируем
      const bynPrice = Math.round(wonPrice * rates.KRW);
      const usdPrice = Math.round(bynPrice / rates.USD);
      
      // Отрезаем старую корейскую цену из строки
      const cleanName = opt.replace(/—.*만원.*\)/, '').trim();
      
      return (
        <li key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-2 last:border-0">
          <span className="flex items-start gap-2">
            <span className="text-blue-500 font-bold mt-0.5">✓</span> 
            <span className="text-gray-700">{cleanName}</span>
          </span>
          <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-1 rounded w-max">
            ≈ {usdPrice}$ / {bynPrice} BYN
          </span>
        </li>
      );
    }
    
    // Если цены у опции нет (бесплатная/базовая), выводим как обычно
    return (
      <li key={index} className="flex items-start gap-2 border-b border-gray-50 pb-2 last:border-0 text-gray-700">
        <span className="text-blue-500 font-bold mt-0.5">✓</span> {opt}
      </li>
    );
  };

  if (loading || !car) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 font-medium transition-colors">
        <ArrowLeft size={20} /> Назад в каталог
      </Link>

      {/* ВАЖНО: Добавлен items-start для правильной работы sticky */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="bg-gray-100 rounded-xl overflow-hidden h-[350px] md:h-[550px] mb-4 border">
              <img src={mainPhoto} alt="Main" className="w-full h-full object-cover" />
            </div>
            <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
              {car.photos?.map((p, i) => (
                <img 
                  key={i} src={p} 
                  onClick={() => setMainPhoto(p)}
                  className={`w-20 h-16 md:w-24 md:h-20 object-cover rounded-lg cursor-pointer border-2 transition-all shrink-0 ${mainPhoto === p ? 'border-blue-600' : 'border-transparent opacity-60 hover:opacity-100'}`} 
                  alt="Thumb" 
                />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2 text-gray-800">
              <Info className="text-blue-600" size={24} /> Основная информация
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-10">
              <div className="border-b pb-2"><span className="text-gray-400 block text-[10px] uppercase tracking-widest mb-1 font-bold">Марка</span> <span className="font-bold text-lg">{car.manufacturer}</span></div>
              <div className="border-b pb-2"><span className="text-gray-400 block text-[10px] uppercase tracking-widest mb-1 font-bold">Модель</span> <span className="font-bold text-lg">{car.model}</span></div>
              <div className="border-b pb-2"><span className="text-gray-400 block text-[10px] uppercase tracking-widest mb-1 font-bold">Год выпуска</span> <span className="font-bold text-lg">{car.year}</span></div>
              <div className="border-b pb-2"><span className="text-gray-400 block text-[10px] uppercase tracking-widest mb-1 font-bold">Объем двигателя</span> <span className="font-bold text-lg text-blue-600">{car.displacement_cc ? `${car.displacement_cc} см³` : '-'}</span></div>
              <div className="border-b pb-2"><span className="text-gray-400 block text-[10px] uppercase tracking-widest mb-1 font-bold">Кузов</span> <span className="font-bold text-lg">{car.body_type || '-'}</span></div>
              <div className="border-b pb-2"><span className="text-gray-400 block text-[10px] uppercase tracking-widest mb-1 font-bold">Пробег</span> <span className="font-bold text-lg">{car.mileage?.toLocaleString()} км</span></div>
              <div className="border-b pb-2"><span className="text-gray-400 block text-[10px] uppercase tracking-widest mb-1 font-bold">Топливо</span> <span className="font-bold text-lg">{car.fuel}</span></div>
              <div className="border-b pb-2"><span className="text-gray-400 block text-[10px] uppercase tracking-widest mb-1 font-bold">Трансмиссия</span> <span className="font-bold text-lg">{car.transmission}</span></div>
              <div className="border-b pb-2"><span className="text-gray-400 block text-[10px] uppercase tracking-widest mb-1 font-bold">Цвет</span> <span className="font-bold text-lg">{car.color}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-xl mb-6 text-gray-800 border-l-4 border-blue-600 pl-3">Уникальные опции</h3>
              <ul className="space-y-3 text-sm">
                {car.unique_options?.length > 0 ? car.unique_options.map((opt, i) => renderOption(opt, i)) : <li className="text-gray-400 italic">Данные отсутствуют</li>}
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-xl mb-6 text-gray-800 border-l-4 border-gray-300 pl-3">Комплектация</h3>
              <div className="flex flex-wrap gap-2">
                {car.standard_options?.map((opt, i) => (
                  <span key={i} className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 uppercase tracking-tight">{opt}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА (Калькулятор) */}
        <div className="lg:col-span-4">
          {/* ВАЖНО: Добавлен max-h-[calc(100vh-6rem)] и overflow-y-auto */}
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-50 p-6 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-black text-gray-900 uppercase flex items-center gap-2">
                <Calculator className="text-blue-600" /> Смета расходов
              </h2>
              <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">USD</span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 mb-8 space-y-5 border border-gray-100">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-700 cursor-pointer" htmlFor="priv">Указ №140 (Льгота 50%)</label>
                <input 
                  type="checkbox" id="priv"
                  checked={isPrivileged} 
                  onChange={e => setIsPrivileged(e.target.checked)}
                  className="w-6 h-6 accent-blue-600 cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Рабочий объем (см³)</label>
                <input 
                  type="number" 
                  value={volume} 
                  onChange={e => setVolume(Number(e.target.value))}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {costs && (
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm font-medium">1. Цена в Корее (₩→$)</span>
                  <span className="font-bold text-lg">${costs.carUsd.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm font-medium flex items-center gap-2">
                    <Truck size={16} className="text-blue-500"/> 2. Доставка до Минска
                  </span>
                  <span className="font-bold text-lg">${costs.shippingUsd.toLocaleString()}</span>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <span className="text-[10px] font-black text-blue-600/50 uppercase tracking-widest block mb-4">3. Таможня и сборы (РБ)</span>
                  <div className="space-y-3 ml-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Пошлина + Тамож. сбор</span>
                      <span className="font-bold text-gray-800">${(costs.dutyUsd + costs.customsFeeUsd).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Утильсбор</span>
                      <span className="font-bold text-gray-800">${costs.utilizationUsd}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Услуги декларанта</span>
                      <span className="font-bold text-gray-800">${costs.declarantUsd}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">СВХ и ЭПТС</span>
                      <span className="font-bold text-gray-800">${costs.warehouseUsd}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-gray-500 text-sm font-medium flex items-center gap-2">
                    <ShieldCheck size={16} className="text-green-600"/> 4. Услуги компании
                  </span>
                  <span className="font-bold text-lg text-green-700">${costs.companyFeeUsd}</span>
                </div>

                <div className="mt-8 bg-gray-900 rounded-3xl p-6 text-white shadow-xl shadow-gray-200 transform hover:scale-[1.02] transition-transform">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Итого:</span>
                    <span className="text-4xl font-black tracking-tighter">${costs.total.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="pt-6 space-y-1">
                  <div className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-tighter flex justify-center gap-4">
                    <span>USD: {rates.USD.toFixed(3)}</span>
                    <span>EUR: {rates.EUR.toFixed(3)}</span>
                  </div>
                  <p className="text-[9px] text-gray-300 text-center">*Расчет носит справочный характер</p>
                </div>

                <a 
                  href={car.url} target="_blank" rel="noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 w-full bg-blue-50 text-blue-600 py-4 rounded-2xl font-black text-sm uppercase hover:bg-blue-100 transition-colors"
                >
                  Оригинал на Encar <ExternalLink size={16} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}