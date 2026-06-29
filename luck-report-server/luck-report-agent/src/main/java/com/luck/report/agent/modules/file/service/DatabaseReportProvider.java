package com.luck.report.agent.modules.file.service;

import com.luck.report.agent.modules.file.domain.entity.ReportFile;
import com.luck.report.core.exception.ReportException;
import com.luck.report.core.provider.report.ReportProvider;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Objects;

/**
 * 数据库存储报表 Provider
 * - prefix: db:
 * - 报表 ID 即 luck_report_file.id，file 入参格式为 "db:123"
 *
 * @author luck
 */
@Slf4j
@Component
@AllArgsConstructor
public class DatabaseReportProvider implements ReportProvider {

    public static final String PREFIX = "db:";

    private final ReportFileService luckReportFileService;

    /**
     * 去除 PREFIX 前缀，返回纯 id
     */
    private String sliceId(String id) {
        if (id != null && id.startsWith(PREFIX)) {
            return id.substring(PREFIX.length());
        }
        return id;
    }

    @Override
    public InputStream loadReport(String filePath) {
        String id = sliceId(filePath);
        ReportFile reportFile = luckReportFileService.getById(id);
        if (reportFile == null) {
            throw new ReportException("Report file not found by id: " + id);
        }
        String template = Objects.toString(reportFile.getTemplate(), StringUtils.EMPTY);
        return new ByteArrayInputStream(template.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public void deleteReport(String filePath) {
        String id = sliceId(filePath);
        boolean ok = luckReportFileService.deleteById(id);
        if (!ok) {
            log.warn("Delete report file failed, id={}", id);
        }
    }

    @Override
    public List<com.luck.report.core.provider.report.ReportFile> getReportFiles() {
        List<ReportFile> list = luckReportFileService.listAll();
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }
        return list.stream()
                .map(rf -> new com.luck.report.core.provider.report.ReportFile(
                        rf.getTitle(),
                        rf.getUpdatedTime() == null ? new Date() : java.util.Date.from(rf.getUpdatedTime().atZone(java.time.ZoneId.systemDefault()).toInstant()),
                        false,
                        rf.getId()))
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public com.luck.report.core.provider.report.ReportFile saveReport(String title, String filePath, String content) {
        // file 形如 "db:123"（已存在）或 "db:title"（创建场景，title 可含中英文）
        String id = sliceId(filePath);
        title = title == null ? StringUtils.EMPTY : title.trim();
        Date now = new Date();

        if (StringUtils.isNotBlank(id)) {
            ReportFile existing = luckReportFileService.getById(id);
            if (existing != null) {
                existing.setTemplate(content);
                if (title != null && !title.trim().isEmpty()) {
                    existing.setTitle(title.trim());
                }
                ReportFile updated = luckReportFileService.update(existing);
                return buildReportFile(title, updated, now);
            }
        }
        ReportFile entity = ReportFile.builder()
                .title(title)
                .template(content)
                .isDeleted(0)
                .build();
        ReportFile saved = luckReportFileService.save(entity);
        return buildReportFile(title, saved, now);
    }

    /**
     * 构造 saveReport 返回的 ReportFile
     * - path 为数据库主键 id（不含 PREFIX 前缀），与 getReportFiles 保持一致
     * - name 为展示标题
     * - directory 固定 false
     * - updateDate 优先用实体的更新时间，缺失时回退到本次保存时间
     */
    private com.luck.report.core.provider.report.ReportFile buildReportFile(String title, ReportFile entity, Date fallback) {
        String id = entity == null ? null : entity.getId();
        String name = StringUtils.isNotBlank(title) ? title : (entity == null ? null : entity.getTitle());
        Date updateDate = fallback;
        if (entity != null && entity.getUpdatedTime() != null) {
            updateDate = Date.from(entity.getUpdatedTime().atZone(java.time.ZoneId.systemDefault()).toInstant());
        }
        return new com.luck.report.core.provider.report.ReportFile(name, updateDate, false, id);
    }

    @Override
    public com.luck.report.core.provider.report.ReportFile getReportFile(String filePath) {
        String id = sliceId(filePath);
        if (StringUtils.isBlank(id)) {
            return null;
        }
        ReportFile entity = luckReportFileService.getById(id);
        if (entity == null) {
            return null;
        }
        Date updateDate = entity.getUpdatedTime() == null
                ? null
                : Date.from(entity.getUpdatedTime().atZone(java.time.ZoneId.systemDefault()).toInstant());
        return new com.luck.report.core.provider.report.ReportFile(entity.getTitle(), updateDate, false, entity.getId());
    }

    @Override
    public String getName() {
        return "数据库";
    }

    @Override
    public boolean disabled() {
        return false;
    }

    @Override
    public String getPrefix() {
        return PREFIX;
    }
}
