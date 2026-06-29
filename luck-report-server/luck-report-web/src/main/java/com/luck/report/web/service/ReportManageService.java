package com.luck.report.web.service;

import com.luck.report.common.domain.vo.PageResultVO;
import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.core.provider.report.ReportFile;
import com.luck.report.core.provider.report.ReportProvider;
import com.luck.report.web.domain.dto.ReportQueryDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 报表管理服务，负责报表的查询与删除等管理类业务。
 * <p>Bean 名：{@code bean.reportManageService}，避免与第三方系统 Bean 冲突。
 *
 * @author luck-report
 * @since 1.0.0
 */
@Service("bean.reportManageService")
public class ReportManageService implements ApplicationContextAware {

    private static final Logger logger = LoggerFactory.getLogger(ReportManageService.class);

    /** 系统中所有启用的 ReportProvider 列表。 */
    private final List<ReportProvider> reportProviders = new ArrayList<>();

    /**
     * 加载所有已启用的报表来源信息。
     */
    public List<Map<String, Object>> loadReportProviders() {
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
        return providerList;
    }

    /**
     * 分页查询报表列表。
     *
     * @param queryDTO 查询条件
     * @return 分页结果
     */
    public PageResultVO<ReportFile> queryReports(ReportQueryDTO queryDTO) {
        try {
            String provider = queryDTO.getProvider();
            String reportName = queryDTO.getReportName();
            String directory = queryDTO.getDirectory();
            int pageNum = queryDTO.getPageNum() == null ? 1 : queryDTO.getPageNum();
            int pageSize = queryDTO.getPageSize() == null ? 10 : queryDTO.getPageSize();

            ReportProvider targetProvider = findProviderByPrefix(provider);
            if (targetProvider == null) {
                return PageResultVO.error("未找到对应的报表来源");
            }

            // 确定查询路径
            String queryPath = (directory != null && !directory.isEmpty()) ? directory : "/";

            // 获取报表文件
            List<ReportFile> allFiles = targetProvider.getReportFiles(queryPath);
            if (allFiles == null) {
                allFiles = new ArrayList<>();
            }

            // 根据 reportName 进行模糊过滤
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

            List<ReportFile> records = new ArrayList<>();
            if (start < total) {
                records = new ArrayList<>(allFiles.subList(start, end));
            }

            return PageResultVO.success(records, total, pageNum, pageSize);
        } catch (Exception e) {
            logger.error("查询报表列表异常", e);
            return PageResultVO.error("查询报表列表失败: " + e.getMessage());
        }
    }

    /**
     * 删除报表。
     *
     * @param file 报表完整路径（带 provider 前缀）
     */
    public ResultVO<Void> deleteReport(String file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResultVO.error(400, "报表文件路径不能为空");
            }

            // 根据 file 的 prefix 找到对应的 ReportProvider
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

            // 从 file 中提取实际的文件路径
            String actualPath = file.substring(providerPrefix.length());
            String correctPath = file;

            logger.info("删除报表 - 原始路径: {}, 实际路径: {}, 正确路径: {}, provider: {}",
                    file, actualPath, correctPath, providerPrefix);

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
     * 根据 prefix 查找对应的 ReportProvider。
     */
    private ReportProvider findProviderByPrefix(String prefix) {
        if (prefix == null) {
            return null;
        }
        for (ReportProvider p : reportProviders) {
            if (prefix.equals(p.getPrefix())) {
                return p;
            }
        }
        return null;
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        // 防止重复初始化
        if (!reportProviders.isEmpty()) {
            return;
        }
        for (ReportProvider provider : applicationContext.getBeansOfType(ReportProvider.class).values()) {
            if (provider.disabled() || provider.getName() == null) {
                continue;
            }
            reportProviders.add(provider);
        }
        logger.info("报表管理服务初始化完成,共加载 {} 个报表来源", reportProviders.size());
    }

    /**
     * 暴露给同包或同模块的内部辅助：获取当前已注入的 provider 列表副本。
     */
    public List<ReportProvider> getReportProviders() {
        return Collections.unmodifiableList(reportProviders);
    }
}
