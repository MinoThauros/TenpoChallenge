'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { navigation } from './navigation-config';
import type { SidebarNavProps, NavSection } from './types';

export function SidebarNav({ activeSection, filteredNavigation, onNavigate }: SidebarNavProps & { filteredNavigation?: NavSection[] }) {
  const navToRender = filteredNavigation || navigation;
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navRef.current) return;
    const activeLink = navRef.current.querySelector(`[data-section="${activeSection}"]`) as HTMLElement;
    if (activeLink) {
      setIndicatorStyle({
        top: activeLink.offsetTop,
        height: activeLink.offsetHeight,
      });
    }
  }, [activeSection]);

  const scrollToSection = (id: string) => {
    // Notify parent that navigation is happening (to disable scroll spy)
    onNavigate?.();
    
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Space from top of viewport
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <nav ref={navRef} className='relative'>
      {/* Vertical track */}
      <div className='absolute left-0 top-0 bottom-0 w-0.5 bg-muted rounded-full' />

      {/* Active indicator */}
      <div
        className='absolute left-0 w-0.5 bg-primary rounded-full transition-all duration-200'
        style={{ top: indicatorStyle.top, height: indicatorStyle.height }}
      />

      <div className='pl-4 space-y-4'>
        {navToRender.map((section) => (
          <div key={section.id}>
            <button
              data-section={section.id}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                'text-subtitle1 font-medium transition-colors block py-1.5',
                activeSection === section.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {section.title}
            </button>
            <div className='mt-1 space-y-0.5'>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  data-section={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={cn(
                    'text-body2 block py-1 transition-colors',
                    activeSection === item.id
                      ? 'text-primary'
                      : 'text-muted-foreground/70 hover:text-foreground'
                  )}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
