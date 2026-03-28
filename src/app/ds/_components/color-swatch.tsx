import type { ColorSwatchProps } from './types';

export function ColorSwatch({ name, className, textClass }: ColorSwatchProps) {
  return (
    <div className={`${className} p-4 rounded-md`}>
      <p className={`text-caption font-medium ${textClass}`}>{name}</p>
    </div>
  );
}
