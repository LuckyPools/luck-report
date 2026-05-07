package com.luck.report.provider;

import com.luck.report.web.provider.ResponseInfoProvider;
import jakarta.servlet.http.HttpServletResponse;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.SerializationConfig;

import java.io.IOException;
import java.io.OutputStream;
import java.text.SimpleDateFormat;

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
        resp.setContentType("text/json");
        resp.setCharacterEncoding("UTF-8");
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(SerializationConfig.Feature.WRITE_DATES_AS_TIMESTAMPS, false);
        mapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));
        OutputStream out = resp.getOutputStream();
        try {
            mapper.writeValue(out, obj);
        } finally {
            out.flush();
            out.close();
        }
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
