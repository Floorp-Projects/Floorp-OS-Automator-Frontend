# Floorp-OS-Automator-Frontend

## Floorp OS について

Sapphillon は、汎用的なワークフロー自動化プラットフォームです。**Floorp OS** は Sapphillon をベースとした派生プロダクトであり、Sapphillon とは独立したプロジェクトです。Ubuntu が Debian をベースにしつつも独自のプロジェクトとして開発されているのと同様に、Floorp OS は Sapphillon のコア技術を基盤としながら、[Floorp ブラウザ](https://floorp.app) との統合や OS レベルの自動化機能など、独自の機能を追加しています。

本リポジトリ（Floorp-OS-Automator-Frontend）は、Floorp OS の**フロントエンド UI**です。

### 技術スタック

- **React 19** + **TypeScript** + **Vite**
- **Chakra UI** — コンポーネントライブラリ
- **ConnectRPC / gRPC-Web** — Backend との通信（`@connectrpc/connect`, `@connectrpc/connect-web`）
- **i18next** — 国際化
- **React Router** — ルーティング
- **Zod + React Hook Form** — フォームバリデーション

### アーキテクチャ概要

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Floorp ブラウザ                                │
│                                                                      │
│  プロセス管理（起動・停止）         ローカル HTTP サーバー (:58261)    │
│       │           │                        ▲                         │
└───────┼───────────┼────────────────────────┼─────────────────────────┘
        │           │                        │ HTTP/JSON
        ▼           ▼                        │ (floorp プラグイン)
  ┌──────────┐  ┌──────────────────────────────────────────────┐
  │ Frontend │  │          Sapphillon Backend (:50051)          │
  │ (React)  │  │                                               │
  │ ★ここ    │──│─── ConnectRPC / gRPC-Web ──▶ gRPC Server     │
  │          │  │                                               │
  └──────────┘  └───────────────────────────────────────────────┘
```

- **Floorp ブラウザ** が本 Frontend と Backend の両バイナリを子プロセスとして起動・管理します
- **本 Frontend** は ConnectRPC（gRPC-Web）を使用して Backend（デフォルト: `http://localhost:50051`）と通信します
- プロダクション環境では **web_server**（Actix Web）が静的ファイルを配信し、`SAPPHILLON_GRPC_BASE_URL` 環境変数で Backend の接続先を注入します（デフォルト: `127.0.0.1:8081`）

### 開発

```bash
# 依存インストール
pnpm install

# 開発サーバー起動（Backend に直接接続）
pnpm dev:prod

# モックサーバーで開発
pnpm dev:mock

# テスト
pnpm test

# ビルド
pnpm build
```

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
