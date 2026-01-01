'use client';

import { useMemo, useState } from 'react';
import SlidePreview from '../components/SlidePreview';
import SlideEditor from '../components/SlideEditor';
import { parseBulk } from '../lib/parseBulk';
import type { GenerateResponse, SlideOverrides } from '../lib/schemas';
import { renderSlide } from '../lib/renderSlide';

const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1080;

export default function HomePage() {
  const [refs, setRefs] = useState<string[]>([]);
  const [bulkText, setBulkText] = useState('Here’s Why Carousels Boost/If you’re not using them, you might be missing out.');
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [response, setResponse] = useState<GenerateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const presetsById = useMemo(() => {
    const map = new Map<string, GenerateResponse['layout_presets'][number]>();
    response?.layout_presets.forEach((preset) => map.set(preset.id, preset));
    return map;
  }, [response]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files).slice(0, 5);
    const uploads = await Promise.all(
      list.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          })
      )
    );
    setRefs(uploads);
  };

  const handleGenerate = async () => {
    setError(null);
    const items = parseBulk(bulkText);
    if (!items.length) {
      setError('Please add at least one line in the bulk input.');
      return;
    }
    if (refs.length === 0) {
      setError('Please upload at least one reference image.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ width, height, refs, items })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate');
      }
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSlide = (index: number, updates: { layout_id?: string; theme?: 'light' | 'orange' | 'dark'; overrides?: SlideOverrides }) => {
    if (!response) return;
    setResponse({
      ...response,
      slides: response.slides.map((slide) =>
        slide.index === index
          ? {
              ...slide,
              layout_id: updates.layout_id ?? slide.layout_id,
              theme: updates.theme ?? slide.theme,
              overrides: updates.overrides ?? slide.overrides
            }
          : slide
      )
    });
  };

  const regenerateSlide = async (index: number) => {
    if (!response) return;
    const slide = response.slides.find((s) => s.index === index);
    if (!slide) return;
    setRegeneratingIndex(index);
    try {
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width,
          height,
          tokens: response.tokens,
          base_css: response.base_css,
          layout_presets: response.layout_presets,
          slide
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to regenerate');
      }
      if (data.slide) {
        setResponse({
          ...response,
          slides: response.slides.map((item) => (item.index === index ? data.slide : item))
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const downloadHtml = () => {
    if (!response) return;
    const slidesHtml = response.slides
      .map((slide) => {
        const preset = presetsById.get(slide.layout_id);
        if (!preset) return '';
        return renderSlide({
          preset,
          content: slide.content,
          overrides: slide.overrides,
          theme: slide.theme,
          width,
          height
        });
      })
      .join('\n');

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>carousel-gen export</title>
<style>${response.base_css}</style>
</head>
<body>${slidesHtml}</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'carousel-slides.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <h1>carousel-gen</h1>
      <p>Create carousel slides that match your reference designs.</p>

      {error && <div className="error">{error}</div>}

      <section className="section grid two">
        <div>
          <h2>1) Reference images</h2>
          <input type="file" accept="image/png,image/jpeg" multiple onChange={(e) => handleFiles(e.target.files)} />
          <div className="badge">{refs.length} / 5 images uploaded</div>
        </div>
        <div>
          <h2>2) Bulk input</h2>
          <textarea
            rows={6}
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            placeholder="Title/Description"
          />
          <div className="badge">One slide per line. Use Title/Description format.</div>
        </div>
      </section>

      <section className="section grid two">
        <div>
          <h2>3) Canvas settings</h2>
          <label>
            Width
            <input type="number" value={width} onChange={(event) => setWidth(Number(event.target.value))} />
          </label>
          <label>
            Height
            <input type="number" value={height} onChange={(event) => setHeight(Number(event.target.value))} />
          </label>
        </div>
        <div>
          <h2>4) Generate</h2>
          <button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate slides'}
          </button>
        </div>
      </section>

      {response && (
        <section className="section">
          <h2>Slides</h2>
          <button onClick={downloadHtml}>Download HTML</button>
          {response.warnings?.length > 0 && (
            <div className="error">
              <strong>Warnings:</strong>
              <ul>
                {response.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="slide-list">
            {response.slides.map((slide) => {
              const preset = presetsById.get(slide.layout_id);
              if (!preset) return null;
              return (
                <div key={slide.index} className="preview-card">
                  <h3>Slide {slide.index + 1}</h3>
                  <SlidePreview
                    preset={preset}
                    content={slide.content}
                    overrides={slide.overrides}
                    theme={slide.theme}
                    width={width}
                    height={height}
                    baseCss={response.base_css}
                  />
                  <SlideEditor
                    presets={response.layout_presets}
                    layoutId={slide.layout_id}
                    theme={slide.theme}
                    overrides={slide.overrides}
                    onChange={(updates) => updateSlide(slide.index, updates)}
                    onRegenerate={() => regenerateSlide(slide.index)}
                    isRegenerating={regeneratingIndex === slide.index}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
