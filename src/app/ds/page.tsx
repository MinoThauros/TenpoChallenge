'use client';

import Image from 'next/image';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

import {
  SidebarNav,
  BasicSection,
  StylingSection,
  ActionsSection,
  FormsSection,
  DataDisplaySection,
  FeedbackSection,
  OverlaysSection,
  allSectionIds,
  navigation,
  formSchema,
  type FormValues,
} from './_components';

export default function DesignSystemDemo() {
  const [activeSection, setActiveSection] = useState('basic');
  const [searchQuery, setSearchQuery] = useState('');
  const previousSearchQuery = useRef('');
  const isScrollingProgrammatically = useRef(false);
  const scrollSpyEnabled = useRef(false);

  // Filter navigation based on search query
  const filteredNavigation = useMemo(() => {
    if (!searchQuery.trim()) return navigation;

    const query = searchQuery.toLowerCase();

    return navigation
      .map((section) => {
        // Check if section title matches
        const sectionMatches = section.title.toLowerCase().includes(query);

        // Filter items that match
        const filteredItems = section.items.filter((item) =>
          item.title.toLowerCase().includes(query)
        );

        // Include section if it matches or has matching items
        if (sectionMatches || filteredItems.length > 0) {
          return {
            ...section,
            items: sectionMatches ? section.items : filteredItems,
          };
        }

        return null;
      })
      .filter((section): section is NonNullable<typeof section> => section !== null);
  }, [searchQuery]);

  // Get all visible section IDs based on filtered navigation
  const visibleSectionIds = useMemo(() => {
    return filteredNavigation.flatMap(section => [
      section.id,
      ...section.items.map(item => item.id),
    ]);
  }, [filteredNavigation]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      childName: '',
      email: '',
      age: '',
      terms: false,
    },
  });

  function onSubmit(values: FormValues) {
    console.log(values);
  }

  // Handle manual navigation clicks
  const handleNavigate = () => {
    scrollSpyEnabled.current = false;
    isScrollingProgrammatically.current = true;
    
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
      // scrollSpyEnabled stays false until user manually scrolls again
    }, 1000);
  };

  // Scroll to top on initial page load
  useEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Scroll to top on mount - scroll spy stays disabled until user scrolls
    scrollSpyEnabled.current = false;
    isScrollingProgrammatically.current = true;
    window.scrollTo(0, 0);
    
    // Mark programmatic scroll as done
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
      // Note: scrollSpyEnabled stays false until user manually scrolls
    }, 1000);
  }, []);

  // Auto-scroll to first search result or top when cleared
  useEffect(() => {
    const hadSearch = previousSearchQuery.current.trim().length > 0;
    const hasSearch = searchQuery.trim().length > 0;
    
    if (hasSearch && filteredNavigation.length > 0) {
      // User is searching - scroll to first result
      scrollSpyEnabled.current = false;
      isScrollingProgrammatically.current = true;
      
      const firstSection = filteredNavigation[0];
      const firstItemId = firstSection.items.length > 0 
        ? firstSection.items[0].id 
        : firstSection.id;
      
      const element = document.getElementById(firstItemId);
      
      if (element) {
        const offset = 100; // Space from top of viewport
        const top = element.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      
      // Mark programmatic scroll as done, but keep scroll spy disabled
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
        // scrollSpyEnabled stays false until user manually scrolls
      }, 1000);
    } else if (hadSearch && !hasSearch) {
      // Search was just cleared - scroll to top
      scrollSpyEnabled.current = false;
      isScrollingProgrammatically.current = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Mark programmatic scroll as done, but keep scroll spy disabled
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
        // scrollSpyEnabled stays false until user manually scrolls
      }, 1000);
    }
    
    // Update the previous search query
    previousSearchQuery.current = searchQuery;
  }, [searchQuery, filteredNavigation]);

  // Scroll spy - find section closest to top of viewport
  useEffect(() => {
    const handleScroll = () => {
      // If user is manually scrolling (not programmatic), enable scroll spy
      if (!isScrollingProgrammatically.current && !scrollSpyEnabled.current) {
        scrollSpyEnabled.current = true;
      }
      
      // Don't update active section during programmatic scrolls
      if (isScrollingProgrammatically.current) return;
      
      // Now that scroll spy is enabled (by user scroll), track the active section
      if (!scrollSpyEnabled.current) return;
      
      const scrollY = window.scrollY + 100; // Offset for better UX

      let currentSection = 'basic';

      // Only track sections that are currently visible (not filtered out)
      const sectionsToTrack = visibleSectionIds.length > 0 ? visibleSectionIds : allSectionIds;

      // Find the section that's currently at the top of the viewport
      for (const id of sectionsToTrack) {
        const element = document.getElementById(id);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + window.scrollY;

        if (elementTop <= scrollY) {
          currentSection = id;
        } else {
          break;
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [visibleSectionIds]);

  return (
    <div className='min-h-screen bg-background'>
      {/* Sidebar */}
      <aside className='fixed left-0 top-0 h-screen w-64 border-r bg-background flex flex-col hidden lg:flex'>
        {/* Sticky Header - Logo & Search */}
        <div className='p-8 pb-0 shrink-0'>
          <div className='mb-6'>
            <Image
              src='/images/logo/wordmark/wordmark-pitch-green.svg'
              alt='Tenpo'
              width={120}
              height={42}
            />
            <p className='text-caption text-muted-foreground mt-1'>Design System</p>
          </div>

          {/* Search */}
          <div className='mb-6'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none' />
              <Input
                type='text'
                placeholder='Search...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 h-9 text-body2'
              />
            </div>
            {searchQuery && (
              <p className='text-caption text-muted-foreground mt-2'>
                {filteredNavigation.length === 0
                  ? 'No results found'
                  : `${filteredNavigation.reduce((acc, section) => acc + section.items.length, 0)} component${filteredNavigation.reduce((acc, section) => acc + section.items.length, 0) === 1 ? '' : 's'} found`}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className='flex-1 overflow-y-auto px-8 pb-8'>
          <SidebarNav 
            activeSection={activeSection} 
            filteredNavigation={filteredNavigation}
            onNavigate={handleNavigate}
          />
        </div>
      </aside>

      {/* Main content */}
      <main className='lg:pl-64'>
        <div className='max-w-5xl mx-auto p-8 md:p-16 space-y-16'>
          {/* <DSHeader /> */}

          {visibleSectionIds.includes('basic') && (
            <>
              <BasicSection />
              <Separator />
            </>
          )}

          {visibleSectionIds.includes('styling') && (
            <>
              <StylingSection />
              <Separator />
            </>
          )}

          {visibleSectionIds.includes('actions') && (
            <>
              <ActionsSection />
              <Separator />
            </>
          )}

          {visibleSectionIds.includes('forms') && (
            <>
              <FormsSection form={form} onSubmit={onSubmit} />
              <Separator />
            </>
          )}

          {visibleSectionIds.includes('data-display') && (
            <>
              <DataDisplaySection />
              <Separator />
            </>
          )}

          {/* TEMPORARILY DISABLED to test if this section causes the pagination jump
          {visibleSectionIds.includes("navigation") && (
            <>
              <NavigationSection />
              <Separator />
            </>
          )}
          */}

          {visibleSectionIds.includes('feedback') && (
            <>
              <FeedbackSection />
              <Separator />
            </>
          )}

          {visibleSectionIds.includes('overlays') && (
            <>
              <OverlaysSection />
              <Separator />
            </>
          )}

          {/* Footer */}
          <footer className='pt-16 pb-8 text-center'>
            <p className='text-caption text-muted-foreground'>
              Tenpo Design System • Built with shadcn/ui + Tailwind CSS 4
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
