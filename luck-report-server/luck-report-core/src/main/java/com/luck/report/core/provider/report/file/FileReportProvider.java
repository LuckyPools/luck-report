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

import java.io.*;
import java.util.*;

/**
 * @author Jacky.gao
 * @since 2017年2月11日
 */
public class FileReportProvider implements ReportProvider, ApplicationContextAware {
    private String prefix = "file:";
    private String fileStoreDir;
    private boolean disabled;

    /**
     * 解析并校验报表路径，防止路径遍历越界访问 fileStoreDir 之外的文件
     *
     * @param file 报表路径（可带 prefix 前缀）
     * @return 规范化后的绝对路径
     * @throws ReportException 路径为空或越界时抛出
     */
    private String resolvePath(String file) {
        String relative = file;
        if (relative.startsWith(prefix)) {
            relative = relative.substring(prefix.length());
        }
        if (StringUtils.isBlank(relative)) {
            throw new ReportException("Report path can not be empty.");
        }
        try {
            File baseDir = new File(fileStoreDir).getCanonicalFile();
            File target = new File(baseDir, relative).getCanonicalFile();
            if (!target.toPath().startsWith(baseDir.toPath())) {
                throw new ReportException("Report path [" + relative + "] is not allowed.");
            }
            return target.getAbsolutePath();
        } catch (IOException e) {
            throw new ReportException(e);
        }
    }

    @Override
    public InputStream loadReport(String file) {
        String fullPath = resolvePath(file);
        try {
            return new FileInputStream(fullPath);
        } catch (FileNotFoundException e) {
            throw new ReportException(e);
        }
    }

    @Override
    public void deleteReport(String file) {
        String fullPath = resolvePath(file);
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
        File baseDir;
        File file;
        try {
            baseDir = new File(fileStoreDir).getCanonicalFile();
        } catch (IOException e) {
            throw new ReportException(e);
        }
        if (StringUtils.isBlank(relativePath)) {
            file = baseDir;
        } else {
            try {
                file = new File(baseDir, relativePath).getCanonicalFile();
            } catch (IOException e) {
                throw new ReportException(e);
            }
            if (!file.toPath().startsWith(baseDir.toPath())) {
                throw new ReportException("Path [" + relativePath + "] is not allowed.");
            }
        }

        List<ReportFile> list = new ArrayList<ReportFile>();
        File[] files = file.listFiles();
        if (files == null) {
            return list;
        }

        for (File f : files) {
            Calendar calendar = Calendar.getInstance();
            calendar.setTimeInMillis(f.lastModified());
            String currentPath = relativePath.isEmpty() ? f.getName() : relativePath + "/" + f.getName();
            list.add(new ReportFile(f.getName(), calendar.getTime(), f.isDirectory(), currentPath));
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
    public void saveReport(String file, String content) {
        String fullPath = resolvePath(file);
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
        } else {
            file.mkdirs();
        }

        if (applicationContext instanceof WebApplicationContext) {
            WebApplicationContext context = (WebApplicationContext) applicationContext;
            String basePath = context.getServletContext().getRealPath("/");
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
