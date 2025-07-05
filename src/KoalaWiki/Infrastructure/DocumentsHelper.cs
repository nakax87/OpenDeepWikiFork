﻿using System.Runtime.CompilerServices;
using System.Text;
using System.Text.RegularExpressions;
using KoalaWiki.Domains;
using KoalaWiki.Domains.Warehouse;

namespace KoalaWiki.Infrastructure;

public class DocumentsHelper
{
    /// <summary>
    /// 处理目录项，递归生成文档目录
    /// </summary>
    /// <param name="items"></param>
    /// <param name="parentId"></param>
    /// <param name="warehouse"></param>
    /// <param name="document"></param>
    /// <param name="documents"></param>
    public static void ProcessCatalogueItems(List<DocumentResultCatalogueItem> items, string? parentId,
        Warehouse warehouse,
        Document document, List<DocumentCatalog>? documents)
    {
        int order = 0; // 创建排序计数器
        foreach (var item in items)
        {
            item.title = item.title.Replace(" ", "");
            var documentItem = new DocumentCatalog
            {
                WarehouseId = warehouse.Id,
                Description = item.title,
                Id = Guid.NewGuid() + item.title,
                Name = item.name,
                Url = item.title,
                DucumentId = document.Id,
                ParentId = parentId,
                Prompt = item.prompt,
                Order = order++ // 为当前层级的每个项目设置顺序值并递增
            };

            documents.Add(documentItem);

            ProcessCatalogueItems(item.children.ToList(), documentItem.Id, warehouse, document,
                documents);
        }
    }
    
    /// <summary>
    /// 读取仓库的ReadMe文件
    /// </summary>
    /// <returns></returns>
    public static async Task<string> ReadMeFile(string path)
    {
        var readmePath = Path.Combine(path, "README.md");
        if (File.Exists(readmePath))
        {
            return await File.ReadAllTextAsync(readmePath);
        }

        readmePath = Path.Combine(path, "README.txt");
        if (File.Exists(readmePath))
        {
            return await File.ReadAllTextAsync(readmePath);
        }

        readmePath = Path.Combine(path, "README");
        if (File.Exists(readmePath))
        {
            return await File.ReadAllTextAsync(readmePath);
        }

        return string.Empty;
    }
    
    /// <summary>
    /// 获取模型的最大tokens数量
    /// </summary>
    /// <param name="model"></param>
    /// <returns></returns>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public static int? GetMaxTokens(string model)
    {
        if (model.StartsWith("deepseek-r1", StringComparison.OrdinalIgnoreCase))
        {
            return 32768;
        }

        if (model.StartsWith("o"))
        {
            return 65535;
        }

        if (model.StartsWith("MiniMax-M1", StringComparison.OrdinalIgnoreCase))
        {
            return 40000;
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
            "doubao-1-5-pro-256k-250115" => 256000,
            "o3-mini" => 32768,
            "Qwen/Qwen3-235B-A22B" => null,
            "grok-3" => 65536,
            "qwen2.5-coder-3b-instruct" => 65535,
            "qwen3-235b-a22b" => 16384,
            "claude-sonnet-4-20250514" => 63999,
            "gemini-2.5-pro-preview-05-06" => 32768,
            "gemini-2.5-flash-preview-04-17" => 32768,
            "Qwen3-32B" => 32768,
            "deepseek-r1:32b-qwen-distill-fp16" => 32768,
            _ => null
        };
    }

    /// <summary>
    /// 解析指定目录下单.gitignore配置忽略的文件
    /// </summary>
    /// <returns></returns>
    public static string[] GetIgnoreFiles(string path)
    {
        var ignoreFilePath = Path.Combine(path, ".gitignore");
        if (File.Exists(ignoreFilePath))
        {
            // 需要去掉注释
            var lines = File.ReadAllLines(ignoreFilePath);
            var ignoreFiles = lines.Where(x => !string.IsNullOrWhiteSpace(x) && !x.StartsWith("#"))
                .Select(x => x.Trim()).ToList();

            ignoreFiles.AddRange(DocumentOptions.ExcludedFiles);

            return ignoreFiles.ToArray();
        }

        return [];
    }

    public static List<PathInfo> GetCatalogueFiles(string path)
    {
        var ignoreFiles = GetIgnoreFiles(path);

        var pathInfos = new List<PathInfo>();
        // 递归扫描目录所有文件和目录
        ScanDirectory(path, pathInfos, ignoreFiles);
        return pathInfos;
    }

    public static string GetCatalogue(string path)
    {
        var ignoreFiles = GetIgnoreFiles(path);

        var pathInfos = new List<PathInfo>();
        // 递归扫描目录所有文件和目录
        ScanDirectory(path, pathInfos, ignoreFiles);
        var catalogue = new StringBuilder();

        foreach (var info in pathInfos)
        {
            // 删除前缀 Constant.GitPath
            var relativePath = info.Path.Replace(path, "").TrimStart('\\');

            // 过滤.开头的文件
            if (relativePath.StartsWith("."))
                continue;

            catalogue.Append($"{relativePath}\n");
        }

        // 直接返回
        return catalogue.ToString();
    }

    /// <summary>
    /// 获取优化的树形目录结构，大幅节省tokens
    /// </summary>
    /// <param name="path">扫描路径</param>
    /// <param name="format">输出格式：compact(紧凑文本)、json(JSON格式)、pathlist(优化路径列表)</param>
    /// <returns>优化后的目录结构</returns>
    public static string GetCatalogueOptimized(string path, string format = "compact")
    {
        var ignoreFiles = GetIgnoreFiles(path);
        var pathInfos = new List<PathInfo>();

        // 递归扫描目录所有文件和目录
        ScanDirectory(path, pathInfos, ignoreFiles);

        // 构建文件树
        var fileTree = FileTreeBuilder.BuildTree(pathInfos, path);

        return format.ToLower() switch
        {
            "json" => FileTreeBuilder.ToCompactJson(fileTree),
            "pathlist" => string.Join("\n", FileTreeBuilder.ToPathList(fileTree)),
            "compact" or _ => FileTreeBuilder.ToCompactString(fileTree)
        };
    }


    public static void ScanDirectory(string directoryPath, List<PathInfo> infoList, string[] ignoreFiles)
    {
        // 遍历所有文件
        infoList.AddRange(from file in Directory.GetFiles(directoryPath).Where(file =>
            {
                var filename = Path.GetFileName(file);

                // 支持*的匹配
                foreach (var pattern in ignoreFiles)
                {
                    if (string.IsNullOrWhiteSpace(pattern) || pattern.StartsWith("#"))
                        continue;

                    var trimmedPattern = pattern.Trim();

                    // 转换gitignore模式到正则表达式
                    if (trimmedPattern.Contains('*'))
                    {
                        string regexPattern = "^" + Regex.Escape(trimmedPattern).Replace("\\*", ".*") + "$";
                        if (Regex.IsMatch(filename, regexPattern, RegexOptions.IgnoreCase))
                            return false;
                    }
                    else if (filename.Equals(trimmedPattern, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                return true;
            })
            let fileInfo = new FileInfo(file)
            // 过滤掉大于1M的文件
            where fileInfo.Length < 1024 * 1024 * 1
            select new PathInfo { Path = file, Name = fileInfo.Name, Type = "File" });

        // 遍历所有目录，并递归扫描
        foreach (var directory in Directory.GetDirectories(directoryPath))
        {
            var dirName = Path.GetFileName(directory);

            // 过滤.开头目录
            if (dirName.StartsWith("."))
                continue;

            // 支持通配符匹配目录
            bool shouldIgnore = false;
            foreach (var pattern in ignoreFiles)
            {
                if (string.IsNullOrWhiteSpace(pattern) || pattern.StartsWith("#"))
                    continue;

                var trimmedPattern = pattern.Trim();

                // 如果模式以/结尾，表示只匹配目录
                bool directoryPattern = trimmedPattern.EndsWith("/");
                if (directoryPattern)
                    trimmedPattern = trimmedPattern.TrimEnd('/');

                // 转换gitignore模式到正则表达式
                if (trimmedPattern.Contains('*'))
                {
                    string regexPattern = "^" + Regex.Escape(trimmedPattern).Replace("\\*", ".*") + "$";
                    if (Regex.IsMatch(dirName, regexPattern, RegexOptions.IgnoreCase))
                    {
                        shouldIgnore = true;
                        break;
                    }
                }
                else if (dirName.Equals(trimmedPattern, StringComparison.OrdinalIgnoreCase))
                {
                    shouldIgnore = true;
                    break;
                }
            }

            if (shouldIgnore)
                continue;

            // 递归扫描子目录
            ScanDirectory(directory, infoList, ignoreFiles);
        }
    }
}