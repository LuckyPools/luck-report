package com.luck.report.agent.modules.datasource.service;

import com.luck.report.common.domain.vo.PageResultVO;
import com.luck.report.agent.modules.datasource.domain.dto.DatasourceQueryDTO;
import com.luck.report.agent.modules.datasource.domain.dto.SchemaDTO;
import com.luck.report.agent.modules.datasource.domain.entity.Datasource;
import com.luck.report.agent.modules.datasource.domain.entity.LogicalRelation;
import com.luck.report.agent.modules.datasource.domain.vo.DatasourceVO;
import com.luck.report.agent.modules.datasource.domain.vo.SchemaSearchResultVO;

import java.util.List;

/**
 * 数据源服务接口
 * 提供数据源的增删改查、连接测试、表管理、Schema初始化和逻辑外键管理功能
 *
 * @author luck
 */
public interface DatasourceService {

    /**
     * 获取所有数据源列表
     *
     * @return 数据源VO列表
     */
    List<DatasourceVO> getAllDatasource();

    /**
     * 按状态查询数据源列表
     *
     * @param status 状态：active/inactive
     * @return 数据源VO列表
     */
    List<DatasourceVO> getDatasourceByStatus(String status);

    /**
     * 按类型查询数据源列表
     *
     * @param type 数据源类型
     * @return 数据源VO列表
     */
    List<DatasourceVO> getDatasourceByType(String type);

    /**
     * 根据ID获取数据源详情
     *
     * @param id 数据源ID
     * @return 数据源VO
     */
    DatasourceVO getDatasourceById(String id);

    /**
     * 创建数据源
     *
     * @param datasource 数据源实体
     * @return 创建后的数据源VO
     */
    DatasourceVO createDatasource(Datasource datasource);

    /**
     * 更新数据源
     *
     * @param id         数据源ID
     * @param datasource 数据源实体
     * @return 更新后的数据源VO
     */
    DatasourceVO updateDatasource(String id, Datasource datasource);

    /**
     * 删除数据源
     *
     * @param id 数据源ID
     */
    void deleteDatasource(String id);

    /**
     * 测试数据源连接
     *
     * @param id 数据源ID
     * @return 连接是否成功
     */
    boolean testConnection(String id);

    /**
     * 获取数据源的表列表
     *
     * @param id 数据源ID
     * @return 表名列表
     * @throws Exception 数据库访问异常
     */
    List<String> getDatasourceTables(String id) throws Exception;

    /**
     * 获取表的字段列表
     *
     * @param id        数据源ID
     * @param tableName 表名
     * @return 字段名列表
     * @throws Exception 数据库访问异常
     */
    List<String> getTableColumns(String id, String tableName) throws Exception;

    /**
     * 初始化表Schema到向量数据库
     * 将指定表的Schema信息向量化存储，供agent查询使用
     *
     * @param id      数据源ID
     * @param tables  需要初始化的表名列表
     * @param modelId 嵌入模型配置ID，为null时使用默认嵌入模型
     * @throws Exception 数据库访问或向量化异常
     */
    void initTableSchema(String id, List<String> tables, String modelId) throws Exception;

    /**
     * 更新数据源状态（启用/禁用）
     *
     * @param id     数据源ID
     * @param status 状态：active/inactive
     */
    void updateStatus(String id, String status);

    /**
     * 获取数据源的逻辑外键列表
     *
     * @param datasourceId 数据源ID
     * @return 逻辑外键列表
     */
    List<LogicalRelation> getLogicalRelations(String datasourceId);

    /**
     * 添加逻辑外键
     *
     * @param datasourceId    数据源ID
     * @param logicalRelation 逻辑外键实体
     * @return 添加后的逻辑外键
     */
    LogicalRelation addLogicalRelation(String datasourceId, LogicalRelation logicalRelation);

    /**
     * 更新逻辑外键
     *
     * @param datasourceId    数据源ID
     * @param relationId      逻辑外键ID
     * @param logicalRelation 逻辑外键实体
     * @return 更新后的逻辑外键
     */
    LogicalRelation updateLogicalRelation(String datasourceId, String relationId, LogicalRelation logicalRelation);

    /**
     * 删除逻辑外键
     *
     * @param datasourceId   数据源ID
     * @param relationId     逻辑外键ID
     */
    void deleteLogicalRelation(String datasourceId, String relationId);

    /**
     * 批量保存逻辑外键（替换现有的所有外键）
     *
     * @param datasourceId     数据源ID
     * @param logicalRelations 逻辑外键列表
     * @return 保存后的逻辑外键列表
     */
    List<LogicalRelation> saveLogicalRelations(String datasourceId, List<LogicalRelation> logicalRelations);

    /**
     * 构建SchemaDTO
     * 通过向量检索召回与查询相关的表结构，合并逻辑外键，组装为统一的SchemaDTO
     * 直接序列化返回给前端，由前端/Agent 转发给 LLM 消费
     *
     * @param datasourceId 数据源ID
     * @param query        用户自然语言查询
     * @return SchemaDTO（包含表结构 + 外键关系）
     */
    SchemaDTO buildSchemaDTO(String datasourceId, String query);

    /**
     * 获取与查询相关的表结构信息（含表/字段/外键）
     * 传入查询文本，通过向量检索召回相关表并组装为结构化 SchemaDTO
     * 供前端 Agent 序列化后给 LLM 生成 SQL 做参考
     *
     * @param datasourceId 数据源ID
     * @param query        用户自然语言查询
     * @return SchemaDTO 结构化数据（包含表结构、字段、外键关系）
     */
    SchemaDTO getTableRelations(String datasourceId, String query);

    /**
     * 根据名称获取数据源
     * 用于通过数据源名称获取数据源详情
     *
     * @param name 数据源名称
     * @return 数据源VO，不存在则返回null
     */
    DatasourceVO getDatasourceByName(String name);

    /**
     * 分页条件查询数据源
     *
     * @param queryDTO 查询条件
     * @return 分页结果
     */
    PageResultVO<DatasourceVO> queryByPage(DatasourceQueryDTO queryDTO);

    /**
     * 跨数据源搜索Schema
     * 遍历所有active状态的数据源，通过向量检索召回与查询相关的表结构
     * 返回每个匹配数据源的基本信息和格式化的Schema提示词，供Agent快速定位合适的数据源
     *
     * @param query 用户自然语言查询
     * @return 搜索结果列表，按相关度排序
     */
    List<SchemaSearchResultVO> searchSchema(String query);
}
