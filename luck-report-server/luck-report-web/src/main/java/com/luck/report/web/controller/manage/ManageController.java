package com.luck.report.web.controller.manage;

import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.core.provider.report.ReportFile;
import com.luck.report.core.provider.report.ReportProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 报表管理控制器
 */
@RestController("bean.manageController")
@RequestMapping("/report/manage")
public class ManageController implements ApplicationContextAware {

    private static final Logger logger = LoggerFactory.getLogger(ManageController.class);

    private final List<ReportProvider> reportProviders = new ArrayList<>();

    /**
     * 查询报表来源列表
     */
    @RequestMapping("/loadReportProviders")
    public ResultVO<List<Map<String, Object>>> loadReportProviders() {
        List<Map<String, Object>> providerList = new ArrayList<>();
        for (ReportProvider provider : reportProviders) {
            if (provider.disabled() || provider.getName() == null) {
                continue;
            }
            Map<String, Object> providerData = new HashMap<>();
            providerData.put("name", provider.getName());
            providerData.put("prefix", provider.getPrefix());
            providerData.put("disabled", provider.disabled());
            providerList.add(providerData);
        }
        return ResultVO.success(providerList);
    }

    /**
     * 分页查询报表列表
     */
    @RequestMapping("/queryReports")
    public ResultVO<Map<String, Object>> queryReports(
            @RequestParam String provider,
            @RequestParam(required = false) String reportName,
            @RequestParam(required = false) String directory,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize
    ) {
        try {
            // 根据provider找到对应的ReportProvider
            ReportProvider targetProvider = null;
            for (ReportProvider p : reportProviders) {
                if (p.getPrefix().equals(provider)) {
                    targetProvider = p;
                    break;
                }
            }

            if (targetProvider == null) {
                return ResultVO.error(400, "未找到对应的报表来源");
            }

            // 确定查询路径，如果指定了directory则使用directory，否则使用根路径
            String queryPath = (directory != null && !directory.isEmpty()) ? directory : "/";

            // 获取报表文件
            List<ReportFile> allFiles = targetProvider.getReportFiles(queryPath);
            if (allFiles == null) {
                allFiles = new ArrayList<>();
            }

            // 根据reportName进行模糊过滤
            if (reportName != null && !reportName.isEmpty()) {
                final String searchName = reportName.toLowerCase();
                allFiles = allFiles.stream()
                        .filter(f -> {
                            String fileName = f.getName();
                            return fileName != null && fileName.toLowerCase().contains(searchName);
                        })
                        .collect(Collectors.toList());
            }

            // 分页处理
            int total = allFiles.size();
            int start = (pageNum - 1) * pageSize;
            int end = Math.min(start + pageSize, total);

            List<Map<String, Object>> records = new ArrayList<>();
            if (start < total) {
                List<ReportFile> pageFiles = allFiles.subList(start, end);
                records = pageFiles.stream().map(f -> {
                    Map<String, Object> map = new HashMap<>();
                    // 使用prefix:name格式构建完整路径,例如: file:555555555.ureport.xml
                    // 注意: provider(即getPrefix())已经包含冒号，如"file:"，所以不需要再加冒号
                    // 如果在子目录中，需要包含目录路径
                    String filePath;
                    if (directory != null && !directory.isEmpty() && !"/".equals(directory)) {
                        // 包含目录路径，去掉开头的/
                        String relativePath = directory.startsWith("/") ? directory.substring(1) : directory;
                        filePath = provider + relativePath + "/" + f.getName();
                    } else {
                        filePath = provider + f.getName();
                    }
                    map.put("filePath", filePath);
                    map.put("fileName", f.getName());
                    map.put("isDirectory", f.isDirectory());
                    return map;
                }).collect(Collectors.toList());
            }

            Map<String, Object> result = new HashMap<>();
            result.put("total", total);
            result.put("records", records);

            return ResultVO.success(result);
        } catch (Exception e) {
            logger.error("查询报表列表异常", e);
            return ResultVO.error(500, "查询报表列表失败: " + e.getMessage());
        }
    }

    /**
     * 删除报表
     */
    @RequestMapping("/deleteReport")
    public ResultVO<Void> deleteReport(@RequestParam String file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResultVO.error(400, "报表文件路径不能为空");
            }

            // 根据file的prefix找到对应的ReportProvider
            // 注意: provider.getPrefix() 返回的是 "file:" (已包含冒号)
            ReportProvider targetProvider = null;
            String providerPrefix = null;
            for (ReportProvider provider : reportProviders) {
                if (file.startsWith(provider.getPrefix())) {
                    targetProvider = provider;
                    providerPrefix = provider.getPrefix();
                    break;
                }
            }

            if (targetProvider == null) {
                return ResultVO.error(400, "未找到对应的报表来源");
            }

            // 从file中提取实际的文件路径
            // file格式: file:2.ureport.xml (providerPrefix已经包含冒号，如"file:")
            String actualPath = file.substring(providerPrefix.length());
            String correctPath = file;

            logger.info("删除报表 - 原始路径: {}, 实际路径: {}, 正确路径: {}, provider: {}", file, actualPath, correctPath, providerPrefix);

            try {
                targetProvider.deleteReport(correctPath);
                logger.info("删除报表成功: {}", correctPath);
            } catch (Exception e) {
                logger.warn("使用正确路径删除失败，尝试使用实际路径: {}", actualPath, e);
                targetProvider.deleteReport(actualPath);
                logger.info("删除报表成功（使用实际路径）: {}", actualPath);
            }

            return ResultVO.success();
        } catch (Exception e) {
            logger.error("删除报表异常: {}", file, e);
            return ResultVO.error(500, "删除报表失败: " + e.getMessage());
        }
    }

    /**
     * 设置应用上下文,注入所有ReportProvider
     */
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        Collection<ReportProvider> providers = applicationContext.getBeansOfType(ReportProvider.class).values();
        for (ReportProvider provider : providers) {
            if (provider.disabled() || provider.getName() == null) {
                continue;
            }
            reportProviders.add(provider);
        }
        logger.info("报表管理控制器初始化完成,共加载 {} 个报表来源", reportProviders.size());
    }
}
