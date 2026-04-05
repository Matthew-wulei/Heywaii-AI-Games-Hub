'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface NsfwWarningModalProps {
  onConfirm: () => void;
  onGoBack: () => void;
}

export const NsfwWarningModal: React.FC<NsfwWarningModalProps> = ({ onConfirm, onGoBack }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-background-paper border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4">Age Restricted Content</h2>
        
        <p className="text-text-secondary mb-8 leading-relaxed">
          This character contains NSFW (Not Safe For Work) content. By proceeding, you confirm that you are at least 18 years old and consent to viewing adult material.
        </p>
        
        <div className="flex flex-col w-full gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
          >
            I am 18 or older
          </button>
          
          <button
            onClick={onGoBack}
            className="w-full py-3 px-6 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
