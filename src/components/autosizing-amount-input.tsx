import { useLayoutEffect, useRef, useState } from "react";
import type { ClipboardEvent, InputHTMLAttributes, KeyboardEvent } from "react";

import { cn } from "../lib/cn";

type AutosizingAmountInputProps = InputHTMLAttributes<HTMLInputElement> & {
  maxFontSize?: number;
  minFontSize?: number;
};

const DEFAULT_MAX_FONT_SIZE = 76;
const DEFAULT_MIN_FONT_SIZE = 32;
const FONT_WIDTH_PADDING = 8;

export function AutosizingAmountInput({
  className,
  inputMode = "decimal",
  maxFontSize = DEFAULT_MAX_FONT_SIZE,
  minFontSize = DEFAULT_MIN_FONT_SIZE,
  onKeyDown,
  onPaste,
  placeholder = "0,00",
  style,
  value,
  ...props
}: AutosizingAmountInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let frame = 0;

    const updateFontSize = () => {
      const currentInput = inputRef.current;
      if (!currentInput) {
        return;
      }

      const computedStyle = window.getComputedStyle(currentInput);
      const availableWidth = currentInput.clientWidth;
      const text = String(value ?? "").trim() ? String(value ?? "") : placeholder;

      if (!text || availableWidth <= 0) {
        setFontSize(maxFontSize);
        return;
      }

      context.font = `${computedStyle.fontStyle} ${computedStyle.fontWeight} ${maxFontSize}px ${computedStyle.fontFamily}`;
      const measuredWidth = context.measureText(text).width;
      const letterSpacing =
        computedStyle.letterSpacing === "normal" ? 0 : Number.parseFloat(computedStyle.letterSpacing);
      const spacingWidth =
        Number.isFinite(letterSpacing) && letterSpacing > 0 ? letterSpacing * Math.max(text.length - 1, 0) : 0;
      const totalWidth = measuredWidth + spacingWidth;

      if (totalWidth <= 0) {
        setFontSize(maxFontSize);
        return;
      }

      const scaledSize = (availableWidth - FONT_WIDTH_PADDING) * (maxFontSize / totalWidth);
      const nextFontSize = Math.max(minFontSize, Math.min(maxFontSize, scaledSize));
      const roundedFontSize = Math.round(nextFontSize * 10) / 10;

      setFontSize((current) =>
        Math.abs(current - roundedFontSize) > 0.1 ? roundedFontSize : current,
      );
    };

    updateFontSize();

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(updateFontSize);
          });

    resizeObserver?.observe(input);

    const fontReady = document.fonts?.ready;
    if (fontReady) {
      void fontReady.then(updateFontSize).catch(() => undefined);
    }

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
    };
  }, [maxFontSize, minFontSize, placeholder, value]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);

    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (
      event.key === "Backspace" ||
      event.key === "Delete" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight" ||
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "Tab" ||
      event.key === "Enter" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      return;
    }

    if (event.key === "," || event.key === ".") {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    onPaste?.(event);

    if (event.defaultPrevented) {
      return;
    }

    const pastedText = event.clipboardData.getData("text");
    if (!/^[\d.,\s]+$/.test(pastedText.trim())) {
      event.preventDefault();
    }
  }

  return (
    <input
      {...props}
      ref={inputRef}
      inputMode={inputMode}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      pattern="[0-9.,]*"
      placeholder={placeholder}
      value={value}
      style={{
        ...style,
        fontFamily: "var(--font-mono)",
        fontSize: `${fontSize}px`,
        fontVariantNumeric: "tabular-nums",
      }}
      className={cn(
        "h-full min-w-0 w-full bg-transparent text-center font-bold leading-none tracking-tight text-ink-50 outline-none placeholder:text-ink-500/70",
        className,
      )}
    />
  );
}
