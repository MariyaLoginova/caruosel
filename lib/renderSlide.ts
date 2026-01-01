import type { LayoutPresetSchema, SlideOverrides } from './schemas';
import type { z } from 'zod';

export type LayoutPreset = z.infer<typeof LayoutPresetSchema>;

export type SlideContent = {
  title: string;
  description?: string;
};

export type RenderSlideInput = {
  preset: LayoutPreset;
  content: SlideContent;
  theme: 'light' | 'orange' | 'dark';
  overrides: SlideOverrides;
  width: number;
  height: number;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const applyAccentWord = (title: string, accentWord?: string, accentStyle?: string) => {
  if (!accentWord || accentStyle === 'none') {
    return escapeHtml(title);
  }
  const regex = new RegExp(`\\b${escapeRegExp(accentWord)}\\b`, 'i');
  const match = title.match(regex);
  if (!match || match.index === undefined) {
    return escapeHtml(title);
  }
  const className = accentStyle === 'underline' ? 'accent accent--underline' : 'accent accent--ellipse';
  const before = escapeHtml(title.slice(0, match.index));
  const matched = escapeHtml(match[0]);
  const after = escapeHtml(title.slice(match.index + match[0].length));
  return `${before}<span class="${className}">${matched}</span>${after}`;
};

export function renderSlide(input: RenderSlideInput): string {
  const { preset, content, theme, overrides, width, height } = input;
  const descriptionText = content.description ? escapeHtml(content.description) : '';
  const titleWithAccent = applyAccentWord(content.title, overrides.accent_word, overrides.accent_style);

  const html = preset.template_html
    .replace(/{{title}}/g, titleWithAccent)
    .replace(/{{description}}/g, descriptionText)
    .replace(/{{cta_text}}/g, escapeHtml(overrides.cta_text ?? 'Swipe to learn'))
    .replace(/{{page_number}}/g, escapeHtml(overrides.page_number ?? '01'));

  const cssVars = [
    `--headline-max-w:${overrides.headline_max_w ?? 28}rem`,
    `--headline-y:${overrides.headline_y ?? 0}px`,
    `--subhead-max-w:${overrides.subhead_max_w ?? 22}rem`,
    `--subhead-y:${overrides.subhead_y ?? 0}px`,
    `--headline-align:${overrides.headline_align ?? 'left'}`,
    `--slide-w:${width}px`,
    `--slide-h:${height}px`
  ].join(';');

  return `<section class="slide theme--${theme} layout--${preset.id}" style="${cssVars}">${html}</section>`;
}
