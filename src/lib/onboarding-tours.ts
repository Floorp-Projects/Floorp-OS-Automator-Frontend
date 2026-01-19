import type { OnboardingTour } from "@/hooks/useOnboarding";

type TranslationFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string;

// ホームページツアー
export const getHomeTour = (t: TranslationFunction): OnboardingTour => ({
  id: "home-tour",
  name: t("onboarding.homeTour.name"),
  steps: [
    {
      id: "welcome",
      title: t("onboarding.homeTour.welcome.title"),
      description: t("onboarding.homeTour.welcome.description"),
    },
    {
      id: "nav-generate",
      title: t("onboarding.homeTour.navGenerate.title"),
      description: t("onboarding.homeTour.navGenerate.description"),
      target: '[href="/generate"]',
      placement: "right",
    },
    {
      id: "nav-workflows",
      title: t("onboarding.homeTour.navWorkflows.title"),
      description: t("onboarding.homeTour.navWorkflows.description"),
      target: '[href="/workflows"]',
      placement: "right",
    },
    {
      id: "nav-settings",
      title: t("onboarding.homeTour.navSettings.title"),
      description: t("onboarding.homeTour.navSettings.description"),
      target: '[href="/settings"]',
      placement: "right",
    },
  ],
});

// 生成ページツアー
export const getGenerateTour = (t: TranslationFunction): OnboardingTour => ({
  id: "generate-tour",
  name: t("onboarding.generateTour.name"),
  steps: [
    {
      id: "welcome",
      title: t("onboarding.generateTour.welcome.title"),
      description: t("onboarding.generateTour.welcome.description"),
    },
    {
      id: "prompt",
      title: t("onboarding.generateTour.prompt.title"),
      description: t("onboarding.generateTour.prompt.description"),
      target: "textarea",
      placement: "bottom",
    },
    {
      id: "templates",
      title: t("onboarding.generateTour.templates.title"),
      description: t("onboarding.generateTour.templates.description"),
      target: 'button:has-text("テンプレート")',
      placement: "bottom",
    },
    {
      id: "history",
      title: t("onboarding.generateTour.history.title"),
      description: t("onboarding.generateTour.history.description"),
      target: 'button:has-text("履歴")',
      placement: "bottom",
    },
    {
      id: "generate",
      title: t("onboarding.generateTour.generate.title"),
      description: t("onboarding.generateTour.generate.description"),
      target: 'button:has-text("Generate")',
      placement: "bottom",
    },
    {
      id: "run",
      title: t("onboarding.generateTour.run.title"),
      description: t("onboarding.generateTour.run.description"),
      target: '[value="run"]',
      placement: "top",
    },
  ],
});

// ワークフローページツアー
export const getWorkflowsTour = (t: TranslationFunction): OnboardingTour => ({
  id: "workflows-tour",
  name: t("onboarding.workflowsTour.name"),
  steps: [
    {
      id: "welcome",
      title: t("onboarding.workflowsTour.welcome.title"),
      description: t("onboarding.workflowsTour.welcome.description"),
    },
    {
      id: "search",
      title: t("onboarding.workflowsTour.search.title"),
      description: t("onboarding.workflowsTour.search.description"),
      target: 'input[placeholder*="検索"]',
      placement: "bottom",
    },
    {
      id: "new-workflow",
      title: t("onboarding.workflowsTour.newWorkflow.title"),
      description: t("onboarding.workflowsTour.newWorkflow.description"),
      target: 'button:has-text("New Workflow")',
      placement: "left",
    },
    {
      id: "actions",
      title: t("onboarding.workflowsTour.actions.title"),
      description: t("onboarding.workflowsTour.actions.description"),
    },
  ],
});

// すべてのツアーを取得
export const getTours = (t: TranslationFunction) => ({
  home: getHomeTour(t),
  generate: getGenerateTour(t),
  workflows: getWorkflowsTour(t),
});

// レガシーサポート（静的エクスポート）- デフォルト値
// 注意: これらは非推奨です。getTours(t)を使用してください。
export const HOME_TOUR: OnboardingTour = {
  id: "home-tour",
  name: "ホームページツアー",
  steps: [
    {
      id: "welcome",
      title: "Sapphillonへようこそ！",
      description:
        "AIを活用したワークフロー自動化プラットフォームです。このツアーでは、基本的な使い方をご紹介します。",
    },
    {
      id: "nav-generate",
      title: "ワークフローの生成",
      description:
        "「Generate」ページで、自然言語でワークフローを生成できます。",
      target: '[href="/generate"]',
      placement: "right",
    },
    {
      id: "nav-workflows",
      title: "ワークフローの管理",
      description:
        "「Workflows」ページで、作成したワークフローを確認・管理できます。",
      target: '[href="/workflows"]',
      placement: "right",
    },
    {
      id: "nav-settings",
      title: "設定",
      description:
        "「Settings」ページで、AIモデルやプロバイダーの設定を行えます。",
      target: '[href="/settings"]',
      placement: "right",
    },
  ],
};

export const GENERATE_TOUR: OnboardingTour = {
  id: "generate-tour",
  name: "ワークフロー生成ツアー",
  steps: [
    {
      id: "welcome",
      title: "ワークフローを生成しましょう",
      description: "このページでは、自然言語でワークフローを生成できます。",
    },
    {
      id: "prompt",
      title: "プロンプト入力",
      description:
        "ここにやりたいことを自然な言葉で入力してください。例：「最新のレポートをダウンロードして、チームにメールで送信する」",
      target: "textarea",
      placement: "bottom",
    },
    {
      id: "templates",
      title: "テンプレート",
      description:
        "テンプレートボタンから、よく使うワークフローのサンプルを選べます。",
      target: 'button:has-text("テンプレート")',
      placement: "bottom",
    },
    {
      id: "history",
      title: "履歴",
      description: "過去に使用したプロンプトを履歴から呼び出せます。",
      target: 'button:has-text("履歴")',
      placement: "bottom",
    },
    {
      id: "generate",
      title: "生成",
      description:
        "Generateボタンをクリックするか、Ctrl/Cmd + Enterでワークフローを生成できます。",
      target: 'button:has-text("Generate")',
      placement: "bottom",
    },
    {
      id: "run",
      title: "実行",
      description: "生成されたワークフローは、Runパネルから実行できます。",
      target: '[value="run"]',
      placement: "top",
    },
  ],
};

export const WORKFLOWS_TOUR: OnboardingTour = {
  id: "workflows-tour",
  name: "ワークフロー管理ツアー",
  steps: [
    {
      id: "welcome",
      title: "ワークフロー一覧",
      description: "作成したワークフローがここに表示されます。",
    },
    {
      id: "search",
      title: "検索",
      description: "ワークフロー名で検索できます。",
      target: 'input[placeholder*="検索"]',
      placement: "bottom",
    },
    {
      id: "new-workflow",
      title: "新しいワークフロー",
      description:
        "「New Workflow」ボタンから、新しいワークフローを作成できます。",
      target: 'button:has-text("New Workflow")',
      placement: "left",
    },
    {
      id: "actions",
      title: "アクション",
      description:
        "各ワークフローには、表示、実行、複製、削除のアクションがあります。",
    },
  ],
};

// すべてのツアー（レガシー）
export const TOURS = {
  home: HOME_TOUR,
  generate: GENERATE_TOUR,
  workflows: WORKFLOWS_TOUR,
};
