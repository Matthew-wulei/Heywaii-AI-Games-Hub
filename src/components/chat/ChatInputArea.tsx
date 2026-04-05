import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, LogIn } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper function for merging Tailwind classes safely
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatInputAreaProps {
  onSendMessage: (message: string) => void;
  isLoggedIn: boolean;
  onLoginClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSendMessage,
  isLoggedIn,
  onLoginClick,
  className,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height to recalculate
      const newHeight = Math.min(textarea.scrollHeight, 200); // Max height 200px
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  const handleSend = () => {
    if (inputText.trim() && !disabled) {
      onSendMessage(inputText.trim());
      setInputText('');
      
      // Reset height manually after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift/Alt)
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      e.preventDefault(); // Prevent default newline
      handleSend();
    }
  };

  return (
    <div className={cn('relative w-full pb-4 px-4 flex flex-col', className)}>
      {/* Login Banner for Guests */}
      {!isLoggedIn && (
        <div className="mb-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-between shadow-lg">
          <p className="text-sm text-white/80 ml-2">Log in to continue chatting</p>
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <LogIn size={16} />
            Log In
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className={cn(
        "relative rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-2 transition-all duration-200",
        "focus-within:bg-white/10 focus-within:border-white/20 focus-within:shadow-[0_0_15px_rgba(255,255,255,0.05)]",
        (!isLoggedIn || disabled) && "opacity-50 pointer-events-none"
      )}>
        <div className="flex items-end gap-2 pr-12">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter to send text. Alt/Shift+Enter for linebreak."
            disabled={!isLoggedIn || disabled}
            className="w-full max-h-[200px] min-h-[44px] bg-transparent text-white/90 placeholder:text-white/30 resize-none outline-none py-3 px-3 text-[15px] leading-relaxed custom-scrollbar"
            rows={1}
          />
        </div>
        
        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || !isLoggedIn || disabled}
          className={cn(
            "absolute bottom-3 right-3 p-2 rounded-xl flex items-center justify-center transition-all duration-200",
            inputText.trim() && isLoggedIn && !disabled
              ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-500/20"
              : "bg-white/5 text-white/20"
          )}
          aria-label="Send message"
        >
          <Send size={18} className={cn(
            "transition-transform duration-200",
            inputText.trim() && isLoggedIn && !disabled && "translate-x-[1px] -translate-y-[1px]"
          )} />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        `
      }} />
    </div>
  );
};
