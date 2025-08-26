import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12">
      <div className="container mx-auto px-4 py-6 text-center text-gray-600 dark:text-gray-500">
        <p className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-300">Various © 2024</p>
        <p className="text-sm">
          إخلاء مسؤولية: المعلومات المقدمة على هذه المنصة هي لأغراض إعلامية وتعليمية فقط ولا تشكل نصيحة مالية أو استثمارية. قم دائمًا بإجراء أبحاثك الخاصة واستشر مستشارًا ماليًا محترفًا قبل اتخاذ أي قرارات استثمارية.
        </p>
      </div>
    </footer>
  );
};

export default Footer;