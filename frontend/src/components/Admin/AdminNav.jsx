import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AdminNav = () => {
  const [activeItem, setActiveItem] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'verification', label: 'Worker Verification' },
    { id: 'employers', label: 'Employer Management' },
    { id: 'jobs', label: 'Jobs Monitoring' },
    { id: 'trust', label: 'Trust Score Engine' },
    { id: 'fraud', label: 'Fraud Detection' },
    { id: 'analytics', label: 'Analytics & Reports' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-sm overflow-y-auto z-50">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold font-space text-kaamio-primary">Kaamio Admin</h1>
        <p className="text-xs text-gray-500 mt-1">Government Dashboard</p>
      </div>

      {/* Navigation Items */}
      <nav className="p-4">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveItem(item.id)}
            className={`w-full flex items-center px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeItem === item.id
                ? 'bg-kaamio-primary text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-sm font-medium">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <button className="w-full text-sm text-gray-600 hover:text-kaamio-primary font-medium">
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminNav;
