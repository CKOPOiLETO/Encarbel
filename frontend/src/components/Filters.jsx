  import { useState, useEffect, useRef } from 'react';
  import axios from 'axios';

  // --- Вспомогательный компонент: Выпадающий список с поиском ---
  function DropdownSearch({ label, options = [], value, onChange, placeholder = 'Выбрать...', disabled = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
      function handleClickOutside(e) {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

    const handleSelect = (option) => {
      onChange(option === value ? '' : option);
      setSearch('');
      setIsOpen(false);
    };

    return (
      <div ref={dropdownRef} className={`relative ${disabled ? 'opacity-50' : ''}`}>
        <label className="text-sm font-semibold text-gray-600 mb-1 block">{label}</label>
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full border rounded-lg p-2.5 flex justify-between items-center transition-colors cursor-pointer ${
            isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || placeholder}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
            <div className="p-2 border-b bg-white">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="text-gray-400 text-sm py-2 px-2">Ничего не найдено</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                      value === opt ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Вспомогательный компонент: Диапазон (От/До) ---
  function RangeDropdown({ label, minVal, maxVal, onChange, placeholderMin = 'От', placeholderMax = 'До' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [localMin, setLocalMin] = useState(minVal ?? '');
    const [localMax, setLocalMax] = useState(maxVal ?? '');
    const dropdownRef = useRef(null);

    useEffect(() => {
      function handleClickOutside(e) {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      setLocalMin(minVal ?? '');
      setLocalMax(maxVal ?? '');
    }, [minVal, maxVal]);

    const applyRange = () => {
      onChange({ min: localMin !== '' ? Number(localMin) : null, max: localMax !== '' ? Number(localMax) : null });
      setIsOpen(false);
    };

    const hasValue = localMin !== '' || localMax !== '';

    return (
      <div ref={dropdownRef} className="relative">
        <label className="text-sm font-semibold text-gray-600 mb-1 block">{label}</label>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full border rounded-lg p-2.5 flex justify-between items-center transition-colors cursor-pointer bg-white ${
            isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <span className={hasValue ? 'text-gray-900' : 'text-gray-400'}>
            {hasValue ? `${localMin || '0'} — ${localMax || '∞'}` : 'Выбрать диапазон'}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <input type="number" value={localMin} onChange={(e) => setLocalMin(e.target.value)} placeholder={placeholderMin} className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none" />
              <span className="text-gray-400">—</span>
              <input type="number" value={localMax} onChange={(e) => setLocalMax(e.target.value)} placeholder={placeholderMax} className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none" />
            </div>
            <button onClick={applyRange} className="w-full bg-blue-600 text-white rounded-md p-2 text-sm font-bold hover:bg-blue-700 transition-colors">Применить</button>
          </div>
        )}
      </div>
    );
  }

  // --- ОСНОВНОЙ КОМПОНЕНТ ФИЛЬТРОВ ---
  export default function Filters({ filters, setFilters }) {
    const [options, setOptions] = useState({ manufacturers: [], hierarchy: {}, fuels: [] });
    const [loading, setLoading] = useState(true);
    const [rates, setRates] = useState(null);

    useEffect(() => {
      axios.get('http://localhost:8000/api/filters')
        .then(res => { setOptions(res.data); setLoading(false); });
    }, []);

    useEffect(() => {
      axios.get('http://localhost:8000/api/rates')
        .then(res => setRates(res.data));
    }, []);

    // 1. Вычисляем группы моделей (безопасно)
    const availableGroups = (filters.manufacturer && options.hierarchy)
      ? Object.keys(options.hierarchy[filters.manufacturer] || {})
      : [];

    // 2. Конкретные версии модели (если есть группы)
    const availableSpecificModels = (filters.manufacturer && filters.model_group && options.hierarchy)
      ? (options.hierarchy[filters.manufacturer]?.[filters.model_group] || [])
      : [];



    const handleDropdownChange = (name) => (value) => {
      setFilters(prev => {
        const next = { ...prev, [name]: value };
        // Каскадный сброс
        if (name === 'manufacturer') {
          next['model_group'] = '';
          next['model'] = '';
        }
        if (name === 'model_group') {
          next['model'] = '';
        }
        return next;
      });
    };

    const handleRangeChange = (name) => (range) => {
      setFilters(prev => ({ ...prev, [name + '_min']: range.min, [name + '_max']: range.max }));
    };

    const priceMinBYN = filters.price_min ?? null;
    const priceMaxBYN = filters.price_max ?? null;

    if (loading) return <div className="p-5 text-center text-gray-400">Загрузка фильтров...</div>;

    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 sticky top-24">
        {/* Шапка фильтров */}
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="font-bold text-xl text-gray-800">Подбор авто</h2>
          <button onClick={() => setFilters({})} className="text-xs text-blue-600 hover:underline">Сбросить</button>
        </div>

        <div className="space-y-4">
        <DropdownSearch
            label="Марка"
            options={options.manufacturers}
            value={filters.manufacturer || ''}
            onChange={handleDropdownChange('manufacturer')}
            placeholder="Все марки"
          />

          {/* Уровень 2: Базовая модель (Group) */}
          <DropdownSearch
            label="Модель (группа)"
            options={availableGroups}
            value={filters.model_group || ''}
            onChange={handleDropdownChange('model_group')}
            placeholder={filters.manufacturer ? "Все группы" : "Сначала выберите марку"}
            disabled={!filters.manufacturer}
          />

          {/* Уровень 3: Поколение / Версия (Model) */}
          <DropdownSearch
            label="Поколение / Версия"
            options={availableSpecificModels}
            value={filters.model || ''}
            onChange={handleDropdownChange('model')}
            placeholder={filters.model_group ? "Все модели" : "Выберите группу"}
            disabled={!filters.model_group}
          />


          <hr className="my-2 border-gray-50" />
          <RangeDropdown
            label="Год выпуска"
            minVal={filters.year_min} maxVal={filters.year_max}
            onChange={handleRangeChange('year')}
          />

          <RangeDropdown
            label="Цена (BYN)" // Явно пишем, что ввод в рублях
            minVal={filters.price_min} 
            maxVal={filters.price_max}
            onChange={handleRangeChange('price')}
            placeholderMin="Напр. 45000"
            placeholderMax="Напр. 85000"
          />

          <RangeDropdown
            label="Объем двигателя (см³)"
            minVal={filters.displacement_min} maxVal={filters.displacement_max}
            onChange={handleRangeChange('displacement')}
          />

          <DropdownSearch
            label="Тип топлива"
            options={options.fuels || []}
            value={filters.fuel || ''}
            onChange={handleDropdownChange('fuel')}
            placeholder="Любое топливо"
          />
        </div>
      </div>
    );
  }