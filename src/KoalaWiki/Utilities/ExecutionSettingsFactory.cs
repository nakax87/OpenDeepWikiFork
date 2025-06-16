using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Microsoft.SemanticKernel.Connectors.Amazon;
using KoalaWiki.Options;

namespace KoalaWiki.Utilities
{
    public static class ExecutionSettingsFactory
    {
        public static PromptExecutionSettings CreateSettings(
            string model, 
            int? maxTokens = null, 
            double temperature = 0.5, 
            bool enableToolCalls = false)
        {
            var effectiveMaxTokens = maxTokens ?? GetMaxTokens(model);
            
            if (OpenAIOptions.ModelProvider.Equals("AmazonBedrock", StringComparison.OrdinalIgnoreCase))
            {
                #pragma warning disable SKEXP0070 // 種類は、評価の目的でのみ提供されています。将来の更新で変更または削除されることがあります。続行するには、この診断を非表示にします。
                return new AmazonClaudeExecutionSettings()
                {
                    MaxTokensToSample = effectiveMaxTokens ?? 4096,
                    Temperature = (float)temperature
                };
                #pragma warning restore SKEXP0070 // 種類は、評価の目的でのみ提供されています。将来の更新で変更または削除されることがあります。続行するには、この診断を非表示にします。
            }
            else
            {
                return new OpenAIPromptExecutionSettings()
                {
                    MaxTokens = effectiveMaxTokens,
                    Temperature = temperature,
                    ToolCallBehavior = enableToolCalls ? ToolCallBehavior.AutoInvokeKernelFunctions : null
                };
            }
        }

        public static int? GetMaxTokens(string model)
        {
            if (model.StartsWith("deepseek-r1"))
            {
                return 32768;
            }

            if (model.StartsWith("DeepSeek-R1"))
            {
                return 32768;
            }

            if (model.StartsWith("o"))
            {
                return 65535;
            }

            return model switch
            {
                "deepseek-chat" => 8192,
                "DeepSeek-V3" => 16384,
                "QwQ-32B" => 8192,
                "gpt-4.1-mini" => 32768,
                "gpt-4.1" => 32768,
                "gpt-4o" => 16384,
                "o4-mini" => 32768,
                "doubao-1-5-pro-256k-250115" => 12288,
                "o3-mini" => 32768,
                "Qwen/Qwen3-235B-A22B" => null,
                "grok-3" => 65536,
                "qwen2.5-coder-3b-instruct" => 65535,
                "qwen3-235b-a22b" => 65535,
                "claude-sonnet-4-20250514" => 63999,
                "gemini-2.5-pro-preview-05-06" => 32768,
                "gemini-2.5-flash-preview-04-17" => 32768,
                "Qwen3-32B" => 32768,
                "deepseek-r1" => 32768,
                "deepseek-r1:32b-qwen-distill-fp16" => 32768,
                "gpt-4o-mini" => 16384,
                "gpt-4-turbo" => 4096,
                "gpt-4" => 4096,
                "gpt-3.5-turbo" => 4096,
                "claude-3-5-sonnet-20240620" => 8192,
                "claude-3-5-sonnet-20241022" => 8192,
                "claude-3-opus-20240229" => 4096,
                "claude-3-sonnet-20240229" => 4096,
                "claude-3-haiku-20240307" => 4096,
                "anthropic.claude-3-5-sonnet-20240620-v1:0" => 8192,
                "anthropic.claude-3-5-sonnet-20241022-v2:0" => 8192,
                "anthropic.claude-3-opus-20240229-v1:0" => 4096,
                "anthropic.claude-3-sonnet-20240229-v1:0" => 4096,
                "anthropic.claude-3-haiku-20240307-v1:0" => 4096,
                _ => null
            };
        }
    }
}