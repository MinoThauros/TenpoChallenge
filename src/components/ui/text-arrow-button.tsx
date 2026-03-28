import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TextArrowButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  color?: string;
}

const sizeClasses = {
  sm: 'text-base gap-2',
  default: 'text-lg gap-3',
  lg: 'text-xl gap-4',
};

const arrowSizeClasses = {
  sm: 'w-4 h-4',
  default: 'w-5 h-5',
  lg: 'w-6 h-6',
};

/**
 * TextArrowButton - A text-based CTA with an animated arrow and underline effect
 * 
 * Features:
 * - Animated arrow that slides right on hover
 * - Underline animates from left to right on hover
 * - Pointer cursor on hover
 * - Supports multiple sizes
 * 
 * @example
 * ```tsx
 * <TextArrowButton href="/signup">
 *   Start growing your academy
 * </TextArrowButton>
 * ```
 */
export function TextArrowButton({ 
  href, 
  children, 
  className,
  size = 'default',
  color,
}: TextArrowButtonProps) {
  return (
    <Link 
      href={href}
      className={cn(
        'group inline-flex items-center font-medium transition-colors cursor-pointer relative',
        color ? '' : 'text-foreground hover:text-primary',
        sizeClasses[size],
        className
      )}
    >
      <span className='relative'>
        {children}
        {/* Animated underline from left to right */}
        <span 
          className={cn(
            'absolute left-0 bottom-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full',
            color ? `bg-${color}` : 'bg-primary'
          )}
        />
      </span>
      <ArrowRight
        className={cn(
          'transition-transform duration-300 group-hover:translate-x-2',
          arrowSizeClasses[size]
        )}
      />
    </Link>
  );
}
