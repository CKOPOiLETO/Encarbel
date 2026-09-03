import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import CarCard from '../components/CarCard';
import Filters from '../components/Filters';
import BottomMarketSlider from '../components/BottomMarketSlider';
import { Filter } from 'lucide-react';

const LIMIT = 30;

// --- ГЛОБАЛЬНЫЙ КЭШ ДЛЯ СОХРАНЕНИЯ СОСТОЯНИЯ КАТАЛОГА ---
let historyCache = {
  cars: [],
  offset: 0,
  hasMore: true,
  scrollY: 0,
  searchInput: '',
  totalCount: 0
};

export default function History() {
  // Инициализируем стейты из кэша (если они там есть)
  const [cars, setCars] = useState(historyCache.cars);
  const [offset, setOffset] = useState(historyCache.offset);
  const [hasMore, setHasMore] = useState(historyCache.hasMore);
  const [totalCount, setTotalCount] = useState(historyCache.totalCount || 0);
  const [searchInput, setSearchInput] = useState(() => {
    return historyCache.searchInput || JSON.parse(sessionStorage.getItem('encar_history_filters') || '{}').search || '';
  });
  
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Восстанавливаем фильтры из sessionStorage
  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem('encar_history_filters');
    return saved ? JSON.parse(saved) : {};
  });

  // Флаг: были ли данные восстановлены при монтировании
  const isFirstRender = useRef(true);
  const isFirstFetch = useRef(true);

  // Ссылка на "маяк" внизу списка для бесконечного скролла
  const observer = useRef();
  
  const lastCarElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setOffset(prevOffset => prevOffset + LIMIT);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Загрузка курсов НБРБ
  useEffect(() => {
    axios.get('/rates')
      .then(res => setRates(res.data))
      .catch(err => console.error("Ошибка курсов:", err));
  }, []);

  // Дебаунс для поиска
  useEffect(() => {
    // Если то, что в инпуте, совпадает с тем, что уже в фильтрах — ничего не делаем
    if (searchInput === (filters.search || '')) {
      return;
    }

    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput || null }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Сохраняем фильтры в сессию при каждом изменении
  useEffect(() => {
    sessionStorage.setItem('encar_filters', JSON.stringify(filters));
  }, [filters]);

  // Сброс при ручном изменении фильтров
  useEffect(() => {
    // Пропускаем самый первый запуск эффекта при монтировании,
    // чтобы он не стер наш восстановленный из кэша список авто!
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setCars([]);
    setTotalCount(0);
    setOffset(0);
    setHasMore(true);
    
    // Сбрасываем глобальный кэш, так как пользователь сам поменял фильтр
    historyCache.cars = [];
    historyCache.totalCount = 0;
    historyCache.offset = 0;
    historyCache.hasMore = true;
    historyCache.scrollY = 0;
  }, [filters]);

  // Основная загрузка данных
  useEffect(() => {
    // Если мы только что смонтировали страницу и восстановили данные из кэша,
    // пропускаем первый запрос, чтобы не качать дубликаты и не сбрасывать скролл
    if (isFirstFetch.current) {
      isFirstFetch.current = false;
      if (cars.length > 0) return;
    }

    const fetchCars = async () => {
      setLoading(true);
      try {
        const apiParams = { ...filters, limit: LIMIT, offset: offset };
        const { data } = await axios.get('/history', { params: apiParams });

        setTotalCount(data.total); // Сохраняем общую цифру с бэкенда

        setCars(prev => {
          if (offset === 0) return data.items; // Берем .items
          const newUniqueCars = data.items.filter(newCar => !prev.some(existingCar => existingCar.car_id === newCar.car_id));
          return [...prev, ...newUniqueCars];
        });

        setHasMore(data.items.length === LIMIT);
      } catch (error) {
        console.error("Ошибка загрузки:", error);
      }
      setLoading(false);
    };

    fetchCars();
  }, [filters, offset]);

  // Сохраняем состояние каталога в кэш при размонтировании (когда уходим на другую страницу)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        historyCache.scrollY = window.scrollY;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Сохраняем состояние каталога в кэш при размонтировании (уже без scrollY)
  useEffect(() => {
    return () => {
      historyCache.cars = cars;
      historyCache.offset = offset;
      historyCache.hasMore = hasMore;
      historyCache.searchInput = searchInput;
    };
  }, [cars, offset, hasMore, searchInput]);

  // Восстанавливаем позицию скролла после монтирования
  useEffect(() => {
    if (historyCache.cars.length > 0 && historyCache.scrollY > 0) {
      const targetY = historyCache.scrollY;
      let attempts = 0;

      const scrollInterval = setInterval(() => {
        window.scrollTo(0, targetY);
        attempts++;

        // Проверяем, удалось ли доскроллить до цели (с погрешностью в 15px)
        const currentScroll = window.scrollY;
        const reachedTarget = Math.abs(currentScroll - targetY) < 15;

        // Останавливаем интервал, если:
        // 1. Мы успешно доскроллили до нужного места
        // 2. Или прошло уже 15 попыток (1.5 секунды) — защита от бесконечного цикла, если страница почему-то не смогла стать длиннее
        if (reachedTarget || attempts > 15) {
          clearInterval(scrollInterval);
        }
      }, 100); // Проверяем каждые 100мс

      return () => clearInterval(scrollInterval);
    }
  }, []);

  // Фоновое автообновление каталога каждые 10 секунд (только для первой страницы)
  // useEffect(() => {
  //   if (offset !== 0) return;

  //   const interval = setInterval(async () => {
  //     try {
  //       const { data } = await axios.get('/cars', { 
  //         params: { ...filters, limit: LIMIT, offset: 0 } 
  //       });
        
  //       setCars(prev => {
  //         if (prev.length > 0 && data.length > 0 && prev[0].car_id !== data[0].car_id) {
  //           return data;
  //         }
  //         return prev;
  //       });
  //     } catch (error) {
  //       console.error("Ошибка фонового обновления:", error);
  //     }
  //   }, 10000);

  //   return () => clearInterval(interval);
  // }, [filters, offset]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* КНОПКА МОБИЛЬНЫХ ФИЛЬТРОВ И СЧЕТЧИК (Для мобилок) */}
      <div className="lg:hidden w-full flex gap-3">
        <button 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex-grow bg-white border border-gray-200 rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 font-bold text-gray-800 shadow-sm active:bg-gray-50 transition-colors"
        >
          <Filter size={18} className="text-red-600" />
          {showMobileFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
        </button>
        <div className="bg-red-50 text-red-600 font-black text-sm px-5 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm shrink-0">
          {totalCount.toLocaleString('ru-RU')}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <aside className={`w-full lg:w-1/4 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
          <Filters filters={filters} setFilters={setFilters} isHistory={true} />
        </aside>

        <section className="w-full lg:w-3/4">
          {/* Шапка каталога */}
          <div className="bg-white lg:p-4 rounded-2xl lg:shadow-sm lg:border lg:border-gray-100 flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
            
            {/* Заголовок + СЧЕТЧИК (Для ПК) */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Каталог</h1>
              {totalCount > 0 && (
                <span className="bg-red-50 text-red-600 text-xs px-2.5 py-1 rounded-lg font-bold tracking-wider border border-red-100">
                  {totalCount.toLocaleString('ru-RU')} авто
                </span>
              )}
            </div>
            
            <div className="w-full flex flex-col md:flex-row gap-3 p-4 lg:p-0 border border-gray-200 lg:border-0 rounded-2xl bg-gray-50/50 lg:bg-transparent items-center">
              
              {/* ПОИСК С КРЕСТИКОМ */}
              <div className="w-full md:flex-grow relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Быстрый поиск (название, VIN, ID или ссылка)..."
                  className="w-full border-gray-300 border rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-red-600 outline-none text-sm transition-shadow bg-white"
                />
                
                {/* Крестик для быстрой очистки (появляется только если есть текст) */}
                {searchInput && (
                  <button 
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-1"
                    title="Очистить поиск"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
              
              <select
                value={filters.sort || 'newest'}
                aria-label="Сортировка списка автомобилей"
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                className="w-full md:w-auto border-gray-300 border rounded-lg p-2.5 focus:ring-2 focus:ring-red-600 outline-none text-sm font-medium bg-white cursor-pointer"
              >
                <option value="newest">Новые поступления</option>
                <option value="price_asc">Цена ↑</option>
                <option value="price_desc">Цена ↓</option>
                <option value="mileage_asc">Пробег ↑</option>
                <option value="mileage_desc">Пробег ↓</option>
                <option value="year_desc">Год выпуска ↓</option>
                <option value="year_asc">Год выпуска ↑</option>
              </select>
            </div>
          </div>

          {/* СЛАЙДЕР ПРЕМИУМ СЕГМЕНТА (скрывается, если пользователь использует поиск) */}
          {/* {!searchInput && (
             <BottomMarketSlider filters={filters} rates={rates} />
          )} */}

          {/* Сетка автомобилей */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cars.map((car, index) => {
              if (cars.length === index + 1) {
                return (
                  <div ref={lastCarElementRef} key={car.car_id}>
                    <CarCard car={car} rates={rates} isHistory={true} />
                  </div>
                );
              } else {
                return <CarCard key={car.car_id} car={car} rates={rates} isHistory={true} />;

              }
            })}
          </div>

          {/* Индикаторы */}
          {loading && (
            <div className="flex justify-center py-10">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="text-sm text-gray-500 font-medium">Загружаем ещё...</span>
              </div>
            </div>
          )}

          {!loading && cars.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-lg">По вашему запросу ничего не найдено.</p>
              <button 
                onClick={() => { setFilters({}); setSearchInput(''); }} 
                className="mt-4 text-red-600 font-bold hover:underline"
              >
                Сбросить поиск
              </button>
            </div>
          )}

          {!hasMore && cars.length > 0 && (
            <p className="text-center text-gray-400 py-10 font-medium">
              Вы посмотрели все доступные предложения
            </p>
          )}
        </section>
      </div>
    </div>
  );
}