import React, { useState } from 'react';

const WorkerNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-6 md:px-16 lg:px-24 xl:px-32 py-3 sm:py-4 bg-white z-50">
      {/* Logo */}
      <a href="/" className="flex flex-col items-center leading-none">
        <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-gray-900">KAAMIO</span>
        <span className="text-[8px] sm:text-[10px] font-semibold tracking-widest text-gray-900">EMPOWER</span>
      </a>

      {/* Desktop Menu */}
      <div className="hidden sm:flex items-center gap-8 text-sm text-slate-800">
        <a href="#home" className="hover:text-slate-500 transition">Home</a>
        <a href="#jobs" className="hover:text-slate-500 transition">Find Jobs</a>
        <a href="#my-jobs" className="hover:text-slate-500 transition">My Jobs</a>
        <a href="#earnings" className="hover:text-slate-500 transition">Earnings</a>

        <div className="hidden lg:flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full">
          <input 
            className="py-1.5 w-40 bg-transparent outline-none placeholder-gray-500" 
            type="text" 
            placeholder="Search jobs" 
          />
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.836 10.615 15 14.695" stroke="#7A7B7D" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path clipRule="evenodd" d="M9.141 11.738c2.729-1.136 4.001-4.224 2.841-6.898S7.67.921 4.942 2.057C2.211 3.193.94 6.281 2.1 8.955s4.312 3.92 7.041 2.783" stroke="#7A7B7D" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="relative cursor-pointer p-2 hover:bg-gray-100 rounded-full transition">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="absolute top-1 right-1 text-xs text-white bg-red-500 w-4 h-4 rounded-full flex items-center justify-center">3</span>
        </div>

        <button className="cursor-pointer px-6 sm:px-8 py-2.5 sm:py-2 text-sm sm:text-base bg-kaamio-primary hover:bg-kaamio-secondary transition text-white rounded-full">
          Profile
        </button>
      </div>

      {/* Mobile Menu Button */}
      <button onClick={() => setOpen(!open)} aria-label="Menu" className="sm:hidden p-2 active:scale-95 transition">
        <svg width="24" height="18" viewBox="0 0 21 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="21" height="1.5" rx=".75" fill="#0F766E" />
          <rect x="8" y="6" width="13" height="1.5" rx=".75" fill="#0F766E" />
          <rect x="6" y="13" width="15" height="1.5" rx=".75" fill="#0F766E" />
        </svg>
      </button>

      {/* Mobile Menu */}
      <div className={`${open ? 'flex' : 'hidden'} absolute top-[56px] sm:top-[64px] left-0 w-full bg-white shadow-md py-4 flex-col items-start gap-1 px-4 sm:px-5 text-sm text-slate-800`}>
        <a href="#home" className="block py-3 w-full hover:bg-gray-50 rounded px-2">Home</a>
        <a href="#jobs" className="block py-3 w-full hover:bg-gray-50 rounded px-2">Find Jobs</a>
        <a href="#my-jobs" className="block py-3 w-full hover:bg-gray-50 rounded px-2">My Jobs</a>
        <a href="#earnings" className="block py-3 w-full hover:bg-gray-50 rounded px-2">Earnings</a>
        <button className="cursor-pointer px-6 py-3 mt-2 w-full bg-kaamio-primary hover:bg-kaamio-secondary transition text-white rounded-full text-sm font-medium">
          Profile
        </button>
      </div>
    </nav>
  );
};

export default WorkerNav;
