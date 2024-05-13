import React, { useEffect, useRef, useState } from "react";

import { createQRCode } from "@/domains/qrcode/index";

export function Qrcode(
  props: {
    text: string;
    width: number;
    height: number;
    logo?: string;
  } & React.AllHTMLAttributes<HTMLImageElement>
) {
  const { text, width, height, logo } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    (async () => {
      const $canvas = canvasRef.current;
      if (!$canvas) {
        return;
      }
      const ctx = $canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      createQRCode(text, {
        width,
        height,
        ctx,
      });
    })();
  }, []);

  return <canvas ref={canvasRef} className={props.className} style={props.style} />;
}
