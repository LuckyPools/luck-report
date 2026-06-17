package com.luck.product.boot.utils;

import com.alibaba.fastjson.JSON;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;

/**
 * Servlet工具类
 * @author luck
 * @date 2025/03/31
 */
@Component
public class ServletUtils {

    /**
     * 获取当前请求对象
     * @return HttpServletRequest
     */
    public static HttpServletRequest getRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            return attributes.getRequest();
        }
        return null;
    }

    /**
     * 将JSON字符串写入响应
     * @param response 响应对象
     * @param obj 对象
     */
    public static void writeResponseJson(HttpServletResponse response, Object obj) {
        response.setContentType("application/json;charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        try (PrintWriter writer = response.getWriter()) {
            writer.write(JSON.toJSONString(obj));
            writer.flush();
        } catch (IOException e) {
            throw new RuntimeException("写入响应失败", e);
        }
    }
}
