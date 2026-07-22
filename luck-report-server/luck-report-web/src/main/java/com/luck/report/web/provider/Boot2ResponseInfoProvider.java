package com.luck.report.web.provider;


import com.luck.report.web.utils.ResponseUtils;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;

/**
 * @author jack
 * @version 1.0
 * @description:
 * @date 2026-04-30 14:15
 */
public class Boot2ResponseInfoProvider implements ResponseInfoProvider {

    private final HttpServletResponse resp;

    public Boot2ResponseInfoProvider(HttpServletResponse resp) {
        this.resp = resp;
    }

    @Override
    public void writeObjectToJson(Object obj) throws IOException {
        ResponseUtils.writeObjectToJson(resp, obj);
    }

    @Override
    public void setContentType(String contentType) {
        resp.setContentType(contentType);
    }

    @Override
    public void setHeader(String key, String value) {
        resp.setHeader(key, value);
    }

    @Override
    public OutputStream getOutputStream() throws IOException {
        return resp.getOutputStream();
    }

    @Override
    public void setStatus(int status) {
        resp.setStatus(status);
    }
}
