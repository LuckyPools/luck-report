package com.luck.report.config;

import com.luck.report.filter.JavaxRequestHolderFilter;
import com.luck.report.provider.Boot2RequestInfoProvider;
import com.luck.report.provider.Boot2ResponseInfoProvider;
import com.luck.report.infra.modules.servlet.provider.RequestInfoProvider;
import com.luck.report.infra.modules.servlet.provider.ResponseInfoProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Web配置类（javax版本，用于Spring Boot2）
 * 用于注册过滤器和其他Web相关配置
 *
 * @author jack
 */
@ConditionalOnClass(name = "javax.servlet.http.HttpServletRequest")
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@Configuration
public class JavaxWebConfig {

    @Bean
    public FilterRegistrationBean<JavaxRequestHolderFilter> javaxRequestHolderFilterRegistration(RequestInfoProvider requestInfoProvider) {
        FilterRegistrationBean<JavaxRequestHolderFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new JavaxRequestHolderFilter(requestInfoProvider));
        registration.addUrlPatterns("/*");
        registration.setName("requestHolderFilter");
        registration.setOrder(1);
        return registration;
    }

    @Bean
    public RequestInfoProvider requestInfoProvider(HttpServletRequest request) {
        return new Boot2RequestInfoProvider(request);
    }

    @Bean
    public ResponseInfoProvider responseInfoProvider(HttpServletResponse response) {
        return new Boot2ResponseInfoProvider(response);
    }
}
