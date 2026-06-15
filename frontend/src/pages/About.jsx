import React from 'react';
import { Target, Eye, Handshake, Settings } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 space-y-24">
      
      {/* 1. БЛОК: О КОМПАНИИ */}
      <section className="text-center max-w-4xl mx-auto pt-10">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight mb-8">
          О компании
        </h1>
        <div className="text-lg text-gray-600 space-y-6 leading-relaxed text-justify md:text-center">
          <p>
            <span className="font-bold text-red-600">AUTOCAPITAL</span> — компания по подбору, покупке и доставке автомобилей из Европы, США, Китая и Кореи.
            С 2007 года мы сопровождаем клиента на всех этапах сделки: от поиска и проверки автомобиля до логистики, таможенного оформления и передачи автомобиля в Беларуси.
          </p>
          <p>
            За годы работы AUTOCAPITAL сформировала системный подход к международным поставкам автомобилей и стала надежным партнером для частных и корпоративных клиентов. Мы работаем как с массовым сегментом, так и со сложными индивидуальными запросами, включая поставку редких, премиальных и технологичных моделей.
          </p>
        </div>
      </section>

      {/* 2. БЛОК: СТАТИСТИКА */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 transform hover:scale-[1.01] transition-transform duration-500">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center text-center divide-x-0 md:divide-x divide-gray-200">
          <div className="p-4">
            <div className="text-5xl md:text-6xl font-black text-red-600 mb-2">19 лет</div>
            <div className="text-sm font-semibold text-gray-800 uppercase tracking-wider">на рынке</div>
          </div>
          <div className="p-4 relative">
            <div className="hidden md:block absolute -left-6 top-1/2 -translate-y-1/2 text-gray-300 text-6xl font-light italic">/</div>
            <div className="text-5xl md:text-6xl font-black text-red-600 mb-2">22000+</div>
            <div className="text-sm font-semibold text-gray-800 uppercase tracking-wider">доставленных<br/>автомобилей</div>
          </div>
          <div className="p-4 relative">
            <div className="hidden md:block absolute -left-6 top-1/2 -translate-y-1/2 text-gray-300 text-6xl font-light italic">/</div>
            <div className="text-5xl md:text-6xl font-black text-red-600 mb-2">52</div>
            <div className="text-sm font-semibold text-gray-800 uppercase tracking-wider">эксперта в<br/>команде</div>
          </div>
          <div className="p-4 relative">
            <div className="hidden md:block absolute -left-6 top-1/2 -translate-y-1/2 text-gray-300 text-6xl font-light italic">/</div>
            <div className="text-5xl md:text-6xl font-black text-red-600 mb-2">99%</div>
            <div className="text-sm font-semibold text-gray-800 uppercase tracking-wider">довольных<br/>клиентов</div>
          </div>
        </div>
      </section>

      {/* 3. БЛОК: ИСТОРИЯ КОМПАНИИ (ТАЙМЛАЙН) */}
      <section className="bg-gray-50 rounded-3xl p-8 md:p-16 relative overflow-hidden">
        {/* Фоновая водяная марка (буква A) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[400px] font-black text-gray-100 opacity-50 select-none z-0">
          A
        </div>
        
        <div className="relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">История компании</h2>
            <p className="text-gray-600">Свою историю мы измеряем в количестве наших клиентов — счастливых обладателей новых автомобилей</p>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-red-500 before:to-transparent">
            {/* 2007 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110"></div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2007</div>
                <div className="text-sm text-gray-700 font-medium">Основание компании, старт поставок автомобилей из США.</div>
              </div>
            </div>
            {/* 2011 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110"></div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2011</div>
                <div className="text-sm text-gray-700 font-medium">Запуск направления поставок новых автомобилей для юридических лиц с НДС от официальных дилеров.</div>
              </div>
            </div>
            {/* 2016 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110"></div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2016</div>
                <div className="text-sm text-gray-700 font-medium">Расширение на рынки СНГ и начало работы с электромобилями.</div>
              </div>
            </div>
            {/* 2018 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110"></div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2018</div>
                <div className="text-sm text-gray-700 font-medium">Формирование международной группы компаний AUTOCAPITAL.</div>
              </div>
            </div>
            {/* 2019 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110"></div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2019</div>
                <div className="text-sm text-gray-700 font-medium">Открытие двух специализированных автосалонов в Москве.</div>
              </div>
            </div>
            {/* 2020 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110"></div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2020</div>
                <div className="text-sm text-gray-700 font-medium">Запуск поставок электромобилей из Китая.</div>
              </div>
            </div>
            {/* 2022 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110"></div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2022</div>
                <div className="text-sm text-gray-700 font-medium">Перестройка логистических цепочек и развитие поставок из Европы, Китая, ОАЭ и Кореи в новых рыночных условиях.</div>
              </div>
            </div>
            {/* 2024 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110"></div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2024</div>
                <div className="text-sm text-gray-700 font-medium">Открытие первого в Беларуси официального автосалона LiXiang.</div>
              </div>
            </div>
            {/* 2026 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110"></div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2026</div>
                <div className="text-sm text-gray-700 font-medium">Развитие премиального направления и расширение присутствия на белорусском рынке.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. БЛОК: ЧТО ОТЛИЧАЕТ AUTOCAPITAL */}
      <section className="pt-10">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-10 text-center md:text-left">
          <span className="text-red-600">Что отличает</span> AUTOCAPITAL
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div className="text-7xl font-black text-red-600 opacity-90 leading-none">1</div>
            <h3 className="text-xl font-bold text-gray-900">Полный цикл сделки</h3>
            <p className="text-gray-600 font-medium leading-relaxed">Мы берем на себя все этапы: подбор, проверку, выкуп, доставку, таможенное оформление и финальную передачу автомобиля клиенту.</p>
          </div>
          <div className="space-y-4">
            <div className="text-7xl font-black text-red-600 opacity-90 leading-none">2</div>
            <h3 className="text-xl font-bold text-gray-900">Международная экспертиза</h3>
            <p className="text-gray-600 font-medium leading-relaxed">Компания выстроила устойчивые направления поставок из Европы, США, Китая и Кореи, адаптируя решения под особенности рынка, логистики и задач клиента.</p>
          </div>
          <div className="space-y-4">
            <div className="text-7xl font-black text-red-600 opacity-90 leading-none">3</div>
            <h3 className="text-xl font-bold text-gray-900">Опыт в сложных проектах</h3>
            <p className="text-gray-600 font-medium leading-relaxed">В портфеле AUTOCAPITAL — поставка эксклюзивных автомобилей, первые в Беларуси поставки Tesla, работа с электромобилями и реализация мультимодальных логистических схем.</p>
          </div>
          <div className="space-y-4">
            <div className="text-7xl font-black text-red-600 opacity-90 leading-none">4</div>
            <h3 className="text-xl font-bold text-gray-900">Надежность в нестабильных условиях</h3>
            <p className="text-gray-600 font-medium leading-relaxed">Мы умеем быстро адаптироваться к изменениям рынка и сохранять контроль над обязательствами перед клиентами даже в период внешних ограничений.</p>
          </div>
          <div className="space-y-4">
            <div className="text-7xl font-black text-red-600 opacity-90 leading-none">5</div>
            <h3 className="text-xl font-bold text-gray-900">Прозрачный подход</h3>
            <p className="text-gray-600 font-medium leading-relaxed">Фиксированные условия, понятная структура сделки и сопровождение клиента на каждом этапе позволяют выстраивать доверительные и долгосрочные отношения.</p>
          </div>
        </div>
      </section>

      {/* 5. БЛОК: ПРИНЦИПЫ РАБОТЫ */}
      <section className="pt-10">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-10 text-center md:text-left">
          Принципы работы
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-md border-y border-r border-gray-100 border-l-[6px] border-l-red-600 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Ответственность за результат</h3>
            </div>
            <p className="text-gray-600 font-medium leading-relaxed ml-16">Мы сопровождаем сделку до финального результата и сохраняем контроль над каждым этапом поставки.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md border-y border-r border-gray-100 border-l-[6px] border-l-red-600 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Eye className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Прозрачность на всех этапах</h3>
            </div>
            <p className="text-gray-600 font-medium leading-relaxed ml-16">Клиент получает понятные условия, ясную структуру сделки и информацию о ходе исполнения на каждом этапе.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md border-y border-r border-gray-100 border-l-[6px] border-l-red-600 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Handshake className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Решения в интересах клиента</h3>
            </div>
            <p className="text-gray-600 font-medium leading-relaxed ml-16">Мы подбираем оптимальный сценарий покупки, доставки и оформления, исходя из задач и приоритетов заказчика.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md border-y border-r border-gray-100 border-l-[6px] border-l-red-600 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Settings className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Системный подход к процессам</h3>
            </div>
            <p className="text-gray-600 font-medium leading-relaxed ml-16">Проверка автомобиля, логистика и таможенное оформление опираются на отработаннные механизмы, снижающие риски и повышающие надежность сделки.</p>
          </div>
        </div>
      </section>

    </div>
  );
}