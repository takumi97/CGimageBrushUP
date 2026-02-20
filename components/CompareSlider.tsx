import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface CompareSliderProps {
  beforeImage: string;
  afterImage: string;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);

  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    handleMove(e.clientX);
  }, [isResizing, handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isResizing) return;
    handleMove(e.touches[0].clientX);
  }, [isResizing, handleMove]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMouseMove, handleTouchMove]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video select-none overflow-hidden rounded-lg shadow-sm border border-gray-200 bg-gray-100"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* After Image (Background - Full) */}
      <img 
        src={afterImage} 
        alt="Enhanced" 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
      />

      {/* Before Image (Foreground - Clipped) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none border-r-2 border-white/50"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={beforeImage} 
          alt="Original" 
          className="absolute inset-0 w-full h-full object-contain max-w-none"
          // We need to force the image to be the full width of the CONTAINER, not the clipped div
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
        />
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute inset-y-0 w-1 bg-white cursor-ew-resize hover:shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-shadow z-20 flex items-center justify-center"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="w-8 h-8 -ml-4 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center">
            <MoveHorizontal className="w-5 h-5 text-gray-900" />
        </div>
      </div>
      
      {/* Labels */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded text-xs font-bold text-gray-900 border border-gray-200 shadow-sm uppercase tracking-wider pointer-events-none">
        Original (Lumion)
      </div>
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded text-xs font-bold text-white border border-black/10 shadow-sm uppercase tracking-wider pointer-events-none">
        Enhanced (Gemini)
      </div>
    </div>
  );
};
