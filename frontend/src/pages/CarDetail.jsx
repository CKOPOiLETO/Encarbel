import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calculator, Info, ShieldCheck, Truck } from 'lucide-react';
import { CarCalculator } from '../utils/calculator';

export default function CarDetail() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [rates, setRates] = useState(null);
  const [mainPhoto, setMainPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  // Состояния для калькулятора
  const [isPrivileged, setIsPrivileged] = useState(true); // 140 указ
  const [volume, setVolume] = useState(1600); // Объем по умолчанию

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [carRes, ratesRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/cars/${id}`),
          axios.get(`http://localhost:8000/api/rates`)
        ]);
        
        setCar(carRes.data);
        setRates(ratesRes.data);
        if (carRes.data.photos && carRes.data.photos.length > 0) {
          setMainPhoto(carRes.data.photos[0]);
        }
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Расчет всех расходов
  const costs = useMemo(() => {
    if (!car || !rates) return null;

    const calc = new CarCalculator();
    
    // 1. Цена покупки в Корее
    const priceByn = car.price_won * rates.KRW;
    const priceUsd = Math.round(priceByn / rates.USD);
    const priceEur = priceByn / rates.EUR;

    // 2. Таможня (в Евро через наш класс)
    const age = (new Date().getFullYear() - car.year) <= 3 ? 'new' : (new Date().getFullYear() - car.year) <= 5 ? 'medium' : 'old';
    
    const dutyResult = calc.calculate({
      engineType: 'fuel',
      personType: 'physical',
      priceEur: priceEur,
      engineVolumeCm3: volume,
      ageCategory: age,
      isPrivileged: isPrivileged
    });

    // Конвертер из BYN в USD
    const bynToUsd = (byn) => byn / rates.USD;
    // Конвертер из EUR в USD
    const eurToUsd = (eur) => (eur * rates.EUR) / rates.USD;

    const items = {
      carUsd: priceUsd,
      shippingUsd: 6600,
      dutyUsd: Math.round(eurToUsd(dutyResult.customsDuty)),
      utilizationUsd: Math.round(bynToUsd(dutyResult.utilizationFee)), // Утиль в BYN -> USD
      customsFeeUsd: Math.round(eurToUsd(dutyResult.customsFee)),
      declarantUsd: Math.round(bynToUsd(300)),
      warehouseUsd: Math.round(bynToUsd(400)),
      companyFeeUsd: Math.round(bynToUsd(950)),
    };

    const total = Object.values(items).reduce((a, b) => a + b, 0);

    return { ...items, total };
  }, [car, rates, isPrivileged, volume]);

  if (loading || !car) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 font-medium transition-colors">
        <ArrowLeft size={20} /> Назад в каталог
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ЛЕВАЯ КОЛОНКА: Фото и Описание (8 колонок) */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="bg-gray-100 rounded-xl overflow-hidden h-[300px] md:h-[500px] mb-4 border">
              <img src={mainPhoto} alt="Main" className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
              {car.photos?.slice(0, 16).map((p, i) => (
                <img 
                  key={i} src={p} 
                  onClick={() => setMainPhoto(p)}
                  className={`w-full h-16 md:h-20 object-cover rounded-lg cursor-pointer border-2 transition-all ${mainPhoto === p ? 'border-blue-600' : 'border-transparent opacity-70 hover:opacity-100'}`} 
                  alt="Thumb" 
                />
              ))}
            </div>
          </div>

          {/* Характеристики */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Info className="text-blue-600" /> Характеристики
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
              <div className="border-b pb-2"><span className="text-gray-400 block text-xs uppercase mb-1">Марка</span> <span className="font-bold">{car.manufacturer}</span></div>
              <div className="border-b pb-2"><span className="text-gray-400 block text-xs uppercase mb-1">Модель</span> <span className="font-bold">{car.model}</span></div>
              <div className="border-b pb-2"><span className="text-gray-400 block text-xs uppercase mb-1">Год</span> <span className="font-bold">{car.year}</span></div>
              <div className="border-b pb-2"><span className="text-gray-400 block text-xs uppercase mb-1">Пробег</span> <span className="font-bold">{car.mileage?.toLocaleString()} км</span></div>
              <div className="border-b pb-2"><span className="text-gray-400 block text-xs uppercase mb-1">Топливо</span> <span className="font-bold">{car.fuel}</span></div>
              <div className="border-b pb-2"><span className="text-gray-400 block text-xs uppercase mb-1">КПП</span> <span className="font-bold">{car.transmission}</span></div>
            </div>
          </div>

          {/* Опции */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-lg mb-4 text-blue-600">Уникальные опции</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {car.unique_options?.map((opt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span> {opt}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-lg mb-4 text-gray-600">Стандартные опции</h3>
              <div className="flex flex-wrap gap-2">
                {car.standard_options?.map((opt, i) => (
                  <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">{opt}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Расчет «Под ключ» (4 колонки) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Calculator className="text-blue-600" /> Расчет расходов
            </h2>

            {/* Инструменты настройки */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6 space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-blue-900">Указ №140 (Льгота 50%)</label>
                <input 
                  type="checkbox" 
                  checked={isPrivileged} 
                  onChange={e => setIsPrivileged(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-blue-700 font-bold block mb-1">Объем двигателя (см³)</label>
                <input 
                  type="number" 
                  value={volume} 
                  onChange={e => setVolume(Number(e.target.value))}
                  className="w-full border-blue-200 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Смета расходов */}
            {costs && (
              <div className="space-y-4">
                <div className="flex justify-between items-center group">
                  <span className="text-gray-500 text-sm flex items-center gap-1">1. Цена в Корее</span>
                  <span className="font-bold">${costs.carUsd.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Truck size={14}/> 2. Доставка в Минск
                  </span>
                  <span className="font-bold">${costs.shippingUsd.toLocaleString()}</span>
                </div>

                <div className="pt-2 border-t border-dashed">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">3. Таможенная очистка (РБ)</span>
                  <div className="space-y-2 ml-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Пошлина + Сбор</span>
                      <span className="font-medium">${(costs.dutyUsd + costs.customsFeeUsd).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Утильсбор</span>
                      <span className="font-medium">${costs.utilizationUsd}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Декларант</span>
                      <span className="font-medium">${costs.declarantUsd}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">СВХ и ЭПТС</span>
                      <span className="font-medium">${costs.warehouseUsd}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-dashed">
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <ShieldCheck size={14} className="text-green-600"/> 4. Услуги компании
                  </span>
                  <span className="font-bold text-green-700">${costs.companyFeeUsd}</span>
                </div>

                {/* ИТОГО */}
                <div className="mt-8 bg-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium opacity-80">Итого под ключ:</span>
                    <span className="text-3xl font-black">${costs.total.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] opacity-60 text-right uppercase tracking-tighter">
                    С учетом всех расходов до Минска
                  </p>
                </div>
                
                <div className="text-[10px] text-gray-400 text-center space-y-1">
                  <p>Курс НБРБ: USD {rates.USD.toFixed(4)} | EUR {rates.EUR.toFixed(4)}</p>
                  <p>* Расчет является ориентировочным</p>
                </div>

                <a 
                  href={car.url} target="_blank" rel="noreferrer"
                  className="block w-full text-center bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors"
                >
                  Оригинал на Encar
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}