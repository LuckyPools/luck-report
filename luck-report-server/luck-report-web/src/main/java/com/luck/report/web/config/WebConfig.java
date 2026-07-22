/*******************************************************************************
 * Copyright 2017 Bstek
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.  You may obtain a copy
 * of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/
package com.luck.report.web.config;


import com.luck.report.web.filter.RequestHolderFilter;
import com.luck.report.web.provider.Boot2RequestInfoProvider;
import com.luck.report.web.provider.Boot2ResponseInfoProvider;
import com.luck.report.web.provider.RequestInfoProvider;
import com.luck.report.web.provider.ResponseInfoProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Web配置类，用于注册过滤器和其他Web相关配置
 *
 * @author Jacky.gao
 * @since 2017年3月8日
 */
@ConditionalOnClass(name = "javax.servlet.http.HttpServletRequest")
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@Configuration
public class WebConfig {

    /**
     * 注册RequestHolderFilter，确保在所有请求处理过程中设置和清理RequestHolder
     */
    @Bean
    public FilterRegistrationBean<RequestHolderFilter> requestHolderFilterRegistration(RequestInfoProvider requestInfoProvider) {
        FilterRegistrationBean<RequestHolderFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new RequestHolderFilter(requestInfoProvider));
        // 拦截所有请求
        registration.addUrlPatterns("/*");
        // 设置过滤器名称
        registration.setName("requestHolderFilter");
        // 设置过滤器顺序，确保它在其他过滤器之前执行
        registration.setOrder(1);
        return registration;
    }

    @Bean
    public RequestInfoProvider boot2RequestInfoProvider(HttpServletRequest request) {
        return new Boot2RequestInfoProvider(request);
    }

    @Bean
    public ResponseInfoProvider boot2ResponseInfoProvider(HttpServletResponse response) {
        return new Boot2ResponseInfoProvider(response);
    }
}
