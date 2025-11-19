'use client';

import NextImage from 'next/image';
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

type SceneConfig = {
  label: string;
  gradientStops: { color: string; position: number }[];
  overlays?: { x: number; y: number; radius: number; color: string }[];
};

const sceneBackgrounds: Record<string, SceneConfig> = {
  studio: {
    label: 'Soft Studio',
    gradientStops: [
      { color: '#f8fafc', position: 0 },
      { color: '#e2e8f0', position: 0.45 },
      { color: '#eef2ff', position: 1 }
    ],
    overlays: [{ x: 0.25, y: 0.25, radius: 0.55, color: 'rgba(99, 102, 241, 0.18)' }]
  },
  neon: {
    label: 'Neon Pop',
    gradientStops: [
      { color: '#0f172a', position: 0 },
      { color: '#1e293b', position: 0.45 },
      { color: '#4c1d95', position: 1 }
    ],
    overlays: [
      { x: 0.75, y: 0.25, radius: 0.5, color: 'rgba(16, 185, 129, 0.32)' },
      { x: 0.2, y: 0.8, radius: 0.65, color: 'rgba(59, 130, 246, 0.25)' }
    ]
  },
  sunset: {
    label: 'Sunset Glow',
    gradientStops: [
      { color: '#fef3c7', position: 0 },
      { color: '#f97316', position: 0.55 },
      { color: '#ef4444', position: 1 }
    ],
    overlays: [{ x: 0.25, y: 0.25, radius: 0.6, color: 'rgba(254, 240, 138, 0.4)' }]
  },
  slate: {
    label: 'Graphite',
    gradientStops: [
      { color: '#1f2937', position: 0 },
      { color: '#111827', position: 1 }
    ],
    overlays: [{ x: 0.2, y: 0.85, radius: 0.65, color: 'rgba(148, 163, 184, 0.28)' }]
  }
};

const downloadWidth = 1600;
const downloadHeight = 1200;

export default function Page() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState('product-shot.png');
  const [brightness, setBrightness] = useState(1.12);
  const [contrast, setContrast] = useState(1.08);
  const [saturation, setSaturation] = useState(1.18);
  const [blur, setBlur] = useState(0);
  const [backgroundMode, setBackgroundMode] = useState<'gradient' | 'solid' | 'scene'>('gradient');
  const [solidColor, setSolidColor] = useState('#f8fafc');
  const [gradientStart, setGradientStart] = useState('#eef2ff');
  const [gradientEnd, setGradientEnd] = useState('#e0f2fe');
  const [sceneKey, setSceneKey] = useState<keyof typeof sceneBackgrounds>('studio');
  const [tagline, setTagline] = useState('New Arrival');
  const [description, setDescription] = useState('Premium quality product crafted for everyday excellence.');
  const [ctaText, setCtaText] = useState('Shop Now');
  const [badgeText, setBadgeText] = useState('20% Off');
  const [copySuccess, setCopySuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const hiddenFileInput = useRef<HTMLInputElement | null>(null);
  const previousObjectURL = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previousObjectURL.current) {
        URL.revokeObjectURL(previousObjectURL.current);
      }
    };
  }, []);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      return;
    }
    if (previousObjectURL.current) {
      URL.revokeObjectURL(previousObjectURL.current);
    }
    const objectUrl = URL.createObjectURL(file);
    previousObjectURL.current = objectUrl;
    setImageSrc(objectUrl);
    setImageName(file.name.replace(/\.[^.]+$/, '') + '-designed.png');
  }, []);

  const openFilePicker = useCallback(() => {
    hiddenFileInput.current?.click();
  }, []);

  const filterValue = useMemo(
    () => `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px)`,
    [brightness, contrast, saturation, blur]
  );

  const backgroundStyle = useMemo(() => {
    if (backgroundMode === 'solid') {
      return { background: solidColor };
    }
    if (backgroundMode === 'scene') {
      const scene = sceneBackgrounds[sceneKey];
      const gradient = `linear-gradient(135deg, ${scene.gradientStops
        .map(stop => `${stop.color} ${Math.round(stop.position * 100)}%`)
        .join(', ')})`;
      const overlays =
        scene.overlays?.map(({ x, y, radius, color }) => {
          const percent = (value: number) => `${Math.round(value * 100)}%`;
          return `radial-gradient(circle at ${percent(x)} ${percent(y)}, ${color} 0%, rgba(255, 255, 255, 0) ${Math.round(
            radius * 100
          )}%)`;
        }) ?? [];
      const layers = [...overlays, gradient];
      return { backgroundImage: layers.join(',') };
    }
    return {
      background: `linear-gradient(130deg, ${gradientStart} 0%, ${gradientEnd} 100%)`
    };
  }, [backgroundMode, gradientStart, gradientEnd, sceneKey, solidColor]);

  const loadImage = useCallback((src: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let drawY = y;
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, x, drawY);
        line = word;
        drawY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, drawY);
      drawY += lineHeight;
    }
    return drawY;
  };

  const handleDownload = useCallback(async () => {
    if (!imageSrc) {
      setDownloadError('Upload an image first.');
      return;
    }
    setDownloadError(null);
    setExporting(true);
    try {
      await document.fonts.ready;
      const baseImage = await loadImage(imageSrc);
      const canvas = document.createElement('canvas');
      canvas.width = downloadWidth;
      canvas.height = downloadHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context.');
      }

      if (backgroundMode === 'solid') {
        ctx.fillStyle = solidColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (backgroundMode === 'scene') {
        const scene = sceneBackgrounds[sceneKey];
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        scene.gradientStops.forEach(stop => {
          gradient.addColorStop(stop.position, stop.color);
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        scene.overlays?.forEach(({ x, y, radius, color }) => {
          const overlayGradient = ctx.createRadialGradient(
            canvas.width * x,
            canvas.height * y,
            0,
            canvas.width * x,
            canvas.height * y,
            Math.max(canvas.width, canvas.height) * radius
          );
          overlayGradient.addColorStop(0, color);
          overlayGradient.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = overlayGradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
      } else {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, gradientStart);
        gradient.addColorStop(1, gradientEnd);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      drawRoundedRect(ctx, 80, 80, canvas.width - 160, canvas.height - 160, 48);
      ctx.fill();
      ctx.restore();

      const padding = 140;
      const textColumnWidth = canvas.width * 0.38;
      let cursorY = padding + 20;

      if (badgeText) {
        const badgeX = padding;
        const badgeY = cursorY;
        const badgePaddingX = 28;
        const badgeHeight = 58;
        ctx.font = '600 28px "Inter"';
        const badgeMetrics = ctx.measureText(badgeText.toUpperCase());
        const badgeWidth = badgeMetrics.width + badgePaddingX * 2;
        ctx.save();
        ctx.fillStyle = 'rgba(79, 70, 229, 0.12)';
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.35)';
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 32);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#4338ca';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText.toUpperCase(), badgeX + badgePaddingX, badgeY + badgeHeight / 2);
        ctx.restore();
        cursorY = badgeY + badgeHeight + 48;
      }

      if (tagline) {
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 78px "Inter"';
        ctx.textBaseline = 'top';
        cursorY = wrapText(ctx, tagline, padding, cursorY, textColumnWidth, 84) + 36;
      }

      if (description) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.font = '400 32px "Inter"';
        cursorY = wrapText(ctx, description, padding, cursorY, textColumnWidth, 46) + 40;
      }

      if (ctaText) {
        const buttonHeight = 76;
        ctx.font = '600 32px "Inter"';
        const metrics = ctx.measureText(ctaText);
        const buttonWidth = Math.max(metrics.width + 80, 260);
        ctx.save();
        ctx.fillStyle = '#6366f1';
        drawRoundedRect(ctx, padding, cursorY, buttonWidth, buttonHeight, buttonHeight / 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(ctaText, padding + buttonWidth / 2 - metrics.width / 2, cursorY + buttonHeight / 2 + 4);
        ctx.restore();
      }

      const availableImageWidth = canvas.width - textColumnWidth - padding * 2;
      const availableImageHeight = canvas.height - padding * 2;
      const scale = Math.min(availableImageWidth / baseImage.width, availableImageHeight / baseImage.height, 1.2);
      const drawWidth = baseImage.width * scale;
      const drawHeight = baseImage.height * scale;
      const imageX = canvas.width - padding - drawWidth;
      const imageY = padding + (availableImageHeight - drawHeight) / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
      ctx.shadowBlur = 55;
      ctx.shadowOffsetX = 24;
      ctx.shadowOffsetY = 32;
      ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px)`;
      ctx.drawImage(baseImage, imageX, imageY, drawWidth, drawHeight);
      ctx.restore();

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
      if (!blob) {
        throw new Error('Unable to export image.');
      }
      const fileLink = document.createElement('a');
      fileLink.href = URL.createObjectURL(blob);
      fileLink.download = imageName || 'product-shot.png';
      document.body.appendChild(fileLink);
      fileLink.click();
      document.body.removeChild(fileLink);
      setTimeout(() => {
        URL.revokeObjectURL(fileLink.href);
      }, 4_000);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Failed to export image.');
    } finally {
      setExporting(false);
    }
  }, [backgroundMode, brightness, contrast, description, badgeText, ctaText, gradientEnd, gradientStart, imageName, imageSrc, loadImage, saturation, sceneKey, solidColor, blur, tagline]);

  const handleCopyShare = useCallback(async () => {
    if (!imageSrc) {
      setDownloadError('Upload an image to create a shareable preview.');
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (error) {
      setDownloadError('Copy failed. You can still download and share manually.');
    }
  }, [imageSrc]);

  const previewBackground = useMemo(() => {
    if (backgroundMode === 'solid') {
      return solidColor;
    }
    if (backgroundMode === 'scene') {
      const scene = sceneBackgrounds[sceneKey];
      const gradient = `linear-gradient(135deg, ${scene.gradientStops
        .map(stop => `${stop.color} ${Math.round(stop.position * 100)}%`)
        .join(', ')})`;
      const overlays =
        scene.overlays?.map(({ x, y, radius, color }) => {
          const percent = (value: number) => `${Math.round(value * 100)}%`;
          return `radial-gradient(circle at ${percent(x)} ${percent(y)}, ${color} 0%, rgba(255, 255, 255, 0) ${Math.round(
            radius * 100
          )}%)`;
        }) ?? [];
      return [...overlays, gradient].join(',');
    }
    return `linear-gradient(130deg, ${gradientStart}, ${gradientEnd})`;
  }, [backgroundMode, gradientEnd, gradientStart, sceneKey, solidColor]);

  return (
    <main style={{ padding: '3.5rem 1.5rem 4.5rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gap: '2.5rem' }}>
        <header style={{ textAlign: 'center', display: 'grid', gap: '0.8rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.9rem',
            borderRadius: '999px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.18)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#4338ca',
            margin: '0 auto'
          }}>
            ✨ Product Pic Studio
          </div>
          <h1 style={{ fontSize: 'clamp(2.7rem, 4vw, 3.6rem)', margin: 0, fontWeight: 700 }}>
            Turn raw product shots into polished campaign visuals
          </h1>
          <p style={{
            maxWidth: '680px',
            margin: '0 auto',
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            lineHeight: 1.6
          }}>
            Upload any product photo, dial in the lighting, set a premium backdrop, and export a ready-to-post creative without leaving your browser.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="primary" onClick={openFilePicker}>Upload product image</button>
            <button className="secondary" onClick={handleCopyShare} disabled={!imageSrc} style={{ opacity: imageSrc ? 1 : 0.6 }}>
              {copySuccess ? 'Link copied ✓' : 'Share this workspace'}
            </button>
          </div>
          <input
            ref={hiddenFileInput}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </header>

        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}>
          <article className="controls-card" style={{ padding: '2.25rem', display: 'grid', gap: '1.75rem' }}>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Brand framing</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Craft the environment around your product. Mix gradients, solid hues, or cinematic scenes for the perfect vibe.
              </p>
            </div>
            <div className="control-group">
              <label>Background style</label>
              <ul className="option-pills">
                <li>
                  <button
                    type="button"
                    className={clsx({ active: backgroundMode === 'gradient' })}
                    onClick={() => setBackgroundMode('gradient')}
                  >
                    Gradient
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={clsx({ active: backgroundMode === 'solid' })}
                    onClick={() => setBackgroundMode('solid')}
                  >
                    Solid
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={clsx({ active: backgroundMode === 'scene' })}
                    onClick={() => setBackgroundMode('scene')}
                  >
                    Scene
                  </button>
                </li>
              </ul>
            </div>

            {backgroundMode === 'gradient' && (
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <div className="control-group">
                  <label>Start color</label>
                  <input type="color" value={gradientStart} onChange={event => setGradientStart(event.target.value)} />
                </div>
                <div className="control-group">
                  <label>End color</label>
                  <input type="color" value={gradientEnd} onChange={event => setGradientEnd(event.target.value)} />
                </div>
              </div>
            )}

            {backgroundMode === 'solid' && (
              <div className="control-group">
                <label>Background color</label>
                <input type="color" value={solidColor} onChange={event => setSolidColor(event.target.value)} />
              </div>
            )}

            {backgroundMode === 'scene' && (
              <div className="control-group">
                <label>Themes</label>
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  {Object.entries(sceneBackgrounds).map(([key, scene]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSceneKey(key as keyof typeof sceneBackgrounds)}
                      style={{
                        borderRadius: '1rem',
                        border: sceneKey === key ? '2px solid rgba(99, 102, 241, 0.55)' : '1px solid var(--panel-border)',
                        padding: '1rem',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        background: sceneKey === key ? 'rgba(99, 102, 241, 0.08)' : 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <span
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '0.85rem',
                          background: `linear-gradient(135deg, ${scene.gradientStops
                            .map(stop => `${stop.color} ${Math.round(stop.position * 100)}%`)
                            .join(', ')})`,
                          display: 'inline-block'
                        }}
                      />
                      <span style={{ fontWeight: 600 }}>{scene.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.3)', paddingTop: '1.5rem', display: 'grid', gap: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Lighting & depth</h2>
              <div className="control-group">
                <label>Brightness: {brightness.toFixed(2)}×</label>
                <input
                  type="range"
                  min="0.8"
                  max="1.6"
                  step="0.02"
                  value={brightness}
                  onChange={event => setBrightness(parseFloat(event.target.value))}
                />
              </div>
              <div className="control-group">
                <label>Contrast: {contrast.toFixed(2)}×</label>
                <input
                  type="range"
                  min="0.8"
                  max="1.6"
                  step="0.02"
                  value={contrast}
                  onChange={event => setContrast(parseFloat(event.target.value))}
                />
              </div>
              <div className="control-group">
                <label>Saturation: {saturation.toFixed(2)}×</label>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.02"
                  value={saturation}
                  onChange={event => setSaturation(parseFloat(event.target.value))}
                />
              </div>
              <div className="control-group">
                <label>Focus blur: {blur.toFixed(2)}px</label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.05"
                  value={blur}
                  onChange={event => setBlur(parseFloat(event.target.value))}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.3)', paddingTop: '1.5rem', display: 'grid', gap: '1.2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Storytelling copy</h2>
              <div className="control-group">
                <label>Badge</label>
                <input
                  type="text"
                  value={badgeText}
                  placeholder="Limited Stock"
                  onChange={event => setBadgeText(event.target.value)}
                  style={{
                    borderRadius: '0.85rem',
                    border: '1px solid var(--panel-border)',
                    padding: '0.75rem 1rem'
                  }}
                />
              </div>
              <div className="control-group">
                <label>Headline</label>
                <input
                  type="text"
                  value={tagline}
                  placeholder="Headline"
                  onChange={event => setTagline(event.target.value)}
                  style={{
                    borderRadius: '0.85rem',
                    border: '1px solid var(--panel-border)',
                    padding: '0.75rem 1rem'
                  }}
                />
              </div>
              <div className="control-group">
                <label>Description</label>
                <textarea
                  value={description}
                  placeholder="Describe the offering"
                  onChange={event => setDescription(event.target.value)}
                  rows={3}
                  style={{
                    borderRadius: '0.85rem',
                    border: '1px solid var(--panel-border)',
                    padding: '0.85rem 1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div className="control-group">
                <label>Call-to-action</label>
                <input
                  type="text"
                  value={ctaText}
                  placeholder="Buy now"
                  onChange={event => setCtaText(event.target.value)}
                  style={{
                    borderRadius: '0.85rem',
                    border: '1px solid var(--panel-border)',
                    padding: '0.75rem 1rem'
                  }}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.3)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <button className="primary" onClick={handleDownload} disabled={exporting || !imageSrc} style={{ opacity: imageSrc ? 1 : 0.65 }}>
                {exporting ? 'Rendering…' : 'Download enhanced asset'}
              </button>
              {downloadError && (
                <span style={{ color: '#dc2626', fontSize: '0.9rem' }}>{downloadError}</span>
              )}
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Exports at {downloadWidth}×{downloadHeight}px PNG with lighting, backdrop, and typography baked in.
              </span>
            </div>
          </article>

          <article className="preview-surface" style={{ padding: '2.4rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '640px',
                aspectRatio: '4 / 3',
                borderRadius: '1.75rem',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                background: previewBackground,
                backgroundSize: 'cover'
              }}
            >
              <div style={{ display: 'flex', flex: 1, padding: '3rem 3.5rem', gap: '2.5rem' }}>
                <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', gap: '1.4rem', justifyContent: 'center' }}>
                  {badgeText && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.5rem 1.2rem',
                      borderRadius: '999px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.32)',
                      color: '#4338ca',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      letterSpacing: '0.08em'
                    }}>
                      {badgeText.toUpperCase()}
                    </span>
                  )}
                  <h2 style={{ margin: 0, fontSize: '2.4rem', lineHeight: 1.15 }}>{tagline || 'Headline goes here'}</h2>
                  <p style={{ margin: 0, color: 'rgba(15, 23, 42, 0.7)', lineHeight: 1.5 }}>
                    {description || 'Describe the product value in a concise, compelling way to drive clicks.'}
                  </p>
                  {ctaText && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      alignSelf: 'flex-start',
                      padding: '0.85rem 1.8rem',
                      background: '#6366f1',
                      color: '#fff',
                      borderRadius: '999px',
                      fontWeight: 600
                    }}>
                      {ctaText}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {imageSrc ? (
                    <div style={{ position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <NextImage
                        src={imageSrc}
                        alt="Uploaded product"
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 60vw, 28rem"
                        style={{
                          objectFit: 'contain',
                          filter: filterValue,
                          transform: 'translateZ(0)',
                          boxShadow: '0 35px 65px rgba(15, 23, 42, 0.35)',
                          borderRadius: '1.25rem'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '1.25rem',
                      border: '2px dashed rgba(148, 163, 184, 0.55)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(71, 85, 105, 0.9)',
                      textAlign: 'center',
                      padding: '1.5rem',
                      lineHeight: 1.6
                    }}>
                      Drop a product cut-out or packshot to start designing.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
