import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// --- Вспомогательный компонент: Выпадающий список с поиском (ДЛЯ СТРОК) ---
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

  const isObj = options.length > 0 && typeof options[0] === 'object';
  const getLabel = (opt) => isObj ? opt.label : opt;
  const getValue = (opt) => isObj ? opt.value : opt;

  const filtered = options.filter(opt => getLabel(opt).toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (option) => {
    const val = getValue(option);
    onChange(val === value ? '' : val);
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation(); 
    onChange('');
    setSearch('');
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => getValue(opt) === value);
  const displayValue = selectedOption ? getLabel(selectedOption) : value;

  return (
    <div ref={dropdownRef} className={`relative ${disabled ? 'opacity-50' : ''}`}>
      <label className="text-sm font-semibold text-gray-600 mb-2 block">{label}</label>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full border rounded-lg p-2.5 flex justify-between items-center transition-colors cursor-pointer ${
          isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
      >
        <span className={`truncate mr-2 ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {displayValue || placeholder}
        </span>
        
        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <button type="button" onClick={handleClear} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b bg-white">
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto p-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <p className="text-gray-400 text-sm py-2 px-2">Ничего не найдено</p>
            ) : (
              filtered.map((opt, i) => {
                const val = getValue(opt);
                const lab = getLabel(opt);
                return (
                  <button
                    key={val} type="button" onClick={() => handleSelect(opt)}
                    className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                      value === val ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {lab}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- НОВЫЙ КОМПОНЕНТ: Открытый диапазон (ДЛЯ ЧИСЕЛ) ---
function RangeInput({ label, minVal, maxVal, onChange, placeholderMin = 'От', placeholderMax = 'До' }) {
  const [localMin, setLocalMin] = useState(minVal ?? '');
  const [localMax, setLocalMax] = useState(maxVal ?? '');

  // Синхронизация с внешними фильтрами
  useEffect(() => {
    setLocalMin(minVal ?? '');
    setLocalMax(maxVal ?? '');
  }, [minVal, maxVal]);

  const applyRange = () => {
    onChange({ min: localMin !== '' ? Number(localMin) : null, max: localMax !== '' ? Number(localMax) : null });
  };

  const handleClear = () => {
    setLocalMin('');
    setLocalMax('');
    onChange({ min: null, max: null });
  };

  const preventInvalidChars = (e) => {
    if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
  };

  const handleMinChange = (e) => {
    const val = e.target.value;
    if (val === '' || Number(val) >= 0) setLocalMin(val);
  };

  const handleMaxChange = (e) => {
    const val = e.target.value;
    if (val === '' || Number(val) >= 0) setLocalMax(val);
  };

  const hasValue = localMin !== '' || localMax !== '';

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-semibold text-gray-600 block">{label}</label>
        {hasValue && (
          <button type="button" onClick={handleClear} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Сбросить">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Рамка вокруг инпутов и кнопки, как на скриншоте */}
      <div className="flex flex-col gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50/50">
        <div className="flex items-center gap-2">
          <input 
            type="number" min="0" value={localMin} onChange={handleMinChange} onKeyDown={preventInvalidChars}
            placeholder={placeholderMin} 
            className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
          />
          <span className="text-gray-400 font-bold">—</span>
          <input 
            type="number" min="0" value={localMax} onChange={handleMaxChange} onKeyDown={preventInvalidChars}
            placeholder={placeholderMax} 
            className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
          />
        </div>
        <button 
          onClick={applyRange} 
          className="w-full bg-blue-600 text-white rounded-lg p-2.5 text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
          Применить
        </button>
      </div>
    </div>
  );
}

// --- ОСНОВНОЙ КОМПОНЕНТ ФИЛЬТРОВ ---
export default function Filters({ filters, setFilters }) {
  const [options, setOptions] = useState({ manufacturers: [], hierarchy: {}, fuels: [], body_types: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/filters')
      .then(res => { setOptions(res.data); setLoading(false); })
      .catch(err => { console.error("Ошибка загрузки фильтров:", err); setLoading(false); });
  }, []);

  const availableGroups = (filters.manufacturer && options.hierarchy) 
    ? Object.keys(options.hierarchy[filters.manufacturer] || {}) 
    : [];

  const availableSpecificModels = (filters.manufacturer && filters.model_group && options.hierarchy)
    ? (options.hierarchy[filters.manufacturer]?.[filters.model_group] || [])
    : [];

  const handleDropdownChange = (name) => (value) => {
    setFilters(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'manufacturer') { next['model_group'] = ''; next['model'] = ''; }
      if (name === 'model_group') { next['model'] = ''; }
      return next;
    });
  };

  const handleRangeChange = (name) => (range) => {
    setFilters(prev => ({ ...prev, [name + '_min']: range.min, [name + '_max']: range.max }));
  };

  if (loading) return <div className="p-5 text-center text-gray-400">Загрузка фильтров...</div>;

  return (
    // ВАЖНО: Убрали sticky, max-h и overflow-y-auto. Теперь это обычный блок.
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
      
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <h2 className="font-black text-xl text-gray-900 uppercase tracking-tight">Подбор авто</h2>
        <button onClick={() => setFilters({})} className="text-xs text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider transition-colors">
          Сбросить всё
        </button>
      </div>

      <div className="space-y-6">
        {/* Выпадающие списки */}
        <div className="space-y-4">
          <DropdownSearch label="Марка" options={options.manufacturers} value={filters.manufacturer || ''} onChange={handleDropdownChange('manufacturer')} placeholder="Все марки" />
          <DropdownSearch label="Модель" options={availableGroups} value={filters.model_group || ''} onChange={handleDropdownChange('model_group')} placeholder={filters.manufacturer ? "Все модели" : "Сначала выберите марку"} disabled={!filters.manufacturer} />
          <DropdownSearch label="Поколение / Версия" options={availableSpecificModels} value={filters.model || ''} onChange={handleDropdownChange('model')} placeholder={filters.model_group ? "Все поколения" : "Выберите модель"} disabled={!filters.model_group} />
          <DropdownSearch label="Тип кузова" options={options.body_types} value={filters.body_type || ''} onChange={handleDropdownChange('body_type')} placeholder="Любой кузов" />
        </div>
        
        <hr className="my-2 border-gray-100" />
        
        {/* ОТКРЫТЫЕ ИНПУТЫ (RangeInput вместо RangeDropdown) */}
        <div className="space-y-6">
          <RangeInput label="Год выпуска" minVal={filters.year_min} maxVal={filters.year_max} onChange={handleRangeChange('year')} placeholderMin="2018" placeholderMax="2024" />
          <RangeInput 
          label="Цена под ключ ($)" 
          minVal={filters.price_min} 
          maxVal={filters.price_max} 
          onChange={handleRangeChange('price')} 
          placeholderMin="15000" 
          placeholderMax="35000" 
        />          
        <RangeInput label="Пробег (км)" minVal={filters.mileage_min} maxVal={filters.mileage_max} onChange={handleRangeChange('mileage')} placeholderMin="10000" placeholderMax="150000" />
        <RangeInput label="Объем двигателя (см³)" minVal={filters.displacement_min} maxVal={filters.displacement_max} onChange={handleRangeChange('displacement')} placeholderMin="1600" placeholderMax="3000" />
        </div>

        <DropdownSearch label="Тип топлива" options={options.fuels} value={filters.fuel || ''} onChange={handleDropdownChange('fuel')} placeholder="Любое топливо" />

        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl mt-4">
          <input 
            type="checkbox" 
            id="hide_lease"
            checked={filters.hide_lease || false}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              hide_lease: e.target.checked || undefined 
            }))}
            className="w-5 h-5 accent-orange-500 cursor-pointer rounded"
          />
          <label htmlFor="hide_lease" className="text-sm font-bold text-orange-800 cursor-pointer select-none">
            Скрыть авто в лизинг
          </label>
        </div>

      </div>
    </div>
  );
}