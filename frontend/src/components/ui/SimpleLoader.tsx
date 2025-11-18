'use client';

import React from 'react';

interface SimpleLoaderProps {
  message?: string;
}

export default function SimpleLoader({ message = 'Cargando...' }: SimpleLoaderProps) {
  return (
    <div className="fixed inset-0 bg-white/15 backdrop-blur-[2px] flex items-center justify-center z-40">
      <div className="text-center bg-white/75 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/50">
        {/* Spinner */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
        
        {/* Message */}
        <p className="text-gray-800 font-medium">{message}</p>
      </div>
    </div>
  );
}
