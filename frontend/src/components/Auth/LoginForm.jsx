import React, { useState } from 'react';

export default function LoginForm({ onRoleSelect }) {
    const [step, setStep] = useState('phone'); // 'phone', 'otp', 'role'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [selectedRole, setSelectedRole] = useState('worker');

    const handleSendOTP = (e) => {
        e.preventDefault();
        if (phoneNumber.length === 10) {
            setStep('otp');
        }
    };

    const handleVerifyOTP = (e) => {
        e.preventDefault();
        if (otp.length === 6) {
            setStep('role');
        }
    };

    const handleRoleSelect = () => {
        // Check for admin phone number
        const role = phoneNumber === '9500643892' ? 'admin' : selectedRole;
        if (onRoleSelect) {
            onRoleSelect(role, phoneNumber);
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen w-full">
            <div className="w-full hidden md:flex md:w-1/2 lg:w-3/5 overflow-hidden">
                <video 
                    className="h-full w-full object-cover" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                >
                    <source src="/signup.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
        
            <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col items-center justify-center px-4 py-8 md:py-12 min-h-screen">
                {/* Phone Number Step */}
                {step === 'phone' && (
                    <form onSubmit={handleSendOTP} className="w-full max-w-sm md:max-w-md flex flex-col items-center justify-center">
                        <h2 className="text-3xl md:text-4xl text-gray-900 font-medium">Sign in</h2>
                        <p className="text-xs sm:text-sm text-gray-500/90 mt-2 md:mt-3 text-center px-2">Welcome to Kaamio! Enter your phone number</p>
            
                        <div className="flex items-center mt-8 w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="#6B7280"/>
                            </svg>
                            <span className="text-gray-500/80 text-sm">+91</span>
                            <input 
                                type="tel" 
                                placeholder="Phone Number" 
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full" 
                                maxLength="10"
                                required 
                            />                 
                        </div>
            
                        <button 
                            type="submit" 
                            disabled={phoneNumber.length !== 10}
                            className="mt-6 md:mt-8 w-full h-12 sm:h-14 rounded-full text-sm sm:text-base text-white bg-kaamio-primary hover:bg-kaamio-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Send OTP
                        </button>
                    </form>
                )}

                {/* OTP Verification Step */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOTP} className="w-full max-w-sm md:max-w-md flex flex-col items-center justify-center">
                        <h2 className="text-3xl md:text-4xl text-gray-900 font-medium">Verify OTP</h2>
                        <p className="text-xs sm:text-sm text-gray-500/90 mt-2 md:mt-3 text-center px-2">Enter the 6-digit code sent to +91 {phoneNumber}</p>
            
                        <div className="flex items-center mt-6 md:mt-8 w-full bg-transparent border border-gray-300/60 h-12 sm:h-14 rounded-full overflow-hidden pl-4 sm:pl-6 gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" fill="#6B7280"/>
                                <path d="M12 6a1 1 0 0 0-1 1v5a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V7a1 1 0 0 0-1-1z" fill="#6B7280"/>
                            </svg>
                            <input 
                                type="text" 
                                placeholder="Enter 6-digit OTP" 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full tracking-widest" 
                                maxLength="6"
                                required 
                            />                 
                        </div>
            
                        <button 
                            type="submit" 
                            disabled={otp.length !== 6}
                            className="mt-6 md:mt-8 w-full h-12 sm:h-14 rounded-full text-sm sm:text-base text-white bg-kaamio-primary hover:bg-kaamio-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Verify OTP
                        </button>
                        
                        <button 
                            type="button"
                            onClick={() => setStep('phone')}
                            className="text-gray-500/90 text-xs sm:text-sm mt-3 sm:mt-4 hover:underline"
                        >
                            Change phone number
                        </button>
                    </form>
                )}

                {/* Role Selection Step */}
                {step === 'role' && (
                    <div className="w-full max-w-sm md:max-w-md flex flex-col items-center justify-center">
                        <h2 className="text-3xl md:text-4xl text-gray-900 font-medium">Select Role</h2>
                        <p className="text-xs sm:text-sm text-gray-500/90 mt-2 md:mt-3 text-center px-2">How would you like to use Kaamio?</p>
            
                        <div className="mt-6 md:mt-8 w-full space-y-3 sm:space-y-4">
                            <button
                                type="button"
                                onClick={() => setSelectedRole('worker')}
                                className={`w-full h-28 sm:h-32 rounded-xl sm:rounded-2xl border-2 transition-all flex items-center gap-3 sm:gap-4 px-4 sm:px-6 ${
                                    selectedRole === 'worker' 
                                        ? 'border-kaamio-primary bg-kaamio-primary/5' 
                                        : 'border-gray-300/60 hover:border-gray-400'
                                }`}
                            >
                                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
                                    <img src="/Construction worker-rafiki.svg" alt="Worker" className="w-full h-full" />
                                </div>
                                <div className="text-left">
                                    <h3 className={`font-semibold text-base sm:text-lg ${selectedRole === 'worker' ? 'text-kaamio-primary' : 'text-gray-800'}`}>
                                        I want to work
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500/90">Find jobs near you</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedRole('employer')}
                                className={`w-full h-28 sm:h-32 rounded-xl sm:rounded-2xl border-2 transition-all flex items-center gap-3 sm:gap-4 px-4 sm:px-6 ${
                                    selectedRole === 'employer' 
                                        ? 'border-kaamio-primary bg-kaamio-primary/5' 
                                        : 'border-gray-300/60 hover:border-gray-400'
                                }`}
                            >
                                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
                                    <img src="/User research-bro.svg" alt="Employer" className="w-full h-full" />
                                </div>
                                <div className="text-left">
                                    <h3 className={`font-semibold text-base sm:text-lg ${selectedRole === 'employer' ? 'text-kaamio-primary' : 'text-gray-800'}`}>
                                        I need a worker
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500/90">Hire skilled workers</p>
                                </div>
                            </button>
                        </div>
            
                        <button 
                            type="button"
                            onClick={handleRoleSelect}
                            className="mt-6 md:mt-8 w-full h-12 sm:h-14 rounded-full text-sm sm:text-base text-white bg-kaamio-primary hover:bg-kaamio-secondary transition-all"
                        >
                            Continue
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
