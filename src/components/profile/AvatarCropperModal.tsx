"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import Button from "@/components/ui/Button";

const VIEW = 260; // on-screen crop viewport (square, px)
const OUT = 512; // exported avatar resolution (square, px)

interface Props {
  file: File;
  onCancel: () => void;
  onCropped: (file: File) => void;
}

/**
 * Zero-dependency avatar cropper. Pan (drag) + zoom (slider/buttons) an image
 * inside a fixed square viewport with a circular guide, then export a square
 * 512×512 JPEG. The circle is only a guide — we store a square and the avatar
 * is masked to a circle at display time (rounded-full + object-cover).
 */
export default function AvatarCropperModal({ file, onCancel, onCropped }: Props) {
  // Lazy init so the object URL is created once (not via setState-in-effect);
  // the effect below only revokes it on unmount.
  const [url] = useState<string>(() => URL.createObjectURL(file));
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(
    null
  );

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const baseScale = nat ? Math.max(VIEW / nat.w, VIEW / nat.h) : 1;
  const scale = baseScale * zoom;
  const dw = nat ? nat.w * scale : VIEW;
  const dh = nat ? nat.h * scale : VIEW;

  const clamp = useCallback(
    (o: { x: number; y: number }) => ({
      x: Math.min(0, Math.max(VIEW - dw, o.x)),
      y: Math.min(0, Math.max(VIEW - dh, o.y)),
    }),
    [dw, dh]
  );

  function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const im = e.currentTarget;
    const w = im.naturalWidth;
    const h = im.naturalHeight;
    setNat({ w, h });
    // Center the image in the viewport at zoom 1.
    const s = Math.max(VIEW / w, VIEW / h);
    setOffset({ x: (VIEW - w * s) / 2, y: (VIEW - h * s) / 2 });
  }

  function handleZoom(next: number) {
    if (!nat) {
      setZoom(next);
      return;
    }
    // Anchor the zoom to the viewport centre so it doesn't jump.
    const s1 = baseScale * zoom;
    const s2 = baseScale * next;
    const imgCx = (VIEW / 2 - offset.x) / s1;
    const imgCy = (VIEW / 2 - offset.y) / s1;
    const nx = VIEW / 2 - imgCx * s2;
    const ny = VIEW / 2 - imgCy * s2;
    const w = nat.w * s2;
    const h = nat.h * s2;
    setZoom(next);
    setOffset({
      x: Math.min(0, Math.max(VIEW - w, nx)),
      y: Math.min(0, Math.max(VIEW - h, ny)),
    });
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setOffset(
      clamp({
        x: drag.current.ox + (e.clientX - drag.current.px),
        y: drag.current.oy + (e.clientY - drag.current.py),
      })
    );
  }
  function onPointerUp() {
    drag.current = null;
  }

  async function handleSave() {
    const image = imgRef.current;
    if (!image || !nat) return;
    setProcessing(true);
    try {
      const s = baseScale * zoom;
      // Map the square viewport back to source-image pixels.
      const sx = -offset.x / s;
      const sy = -offset.y / s;
      const sSize = VIEW / s;

      const canvas = document.createElement("canvas");
      canvas.width = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no-2d-context");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, sx, sy, sSize, sSize, 0, 0, OUT, OUT);

      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("crop-failed");

      const base = file.name.replace(/\.[^.]+$/, "") || "avatar";
      onCropped(new File([blob], `${base}.jpg`, { type: "image/jpeg" }));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 id="crop-title" className="text-base font-bold text-slate-900">
          Adjust your photo
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Drag to reposition, zoom to fit.
        </p>

        {/* Crop viewport */}
        <div className="mt-4 flex justify-center">
          <div
            className="relative overflow-hidden rounded-lg bg-slate-100 cursor-grab active:cursor-grabbing select-none"
            style={{ width: VIEW, height: VIEW, touchAction: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={url}
              alt=""
              draggable={false}
              onLoad={handleImgLoad}
              className="absolute max-w-none select-none"
              style={{ left: offset.x, top: offset.y, width: dw, height: dh }}
            />
            {/* Circular guide — dims everything outside the circle */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Zoom control */}
        <div className="mt-4 flex items-center gap-3">
          <ZoomOut size={16} className="shrink-0 text-slate-400" aria-hidden />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#3B1892]"
          />
          <ZoomIn size={16} className="shrink-0 text-slate-400" aria-hidden />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={processing}
            disabled={!nat}
            onClick={handleSave}
          >
            Save photo
          </Button>
        </div>
      </div>
    </div>
  );
}
