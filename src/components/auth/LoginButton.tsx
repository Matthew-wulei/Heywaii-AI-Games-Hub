"use client";

import { useState } from "react";
import { LoginModal } from "./LoginModal";

export function LoginButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 text-sm font-medium text-white rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
      >
        Log in
      </button>
      
      <LoginModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}