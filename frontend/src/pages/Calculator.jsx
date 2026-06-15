import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BelarusCustomsCalculator } from '../utils/calculator';

export default function CalculatorPage() {
    const [rates, setRates] = useState(null);
    const calculator = useMemo(() => new BelarusCustomsCalculator(), []);

    // Константы услуг в BYN
    const DECLARANT_BYN = 300;
    const SVH_BYN = 400;

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

    // 1. Считаем базовые значения (Пошлина, Утиль, Сбор) через класс
    const result = useMemo(() => calculator.calculate(formData), [formData, calculator]);

    // 2. Считаем ИТОГО (только если курсы загрузились)
    const totals = useMemo(() => {
        if (!rates) return null;
        
        // Пошлина и сбор считаются в Евро
        const dutyEur = result.customsDuty + result.customsFee;
        const dutyByn = dutyEur * rates.EUR;
        
        // Утиль, СВХ и Декларант в BYN
        const feesByn = result.utilizationFee + DECLARANT_BYN + SVH_BYN;

        const totalByn = Math.round(dutyByn + feesByn);
        const totalUsd = Math.round(totalByn / rates.USD);

        return { totalByn, totalUsd };
    }, [result, rates]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 mb-20">
            {/* НОВЫЕ ЗАГОЛОВКИ */}
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Таможенный калькулятор</h1>
            <p className="text-gray-500 mb-8 font-medium">Расчёт всех таможенных пошлин и комиссий для автомобилей, ввезённых в Беларусь</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                
                {/* ЛЕВАЯ КОЛОНКА (Форма) */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Тип лица</label>
                        <select name="personType" value={formData.personType} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500">
                            <option value="physical">Физическое лицо</option>
                            <option value="legal">Юридическое лицо</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Тип двигателя</label>
                        <select name="engineType" value={formData.engineType} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500">
                            <option value="fuel">ДВС (Бензин/Дизель)</option>
                            <option value="electric">Электромобиль</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Возраст автомобиля</label>
                        <select name="ageCategory" value={formData.ageCategory} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500">
                            <option value="new">До 3-х лет</option>
                            <option value="medium">От 3-х до 5 лет</option>
                            <option value="old">Более 5 лет</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Стоимость авто по инвойсу (€)</label>
                        <input type="number" min="0" name="priceEur" value={formData.priceEur} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500" />
                    </div>

                    {formData.engineType !== 'electric' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Объем двигателя (см³)</label>
                            <input type="number" min="0" name="engineVolumeCm3" value={formData.engineVolumeCm3} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500" placeholder="Например: 1600" />
                        </div>
                    )}

                    {formData.personType === 'physical' && (
                        <div className="flex items-center gap-3 pt-2">
                            <input type="checkbox" id="u140" name="isPrivileged" checked={formData.isPrivileged} onChange={handleChange} className="w-5 h-5 accent-red-600 rounded cursor-pointer" />
                            <label htmlFor="u140" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Льгота (Указ №140)</label>
                        </div>
                    )}
                </div>

                {/* ПРАВАЯ КОЛОНКА (Смета) */}
                <div>
                    <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl sticky top-24">
                        <h2 className="text-xl font-bold text-gray-400 mb-4 uppercase tracking-wider text-center">Итого таможня и сборы:</h2>
                        
                        {rates && totals ? (
                            <>
                                <div className="text-center mb-8">
                                    <div className="text-5xl font-black mb-2">{totals.totalByn.toLocaleString('ru-RU')} BYN</div>
                                    <div className="text-xl font-medium text-gray-400">≈ {totals.totalUsd.toLocaleString('ru-RU')} $</div>
                                </div>
                                
                                <div className="space-y-4 text-sm font-medium">
                                    <div className="flex justify-between border-b border-gray-700 pb-3">
                                        <span className="text-gray-400">Таможенная пошлина:</span>
                                        <span className="font-bold">{result.customsDuty.toLocaleString('ru-RU')} €</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-700 pb-3">
                                        <span className="text-gray-400">Таможенный сбор:</span>
                                        <span className="font-bold">{result.customsFee} €</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-700 pb-3">
                                        <span className="text-gray-400">Утильсбор:</span>
                                        <span className="font-bold">{result.utilizationFee} BYN</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-700 pb-3">
                                        <span className="text-gray-400">Услуги декларанта:</span>
                                        <span className="font-bold">≈ {DECLARANT_BYN} BYN</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-700 pb-3">
                                        <span className="text-gray-400">СВХ и ЭПТС:</span>
                                        <span className="font-bold">≈ {SVH_BYN} BYN</span>
                                    </div>
                                </div>

                                {formData.isPrivileged && formData.personType === 'physical' && (
                                    <div className="mt-6 bg-red-600/20 text-red-400 p-3 rounded-lg text-center text-sm font-bold uppercase tracking-wider border border-red-500/30">
                                        Скидка 50% применена
                                    </div>
                                )}
                                {formData.engineType === 'electric' && formData.personType === 'physical' && (
                                    <div className="mt-6 bg-green-600/20 text-green-400 p-3 rounded-lg text-center text-sm font-bold uppercase tracking-wider border border-green-500/30">
                                        Пошлина 0% (Электромобиль)
                                    </div>
                                )}
                                
                                <div className="mt-6 text-[10px] text-gray-500 text-center uppercase tracking-widest">
                                    Курс: 1 EUR = {rates.EUR.toFixed(4)} BYN | 1 USD = {rates.USD.toFixed(4)} BYN
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mb-4"></div>
                                <span className="text-gray-500">Загрузка курсов НБРБ...</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}