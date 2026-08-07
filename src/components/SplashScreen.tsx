import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface SplashScreenProps {
  appName: string;
  children: React.ReactNode;
}

export default function SplashScreen({ appName, children }: SplashScreenProps) {
  const [showSplash, setShowSplash] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const svgContainerRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Create GSAP timeline
    const tl = gsap.timeline({
      onComplete: () => {
        if (isMounted) {
          // Fade out the splash screen
          gsap.to(containerRef.current, {
            autoAlpha: 0,
            duration: 0.5,
            onComplete: () => {
              if (isMounted) setShowSplash(false);
            }
          });
        }
      }
    });

    fetch('/glitoslogo.svg')
      .then(response => response.text())
      .then(svgText => {
        if (!isMounted) return;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const paths = Array.from(doc.querySelectorAll("path"));
        
        const svgContainer = svgContainerRef.current;
        if (!svgContainer || paths.length === 0) return;

        // Clear any existing content in case of double effects (strict mode)
        svgContainer.innerHTML = '';

        const chickenIndices = [0, 12, 14, 22];
        const litosLetters = [
          [10],      // l
          [11, 13],  // i
          [9],       // t
          [1, 5],    // o
          [8]        // s
        ];
        const friesIndices = [2, 3, 4, 6, 7];
        const taglineIndices = [15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

        const chickenGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const litosGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const friesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const taglineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        chickenIndices.forEach(i => { if (paths[i]) chickenGroup.appendChild(paths[i]) });
        
        const litosElements: SVGGElement[] = [];
        litosLetters.forEach(letterIndices => {
            const letterGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            letterIndices.forEach(i => { if (paths[i]) letterGroup.appendChild(paths[i]) });
            litosGroup.appendChild(letterGroup);
            litosElements.push(letterGroup);
        });

        const friesElements: SVGElement[] = [];
        friesIndices.forEach(i => {
           const fry = paths[i];
           if (fry) {
             friesGroup.appendChild(fry);
             friesElements.push(fry);
           }
        });

        const taglineElements: SVGElement[] = [];
        taglineIndices.forEach(i => {
          if (paths[i]) {
            taglineGroup.appendChild(paths[i]);
            taglineElements.push(paths[i]);
          }
        });

        svgContainer.appendChild(chickenGroup);
        svgContainer.appendChild(litosGroup);
        svgContainer.appendChild(friesGroup);
        svgContainer.appendChild(taglineGroup);

        if (svgWrapperRef.current) svgWrapperRef.current.style.opacity = '1';

        // Initial states
        gsap.set(chickenGroup, { transformOrigin: "50% 100%", scaleY: 0, autoAlpha: 0 });
        gsap.set(litosElements, { autoAlpha: 0, x: -10 });
        gsap.set(friesElements, { autoAlpha: 0, y: 15, scale: 0.8, transformOrigin: "50% 100%" });
        gsap.set(taglineGroup, { autoAlpha: 0, y: 20 });
        gsap.set(textRef.current, { autoAlpha: 0, y: 10 });
        
        // 0.0s - 0.8s: Chicken appears
        tl.to(chickenGroup, { duration: 0.8, scaleY: 1, autoAlpha: 1, ease: "back.out(1.7)" }, 0);

        // 0.7 - 1.5s: "glitos" (litos) reveals
        tl.to(litosElements, { duration: 0.5, autoAlpha: 1, x: 0, stagger: 0.1, ease: "power2.out" }, 0.7);

        // 1.3 - 2.0s: Fries pop
        tl.to(friesElements, { duration: 0.5, autoAlpha: 1, y: 0, scale: 1, stagger: 0.05, ease: "back.out(2)" }, 1.3);

        // 1.9 - 2.5s: Tagline
        tl.to(taglineGroup, { duration: 0.6, autoAlpha: 1, y: 0, ease: "power2.out" }, 1.9);

        // 2.3s - 3.0s: App Name fades in
        tl.to(textRef.current, { duration: 0.7, autoAlpha: 1, y: 0, ease: "power2.out" }, 2.3);

        // 2.5 - 3.2s: Final settle
        tl.fromTo(svgContainer, { scale: 0.98 }, { duration: 0.7, scale: 1, ease: "elastic.out(1, 0.4)" }, 2.5);

      })
      .catch(err => {
        console.error("Failed to load SVG", err);
        // Fallback to hide splash if SVG fails
        setShowSplash(false);
      });

    return () => {
      isMounted = false;
      tl.kill();
    };
  }, []);

  if (!showSplash) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-[9999] bg-white flex flex-col justify-center items-center font-sans tracking-wide"
    >
      <div ref={svgWrapperRef} className="w-full max-w-[600px] p-10 opacity-0 relative">
        <svg 
          ref={svgContainerRef} 
          id="glitos-logo" 
          xmlns="http://www.w3.org/2000/svg" 
          xmlnsXlink="http://www.w3.org/1999/xlink" 
          viewBox="0 0 500 500"
          className="w-full h-auto overflow-visible"
        >
        </svg>
      </div>
      <h1 ref={textRef} className="mt-4 text-3xl font-bold opacity-0 text-slate-800 uppercase tracking-widest text-center">
        {appName}
      </h1>
    </div>
  );
}
