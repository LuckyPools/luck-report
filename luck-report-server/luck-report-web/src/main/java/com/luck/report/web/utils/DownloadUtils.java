package com.luck.report.web.utils;

import com.luck.report.infra.modules.servlet.provider.ResponseInfoProvider;
import org.apache.commons.lang3.StringUtils;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class DownloadUtils {

    /**
     * 构建下载文件名
     * 根据报表文件名和用户指定的文件名生成最终的下载文件名
     *
     * @param reportPath     报表路径，用于在用户未指定文件名时作为默认名称，类型：String，可为空
     * @param fileName       用户指定的文件名，类型：String，可为空
     * @param extName        文件扩展名（如 .pdf、.docx、.xlsx），类型：String，不可为空
     * @return 构建后的下载文件名（UTF-8编码），类型：String
     */
    public static String buildDownloadFileName(String reportPath, String fileName, String extName) {
        StringBuilder result = new StringBuilder();
        if (StringUtils.isNotBlank(fileName)) {
            String decodedFileName = UrlParameterUtils.doubleDecode(fileName);
            result.append(decodedFileName);
            if (!decodedFileName.toLowerCase().endsWith(extName)) result.append(extName);
        } else {
            String decodedReportFileName = UrlParameterUtils.doubleDecode(reportPath);
            int pos = decodedReportFileName.indexOf(":");
            if (pos > 0) decodedReportFileName = decodedReportFileName.substring(pos + 1);
            pos = decodedReportFileName.toLowerCase().indexOf(".ureport.xml");
            if (pos > 0) decodedReportFileName = decodedReportFileName.substring(0, pos);
            result.append(decodedReportFileName).append(extName);
        }
        return result.toString();
    }

    /**
     * 构建下载响应头
     * 根据报表文件名和用户指定的文件名生成最终的下载文件名，并设置HTTP响应头
     * 使用 RFC 5987 标准解决中文文件名乱码问题
     *
     * @param response       HTTP响应对象，用于设置响应头，类型：HttpServletResponse，不可为空
     * @param reportPath     报表路径，用于在用户未指定文件名时作为默认名称，类型：String，可为空
     * @param fileName       用户指定的文件名，类型：String，可为空
     * @param extName        文件扩展名（如 .pdf、.docx、.xlsx），类型：String，不可为空
     * @return 构建后的下载文件名，类型：String
     */
    public static String buildDownloadHeader(ResponseInfoProvider response, String reportPath, String fileName, String extName) {
        String downloadFileName = DownloadUtils.buildDownloadFileName(reportPath, fileName, extName);

        try {
            String encodedFileName = URLEncoder.encode(downloadFileName, StandardCharsets.UTF_8.name())
                    .replaceAll("\\+", "%20");

            String fallbackFileName = new String(downloadFileName.getBytes(StandardCharsets.UTF_8), StandardCharsets.ISO_8859_1);

            response.setContentType("application/octet-stream;charset=UTF-8");
            response.setHeader("Content-Disposition",
                    "attachment;filename=\"" + fallbackFileName + "\";filename*=UTF-8''" + encodedFileName);
        } catch (UnsupportedEncodingException e) {
            response.setContentType("application/octet-stream;charset=UTF-8");
            response.setHeader("Content-Disposition", "attachment;filename=\"" + downloadFileName + "\"");
        }

        return downloadFileName;
    }
}
