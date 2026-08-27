export const trackEvent = (eventName, params = {}) => {
    // 1. Отправляем в Google Tag Manager (GTM)
    // GTM сам перехватит событие из dataLayer и отправит в GA4
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName,
        ...params
      });
    }
  
    // 2. Прямая отправка целей в Яндекс.Метрику
    // Здесь мы указали твой актуальный ID: 111755211
    const YM_ID = 111755211; 
    if (typeof window !== 'undefined' && window.ym) {
      window.ym(YM_ID, 'reachGoal', eventName, params);
    }
  
    // Логируем в консоль для удобства отладки
    console.log(`[SEO Analytics] Event Fired: ${eventName}`, params);
  };