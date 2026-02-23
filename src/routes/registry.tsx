import {
  LuHouse,
  LuInfo,
  LuPlugZap,
  LuSettings,
  LuSparkles,
  LuWrench,
} from "react-icons/lu";

export type AppRoute = {
  path: string;
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: string | number }>;
};

export const getRoutes = (t: (key: string) => string): AppRoute[] => [
  { path: "/home", key: "home", label: t("nav.home"), icon: LuHouse },
  {
    path: "/generate",
    key: "generate",
    label: t("nav.generate"),
    icon: LuSparkles,
  },
  {
    path: "/workflows",
    key: "workflows",
    label: t("nav.workflows"),
    icon: LuWrench,
  },
  {
    path: "/plugins",
    key: "plugins",
    label: t("nav.plugins"),
    icon: LuPlugZap,
  },
  {
    path: "/settings",
    key: "settings",
    label: t("nav.settings"),
    icon: LuSettings,
  },
  { path: "/about", key: "about", label: t("nav.about"), icon: LuInfo },
];

// 後方互換性のため、デフォルトのルートも提供（英語）
export const routes: AppRoute[] = [
  { path: "/home", key: "home", label: "Home", icon: LuHouse },
  { path: "/generate", key: "generate", label: "Generate", icon: LuSparkles },
  { path: "/workflows", key: "workflows", label: "Workflows", icon: LuWrench },
  { path: "/plugins", key: "plugins", label: "Plugins", icon: LuPlugZap },
  { path: "/settings", key: "settings", label: "Settings", icon: LuSettings },
  { path: "/about", key: "about", label: "About", icon: LuInfo },
];
