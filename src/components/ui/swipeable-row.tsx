import { useState, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';

interface SwipeableRowProps {
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function SwipeableRow({ children, onEdit, onDelete, className }: SwipeableRowProps) {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const actionWidth = 80;
  const maxSwipe = onEdit && onDelete ? actionWidth * 2 : actionWidth;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;

    const currentX = e.touches[0].clientX;
    const diff = startX.current - currentX;
    
    // Only allow left swipe (negative translateX)
    if (diff > 0) {
      const newTranslate = Math.min(diff, maxSwipe);
      setTranslateX(-newTranslate);
    } else {
      setTranslateX(Math.max(diff * 0.3, -maxSwipe));
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    
    // Snap to open or closed
    if (Math.abs(translateX) > actionWidth / 2) {
      setTranslateX(-maxSwipe);
    } else {
      setTranslateX(0);
    }
  };

  const handleAction = (action: 'edit' | 'delete') => {
    setTranslateX(0);
    if (action === 'edit' && onEdit) {
      setTimeout(onEdit, 200);
    } else if (action === 'delete' && onDelete) {
      setTimeout(onDelete, 200);
    }
  };

  const resetSwipe = () => setTranslateX(0);

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      {/* Action buttons */}
      <div className="absolute inset-y-0 right-0 flex">
        {onEdit && (
          <button
            onClick={() => handleAction('edit')}
            className="flex items-center justify-center w-20 bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => handleAction('delete')}
            className="flex items-center justify-center w-20 bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Swipeable content */}
      <div
        className="relative bg-card transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={translateX !== 0 ? resetSwipe : undefined}
      >
        {children}
      </div>
    </div>
  );
}
