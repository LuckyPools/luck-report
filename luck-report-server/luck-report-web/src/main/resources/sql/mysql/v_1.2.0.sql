-- =============================================
-- Luck Report Agent 数据库变更脚本 v1.2.0
-- 数据库类型：MySQL
-- 说明：新增 luck_report_role 表，存储角色与报表的绑定关系（精简版）
-- =============================================

-- 角色 × 报表 绑定表（精简版：仅两列 + 复合主键，物理删除）
-- file_path 存储"provider 前缀 + 报表路径"的完整字符串：
--   - 'file:test.ureport.xml'  文件系统存储
--   - 'db:1'                   数据库存储（db: provider 用主键 id 作为路径）
--   - 'classpath:foo.ureport.xml'
--   - '*'                      通配：表示该角色可访问所有报表（前端"全部报表"勾选对应此值）
-- 不拆 provider 列的原因：预览请求的 filePath 已经是带前缀的完整路径，等值匹配最简；
--                       前端按 provider 筛选走 LIKE 'provider:%'，单字段前缀索引已够用。
CREATE TABLE IF NOT EXISTS `luck_report_role` (
  `role_code` VARCHAR(128) NOT NULL COMMENT '角色编码（第三方系统角色 ID）',
  `file_path` VARCHAR(512) NOT NULL COMMENT '报表完整路径：<provider>:<path>，* 代表全部',
  PRIMARY KEY (`role_code`, `file_path`),
  KEY `idx_file_path` (`file_path`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色与报表绑定关系表（精简版）';
