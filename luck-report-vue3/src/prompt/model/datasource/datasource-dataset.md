# 数据源与数据集说明（datasources）

## 一、职能
数据源是报表数据的来源，每个数据源下可包含多个数据集。数据集定义了具体的数据查询逻辑（SQL 或 Spring Bean 方法），报表渲染时后台根据数据集查询数据再填充到单元格中。

---

## 二、数据模型

**结构概览**：`datasources[]` → `Datasource`（含 `datasets[]`） → `Dataset`（SQL 数据集 / Spring Bean 数据集）

---

### 1、DatasourceType（数据源类型）

| 枚举值 | 说明 | 适用数据集类型 |
|--------|------|---------------|
| jdbc | JDBC 数据源，通过数据库连接获取数据 | SQL 数据集 |
| spring | Spring Bean 数据源，通过 Spring 容器中的 Bean 获取数据 | Spring Bean 数据集 |
| buildin | 内置数据源，使用系统默认连接 | SQL 数据集 |

---

### 2、Datasource 通用属性

所有类型数据源共有的属性：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| name | string | 数据源名称 | 必填，报表内唯一标识，如 `"myUReportDatasource"` |
| type | string | 数据源类型 | `jdbc` / `spring` / `buildin`（对应 DatasourceType 枚举） |
| datasets | Dataset[] | 数据集列表 | 数据源下的所有数据集 |

---

### 3、JDBC 数据源独有属性

type 为 `jdbc` 时，额外包含以下属性：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| driver | string | JDBC 驱动类名 | 如 `"com.mysql.cj.jdbc.Driver"` |
| url | string | 数据库连接 URL | 如 `"jdbc:mysql://localhost:3306/luck_product?serverTimezone=Asia/Shanghai"` |
| username | string | 数据库用户名 | 如 `"root"` |
| password | string | 数据库密码 | 如 `"root"` |

---

### 4、Spring 数据源独有属性

type 为 `spring` 时，额外包含以下属性：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| beanId | string | Spring Bean ID | 如 `"testBean"`，在 Spring 容器中注册的 Bean 名称 |

---

### 5、buildin 数据源

type 为 `buildin` 时，无额外属性，使用系统内置默认数据库连接，仅包含 `name`、`type`、`datasets`。

---

### 6、SQL 数据集（SqlDataset）

适用于 `jdbc` 和 `buildin` 类型数据源，通过 SQL 语句查询数据。

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| name | string | 数据集名称 | 必填，数据源内唯一，如 `"orders"`，单元格引用时使用此名称 |
| sql | string | SQL 查询语句 | 支持参数占位符 `:paramName` 和脚本式 SQL（`${...}` 包裹） |
| parameters | Parameter[] | 查询参数列表 | SQL 中的参数定义，与查询表单组件的 `vModel` 对应 |
| fields | Field[] | 字段列表 | SQL 查询返回的字段名列表 |
| sqlExpression | object | SQL 表达式对象 | 脚本式 SQL 的表达式解析结果，普通 SQL 时为 `null` |

---

### 7、Spring Bean 数据集（BeanDataset）

适用于 `spring` 类型数据源，通过调用 Spring Bean 的方法获取数据。

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| name | string | 数据集名称 | 必填，数据源内唯一，如 `"simpleBeanData"` |
| method | string | Bean 方法名 | 如 `"loadReportData"` |
| clazz | string | 返回值类型 | 如 `"java.util.Map"`、`"java.util.List"` |
| fields | Field[] | 字段列表 | 方法返回数据的字段名列表 |

---

### 8、Parameter（查询参数）

SQL 数据集中的查询参数，与查询表单输入组件通过 `vModel` 绑定。

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| name | string | 参数名称 | 必填，需与查询表单组件的 `vModel` 一致，如 `"product_name"` |
| type | string | 参数数据类型 | `Integer` / `Float` / `Boolean` / `String` / `Date` / `List`（对应 DataType 枚举） |
| defaultValue | string | 默认值 | 参数为空时使用的默认值，空字符串 `""` 表示无默认值 |

---

### 9、Field（字段）

数据集查询返回的字段定义。

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| name | string | 字段名称 | 如 `"order_id"`、`"price"`、`"category_name"`，单元格数据集引用时使用此名称 |

---

### 10、DataType（参数数据类型枚举）

| 枚举值 | 说明 | 解析规则 |
|--------|------|---------|
| Integer | 整型 | 空字符串返回 null，否则转为 int |
| Float | 浮点型 | 空字符串返回 null，否则转为 double |
| Boolean | 布尔型 | 空字符串返回 null，否则转为 Boolean |
| String | 字符串 | 直接使用字符串值 |
| Date | 日期型 | 空字符串返回 null，支持 `"yyyy-MM-dd"` 和 `"yyyy-MM-dd HH:mm:ss"` 格式 |
| List | 列表型 | 空字符串返回 null，逗号分隔字符串转为 List |

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| DS-01 | 数据源名称唯一 | 同一报表内数据源 `name` 不可重复，前端保存时会校验重名 |
| DS-02 | jdbc 必填字段 | jdbc 类型数据源的 `name`、`username`、`password`、`driver`、`url` 均为必填，前端表单校验不通过则无法保存 |
| DS-03 | spring 必填字段 | spring 类型数据源的 `name`、`beanId` 均为必填 |
| DS-04 | 数据集名称唯一 | 同一报表内所有数据集的 `name` 不可重复（跨数据源也不可重名），前端保存时会遍历所有数据源校验 |
| DS-05 | SQL 数据集必填 | SQL 数据集的 `name` 和 `sql` 均为必填，前端校验不通过则无法保存 |
| DS-06 | 参数名称唯一 | 同一数据集内 Parameter 的 `name` 不可重复，前端保存时会校验重名 |
| DS-07 | 参数类型必填 | Parameter 的 `name` 和 `type` 均为必填，`type` 只能为 String / Integer / Float / Boolean / Date / List |
| DS-08 | 参数与表单联动 | SQL 数据集 Parameter 的 `name` 必须与查询表单输入组件的 `vModel` 一致，否则表单提交时参数无法传递到 SQL |
| DS-09 | jdbc 连接校验 | jdbc 数据源保存前会调用后端连接测试接口验证连接可用性，连接失败则无法保存 |
| DS-10 | 脚本式 SQL 语法 | buildin 数据集的脚本式 SQL 使用 `${...}` 包裹，内部通过 `param('参数名')` 获取参数值；jdbc 数据集的普通 SQL 使用 `:参数名` 占位符 |

---

## 四、参考数据

### 1、buildin 数据源参考

```json
{
  "name": "myUReportDatasource",
  "datasets": [
    {
      "name": "orders",
      "sql": "${\n\tvar sql = \n    'select \n        o.id as order_id,\n        i.quantity as quantity,\n        p.name as product_name,\n        p.price,\n        pc.category_id,\n        p.id,\n        c.name as category_name,\n        u.username\n    from data_agent.orders o \n    join data_agent.order_items i \n        on i.order_id = o.id\n    join data_agent.products p \n        on p.id = i.product_id\n    join data_agent.categories c \n        on c.id = pc.category_id\n    join data_agent.users u \n        on u.id = o.user_id\n    where 1 = 1 ';\n    \n    if(param('product_name') != null && param('product_name') != ''){\n    \t\tsql = sql + 'and p.name = ' + '\\'' + param('product_name') + '\\''\n    }\n    if(param('category_name') != null && param('category_name') != ''){\n    \t\tsql = sql + 'and c.name = ' + '\\'' + param('category_name') + '\\''\n    }\n    \n    \tsql = sql + ' order by o.id '\n    \treturn sql\n}\n",
      "parameters": [
        {
          "name": "product_name",
          "type": "String",
          "defaultValue": ""
        },
        {
          "name": "category_name",
          "type": "String",
          "defaultValue": ""
        }
      ],
      "fields": [
        { "name": "order_id" },
        { "name": "quantity" }
      ],
      "sqlExpression": { }
    }
  ],
  "type": "buildin"
}
```

### 2、jdbc 数据源参考

```json
{
  "name": "userDatasource",
  "driver": "com.mysql.cj.jdbc.Driver",
  "url": "jdbc:mysql://localhost:3306/luck_product?serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf-8",
  "username": "root",
  "password": "root",
  "datasets": [
    {
      "name": "product",
      "sql": "select \n    o.id as order_id,\n    i.quantity as quantity,\n    p.name as product_name,\n    p.price,\n    pc.category_id,\n    p.id,\n    c.name as category_name,\n    u.username\nfrom data_agent.orders o \njoin data_agent.order_items i \n    on i.order_id = o.id\njoin data_agent.products p \n    on p.id = i.product_id\njoin data_agent.categories c \n    on c.id = pc.category_id\njoin data_agent.users u \n    on u.id = o.user_id\nwhere p.name = :product_name",
      "parameters": [
        {
          "name": "product_name",
          "type": "String",
          "defaultValue": ""
        }
      ],
      "fields": [
        { "name": "order_id" },
        { "name": "quantity" }
      ],
      "sqlExpression": null
    }
  ],
  "type": "jdbc"
}
```

### 3、spring 数据源参考

```json
{
  "beanId": "testBean",
  "name": "useBeanDatasource",
  "datasets": [
    {
      "name": "simpleBeanData",
      "method": "loadReportData",
      "clazz": "java.util.Map",
      "fields": []
    }
  ],
  "type": "spring"
}
```

> **关键规则**：SQL 数据集中的 `parameters[].name` 必须与查询表单输入组件的 `vModel` 一致，表单提交时参数值回传给 SQL 实现数据筛选。脚本式 SQL 使用 `${...}` 包裹，内部通过 `param('参数名')` 获取参数值；普通 SQL 使用 `:参数名` 占位符。

---

## 五、工具调用

| 操作 | 工具名称 | 说明 |
|------|---------|------|
| 读取数据源 | `get_datasources` | 不传 name 返回全部数据源列表，传入 name 返回指定数据源对象 |
| 整体替换数据源 | `set_datasources` | 传入 datasources 数组整体替换全部数据源，会覆盖现有配置 |
| 添加数据源 | `add_datasource` | 传入 datasource 对象添加一个新数据源 |
| 更新数据源 | `update_datasource` | 传入 name 和 datasource 对象，按名称匹配替换数据源定义 |
| 删除数据源 | `remove_datasource` | 传入 name 按名称删除数据源，不可撤销 |
| 读取数据集 | `get_datasets` | 不传参数返回所有数据集；传 datasourceName 返回该数据源下数据集；同时传 datasourceName 和 datasetName 返回指定数据集 |
| 添加数据集 | `add_dataset` | 传入 datasourceName 和 dataset 对象，向指定数据源下添加数据集 |
| 更新数据集 | `update_dataset` | 传入 datasourceName、datasetName 和 dataset 对象，按名称匹配替换数据集定义 |
| 删除数据集 | `remove_dataset` | 传入 datasourceName 和 datasetName 删除数据集，不可撤销 |
| 查询文档 | `search_component_doc` | 搜索数据源、数据集等组件文档，componentType 可传 dataset |
| 预览数据 | `preview_data` | 预览数据集查询结果 |
| 构建字段 | `build_fields` | 自动解析数据集字段列表 |
| 保存报表 | `save_report` | 保存当前报表到服务器 |
| 获取内置数据源 | `load_buildin_datasources` | 获取Spring内置数据源列表 |
| 测试连接 | `test_connection` | 测试数据库连接是否可用 |
| 获取Bean方法 | `load_bean_methods` | 获取指定Spring Bean的方法列表 |
