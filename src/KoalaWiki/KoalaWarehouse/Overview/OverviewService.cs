﻿using System.Text;
using System.Text.RegularExpressions;
using KoalaWiki.Domains;
using KoalaWiki.Prompts;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using KoalaWiki.Utilities;

namespace KoalaWiki.KoalaWarehouse.Overview;

public class OverviewService
{
    /// <summary>
    /// 生成项目概述
    /// </summary>
    /// <returns></returns>
    public static async Task<string> GenerateProjectOverview(Kernel kernel, string catalog, string gitRepository,
        string branch, string readme, ClassifyType? classify)
    {
        var sr = new StringBuilder();

        var settings = ExecutionSettingsFactory.CreateSettings(OpenAIOptions.ChatModel, enableToolCalls: true);

        var chat = kernel.GetRequiredService<IChatCompletionService>();
        var history = new ChatHistory();

        string prompt = string.Empty;
        if (classify.HasValue)
        {
            prompt = await PromptContext.Warehouse(nameof(PromptConstant.Warehouse.Overview) + classify,
                new KernelArguments()
                {
                    ["catalogue"] = catalog,
                    ["git_repository"] = gitRepository.Replace(".git", ""),
                    ["branch"] = readme,
                    ["readme"] = branch
                },OpenAIOptions.ChatModel);
        }
        else
        {
            prompt = await PromptContext.Warehouse(nameof(PromptConstant.Warehouse.Overview),
                new KernelArguments()
                {
                    ["catalogue"] = catalog,
                    ["git_repository"] = gitRepository.Replace(".git", ""),
                    ["branch"] = branch,
                    ["readme"] = readme
                },OpenAIOptions.ChatModel);
        }

        history.AddUserMessage(prompt);

        await foreach (var item in chat.GetStreamingChatMessageContentsAsync(history, settings, kernel))
        {
            if (!string.IsNullOrEmpty(item.Content))
            {
                sr.Append(item.Content);
            }
        }

        // 使用正则表达式将<blog></blog>中的内容提取
        var regex = new Regex(@"<blog>(.*?)</blog>", RegexOptions.Singleline);

        var match = regex.Match(sr.ToString());

        if (match.Success)
        {
            // 提取到的内容
            var extractedContent = match.Groups[1].Value;
            sr.Clear();
            sr.Append(extractedContent);
        }

        // 使用正则表达式将```markdown中的内容提取
        regex = new Regex(@"```markdown(.*?)```", RegexOptions.Singleline);
        match = regex.Match(sr.ToString());
        if (match.Success)
        {
            // 提取到的内容
            var extractedContent = match.Groups[1].Value;
            sr.Clear();
            sr.Append(extractedContent);
        }

        return sr.ToString();
    }
}
