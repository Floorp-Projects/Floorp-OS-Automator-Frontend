import React from "react";

export type DragKind = "right" | "bottom" | null;

const STORAGE_KEY = "sapphillon-generate-pane";
export const MIN_RIGHT = 240; // モバイル・タブレット対応で最小幅を少し小さく
export const MIN_BOTTOM = 140;
export const GUTTER = 6;
const DEFAULT_RIGHT = 320;
const DEFAULT_BOTTOM = 280;
const KEY_STEP = 16;
const KEY_FINE_STEP = 4;

export function usePaneLayout() {
  const [right, setRight] = React.useState(DEFAULT_RIGHT);
  const [bottom, setBottom] = React.useState(DEFAULT_BOTTOM);
  const dragRef = React.useRef<{
    kind: DragKind;
    x: number;
    y: number;
    right: number;
    bottom: number;
  } | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const v = JSON.parse(raw) as { right?: number; bottom?: number };
      if (typeof v.right === "number") setRight(Math.max(MIN_RIGHT, v.right));
      if (typeof v.bottom === "number")
        setBottom(Math.max(MIN_BOTTOM, v.bottom));
    } catch {
      console.error("failed to load pane layout from localStorage");
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ right, bottom }));
    } catch {
      console.error("failed to save pane layout to localStorage");
    }
  }, [right, bottom]);

  const onMouseMove = React.useCallback((e: MouseEvent) => {
    const s = dragRef.current;
    if (!s) return;
    if (s.kind === "right") {
      const delta = s.x - e.clientX;
      setRight(Math.max(MIN_RIGHT, s.right + delta));
    }
    if (s.kind === "bottom") {
      const delta = s.y - e.clientY;
      setBottom(Math.max(MIN_BOTTOM, s.bottom + delta));
    }
    document.body.style.userSelect = "none";
    document.body.style.cursor =
      s.kind === "bottom" ? "row-resize" : "col-resize";
  }, []);

  const endDrag = React.useCallback(() => {
    dragRef.current = null;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", endDrag);
  }, [onMouseMove]);

  const beginDrag = React.useCallback(
    (kind: DragKind) => (e: React.MouseEvent) => {
      dragRef.current = { kind, x: e.clientX, y: e.clientY, right, bottom };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", endDrag);
    },
    [right, bottom, onMouseMove, endDrag]
  );

  const onGutterKeyDown = React.useCallback(
    (kind: Exclude<DragKind, null>) => (e: React.KeyboardEvent) => {
      const step = e.shiftKey
        ? KEY_STEP * 2
        : e.altKey
        ? KEY_FINE_STEP
        : KEY_STEP;
      if (kind === "right") {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setRight((v) => Math.max(MIN_RIGHT, v + step));
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setRight((v) => Math.max(MIN_RIGHT, v - step));
        }
        if (e.key === "Home") {
          e.preventDefault();
          setRight(MIN_RIGHT);
        }
        if (e.key === "End") {
          e.preventDefault();
          setRight(DEFAULT_RIGHT);
        }
      }
      if (kind === "bottom") {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setBottom((v) => Math.max(MIN_BOTTOM, v + step));
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setBottom((v) => Math.max(MIN_BOTTOM, v - step));
        }
        if (e.key === "Home") {
          e.preventDefault();
          setBottom(MIN_BOTTOM);
        }
        if (e.key === "End") {
          e.preventDefault();
          setBottom(DEFAULT_BOTTOM);
        }
      }
    },
    []
  );

  const gridCols = `minmax(0, 1fr) ${GUTTER}px ${right}px`;
  const gridRows = `minmax(0, 1fr) ${GUTTER}px ${bottom}px`;

  return {
    right,
    bottom,
    gridCols,
    gridRows,
    beginDrag,
    onGutterKeyDown,
    MIN_RIGHT,
    MIN_BOTTOM,
    GUTTER,
  } as const;
}
