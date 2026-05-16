import { useState, useEffect } from 'react';
import axios from 'axios';
import { CarCalculator } from '../utils/calculator';

export default function CalculatorPage() {
  const [rates, setRates] = useState(null);
  const [params, setParams] = useState({
    priceEur: 12000,
    engineVolume: 1600,
    engineType: 'fuel', // 'fuel' или 'electric'
    ageCategory: 'medium', // 'new', 'medium', 'old'
    personType: 'physical', // 'physical' или 'legal'
    isPrivileged: true
  });
  const [result, setResult] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8000/api/rates').then(res => setRates(res.data));
  }, []);

  useEffect(() => {
    const calc = new CarCalculator();
    // Считаем таможню
    const output = calc.calculate({ 
      ...params, 
      priceEur: Number(params.priceEur), 
      engineVolumeCm3: Number(params.engineVolume) 
    });
    
    if (rates) {
      // Переводим всё в BYN для итоговой суммы
      const carPriceByn = params.priceEur * rates.EUR;
      const totalDutyByn = output.totalEur * rates.EUR;
      
      output.totalByn = Math.round(carPriceByn + totalDutyByn);
      output.carPriceByn = Math.round(carPriceByn);
    }
    
    setResult(output);
  }, [params, rates]);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border p-8 my-10">
      <h1 className="text-2xl font-bold mb-8 text-gray-800">Калькулятор растаможки (РБ)</h1>
      
      <div className="space-y-6">
        {/* Тип лица */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">Тип лица</label>
          <select 
            value={params.personType} 
            onChange={e => setParams({...params, personType: e.target.value})}
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-no-repeat bg-right"
            style={{backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23cbd5e1%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%276 9 12 15 18 9%27%3E%3C/polyline%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center'}}
          >
            <option value="physical">Физическое лицо</option>
            <option value="legal">Юридическое лицо</option>
          </select>
        </div>

        {/* Тип двигателя */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">Тип двигателя</label>
          <select 
            value={params.engineType} 
            onChange={e => setParams({...params, engineType: e.target.value})}
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="fuel">ДВС (Бензин/Дизель)</option>
            <option value="electric">Электромобиль</option>
          </select>
        </div>

        {/* Возраст */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">Возраст автомобиля</label>
          <select 
            value={params.ageCategory} 
            onChange={e => setParams({...params, ageCategory: e.target.value})}
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="new">До 3-х лет</option>
            <option value="medium">От 3-х до 5 лет</option>
            <option value="old">Более 5 лет</option>
          </select>
        </div>

        {/* Стоимость в Евро */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">Стоимость (€)</label>
          <input 
            type="number" 
            value={params.priceEur} 
            onChange={e => setParams({...params, priceEur: e.target.value})} 
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Объем двигателя */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">Объем двигателя (см³)</label>
          <input 
            type="number" 
            value={params.engineVolume} 
            onChange={e => setParams({...params, engineVolume: e.target.value})} 
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Льгота 140 */}
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={params.isPrivileged} 
            onChange={e => setParams({...params, isPrivileged: e.target.checked})} 
            id="priv" 
            className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
          />
          <label htmlFor="priv" className="text-gray-700 cursor-pointer select-none">Льгота (Указ №140)</label>
        </div>

        {/* Блок результата */}
        {result && (
          <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Таможенные платежи:</span>
              <span className="text-xl font-bold">{result.totalEur.toLocaleString()} €</span>
            </div>
            {/* {rates && (
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-gray-800 font-medium">Итого с авто:</span>
                <span className="text-2xl font-extrabold text-blue-600">
                  {result.totalByn?.toLocaleString()} BYN
                </span>
              </div>
            )} */}
            <p className="text-[11px] text-gray-400 mt-4 text-center">
              Курс НБРБ: 1 € = {rates?.EUR?.toFixed(4)} BYN. Расчет носит справочный характер.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}