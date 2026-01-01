import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GenerateRequestSchema, GenerateResponseSchema } from '../../../lib/schemas';

const responseSchema = {
  name: 'carousel_generate_response',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['tokens', 'base_css', 'layout_presets', 'slide_defaults', 'slides', 'warnings'],
    properties: {
      tokens: {
        type: 'object',
        additionalProperties: false,
        required: ['colors', 'fonts', 'spacing', 'typeScale', 'radii'],
        properties: {
          colors: { type: 'object', additionalProperties: { type: 'string' } },
          fonts: { type: 'object', additionalProperties: { type: 'string' } },
          spacing: { type: 'object', additionalProperties: { type: 'string' } },
          typeScale: { type: 'object', additionalProperties: { type: 'string' } },
          radii: { type: 'object', additionalProperties: { type: 'string' } }
        }
      },
      base_css: { type: 'string' },
      layout_presets: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'description', 'template_html', 'editable_overrides_schema'],
          properties: {
            id: { type: 'string' },
            description: { type: 'string' },
            template_html: { type: 'string' },
            editable_overrides_schema: { type: 'object' }
          }
        }
      },
      slide_defaults: {
        type: 'object',
        additionalProperties: false,
        properties: {
          accent_word: { type: 'string' },
          accent_style: { type: 'string' },
          headline_align: { type: 'string' },
          headline_max_w: { type: 'number' },
          headline_y: { type: 'number' },
          subhead_max_w: { type: 'number' },
          subhead_y: { type: 'number' },
          cta_text: { type: 'string' },
          footer_variant: { type: 'string' },
          page_number: { type: 'string' }
        }
      },
      slides: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['index', 'layout_id', 'theme', 'content', 'overrides', 'html'],
          properties: {
            index: { type: 'number' },
            layout_id: { type: 'string' },
            theme: { type: 'string', enum: ['light', 'orange', 'dark'] },
            content: {
              type: 'object',
              additionalProperties: false,
              required: ['title'],
              properties: {
                title: { type: 'string' },
                description: { type: 'string' }
              }
            },
            overrides: {
              type: 'object',
              additionalProperties: false,
              properties: {
                accent_word: { type: 'string' },
                accent_style: { type: 'string' },
                headline_align: { type: 'string' },
                headline_max_w: { type: 'number' },
                headline_y: { type: 'number' },
                subhead_max_w: { type: 'number' },
                subhead_y: { type: 'number' },
                cta_text: { type: 'string' },
                footer_variant: { type: 'string' },
                page_number: { type: 'string' }
              }
            },
            html: { type: 'string' }
          }
        }
      },
      warnings: { type: 'array', items: { type: 'string' } }
    }
  }
};

const systemPrompt = `You are a design system generator for carousel slides.\n\nAnalyze reference images and output JSON with:\n- design tokens\n- base_css for .slide themes\n- 8 layout presets with template_html (placeholders {{title}}, {{description}}, {{cta_text}}, {{page_number}})\n- slide_defaults overrides\n- slides: choose layout_id, theme, overrides, and html for each input item\n\nRequirements:\n- 3 themes: light (white/beige + black), orange background, dark background.\n- Bold grotesk, very large headlines, tight line-height (0.92-1.02), slightly negative letter spacing.\n- Large padding, pills/badges, corner mark, footer logo + page number, micro CTA.\n- Accent highlight: orange hand-drawn ellipse around a single word (use span.accent + SVG or pseudo).\n- Base CSS must support overrides via CSS variables on .slide:\n  --headline-max-w, --headline-y, --subhead-max-w, --subhead-y, --headline-align.\n- Each template should include elements with classes: .headline, .subhead, .pill, .footer, .brand-mark.\n- Output JSON only matching schema.\n`;

const extractOutputText = (response: OpenAI.Responses.Response) => {
  if ('output_text' in response && typeof response.output_text === 'string') {
    return response.output_text;
  }
  const pieces: string[] = [];
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text') {
        pieces.push(content.text);
      }
    }
  }
  return pieces.join('');
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = GenerateRequestSchema.parse(body);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not set.' }, { status: 500 });
    }

    const client = new OpenAI({ apiKey });

    const inputContent = [
      {
        type: 'input_text' as const,
        text: `${systemPrompt}\nCanvas size: ${parsed.width}x${parsed.height}.\nItems: ${JSON.stringify(parsed.items)}`
      },
      ...parsed.refs.map((ref) => ({
        type: 'input_image' as const,
        image_url: { url: ref }
      }))
    ];

    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [{ role: 'user', content: inputContent }],
      response_format: {
        type: 'json_schema',
        json_schema: responseSchema
      },
      temperature: 0.4
    });

    const outputText = extractOutputText(response);
    const json = JSON.parse(outputText);
    const validated = GenerateResponseSchema.parse(json);

    return NextResponse.json(validated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
