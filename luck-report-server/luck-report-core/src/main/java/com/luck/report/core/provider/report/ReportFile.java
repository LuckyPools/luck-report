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

import java.io.Serializable;
import java.util.Date;

/**
 * @author Jacky.gao
 * @since 2017年2月11日
 */
public class ReportFile implements Serializable {

    private static final long serialVersionUID = 1L;

    private String name;
    private Date updateDate;
    private boolean directory;
    private String path;

    public ReportFile(String name, Date updateDate) {
        this.name = name;
        this.updateDate = updateDate;
    }

    public ReportFile(String name, Date updateDate, boolean directory, String path) {
        this.name = name;
        this.updateDate = updateDate;
        this.directory = directory;
        this.path = path;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Date getUpdateDate() {
        return updateDate;
    }

    public void setUpdateDate(Date updateDate) {
        this.updateDate = updateDate;
    }

    public boolean isDirectory() {
        return directory;
    }

    public void setDirectory(boolean directory) {
        this.directory = directory;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
}
