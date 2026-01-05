import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiFileText, 
  FiPlusCircle, 
  FiBell, 
  FiUser, 
  FiLogOut,
  FiMenu,
  FiX
} from 'react-icons/fi';
import { useState } from 'react';
import toast from 'react-hot-toast';

const DashboardLayout = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/my-complaints', label: 'My Complaints', icon: FiFileText },
    { path: '/new-complaint', label: 'New Complaint', icon: FiPlusCircle },
    { path: '/announcements', label: 'Announcements', icon: FiBell },
    { path: '/profile', label: 'Profile', icon: FiUser },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gov-cream flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 sm:w-64 bg-gov-blue text-white transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700">
          <Link to="/dashboard" className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gov-gold rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gov-blue font-bold text-sm sm:text-lg">N</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold">NamSev</h1>
              <p className="text-[10px] sm:text-xs text-gray-400">Citizen Portal</p>
            </div>
          </Link>
          <button 
            className="lg:hidden text-white p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-3 sm:p-4 border-b border-gray-700">
          <p className="text-xs sm:text-sm text-gray-400">Welcome,</p>
          <p className="font-medium truncate text-sm sm:text-base">{userProfile?.name || currentUser?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base
                ${isActive(item.path) 
                  ? 'bg-gov-gold text-gov-blue font-medium' 
                  : 'text-gray-300 hover:bg-gray-700'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 w-full text-gray-300 hover:bg-gray-700 rounded-lg transition-colors text-sm sm:text-base"
          >
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              className="lg:hidden text-gov-blue"
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu size={24} />
            </button>
            <div className="lg:hidden" />
            <div className="text-right">
              <p className="text-sm text-gray-500">Ganapathipalayam Panchayat</p>
              <p className="text-xs text-gray-400">Code: TIRU001</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-3 sm:py-4 px-4 sm:px-6 text-center text-xs sm:text-sm text-gray-500">
          <p>© 2024 NamSev - Ganapathipalayam Gram Panchayat, Palladam, Tirupur - 641605</p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
