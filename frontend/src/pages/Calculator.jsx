import React, { useState, useMemo } from 'react';
import { BelarusCustomsCalculator } from '../utils/calculator';

export default function CalculatorPage() {
    const calculator = useMemo(() => new BelarusCustomsCalculator(), []);

    const [formData, setFormData] = useState({
        priceEur: 12000,
        ageCategory: 'medium',
        engineVolumeCm3: 1600,
        engineType: 'fuel',
        isPrivileged: false,
        personType: 'physical',
    });

    const result = useMemo(() => calculator.calculate(formData), [formData, calculator]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Калькулятор растаможки РБ</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Форма */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Тип лица</label>
                        <select name="personType" value={formData.personType} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="physical">Физическое лицо</option>
                            <option value="legal">Юридическое лицо</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Тип двигателя</label>
                        <select name="engineType" value={formData.engineType} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="fuel">ДВС (Бензин/Дизель)</option>
                            <option value="electric">Электромобиль</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Возраст автомобиля</label>
                        <select name="ageCategory" value={formData.ageCategory} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="new">До 3-х лет</option>
                            <option value="medium">От 3-х до 5 лет</option>
                            <option value="old">Более 5 лет</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Стоимость (€)</label>
                        <input type="number" name="priceEur" value={formData.priceEur} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    {formData.engineType !== 'electric' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Объем двигателя (см³)</label>
                            <input type="number" name="engineVolumeCm3" value={formData.engineVolumeCm3} onChange={handleChange} className="w-full border-gray-300 border rounded-xl p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    )}

                    {formData.personType === 'physical' && (
                        <div className="flex items-center gap-3 pt-2">
                            <input type="checkbox" id="u140" name="isPrivileged" checked={formData.isPrivileged} onChange={handleChange} className="w-5 h-5 accent-blue-600 rounded cursor-pointer" />
                            <label htmlFor="u140" className="text-sm font-bold text-gray-700 cursor-pointer">Льгота (Указ №140)</label>
                        </div>
                    )}
                </div>

                {/* Результат */}
                <div>
                    <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl sticky top-24">
                        <h2 className="text-xl font-medium text-gray-400 mb-2">Итого таможня:</h2>
                        <div className="text-5xl font-black mb-8">{result.totalEur.toLocaleString()} € <span className="text-lg text-gray-400">+ {result.utilizationFee} BYN</span></div>

                        <div className="space-y-4 text-sm font-medium">
                            <div className="flex justify-between border-b border-gray-700 pb-3">
                                <span className="text-gray-400">Пошлина:</span>
                                <span>{result.customsDuty.toLocaleString()} €</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700 pb-3">
                                <span className="text-gray-400">Утильсбор:</span>
                                <span>{result.utilizationFee} BYN</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700 pb-3">
                                <span className="text-gray-400">Таможенный сбор:</span>
                                <span>{result.customsFee} €</span>
                            </div>
                        </div>

                        {formData.isPrivileged && formData.personType === 'physical' && (
                            <div className="mt-6 bg-blue-600/20 text-blue-400 p-3 rounded-lg text-center text-sm font-bold uppercase tracking-wider">
                                Скидка 50% применена
                            </div>
                        )}
                        {formData.engineType === 'electric' && formData.personType === 'physical' && (
                            <div className="mt-6 bg-green-600/20 text-green-400 p-3 rounded-lg text-center text-sm font-bold uppercase tracking-wider">
                                Пошлина 0% (Электромобиль)
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}