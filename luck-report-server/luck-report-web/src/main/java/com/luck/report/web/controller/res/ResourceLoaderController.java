package com.luck.report.web.controller.res;

import com.luck.report.web.controller.base.BaseController;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * 资源加载控制器
 * 替代原有的ResourceLoaderServletAction，提供静态资源访问功能
 */
@RestController("bean.resourceLoaderController")
@RequestMapping("${luck-report.servletPrefix:}/res")
public class ResourceLoaderController extends BaseController {

    @Autowired
    private ApplicationContext applicationContext;

    /**
     * 加载静态资源
     */
    @RequestMapping({"", "/**"})
    public void loadResource() throws IOException {
        // 获取完整URI
        String uri = req.getRequestURI();
        // 找到/res/的位置
        int resIndex = uri.indexOf("/res/");
        // 路径格式不正确，返回404
        if (resIndex != -1) {
            // 提取/res/后面的资源路径
            String resPath = uri.substring(resIndex + 5); // 5是/res/的长度
            String p = "classpath:" + resPath;

            // 设置响应内容类型
            if (p.endsWith(".js")) resp.setContentType("text/javascript");
            else if (p.endsWith(".css")) resp.setContentType("text/css");
            else if (p.endsWith(".png")) resp.setContentType("image/png");
            else if (p.endsWith(".jpg")) resp.setContentType("image/jpeg");
            else if (p.endsWith(".svg")) resp.setContentType("image/svg+xml");
            else resp.setContentType("application/octet-stream");

            InputStream input = applicationContext.getResource(p).getInputStream();
            OutputStream output = resp.getOutputStream();
            try {
                IOUtils.copy(input, output);
            } finally {
                IOUtils.closeQuietly(input);
                IOUtils.closeQuietly(output);
            }
        } else resp.setStatus(404);
    }
}
