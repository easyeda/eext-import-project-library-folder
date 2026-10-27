# Changelog

## 1.0.0

首个版本 / Initial release.

### 新增 / Added

- 菜单「加载工程/库文件夹 → 从文件夹导入工程 / 库...」，在 home、blank、原理图、符号、PCB、封装、PCB 视图、面板、面板视图中均可用。
- 导入弹窗：支持拖拽文件夹、点击打开系统文件夹选择框，分「选择文件夹 → 设置归属 → 导入」三步。
- 弹窗内置使用说明：批量下载工程/库压缩包（附「导出设计压缩包」扩展链接）→ 批量解压到单独文件夹 → 选择顶层文件夹导入。
- 递归识别多层嵌套的工程（`project2.json` / `*.epru`）与库（`device2.json` / `*.elibu`）文件夹，自动区分类型。
- 在内存中重建 `.epro2` / `.elibz2` 压缩包（自实现 ZIP 写入器，STORE + CRC32），全程不写磁盘，规避压缩包被 DLP 再次加密。
- 支持一次识别多个工程 / 库，勾选后逐个导入，展示打包进度、导入状态与失败原因。
- 导入前选择工作区 / 团队与目标目录，可自动打开导入后的工程、可为库中的单符号创建器件。
- 文件夹内已存在的未加密 `.epro2` / `.elibz2` / `.zip` 可直接原样导入；类型未知的压缩包会依次尝试工程 / 库两条导入通道。
- 补充扩展描述、README（中/英）、中英文界面文案与 extension.json 字段翻译。
- 重新设计扩展 logo（`images/logo.svg` 与 512×512 的 `images/logo.png`）。

### 修复 / Fixed

- 主按钮 hover 时丢失渐变背景，白色文字压在浅色底上不可见。
- 弹窗文案改为内联中文字典 + 语言探测，修复中文环境下文案显示英文的问题。
- 移除「关于」菜单项与对应方法，菜单只保留导入入口。

### 依赖的 EDA 接口 / APIs used

- `sys_IFrame.openIFrame / closeIFrame / isIFrameAlreadyExist / hideIFrame`
- `sys_FileSystem.openReadFolderDialog`
- `sys_FileManager.importProjectByProjectFile`
- `sys_I18n.getCurrentLanguage`（弹窗语言探测）
- `sys_Window.open`（使用说明中的外链）
- `dmt_Team.getAllTeamsInfo / getAllInvolvedTeamInfo / getCurrentTeamInfo`
- `dmt_Folder.getAllFoldersUuid / getFolderInfo`
- `dmt_Project.openProject`
