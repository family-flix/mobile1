import React, { useEffect, useRef } from "react";

export const PercentCircle = (
  props: { percent: number; width: number; height: number } & React.HTMLAttributes<HTMLCanvasElement>
) => {
  const { percent, width, height, ...restProps } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const $canvas = canvasRef.current;
    if (!$canvas) {
      return;
    }
    const context = $canvas.getContext("2d");
    if (!context) {
      return;
    }
    // console.log("circle props", $canvas.width, $canvas.height);
    // 圆环参数
    const centerX = $canvas.width / 2;
    const centerY = $canvas.height / 2;
    const lineWidth = 16;
    const radius = ($canvas.width - lineWidth) / 2;
    // 计算绘制的结束角度
    const endAngle = (percent / 100) * Math.PI * 2 - Math.PI / 2;
    // 绘制底部灰色圆环
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.lineWidth = lineWidth;
    context.strokeStyle = "#ccc";
    context.stroke();
    // 设置线段末端样式为圆角
    context.lineCap = "round";
    // 绘制百分比圆环
    context.beginPath();
    context.arc(centerX, centerY, radius, -Math.PI / 2, endAngle);
    context.lineWidth = lineWidth;
    const color = (() => {
      if (percent > 80) {
        return "#57bb8a";
      }
      if (percent > 50) {
        return "#e8c547";
      }
      return "#e86a5c";
    })();
    context.strokeStyle = color; // 使用红色表示进度
    context.stroke();
    // 绘制文字
    context.font = "24px Arial";
    context.fillStyle = "#333";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(percent), centerX, centerY);
  }, []);

  return <canvas ref={canvasRef} width={width} height={height} {...restProps}></canvas>;
};
