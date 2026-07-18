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
package com.luck.report.core.expression.model.expr.set;

import java.io.Serializable;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2017年4月2日
 */
public class CellCoordinateSet implements Serializable {
    private static final long serialVersionUID = 1L;
    private List<CellCoordinate> cellCoordinates;

    public CellCoordinateSet() {}

    public CellCoordinateSet(List<CellCoordinate> cellCoordinates) {
        this.cellCoordinates = cellCoordinates;
    }

    public List<CellCoordinate> getCellCoordinates() {
        return cellCoordinates;
    }

    /**
     * 设置单元格坐标列表
     * @param cellCoordinates 单元格坐标列表
     */
    public void setCellCoordinates(List<CellCoordinate> cellCoordinates) {
        this.cellCoordinates = cellCoordinates;
    }
}
