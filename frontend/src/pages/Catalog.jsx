import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import CarCard from '../components/CarCard';
import Filters from '../components/Filters';
import BottomMarketSlider from '../components/BottomMarketSlider';
const LIMIT = 30;

export default function Catalog() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem('encar_filters');
    return saved ? JSON.parse(saved) : {};
  });  const [offset, setOffset] = useState(0);
  const[hasMore, setHasMore] = useState(true);
  const [rates, setRates] = useState(null);
  // Добавляем отдельный стейт для поля ввода (чтобы не спамить запросами)
  const [searchInput, setSearchInput] = useState(() => {
    const saved = sessionStorage.getItem('encar_filters');
    return saved ? (JSON.parse(saved).search || '') : '';
  });
  useEffect(() => {
    sessionStorage.setItem('encar_filters', JSON.stringify(filters));
  }, [filters]);
  // Задержка ввода (Debounce): ждем 500мс после того как пользователь перестал печатать,
  // и только потом обновляем глобальные фильтры, что спровоцирует запрос к API
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput || null }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => {
    axios.get('/rates').then(res => setRates(res.data));
  }, []);
  // Ссылка на "маяк" внизу списка
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

  // Сброс при изменении фильтров
  useEffect(() => {
    setCars([]);
    setOffset(0);
    setHasMore(true);
  }, [filters]);

  // Основная загрузка данных
  // Внутри useEffect, где происходит загрузка данных (fetchCars)

// Основная загрузка данных
useEffect(() => {
  const fetchCars = async () => {
    setLoading(true);
    try {
      // Мы отправляем параметры КАК ЕСТЬ, без конвертаций!
      const apiParams = { ...filters, limit: LIMIT, offset: offset };

      const { data } = await axios.get('/cars', { 
        params: apiParams 
      });

      setCars(prev => {
        if (offset === 0) return data;
        return [...prev, ...data];
      });

      setHasMore(data.length === LIMIT);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    }
    setLoading(false);
  };

  fetchCars();
}, [filters, offset]); 

  // Фоновое автообновление каталога каждые 10 секунд
  useEffect(() => {
    if (offset !== 0) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get('/cars', { 
          params: { ...filters, limit: LIMIT, offset: 0 } 
        });
        
        setCars(prev => {
          if (prev.length > 0 && data.length > 0 && prev[0].car_id !== data[0].car_id) {
            return data;
          }
          return prev;
        });
      } catch (error) {
        console.error("Ошибка фонового обновления:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [filters, offset]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="w-full lg:w-1/4">
        <Filters filters={filters} setFilters={setFilters} />
      </aside>

      <section className="w-full lg:w-3/4">
        {/* Шапка каталога */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight whitespace-nowrap">
            Каталог предложений
          </h1>
          <div className="flex-grow max-w-md mx-4 relative">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Быстрый поиск по названию..."
              className="w-full border-gray-300 border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-shadow"
            />
          </div>
          <select
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="border-gray-300 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium bg-gray-50"
          >
            <option value="newest">Новые поступления</option>
            <option value="price_asc">Сначала дешевле</option>
            <option value="price_desc">Сначала дороже</option>
          </select>
        </div>
        {/* Показываем его только если сортировка НЕ "price_asc" */}
        {filters.sort !== 'price_asc' && (
           <BottomMarketSlider filters={filters} rates={rates} />
        )}

        {/* Сетка автомобилей */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cars.map((car, index) => {
            if (cars.length === index + 1) {
              return (
                <div ref={lastCarElementRef} key={car.car_id}>
                  <CarCard car={car}
                  rates={rates} />
                </div>
              );
            } else {
              return <CarCard key={car.car_id} car={car} rates={rates} />;
            }
          })}
        </div>

        {/* Индикаторы */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-500 font-medium">Загружаем ещё...</span>
            </div>
          </div>
        )}

        {!loading && cars.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-lg">По вашему запросу ничего не найдено.</p>
            <button 
              onClick={() => { setFilters({}); setSearchInput(''); }} 
              className="mt-4 text-blue-600 font-bold hover:underline"
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
  );
}