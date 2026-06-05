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
package com.luck.report.core;

import com.luck.report.core.build.Context;
import com.luck.report.core.definition.datasource.BuildinDatasource;
import com.luck.report.core.definition.datasource.BuildinDatasourceRegistry;
import com.luck.report.core.exception.ConvertException;
import com.luck.report.core.exception.ReportComputeException;
import com.luck.report.core.model.Cell;
import com.luck.report.core.model.Report;
import com.luck.report.core.provider.image.ImageProvider;
import org.apache.commons.beanutils.PropertyUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

import java.math.BigDecimal;
import java.sql.Connection;
import java.text.SimpleDateFormat;
import java.util.*;


/**
 * @author Jacky.gao
 * @since 2016年11月12日
 */
public class Utils implements ApplicationContextAware {
    private static ApplicationContext applicationContext;
    private static Collection<ImageProvider> imageProviders;
    private static boolean debug;

    public static boolean isDebug() {
        return Utils.debug;
    }

    public void setDebug(boolean debug) {
        Utils.debug = debug;
    }

    public static void logToConsole(String msg) {
        if (Utils.debug) {
            System.out.println(msg);
        }
    }

    public static ApplicationContext getApplicationContext() {
        return applicationContext;
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        Utils.applicationContext = applicationContext;
        imageProviders = new ArrayList<ImageProvider>();
        imageProviders.addAll(applicationContext.getBeansOfType(ImageProvider.class).values());
    }

    /**
     * 获取所有内置数据源
     * 优先从 BuildinDatasourceRegistry 动态获取（agent 模块从数据库加载）
     * 如果没有 Registry，则从 Spring 容器直接获取 BuildinDatasource Bean
     *
     * @return 内置数据源集合
     */
    public static Collection<BuildinDatasource> getBuildinDatasources() {
        if (applicationContext == null) {
            return new ArrayList<BuildinDatasource>();
        }

        // 优先从 BuildinDatasourceRegistry 动态获取（agent 模块已加载）
        Map<String, BuildinDatasourceRegistry> registryBeans = applicationContext.getBeansOfType(BuildinDatasourceRegistry.class);
        if (!registryBeans.isEmpty()) {
            List<BuildinDatasource> result = new ArrayList<BuildinDatasource>();
            for (BuildinDatasourceRegistry registry : registryBeans.values()) {
                result.addAll(registry.getBuildinDatasources());
            }
            return result;
        }

        // 备选方案：从 Spring 容器直接获取 BuildinDatasource Bean
        return new ArrayList<BuildinDatasource>(applicationContext.getBeansOfType(BuildinDatasource.class).values());
    }

    public static Collection<ImageProvider> getImageProviders() {
        return imageProviders;
    }

    /**
     * 根据名称获取内置数据源的数据库连接
     *
     * @param name 数据源名称
     * @return 数据库连接，不存在返回 null
     */
    public static Connection getBuildinConnection(String name) {
        for (BuildinDatasource datasource : getBuildinDatasources()) {
            if (name.equals(datasource.name())) {
                return datasource.getConnection();
            }
        }
        return null;
    }

    public static List<Cell> fetchTargetCells(Cell cell, Context context, String cellName) {
        while (!context.isCellPocessed(cellName)) {
            context.getReportBuilder().buildCell(context, null);
        }
        List<Cell> leftCells = fetchCellsByLeftParent(context, cell, cellName);
        List<Cell> topCells = fetchCellsByTopParent(context, cell, cellName);
        if (leftCells != null && topCells != null) {
            int leftSize = leftCells.size(), topSize = topCells.size();
            if (leftSize == 1 || topSize == 0) {
                return leftCells;
            }
            if (topSize == 1 || leftSize == 0) {
                return topCells;
            }
            if (leftSize == 0 && topSize == 0) {
                return new ArrayList<Cell>();
            }
            List<Cell> list = new ArrayList<Cell>();
            if (leftSize <= topSize) {
                for (Cell c : leftCells) {
                    if (topCells.contains(c)) {
                        list.add(c);
                    }
                }
            } else {
                for (Cell c : topCells) {
                    if (leftCells.contains(c)) {
                        list.add(c);
                    }
                }
            }
            return list;
        } else if (leftCells != null && topCells == null) {
            return leftCells;
        } else if (leftCells == null && topCells != null) {
            return topCells;
        } else {
            Report report = context.getReport();
            return report.getCellsMap().get(cellName);
        }
    }

    private static List<Cell> fetchCellsByLeftParent(Context context, Cell cell, String cellName) {
        Cell leftParentCell = cell.getLeftParentCell();
        if (leftParentCell == null) {
            return null;
        }
        if (leftParentCell.getName().equals(cellName)) {
            List<Cell> list = new ArrayList<Cell>();
            list.add(leftParentCell);
            return list;
        }
        Set<String> rowChildCellNames = leftParentCell.getRowChildCellNames();
        if (rowChildCellNames != null && rowChildCellNames.contains(cellName)) {
            Map<String, List<Cell>> childrenCellsMap = leftParentCell.getRowChildrenCellsMap();
            List<Cell> targetCells = childrenCellsMap.get(cellName);
            if (targetCells != null) {
                return targetCells;
            }
        }
        return fetchCellsByLeftParent(context, leftParentCell, cellName);
    }

    private static List<Cell> fetchCellsByTopParent(Context context, Cell cell, String cellName) {
        Cell topParentCell = cell.getTopParentCell();
        if (topParentCell == null) {
            return null;
        }
        if (topParentCell.getName().equals(cellName)) {
            List<Cell> list = new ArrayList<Cell>();
            list.add(topParentCell);
            return list;
        }
        Set<String> columnChildCellNames = topParentCell.getColumnChildCellNames();
        if (columnChildCellNames != null && columnChildCellNames.contains(cellName)) {
            Map<String, List<Cell>> childrenCellsMap = topParentCell.getColumnChildrenCellsMap();
            List<Cell> targetCells = childrenCellsMap.get(cellName);
            if (targetCells != null) {
                return targetCells;
            }
        }
        return fetchCellsByTopParent(context, topParentCell, cellName);
    }

    public static Object getProperty(Object obj, String property) {
        if (obj == null) return null;
        try {
            if (obj instanceof Map && property.indexOf(".") == -1) {
                Map<?, ?> map = (Map<?, ?>) obj;
                return map.get(property);
            }
            return PropertyUtils.getProperty(obj, property);
        } catch (Exception ex) {
            throw new ReportComputeException(ex);
        }
    }

    public static Date toDate(Object obj) {
        if (obj instanceof Date) {
            return (Date) obj;
        } else if (obj instanceof String) {
            SimpleDateFormat sd = new SimpleDateFormat("yyyy-MM-dd");
            try {
                return sd.parse(obj.toString());
            } catch (Exception ex) {
                sd = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                try {
                    return sd.parse(obj.toString());
                } catch (Exception e) {
                    throw new ReportComputeException("Can not convert " + obj + " to Date.");
                }
            }
        }
        throw new ReportComputeException("Can not convert " + obj + " to Date.");
    }

    public static BigDecimal toBigDecimal(Object obj) {
        if (obj == null) {
            return null;
        }
        if (obj instanceof BigDecimal) {
            return (BigDecimal) obj;
        } else {
            String val = String.valueOf(obj).trim();
            if (StringUtils.isBlank(val)) {
                return new BigDecimal(0);
            }
            try {
                return new BigDecimal(val);
            } catch (Exception ex) {
                throw new ConvertException("Can not convert " + obj + " to BigDecimal.");
            }
        }
    }
}
