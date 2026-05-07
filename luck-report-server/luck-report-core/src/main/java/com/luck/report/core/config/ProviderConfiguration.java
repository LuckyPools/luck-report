package com.luck.report.core.config;

import com.luck.report.core.provider.image.DefaultImageProvider;
import com.luck.report.core.provider.image.HttpImageProvider;
import com.luck.report.core.provider.image.HttpsImageProvider;
import com.luck.report.core.provider.report.classpath.ClasspathReportProvider;
import com.luck.report.core.provider.report.file.FileReportProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProviderConfiguration {

    @Bean
    public DefaultImageProvider defaultImageProvider(@Value("${luck-report.imgStoreDir:/WEB-INF/imgDir}") String imgStoreDir) {
        DefaultImageProvider defaultImageProvider = new DefaultImageProvider();
        defaultImageProvider.setBaseWebPath(imgStoreDir);
        return defaultImageProvider;
    }

    @Bean
    public FileReportProvider fileReportProvider(@Value("${luck-report.fileStoreDir:/WEB-INF/ureportfiles}") String fileStoreDir,
                                                 @Value("${luck-report.disableFileProvider:false}") boolean disabled) {
        FileReportProvider provider = new FileReportProvider();
        provider.setFileStoreDir(fileStoreDir);
        provider.setDisabled(disabled);
        return provider;
    }

    @Bean
    public HttpImageProvider httpImageProvider() {
        return new HttpImageProvider();
    }

    @Bean
    public HttpsImageProvider httpsImageProvider() {
        return new HttpsImageProvider();
    }

    @Bean
    public ClasspathReportProvider classpathReportProvider() {
        return new ClasspathReportProvider();
    }
}
