"use client";

import { useEffect, useRef, useState } from "react";

interface IframeHtmlProps {
  /** 要渲染的 HTML 内容（可包含 HTML 标签和纯文本混合） */
  html: string;
  /** 额外注入的 CSS 样式内容（如来自 codeRenderContent 的 <style> 块） */
  styleHtml?: string;
  className?: string;
  minHeight?: number;
}

/**
 * 用 iframe srcdoc 隔离渲染 HTML（含 <style> 标签），防止样式污染外部页面
 */
export function IframeHtml({ html, styleHtml, className, minHeight = 200 }: IframeHtmlProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);

  const wrappedHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 8px;
    background: transparent;
    color: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 14px;
    line-height: 1.7;
    word-break: break-word;
  }
  img { max-width: 100%; height: auto; }
  a { color: #a78bfa; }
  p { margin: 0.5em 0; }
</style>
${styleHtml ?? ""}
</head>
<body>${html}</body>
</html>`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          requestAnimationFrame(() => {
            const newHeight = doc.documentElement.scrollHeight;
            if (newHeight > minHeight) setHeight(newHeight);
          });
        }
      } catch {
        // cross-origin fallback
      }
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [html, styleHtml, minHeight]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={wrappedHtml}
      className={className}
      style={{ height: `${height}px`, minHeight: `${minHeight}px` }}
      sandbox="allow-scripts allow-same-origin"
      scrolling="no"
      title="Character Content"
    />
  );
}
