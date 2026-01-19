"use client";

import type { IconButtonProps, SpanProps } from "@chakra-ui/react";
import { ClientOnly, IconButton, Skeleton, Span } from "@chakra-ui/react";
import * as React from "react";
import { LuMoon, LuSun } from "react-icons/lu";
import {
  type ColorMode,
  ColorModeCtx,
  useColorMode,
} from "./color-mode-context";
import { useI18n } from "@/hooks/useI18n";

function applyRootClass(mode: ColorMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.add("chakra-theme");
  root.classList.remove(mode === "dark" ? "light" : "dark");
  root.classList.add(mode);
  try {
    root.style.colorScheme = mode;
  } catch {
    /* noop */
  }
}

function getInitialMode(): ColorMode {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem("sapphillon-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")
    .matches;
  return prefersDark ? "dark" : "light";
}

export function ColorModeProvider(
  { children }: { children?: React.ReactNode },
) {
  const [mode, setMode] = React.useState<ColorMode>(getInitialMode);

  React.useEffect(() => {
    applyRootClass(mode);
    try {
      window.localStorage.setItem("sapphillon-theme", mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  const value = React.useMemo(
    () => ({
      colorMode: mode,
      setColorMode: setMode,
      toggleColorMode: () =>
        setMode((m: ColorMode) => (m === "dark" ? "light" : "dark")),
    }),
    [mode],
  );

  return <ColorModeCtx.Provider value={value}>{children}
  </ColorModeCtx.Provider>;
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? <LuMoon /> : <LuSun />;
}

type ColorModeButtonProps = Omit<IconButtonProps, "aria-label">;

export const ColorModeButton = React.forwardRef<
  HTMLButtonElement,
  ColorModeButtonProps
>(function ColorModeButton(props, ref) {
  const { toggleColorMode } = useColorMode();
  const { t } = useI18n();
  return (
    <ClientOnly fallback={<Skeleton boxSize="9" />}>
      <IconButton
        onClick={toggleColorMode}
        variant="ghost"
        aria-label={t("colorMode.toggle")}
        size="sm"
        ref={ref}
        {...props}
        css={{
          _icon: {
            width: "5",
            height: "5",
          },
        }}
      >
        <ColorModeIcon />
      </IconButton>
    </ClientOnly>
  );
});

export const LightMode = React.forwardRef<HTMLSpanElement, SpanProps>(
  function LightMode(props, ref) {
    return (
      <Span
        color="fg"
        display="contents"
        className="chakra-theme light"
        colorPalette="gray"
        colorScheme="light"
        ref={ref}
        {...props}
      />
    );
  },
);

export const DarkMode = React.forwardRef<HTMLSpanElement, SpanProps>(
  function DarkMode(props, ref) {
    return (
      <Span
        color="fg"
        display="contents"
        className="chakra-theme dark"
        colorPalette="gray"
        colorScheme="dark"
        ref={ref}
        {...props}
      />
    );
  },
);
