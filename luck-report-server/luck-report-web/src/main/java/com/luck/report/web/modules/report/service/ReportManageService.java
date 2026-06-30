package com.luck.report.web.modules.report.service;

import com.luck.report.common.domain.vo.PageResultVO;
import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.core.provider.report.ReportFile;
import com.luck.report.core.provider.report.ReportFilePage;
import com.luck.report.core.provider.report.ReportProvider;
import com.luck.report.web.modules.report.domain.dto.ReportQueryDTO;
import com.luck.report.web.modules.report.domain.vo.report.ReportExportTemplateVo;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
     * 分页查询报表列表。
     * <p>过滤与分页下沉到 {@link ReportProvider#pageReportFiles(int, int, Map)}，避免在调用方拉取全量数据。
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

            // 透传给 Provider 的参数：路径、名称模糊匹配、是否包含目录项
            Map<String, Object> params = new HashMap<>(4);
            if (directory != null && !directory.isEmpty()) {
                params.put("path", directory);
            }
            if (reportName != null && !reportName.isEmpty()) {
                params.put("name", reportName);
            }
            // 管理列表场景下不展示目录项，仅展示报表文件
            params.put("includeDirectory", Boolean.FALSE);

            ReportFilePage result = targetProvider.pageReportFiles(pageNum, pageSize, params);
            List<ReportFile> records = result == null ? Collections.emptyList() : result.getRecords();
            long total = result == null ? 0L : result.getTotal();
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
     * 导入报表模板：把上传的 XML 文件写入到指定 provider 下。
     * <p>完整文件路径 = {@code providerPrefix + fileName}。fileName 必须以
     * {@link ReportProvider#REPORT_FILE_SUFFIX} 结尾，否则强制补齐。
     *
     * @param providerPrefix 报表来源前缀（如 file:）
     * @param fileName       原始文件名（应包含 .ureport.xml 后缀）
     * @param content        报表 XML 字符串
     * @return 写入结果，code=0 成功，data 为保存后的 {@link ReportFile}（path 不含 provider 前缀）
     */
    public ResultVO<ReportFile> importTemplate(String providerPrefix, String fileName, String content) {
        try {
            if (providerPrefix == null || providerPrefix.trim().isEmpty()) {
                return ResultVO.error(400, "报表来源不能为空");
            }
            if (fileName == null || fileName.trim().isEmpty()) {
                return ResultVO.error(400, "文件名不能为空");
            }
            if (content == null) {
                return ResultVO.error(400, "文件内容不能为空");
            }
            providerPrefix = providerPrefix.trim();
            fileName = fileName.trim();
            // 安全：禁止 ../ 路径穿越
            if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
                return ResultVO.error(400, "文件名非法: " + fileName);
            }
            // 强制 .ureport.xml 后缀
            if (!fileName.toLowerCase().endsWith(ReportProvider.REPORT_FILE_SUFFIX)) {
                fileName = fileName + ReportProvider.REPORT_FILE_SUFFIX;
            }

            String filePath = providerPrefix + fileName;
            ReportProvider provider;
            try {
                provider = resolveProvider(filePath);
            } catch (Exception e) {
                return ResultVO.error(404, "未找到对应的报表来源: " + providerPrefix);
            }

            // 第一个参数 title 是展示名，按 ReportFile.name 约定需去除 .ureport.xml 后缀
            String title = ReportProvider.stripReportSuffix(fileName);
            ReportFile savedFile = provider.saveReport(title, filePath, content);
            if (savedFile == null) {
                return ResultVO.error(500, "Provider returned empty ReportFile after import.");
            }
            logger.info("导入报表成功: {} -> {}", filePath, savedFile.getPath());
            return ResultVO.success("Imported", savedFile);
        } catch (Exception e) {
            logger.error("导入报表异常: {} / {}", providerPrefix, fileName, e);
            return ResultVO.error(500, "导入报表失败: " + e.getMessage());
        }
    }

    /**
     * 导出报表：根据完整文件路径读取源文件内容（XML），并返回文件名与字节内容，
     * 供前端下载。
     *
     * @param filePath 报表完整路径（带 provider 前缀），如 file:xxx.ureport.xml / db:123
     * @return 包含下载文件名与字节内容的结果
     */
    public ResultVO<ReportExportTemplateVo> exportTemplate(String filePath) {
        try {
            if (filePath == null || filePath.trim().isEmpty()) {
                return ResultVO.error(400, "报表文件路径不能为空");
            }
            filePath = filePath.trim();
            ReportProvider provider;
            try {
                provider = resolveProvider(filePath);
            } catch (Exception e) {
                return ResultVO.error(404, "未找到对应的报表来源: " + filePath);
            }
            // 优先用 ReportFile.getName() 作为下载文件名（已自动补 .ureport.xml 后缀）
            String downloadName;
            try {
                ReportFile rf = provider.getReportFile(filePath);
                downloadName = (rf != null && rf.getName() != null) ? rf.getName() : null;
            } catch (Exception ignore) {
                downloadName = null;
            }
            if (downloadName == null || downloadName.isEmpty()) {
                int slash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf(':'));
                downloadName = (slash >= 0 ? filePath.substring(slash + 1) : filePath);
                if (!downloadName.toLowerCase().endsWith(ReportProvider.REPORT_FILE_SUFFIX)) {
                    downloadName = downloadName + ReportProvider.REPORT_FILE_SUFFIX;
                }
            }

            InputStream in = null;
            byte[] bytes;
            try {
                in = provider.loadReport(filePath);
                if (in == null) {
                    return ResultVO.error(404, "报表内容为空: " + filePath);
                }
                bytes = IOUtils.toByteArray(in);
            } finally {
                IOUtils.closeQuietly(in);
            }
            return ResultVO.success("Exported", new ReportExportTemplateVo(downloadName, bytes));
        } catch (Exception e) {
            logger.error("导出报表异常: {}", filePath, e);
            return ResultVO.error(500, "导出报表失败: " + e.getMessage());
        }
    }

    /**
     * 根据文件路径匹配对应的 ReportProvider，找不到时抛 IllegalStateException。
     */
    private ReportProvider resolveProvider(String filePath) {
        for (ReportProvider p : reportProviders) {
            String prefix = p.getPrefix();
            if (prefix != null && filePath.startsWith(prefix)) {
                return p;
            }
        }
        throw new IllegalStateException("未找到对应的报表来源: " + filePath);
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
