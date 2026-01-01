'use client';

import type { LayoutPreset, SlideContent } from '../lib/renderSlide';
import type { SlideOverrides } from '../lib/schemas';
import { renderSlide } from '../lib/renderSlide';

interface SlidePreviewProps {
  preset: LayoutPreset;
  content: SlideContent;
  overrides: SlideOverrides;
  theme: 'light' | 'orange' | 'dark';
  width: number;
  height: number;
  baseCss: string;
}

export default function SlidePreview({
  preset,
  content,
  overrides,
  theme,
  width,
  height,
  baseCss
}: SlidePreviewProps) {
  const html = renderSlide({ preset, content, overrides, theme, width, height });

  return (
    <div className="preview-frame">
      <style>{baseCss}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
