const Sidebar = () => {
  const menuItems = [
    { id: 'dashboard', label: '仪表盘', icon: '📊' },
    { id: 'portfolio', label: '投资组合', icon: '📈' },
    { id: 'analysis', label: '分析', icon: '🔍' },
    { id: 'reports', label: '报告', icon: '📝' },
    { id: 'settings', label: '设置', icon: '⚙️' },
  ];

  return (
    <div className="bg-gray-800 text-white w-64 flex-shrink-0 hidden md:block">
      <div className="p-6">
        <h1 className="text-2xl font-bold">PremiaLab</h1>
      </div>
      <nav className="mt-6">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id} className="px-6 py-3 hover:bg-gray-700 cursor-pointer">
              <div className="flex items-center">
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 