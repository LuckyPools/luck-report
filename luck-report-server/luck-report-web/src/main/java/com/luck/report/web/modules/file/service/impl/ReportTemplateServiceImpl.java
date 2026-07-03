package com.luck.report.web.modules.file.service.impl;

import com.luck.report.web.utils.SnowflakeIdGenerator;
import com.luck.report.web.modules.file.domain.entity.ReportTemplate;
import com.luck.report.web.modules.file.mapper.ReportTemplateMapper;
import com.luck.report.web.modules.file.service.ReportTemplateService;
import com.luck.report.web.common.vo.PageResultVO;
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
@Service("bean.reportTemplateService")
@AllArgsConstructor
public class ReportTemplateServiceImpl implements ReportTemplateService {

    private final ReportTemplateMapper reportTemplateMapper;

    @Override
    public ReportTemplate getById(String id) {
        if (id == null) {
            return null;
        }
        return reportTemplateMapper.selectById(id);
    }

    @Override
    public ReportTemplate getByTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            return null;
        }
        return reportTemplateMapper.selectByTitle(title.trim());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReportTemplate save(ReportTemplate reportTemplate) {
        if (reportTemplate == null) {
            throw new IllegalArgumentException("reportTemplate can not be null");
        }
        LocalDateTime now = LocalDateTime.now();
        reportTemplate.setCreatedTime(now);
        reportTemplate.setUpdatedTime(now);
        if (reportTemplate.getIsDeleted() == null) {
            reportTemplate.setIsDeleted(0);
        }
        if (reportTemplate.getId() == null || reportTemplate.getId().isEmpty()) {
            reportTemplate.setId(SnowflakeIdGenerator.generateId());
        }
        reportTemplateMapper.insert(reportTemplate);
        log.info("新增报表文件: id={}, title={}", reportTemplate.getId(), reportTemplate.getTitle());
        return reportTemplate;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReportTemplate update(ReportTemplate reportTemplate) {
        if (reportTemplate == null || reportTemplate.getId() == null) {
            throw new IllegalArgumentException("reportTemplate or id can not be null");
        }
        reportTemplate.setUpdatedTime(LocalDateTime.now());
        reportTemplateMapper.updateById(reportTemplate);
        log.info("更新报表文件: id={}, title={}", reportTemplate.getId(), reportTemplate.getTitle());
        return reportTemplate;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteById(String id) {
        if (id == null) {
            return false;
        }
        int rows = reportTemplateMapper.deleteById(id);
        log.info("逻辑删除报表文件: id={}, rows={}", id, rows);
        return rows > 0;
    }

    @Override
    public InputStream loadReport(String id) {
        ReportTemplate reportTemplate = getById(id);
        if (reportTemplate == null) {
            return new ByteArrayInputStream(new byte[0]);
        }
        String template = Objects.toString(reportTemplate.getTemplate(), "");
        return new ByteArrayInputStream(template.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public List<ReportTemplate> listAll() {
        List<ReportTemplate> list = reportTemplateMapper.selectAll();
        return list == null ? Collections.emptyList() : list;
    }

    @Override
    public PageResultVO<ReportTemplate> listPage(String name, int pageNum, int pageSize) {
        if (pageNum < 1) {
            pageNum = 1;
        }
        if (pageSize < 1) {
            pageSize = 10;
        }
        String keyword = (name == null || name.trim().isEmpty()) ? null : name.trim();
        long total = reportTemplateMapper.countByCondition(keyword);
        List<ReportTemplate> records;
        if (total == 0) {
            records = Collections.emptyList();
        } else {
            int offset = (pageNum - 1) * pageSize;
            records = reportTemplateMapper.selectPage(keyword, offset, pageSize);
            if (records == null) {
                records = Collections.emptyList();
            }
        }
        return PageResultVO.success(records, total, pageNum, pageSize);
    }
}
