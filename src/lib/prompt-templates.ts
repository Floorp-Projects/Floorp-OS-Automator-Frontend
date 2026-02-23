export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: "automation" | "data" | "communication" | "development" | "other";
  tags: string[];
}

type TranslationFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string;

// i18n対応のテンプレート取得関数
export function getPromptTemplates(t: TranslationFunction): PromptTemplate[] {
  return [
    // 自動化カテゴリ
    {
      id: "report-download-email",
      title: t("promptTemplates.reportDownloadEmail.title"),
      description: t("promptTemplates.reportDownloadEmail.description"),
      prompt: t("promptTemplates.reportDownloadEmail.prompt"),
      category: "automation",
      tags: [
        t("promptTemplates.tags.email"),
        t("promptTemplates.tags.report"),
        t("promptTemplates.tags.automation"),
      ],
    },
    {
      id: "file-backup",
      title: t("promptTemplates.fileBackup.title"),
      description: t("promptTemplates.fileBackup.description"),
      prompt: t("promptTemplates.fileBackup.prompt"),
      category: "automation",
      tags: [
        t("promptTemplates.tags.backup"),
        t("promptTemplates.tags.fileManagement"),
      ],
    },
    {
      id: "schedule-meeting",
      title: t("promptTemplates.scheduleMeeting.title"),
      description: t("promptTemplates.scheduleMeeting.description"),
      prompt: t("promptTemplates.scheduleMeeting.prompt"),
      category: "automation",
      tags: [
        t("promptTemplates.tags.calendar"),
        t("promptTemplates.tags.meeting"),
        t("promptTemplates.tags.notification"),
      ],
    },

    // データ処理カテゴリ
    {
      id: "csv-analysis",
      title: t("promptTemplates.csvAnalysis.title"),
      description: t("promptTemplates.csvAnalysis.description"),
      prompt: t("promptTemplates.csvAnalysis.prompt"),
      category: "data",
      tags: [
        t("promptTemplates.tags.csv"),
        t("promptTemplates.tags.dataAnalysis"),
        t("promptTemplates.tags.statistics"),
      ],
    },
    {
      id: "json-transform",
      title: t("promptTemplates.jsonTransform.title"),
      description: t("promptTemplates.jsonTransform.description"),
      prompt: t("promptTemplates.jsonTransform.prompt"),
      category: "data",
      tags: [
        t("promptTemplates.tags.json"),
        t("promptTemplates.tags.dataTransform"),
        t("promptTemplates.tags.api"),
      ],
    },
    {
      id: "data-merge",
      title: t("promptTemplates.dataMerge.title"),
      description: t("promptTemplates.dataMerge.description"),
      prompt: t("promptTemplates.dataMerge.prompt"),
      category: "data",
      tags: [
        t("promptTemplates.tags.dataIntegration"),
        t("promptTemplates.tags.csv"),
        t("promptTemplates.tags.merge"),
      ],
    },

    // コミュニケーションカテゴリ
    {
      id: "daily-report",
      title: t("promptTemplates.dailyReport.title"),
      description: t("promptTemplates.dailyReport.description"),
      prompt: t("promptTemplates.dailyReport.prompt"),
      category: "communication",
      tags: [
        t("promptTemplates.tags.report"),
        t("promptTemplates.tags.email"),
        t("promptTemplates.tags.dailyWork"),
      ],
    },
    {
      id: "notification-summary",
      title: t("promptTemplates.notificationSummary.title"),
      description: t("promptTemplates.notificationSummary.description"),
      prompt: t("promptTemplates.notificationSummary.prompt"),
      category: "communication",
      tags: [
        t("promptTemplates.tags.notification"),
        t("promptTemplates.tags.summary"),
        t("promptTemplates.tags.priority"),
      ],
    },
    {
      id: "slack-update",
      title: t("promptTemplates.slackUpdate.title"),
      description: t("promptTemplates.slackUpdate.description"),
      prompt: t("promptTemplates.slackUpdate.prompt"),
      category: "communication",
      tags: [
        t("promptTemplates.tags.slack"),
        t("promptTemplates.tags.status"),
        t("promptTemplates.tags.automation"),
      ],
    },

    // 開発カテゴリ
    {
      id: "code-review",
      title: t("promptTemplates.codeReview.title"),
      description: t("promptTemplates.codeReview.description"),
      prompt: t("promptTemplates.codeReview.prompt"),
      category: "development",
      tags: [
        t("promptTemplates.tags.git"),
        t("promptTemplates.tags.codeReview"),
        t("promptTemplates.tags.development"),
      ],
    },
    {
      id: "test-run",
      title: t("promptTemplates.testRun.title"),
      description: t("promptTemplates.testRun.description"),
      prompt: t("promptTemplates.testRun.prompt"),
      category: "development",
      tags: [
        t("promptTemplates.tags.test"),
        t("promptTemplates.tags.cicd"),
        t("promptTemplates.tags.notification"),
      ],
    },
    {
      id: "dependency-update",
      title: t("promptTemplates.dependencyUpdate.title"),
      description: t("promptTemplates.dependencyUpdate.description"),
      prompt: t("promptTemplates.dependencyUpdate.prompt"),
      category: "development",
      tags: [
        t("promptTemplates.tags.dependency"),
        t("promptTemplates.tags.security"),
        t("promptTemplates.tags.update"),
      ],
    },

    // その他
    {
      id: "web-scraping",
      title: t("promptTemplates.webScraping.title"),
      description: t("promptTemplates.webScraping.description"),
      prompt: t("promptTemplates.webScraping.prompt"),
      category: "other",
      tags: [
        t("promptTemplates.tags.scraping"),
        t("promptTemplates.tags.web"),
        t("promptTemplates.tags.dataCollection"),
      ],
    },
    {
      id: "image-resize",
      title: t("promptTemplates.imageResize.title"),
      description: t("promptTemplates.imageResize.description"),
      prompt: t("promptTemplates.imageResize.prompt"),
      category: "other",
      tags: [
        t("promptTemplates.tags.imageProcessing"),
        t("promptTemplates.tags.resize"),
        t("promptTemplates.tags.batchProcessing"),
      ],
    },
    {
      id: "system-health-check",
      title: t("promptTemplates.systemHealthCheck.title"),
      description: t("promptTemplates.systemHealthCheck.description"),
      prompt: t("promptTemplates.systemHealthCheck.prompt"),
      category: "other",
      tags: [
        t("promptTemplates.tags.monitoring"),
        t("promptTemplates.tags.system"),
        t("promptTemplates.tags.alert"),
      ],
    },
  ];
}

// レガシーサポート（静的エクスポート）
// 注意: これは非推奨です。getPromptTemplates(t)を使用してください。
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // 自動化カテゴリ
  {
    id: "report-download-email",
    title: "レポートのダウンロードとメール送信",
    description: "最新のレポートをダウンロードしてチームにメール送信",
    prompt:
      "最新の月次レポートをダウンロードして、そのレポートをチーム全員にメールで送信してください。件名は「月次レポート - [現在の日付]」としてください。",
    category: "automation",
    tags: ["メール", "レポート", "自動化"],
  },
  {
    id: "file-backup",
    title: "ファイルのバックアップ",
    description: "指定フォルダのファイルをバックアップ先にコピー",
    prompt:
      "プロジェクトフォルダ内のすべてのドキュメントファイルを検索して、バックアップフォルダにコピーしてください。完了後、バックアップされたファイル数を報告してください。",
    category: "automation",
    tags: ["バックアップ", "ファイル管理"],
  },
  {
    id: "schedule-meeting",
    title: "ミーティングのスケジュール",
    description: "カレンダーに会議を追加し、参加者に通知",
    prompt:
      "来週の火曜日10時に「週次レビュー会議」をスケジュールして、チームメンバー全員を招待してください。会議の議題には進捗確認と課題の共有を含めてください。",
    category: "automation",
    tags: ["カレンダー", "ミーティング", "通知"],
  },

  // データ処理カテゴリ
  {
    id: "csv-analysis",
    title: "CSVデータの分析",
    description: "CSVファイルを読み込んで統計情報を出力",
    prompt:
      "sales_data.csvファイルを読み込んで、月別の売上合計、平均、最大値、最小値を計算してください。結果はわかりやすい表形式で出力してください。",
    category: "data",
    tags: ["CSV", "データ分析", "統計"],
  },
  {
    id: "json-transform",
    title: "JSONデータの変換",
    description: "JSON形式のデータを別の形式に変換",
    prompt:
      "APIから取得したJSONデータを読み込んで、必要なフィールドのみを抽出し、新しいJSON形式に変換してください。変換後のデータをファイルに保存してください。",
    category: "data",
    tags: ["JSON", "データ変換", "API"],
  },
  {
    id: "data-merge",
    title: "複数データソースの統合",
    description: "複数のデータファイルを1つに統合",
    prompt:
      "data1.csv、data2.csv、data3.csvの3つのファイルを読み込んで、共通のキー（ID列）で結合し、統合されたデータを merged_data.csv として保存してください。",
    category: "data",
    tags: ["データ統合", "CSV", "マージ"],
  },

  // コミュニケーションカテゴリ
  {
    id: "daily-report",
    title: "日次レポートの作成と送信",
    description: "本日の作業内容をまとめてレポート送信",
    prompt:
      "本日の作業ログを確認して、完了したタスク、進行中のタスク、発生した問題をまとめた日次レポートを作成し、上司にメールで送信してください。",
    category: "communication",
    tags: ["レポート", "メール", "日次作業"],
  },
  {
    id: "notification-summary",
    title: "通知の集約と要約",
    description: "複数の通知を1つのサマリーにまとめる",
    prompt:
      "過去24時間の通知をすべて確認して、重要度別に分類し、優先度の高いものから順に要約したサマリーを作成してください。",
    category: "communication",
    tags: ["通知", "要約", "優先度"],
  },
  {
    id: "slack-update",
    title: "Slackステータス更新",
    description: "作業状況に応じてSlackステータスを自動更新",
    prompt:
      "現在のカレンダーの予定を確認して、会議中の場合は「会議中」、作業中の場合は「集中作業中」とSlackのステータスを更新してください。",
    category: "communication",
    tags: ["Slack", "ステータス", "自動化"],
  },

  // 開発カテゴリ
  {
    id: "code-review",
    title: "コードレビューの準備",
    description: "変更されたファイルを確認してレビュー用の資料を作成",
    prompt:
      "Gitで変更されたファイルをすべてリストアップして、各ファイルの変更内容の要約を作成してください。レビュー用のMarkdownドキュメントとして出力してください。",
    category: "development",
    tags: ["Git", "コードレビュー", "開発"],
  },
  {
    id: "test-run",
    title: "テストの実行と結果通知",
    description: "テストスイートを実行して結果をチームに通知",
    prompt:
      "プロジェクトのすべてのテストを実行して、テスト結果（成功数、失敗数、失敗したテスト名）をまとめ、Slackの#testチャンネルに通知してください。",
    category: "development",
    tags: ["テスト", "CI/CD", "通知"],
  },
  {
    id: "dependency-update",
    title: "依存関係の更新確認",
    description: "プロジェクトの依存関係に更新があるか確認",
    prompt:
      "package.jsonを確認して、更新可能なパッケージをリストアップしてください。セキュリティアップデートが含まれる場合は優先度を高くマークしてください。",
    category: "development",
    tags: ["依存関係", "セキュリティ", "更新"],
  },

  // その他
  {
    id: "web-scraping",
    title: "Webページからの情報収集",
    description: "指定したWebページから必要な情報を抽出",
    prompt:
      "指定されたWebページにアクセスして、最新のニュース記事のタイトル、URL、公開日を抽出し、CSV形式で保存してください。",
    category: "other",
    tags: ["スクレイピング", "Web", "データ収集"],
  },
  {
    id: "image-resize",
    title: "画像の一括リサイズ",
    description: "フォルダ内の画像を指定サイズにリサイズ",
    prompt:
      "imagesフォルダ内のすべての画像ファイルを800x600ピクセルにリサイズして、resizedフォルダに保存してください。元の画像は保持してください。",
    category: "other",
    tags: ["画像処理", "リサイズ", "バッチ処理"],
  },
  {
    id: "system-health-check",
    title: "システムヘルスチェック",
    description: "システムリソースの使用状況を確認",
    prompt:
      "CPU使用率、メモリ使用率、ディスク空き容量を確認して、いずれかが80%を超えている場合はアラートを送信してください。結果はログファイルにも記録してください。",
    category: "other",
    tags: ["監視", "システム", "アラート"],
  },
];

// i18n対応のカテゴリ別テンプレート取得
export function getTemplatesByCategoryI18n(
  t: TranslationFunction,
  category: PromptTemplate["category"],
) {
  return getPromptTemplates(t).filter((tmpl) => tmpl.category === category);
}

// i18n対応のキーワード検索
export function searchTemplatesI18n(t: TranslationFunction, keyword: string) {
  const lowerKeyword = keyword.toLowerCase();
  return getPromptTemplates(t).filter(
    (tmpl) =>
      tmpl.title.toLowerCase().includes(lowerKeyword) ||
      tmpl.description.toLowerCase().includes(lowerKeyword) ||
      tmpl.prompt.toLowerCase().includes(lowerKeyword) ||
      tmpl.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword)),
  );
}

// カテゴリ別にテンプレートを取得（レガシー）
export function getTemplatesByCategory(category: PromptTemplate["category"]) {
  return PROMPT_TEMPLATES.filter((t) => t.category === category);
}

// タグで検索（レガシー）
export function searchTemplatesByTag(tag: string) {
  return PROMPT_TEMPLATES.filter((t) =>
    t.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())),
  );
}

// キーワード検索（レガシー）
export function searchTemplates(keyword: string) {
  const lowerKeyword = keyword.toLowerCase();
  return PROMPT_TEMPLATES.filter(
    (t) =>
      t.title.toLowerCase().includes(lowerKeyword) ||
      t.description.toLowerCase().includes(lowerKeyword) ||
      t.prompt.toLowerCase().includes(lowerKeyword) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword)),
  );
}

// i18n対応のカテゴリラベルの取得
export function getCategoryLabelI18n(
  t: TranslationFunction,
  category: PromptTemplate["category"],
): string {
  const labelKeys: Record<PromptTemplate["category"], string> = {
    automation: "templates.category.automation",
    data: "templates.category.data",
    communication: "templates.category.communication",
    development: "templates.category.development",
    other: "templates.category.other",
  };
  return t(labelKeys[category]);
}

// カテゴリラベルの取得（レガシー）
export function getCategoryLabel(category: PromptTemplate["category"]): string {
  const labels: Record<PromptTemplate["category"], string> = {
    automation: "自動化",
    data: "データ処理",
    communication: "コミュニケーション",
    development: "開発",
    other: "その他",
  };
  return labels[category];
}

// カテゴリカラーの取得
export function getCategoryColor(category: PromptTemplate["category"]): string {
  const colors: Record<PromptTemplate["category"], string> = {
    automation: "blue",
    data: "green",
    communication: "purple",
    development: "orange",
    other: "gray",
  };
  return colors[category];
}
