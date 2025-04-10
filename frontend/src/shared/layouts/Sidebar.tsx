import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const Sidebar = () => {
  const { t } = useLanguage();

  return (
    <aside className="w-64 bg-gray-800 text-white hidden md:block">
      <div className="p-4">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-semibold">PremiaLab</span>
        </Link>
      </div>
      <nav className="mt-8">
        <div className="px-4 mb-2 text-xs text-gray-400 uppercase tracking-wider">
          {t('navigation.main')}
        </div>
        <Link 
          to="/" 
          className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700"
        >
          <span className="ml-2">{t('navigation.chat')}</span>
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar; 