import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="text-center py-12 md:py-20">
      <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
        اكتشف فرص السوق الأمريكي بذكاء
      </h2>
      <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
        منصة <span className="text-teal-500 dark:text-teal-400 font-bold">Various</span> تمنحك بيانات لحظية، تحليلات فنية، وتوصيات ذكية لمساعدتك في اتخاذ قرارات استثمارية أفضل.
      </p>
    </section>
  );
};

export default HeroSection;