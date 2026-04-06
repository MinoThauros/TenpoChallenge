'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SimpleRichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function toPlainTextFromHtml(value: string) {
  if (typeof window === 'undefined') {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const container = window.document.createElement('div');
  container.innerHTML = value;
  return container.textContent?.replace(/\s+\n/g, '\n').trim() ?? '';
}

export function SimpleRichTextEditor({
  value,
  onChange,
  placeholder = 'Write your message here…',
}: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isEmpty = useMemo(() => toPlainTextFromHtml(value).length === 0, [value]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function syncValue() {
    const nextValue = editorRef.current?.innerHTML ?? '';
    onChange(nextValue);
  }

  function runCommand(command: 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList') {
    editorRef.current?.focus();
    document.execCommand(command);
    syncValue();
  }

  return (
    <div className='overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm shadow-black/5'>
      <div className='flex flex-wrap gap-2 border-b border-border/50 px-3 py-3'>
        <Button type='button' variant='outline' size='sm' onClick={() => runCommand('bold')}>
          <Bold className='size-4' />
          Bold
        </Button>
        <Button type='button' variant='outline' size='sm' onClick={() => runCommand('italic')}>
          <Italic className='size-4' />
          Italic
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => runCommand('insertUnorderedList')}
        >
          <List className='size-4' />
          Bullets
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => runCommand('insertOrderedList')}
        >
          <ListOrdered className='size-4' />
          Numbers
        </Button>
      </div>
      <div className='relative min-h-64'>
        {isEmpty ? (
          <div className='pointer-events-none absolute left-4 top-4 text-sm text-muted-foreground'>
            {placeholder}
          </div>
        ) : null}
        <div
          ref={editorRef}
          className='min-h-64 px-4 py-4 text-sm leading-7 outline-none [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6'
          contentEditable
          suppressContentEditableWarning
          onInput={syncValue}
        />
      </div>
    </div>
  );
}
