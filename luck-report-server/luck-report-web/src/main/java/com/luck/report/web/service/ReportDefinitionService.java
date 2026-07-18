package com.luck.report.web.service;

import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.definition.ReportDefinitionWrapper;
import com.luck.report.core.export.ReportRender;
import com.luck.report.web.cache.ReportScopedCache;
import com.luck.report.web.exception.ReportDesignException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 报表定义服务，负责从缓存获取报表定义并重建父子引用关系。
 *
 * @author luckyPools
 * @since 2026年05月23日
 */
@Service
public class ReportDefinitionService {

    @Autowired
    private ReportRender reportRender;

    /**
     * 从缓存获取报表定义并重建父子引用关系。
     * 如果缓存中不存在报表定义，抛出 ReportDesignException 异常。
     *
     * @param fileName 报表文件名，作为缓存键，不能为空
     * @return 报表定义对象，已重建父子引用关系
     * @throws ReportDesignException 当缓存中不存在报表定义时抛出
     */
    public ReportDefinition getReportDefinition(String fileName) {
        Object obj = ReportScopedCache.getObject(fileName);
        ReportDefinitionWrapper wrapper;
        if (obj instanceof ReportDefinitionWrapper) {
            wrapper = (ReportDefinitionWrapper) obj;
        } else {
            throw new ReportDesignException("Report data has expired,can not do export excel.");
        }
        ReportDefinition reportDefinition = wrapper.getReportDefinition();
        if (wrapper.notBuilt()) {
            reportRender.rebuildReportDefinition(reportDefinition);
            wrapper.markBuilt();
        }
        return wrapper.getReportDefinition();
    }
}
