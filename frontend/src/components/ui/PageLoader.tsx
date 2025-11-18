'use client';

import React from 'react';

interface PageLoaderProps {
  message?: string;
}

export default function PageLoader({ message = 'Cargando...' }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="text-center bg-white/70 backdrop-blur-md rounded-2xl px-10 py-8 shadow-2xl border border-white/50">
        {/* Animated Logo/Spinner */}
        <div className="relative w-20 h-20 mx-auto mb-5">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-60"></div>
          
          {/* Middle ring */}
          <div className="absolute inset-2 border-4 border-blue-400 rounded-full animate-spin" 
               style={{ animationDuration: '1.5s' }}></div>
          
          {/* Inner circle with icon */}
          <div className="absolute inset-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <svg 
              className="w-8 h-8 text-white animate-pulse" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
          </div>
        </div>

        {/* Loading text with animation */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 animate-fade-in">
            {message}
          </h3>
          
          {/* Animated dots */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" 
                 style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" 
                 style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" 
                 style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
