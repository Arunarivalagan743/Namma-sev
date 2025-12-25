import React from 'react';

export default function HomePage({ onGetStarted }) {
  return (
    <main className="flex flex-col max-md:gap-16 md:gap-8 lg:gap-12 md:flex-row pb-12 sm:pb-20 items-center justify-between mt-16 sm:mt-20 px-3 sm:px-4 md:px-16 lg:px-24 xl:px-32">
      <div className="flex flex-col items-center md:items-start">
        <h1 className="text-center md:text-left text-4xl leading-[46px] sm:text-5xl sm:leading-[58px] md:text-5xl md:leading-[68px] lg:text-6xl lg:leading-[76px] font-semibold max-w-xl text-slate-900">
          Connect Rural Workers to
          <br />
          <span className="bg-gradient-to-r from-kaamio-primary to-kaamio-secondary bg-clip-text text-transparent">Nearby Jobs</span>
        </h1>
        <p className="text-center md:text-left text-sm sm:text-base text-slate-700 max-w-lg mt-2 sm:mt-3">
          India's first AI-powered platform for rural employment. Find trusted workers or get job opportunities near you .
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-6 sm:mt-8 text-sm w-full sm:w-auto">
          <button 
            onClick={onGetStarted}
            className="w-full sm:w-auto bg-kaamio-primary hover:bg-kaamio-secondary text-white active:scale-95 transition rounded-md px-6 sm:px-7 h-12 sm:h-11"
          >
            Get started
          </button>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 border border-slate-600 active:scale-95 hover:bg-white/10 transition text-slate-600 rounded-md px-5 sm:px-6 h-12 sm:h-11">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path>
              <rect x="2" y="6" width="14" height="12" rx="2"></rect>
            </svg>
            <span>Watch demo</span>
          </button>
        </div>
      </div>
      <img 
        src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/hero/hero-section-showcase-5.png" 
        alt="hero" 
        className="max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl w-full transition-all duration-300" 
      />
    </main>
  );
}
