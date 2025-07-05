﻿using System.Text.Json;
using KoalaWiki.Domains;
using KoalaWiki.Domains.Warehouse;
using Microsoft.EntityFrameworkCore;

namespace KoalaWiki.KoalaWarehouse;

/// <summary>
/// 思维导图服务生成
/// </summary>
/// <param name="service"></param>
public sealed class MiniMapBackgroundService(IServiceProvider service) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(1000, stoppingToken); // 等待服务启动完成

        using var scope = service.CreateScope();

        var context = scope.ServiceProvider.GetRequiredService<IKoalaWikiContext>();


        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 使用sql to linq 获取minid和warehouse的表不存在的数据,如果warehouse表状态=2，但是不存在minid的记录则获取

                // 获取存在的id
                var existingMiniMapIds = await context.MiniMaps
                    .Select(m => m.WarehouseId)
                    .ToListAsync(stoppingToken);

                // 查询需要生成知识图谱的仓库
                var query = context.Warehouses
                    .Where(w => w.Status == WarehouseStatus.Completed && !existingMiniMapIds.Contains(w.Id))
                    .OrderBy(w => w.CreatedAt)
                    .AsNoTracking();

                var item = await query.FirstOrDefaultAsync(stoppingToken);
                if (item == null)
                {
                    Log.Logger.Information("没有需要生成知识图谱的仓库");
                    await Task.Delay(10000, stoppingToken); // 等待10秒后重试
                    continue;
                }

                Log.Logger.Information("开始生成知识图谱，共有 {Count} 个仓库需要处理",
                    await query.CountAsync(cancellationToken: stoppingToken));

                try
                {
                    Log.Logger.Information("开始处理仓库 {WarehouseName}", item.Name);

                    var documents = await context.Documents
                        .Where(d => d.WarehouseId == item.Id)
                        .FirstOrDefaultAsync(stoppingToken);

                    var miniMap = await MiniMapService.GenerateMiniMap(item.OptimizedDirectoryStructure,
                        item, documents.GitPath);
                    if (miniMap != null)
                    {
                        context.MiniMaps.Add(new MiniMap
                        {
                            WarehouseId = item.Id,
                            Value = JsonSerializer.Serialize(miniMap, JsonSerializerOptions.Web),
                            CreatedAt = DateTime.UtcNow,
                            Id = Guid.NewGuid().ToString("N")
                        });
                        await context.SaveChangesAsync(stoppingToken);
                        Log.Logger.Information("仓库 {WarehouseName} 的知识图谱生成成功", item.Name);
                    }
                    else
                    {
                        Log.Logger.Warning("仓库 {WarehouseName} 的知识图谱生成失败", item.Name);
                    }
                }
                catch (Exception e)
                {
                    Log.Logger.Error(e, "处理仓库 {WarehouseName} 时发生异常", item.Name);
                }
            }
            catch (Exception e)
            {
                await Task.Delay(10000, stoppingToken); // 等待1秒后重试
                Log.Logger.Error("MiniMapBackgroundService 执行异常: {Message}", e.Message);
            }
        }
    }
}