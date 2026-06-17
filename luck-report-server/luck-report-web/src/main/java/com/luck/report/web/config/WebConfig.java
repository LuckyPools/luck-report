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
import com.luck.report.web.security.TokenInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web配置类，用于注册过滤器、静态资源处理器等Web相关配置
 *
 * @author Jacky.gao
 * @since 2017年3月8日
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * 后台 servlet 前缀（默认 {@code report}），与所有 controller 的
     * {@code @RequestMapping("${luck-report.servletPrefix:}/xxx")} 保持一致。
     */
    @Value("${luck-report.servletPrefix:report}")
    private String servletPrefix;

    /**
     * 报表 Token 拦截器（{@code enabled=false} 时内部直接放行，不影响本地调试）。
     */
    @Autowired
    @Qualifier("bean.tokenInterceptor")
    private TokenInterceptor tokenInterceptor;

    /**
     * 注册RequestHolderFilter，确保在所有请求处理过程中设置和清理RequestHolder
     */
    @Bean
    public FilterRegistrationBean<RequestHolderFilter> requestHolderFilterRegistration() {
        FilterRegistrationBean<RequestHolderFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new RequestHolderFilter());
        // 拦截所有请求
        registration.addUrlPatterns("/*");
        // 设置过滤器名称
        registration.setName("requestHolderFilter");
        // 设置过滤器顺序，确保它在其他过滤器之前执行
        registration.setOrder(1);
        return registration;
    }

    /**
     * 注册前端静态资源处理器。
     * <p>
     * 为什么不在 yml 用 {@code spring.mvc.static-path-pattern} + {@code spring.web.resources.static-locations}？
     * 因为前者只支持单 pattern（逗号分隔会被当成字面量），后者只支持单 location 列表，
     * 但这里需要两个互不重叠的 URL 前缀映射到不同的 classpath 目录，必须用编程式注册。
     *
     * <ul>
     *   <li>{@code /<servletPrefix>/manage/assets/**} -> {@code classpath:/html/assets/}
     *       <br>SPA 构建产物（vite prod 输出），备用，lib 模式不走这条</li>
     *   <li>{@code /<servletPrefix>/lib/**} -> {@code classpath:/html/lib/}
     *       <br>lib 模式打包产物（vendor.js / luck-report-ui.umd.js / style.css / favicon.ico / iconfont.*），
     *       由 {@code npm run lib} 拷贝过来</li>
     * </ul>
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String prefix = servletPrefix == null || servletPrefix.isEmpty() ? "report" : servletPrefix;
        registry.addResourceHandler("/" + prefix + "/manage/assets/**")
                .addResourceLocations("classpath:/html/assets/");
        registry.addResourceHandler("/" + prefix + "/lib/**")
                .addResourceLocations("classpath:/html/lib/");
    }

    /**
     * 注册报表 Token 拦截器，覆盖所有业务路径，<b>排除</b> {@code /<prefix>/auth/**}。
     * <p>拦截器由 {@code luck-report.token.enabled} 控制总开关：
     * <ul>
     *   <li>{@code enabled=true}：走完整校验链（解析 token → 验签 → scope → 写上下文）</li>
     *   <li>{@code enabled=false}：直接放行（本地 ui3 项目联调）</li>
     * </ul>
     *
     * <p>覆盖路径：{@code /<prefix>/{manage,api,chart,designer,excel,pdf,word,image,importexcel,html}/**}
     * <br>排除路径：{@code /<prefix>/auth/**}（由第三方业务系统登录过滤器管）
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        String prefix = servletPrefix == null || servletPrefix.isEmpty() ? "report" : servletPrefix;
        registry.addInterceptor(tokenInterceptor)
                .addPathPatterns(
                        "/" + prefix + "/manage/**",
                        "/" + prefix + "/api/**",
                        "/" + prefix + "/chart/**",
                        "/" + prefix + "/designer/**",
                        "/" + prefix + "/excel/**",
                        "/" + prefix + "/pdf/**",
                        "/" + prefix + "/word/**",
                        "/" + prefix + "/image/**",
                        "/" + prefix + "/importexcel/**",
                        "/" + prefix + "/html/**"
                )
                .excludePathPatterns(
                        // /auth/** 不归 TokenInterceptor 管，由第三方业务系统登录过滤器管
                        "/" + prefix + "/auth/**"
                );
        // 静态资源由 ResourceHandler 单独处理，不进 MVC
    }
}
