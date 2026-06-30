package com.luck.report.web.modules.role.mapper;

import com.luck.report.web.modules.role.domain.entity.ReportRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 角色 × 报表 绑定关系 Mapper。
 * <p>SQL 定义在 resources/mapper/{databaseId}/RoleMapper.xml 中，支持多数据库方言。
 *
 * @author luck-report
 * @since 1.2.0
 */
@Mapper
public interface ReportRoleMapper {

    /**
     * 插入一条绑定；冲突由 SQL 自行处理。
     *
     * @param record 绑定记录
     * @return 影响的行数
     */
    int insert(ReportRole record);

    /**
     * 物理删除某角色对某 file_path 的绑定。
     *
     * @param roleCode 角色编码
     * @param filePath 报表完整路径
     * @return 影响的行数
     */
    int deleteBinding(@Param("roleCode") String roleCode,
                      @Param("filePath") String filePath);

    /**
     * 物理删除某角色全部绑定（含 '*'）。
     *
     * @param roleCode 角色编码
     * @return 影响的行数
     */
    int deleteByRoleCode(@Param("roleCode") String roleCode);

    /**
     * 物理删除某角色在指定 provider 前缀下的全部绑定。
     * <p>filePath 走 LIKE 'providerPrefix%'，用于穿梭框保存时"按 provider 覆盖"。
     *
     * @param roleCode       角色编码
     * @param providerPrefix provider 前缀（含冒号），如 'file:' / 'db:'
     * @return 影响的行数
     */
    int deleteByRoleCodeAndProvider(@Param("roleCode") String roleCode,
                                    @Param("providerPrefix") String providerPrefix);

    /**
     * 某角色在某 provider 下已绑定的 file_path 列表（穿梭框右侧，**全量返回，不分页**）。
     *
     * @param roleCode       角色编码
     * @param providerPrefix provider 前缀（含冒号）
     * @return file_path 列表
     */
    List<String> selectFilePathsByRoleAndProvider(@Param("roleCode") String roleCode,
                                                  @Param("providerPrefix") String providerPrefix);

    /**
     * 某角色是否绑定 '*'（'全部报表' 勾选状态）。
     *
     * @param roleCode 角色编码
     * @return 命中数（0/1）
     */
    int countAllBindingByRole(@Param("roleCode") String roleCode);

    /**
     * 某角色的全部绑定数（含 '*'）。
     * <p>与 {@link #countAllBindingByRole} 配合可计算 bindingCount（不含 '*'）：
     * <pre>bindingCount = countBindingsByRole - countAllBindingByRole</pre>
     *
     * @param roleCode 角色编码
     * @return 命中数
     */
    int countBindingsByRole(@Param("roleCode") String roleCode);

    /**
     * 某角色在指定 provider 下的全部绑定（含 '*' 与具体 file_path）。
     *
     * @param roleCode       角色编码
     * @param providerPrefix provider 前缀（含冒号）
     * @return 绑定列表
     */
    List<ReportRole> selectBindingsByRoleAndProvider(@Param("roleCode") String roleCode,
                                                     @Param("providerPrefix") String providerPrefix);

    /**
     * 某 file_path（包括 '*'）被哪些 role_code 绑定（预览鉴权用）。
     *
     * @param filePath 报表完整路径
     * @return role_code 列表
     */
    List<String> selectRoleCodesByFilePath(@Param("filePath") String filePath);

    /**
     * 列出所有去重后的 roleCode（管理端表格行）。
     *
     * @return 角色编码列表
     */
    List<String> selectDistinctRoleCodes();
}
