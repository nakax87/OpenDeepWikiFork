using System.ClientModel.Primitives;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using KoalaWiki.Domains;
using KoalaWiki.Prompts;
using Microsoft.SemanticKernel;
using KoalaWiki.Utilities;
using Newtonsoft.Json;
using OpenAI.Chat;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace KoalaWiki.KoalaWarehouse;

public class WarehouseClassify
{
    /// <summary>
    /// 根据仓库信息分析得出仓库分类
    /// </summary>
    public static async Task<ClassifyType?> ClassifyAsync(Kernel kernel, string catalog, string readme)
    {
        var prompt = await PromptContext.Warehouse(nameof(PromptConstant.Warehouse.RepositoryClassification),
            new KernelArguments(ExecutionSettingsFactory.CreateSettings(OpenAIOptions.ChatModel))
            {
                ["category"] = catalog,
                ["readme"] = readme
            }, OpenAIOptions.ChatModel);

        var result = await kernel.InvokePromptAsync(prompt);
        var promptResult = string.Empty;

        var jsonContent =
            JsonNode.Parse(ModelReaderWriter.Write(result.GetValue<OpenAIChatMessageContent>().InnerContent));

        // 如果存在reasoning_content则说明是推理
        if (jsonContent!["choices"]![0]!["message"]!["reasoning_content"] != null)
        {
            promptResult += jsonContent!["choices"]![0]!["message"]!["reasoning_content"];
        }

        promptResult += result.ToString();

        // 提取分类结果正则表达式<classify>(.*?)</classify>
        var regex = new Regex(@"<classify>(.*?)</classify>", RegexOptions.Singleline);
        var match = regex.Match(promptResult);
        if (match.Success)
        {
            // 提取到的内容
            var extractedContent = match.Groups[1].Value.Replace("classifyName:", "").Trim();

            // 将提取的内容转换为枚举类型
            if (Enum.TryParse<ClassifyType>(extractedContent, true, out var classifyType))
            {
                return classifyType;
            }
            else
            {
                return null;
            }
        }
        else
        {
            return null;
        }
    }
}