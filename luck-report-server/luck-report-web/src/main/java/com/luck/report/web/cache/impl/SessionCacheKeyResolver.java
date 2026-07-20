package com.luck.report.web.cache.impl;

import com.luck.report.core.cache.ReportCacheKeyResolver;
import com.luck.report.web.provider.RequestInfoProvider;
import com.luck.report.web.utils.RequestHolder;

/**
 *
 * @author 24731
 */
public class SessionCacheKeyResolver implements ReportCacheKeyResolver {

    /**
     * 是否禁用
     */
    private boolean disabled;

    /**
     * 是否可用
     *
     * @return
     */
    @Override
    public boolean disabled() {
        return disabled;
    }

    /**
     * 设置是否可用
     *
     * @return
     */
    public void setDisabled(boolean disabled) {
        this.disabled = disabled;
    }


    /**
     * 缓存前缀
     *
     * @return
     */
    @Override
    public String getPrefix() {
        return SessionCacheKeyResolver.getSessionId();
    }

    /**
     * 获取当前请求的 Session ID。
     *
     * @return Session ID，请求不存在或 Session 无效返回 null
     */
    private static String getSessionId() {
        RequestInfoProvider req = RequestHolder.getRequest();
        if (req == null) return null;
        return req.getSessionId();
    }
}
