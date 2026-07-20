package com.luck.report.web.controller.image;

import com.luck.report.core.cache.ResourceCache;
import com.luck.report.web.provider.RequestInfoProvider;
import com.luck.report.web.provider.ResponseInfoProvider;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * 图片控制器
 * 替代原有的ImageServletAction，提供图片资源访问功能
 */
@RestController("bean.imageController")
@RequestMapping("${luck-report.servletPrefix:}/image")
public class ImageController {

    /**
     * 获取图片资源
     */
    @RequestMapping(value = {"", "/"})
    public void getImage(RequestInfoProvider req, ResponseInfoProvider resp) throws IOException {
        String key = req.getParameter("_key");
        if (StringUtils.isNotBlank(key)) {
            byte[] bytes = (byte[]) ResourceCache.getObject(key);
            InputStream input = new ByteArrayInputStream(bytes);
            OutputStream output = resp.getOutputStream();
            resp.setContentType("image/png");
            try {
                IOUtils.copy(input, output);
            } finally {
                IOUtils.closeQuietly(input);
                IOUtils.closeQuietly(output);
            }
        }
    }
}
