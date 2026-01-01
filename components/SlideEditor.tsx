'use client';

import type { LayoutPreset } from '../lib/renderSlide';
import type { SlideOverrides } from '../lib/schemas';

interface SlideEditorProps {
  presets: LayoutPreset[];
  layoutId: string;
  theme: 'light' | 'orange' | 'dark';
  overrides: SlideOverrides;
  onChange: (next: {
    layout_id?: string;
    theme?: 'light' | 'orange' | 'dark';
    overrides?: SlideOverrides;
  }) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export default function SlideEditor({
  presets,
  layoutId,
  theme,
  overrides,
  onChange,
  onRegenerate,
  isRegenerating
}: SlideEditorProps) {
  const updateOverrides = (partial: Partial<SlideOverrides>) => {
    onChange({ overrides: { ...overrides, ...partial } });
  };

  return (
    <div className="controls">
      <label>
        Layout preset
        <select
          value={layoutId}
          onChange={(event) => onChange({ layout_id: event.target.value })}
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.description}
            </option>
          ))}
        </select>
      </label>

      <label>
        Theme
        <select
          value={theme}
          onChange={(event) => onChange({ theme: event.target.value as 'light' | 'orange' | 'dark' })}
        >
          <option value="light">Light</option>
          <option value="orange">Orange</option>
          <option value="dark">Dark</option>
        </select>
      </label>

      <label>
        Accent word
        <input
          type="text"
          value={overrides.accent_word ?? ''}
          onChange={(event) => updateOverrides({ accent_word: event.target.value })}
        />
      </label>

      <label>
        Accent style
        <select
          value={overrides.accent_style ?? 'ellipse'}
          onChange={(event) =>
            updateOverrides({ accent_style: event.target.value as 'ellipse' | 'underline' | 'none' })
          }
        >
          <option value="ellipse">Ellipse</option>
          <option value="underline">Underline</option>
          <option value="none">None</option>
        </select>
      </label>

      <label>
        Headline align
        <select
          value={overrides.headline_align ?? 'left'}
          onChange={(event) => updateOverrides({ headline_align: event.target.value as 'left' | 'center' })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
        </select>
      </label>

      <div className="range">
        <label>Headline max width</label>
        <input
          type="range"
          min={12}
          max={50}
          value={overrides.headline_max_w ?? 28}
          onChange={(event) => updateOverrides({ headline_max_w: Number(event.target.value) })}
        />
      </div>

      <div className="range">
        <label>Headline Y</label>
        <input
          type="range"
          min={-80}
          max={80}
          value={overrides.headline_y ?? 0}
          onChange={(event) => updateOverrides({ headline_y: Number(event.target.value) })}
        />
      </div>

      <div className="range">
        <label>Subhead max width</label>
        <input
          type="range"
          min={12}
          max={50}
          value={overrides.subhead_max_w ?? 22}
          onChange={(event) => updateOverrides({ subhead_max_w: Number(event.target.value) })}
        />
      </div>

      <div className="range">
        <label>Subhead Y</label>
        <input
          type="range"
          min={-80}
          max={80}
          value={overrides.subhead_y ?? 0}
          onChange={(event) => updateOverrides({ subhead_y: Number(event.target.value) })}
        />
      </div>

      <label>
        CTA text
        <input
          type="text"
          value={overrides.cta_text ?? ''}
          onChange={(event) => updateOverrides({ cta_text: event.target.value })}
        />
      </label>

      <label>
        Footer variant
        <select
          value={overrides.footer_variant ?? 'logo-left'}
          onChange={(event) =>
            updateOverrides({ footer_variant: event.target.value as 'logo-left' | 'logo-right' | 'minimal' })
          }
        >
          <option value="logo-left">Logo left</option>
          <option value="logo-right">Logo right</option>
          <option value="minimal">Minimal</option>
        </select>
      </label>

      <label>
        Page number
        <input
          type="text"
          value={overrides.page_number ?? ''}
          onChange={(event) => updateOverrides({ page_number: event.target.value })}
        />
      </label>

      <button type="button" onClick={onRegenerate} disabled={isRegenerating}>
        {isRegenerating ? 'Regenerating...' : 'Regenerate slide'}
      </button>
    </div>
  );
}
