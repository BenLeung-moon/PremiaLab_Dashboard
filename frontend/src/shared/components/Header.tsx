import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const location = useLocation();
  const isOnDashboard = location.pathname === '/dashboard';
  const { t } = useLanguage();

  return (
    <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
      <div className="flex items-center">
        <button className="text-gray-500 md:hidden">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="ml-4 md:ml-0">
          <h2 className="text-lg font-medium">Dashboard</h2>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <LanguageSwitcher />
        {isOnDashboard ? (
          <Link 
            to="/" 
            className="px-4 py-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          >
            {t('navigation.toChat')}
          </Link>
        ) : (
          <Link 
            to="/dashboard" 
            className="px-4 py-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          >
            {t('navigation.toDashboard')}
          </Link>
        )}
        <div className="relative">
          <input
            type="text"
            placeholder={t('chat.inputPlaceholder')}
            className="bg-gray-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <button className="flex items-center focus:outline-none">
            <img
              className="h-8 w-8 rounded-full"
              src="https://randomuser.me/api/portraits/women/44.jpg"
              alt="User profile"
            />
            <span className="ml-2 text-sm font-medium hidden md:block">{t('language.current')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 