package com.luck.report.agent.modules.datasource.service;

import com.luck.report.agent.domain.vo.PageResultVO;
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
    DatasourceVO getDatasourceById(Integer id);

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
    DatasourceVO updateDatasource(Integer id, Datasource datasource);

    /**
     * 删除数据源
     *
     * @param id 数据源ID
     */
    void deleteDatasource(Integer id);

    /**
     * 测试数据源连接
     *
     * @param id 数据源ID
     * @return 连接是否成功
     */
    boolean testConnection(Integer id);

    /**
     * 获取数据源的表列表
     *
     * @param id 数据源ID
     * @return 表名列表
     * @throws Exception 数据库访问异常
     */
    List<String> getDatasourceTables(Integer id) throws Exception;

    /**
     * 获取表的字段列表
     *
     * @param id        数据源ID
     * @param tableName 表名
     * @return 字段名列表
     * @throws Exception 数据库访问异常
     */
    List<String> getTableColumns(Integer id, String tableName) throws Exception;

    /**
     * 初始化表Schema到向量数据库
     * 将指定表的Schema信息向量化存储，供agent查询使用
     *
     * @param id      数据源ID
     * @param tables  需要初始化的表名列表
     * @param modelId 嵌入模型配置ID，为null时使用默认嵌入模型
     * @throws Exception 数据库访问或向量化异常
     */
    void initTableSchema(Integer id, List<String> tables, Long modelId) throws Exception;

    /**
     * 更新数据源状态（启用/禁用）
     *
     * @param id     数据源ID
     * @param status 状态：active/inactive
     */
    void updateStatus(Integer id, String status);

    /**
     * 获取数据源的逻辑外键列表
     *
     * @param datasourceId 数据源ID
     * @return 逻辑外键列表
     */
    List<LogicalRelation> getLogicalRelations(Integer datasourceId);

    /**
     * 添加逻辑外键
     *
     * @param datasourceId    数据源ID
     * @param logicalRelation 逻辑外键实体
     * @return 添加后的逻辑外键
     */
    LogicalRelation addLogicalRelation(Integer datasourceId, LogicalRelation logicalRelation);

    /**
     * 更新逻辑外键
     *
     * @param datasourceId    数据源ID
     * @param relationId      逻辑外键ID
     * @param logicalRelation 逻辑外键实体
     * @return 更新后的逻辑外键
     */
    LogicalRelation updateLogicalRelation(Integer datasourceId, Integer relationId, LogicalRelation logicalRelation);

    /**
     * 删除逻辑外键
     *
     * @param datasourceId   数据源ID
     * @param relationId     逻辑外键ID
     */
    void deleteLogicalRelation(Integer datasourceId, Integer relationId);

    /**
     * 批量保存逻辑外键（替换现有的所有外键）
     *
     * @param datasourceId     数据源ID
     * @param logicalRelations 逻辑外键列表
     * @return 保存后的逻辑外键列表
     */
    List<LogicalRelation> saveLogicalRelations(Integer datasourceId, List<LogicalRelation> logicalRelations);

    /**
     * 构建SchemaDTO
     * 通过向量检索召回与查询相关的表结构，合并逻辑外键，组装为统一的SchemaDTO
     * 供DatasourcePromptHelper格式化为LLM可读的提示词文本
     *
     * @param datasourceId 数据源ID
     * @param query        用户自然语言查询
     * @return SchemaDTO（包含表结构 + 外键关系）
     */
    SchemaDTO buildSchemaDTO(Integer datasourceId, String query);

    /**
     * 获取格式化的Schema提示词文本
     * 传入查询文本，返回格式化的Schema提示词，供前端Agent拼接到LLM的system prompt中
     *
     * @param datasourceId 数据源ID
     * @param query        用户自然语言查询
     * @return 格式化后的Schema提示词文本
     */
    String getSchemaPrompt(Integer datasourceId, String query);

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
