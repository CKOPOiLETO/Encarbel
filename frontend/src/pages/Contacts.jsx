import React from 'react';
import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';
import bgImage from '../assets/contacts_bg.webp';
import tg_logo from '../assets/tg_logo.png'; 
import inst_logo from '../assets/instagram.png'; 


export default function Contacts() {
    const contacts = [
        {
          title: "Салон на Победителей",
          address: "г. Минск, пр-т. Победителей 102",
          // Универсальная ссылка Яндекса через поиск (лучше всего для мобильных приложений)
          mapLink: "https://yandex.by/maps/?text=Минск+Победителей+102+autocapital",
          googleLink: "https://www.google.com/maps/search/?api=1&query=Минск+Победителей+102+autocapital",
          schedule: [
            { days: "Пн - Пт", time: "9:00 - 20:00" },
            { days: "Сб - Вс", time: "10:00 - 20:00" }
          ]
        },
        {
          title: "Салон на Независимости",
          address: "г. Минск, пр-т. Независимости 84А",
          // Универсальная ссылка Яндекса через поиск
          mapLink: "https://yandex.by/maps/?text=Минск+Независимости+84А",
          googleLink: "https://www.google.com/maps/search/?api=1&query=Минск+Независимости+84А",
          schedule: [
            { days: "Пн - Вс", time: "10:00 - 19:00" }
          ]
        }
    ];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center py-12 px-4 overflow-hidden">
      
      {/* ФОНОВОЕ ИЗОБРАЖЕНИЕ: Четкое, на весь экран */}
      <div className="fixed inset-0 z-0">
        <img 
          src={bgImage} 
          alt="Background" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 max-w-6xl w-full">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-2xl">
            Контакты <span className="text-red-600">AUTOCAPITAL</span>
          </h1>
          <p className="text-white text-xl font-bold drop-shadow-lg opacity-90">
            Ждем вас в наших автоцентрах в Минске
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {contacts.map((office, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/30 p-8 rounded-3xl text-white hover:bg-white/20 transition-all duration-300 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <MapPin size={28} />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">{office.title}</h3>
                </div>
                
                <p className="text-lg text-white font-medium mb-6 leading-relaxed">{office.address}</p>
                
                <div className="flex flex-wrap gap-3">
                    <a 
                      href={office.mapLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-black px-4 py-2 rounded-full hover:bg-yellow-400 transition-colors"
                    >
                      Яндекс Карты <ExternalLink size={12} />
                    </a>
                    <a 
                      href={office.googleLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Google Maps <ExternalLink size={12} />
                    </a>
                </div>

                <div className="mt-8 pt-8 border-t border-white/20 space-y-4">
                  <div className="flex items-center gap-2 text-white/60 mb-2">
                    <Clock size={18} />
                    <span className="text-[11px] font-black uppercase tracking-widest">График работы:</span>
                  </div>
                  {office.schedule.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                      <span className="text-white/80 font-medium">{item.days}</span>
                      <span className="font-bold text-red-500">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-red-600 p-8 rounded-3xl text-white shadow-2xl">
              <h3 className="text-3xl font-black uppercase mb-10 tracking-tighter">Связаться</h3>
              
              <div className="space-y-10">
                <a href="tel:+375445307131" className="flex items-center gap-5 group">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-lg group-hover:scale-110 transition-transform">
                    <Phone size={24} fill="currentColor" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Многоканальный</div>
                    <div className="text-xl font-black">+375 (44) 530 71 73</div>
                  </div>
                </a>

                <a href="mailto:info@autocapital.by" className="flex items-center gap-5 group">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-lg group-hover:scale-110 transition-transform">
                    <Mail size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Email</div>
                    <div className="text-xl font-black">info@autocapital.by</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/20 text-center shadow-2xl">
              <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-6">Социальные сети</div>
              <div className="flex justify-center gap-6">
                
                {/* Instagram */}
                <a 
                  href="https://www.instagram.com/autocapital.by?igsh=MWl4OXd0ZmxvZHkyYw==" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white cursor-pointer border border-white/10 font-black italic shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 overflow-hidden"
                >
                  <img src={inst_logo} alt="instagram logo" className="w-full h-full object-cover" />
                </a>

                {/* Telegram */}
                <a 
                  href="https://t.me/EncarBel" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white cursor-pointer border border-white/10 font-black italic shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 overflow-hidden"
                >
                  <img src={tg_logo} alt="tg logo" className="w-full h-full p-3 object-contain" />
                </a>


              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}