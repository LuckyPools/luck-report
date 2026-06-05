package com.luck.report.agent.modules.datasource.controller;

import com.luck.report.agent.modules.datasource.domain.dto.CreateLogicalRelationDTO;
import com.luck.report.agent.modules.datasource.domain.dto.DatasourceTypeDTO;
import com.luck.report.agent.modules.datasource.domain.dto.InitSchemaRequestDTO;
import com.luck.report.agent.modules.datasource.domain.dto.SchemaDTO;
import com.luck.report.agent.modules.datasource.domain.dto.UpdateLogicalRelationDTO;
import com.luck.report.agent.modules.datasource.domain.entity.LogicalRelation;
import com.luck.report.agent.modules.datasource.domain.enums.DatasourceTypeEnum;
import com.luck.report.agent.modules.datasource.domain.vo.DatasourceVO;
import com.luck.report.agent.modules.datasource.service.DatasourceService;
import com.luck.report.agent.modules.businessKnowledgeConfig.domain.vo.ApiResponse;
import com.luck.report.core.definition.datasource.BuildinDatasource;
import com.luck.report.core.Utils;
import javax.validation.Valid;

import com.luck.report.agent.modules.datasource.domain.entity.Datasource;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 数据源管理Controller
 * 提供数据源的增删改查、连接测试、表管理、Schema初始化和逻辑外键管理接口
 *
 * @author luck
 */
@Slf4j
@RestController
@RequestMapping("/datasource")
@CrossOrigin(origins = "*")
@AllArgsConstructor
public class DatasourceController {

    private final DatasourceService datasourceService;

    /**
     * 获取支持的数据源类型列表
     *
     * @return 数据源类型DTO列表
     */
    @GetMapping("/types")
    public ApiResponse<List<DatasourceTypeDTO>> getDatasourceTypes() {
        List<DatasourceTypeEnum> supportedTypes = Arrays.asList(
                DatasourceTypeEnum.MYSQL, DatasourceTypeEnum.POSTGRESQL,
                DatasourceTypeEnum.DAMENG, DatasourceTypeEnum.SQL_SERVER,
                DatasourceTypeEnum.ORACLE, DatasourceTypeEnum.HIVE);

        List<DatasourceTypeDTO> types = supportedTypes.stream()
                .map(type -> DatasourceTypeDTO.builder()
                        .code(type.getCode())
                        .typeName(type.getTypeName())
                        .displayName(type.getDisplayName())
                        .driverClassName(type.getDriverClassName())
                        .build())
                .collect(Collectors.toList());

        return ApiResponse.success("获取数据源类型成功", types);
    }

    /**
     * 获取数据源列表（支持按status、type筛选）
     *
     * @param status 状态筛选（可选）
     * @param type   类型筛选（可选）
     * @return 数据源VO列表
     */
    @GetMapping("/list")
    public ApiResponse<List<DatasourceVO>> list(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "type", required = false) String type) {
        List<DatasourceVO> result;
        if (status != null && !status.isEmpty()) {
            result = datasourceService.getDatasourceByStatus(status);
        } else if (type != null && !type.isEmpty()) {
            result = datasourceService.getDatasourceByType(type);
        } else {
            result = datasourceService.getAllDatasource();
        }
        return ApiResponse.success("查询数据源列表成功", result);
    }

    /**
     * 获取数据源详情
     *
     * @param id 数据源ID
     * @return 数据源VO
     */
    @GetMapping("/detail/{id}")
    public ApiResponse<DatasourceVO> getDetail(@PathVariable Integer id) {
        DatasourceVO vo = datasourceService.getDatasourceById(id);
        if (vo == null) {
            return ApiResponse.error("数据源不存在");
        }
        return ApiResponse.success("查询数据源详情成功", vo);
    }

    /**
     * 创建数据源
     *
     * @param vo 数据源VO
     * @return 创建后的数据源VO
     */
    @PostMapping("/create")
    public ApiResponse<DatasourceVO> create(@RequestBody DatasourceVO vo) {
        try {
            Datasource entity = toEntity(vo);
            DatasourceVO created = datasourceService.createDatasource(entity);
            return ApiResponse.success("创建数据源成功", created);
        } catch (Exception e) {
            log.error("创建数据源失败", e);
            return ApiResponse.error("创建数据源失败：" + e.getMessage());
        }
    }

    /**
     * 更新数据源
     *
     * @param id 数据源ID
     * @param vo 数据源VO
     * @return 更新后的数据源VO
     */
    @PutMapping("/update/{id}")
    public ApiResponse<DatasourceVO> update(@PathVariable Integer id, @RequestBody DatasourceVO vo) {
        try {
            Datasource entity = toEntity(vo);
            DatasourceVO updated = datasourceService.updateDatasource(id, entity);
            return ApiResponse.success("更新数据源成功", updated);
        } catch (Exception e) {
            log.error("更新数据源失败", e);
            return ApiResponse.error("更新数据源失败：" + e.getMessage());
        }
    }

    /**
     * 删除数据源
     *
     * @param id 数据源ID
     * @return 删除结果
     */
    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        try {
            datasourceService.deleteDatasource(id);
            return ApiResponse.success("删除数据源成功");
        } catch (Exception e) {
            log.error("删除数据源失败", e);
            return ApiResponse.error("删除数据源失败：" + e.getMessage());
        }
    }

    /**
     * 测试数据源连接
     *
     * @param id 数据源ID
     * @return 测试结果
     */
    @PostMapping("/test/{id}")
    public ApiResponse<Boolean> testConnection(@PathVariable Integer id) {
        try {
            boolean success = datasourceService.testConnection(id);
            return ApiResponse.success(success ? "连接测试成功" : "连接测试失败", success);
        } catch (Exception e) {
            log.error("连接测试异常", e);
            return ApiResponse.error("连接测试失败：" + e.getMessage());
        }
    }

    /**
     * 更新数据源状态（启用/禁用）
     *
     * @param id      数据源ID
     * @param status  状态：active/inactive
     * @return 操作结果
     */
    @PostMapping("/status/{id}")
    public ApiResponse<Void> updateStatus(@PathVariable Integer id,
                                           @RequestParam(value = "status") String status) {
        try {
            datasourceService.updateStatus(id, status);
            return ApiResponse.success("更新状态成功");
        } catch (Exception e) {
            log.error("更新状态失败", e);
            return ApiResponse.error("更新状态失败：" + e.getMessage());
        }
    }

    /**
     * 获取数据源的表列表
     *
     * @param id 数据源ID
     * @return 表名列表
     */
    @GetMapping("/{id}/tables")
    public ApiResponse<List<String>> getTables(@PathVariable Integer id) {
        try {
            List<String> tables = datasourceService.getDatasourceTables(id);
            return ApiResponse.success("获取表列表成功", tables);
        } catch (Exception e) {
            log.error("获取表列表失败", e);
            return ApiResponse.error("获取表列表失败：" + e.getMessage());
        }
    }

    /**
     * 获取表的字段列表
     *
     * @param id        数据源ID
     * @param tableName 表名
     * @return 字段名列表
     */
    @GetMapping("/{id}/tables/{tableName}/columns")
    public ApiResponse<List<String>> getTableColumns(@PathVariable Integer id,
                                                      @PathVariable String tableName) {
        try {
            List<String> columns = datasourceService.getTableColumns(id, tableName);
            return ApiResponse.success("获取字段列表成功", columns);
        } catch (Exception e) {
            log.error("获取字段列表失败", e);
            return ApiResponse.error("获取字段列表失败：" + e.getMessage());
        }
    }

    /**
     * 初始化表Schema到向量数据库
     * 将指定表的Schema信息向量化存储，供agent查询使用
     *
     * @param id      数据源ID
     * @param request 初始化请求，包含表名列表
     * @return 初始化结果
     */
    @PostMapping("/{id}/init-schema")
    public ApiResponse<Void> initSchema(@PathVariable Integer id,
                                         @RequestBody InitSchemaRequestDTO request) {
        try {
            datasourceService.initTableSchema(id, request.getTables(), request.getModelId());
            return ApiResponse.success("初始化Schema成功");
        } catch (Exception e) {
            log.error("初始化Schema失败", e);
            return ApiResponse.error("初始化Schema失败：" + e.getMessage());
        }
    }

    /**
     * 获取数据源的逻辑外键列表
     *
     * @param id 数据源ID
     * @return 逻辑外键列表
     */
    @GetMapping("/{id}/logical-relations")
    public ApiResponse<List<LogicalRelation>> getLogicalRelations(@PathVariable Integer id) {
        try {
            List<LogicalRelation> relations = datasourceService.getLogicalRelations(id);
            return ApiResponse.success("获取逻辑外键列表成功", relations);
        } catch (Exception e) {
            log.error("获取逻辑外键列表失败", e);
            return ApiResponse.error("获取逻辑外键列表失败：" + e.getMessage());
        }
    }

    /**
     * 添加逻辑外键
     *
     * @param id  数据源ID
     * @param dto 创建逻辑外键DTO
     * @return 添加后的逻辑外键
     */
    @PostMapping("/{id}/logical-relations")
    public ApiResponse<LogicalRelation> addLogicalRelation(@PathVariable Integer id,
                                                            @Valid @RequestBody CreateLogicalRelationDTO dto) {
        try {
            LogicalRelation relation = LogicalRelation.builder()
                    .sourceTableName(dto.getSourceTableName())
                    .sourceColumnName(dto.getSourceColumnName())
                    .targetTableName(dto.getTargetTableName())
                    .targetColumnName(dto.getTargetColumnName())
                    .relationType(dto.getRelationType())
                    .description(dto.getDescription())
                    .build();
            LogicalRelation created = datasourceService.addLogicalRelation(id, relation);
            return ApiResponse.success("添加逻辑外键成功", created);
        } catch (Exception e) {
            log.error("添加逻辑外键失败", e);
            return ApiResponse.error("添加逻辑外键失败：" + e.getMessage());
        }
    }

    /**
     * 更新逻辑外键
     *
     * @param id         数据源ID
     * @param relationId 逻辑外键ID
     * @param dto        更新逻辑外键DTO
     * @return 更新后的逻辑外键
     */
    @PutMapping("/{id}/logical-relations/{relationId}")
    public ApiResponse<LogicalRelation> updateLogicalRelation(@PathVariable Integer id,
                                                               @PathVariable Integer relationId,
                                                               @RequestBody UpdateLogicalRelationDTO dto) {
        try {
            LogicalRelation relation = LogicalRelation.builder()
                    .sourceTableName(dto.getSourceTableName())
                    .sourceColumnName(dto.getSourceColumnName())
                    .targetTableName(dto.getTargetTableName())
                    .targetColumnName(dto.getTargetColumnName())
                    .relationType(dto.getRelationType())
                    .description(dto.getDescription())
                    .build();
            LogicalRelation updated = datasourceService.updateLogicalRelation(id, relationId, relation);
            return ApiResponse.success("更新逻辑外键成功", updated);
        } catch (Exception e) {
            log.error("更新逻辑外键失败", e);
            return ApiResponse.error("更新逻辑外键失败：" + e.getMessage());
        }
    }

    /**
     * 删除逻辑外键
     *
     * @param id         数据源ID
     * @param relationId 逻辑外键ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}/logical-relations/{relationId}")
    public ApiResponse<Void> deleteLogicalRelation(@PathVariable Integer id,
                                                    @PathVariable Integer relationId) {
        try {
            datasourceService.deleteLogicalRelation(id, relationId);
            return ApiResponse.success("删除逻辑外键成功");
        } catch (Exception e) {
            log.error("删除逻辑外键失败", e);
            return ApiResponse.error("删除逻辑外键失败：" + e.getMessage());
        }
    }

    /**
     * 批量保存逻辑外键（替换现有的所有外键）
     *
     * @param id               数据源ID
     * @param logicalRelations 逻辑外键列表
     * @return 保存后的逻辑外键列表
     */
    @PutMapping("/{id}/logical-relations")
    public ApiResponse<List<LogicalRelation>> saveLogicalRelations(@PathVariable Integer id,
                                                                    @RequestBody List<LogicalRelation> logicalRelations) {
        try {
            List<LogicalRelation> saved = datasourceService.saveLogicalRelations(id, logicalRelations);
            return ApiResponse.success("批量保存逻辑外键成功", saved);
        } catch (Exception e) {
            log.error("批量保存逻辑外键失败", e);
            return ApiResponse.error("批量保存逻辑外键失败：" + e.getMessage());
        }
    }

    /**
     * 构建SchemaDTO
     * 通过向量检索召回与查询相关的表结构，合并逻辑外键
     *
     * @param id    数据源ID
     * @param query 用户自然语言查询
     * @return SchemaDTO
     */
    @PostMapping("/{id}/schema-dto")
    public ApiResponse<SchemaDTO> buildSchemaDTO(@PathVariable Integer id,
                                                 @RequestParam(value = "query") String query) {
        try {
            SchemaDTO schemaDTO = datasourceService.buildSchemaDTO(id, query);
            return ApiResponse.success("构建SchemaDTO成功", schemaDTO);
        } catch (Exception e) {
            log.error("构建SchemaDTO失败", e);
            return ApiResponse.error("构建SchemaDTO失败：" + e.getMessage());
        }
    }

    /**
     * 获取格式化的Schema提示词文本
     * 传入查询文本，返回格式化的Schema提示词，供前端Agent拼接到LLM的system prompt中
     * 支持通过数据源ID或名称查询（二选一）
     *
     * @param name   数据源名称（与id二选一）
     * @param id     数据源ID（与name二选一）
     * @param query  用户自然语言查询
     * @return 格式化后的Schema提示词文本
     */
    @PostMapping("/schema-prompt")
    public ApiResponse<String> getSchemaPrompt(
        @RequestParam(value = "name", required = false) String name,
        @RequestParam(value = "id", required = false) Integer id,
        @RequestParam(value = "query") String query) {
        try {
            // 优先使用ID，ID为空时通过名称查询
            Integer datasourceId = id;
            if (datasourceId == null && name != null) {
                DatasourceVO datasource = datasourceService.getDatasourceByName(name);
                if (datasource == null) {
                    return ApiResponse.error("数据源不存在: " + name);
                }
                datasourceId = datasource.getId();
            }
            
            if (datasourceId == null) {
                return ApiResponse.error("必须提供id或name参数");
            }
            
            String prompt = datasourceService.getSchemaPrompt(datasourceId, query);
            return ApiResponse.success("获取Schema提示词成功", prompt);
        } catch (Exception e) {
            log.error("获取Schema提示词失败", e);
            return ApiResponse.error("获取Schema提示词失败：" + e.getMessage());
        }
    }

    /**
     * 获取内置数据源列表（包含ID和名称）
     * 返回所有注册到Spring容器的BuildinDatasource Bean信息
     * 用于设计器端获取可用的数据源列表
     *
     * @return 内置数据源列表，每项包含name和id
     */
    @GetMapping("/buildin/list")
    public ApiResponse<List<Map<String, Object>>> getBuildinDatasources() {
        try {
            Collection<BuildinDatasource> datasources = Utils.getBuildinDatasources();
            List<Map<String, Object>> result = new ArrayList<>();
            
            for (BuildinDatasource ds : datasources) {
                Map<String, Object> item = new HashMap<>();
                item.put("name", ds.name());
                item.put("id", ds.getId());
                result.add(item);
            }
            
            return ApiResponse.success("获取内置数据源列表成功", result);
        } catch (Exception e) {
            log.error("获取内置数据源列表失败", e);
            return ApiResponse.error("获取内置数据源列表失败：" + e.getMessage());
        }
    }

    /**
     * VO转实体
     *
     * @param vo 数据源VO
     * @return 数据源实体
     */
    private Datasource toEntity(DatasourceVO vo) {
        return Datasource.builder()
                .id(vo.getId())
                .name(vo.getName())
                .type(vo.getType())
                .host(vo.getHost())
                .port(vo.getPort())
                .databaseName(vo.getDatabaseName())
                .username(vo.getUsername())
                .password(vo.getPassword())
                .connectionUrl(vo.getConnectionUrl())
                .status(vo.getStatus())
                .description(vo.getDescription())
                .creatorId(vo.getCreatorId())
                .build();
    }
}
