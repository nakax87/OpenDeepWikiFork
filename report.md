# OpenDeepWiki LLM接続アーキテクチャ調査レポート

## 概要

このレポートは、OpenDeepWikiアプリケーションにおけるLLM（Large Language Model）接続処理のアーキテクチャについて包括的に調査した結果をまとめたものです。

## 調査結果の要約

**結論：このアプリケーションのLLM接続処理は完全にKernelFactoryに集約されており、統一された一元化アーキテクチャを採用しています。**

## 1. アーキテクチャ概要

### 1.1 一元化された接続管理

- **KernelFactory.GetKernel()** が唯一のLLM接続エントリーポイント
- 全11ファイル、約20箇所でKernelFactoryを使用
- 直接的なLLMクライアント（OpenAI SDK、Anthropic SDK等）の使用は**ゼロ**
- 代替的な接続方法は**一切存在しない**

### 1.2 Microsoft Semantic Kernel完全依存

アプリケーション全体がMicrosoft Semantic Kernelを基盤として構築されており、すべてのLLM操作はSemanticKernelの抽象化レイヤーを通じて実行されます。

## 2. KernelFactory詳細分析

### 2.1 ファクトリーメソッド

**ファイル**: `src/KoalaWiki/KernelFactory.cs`

```csharp
public static Kernel GetKernel(string chatEndpoint, string apiKey, string gitPath, 
    string model = "gpt-4.1", bool isCodeAnalysis = true)
```

### 2.2 対応LLMプロバイダー

| プロバイダー | 実装メソッド | 設定要件 |
|-------------|-------------|----------|
| OpenAI | `AddOpenAIChatCompletion` | Endpoint + API Key |
| Azure OpenAI | `AddAzureOpenAIChatCompletion` | Endpoint + API Key |
| Anthropic | `AddAnthropicChatCompletion` | API Key |
| Amazon Bedrock | `AddAmazonBedrockChatCompletion` | AWS認証情報 |

### 2.3 共通設定

すべてのプロバイダーで統一された設定：
- カスタムHTTPクライアント（`KoalaHttpClientHandler`）
- 16秒タイムアウト
- 最大5回リダイレクト
- 200接続/サーバーのコネクションプール

## 3. 機能別LLM使用箇所

### 3.1 チャット機能
- **ファイル**: `ChatService.cs`
- **使用箇所**: 3箇所（Line 56, 137, 288）
- **用途**: 通常チャット、Deep Research、ストリーミング応答

### 3.2 リポジトリ処理
- **ファイル**: `RepositoryService.cs`
- **使用箇所**: 2箇所（Line 470, 526）
- **用途**: ドキュメント分析、カタログ処理

### 3.3 倉庫処理タスク
- **ファイル**: `WarehouseProcessingTask.*.cs`
- **用途**: 
  - 分析処理（`Analyse.cs`）
  - コミット処理（`Commit.cs`）
  - 説明生成（`DescriptionTask.cs`）
  - 機能プロンプト生成（`FunctionPromptTask.cs`）

### 3.4 コード解析・索引
- **ファイル**: `DocumentsService.cs`, `EnhancedCodeIndexer.cs`
- **用途**: README生成、コード解析、埋め込み検索

### 3.5 ファインチューニング
- **ファイル**: `FineTuningService.cs`
- **用途**: データセット生成、モデル訓練

### 3.6 MCP統合
- **ファイル**: `WarehouseTool.cs`
- **用途**: Model Context Protocol、外部ツール統合

### 3.7 思考カタログ
- **ファイル**: `GenerateThinkCatalogueService.cs`
- **用途**: AI思考プロセスの可視化

## 4. 設定管理

### 4.1 OpenAIOptions設定クラス

**ファイル**: `src/KoalaWiki/Options/OpenAIOptions.cs`

主要設定項目：
- `ModelProvider`: 使用するLLMサービス（OpenAI/AzureOpenAI/Anthropic/AmazonBedrock）
- `ChatModel`: チャット用モデル
- `AnalysisModel`: 分析用モデル
- `DeepResearchModel`: 深層研究用モデル
- `EmbeddingsModel`: 埋め込み用モデル
- `Endpoint`: APIエンドポイント
- `ChatApiKey`: API認証キー
- `AwsRegion`: AWS Bedrock用設定

### 4.2 設定検証

プロバイダー別の必須パラメータ検証：
- **Amazon Bedrock以外**: `ChatApiKey`と`Endpoint`が必須
- **Amazon Bedrock**: AWS認証情報（Region）が必須、アクセスキー、シークレットキーは不要

### 4.3 ヘルパーメソッド

Amazon Bedrock対応のためのヘルパーメソッド：
- `GetEffectiveEndpoint()`: プロバイダーに応じた適切なエンドポイント取得
- `GetEffectiveApiKey()`: プロバイダーに応じた適切なAPIキー取得

## 5. エラーハンドリングと復旧機能

### 5.1 HTTPレベルのリトライ
- **KoalaHttpClientHandler**: カスタムHTTPハンドラー
- 自動リトライ機構
- 接続プールの最適化

### 5.2 アプリケーションレベルのリトライ
- **WarehouseProcessingTask**: Pollyベースの指数バックオフリトライ
- **DocumentsService**: カスタムリトライループ（最大5回）

### 5.3 グレースフルデグラデーション
- LLMサービス利用不可時の適切な処理
- Serilogによる包括的なエラーログ
- 処理失敗時のトランザクションロールバック

## 6. Amazon Bedrock統合の影響

### 6.1 アーキテクチャへの適合

Amazon Bedrock統合は既存の一元化アーキテクチャに完全に適合：
- KernelFactory経由で全機能がBedrock対応
- 設定変更のみで全システムがBedrock利用可能
- 既存機能との完全な後方互換性

### 6.2 修正されたファイル

Amazon Bedrock対応で修正されたファイル：
1. `KernelFactory.cs` - Bedrockプロバイダー追加
2. `OpenAIOptions.cs` - AWS設定とヘルパーメソッド追加
3. `KoalaWiki.csproj` - Bedrock関連NuGetパッケージ追加
4. 各サービスファイル - ヘルパーメソッド使用への変更

## 7. アーキテクチャの利点

### 7.1 保守性
- 単一の接続ポイントによる一元管理
- 設定変更の影響範囲の明確化
- コードの重複排除

### 7.2 一貫性
- 全機能で統一されたLLM処理
- 同一のエラーハンドリング
- 統一されたログ出力

### 7.3 拡張性
- 新しいLLMプロバイダーの追加が容易
- プラグインアーキテクチャによる機能拡張
- モジュール化された設計

### 7.4 可観測性
- 一元化されたログ・監視
- 統一されたメトリクス収集
- デバッグの容易さ

### 7.5 設定管理
- 環境変数による統一設定
- Docker Compose対応
- 本番環境での設定分離

## 8. 技術スタック

### 8.1 使用技術
- **.NET 9**: 基盤フレームワーク
- **Microsoft Semantic Kernel**: LLM抽象化レイヤー
- **Microsoft.KernelMemory**: 埋め込み・RAG機能
- **Serilog**: ログ記録
- **LibGit2Sharp**: Git操作

### 8.2 NuGetパッケージ
- `Microsoft.SemanticKernel`
- `Microsoft.SemanticKernel.Connectors.OpenAI`
- `Microsoft.SemanticKernel.Connectors.AzureOpenAI`
- `Microsoft.SemanticKernel.Connectors.Amazon`
- `Lost.SemanticKernel.Connectors.Anthropic`
- `AWSSDK.BedrockRuntime`

## 9. 今後の推奨事項

### 9.1 アーキテクチャの維持
- 現在の一元化アーキテクチャの継続
- 新機能開発時のKernelFactory使用の徹底
- 直接的なLLMクライアント使用の回避

### 9.2 監視・観測性の向上
- LLM呼び出しのメトリクス収集
- パフォーマンス監視の強化
- コスト追跡機能の追加

### 9.3 セキュリティ強化
- API キーの安全な管理
- AWS IAMロールの活用
- 監査ログの充実

## 10. 結論

OpenDeepWikiアプリケーションは、非常に良く設計された一元化LLMアーキテクチャを採用しています。この設計により：

1. **一貫性のあるLLM操作**が全機能で実現されている
2. **複数のLLMプロバイダー対応**が統一的に管理されている
3. **Amazon Bedrock統合**が既存設計思想に完全適合している
4. **保守性・拡張性・可観測性**が高いレベルで確保されている

この調査により、アプリケーションのLLM接続処理が完全にKernelFactoryに集約されていることが確認され、各機能が統一されたアーキテクチャの下で動作していることが明らかになりました。

---

**調査実施日**: 2025年6月15日  
**調査対象**: OpenDeepWiki Fork リポジトリ  
**調査者**: Claude AI (Anthropic)