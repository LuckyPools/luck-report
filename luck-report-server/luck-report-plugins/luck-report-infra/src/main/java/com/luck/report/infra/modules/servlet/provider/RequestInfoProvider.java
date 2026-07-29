package com.luck.report.infra.modules.servlet.provider;

import java.util.Enumeration;

/**
 * 解决boot2、boot3对httpServletRequest依赖问题
 * @author jack
 */
public interface RequestInfoProvider {

    String getParameter(String name);

    Enumeration<?> getParameterNames();

    String getContextPath();

    String getHeader(String key);

    String getRequestURI();

    String getSessionId();
}
