# 函数说明

## 一、概念说明

函数是 Luck-Report 内置的可调用计算单元，可在单元格表达式、条件属性等位置使用。函数语法格式为 `函数名(表达式, 表达式, ...)`，参数可以是单元格引用、数据集表达式、字面量或其他函数的返回值。函数共 5 类：常用、日期、数学、字符串、分页，详见后文。

## 二、常用函数

| 函数名 | 说明 | 案例 |
|--------|------|------|
| count | 统计数量 | `count(C1)` 统计 C1 数量；`count(C1{age>20},C2{salary>2000})` 统计带条件的多组数量 |
| sum | 累加 | `sum(C1)` 累加 C1；`sum(C1{age>20})` 累加满足条件的 C1 |
| avg | 求平均值 | `avg(C1)`、`avg(C1{age>20},C2{salary>2000})` |
| max | 取最大值 | `max(C1)`、`max(C1{age>20},C2{salary>2000})` |
| min | 取最小值 | `min(C1)`、`min(C1{age>20},C2{salary>2000})` |
| row | 取当前行号 | `row()` |
| column | 取当前列号 | `column()` |
| dataRow | 取数据行号（从1开始） | `dataRow()` |
| order | 排序 | `order(C1,false)` 倒序；`order(C1{age>18},true)` 正序 |
| list | 罗列数据，返回集合 | `list(C1)`、`list(C1,C2{age>20})` |
| param | 获取外部参数 | `param("deptId")` 按名称取；`param(C1)` 取 C1 值当参数名 |
| emptyparam | 判断参数是否为空（null/""） | `emptyparam("name")==false` |
| formatdate | 格式化日期 | `formatdate(C1)` 默认 `yyyy-MM-dd HH:mm:ss`；`formatdate(C1,"yyyyMMdd")` |
| formatnumber | 格式化数字 | `formatnumber(C1)` 默认 `#`；`formatnumber(C1,"#,###.00")` |
| get | 获取数据集中指定位置的对象/属性 | `get(ds1.select(name))` 取第一个；`get(ds1.select(name),2)` 取第二个；`get(ds1.select(name),2,"deptId")` 取属性 |

## 三、日期函数

日期函数均以"当前时间"为输入，无参数。

| 函数名 | 说明 | 案例 |
|--------|------|------|
| date | 输出当前日期 | `date()` 输出 `2010-08-15 08:45:10`；`date('yyyy 年 MM 月 dd 日')` 自定义格式 |
| year | 输出当前年份 | `year()` 输出 `2010` |
| month | 输出当前月份 | `month()` 输出 `8` |
| day | 输出当前天 | `day()` 输出 `15` |
| week | 输出当前星期 | `week()` 输出 `星期三` |

## 四、数学函数

| 函数名 | 说明 | 案例 |
|--------|------|------|
| abs | 绝对值 | `abs(-233)` → `233`；`abs(C1)` |
| ceil | 向上取整（舍弃小数） | `ceil(32.32)` → `32`；`ceil(C1)` |
| floor | 向下取整（四舍五入小数部分） | `floor(32.52)` → `33`；`floor(C1)` |
| round | 四舍五入，第二参为保留位数 | `round(32.12)` → `32`；`round(32.123,2)` → `32.12`；`round(C1,2)` |
| sqrt | 平方根 | `sqrt(2)` → `1.414214`；`sqrt(C1)` |
| pow | 第二个参数的次方 | `pow(3,2)` → `9`；`pow(C1,3)` |
| exp | e 的参数次方 | `exp(213)`；`exp(C1)` |
| log | 自然对数 | `log(213)`；`log(C1)` |
| log10 | 以10为底的对数 | `log10(213)`；`log10(C1)` |
| cos | 余弦 | `cos(213)`；`cos(C1)` |
| sin | 正弦 | `sin(213)`；`sin(C1)` |
| tan | 正切 | `tan(213)`；`tan(C1)` |
| median | 中位数 | `median(12,42,31)` → `31`；`median(C1)`、`median(C1,C2)` |
| mode | 众数 | `mode(12,42,3,12)` → `12`；`mode(C1)`、`mode(C1,C2)` |
| vara | 方差 | `vara(12,42,3,12)` → `209.25`；`vara(C1)`、`vara(C1,C2)` |
| stdevp | 标准差 | `stdevp(12,42,3,12)` → `14.75424`；`stdevp(C1)`、`stdevp(C1,C2)` |
| random | 随机数 | `random()` → `0~1`；`random(10)` → `1~10`；`random(C1)` 以 C1 为种子 |
| chn | 数字转中文 | `chn(213)` → `贰佰壹拾叁`；`chn(C1)`，最多支持2位小数 |
| rmb | 数字转大写人民币 | `rmb(213)` → `贰佰壹拾叁元整`；`rmb(200.12)` → `贰佰元壹角贰分`；`rmb(C1)` |

## 五、字符串函数

| 函数名 | 说明 | 案例 |
|--------|------|------|
| indexof | 查找子串位置，第三参为起始位置 | `indexof('中华人民共和国','共和')`；`indexof('中华人民共和国','共和',2)`；`indexof(C1,"人民",2)` |
| length | 求字符串长度 | `length("中华人民共和国")` → `7`；`length(C1)` |
| lower | 转小写 | `lower("Super man")` → `super man`；`lower(C1)` |
| upper | 转大写 | `upper("Super man")` → `SUPER MAN`；`upper(C1)` |
| replace | 替换子串 | `replace("他是一个好人","他","她")` → `她是一个好人`；`replace(C1,"他","她")` |
| substring | 截取子串，第二参起始位置，第三参结束位置（可选） | `substring("他是一个好人",2)` → `一个好人`；`substring("他是一个好人",2,4)` → `一个`；`substring(C1,2,10)` |
| trim | 去两端空格 | `trim(" 一个好人 ")` → `一个好人`；`trim(C1)` |
| json | 解析 JSON 字符串并取属性，支持 `a.b` 嵌套路径 | `json(emp.select(other),'name')`；`json(emp.select(other),'company.name')` |

## 六、分页函数

分页函数只在**分页预览**时计算，多用于"重复表头/表尾"行。

| 函数名 | 说明 | 案例 |
|--------|------|------|
| pcount | 统计当前页数量 | `pcount(C1)`；`pcount(C1,D2{D2>10000})` |
| psum | 累加当前页值 | `psum(C1)`；`psum(C1,D2{D2<10000})` |
| pmax | 当前页最大值 | `pmax(C1)`；`pmax(C1,D2,E2{E2>1000})` |
| pmin | 当前页最小值 | `pmin(C1)`；`pmin(C1,D2,E2{E2>1000})` |
| page | 输出当前页码 | `page()` |
| pages | 输出总页数（**仅页眉页脚可用**） | `pages()` |

## 七、数据约束

数据约束由 data-schemas.ts 自动校验。主要约束：
- 函数名统一小写
- sum/avg/max/min/median/mode/vara/stdevp/abs/ceil/floor/round/sqrt/pow/exp/log/log10/cos/sin/tan/chn/rmb 要求参数值为数字类型
- 分页函数只在分页预览时生效
- pages 函数仅能在页眉页脚中使用
- json 函数要求 JSON 字符串是标准格式（key 必须用双引号包裹）
- chn/rmb 函数最多支持 2 位小数，超出部分先四舍五入
