# 数据源与数据集说明（datasources）

## 一、职能
数据源是报表数据的来源，每个数据源下可包含多个数据集。数据集定义了具体的数据查询逻辑（SQL 或 Spring Bean 方法），报表渲染时后台根据数据集查询数据再填充到单元格中。

---

## 二、数据操作步骤

> **重要提示**：数据模型、约束规则、参考数据已迁移至 `data-schemas.ts`，通过工具自动校验。
> 生成数据集数据前，请先调用【get_dataset_template】或【get_datasource_template】工具获取符合规范的完整模板。

### (一) 读取数据源步骤
1. 传入数据源名称 name 作为参数调用【get_datasources】工具获取数据源对象

### (二) 创建/修改数据源步骤
1. （仅修改操作）传入数据源名称 name 作为参数调用【get_datasources】工具获取数据源对象
2. （创建操作）构建新的数据源对象 / （修改操作）基于获取的数据源对象，按用户要求修改对应字段，数据源对象必须符合数据模型约束
   - 只允许创建buildin数据源，按以下顺序确定数据源名称：
     1. 调用【search_schema】工具搜索与用户需求匹配的数据源（传入用户意图相关的关键词），从返回结果的datasourceName字段获取数据源名称
     2. 调用【load_buildin_datasources】工具获取内置数据源名称列表，确认search_schema返回的名称在该列表中
     3. **数据源name必须来自search_schema的返回结果，且在load_buildin_datasources列表中，禁止凭空编造名称**。系统会自动校验名称是否在列表中，不在列表中的名称将被拒绝
3. 调用【add_datasource】工具创建数据源（type设为buildin）
4. 若 add_datasource 返回失败，可重试

### (三) 删除数据源步骤
1. 传入数据源名称 name 作为参数调用【get_datasources】工具获取数据源对象，确认数据源是否存在，不存在则结束删除任务
2. 调用【remove_datasource】工具删除数据源
3. 若 remove_datasource 返回 0，可重试删除1次

### (四) 读取数据集步骤
1. 调用【get_datasets】工具获取数据集

### (五) 创建数据集流程（强制顺序执行，禁止跳步）

> **强制规则**：以下步骤必须按编号顺序执行，每一步依赖上一步的结果，禁止跳过任何步骤。若某步骤失败，必须终止任务并向用户说明原因，禁止跳过失败步骤继续执行。

**步骤1：确认数据源存在**
- 必须调用【get_datasources】工具确认目标数据源存在，有数据源才可以创建数据集
- 若数据源不存在，按以下规则处理：
  - 若不确定应使用哪个数据源，先调用【search_schema】工具跨数据源搜索表结构，定位包含相关表的数据源
  - 定位到数据源后，调用【add_datasource】工具创建该数据源（type设为buildin，name与搜索结果中的datasourceName一致）
  - 若搜索无结果，告知用户手动添加数据源，**终止任务**

**步骤2：准备SQL或Bean方法**
- 根据数据源类型走不同分支：
  - **jdbc数据源**：要求用户提供SQL语句；若用户未提供且未描述查询意图，**停止任务并提示用户补充**
  - **buildin数据源**：若用户已提供SQL则直接使用；否则根据用户描述的查询意图，调用【get_table_relation】工具获取表及字段信息作为参考生成SQL原型；若查不到匹配信息则提示用户提供SQL
  - **spring数据源**：调用【load_bean_methods】工具（传入beanId）获取Bean方法列表，从中选择匹配的方法；若查不到匹配方法则提示用户自行配置

**步骤3：补充条件参数**
- 若是SQL数据集且需要条件筛选功能，给数据集对象补充 parameters 字段，参数名与SQL中的占位符对应，参数类型适配需求（String/Integer/Date等）
- 若不同参数下SQL逻辑需动态变化，则将SQL改写为脚本式表达式（参照表达式文档）

**步骤4：校验SQL可执行性（前置条件：步骤2已完成）**
- 若是SQL数据集，**必须**调用【preview_data】工具验证SQL是否可执行
- 不可执行则调整SQL后重试一次，仍失败则**终止任务并说明原因**
- **禁止**在 preview_data 返回成功之前调用 add_dataset

**步骤5：解析字段列表（前置条件：步骤4已通过）**
- 若是SQL数据集，**必须**调用【build_fields】工具解析SQL生成字段列表，补充到数据集对象的 fields 字段
- **禁止**自行编造fields字段内容，必须使用build_fields返回的结果
- **禁止**在 build_fields 返回结果之前调用 add_dataset

**步骤6：写入数据集（前置条件：步骤4和步骤5均已完成）**
- 调用【add_dataset】工具添加数据集（传入 datasourceName 和完整的 dataset 对象）
- dataset 参数必须是JSON对象，禁止传JSON字符串
- dataset 对象必须符合数据模型约束，禁止遗漏必填字段（name、sql、fields）
- 若返回 0 则重试1次，仍失败则**终止任务并说明原因**

**步骤7：同步查询表单**
- 若数据集包含 parameters 条件参数，检查报表查询表单是否已配置对应的筛选组件，缺失则调用【get_search_form】和【set_search_form】补充

### (六) 修改数据集流程（强制顺序执行，禁止跳步）

> **强制规则**：以下步骤必须按编号顺序执行，禁止跳过任何步骤。

**步骤1：确认数据集存在**
- 传入数据集名称调用【get_datasets】工具获取现有数据集对象，若不存在则告知用户数据集不存在，**终止任务**

**步骤2：修改数据集内容**
- 基于获取的数据集对象，按用户要求修改对应字段，根据数据源类型走不同分支：
  - **jdbc数据源**：若需修改SQL，要求用户提供新SQL语句；若用户未提供且未描述查询意图，**停止任务并提示用户补充**
  - **buildin数据源**：若需修改SQL且用户已提供则直接使用；否则根据用户描述的查询意图，调用【get_table_relation】工具获取表及字段信息作为参考修改SQL；若查不到匹配信息则提示用户提供SQL
  - **spring数据源**：若需修改Bean方法，调用【load_bean_methods】工具（传入beanId）获取方法列表，从中选择匹配的方法；若查不到匹配方法则提示用户自行配置

**步骤3：调整条件参数**
- 若是SQL数据集且有新增或修改条件筛选功能，调整数据集对象的 parameters 字段，参数名与SQL中的占位符对应，参数类型适配需求
- 若不同参数下SQL逻辑需动态变化，则将SQL改写为脚本式表达式（参照表达式文档）

**步骤4：校验SQL可执行性（前置条件：若修改了SQL则必须执行）**
- 若修改了SQL，**必须**调用【preview_data】工具验证SQL是否可执行
- 不可执行则调整SQL后重试一次，仍失败则**终止任务并说明原因**
- **禁止**在 preview_data 返回成功之前调用 update_dataset

**步骤5：重新解析字段列表（前置条件：若修改了SQL则必须执行）**
- 若修改了SQL，**必须**调用【build_fields】工具重新解析SQL生成字段列表，更新数据集对象的 fields 字段
- **禁止**自行编造fields字段内容，必须使用build_fields返回的结果
- **禁止**在 build_fields 返回结果之前调用 update_dataset

**步骤6：写入数据集（前置条件：步骤4和步骤5均已完成）**
- 调用【update_dataset】工具更新数据集（传入 datasourceName、datasetName 和完整的 dataset 对象）
- dataset 参数必须是JSON对象，禁止传JSON字符串
- dataset 对象必须符合数据模型约束，禁止遗漏必填字段
- 若返回 0 则重试1次，仍失败则**终止任务并说明原因**

**步骤7：同步查询表单**
- 若数据集的 parameters 有新增或修改，检查报表查询表单是否已配置对应的筛选组件，缺失则调用【get_search_form】和【set_search_form】补充

### (七) 删除数据集步骤
1. 传入数据源名称 datasourceName 和数据集名称 datasetName 作为参数调用【get_datasets】工具获取数据集对象，确认数据集存在
2. 调用【remove_dataset】工具删除数据集

---

## 三、关键约束提示

以下约束在工具校验时会自动检查，请务必遵守：

| 约束项 | 要求 |
|--------|------|
| 数据源 name | 不能为空，报表内唯一 |
| 数据源 type | 必须是 jdbc/spring/buildin 之一 |
| buildin数据源 name | **必须来自load_buildin_datasources返回的列表，禁止凭空编造** |
| 数据集 name | 不能为空，数据源内唯一 |
| 数据集 fields | 数组不能为空（至少包含一个字段） |
| SQL数据集 sql | 必须包含 sql 字段 |
| 参数 name | 不能为空 |
| 参数 type | 必须是 String/Integer/Float/Boolean/Date/List 之一 |
| jdbc数据源 | 必须包含 driver、url、username、password |
| spring数据源 | 必须包含 beanId |

> 数据校验失败时，系统会返回错误信息，请根据提示修正数据后重试。
