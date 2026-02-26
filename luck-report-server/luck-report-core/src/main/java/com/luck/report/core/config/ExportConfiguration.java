package com.luck.report.core.config;

import com.luck.report.core.export.ExportManagerImpl;
import com.luck.report.core.export.ReportRender;
import com.luck.report.core.export.pdf.font.FontBuilder;
import com.luck.report.core.parser.ReportParser;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ExportConfiguration {

    @Bean
    public ExportManagerImpl exportManager(ReportRender reportRender) {
        ExportManagerImpl exportManager = new ExportManagerImpl();
        exportManager.setReportRender(reportRender);
        return exportManager;
    }

    @Bean
    public ReportRender reportRender(ReportParser reportParser,
                                     com.luck.report.core.build.ReportBuilder reportBuilder) {
        ReportRender reportRender = new ReportRender();
        reportRender.setReportParser(reportParser);
        reportRender.setReportBuilder(reportBuilder);
        return reportRender;
    }

    @Bean
    public FontBuilder fontBuilder() {
        return new FontBuilder();
    }
}
