﻿using KoalaWiki.Extensions;
using Newtonsoft.Json;

namespace KoalaWiki.Options;

public class OpenAIOptions
{
    /// <summary>
    /// ChatGPT模型
    /// </summary>
    public static string ChatModel { get; set; } = string.Empty;

    /// <summary>
    /// 分析模型
    /// </summary>
    public static string AnalysisModel { get; set; } = string.Empty;

    /// <summary>
    /// ChatGPT API密钥
    /// </summary>
    public static string ChatApiKey { get; set; } = string.Empty;

    /// <summary>
    /// API地址
    /// </summary>
    public static string Endpoint { get; set; } = string.Empty;

    /// <summary>
    /// 模型提供商
    /// </summary>
    public static string ModelProvider { get; set; } = string.Empty;

    /// <summary>
    /// 最大文件限制
    /// </summary>
    public static int MaxFileLimit { get; set; } = 10;

    /// <summary>
    /// 深度研究模型
    /// </summary>
    public static string DeepResearchModel { get; set; } = string.Empty;

    /// <summary>
    /// 嵌入模型
    /// </summary>
    public static string EmbeddingsModel { get; set; } = string.Empty;
    
    /// <summary>
    /// AWSリージョン
    /// </summary>
    public static string AwsRegion { get; set; } = string.Empty;
    
    /// <summary>
    /// AWSアクセスキーID
    /// </summary>
    public static string AwsAccessKeyId { get; set; } = string.Empty;
    
    /// <summary>
    /// AWSシークレットアクセスキー
    /// </summary>
    public static string AwsSecretAccessKey { get; set; } = string.Empty;

    public static void InitConfig(IConfiguration configuration)
    {
        ChatModel = (configuration.GetValue<string>("CHAT_MODEL") ??
                     configuration.GetValue<string>("ChatModel") ?? string.Empty).GetTrimmedValueOrEmpty();
        AnalysisModel = (configuration.GetValue<string>("ANALYSIS_MODEL") ??
                         configuration.GetValue<string>("AnalysisModel") ?? string.Empty).GetTrimmedValueOrEmpty();
        ChatApiKey = (configuration.GetValue<string>("CHAT_API_KEY") ??
                      configuration.GetValue<string>("ChatApiKey") ?? string.Empty).GetTrimmedValueOrEmpty();
        Endpoint = (configuration.GetValue<string>("ENDPOINT") ??
                    configuration.GetValue<string>("Endpoint") ?? string.Empty).GetTrimmedValueOrEmpty();
        ModelProvider = (configuration.GetValue<string>("MODEL_PROVIDER") ??
                         configuration.GetValue<string>("ModelProvider")).GetTrimmedValueOrEmpty();

        DeepResearchModel = (configuration.GetValue<string>("DEEP_RESEARCH_MODEL") ??
                             configuration.GetValue<string>("DeepResearchModel")).GetTrimmedValueOrEmpty();

        MaxFileLimit = configuration.GetValue<int>("MAX_FILE_LIMIT") > 0
            ? configuration.GetValue<int>("MAX_FILE_LIMIT")
            : 10;

        EmbeddingsModel = (configuration.GetValue<string>("EMBEDDINGS_MODEL") ??
                           configuration.GetValue<string>("EmbeddingsModel")).GetTrimmedValueOrEmpty();
        
        AwsRegion = (configuration.GetValue<string>("AWS_REGION") ??
                     configuration.GetValue<string>("AwsRegion")).GetTrimmedValueOrEmpty();
        
        AwsAccessKeyId = (configuration.GetValue<string>("AWS_ACCESS_KEY_ID") ??
                          configuration.GetValue<string>("AwsAccessKeyId")).GetTrimmedValueOrEmpty();
        
        AwsSecretAccessKey = (configuration.GetValue<string>("AWS_SECRET_ACCESS_KEY") ??
                              configuration.GetValue<string>("AwsSecretAccessKey")).GetTrimmedValueOrEmpty();

        // EnableIncrementalUpdate
        var enableIncrementalUpdate = configuration.GetValue<bool>("ENABLE_INCREMENTAL_UPDATE");
        DocumentOptions.EnableIncrementalUpdate = enableIncrementalUpdate;

        if (string.IsNullOrEmpty(ModelProvider))
        {
            ModelProvider = "OpenAI";
        }

        // 检查参数
        ValidateRequiredParameter(ChatModel, "ChatModel");

        // プロバイダー別の必須パラメータ検証
        var isAmazonBedrock = ModelProvider.Equals("AmazonBedrock", StringComparison.OrdinalIgnoreCase);
        
        if (isAmazonBedrock)
        {
            ValidateRequiredParameter(AwsRegion, "AWS_REGION");
            ValidateRequiredParameter(AwsAccessKeyId, "AWS_ACCESS_KEY_ID");
            ValidateRequiredParameter(AwsSecretAccessKey, "AWS_SECRET_ACCESS_KEY");
        }
        else
        {
            ValidateRequiredParameter(ChatApiKey, "ChatApiKey");
            ValidateRequiredParameter(Endpoint, "Endpoint");
        }

        if (string.IsNullOrEmpty(DeepResearchModel))
        {
            DeepResearchModel = ChatModel;
        }

        // 如果没设置分析模型则使用默认的
        if (string.IsNullOrEmpty(AnalysisModel))
        {
            AnalysisModel = ChatModel;
        }
    }

    private static void ValidateRequiredParameter(string value, string parameterName)
    {
        if (string.IsNullOrEmpty(value))
        {
            throw new Exception($"{parameterName} is empty");
        }
    }
}