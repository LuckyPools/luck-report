<p align="center">
	<img alt="Luck-Report" src="https://i.ibb.co/ns87XbXW/header-01.png" width="64">
</p>
<h1 align="center" style="margin: 20px 0; font-weight: bold;">Luck-Report V1.0.2</h1>
<h4 align="center">基于 Spring 的高性能 Java 报表引擎</h4>
<p align="center">
	<a href="https://gitee.com/LuckyPools/luck-report/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-green.svg"></a>
	<a href="https://gitee.com/LuckyPools/luck-report/stargazers"><img src="https://gitee.com/LuckyPools/luck-report/badge/star.svg"></a>
	<a href="https://gitee.com/LuckyPools/luck-report/members"><img src="https://img.shields.io/badge/Fork%20on%20Gitee-Click%20Here-blue"></a>
</p>
<p align="center">
	[<a href="./README.md">中文</a>] | [<a href="./README_EN.md">English</a>]
</p>

## 📖 项目简介

Luck-Report 是一款基于开源项目 UReport2 重构的 Java 高性能报表引擎，通过迭代单元格可以实现任意复杂的中国式报表。相较于 UReport2，Luck-Report 在技术架构上进行了全新升级，后端基于 SpringBoot 框架开发、前端采用 Vue 框架构建，技术选型贴合当下主流项目开发标准，可精准适配各类实际开发需求。

Luck-Report 提供了全新的基于网页的报表设计器，支持通过 SQL、Bean 构建数据集，内置强大的表达式引擎，具备复杂业务场景下的数据处理能力。使用 Luck-Report，打开浏览器即可完成各种复杂报表的设计制作。

Luck-Report 基于 Apache-2.0 开源协议开源

## 🌐 在线体验

*   体验地址：[https://www.tinyluck.cn:8070/luck-report/report/designer](https://www.tinyluck.cn:8070/luck-report/report/designer?reportPath=file%3A%25E8%25AE%25A2%25E5%258D%2595%25E6%258A%25A5%25E8%25A1%25A8-%25E9%2594%2580%25E9%2587%258F%25E7%25BB%259F%25E8%25AE%25A1%25E8%25A1%25A8.ureport.xml)
*   文档地址：[https://www.tinyluck.cn:8099/se/docs](https://www.tinyluck.cn:8099/se/docs/2103675978025816154)

## 🚀 升级版（含 AI）

本仓库为 **Luck-Report V1**。若需要 **AI 智能助手**（自然语言制表 / 改表 / 答疑）、知识库增强与更完整的管理能力，请使用升级版：

**仓库地址**：[https://gitee.com/LuckyPools/luck-report-server](https://gitee.com/LuckyPools/luck-report-server)

V2 在保留中国式复杂报表能力的基础上，主要新增：

| 能力     | 说明                        |
|--------|---------------------------|
| AI 智能助手 | 结合大模型与知识库，用自然语言完成制表、改表与答疑 |
| 知识库    | 报表 / 业务知识向量化检索，辅助智能助手     |
| 报表管理   | 管理页、角色权限与预览授权等            |
| 数据源管理  | 管理数据源、数据集等                |

> V1 继续可用；新功能与后续迭代以 V2 仓库为准。

## 💻 系统要求

| 环境      | 版本要求   |
|----------|-----------|
| JDK      | >= 1.8    |
| MySQL    | >= 5.7    |
| Node.js  | >= 14.0   |

## 💬 技术交流群

*   Luck-Report 技术交流群：`849697890`

## ✨ 内置功能

| 功能        | 描述                                           |
|------------|------------------------------------------------|
| 报表设计器   | 基于网页的报表设计器，支持拖拽式设计，所见即所得   |
| 数据源管理   | 支持 JDBC 数据源、Bean 数据源等多种数据源配置     |
| 报表预览     | 实时预览报表效果，支持分页预览                    |
| 报表导出     | 支持导出为 PDF、Excel（分页/不分页）、Word 等格式 |
| 报表打印     | 支持 PDF 直接打印、浏览器打印等多种打印方式       |
| 图表组件     | 提供丰富的图表类型，支持柱状图、折线图、饼图等    |
| 条码二维码   | 支持一维条码和二维码生成                         |
| 表格组件     | 支持交叉表、列表表等多种表格类型                  |
| 表达式引擎   | 提供强大的表达式计算功能                         |
| 参数管理     | 支持报表参数配置和传递                           |
| 条件属性     | 支持基于条件的样式设置                           |
| 图片加载     | 支持动态加载图片到报表中                         |
| 分页控制     | 支持自定义分页规则                               |
| 国际化支持   | 支持中英文等多语言切换                           |

## 📷 演示图

<table>
    <tr>
        <td width="50%" align="center"><b>报表设计器</b></td>
        <td width="50%" align="center"><b>数据集</b></td>
    </tr>
    <tr>
        <td width="50%" align="center"><img src="https://i.ibb.co/SDwj1WT5/designer-01.png" width="100%" /></td>
        <td width="50%" align="center"><img src="https://i.ibb.co/w2Jb7db/dataset-01.png" width="100%" /></td>
    </tr>
    <tr>
        <td width="50%" align="center"><b>表单设计</b></td>
        <td width="50%" align="center"><b>图表</b></td>
    </tr>
    <tr>
        <td width="50%" align="center"><img src="https://i.ibb.co/YFXbfprz/luck-form-designer-reup.png" width="100%" /></td>
        <td width="50%" align="center"><img src="https://i.ibb.co/HcvcbsJ/chart-01.png" width="100%" /></td>
    </tr>
    <tr>
        <td width="50%" align="center"><b>预览</b></td>
        <td width="50%" align="center"><b>打印</b></td>
    </tr>
    <tr>
        <td width="50%" align="center"><img src="https://i.ibb.co/H9tT9vL/preview-01.png" width="100%" /></td>
        <td width="50%" align="center"><img src="https://i.ibb.co/DPFxYtXL/print-01.png" width="100%" /></td>
    </tr>
</table>

## ❤️ 赞助支持

如果觉得本项目对你有帮助，欢迎扫码赞助，你的支持是项目持续维护的动力～

<p>
  <img src="https://i.ibb.co/358Hb2jW/support-pay.png" alt="赞助二维码" width="200" />
</p>
