/*******************************************************************************
 * Copyright 2017 Bstek
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.  You may obtain a copy
 * of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/
package com.luck.report.core.provider.report.file;

import com.luck.report.core.exception.ReportException;
import com.luck.report.core.provider.report.ReportFile;
import com.luck.report.core.provider.report.ReportProvider;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.web.context.WebApplicationContext;

import javax.servlet.ServletContext;
import java.io.*;
import java.util.*;

/**
 * @author Jacky.gao
 * @since 2017年2月11日
 */
public class FileReportProvider implements ReportProvider, ApplicationContextAware {
    /**
     * 报表文件后缀，存储在磁盘上的报表文件均以 .ureport.xml 结尾
     */
    public static final String SUFFIX = ".ureport.xml";
    private String prefix = "file:";
    private String fileStoreDir;
    private boolean disabled;

    /**
     * 将传入的 filePath 拼装为磁盘上的完整路径
     * - 去除前缀（如 "file:"）
     * - 补充 .ureport.xml 后缀（如入参已去除后缀）
     * - 拼接 fileStoreDir 目录前缀
     *
     * @param filePath 报表标识，可能带或不带前缀/后缀
     * @return 磁盘上对应的完整文件路径
     */
    private String buildFullPath(String filePath) {
        if (filePath.startsWith(prefix)) {
            filePath = filePath.substring(prefix.length());
        }
        if (!filePath.endsWith(SUFFIX)) {
            filePath = filePath + SUFFIX;
        }
        return fileStoreDir + "/" + filePath;
    }

    @Override
    public InputStream loadReport(String filePath) {
        String fullPath = buildFullPath(filePath);
        try {
            return new FileInputStream(fullPath);
        } catch (FileNotFoundException e) {
            throw new ReportException(e);
        }
    }

    @Override
    public void deleteReport(String filePath) {
        String fullPath = buildFullPath(filePath);
        File f = new File(fullPath);
        if (f.exists()) {
            f.delete();
        }
    }

    @Override
    public List<ReportFile> getReportFiles() {
        return getReportFiles(StringUtils.EMPTY);
    }

    @Override
    public List<ReportFile> getReportFiles(String relativePath) {
        File file;
        if (relativePath == null || relativePath.isEmpty()) {
            file = new File(fileStoreDir);
        } else {
            file = new File(fileStoreDir + "/" + relativePath);
        }

        List<ReportFile> list = new ArrayList<ReportFile>();
        File[] files = file.listFiles();
        if (files == null) {
            return list;
        }

        String storeDirAbsolute = new File(fileStoreDir).getAbsolutePath();
        for (File f : files) {
            Calendar calendar = Calendar.getInstance();
            calendar.setTimeInMillis(f.lastModified());
            String currentPath;
            String fAbsolute = f.getAbsolutePath();
            if (fAbsolute.startsWith(storeDirAbsolute)) {
                currentPath = fAbsolute.substring(storeDirAbsolute.length());
                if (currentPath.startsWith(File.separator) || currentPath.startsWith("/")) {
                    currentPath = currentPath.substring(1);
                }
                currentPath = currentPath.replace(File.separator, "/");
            } else {
                currentPath = relativePath.isEmpty() ? f.getName() : relativePath + "/" + f.getName();
            }
            // name 去掉 .ureport.xml 后缀（用于前端展示），path 保留后缀（磁盘文件标识），与 ReportProvider.getReportFile 默认实现对齐
            String name = ReportProvider.stripReportSuffix(f.getName());
            list.add(new ReportFile(name, calendar.getTime(), f.isDirectory(), currentPath));
        }
        Collections.sort(list, new Comparator<ReportFile>() {
            @Override
            public int compare(ReportFile f1, ReportFile f2) {
                if (f1.isDirectory() && !f2.isDirectory()) {
                    return -1;
                }
                if (!f1.isDirectory() && f2.isDirectory()) {
                    return 1;
                }
                return f2.getUpdateDate().compareTo(f1.getUpdateDate());
            }
        });
        return list;
    }

    @Override
    public String getName() {
        return "服务器文件系统";
    }

    @Override
    public ReportFile saveReport(String title, String filePath, String content) {
        String fullPath = buildFullPath(filePath);
        FileOutputStream outStream = null;
        try {
            outStream = new FileOutputStream(new File(fullPath));
            IOUtils.write(content, outStream, "utf-8");
        } catch (Exception ex) {
            throw new ReportException(ex);
        } finally {
            if (outStream != null) {
                try {
                    outStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

        String newFilePath = filePath.startsWith(prefix) ? filePath.substring(prefix.length()) : filePath;
        return new ReportFile(title, new Date(), false, newFilePath);
    }

    @Override
    public boolean disabled() {
        return disabled;
    }

    public void setDisabled(boolean disabled) {
        this.disabled = disabled;
    }

    public void setFileStoreDir(String fileStoreDir) {
        this.fileStoreDir = fileStoreDir;
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        File file = new File(fileStoreDir);
        if (file.exists()) {
            return;
        }
        if (applicationContext instanceof WebApplicationContext) {
            WebApplicationContext context = (WebApplicationContext) applicationContext;
            ServletContext servletContext = context.getServletContext();
            String basePath = servletContext.getRealPath("/");
            fileStoreDir = basePath + fileStoreDir;
            file = new File(fileStoreDir);
            if (!file.exists()) {
                file.mkdirs();
            }
        }
    }

    @Override
    public String getPrefix() {
        return prefix;
    }
}
