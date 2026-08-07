import React, { useState, useEffect } from 'react';
import { 
  BreakfastIcon, 
  ChickenIcon, 
  ChipsIcon, 
  DrinksIcon, 
  PackagingIcon 
} from './CategoryIcons';

interface CategoryItem {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryItem[] = [
  { id: '1', title: 'Breakfast\n& Snacks', icon: <BreakfastIcon size="55%" className="mx-auto" /> },
  { id: '2', title: 'Chicken', icon: <ChickenIcon size="55%" className="mx-auto" /> },
  { id: '3', title: 'Chips & Sides', icon: <ChipsIcon size="55%" className="mx-auto" /> },
  { id: '4', title: 'Drinks', icon: <DrinksIcon size="55%" className="mx-auto" /> },
  { id: '5', title: 'Packaging', icon: <PackagingIcon size="55%" className="mx-auto" /> },
];

export const CategoryBubbles: React.FC<{
  onSelectCategory?: (id: string) => void;
  activeCategory?: string | null;
}> = ({ onSelectCategory, activeCategory }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation shortly after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full relative flex flex-col font-sans -mx-5 px-5 lg:-mx-10 lg:px-10 mt-[-24px]">
      
      {/* 
        YELLOW TRANSITION 
        This bridges the DeliveryApp's yellow header to the white background
      */}
      <div className="w-full bg-[#FFC533] h-12 relative flex flex-col items-center mb-6 z-0">
        <div 
          className="absolute bottom-0 left-0 w-full h-[40px] md:h-[60px]"
          style={{
            background: 'var(--color-brand-background)',
            borderTopLeftRadius: '50% 100%',
            borderTopRightRadius: '50% 100%',
          }}
        />
      </div>

      {/* CATEGORIES SECTION */}
      <div className="w-full max-w-lg mx-auto pb-10 relative z-10 flex flex-col items-center">
        <h2 className="text-[#222222] text-[24px] font-semibold mb-8 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Categories
        </h2>

        {/* The bubbles grid */}
        <div className="grid grid-cols-2 gap-y-7 gap-x-5 w-full justify-items-center sm:gap-x-8">
          {CATEGORIES.map((cat, index) => {
            const isLast = index === CATEGORIES.length - 1;
            const isSelected = activeCategory === cat.title;

            return (
              <div 
                key={cat.id}
                onClick={() => onSelectCategory?.(cat.title)}
                className={`
                  cursor-pointer group flex items-center justify-center
                  ${isLast ? 'col-span-2' : 'col-span-1'}
                `}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(15px) scale(0.96)',
                  transition: `opacity 400ms ease ${index * 70}ms, transform 400ms ease ${index * 70}ms`,
                }}
              >
                {/* The Bubble Container */}
                <div 
                  className={`
                    relative flex flex-col items-center justify-between
                    w-[155px] h-[155px] sm:w-[170px] sm:h-[170px] md:w-[190px] md:h-[190px]
                    rounded-full bg-white
                    transition-all duration-[180ms] ease-out
                    active:scale-95 hover:scale-[1.03]
                  `}
                  style={{
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.07)',
                    ...(isSelected ? { boxShadow: '0 0 0 3px #FFC533, 0 8px 24px rgba(0, 0, 0, 0.1)' } : {})
                  }}
                >
                  <div className="flex-1 w-full flex items-end justify-center pb-1">
                    {cat.icon}
                  </div>
                  <div className="h-[45%] w-full flex items-start justify-center px-4 pt-1 pb-4">
                    <span 
                      className="text-[14px] font-medium text-[#222222] text-center leading-snug whitespace-pre-wrap"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {cat.title}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryBubbles;
