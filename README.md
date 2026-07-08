# my-obsidian-plugins 📝

欢迎来到 **my-obsidian-plugins**！这是一个个人 Obsidian 插件合集，汇集了小巧实用的工具，帮助你更高效地清理笔记、整理标签。✨

> 🗑️ **删除指定内容** —— 按正则或起止标记批量删除匹配内容  
> 🏷️ **Move Tags to Frontmatter** —— 把正文中的 `#标签` 一键迁移到 frontmatter

<!-- Badge Row 1: Core Info - 项目身份 -->
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?logo=obsidian)](https://obsidian.md)
[![GitHub](https://img.shields.io/badge/GitHub-author-181717?logo=github)](https://github.com/author/repo)
[![Version](https://img.shields.io/badge/version-1.0.0-orange)](https://github.com/author/repo)

<!-- Badge Row 2: Package Registry - 包管理器 -->
<!-- 本仓库为 Obsidian 插件合集，不通过 npm / PyPI 等包管理器发布 -->

<!-- Badge Row 3: Tech Stack - 技术栈/语言版本 -->
[![TypeScript](https://img.shields.io/badge/TypeScript-4.7.4-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-339D35?logo=node.js)](https://nodejs.org)
[![esbuild](https://img.shields.io/badge/esbuild-0.17.3-FFCF00?logo=esbuild)](https://esbuild.github.io)

<!-- Badge Row 4: Platforms - 平台支持 -->
[![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)](https://obsidian.md)
[![Windows](https://img.shields.io/badge/Windows-0078D6?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4OCA4OCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTAgMGgzOXYzOUgweiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik00OSAwaDM5djM5SDQ5eiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0wIDQ5aDM5djM5SDB6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTQ5IDQ5aDM5djM5SDQ5eiIvPjwvc3ZnPg==)](https://obsidian.md)
[![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black)](https://obsidian.md)
[![Android](https://img.shields.io/badge/Android-3DDC84?logo=android&logoColor=white)](https://obsidian.md)
[![iOS](https://img.shields.io/badge/iOS-000000?logo=apple&logoColor=white)](https://obsidian.md)
[![Web](https://img.shields.io/badge/Web-4285F4?logo=google-chrome&logoColor=white)](https://obsidian.md)

<!-- Badge Row 5: License - 许可证 -->
[![License](https://img.shields.io/badge/License-MIT-BD2D2D)](LICENSE)

## 目录

- [插件一览](#插件一览)
- [快速开始](#快速开始)
- [功能详解](#功能详解)
- [使用示例](#使用示例)
- [目录结构](#目录结构)
- [技术栈](#技术栈)
- [开发指南](#开发指南)
- [许可证](#许可证)

## 插件一览

| 插件目录 | 插件名称 | 版本 | 核心功能 |
|---|---|---|---|
| `delete-specified-content` | 删除指定内容 | 1.0.0 | 按正则或起止标记删除当前 Markdown 文件中的匹配内容 |
| `move-tags-to-frontmatter` | Move Tags to Frontmatter | 1.0.0 | 将正文中的 `#标签` 移动到 frontmatter 字段 |

两款插件都支持 **左侧功能区图标** 和 **命令面板命令** 两种触发方式，并可在设置面板中自定义规则。😊

## 快速开始

### 环境要求

- [Obsidian](https://obsidian.md) >= 0.15.0
- [Node.js](https://nodejs.org) >= 16.0.0

### 安装与启用

1. 克隆本仓库到本地：

```bash
git clone https://github.com/author/repo.git my-obsidian-plugins
```

2. 进入你想安装的插件目录：

```bash
cd my-obsidian-plugins/delete-specified-content
# 或
cd my-obsidian-plugins/move-tags-to-frontmatter
```

3. 安装依赖并构建：

```bash
npm install
npm run build
```

4. 将构建好的插件目录复制到 Obsidian 库下的 `.obsidian/plugins/` 目录中。
5. 在 Obsidian 的 **设置 → 第三方插件** 中启用对应插件。

## 功能详解

### 🗑️ 删除指定内容

让笔记清理变得轻松！你可以定义多条删除规则，一键批量处理当前打开的 Markdown 文件。

**支持两种匹配模式：**

| 模式 | 说明 | 适用场景 |
|---|---|---|
| 正则表达式 | 使用 JavaScript 正则匹配并删除 | 删除所有 HTML 注释、特定格式文本等 |
| 起止标记 | 通过开头和结尾文本界定删除范围 | 删除广告区块、引用段落、模板残留等 |

**规则配置：**

- 添加多条规则，分别命名
- 每条规则可独立启用 / 禁用
- 起止标记模式下可选择是否包含标记本身
- 正则模式下可配置标志位，如 `g`（全局）、`i`（忽略大小写）、`m`（多行）

### 🏷️ Move Tags to Frontmatter

帮你把散落在正文里的 `#标签` 统一收进 frontmatter，方便后续通过 Dataview 等插件做筛选和汇总。

**主要特性：**

- 自动识别正文中的 `#标签`（Obsidian 标准格式）
- 去重处理，保留首次出现的顺序
- 合并到 frontmatter 的指定字段，默认字段名为 `tags`
- 自动清理正文中的标签文本及多余空行

## 使用示例

### 示例 1：删除所有 HTML 注释

在 **删除指定内容** 的设置中添加一条正则规则：

```text
名称：删除 HTML 注释
匹配方式：正则表达式
正则：<!--[\s\S]*?-->
标志：g
```

执行命令后，以下内容会被删除：

```markdown
<!-- 这是一条注释 -->
正文内容保留
```

### 示例 2：删除网页剪辑中的广告区块

在 **删除指定内容** 的设置中添加起止标记规则：

```text
名称：删除广告区块
匹配方式：起止标记
开头：<!-- AD START -->
结尾：<!-- AD END -->
包含标记：是
```

这样广告区块连同标记本身都会被删除。🧹

### 示例 3：将正文标签迁移到 frontmatter

原始笔记：

```markdown
# 读书笔记

这是一本关于 #productivity 的书，作者是 #author。
```

执行 **Move Tags to Frontmatter** 命令后：

```markdown
---
tags: [productivity, author]
---

# 读书笔记

这是一本关于 的书，作者是 。
```

标签已自动进入 frontmatter，正文也被清理得干干净净！🎉

## 目录结构

```text
my-obsidian-plugins/
├── delete-specified-content/          # 删除指定内容插件
│   ├── main.ts                        # 插件主逻辑
│   ├── manifest.json                  # Obsidian 插件元数据
│   ├── package.json                   # 依赖与脚本
│   ├── esbuild.config.mjs             # 构建配置
│   ├── styles.css                     # 设置面板样式
│   └── versions.json                  # 兼容版本记录
│
├── move-tags-to-frontmatter/          # 移动标签到 frontmatter 插件
│   ├── main.ts
│   ├── manifest.json
│   ├── package.json
│   ├── esbuild.config.mjs
│   ├── version-bump.mjs               # 版本号自动更新脚本
│   └── versions.json
│
└── README.md                          # 本文件
```

## 技术栈

| 技术 | 用途 |
|---|---|
| [TypeScript](https://www.typescriptlang.org) | 类型安全的插件开发语言 |
| [esbuild](https://esbuild.github.io) | 极速打包构建 |
| [Obsidian API](https://docs.obsidian.md) | 编辑器、文件系统、frontmatter 操作 |
| [Node.js](https://nodejs.org) | 开发与构建环境 |

## 开发指南

```bash
# 1. 进入插件目录
cd delete-specified-content
# 或 cd move-tags-to-frontmatter

# 2. 安装依赖
npm install

# 3. 开发构建（持续监听）
npm run dev

# 4. 生产构建（类型检查 + 打包）
npm run build

# 5. 版本发布（自动更新 manifest.json 和 versions.json）
npm run version
```

> 💡 **小提示**：构建完成后，记得将插件目录复制到 Obsidian 库的 `.obsidian/plugins/` 下，或者使用符号链接方便调试。

## 许可证

本项目采用 [MIT](LICENSE) 许可证，欢迎自由使用和参考。🌟

> 💡 **Badge 说明**：以上 Badge 为自动生成，如与实际不符可手动删除或修改。

---

### English Version

Welcome to **my-obsidian-plugins**! This is a personal collection of Obsidian plugins, featuring small but handy utilities to help you clean up notes and organize tags more efficiently. ✨

> 🗑️ **Delete Specified Content** — batch delete content by regex or range markers  
> 🏷️ **Move Tags to Frontmatter** — move inline `#tags` into frontmatter with one click

### Table of Contents

- [Plugins Overview](#plugins-overview)
- [Quick Start](#quick-start)
- [Features](#features)
- [Usage Examples](#usage-examples)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Development](#development)
- [License](#license)

### Plugins Overview

| Plugin Directory | Plugin Name | Version | Core Feature |
|---|---|---|---|
| `delete-specified-content` | Delete Specified Content | 1.0.0 | Delete matching content in the current Markdown file by regex or range markers |
| `move-tags-to-frontmatter` | Move Tags to Frontmatter | 1.0.0 | Move inline `#tags` into a frontmatter field |

Both plugins can be triggered via the **left sidebar ribbon icon** or the **command palette**, and support customization through their setting tabs. 😊

### Quick Start

#### Requirements

- [Obsidian](https://obsidian.md) >= 0.15.0
- [Node.js](https://nodejs.org) >= 16.0.0

#### Installation

1. Clone this repository:

```bash
git clone https://github.com/author/repo.git my-obsidian-plugins
```

2. Enter the plugin directory you want to install:

```bash
cd my-obsidian-plugins/delete-specified-content
# or
cd my-obsidian-plugins/move-tags-to-frontmatter
```

3. Install dependencies and build:

```bash
npm install
npm run build
```

4. Copy the built plugin folder into your Obsidian vault's `.obsidian/plugins/` directory.
5. Enable the plugin from **Settings → Community Plugins** in Obsidian.

### Features

#### 🗑️ Delete Specified Content

Make note cleanup easy! Define multiple deletion rules and apply them to the currently opened Markdown file with one action.

**Two matching modes:**

| Mode | Description | Use Case |
|---|---|---|
| Regex | Delete content matching a JavaScript regular expression | Remove HTML comments, specific formatted text, etc. |
| Range Markers | Delete content between a start and end marker | Remove ad blocks, quoted sections, leftover templates, etc. |

**Rule configuration:**

- Add multiple named rules
- Enable or disable each rule independently
- Choose whether to include the markers themselves in range mode
- Configure regex flags such as `g` (global), `i` (ignore case), and `m` (multiline)

#### 🏷️ Move Tags to Frontmatter

Move scattered `#tags` from the note body into frontmatter, making it easier to filter and query with plugins like Dataview.

**Key features:**

- Automatically detects Obsidian-style `#tags` in the note body
- Deduplicates tags while preserving first-occurrence order
- Merges tags into a configurable frontmatter field, defaulting to `tags`
- Cleans up tag text and excessive blank lines in the body

### Usage Examples

#### Example 1: Remove all HTML comments

Add a regex rule in the **Delete Specified Content** settings:

```text
Name: Remove HTML comments
Mode: Regex
Pattern: <!--[\s\S]*?-->
Flags: g
```

After running the command, the following content will be removed:

```markdown
<!-- This is a comment -->
Main content is preserved
```

#### Example 2: Remove ad blocks from web clips

Add a range marker rule:

```text
Name: Remove ad block
Mode: Range Markers
Start: <!-- AD START -->
End: <!-- AD END -->
Include markers: Yes
```

The ad block and its markers will both be deleted. 🧹

#### Example 3: Move inline tags to frontmatter

Original note:

```markdown
# Reading Notes

This is a book about #productivity by #author.
```

After running **Move Tags to Frontmatter**:

```markdown
---
tags: [productivity, author]
---

# Reading Notes

This is a book about  by .
```

Tags are now in frontmatter, and the body is clean! 🎉

### Project Structure

```text
my-obsidian-plugins/
├── delete-specified-content/          # Delete Specified Content plugin
│   ├── main.ts                        # Main plugin logic
│   ├── manifest.json                  # Obsidian plugin metadata
│   ├── package.json                   # Dependencies and scripts
│   ├── esbuild.config.mjs             # Build configuration
│   ├── styles.css                     # Settings panel styles
│   └── versions.json                  # Compatibility version records
│
├── move-tags-to-frontmatter/          # Move Tags to Frontmatter plugin
│   ├── main.ts
│   ├── manifest.json
│   ├── package.json
│   ├── esbuild.config.mjs
│   ├── version-bump.mjs               # Automatic version bump script
│   └── versions.json
│
└── README.md                          # This file
```

### Tech Stack

| Technology | Purpose |
|---|---|
| [TypeScript](https://www.typescriptlang.org) | Type-safe plugin development language |
| [esbuild](https://esbuild.github.io) | Fast bundling and building |
| [Obsidian API](https://docs.obsidian.md) | Editor, file system, and frontmatter operations |
| [Node.js](https://nodejs.org) | Development and build environment |

### Development

```bash
# 1. Enter a plugin directory
cd delete-specified-content
# or cd move-tags-to-frontmatter

# 2. Install dependencies
npm install

# 3. Development build (watch mode)
npm run dev

# 4. Production build (type check + bundle)
npm run build

# 5. Version bump (updates manifest.json and versions.json)
npm run version
```

> 💡 **Tip**: After building, copy the plugin folder to your Obsidian vault's `.obsidian/plugins/` directory, or use a symbolic link for easier debugging.

### License

This project is licensed under the [MIT](LICENSE) License. Feel free to use and reference it. 🌟

> 💡 **Badge note**: The badges above are auto-generated. Feel free to remove or modify any that do not match your actual project.
