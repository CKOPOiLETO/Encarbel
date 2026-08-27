import { useState, useEffect } from 'react';
import { MessageCircle, X, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { trackEvent } from '../utils/analytics';

export default function FloatingLeadWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, success
  const [targetCar, setTargetCar] = useState({ name: '', id: '' });

  // ТА САМАЯ ПРОПАВШАЯ СТРОЧКА:
  const [formData, setFormData] = useState({ name: '', phone: '', comment: '' });

  // Логика появления подсказки через 60 секунд
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) setShowPrompt(true);
    }, 60000); // 60 секунд
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Слушаем кастомное событие вызова модалки из других мест
  useEffect(() => {
    const handleOpenModal = (e) => {
      if (e.detail) {
        setTargetCar({
          name: e.detail.carName || '',
          id: e.detail.carId || ''
        });
      }
      setIsOpen(true);
      setShowPrompt(false);
    };
    window.addEventListener('open-lead-modal', handleOpenModal);
    return () => window.removeEventListener('open-lead-modal', handleOpenModal);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await axios.post('/lead', { 
        ...formData, 
        car_name: targetCar.name, 
        car_id: targetCar.id 
      });
      
      setStatus('success');
      
      trackEvent('generate_lead', { 
        lead_type: targetCar.name ? 'car_request' : 'general_question' 
      });

      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
        setFormData({ name: '', phone: '', comment: '' });
      }, 3000);
    } catch (error) {
      console.error(error);
      setStatus('idle');
    }
  };

  return (
    <>
      {/* ПЛАВАЮЩАЯ КНОПКА И ПОДСКАЗКА */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <div className={`mb-4 bg-white px-5 py-3 rounded-2xl shadow-xl border border-gray-100 relative transition-all duration-500 origin-bottom-right ${showPrompt && !isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
          <p className="text-sm font-bold text-gray-800">Напишите нам, мы онлайн!</p>
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white transform rotate-45 border-b border-r border-gray-100"></div>
          <button onClick={(e) => { e.stopPropagation(); setShowPrompt(false); }} className="absolute -top-2 -right-2 bg-gray-200 text-gray-500 rounded-full p-0.5 hover:bg-gray-300">
            <X size={12} />
          </button>
        </div>

        <button 
          onClick={() => { setIsOpen(true); setShowPrompt(false); }}
          className="relative group w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 transition-transform"
        >
          <span className="absolute inset-0 rounded-full border-2 border-red-500 opacity-50 animate-ping"></span>
          <span className="absolute -inset-2 rounded-full border border-red-400 opacity-30 animate-pulse"></span>
          <MessageCircle size={32} />
        </button>
      </div>

      {/* МОДАЛЬНОЕ ОКНО ФОРМЫ */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-fade-in">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 z-10 bg-gray-100 p-2 rounded-full">
              <X size={20} />
            </button>

            {status === 'success' ? (
              <div className="p-10 text-center flex flex-col items-center">
                <CheckCircle size={64} className="text-green-500 mb-4" />
                <h3 className="text-2xl font-black text-gray-900 mb-2">Заявка отправлена!</h3>
                <p className="text-gray-500">Наш менеджер свяжется с вами в ближайшее время.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8">
                <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Оставить заявку</h3>
                
                <p className="text-gray-500 text-sm mb-6 whitespace-pre-wrap">
                  {targetCar.name 
                    ? `Запрос по авто:\n${targetCar.name}${targetCar.id ? `\nID: ${targetCar.id}` : ''}` 
                    : 'Оставьте свои контакты, и мы перезвоним для консультации.'}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Ваше имя</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-red-600 focus:bg-white" placeholder="Иван" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Телефон</label>
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-red-600 focus:bg-white" placeholder="+375 (XX) XXX-XX-XX" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Комментарий (необязательно)</label>
                    <textarea value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})} rows="3" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-red-600 focus:bg-white resize-none" placeholder="Напишите ваш вопрос..."></textarea>
                  </div>
                  
                  <button disabled={status === 'loading'} type="submit" className="w-full bg-red-600 text-white font-bold text-lg rounded-xl py-4 hover:bg-red-700 transition-colors disabled:opacity-70 mt-2">
                    {status === 'loading' ? 'Отправка...' : 'Жду звонка'}
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-4">
                    Нажимая кнопку, вы даете согласие на обработку персональных данных.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}