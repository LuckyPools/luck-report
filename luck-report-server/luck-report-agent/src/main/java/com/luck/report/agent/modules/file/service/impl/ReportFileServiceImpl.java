package com.luck.report.agent.modules.file.service.impl;

import com.luck.report.agent.common.util.SnowflakeIdGenerator;
import com.luck.report.agent.modules.file.domain.entity.ReportFile;
import com.luck.report.agent.modules.file.mapper.ReportFileMapper;
import com.luck.report.agent.modules.file.service.ReportFileService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * 报表文件服务实现
 *
 * @author luck
 */
@Slf4j
@Service
@AllArgsConstructor
public class ReportFileServiceImpl implements ReportFileService {

    private final ReportFileMapper reportFileMapper;

    @Override
    public ReportFile getById(String id) {
        if (id == null) {
            return null;
        }
        return reportFileMapper.selectById(id);
    }

    @Override
    public ReportFile getByTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            return null;
        }
        return reportFileMapper.selectByTitle(title.trim());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReportFile save(ReportFile reportFile) {
        if (reportFile == null) {
            throw new IllegalArgumentException("reportFile can not be null");
        }
        LocalDateTime now = LocalDateTime.now();
        reportFile.setCreatedTime(now);
        reportFile.setUpdatedTime(now);
        if (reportFile.getIsDeleted() == null) {
            reportFile.setIsDeleted(0);
        }
        if (reportFile.getId() == null || reportFile.getId().isEmpty()) {
            reportFile.setId(SnowflakeIdGenerator.generateId());
        }
        reportFileMapper.insert(reportFile);
        log.info("新增报表文件: id={}, title={}", reportFile.getId(), reportFile.getTitle());
        return reportFile;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReportFile update(ReportFile reportFile) {
        if (reportFile == null || reportFile.getId() == null) {
            throw new IllegalArgumentException("reportFile or id can not be null");
        }
        reportFile.setUpdatedTime(LocalDateTime.now());
        reportFileMapper.updateById(reportFile);
        log.info("更新报表文件: id={}, title={}", reportFile.getId(), reportFile.getTitle());
        return reportFile;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteById(String id) {
        if (id == null) {
            return false;
        }
        int rows = reportFileMapper.deleteById(id);
        log.info("逻辑删除报表文件: id={}, rows={}", id, rows);
        return rows > 0;
    }

    @Override
    public InputStream loadReport(String id) {
        ReportFile reportFile = getById(id);
        if (reportFile == null) {
            return new ByteArrayInputStream(new byte[0]);
        }
        String template = Objects.toString(reportFile.getTemplate(), "");
        return new ByteArrayInputStream(template.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public List<ReportFile> listAll() {
        List<ReportFile> list = reportFileMapper.selectAll();
        return list == null ? Collections.emptyList() : list;
    }
}
