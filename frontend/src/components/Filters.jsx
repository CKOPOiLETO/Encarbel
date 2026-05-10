import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Компонент выпадающего списка с поиском
function DropdownSearch({ label, options, value, onChange, placeholder = 'Выбрать...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Закрытие при клике вне
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Фильтрация опций по поиску
  const filtered = (options || []).filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option === value ? '' : option);
    setSearch('');
    setIsOpen(false);
  };

  const clearValue = () => {
    onChange('');
    setSearch('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="text-sm font-semibold text-gray-600 mb-1 block">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border rounded-lg p-2.5 flex justify-between items-center focus:ring-2 focus:ring-blue-500 outline-none transition-colors cursor-pointer ${
          isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearValue(); }}
              className="text-gray-400 hover:text-red-500 p-0.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64">
          {/* Поле поиска */}
          <div className="p-2 border-b sticky top-0 bg-white rounded-t-lg">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
          </div>
          {/* Список опций */}
          <div className="overflow-y-auto max-h-48 p-1">
            {filtered.length === 0 ? (
              <p className="text-gray-400 text-sm py-2 px-2">Ничего не найдено</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                    value === opt
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
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

// Компонент числового диапазона в dropdown
function RangeDropdown({ label, minVal, maxVal, onChange, placeholderMin = 'От', placeholderMax = 'До' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localMin, setLocalMin] = useState(minVal ?? '');
  const [localMax, setLocalMax] = useState(maxVal ?? '');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Синхронизация с внешними props
  useEffect(() => {
    setLocalMin(minVal ?? '');
    setLocalMax(maxVal ?? '');
  }, [minVal, maxVal]);

  const applyRange = () => {
    onChange({
      min: localMin !== '' ? Number(localMin) : null,
      max: localMax !== '' ? Number(localMax) : null,
    });
    setIsOpen(false);
  };

  const clearRange = () => {
    setLocalMin('');
    setLocalMax('');
    onChange({ min: null, max: null });
    setIsOpen(false);
  };

  const hasValue = localMin !== '' || localMax !== '';

  return (
    <div ref={dropdownRef} className="relative">
      <label className="text-sm font-semibold text-gray-600 mb-1 block">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border rounded-lg p-2.5 flex justify-between items-center focus:ring-2 focus:ring-blue-500 outline-none transition-colors cursor-pointer ${
          isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className={hasValue ? 'text-gray-900' : 'text-gray-400'}>
          {hasValue
            ? `${localMin || '...'} — ${localMax || '...'}`
            : 'Выбрать диапазон'
          }
        </span>
        <div className="flex items-center gap-1">
          {hasValue && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearRange(); }}
              className="text-gray-400 hover:text-red-500 p-0.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="number"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              placeholder={placeholderMin}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="text-gray-400 shrink-0">—</span>
            <input
              type="number"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              placeholder={placeholderMax}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyRange}
              className="flex-1 bg-blue-600 text-white rounded-md p-2 text-sm hover:bg-blue-700 transition-colors"
            >
              Применить
            </button>
            <button
              onClick={clearRange}
              className="flex-1 border border-gray-300 text-gray-700 rounded-md p-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Сбросить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Filters({ filters, setFilters }) {
  const [options, setOptions] = useState({
    manufacturers: [],
    modelsMap: {},
    models: [],
    fuels: [],
    generations: [],
    types: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8000/api/filters')
      .then(res => {
        const data = res.data;
        setOptions({
          manufacturers: data.manufacturers || [],
          modelsMap: data.models_map || {},
          models: [],
          fuels: data.fuels || [],
          generations: [],
          types: data.types || []
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("Ошибка загрузки фильтров:", err);
        setLoading(false);
      });
  }, []);

  const handleDropdownChange = (name) => (value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleRangeChange = (name) => (range) => {
    setFilters(prev => ({
      ...prev,
      [name + '_min']: range.min,
      [name + '_max']: range.max,
    }));
  };

  // Обновляем список моделей при выборе марки
  useEffect(() => {
    if (filters.manufacturer && options.modelsMap) {
      const models = options.modelsMap[filters.manufacturer] || [];
      setOptions(prev => ({ ...prev, models }));
    } else {
      setOptions(prev => ({ ...prev, models: [] }));
    }
    // Сбрасываем выбранные модель, поколение и тип при изменении марки
    setFilters(prev => ({
      ...prev,
      model: '',
      generation: '',
      type: ''
    }));
  }, [filters.manufacturer]);

  // Обновляем список поколений при выборе модели
  useEffect(() => {
    if (filters.model) {
      // Простейший парсер: извлекаем часть строки с "Generation"
      const genMatch = filters.model.match(/(\d+\w*\s+Generation)/i);
      const generation = genMatch ? genMatch[0] : '';
      setOptions(prev => ({ ...prev, generations: generation ? [generation] : [] }));
    } else {
      setOptions(prev => ({ ...prev, generations: [] }));
    }
    // Сбрасываем выбранное поколение при смене модели
    setFilters(prev => ({ ...prev, generation: '' }));
  }, [filters.model]);

  const handleReset = () => {
  setFilters({});
};

if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center min-h-[200px]">
        <p className="text-gray-400">Загрузка фильтров...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 sticky top-24">
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="font-bold text-xl text-gray-800">Фильтры</h2>
        <button onClick={handleReset} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          Сбросить
        </button>
      </div>

      <div className="space-y-4">
        {/* Марка */}
        <DropdownSearch
          label="Марка"
          options={options.manufacturers}
          value={filters.manufacturer || ''}
          onChange={handleDropdownChange('manufacturer')}
          placeholder="Все марки"
        />

        {/* Модель */}
        <DropdownSearch
          label="Модель"
          options={options.models}
          value={filters.model || ''}
          onChange={handleDropdownChange('model')}
          placeholder="Все модели"
        />

        {/* Поколение */}
        <DropdownSearch
          label="Поколение"
          options={options.generations || []}
          value={filters.generation || ''}
          onChange={handleDropdownChange('generation')}
          placeholder="Все поколения"
        />

        {/* Тип */}
        <DropdownSearch
          label="Тип"
          options={options.types || []}
          value={filters.type || ''}
          onChange={handleDropdownChange('type')}
          placeholder="Все типы"
        />

        {/* Год выпуска */}
        <RangeDropdown
          label="Год выпуска"
          minVal={filters.year_min ? Number(filters.year_min) : null}
          maxVal={filters.year_max ? Number(filters.year_max) : null}
          onChange={handleRangeChange('year')}
          placeholderMin="От"
          placeholderMax="До"
        />

        {/* Цена */}
        <RangeDropdown
          label="Цена (₩)"
          minVal={filters.price_min ? Number(filters.price_min) : null}
          maxVal={filters.price_max ? Number(filters.price_max) : null}
          onChange={handleRangeChange('price')}
          placeholderMin="От"
          placeholderMax="До"
        />

        {/* Пробег */}
        <RangeDropdown
          label="Пробег (км)"
          minVal={filters.mileage_min ? Number(filters.mileage_min) : null}
          maxVal={filters.mileage_max ? Number(filters.mileage_max) : null}
          onChange={handleRangeChange('mileage')}
          placeholderMin="От"
          placeholderMax="До"
        />

        {/* Тип топлива */}
        <DropdownSearch
          label="Тип топлива"
          options={options.fuels}
          value={filters.fuel || ''}
          onChange={handleDropdownChange('fuel')}
          placeholder="Любое топливо"
        />
      </div>
    </div>
  );
}