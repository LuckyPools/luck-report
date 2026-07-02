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
import com.luck.report.web.interceptor.ManageInterceptor;
import com.luck.report.web.interceptor.PreviewInterceptor;
import com.luck.report.web.modules.report.constant.ReportUrls;
import com.luck.report.web.interceptor.TokenInterceptor;
import com.luck.report.web.modules.role.mapper.ReportRoleMapper;
import com.luck.report.web.security.ReportAccessChecker;
import com.luck.report.web.security.TokenProperties;
import com.luck.report.web.security.service.TokenService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
@Slf4j
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * 后台 servlet 前缀（默认 {@code report}），与所有 controller 的
     * {@code @RequestMapping("${luck-report.servletPrefix:}/xxx")} 保持一致。
     */
    @Value("${luck-report.servletPrefix:report}")
    private String servletPrefix;

    /**
     * 报表预览权限校验器（判断用户能否访问指定报表）。
     */
    @Autowired
    private ReportAccessChecker reportAccessChecker;

    /**
     * Token 配置项（含 enabled + adminRoles）。
     */
    @Autowired
    private TokenProperties tokenProperties;

    /**
     * Token 服务（用于获取用户角色）。
     * <p>注入时会自动使用标记为 @Primary 的实现。
     * 如果第三方项目提供了自定义实现并标记为 @Primary，会使用第三方的实现。
     */
    @Autowired
    private TokenService tokenService;

    /**
     * 角色绑定 Mapper（用于匿名报表判断）。
     */
    @Autowired
    private ReportRoleMapper reportRoleMapper;

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
     *   <li>{@code enabled=true}：走完整校验链（解析 token → 验签 → 写上下文）</li>
     *   <li>{@code enabled=false}：直接放行（本地 ui3 项目联调）</li>
     * </ul>
     *
     * <p>拦截器链（按 order 顺序执行）：
     * <ol>
     *   <li>TokenInterceptor (order=1) - token 有效性校验</li>
     *   <li>ManageInterceptor (order=2) - 管理端 admin 角色校验</li>
     *   <li>PreviewInterceptor (order=3) - 预览/导出报表授权校验</li>
     * </ol>
     *
     * <p>覆盖路径：{@code /<prefix>/{manage,api,chart,designer,excel,pdf,word,image,importexcel,html}/**}
     * <br>排除路径：{@code /<prefix>/auth/**}（由第三方业务系统登录过滤器管）
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        String prefix = servletPrefix == null || servletPrefix.isEmpty() ? "report" : servletPrefix;

        // 1. Token 拦截器（order=1）- 校验 token 有效性（含匿名报表检查）
        registry.addInterceptor(new TokenInterceptor(tokenService, tokenProperties, reportRoleMapper))
                .addPathPatterns(ReportUrls.managePathPatterns(prefix))
                .addPathPatterns(ReportUrls.previewPathPatterns(prefix))
                .addPathPatterns(
                        "/" + prefix + "/res/**"
                )
                .excludePathPatterns(
                        "/" + prefix + "/auth/**"
                );

        // 2. 管理端拦截器（order=2）- 校验用户是否为 admin 角色
        registry.addInterceptor(new ManageInterceptor(tokenService, tokenProperties))
                .addPathPatterns(ReportUrls.managePathPatterns(prefix))
                .excludePathPatterns(
                        "/" + prefix + "/auth/**"
                )
                .order(2);

        // 3. 预览/导出拦截器（order=3）- 校验用户是否有权访问指定报表（含匿名报表放行）
        registry.addInterceptor(new PreviewInterceptor(reportAccessChecker, tokenProperties))
                .addPathPatterns(ReportUrls.previewPathPatterns(prefix))
                .excludePathPatterns(
                        "/" + prefix + "/auth/**"
                )
                .order(3);
        // 静态资源由 ResourceHandler 单独处理，不进 MVC
    }
}
