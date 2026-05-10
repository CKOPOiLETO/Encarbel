// About.jsx
export default function About() {
  return (
    <div className="bg-white p-10 rounded-lg text-center shadow-sm border border-gray-100">
      <h1 className="text-3xl font-bold mb-4">О нас и Контакты</h1>
      <p className="text-gray-500 mb-6">Мы помогаем привозить лучшие автомобили из Южной Кореи.</p>
      <div className="inline-block text-left bg-gray-50 p-6 rounded-lg">
        <p>📞 <strong>Телефон:</strong> +7 (999) 000-00-00</p>
        <p>📧 <strong>Email:</strong> info@encar-export.ru</p>
        <p>📍 <strong>Офис:</strong> г. Москва, Москва Сити</p>
      </div>
    </div>
  );
}