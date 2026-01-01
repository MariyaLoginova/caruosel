import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { LayoutPresetSchema, SlideSchema } from '../../../lib/schemas';

const RegenerateRequestSchema = z.object({
  width: z.number().min(300).max(2000),
  height: z.number().min(300).max(2000),
  tokens: z.record(z.any()),
  base_css: z.string(),
  layout_presets: z.array(LayoutPresetSchema),
  slide: SlideSchema
});

const responseSchema = {
  name: 'carousel_regenerate_response',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['slide'],
    properties: {
      slide: {
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
    }
  }
};

const systemPrompt = `You are a carousel slide generator.\nRegenerate a single slide HTML, keeping tokens and layout presets consistent.\nReturn JSON with updated slide fields.\nUse layout template placeholders and match design system.\nOutput JSON only.`;

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
    const parsed = RegenerateRequestSchema.parse(body);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not set.' }, { status: 500 });
    }

    const client = new OpenAI({ apiKey });

    const prompt = `${systemPrompt}\nCanvas size: ${parsed.width}x${parsed.height}.\nSlide: ${JSON.stringify(parsed.slide)}\nLayout presets: ${JSON.stringify(parsed.layout_presets)}\nTokens: ${JSON.stringify(parsed.tokens)}\nBase CSS: ${parsed.base_css}`;

    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
      response_format: {
        type: 'json_schema',
        json_schema: responseSchema
      },
      temperature: 0.4
    });

    const outputText = extractOutputText(response);
    const json = JSON.parse(outputText);
    const validated = z.object({ slide: SlideSchema }).parse(json);

    return NextResponse.json(validated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
