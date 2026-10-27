[简体中文](./README.md) | [English](#)

# Load Project/Library Folder

EasyEDA Pro extension that imports projects (`.epro2`) and libraries (`.elibz2`) directly from **unzipped folders**.

<a href="https://pro.lceda.cn/" target="_blank"><img src="https://img.shields.io/badge/EDA-v3.2.0%2B-blue" alt="EDA version"></a>&nbsp;<img src="https://img.shields.io/badge/license-Apache--2.0-green" alt="License">

<img src="./images/logo.png" width="120" alt="logo" />

## The problem it solves

Many corporate machines run a local file-encryption / DLP agent that transparently encrypts files **inside** archives but cannot transparently decrypt them. As a result:

1. A project is exported from EasyEDA as `.epro2` / `.elibz2` (a zip file);
2. The DLP agent encrypts every file inside that zip;
3. EasyEDA unpacks ciphertext and the import fails without a usable error.

This extension takes a different route: **skip the archive, read the folder**.

- Every file inside a folder is decrypted individually by the OS when read (which DLP agents do support);
- The extension walks the folder tree and re-packs a valid `.epro2` / `.elibz2` **in memory**;
- The in-memory archive is handed to the official EasyEDA import API.

Because the archive is **never written to disk**, it is never re-encrypted, so EasyEDA receives a plaintext package and the import works again.

## Features

| Feature | Description |
| --- | --- |
| Drag & drop / browse | Drop a folder onto the dialog, or open the system folder picker |
| Nested detection | Recursively scans the tree and finds project/library folders at any depth |
| Type detection | `project2.json` (or `*.epru`) → project; `device2.json` (or `*.elibu`) → library |
| In-memory packing | Rebuilds the archive in memory; nothing is written to disk |
| Batch import | Import many projects/libraries one after another with per-item progress and errors |
| Destination picker | Choose workspace/team and destination folder; optionally open the imported project |
| Ready-made archives | Unguarded `.epro2` / `.elibz2` / `.zip` files found in the folder are imported as-is |
| All document types | Menu available on home / blank / schematic / symbol / PCB / footprint / PCB view / panel / panel view |
| Bilingual UI | Follows the client language (zh-Hans / en) |

## Install

1. Download `import-folder-to-easyeda_v1.0.0.eext`;
2. In EasyEDA Pro open **Settings** → **Extensions** → **Extension Manager** → **Load Extension**;
3. Pick the `.eext` file.

> Requires EasyEDA Pro v3.2.0+. The "Browse Folder" button uses `openReadFolderDialog` (v4.2+) and automatically falls back to the standard browser folder picker on older builds.

## Usage

### 1. Open the dialog

Menu: **Load Project/Library Folder → Import from Folder...**

### 2. Pick a folder

Drag a folder into the dashed area, or click **Browse Folder...**.

Any tree shape works — the extension finds every project/library folder inside:

```
MyDesigns/
├── PowerBoard/            ← project folder
│   ├── project2.json
│   └── PowerBoard.epru
├── Archive/
│   └── ControlV1/         ← nested project folder, also detected
│       ├── project2.json
│       └── ControlV1.epru
└── CommonLib/             ← library folder
    ├── device2.json
    └── lib2.elibu
```

### 3. Click "Import" to analyze

The extension walks the tree, detects every project/library folder and reads its name and content statistics (project `title` from `project2.json`; device/symbol/footprint counts for libraries).

### 4. Choose the destination

- **Workspace / Team** — the owner of the imported items;
- **Destination folder** — a folder of that team, or the team root;
- **Open the imported project when finished**;
- **Create devices for single symbols in libraries**.

Then click **Start import**.

### 5. Watch the progress

- `Packing x / y` — reading files and rebuilding the archive in memory;
- `Importing...` — calling the official import API;
- `Imported` / `Failed` (with the reason).

Click **Close** when finished.

## Detection rules

Detection is per-directory, recursive and shallow-to-deep; once a directory matches, its whole subtree becomes the archive content:

| Directory contains | Detected as | Packed as |
| --- | --- | --- |
| `project2.json` or any `*.epru` | Project | `<name>.epro2` |
| `device2.json` or any `*.elibu` | Library | `<name>.elibz2` |
| `*.epro2` / `*.elibz2` / `*.zip` file | Ready-made archive | original file name |

A missing `project2.json` is synthesized so a single lost file does not break the whole import.
`.DS_Store`, `Thumbs.db`, `__MACOSX` and `._*` entries are ignored.

## FAQ

**Why a folder instead of the `.epro2` file?** Because your DLP agent cannot transparently decrypt inside archives — EasyEDA would read ciphertext. Reading a folder means every file is read (and decrypted) individually. Ready-made unencrypted archives inside the folder are still supported.

**Does it write anything to disk?** No. Files are read and zipped in memory and passed to EasyEDA as a `File`.

**The project name looks odd.** The name comes from `title` in `project2.json`, falling back to the folder name. You can rename it in the project tree afterwards.

**EasyEDA rejected the package.** Make sure the folder really contains `project2.json` / `device2.json`; archives produced by other tools or corrupted packages are rejected by EasyEDA — use the appropriate official import flow instead.

## Development

```shell
npm install      # install dependencies
npm run compile  # compile only (ts-node + esbuild → dist/)
npm run build    # compile and package to build/dist/*.eext
npm run debug    # debug build
npm run lint     # ESLint
```

Docs: [EasyEDA extension API guide](https://prodocs.easyeda.com/en/api/guide/)

## Project layout

```
├── extension.json              # manifest (menus, localized fields, logo)
├── images/                     # logo.png (512×512) + logo.svg
├── iframe/import-folder.html   # self-contained dialog (UI + detection + packing + import)
├── locales/                    # UI strings (en / zh-Hans) + extension.json translations
├── src/index.ts                # entry: menu command, open dialog, close handshake
└── case/                       # sample .epro2 / .elibz2 (not packaged)
```

## License

[Apache License 2.0](./LICENSE).
The **嘉立创EDA** / **EasyEDA** trademarks may only be used in the functional description and the title of an open-source release of an extension built on this project.
