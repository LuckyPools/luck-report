package com.luck.report.provider;

import com.luck.report.utils.JakartaResponseUtils;
import com.luck.report.web.provider.ResponseInfoProvider;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.OutputStream;

/**
 * @author jack
 * @version 1.0
 * @description:
 * @date 2026-04-30 14:17
 */
public class Boot3ResponseInfoProvider implements ResponseInfoProvider {

    private final HttpServletResponse resp;

    public Boot3ResponseInfoProvider(HttpServletResponse resp) {
        this.resp = resp;
    }

    @Override
    public void writeObjectToJson(Object obj) throws IOException {
        JakartaResponseUtils.writeObjectToJson(resp, obj);
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
