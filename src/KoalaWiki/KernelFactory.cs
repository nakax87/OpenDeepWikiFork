﻿using KoalaWiki.Functions;
using KoalaWiki.Options;
using KoalaWiki.plugins;
using Microsoft.SemanticKernel;
using Serilog;
using Amazon.BedrockRuntime;
using Amazon;

#pragma warning disable SKEXP0070
#pragma warning disable SKEXP0010
 
 

namespace KoalaWiki;

/// <summary>
/// 提供一个静态方法来创建和配置一个内核实例，用于各种基于ai的操作。
/// KernelFactory类负责设置必要的服务、插件和配置
/// 内核需要的，包括聊天完成服务，日志记录和文件处理功能。
/// 它支持多个AI模型提供者，并允许可选的代码分析功能。
/// </summary>
public static class KernelFactory
{
    public static Kernel GetKernel(string chatEndpoint,
        string apiKey,
        string gitPath,
        string model = "gpt-4.1", bool isCodeAnalysis = true)
    {
        var kernelBuilder = Kernel.CreateBuilder();

        kernelBuilder.Services.AddSerilog(Log.Logger);

        kernelBuilder.Services.AddSingleton<IPromptRenderFilter, LanguagePromptFilter>();

        if (OpenAIOptions.ModelProvider.Equals("OpenAI", StringComparison.OrdinalIgnoreCase))
        {
            kernelBuilder.AddOpenAIChatCompletion(model, new Uri(chatEndpoint), apiKey,
                httpClient: new HttpClient(new KoalaHttpClientHandler()
                {
                    //添加重试试
                    AllowAutoRedirect = true,
                    MaxAutomaticRedirections = 5,
                    MaxConnectionsPerServer = 200,
                })
                {
                    // 添加重试
                    Timeout = TimeSpan.FromSeconds(16000),
                });
        }
        else if (OpenAIOptions.ModelProvider.Equals("AzureOpenAI", StringComparison.OrdinalIgnoreCase))
        {
            kernelBuilder.AddAzureOpenAIChatCompletion(model, chatEndpoint, apiKey, httpClient: new HttpClient(
                new KoalaHttpClientHandler()
                {
                    //添加重试试
                    AllowAutoRedirect = true,
                    MaxAutomaticRedirections = 5,
                    MaxConnectionsPerServer = 200,
                })
            {
                // 添加重试
                Timeout = TimeSpan.FromSeconds(16000),
            });
        }
        else if (OpenAIOptions.ModelProvider.Equals("Anthropic", StringComparison.OrdinalIgnoreCase))
        {
            kernelBuilder.AddAnthropicChatCompletion(model, apiKey, httpClient: new HttpClient(
                new KoalaHttpClientHandler()
                {
                    //添加重试试
                    AllowAutoRedirect = true,
                    MaxAutomaticRedirections = 5,
                    MaxConnectionsPerServer = 200,
                })
            {
                // 添加重试
                Timeout = TimeSpan.FromSeconds(16000),
            });
        }
        else if (OpenAIOptions.ModelProvider.Equals("AmazonBedrock", StringComparison.OrdinalIgnoreCase))
        {
            // AWS Bedrockリージョンの設定
            var awsRegion = RegionEndpoint.GetBySystemName(OpenAIOptions.AwsRegion);
            // AWS Bedrockクライアントの作成
            // アクセスキー／シークレットキー不要
            var bedrockClient = new AmazonBedrockRuntimeClient(awsRegion);

            // Amazon Bedrock ChatCompletionをカーネルに追加
            kernelBuilder.AddBedrockChatCompletionService(model, bedrockClient);
        }
        else
        {
            throw new Exception("暂不支持：" + OpenAIOptions.ModelProvider + "，请使用OpenAI、AzureOpenAI、Anthropic或AmazonBedrock");
        }

        if (isCodeAnalysis)
        {
            kernelBuilder.Plugins.AddFromPromptDirectory(Path.Combine(AppContext.BaseDirectory, "plugins",
                "CodeAnalysis"));
        }

        // 添加文件函数
        var fileFunction = new FileFunction(gitPath);
        kernelBuilder.Plugins.AddFromObject(fileFunction);

        if (DocumentOptions.EnableCodeDependencyAnalysis)
        {
            var codeAnalyzeFunction = new CodeAnalyzeFunction(gitPath);
            kernelBuilder.Plugins.AddFromObject(codeAnalyzeFunction);
        }

        var kernel = kernelBuilder.Build();

        return kernel;
    }
}