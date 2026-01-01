import { z } from 'zod';

export const SlideOverridesSchema = z.object({
  accent_word: z.string().optional(),
  accent_style: z.enum(['ellipse', 'underline', 'none']).optional(),
  headline_align: z.enum(['left', 'center']).optional(),
  headline_max_w: z.number().min(10).max(60).optional(),
  headline_y: z.number().min(-100).max(100).optional(),
  subhead_max_w: z.number().min(10).max(60).optional(),
  subhead_y: z.number().min(-100).max(100).optional(),
  cta_text: z.string().optional(),
  footer_variant: z.enum(['logo-left', 'logo-right', 'minimal']).optional(),
  page_number: z.string().optional()
});

export type SlideOverrides = z.infer<typeof SlideOverridesSchema>;

export const GenerateRequestSchema = z.object({
  width: z.number().min(300).max(2000),
  height: z.number().min(300).max(2000),
  refs: z.array(z.string()).min(1).max(5),
  items: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().optional()
    })
  )
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

const TokensSchema = z.object({
  colors: z.record(z.string()),
  fonts: z.record(z.string()),
  spacing: z.record(z.string()),
  typeScale: z.record(z.string()),
  radii: z.record(z.string())
});

export const LayoutPresetSchema = z.object({
  id: z.string(),
  description: z.string(),
  template_html: z.string(),
  editable_overrides_schema: z.record(z.any())
});

export const SlideSchema = z.object({
  index: z.number(),
  layout_id: z.string(),
  theme: z.enum(['light', 'orange', 'dark']),
  content: z.object({
    title: z.string(),
    description: z.string().optional()
  }),
  overrides: SlideOverridesSchema,
  html: z.string()
});

export const GenerateResponseSchema = z.object({
  tokens: TokensSchema,
  base_css: z.string(),
  layout_presets: z.array(LayoutPresetSchema).min(1),
  slide_defaults: SlideOverridesSchema,
  slides: z.array(SlideSchema).min(1),
  warnings: z.array(z.string())
});

export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;
