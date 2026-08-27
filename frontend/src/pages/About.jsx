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
            <span className="font-bold text-red-600">AUTOCAPITAL</span> — компания,
            занимающаяся поиском, приобретением и доставкой автомобилей из Европы,
            США, Китая и Кореи. С 2007 года мы оказываем клиентам комплексную
            поддержку на протяжении всей сделки — начиная с подбора и проверки
            автомобиля и заканчивая его доставкой, таможенным оформлением и
            передачей владельцу в Беларуси.
          </p>

          <p>
            За время работы AUTOCAPITAL разработала собственную систему организации
            международных поставок автомобилей и сформировала команду специалистов
            с большим практическим опытом. Мы работаем как с востребованными
            моделями, так и с индивидуальными заказами, включая редкие,
            дорогостоящие и современные технологичные автомобили.
          </p>
        </div>
      </section>


      {/* 2. БЛОК: СТАТИСТИКА */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 px-2 py-6 sm:p-8 md:p-12 transform hover:scale-[1.01] transition-transform duration-500">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-1 items-center text-center divide-x-0 md:divide-x divide-gray-200">
          
          {/* 19 лет */}
          <div className="px-1 py-1 sm:p-4">
            <div className="text-2xl min-[380px]:text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-black text-red-600 mb-2 whitespace-nowrap">
              19 лет
            </div>

            <div className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">
              успешной работы
            </div>
          </div>


          {/* 22000+ */}
          <div className="px-1 py-1 sm:p-4 relative">
            <div className="hidden md:block absolute -left-6 top-1/2 -translate-y-1/2 text-gray-300 text-6xl font-light italic"></div>

            <div className="text-2xl min-[380px]:text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-black text-red-600 mb-2 whitespace-nowrap">
              22000+
            </div>

            <div className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider leading-tight">
              автомобилей<br className="hidden sm:inline" /> доставлено
            </div>
          </div>


          {/* 52 */}
          <div className="px-1 py-1 sm:p-4 relative">
            <div className="hidden md:block absolute -left-6 top-1/2 -translate-y-1/2 text-gray-300 text-6xl font-light italic"></div>

            <div className="text-2xl min-[380px]:text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-black text-red-600 mb-2 whitespace-nowrap">
              52
            </div>

            <div className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider leading-tight">
              специалиста<br className="hidden sm:inline" /> в команде
            </div>
          </div>


          {/* 99% */}
          <div className="px-1 py-1 sm:p-4 relative">
            <div className="hidden md:block absolute -left-6 top-1/2 -translate-y-1/2 text-gray-300 text-6xl font-light italic"></div>

            <div className="text-2xl min-[380px]:text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-black text-red-600 mb-2 whitespace-nowrap">
              99%
            </div>

            <div className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider leading-tight">
              клиентов<br className="hidden sm:inline" /> рекомендуют нас
            </div>
          </div>

        </div>
      </section>


      {/* 3. БЛОК: ИСТОРИЯ КОМПАНИИ */}
      <section className="bg-gray-50 rounded-3xl p-6 md:p-16 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[400px] font-black text-gray-100 opacity-50 select-none z-0">
          A
        </div>
        
        <div className="relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">
              История компании
            </h2>

            <p className="text-gray-600">
              Каждый этап развития компании связан с новыми клиентами,
              автомобилями и расширением наших возможностей
            </p>
          </div>


          <div className="space-y-8 relative before:absolute before:top-0 before:bottom-0 before:left-5 md:before:left-1/2 before:-translate-x-1/2 before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-red-500 before:to-transparent">
            
            {/* 2007 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow z-10 transition-transform group-hover:scale-110"></div>

              <div className="w-[calc(100%-4rem)] ml-auto md:mx-0 md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2007</div>
                <div className="text-sm text-gray-700 font-medium">
                  Начало деятельности компании и первые поставки автомобилей с американского рынка.
                </div>
              </div>
            </div>
            

            {/* 2011 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow z-10 transition-transform group-hover:scale-110"></div>

              <div className="w-[calc(100%-4rem)] ml-auto md:mx-0 md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2011</div>
                <div className="text-sm text-gray-700 font-medium">
                  Развитие направления поставок новых автомобилей для юридических лиц через официальных дилеров с учетом НДС.
                </div>
              </div>
            </div>


            {/* 2016 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow z-10 transition-transform group-hover:scale-110"></div>

              <div className="w-[calc(100%-4rem)] ml-auto md:mx-0 md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2016</div>
                <div className="text-sm text-gray-700 font-medium">
                  Выход на рынки стран СНГ и расширение деятельности за счет направления электромобилей.
                </div>
              </div>
            </div>


            {/* 2018 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow z-10 transition-transform group-hover:scale-110"></div>

              <div className="w-[calc(100%-4rem)] ml-auto md:mx-0 md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2018</div>
                <div className="text-sm text-gray-700 font-medium">
                  Объединение международных направлений в единую группу компаний AUTOCAPITAL.
                </div>
              </div>
            </div>


            {/* 2019 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow z-10 transition-transform group-hover:scale-110"></div>

              <div className="w-[calc(100%-4rem)] ml-auto md:mx-0 md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2019</div>
                <div className="text-sm text-gray-700 font-medium">
                  Открытие двух специализированных автомобильных салонов в Москве.
                </div>
              </div>
            </div>


            {/* 2020 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow z-10 transition-transform group-hover:scale-110"></div>

              <div className="w-[calc(100%-4rem)] ml-auto md:mx-0 md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2020</div>
                <div className="text-sm text-gray-700 font-medium">
                  Запуск направления по поставке электромобилей непосредственно с китайского рынка.
                </div>
              </div>
            </div>


            {/* 2022 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow z-10 transition-transform group-hover:scale-110"></div>

              <div className="w-[calc(100%-4rem)] ml-auto md:mx-0 md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2022</div>
                <div className="text-sm text-gray-700 font-medium">
                  Переформатирование логистических маршрутов и увеличение объема поставок из Европы, Китая, ОАЭ и Кореи.
                </div>
              </div>
            </div>


            {/* 2024 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow z-10 transition-transform group-hover:scale-110"></div>

              <div className="w-[calc(100%-4rem)] ml-auto md:mx-0 md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2024</div>
                <div className="text-sm text-gray-700 font-medium">
                  Открытие первого официального автосалона LiXiang на территории Беларуси.
                </div>
              </div>
            </div>


            {/* 2026 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-red-500 bg-white shadow z-10 transition-transform group-hover:scale-110"></div>

              <div className="w-[calc(100%-4rem)] ml-auto md:mx-0 md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-red-600 mb-2">2026</div>
                <div className="text-sm text-gray-700 font-medium">
                  Продолжение развития премиального сегмента и увеличение присутствия компании на белорусском автомобильном рынке.
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>


      {/* 4. БЛОК: ЧТО ОТЛИЧАЕТ AUTOCAPITAL */}
      <section className="pt-10">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-10 text-center md:text-left">
          <span className="text-red-600">Преимущества</span> AUTOCAPITAL
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          
          <div className="space-y-4">
            <div className="text-7xl font-black text-red-600 opacity-90 leading-none">1</div>
            <h3 className="text-xl font-bold text-gray-900">
              Комплексная организация сделки
            </h3>
            <p className="text-gray-600 font-medium leading-relaxed">
              Организуем весь процесс покупки автомобиля: поиск подходящего варианта,
              проверку, приобретение, транспортировку, таможенное оформление и передачу
              машины заказчику.
            </p>
          </div>


          <div className="space-y-4">
            <div className="text-7xl font-black text-red-600 opacity-90 leading-none">2</div>
            <h3 className="text-xl font-bold text-gray-900">
              Знание зарубежных рынков
            </h3>
            <p className="text-gray-600 font-medium leading-relaxed">
              Налаженные направления работы в Европе, США, Китае и Корее позволяют
              подбирать оптимальные решения с учетом страны покупки, логистики и
              индивидуальных требований клиента.
            </p>
          </div>


          <div className="space-y-4">
            <div className="text-7xl font-black text-red-600 opacity-90 leading-none">3</div>
            <h3 className="text-xl font-bold text-gray-900">
              Практика реализации сложных задач
            </h3>
            <p className="text-gray-600 font-medium leading-relaxed">
              Компания имеет опыт работы с эксклюзивными автомобилями, электромобилями,
              первыми поставками Tesla в Беларусь и различными вариантами сложных
              логистических маршрутов.
            </p>
          </div>


          <div className="space-y-4">
            <div className="text-7xl font-black text-red-600 opacity-90 leading-none">4</div>
            <h3 className="text-xl font-bold text-gray-900">
              Готовность к изменениям рынка
            </h3>
            <p className="text-gray-600 font-medium leading-relaxed">
              При изменении внешних условий мы оперативно корректируем рабочие и
              логистические процессы, сохраняя контроль над выполнением обязательств
              перед клиентами.
            </p>
          </div>


          <div className="space-y-4">
            <div className="text-7xl font-black text-red-600 opacity-90 leading-none">5</div>
            <h3 className="text-xl font-bold text-gray-900">
              Четкие условия сотрудничества
            </h3>
            <p className="text-gray-600 font-medium leading-relaxed">
              Понятные правила взаимодействия, прозрачная схема работы и сопровождение
              заказа на всех этапах помогают формировать доверие и поддерживать
              долгосрочные отношения с клиентами.
            </p>
          </div>

        </div>
      </section>


      {/* 5. БЛОК: ПРИНЦИПЫ РАБОТЫ */}
      <section className="pt-10">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-10 text-center md:text-left">
          Как мы работаем
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white p-8 rounded-2xl shadow-md border-y border-r border-gray-100 border-l-[6px] border-l-red-600 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="text-red-600" size={24} />
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                Ориентация на результат
              </h3>
            </div>

            <p className="text-gray-600 font-medium leading-relaxed ml-16">
              Берём ответственность за процесс и продолжаем сопровождение сделки
              до момента получения клиентом готового автомобиля.
            </p>
          </div>


          <div className="bg-white p-8 rounded-2xl shadow-md border-y border-r border-gray-100 border-l-[6px] border-l-red-600 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Eye className="text-red-600" size={24} />
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                Информация без лишних сложностей
              </h3>
            </div>

            <p className="text-gray-600 font-medium leading-relaxed ml-16">
              Объясняем условия сотрудничества простым языком и предоставляем
              клиенту актуальную информацию о выполнении заказа на протяжении
              всей сделки.
            </p>
          </div>


          <div className="bg-white p-8 rounded-2xl shadow-md border-y border-r border-gray-100 border-l-[6px] border-l-red-600 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Handshake className="text-red-600" size={24} />
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                Учет интересов заказчика
              </h3>
            </div>

            <p className="text-gray-600 font-medium leading-relaxed ml-16">
              Подбираем подходящий вариант покупки, доставки и оформления автомобиля,
              учитывая цели, бюджет и индивидуальные требования клиента.
            </p>
          </div>


          <div className="bg-white p-8 rounded-2xl shadow-md border-y border-r border-gray-100 border-l-[6px] border-l-red-600 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Settings className="text-red-600" size={24} />
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                Проверенная система работы
              </h3>
            </div>

            <p className="text-gray-600 font-medium leading-relaxed ml-16">
              Все основные этапы — от проверки автомобиля до его доставки и
              таможенного оформления — выполняются по отработанным процессам,
              направленным на снижение рисков и повышение надежности сделки.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}