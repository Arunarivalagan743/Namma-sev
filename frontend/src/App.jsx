import React, { useState } from 'react';
import PublicNav from './components/common/PublicNav';
import WorkerNav from './components/Worker/WorkerNav';
import EmployerNav from './components/Employer/EmployerNav';
import AdminNav from './components/Admin/AdminNav';
import LoginForm from './components/Auth/LoginForm';
import HomePage from './pages/HomePage';

function App() {
  const [userRole, setUserRole] = useState(null); // null, 'worker', 'employer', 'admin'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  const handleRoleSelect = (role, phone) => {
    setUserRole(role);
    setPhoneNumber(phone);
    setIsAuthenticated(true);
    setShowLogin(false);
  };

  const handleGetStarted = () => {
    setShowLogin(true);
  };

  return (
    <div className="min-h-screen bg-kaamio-base">
      {/* Show Public Nav before login */}
      {!isAuthenticated && !showLogin && <PublicNav onGetStarted={handleGetStarted} />}

      {/* Show Admin Sidebar */}
      {isAuthenticated && userRole === 'admin' && <AdminNav />}

      {/* Main Content Area */}
      {!isAuthenticated ? (
        showLogin ? (
          <LoginForm onRoleSelect={handleRoleSelect} />
        ) : (
          <HomePage onGetStarted={handleGetStarted} />
        )
      ) : (
        <div className={`w-full min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 ${userRole === 'admin' ? 'ml-0 md:ml-64' : ''} pt-16 sm:pt-20`}>
          <div className="w-full max-w-4xl text-center px-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              Welcome to Kaamio!
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              You are logged in as: <span className="font-semibold text-kaamio-primary capitalize">{userRole}</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">Phone: +91 {phoneNumber}</p>
          </div>
        </div>
      )}

      {/* Show Role-based Bottom Nav after login */}
      {isAuthenticated && userRole === 'worker' && <WorkerNav />}
      {isAuthenticated && userRole === 'employer' && <EmployerNav />}
    </div>
  );
}

export default App;
