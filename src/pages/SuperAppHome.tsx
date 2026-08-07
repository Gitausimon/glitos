import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, User, Gift, Star } from 'lucide-react';
import { BreakfastIcon, ChickenIcon, ChipsIcon, DrinksIcon, PackagingIcon } from '../components/CategoryIcons';

export default function SuperAppHome() {
  const navigate = useNavigate();
  // State for subtle entry animation
  const [isLoaded, setIsLoaded] = useState(false);

  React.useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleCategoryClick = (category: string) => {
    // Navigate to delivery app with this category automatically selected.
    // Assuming DeliveryApp will consume route state
    navigate('/delivery', { state: { activeCategory: category } });
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#FFC533] overflow-hidden flex flex-col font-sans">
      
      {/* 
        HEADER SECTION 
      */}
      <div className="w-full px-5 pt-12 pb-4 z-20 flex flex-col">
        {/* Top Icons */}
        <div className="flex justify-between items-center mb-6">
          <div className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center bg-white/20">
            <User className="text-white w-5 h-5" />
          </div>
          
          <div className="flex flex-col items-center cursor-pointer">
            <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Delivering to</span>
            <div className="flex items-center gap-1 text-white font-bold text-sm">
              Current location <span className="text-xs">▼</span>
            </div>
          </div>

          <div className="w-10 h-10 flex items-center justify-center">
            <Gift className="text-white w-6 h-6" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full shadow-lg rounded-full overflow-hidden">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="What do you need?" 
            readOnly
            onClick={() => navigate('/delivery')}
            className="w-full pl-12 pr-4 py-3.5 bg-white border-none outline-none font-medium text-gray-600"
          />
        </div>
      </div>

      {/* 
        RADIAL CATEGORY CLUSTER SECTION
      */}
      <div className="flex-1 flex items-center justify-center w-full z-10 relative mt-[-20px]">
        
        {/* The containing cluster box */}
        <div 
          className="relative transition-all duration-700 ease-out"
          style={{ 
            width: '320px', 
            height: '340px',
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'scale(1)' : 'scale(0.95)'
          }}
        >
          {/* 
            BUBBLE CSS
            - Use aspect-ratio: 1; border-radius: 50% for perfect circle.
            - Soft shadow.
            - Interaction scaling.
          */}
          <style dangerouslySetInnerHTML={{__html: `
            .cluster-bubble {
              position: absolute;
              width: 86px;
              aspect-ratio: 1;
              border: none;
              border-radius: 50%;
              background: #ffffff;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08), 0 5px 12px rgba(0, 0, 0, 0.06);
              transition: transform 0.2s ease, box-shadow 0.2s ease;
              cursor: pointer;
              z-index: 10;
            }
            .cluster-bubble:hover, .cluster-bubble:active {
              transform: scale(1.06) !important;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.14);
              z-index: 20;
            }
            .bubble-icon {
              width: 50px;
              height: 50px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: -2px;
            }
            .bubble-label {
              margin-top: 4px;
              font-size: 11px;
              font-weight: 600;
              color: #222222;
              text-align: center;
              line-height: 1.1;
            }
            
            /* Center */
            .bubble-anything {
              top: 50%;
              left: 50%;
              margin-top: -43px;
              margin-left: -43px;
              width: 96px;
              height: 96px;
              transform: scale(1);
              z-index: 5;
            }
            .bubble-anything .bubble-icon { width: 58px; height: 58px; }
            .bubble-anything .bubble-label { font-size: 13px; }

            /* Orbiting - modified for 5 items */
            .bubble-breakfast {
              top: 5px;
              left: 50%;
              margin-left: -43px;
            }
            .bubble-chicken {
              top: 75px;
              right: 15px;
            }
            .bubble-drinks {
              top: 75px;
              left: 15px;
            }
            .bubble-chips {
              bottom: 40px;
              right: 40px;
            }
            .bubble-packaging {
              bottom: 40px;
              left: 40px;
            }
          `}} />

          {/* Center Bubble */}
          <button className="cluster-bubble bubble-anything" onClick={() => handleCategoryClick('All')}>
             <div className="bubble-icon">
               {/* Star/Magic Wand placeholder */}
               <div className="text-yellow-400 rotate-12">
                 <Star className="w-8 h-8 fill-current drop-shadow-sm" />
               </div>
             </div>
             <span className="bubble-label">Anything</span>
          </button>

          {/* Orbiting Bubbles */}
          <button className="cluster-bubble bubble-breakfast" onClick={() => handleCategoryClick('Breakfast & Snacks')}>
            <div className="bubble-icon"><BreakfastIcon size="100%" /></div>
            <span className="bubble-label">Breakfast</span>
          </button>

          <button className="cluster-bubble bubble-chicken" onClick={() => handleCategoryClick('Chicken')}>
            <div className="bubble-icon"><ChickenIcon size="100%" /></div>
            <span className="bubble-label">Chicken</span>
          </button>

          <button className="cluster-bubble bubble-drinks" onClick={() => handleCategoryClick('Drinks')}>
            <div className="bubble-icon"><DrinksIcon size="100%" /></div>
            <span className="bubble-label">Drinks</span>
          </button>

          <button className="cluster-bubble bubble-chips" onClick={() => handleCategoryClick('Chips & Sides')}>
            <div className="bubble-icon"><ChipsIcon size="100%" /></div>
            <span className="bubble-label">Chips<br/>& Sides</span>
          </button>

          <button className="cluster-bubble bubble-packaging" onClick={() => handleCategoryClick('Packaging')}>
            <div className="bubble-icon"><PackagingIcon size="100%" /></div>
            <span className="bubble-label">Packaging</span>
          </button>

        </div>
      </div>

      {/* 
        BOTTOM CURVE & LOGO
        "add the glitos logo not the location icon"
      */}
      <div className="w-full relative h-[100px] z-20 flex-shrink-0 flex items-end justify-center pointer-events-none">
        
        {/* Concave White Shape pulling up from the bottom */}
        <div 
          className="absolute bottom-0 left-0 w-full h-full bg-white transition-colors"
          style={{
            borderTopLeftRadius: '50% 100%',
            borderTopRightRadius: '50% 100%',
          }}
        />

        {/* The Logo embedded in the white sheet */}
        <div className="relative z-30 pb-4 h-full flex flex-col items-center justify-end">
          <img src="/glitoslogo.svg" alt="Glitos Logo" className="h-[52px] w-auto opacity-95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)]" />
        </div>
      </div>

    </div>
  );
}
