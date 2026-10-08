<p align="center">
	<img alt="Luck-Report" src="https://www.tinyluck.cn:8088/assets/image/luck-report-v1/git/header-01.png" width="64">
</p>
<h1 align="center" style="margin: 20px 0; font-weight: bold;">Luck-Report V1.0.2</h1>
<h4 align="center">High-performance Java reporting engine based on Spring</h4>
<p align="center">
	<a href="https://gitee.com/LuckyPools/luck-report/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-green.svg"></a>
	<a href="https://gitee.com/LuckyPools/luck-report/stargazers"><img src="https://gitee.com/LuckyPools/luck-report/badge/star.svg"></a>
	<a href="https://gitee.com/LuckyPools/luck-report/members"><img src="https://img.shields.io/badge/Fork%20on%20Gitee-Click%20Here-blue"></a>
</p>
<p align="center">
	[<a href="./README.md">中文</a>] | [<a href="./README_EN.md">English</a>]
</p>

## 📖 Introduction

Luck-Report is a high-performance Java reporting engine refactored from the open-source project UReport2. Through cell iteration, it can produce arbitrarily complex Chinese-style reports. Compared with UReport2, Luck-Report has a fully upgraded architecture: the backend is built on Spring Boot and the frontend on Vue, aligned with mainstream development stacks and practical project needs.

Luck-Report provides a brand-new web-based report designer. It supports building datasets via SQL and Bean, includes a powerful expression engine, and handles complex business data scenarios. With Luck-Report, you can design and build complex reports entirely in the browser.

Luck-Report is open-sourced under the Apache-2.0 license.

## 🌐 Live Demo

*   Demo: [https://www.tinyluck.cn:8070/luck-report/report/designer](https://www.tinyluck.cn:8070/luck-report/report/designer?reportPath=file%3A%25E8%25AE%25A2%25E5%258D%2595%25E6%258A%25A5%25E8%25A1%25A8-%25E9%2594%2580%25E9%2587%258F%25E7%25BB%259F%25E8%25AE%25A1%25E8%25A1%25A8.ureport.xml)
*   Docs: [https://www.tinyluck.cn:8099/se/docs](https://www.tinyluck.cn:8099/se/docs/2103675978025816154)

## 🚀 Upgrade (with AI)

This repository is **Luck-Report V1**. For an **AI assistant** (natural-language create / edit / Q&A), knowledge-base enhancement, and fuller management capabilities, use the upgrade edition:

**Repository**: [https://gitee.com/LuckyPools/luck-report-server](https://gitee.com/LuckyPools/luck-report-server)

On top of Chinese-style complex reporting, V2 mainly adds:

| Capability | Description |
|------------|-------------|
| AI assistant | Create, edit, and answer questions about reports in natural language with LLM and knowledge base |
| Knowledge base | Vector retrieval over report / business knowledge to assist the AI |
| Report management | Management UI, role permissions, preview authorization, and more |
| Datasource management | Manage datasources, datasets, and related resources |

> V1 remains usable; new features and ongoing iteration are centered on the V2 repository.

## 💻 Requirements

| Runtime | Version |
|---------|---------|
| JDK | >= 1.8 |
| MySQL | >= 5.7 |
| Node.js | >= 14.0 |

## 💬 Community

*   Luck-Report community group: `849697890`

## ✨ Built-in Features

| Feature | Description |
|---------|-------------|
| Report designer | Web-based designer with drag-and-drop, WYSIWYG editing |
| Datasource management | JDBC, Bean, and other datasource configurations |
| Report preview | Real-time preview with pagination support |
| Report export | Export to PDF, Excel (paginated / non-paginated), Word, and more |
| Report printing | PDF direct print, browser print, and other print modes |
| Charts | Rich chart types: bar, line, pie, and more |
| Barcode / QR code | One-dimensional barcodes and QR codes |
| Table components | Crosstabs, list tables, and other table types |
| Expression engine | Powerful expression evaluation |
| Parameter management | Report parameter configuration and passing |
| Conditional properties | Style settings based on conditions |
| Image loading | Dynamically load images into reports |
| Pagination control | Custom pagination rules |
| Internationalization | Multi-language switching (e.g. Chinese / English) |

## 📷 Screenshots

<table>
    <tr>
        <td width="50%" align="center"><b>Report designer</b></td>
        <td width="50%" align="center"><b>Dataset</b></td>
    </tr>
    <tr>
        <td width="50%" align="center"><img src="https://www.tinyluck.cn:8088/assets/image/luck-report-v1/git/designer-01.png" width="100%" /></td>
        <td width="50%" align="center"><img src="https://www.tinyluck.cn:8088/assets/image/luck-report-v1/git/dataset-01.png" width="100%" /></td>
    </tr>
    <tr>
        <td width="50%" align="center"><b>Form designer</b></td>
        <td width="50%" align="center"><b>Charts</b></td>
    </tr>
    <tr>
        <td width="50%" align="center"><img src="https://www.tinyluck.cn:8088/assets/image/luck-report-v1/git/form-designer-01.png" width="100%" /></td>
        <td width="50%" align="center"><img src="https://www.tinyluck.cn:8088/assets/image/luck-report-v1/git/chart-01.png" width="100%" /></td>
    </tr>
    <tr>
        <td width="50%" align="center"><b>Preview</b></td>
        <td width="50%" align="center"><b>Print</b></td>
    </tr>
    <tr>
        <td width="50%" align="center"><img src="https://www.tinyluck.cn:8088/assets/image/luck-report-v1/git/preview-01.png" width="100%" /></td>
        <td width="50%" align="center"><img src="https://www.tinyluck.cn:8088/assets/image/luck-report-v1/git/print-01.png" width="100%" /></td>
    </tr>
</table>

## ❤️ Sponsorship

If this project helps you, a sponsorship scan is welcome — your support keeps maintenance going.

<p>
  <img src="https://www.tinyluck.cn:8088/assets/image/luck-report-v1/git/support-pay.jpg" alt="Sponsorship QR code" width="200" />
</p>
