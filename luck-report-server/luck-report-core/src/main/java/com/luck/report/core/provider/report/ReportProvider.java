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
package com.luck.report.core.provider.report;

import java.io.InputStream;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2016年12月4日
 */
public interface ReportProvider {
    /**
     * 根据报表名加载报表文件
     *
     * @param filePath 报表名称
     * @return 返回的InputStream
     */
    InputStream loadReport(String filePath);

    /**
     * 根据报表名，删除指定的报表文件
     *
     * @param filePath 报表名称
     */
    void deleteReport(String filePath);

    /**
     * 获取所有的报表文件
     *
     * @return 返回报表文件列表
     */
    List<ReportFile> getReportFiles();

    /**
     * 获取指定路径下的报表文件
     *
     * @param relativePath 相对路径
     * @return 返回报表文件列表
     */
    default List<ReportFile> getReportFiles(String relativePath) {
        return getReportFiles();
    }

    /**
     * 保存报表文件（带展示名）
     * - db: provider 等需要 title 的 provider 可重写此方法
     *
     * @param title    报表展示名（db: provider 用作 title）
     * @param filePath 报表唯一路径（带 provider 前缀）
     * @param content  报表 XML 内容
     * @return 保存后的 ReportFile 描述：
     *         - name：展示名（file / classpath 存储时为去掉 {@value #REPORT_FILE_SUFFIX} 后缀的文件名；db 存储时为 title）
     *         - path：不带 provider 前缀的原始路径，保留 {@value #REPORT_FILE_SUFFIX} 后缀（file / classpath 存储时为相对文件名；db 存储时为数据库主键 id）
     *         - directory：始终为 false
     *         - updateDate：本次保存时间
     *         只读 provider（如 classpath）可返回 {@code new ReportFile()} 占位
     */
    ReportFile saveReport(String title, String filePath, String content);

    /**
     * 报表文件后缀（{@value}），与 {@code FileReportProvider.SUFFIX} / {@code ClasspathReportProvider.SUFFIX} 保持一致。
     */
    String REPORT_FILE_SUFFIX = ".ureport.xml";

    /**
     * 去除报表文件后缀 {@value #REPORT_FILE_SUFFIX}，用于统一 {@link ReportFile#name} 的格式约定。
     * <p>约定：{@link ReportFile#name} 不带 {@value #REPORT_FILE_SUFFIX} 后缀（用于前端展示），{@link ReportFile#path} 保留后缀。
     *
     * @param name 原始名称（可能带后缀、可能为 null）
     * @return 去掉后缀后的字符串；入参为 null 时返回 null
     */
    static String stripReportSuffix(String name) {
        if (name == null) {
            return null;
        }
        if (name.endsWith(REPORT_FILE_SUFFIX)) {
            return name.substring(0, name.length() - REPORT_FILE_SUFFIX.length());
        }
        return name;
    }

    /**
     * 根据报表 filePath 查询对应的 {@link ReportFile} 描述。
     * @param filePath 报表唯一路径（带 provider 前缀）
     * @return ReportFile 描述；无法解析或 filePath 为空时返回 null
     */
    default ReportFile getReportFile(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }
        String prefix = getPrefix();
        String stripped = filePath;
        if (prefix != null && !prefix.isEmpty() && stripped.startsWith(prefix)) {
            stripped = stripped.substring(prefix.length());
        }
        if (stripped.startsWith(":")) {
            stripped = stripped.substring(1);
        }
        int slash = Math.max(stripped.lastIndexOf('/'), stripped.lastIndexOf('\\'));
        String rawName = slash >= 0 ? stripped.substring(slash + 1) : stripped;
        String fileName = stripReportSuffix(rawName);
        return new ReportFile(fileName, null, false, stripped);
    }

    /**
     * @return 返回存储器名称
     */
    String getName();

    /**
     * @return 返回是否禁用
     */
    boolean disabled();

    /**
     * @return 返回报表文件名前缀
     */
    String getPrefix();
}
