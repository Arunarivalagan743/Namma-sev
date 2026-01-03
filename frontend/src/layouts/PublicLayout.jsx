import { Outlet, Link } from 'react-router-dom';
import { FiHome, FiLogIn, FiUserPlus } from 'react-icons/fi';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className=" text-white shadow-md">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img src="/namsev-logo.png" alt="NamSev" className="h-10 sm:h-14 md:h-16" />
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
              <Link 
                to="/" 
                className="flex items-center space-x-1 text-gov-blue hover:text-[#c41e3a] transition-colors text-sm sm:text-base"
              >
                <FiHome size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link 
                to="/login" 
                className="flex items-center space-x-1 text-gov-blue hover:text-[#c41e3a] transition-colors text-sm sm:text-base"
              >
                <FiLogIn size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link 
                to="/register" 
                className="flex items-center space-x-1 bg-[#c41e3a] text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded font-medium hover:bg-[#a01830] transition-colors text-xs sm:text-base"
              >
                <FiUserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Register</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gov-blue  text-white py-6 sm:py-8 mt-auto">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">NamSev</h3>
              <p className="text-gray-300 text-xs sm:text-sm">
                Official Civic Engagement Platform for Ganapathipalayam Panchayat. 
                Report issues, track progress, and stay updated with local governance.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Quick Links</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-300">
                <li><Link to="/" className="hover:text-[#c41e3a]">Home</Link></li>
                <li><Link to="/login" className="hover:text-[#c41e3a]">Login</Link></li>
                <li><Link to="/register" className="hover:text-[#c41e3a]">Register</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Contact</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-300">
                <li>2/783(41, Moogambigai Nagar</li>
                <li>Ganapathipalayam, Palladam</li>
                <li>Tamil Nadu 641605</li>
                <li className="break-all">Email: panchayat.office@gmail.com</li>
                <li>Phone: +91 XXXXXXXXXX</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center text-xs sm:text-sm text-gray-400">
            <p>2024 NamSev - Ganapathipalayam Panchayat. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
