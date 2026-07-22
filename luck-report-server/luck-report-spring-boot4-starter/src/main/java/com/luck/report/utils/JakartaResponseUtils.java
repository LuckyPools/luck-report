package com.luck.report.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.OutputStream;
import java.text.SimpleDateFormat;

public class JakartaResponseUtils {

    private static final ObjectMapper objectMapper;

    static {
        objectMapper = new ObjectMapper();
        JakartaResponseUtils.objectMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        JakartaResponseUtils.objectMapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));
    }

    public static void writeObjectToJson(HttpServletResponse resp, Object obj) throws IOException {
        resp.setContentType("text/json");
        resp.setCharacterEncoding("UTF-8");
        OutputStream out = resp.getOutputStream();
        try {
            JakartaResponseUtils.objectMapper.writeValue(out, obj);
        } finally {
            out.flush();
            out.close();
        }
    }
}
