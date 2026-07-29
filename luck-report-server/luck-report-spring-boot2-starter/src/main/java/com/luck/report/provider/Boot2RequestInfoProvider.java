package com.luck.report.provider;

import com.luck.report.infra.modules.servlet.provider.RequestInfoProvider;

import javax.servlet.http.HttpServletRequest;
import java.util.Enumeration;

/**
 * @author jack
 * @version 1.0
 * @description: spring boot2 request
 * @date 2026-04-30 14:07
 */
public class Boot2RequestInfoProvider implements RequestInfoProvider {

    private final HttpServletRequest request;

    public Boot2RequestInfoProvider(HttpServletRequest request) {
        this.request = request;
    }

    @Override
    public String getParameter(String name) {
        return request.getParameter(name);
    }

    @Override
    public Enumeration<?> getParameterNames() {
        return request.getParameterNames();
    }

    @Override
    public String getContextPath() {
        return request.getContextPath();
    }

    @Override
    public String getHeader(String key) {
        return request.getHeader(key);
    }

    @Override
    public String getRequestURI() {
        return request.getRequestURI();
    }

    @Override
    public String getSessionId() {
        return request.getSession().getId();
    }
}
