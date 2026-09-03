import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BelarusCustomsCalculator } from '../utils/calculator';
import { Info } from 'lucide-react';

export default function CalculatorPage() {
    const [rates, setRates] = useState(null);
    const calculator = useMemo(() => new BelarusCustomsCalculator(), []);

    const DECLARANT_BYN = 300;
    const SVH_BYN = 300;

    const [formData, setFormData] = useState({
        priceEur: 12000,
        ageCategory: 'medium',
        engineVolumeCm3: 1600,
        engineType: 'fuel',
        isPrivileged: false,
        personType: 'physical',
    });

    useEffect(() => {
        axios.get('/rates')
            .then(res => setRates(res.data))
            .catch(err => console.error("Ошибка загрузки курсов:", err));
    }, []);

    const result = useMemo(() => calculator.calculate(formData), [formData, calculator]);

    const totals = useMemo(() => {
        if (!rates) return null;
        
        const dutyEur = result.customsDuty + result.customsFee;
        const dutyByn = dutyEur * rates.EUR;
        const feesByn = result.utilizationFee + DECLARANT_BYN + SVH_BYN;

        const totalByn = Math.round(dutyByn + feesByn);
        const totalUsd = Math.round(totalByn / rates.USD);

        return { totalByn, totalUsd };
    }, [result, rates]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        let finalValue = value;
        if (type === 'number' && value !== '') {
            finalValue = value.replace(/^0+(?=\d)/, '');
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? (finalValue === '' ? '' : Number(finalValue)) : finalValue)
        }));
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 mb-20">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Таможенный калькулятор</h1>
            <p className="text-gray-600 mb-8 font-medium">Расчёт всех таможенных пошлин и комиссий для автомобилей, ввезённых в Беларусь</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                
                {/* ЛЕВАЯ КОЛОНКА (Форма с добавленными id и связаными label) */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div>
                        <label htmlFor="personType-select" className="block text-sm font-bold text-gray-800 mb-2">Тип лица</label>
                        <select id="personType-select" name="personType" value={formData.personType} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-600 text-gray-900 font-medium">
                            <option value="physical">Физическое лицо</option>
                            <option value="legal">Юридическое лицо</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="engineType-select" className="block text-sm font-bold text-gray-800 mb-2">Тип двигателя</label>
                        <select id="engineType-select" name="engineType" value={formData.engineType} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-600 text-gray-900 font-medium">
                            <option value="fuel">ДВС (Бензин/Дизель)</option>
                            <option value="electric">Электромобиль</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="ageCategory-select" className="block text-sm font-bold text-gray-800 mb-2">Возраст автомобиля</label>
                        <select id="ageCategory-select" name="ageCategory" value={formData.ageCategory} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-600 text-gray-900 font-medium">
                            <option value="new">До 3-х лет</option>
                            <option value="medium">От 3-х до 5 лет</option>
                            <option value="old">Более 5 лет</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="priceEur-input" className="block text-sm font-bold text-gray-800 mb-2">Стоимость авто по инвойсу (€)</label>
                        <input id="priceEur-input" type="number" min="0" name="priceEur" value={formData.priceEur} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-600 text-gray-900 font-medium" />
                    </div>

                    {formData.engineType !== 'electric' && (
                        <div>
                            <label htmlFor="engineVolume-input" className="block text-sm font-bold text-gray-800 mb-2">Объем двигателя (см³)</label>
                            <input id="engineVolume-input" type="number" min="0" name="engineVolumeCm3" value={formData.engineVolumeCm3} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-600 text-gray-900 font-medium" placeholder="Например: 1600" />
                        </div>
                    )}

                    {formData.personType === 'physical' && (
                        <div className="flex items-center gap-3 pt-2">
                            <input type="checkbox" id="u140" name="isPrivileged" checked={formData.isPrivileged} onChange={handleChange} className="w-5 h-5 accent-red-600 rounded cursor-pointer" />
                            <label htmlFor="u140" className="text-sm font-bold text-gray-800 cursor-pointer select-none">Льгота (Указ №140)</label>
                        </div>
                    )}
                </div>

                {/* ПРАВАЯ КОЛОНКА (Смета с улучшенным контрастом текста) */}
                <div className="w-full">
                    {formData.personType === 'legal' ? (
                        <div className="bg-white rounded-2xl shadow-xl border-2 border-red-100 p-8 sticky top-24 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Info size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Юридическое лицо</h2>
                            <p className="text-gray-700 mb-6 text-sm leading-relaxed font-medium">
                                Расчёт таможенных пошлин, комиссий и сборов для юридических лиц осуществляется индивидуально.
                            </p>
                            <div className="bg-red-50 text-red-900 p-4 rounded-xl font-bold mb-8 text-sm border border-red-200">
                                Оставьте запрос нашему менеджеру
                            </div>
                            <button 
                                onClick={() => window.dispatchEvent(new CustomEvent('open-lead-modal', { 
                                    detail: { carInfo: 'Запрос на расчет для Юр. Лица' } 
                                }))}
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold uppercase shadow-lg shadow-red-600/30 transition-transform active:scale-[0.98]"
                            >
                                Получить расчет
                            </button>
                        </div>
                    ) : (
                        <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl sticky top-24">
                            <h2 className="text-xl font-bold text-gray-300 mb-4 uppercase tracking-wider text-center">Итого таможня и сборы:</h2>
                            
                            {rates && totals ? (
                                <>
                                    <div className="text-center mb-8">
                                        <div className="text-5xl font-black mb-2 text-white">{totals.totalByn.toLocaleString('ru-RU')} BYN</div>
                                        <div className="text-xl font-semibold text-gray-300">≈ {totals.totalUsd.toLocaleString('ru-RU')} $</div>
                                    </div>
                                    
                                    <div className="space-y-4 text-sm font-semibold">
                                        <div className="flex justify-between border-b border-gray-700 pb-3">
                                            <span className="text-gray-300">Таможенная пошлина:</span>
                                            <span className="font-bold text-white">{result.customsDuty.toLocaleString('ru-RU')} €</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-700 pb-3">
                                            <span className="text-gray-300">Таможенный сбор:</span>
                                            <span className="font-bold text-white">{result.customsFee} €</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-700 pb-3">
                                            <span className="text-gray-300">Утильсбор:</span>
                                            <span className="font-bold text-white">{result.utilizationFee} BYN</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-700 pb-3">
                                            <span className="text-gray-300">Услуги декларанта:</span>
                                            <span className="font-bold text-white">≈ {DECLARANT_BYN} BYN</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-700 pb-3">
                                            <span className="text-gray-300">СВХ и ЭПТС:</span>
                                            <span className="font-bold text-white">≈ {SVH_BYN} BYN</span>
                                        </div>
                                    </div>

                                    {formData.isPrivileged && formData.personType === 'physical' && (
                                        <div className="mt-6 bg-blue-600/30 text-blue-300 p-3 rounded-lg text-center text-sm font-bold uppercase tracking-wider border border-blue-400/40">
                                            Скидка 50% применена
                                        </div>
                                    )}
                                    {formData.engineType === 'electric' && formData.personType === 'physical' && (
                                        <div className="mt-6 bg-green-600/30 text-green-300 p-3 rounded-lg text-center text-sm font-bold uppercase tracking-wider border border-green-400/40">
                                            Пошлина 0% (Электромобиль)
                                        </div>
                                    )}
                                    
                                    <div className="mt-6 text-[11px] text-gray-400 text-center uppercase tracking-widest font-semibold">
                                        Курс: 1 EUR = {rates.EUR.toFixed(4)} BYN | 1 USD = {rates.USD.toFixed(4)} BYN
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mb-4"></div>
                                    <span className="text-gray-300 font-medium">Загрузка курсов НБРБ...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}