'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NsfwWarningModal } from '@/components/ui/NsfwWarningModal';

interface CharacterDetailClientProps {
  ch: { isNsfw: boolean };
  categoryLabel: string;
  author: string;
  children: React.ReactNode;
}

export const CharacterDetailClient: React.FC<CharacterDetailClientProps> = ({ ch, children }) => {
  const router = useRouter();
  const [showNsfwWarning, setShowNsfwWarning] = useState(false);

  useEffect(() => {
    // Only run on the client side
    if (typeof window !== 'undefined' && ch.isNsfw) {
      const confirmedTimestamp = localStorage.getItem('nsfw_confirmed_timestamp');
      if (!confirmedTimestamp) {
        setTimeout(() => setShowNsfwWarning(true), 0);
      }
    }
  }, [ch.isNsfw]);

  const handleNsfwConfirm = () => {
    localStorage.setItem('nsfw_confirmed_timestamp', Date.now().toString());
    setShowNsfwWarning(false);
  };

  const handleNsfwGoBack = () => {
    router.back();
  };

  return (
    <>
      {showNsfwWarning && (
        <NsfwWarningModal onConfirm={handleNsfwConfirm} onGoBack={handleNsfwGoBack} />
      )}
      <div className={`${showNsfwWarning ? 'blur-md pointer-events-none' : ''}`}>
        {children}
      </div>
    </>
  );
};
