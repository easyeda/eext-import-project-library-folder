/* eslint-disable no-template-curly-in-string */
// i18n keys use the `${1}` placeholder syntax on purpose
/**
 * 入口文件 / Entry File
 *
 * 「加载工程/库文件夹」扩展入口。
 * 菜单只负责打开弹窗（`/iframe/import-folder.html`），
 * 具体的文件夹遍历、识别、压缩与导入都在弹窗内完成（弹窗内可直接访问 `eda` API）。
 *
 * Entry point of the "Load Project/Library Folder" extension. The menu item only opens
 * the dialog; folder walking, detection, packing and importing all happen inside the
 * iframe (which has direct access to the `eda` API).
 *
 * 开发文档 / Docs: https://prodocs.lceda.cn/cn/api/guide/
 */

/** 弹窗 ID / Dialog iframe id */
const FRAME_ID = 'importFolderDialog';

/**
 * 弹窗与主进程之间的指令通道。
 * 指令通道与业务无关，仅用于「关闭弹窗」这类窗口级协作。
 * Command channel between the dialog and the extension host, used only for
 * window-level cooperation such as closing the dialog.
 */
const STORE_KEY = 'importFolderDialogCmd';

/** 弹窗尺寸 / Dialog size */
const FRAME_WIDTH = 960;
const FRAME_HEIGHT = 720;

/** 轮询间隔（毫秒） / Command polling interval in ms */
const POLL_INTERVAL = 350;

/** 最长保持轮询的时长，避免极端情况下无限循环 / Safety cap for the polling loop */
const POLL_MAX_DURATION = 6 * 60 * 60 * 1000;

function sleep(ms: number): Promise<void> {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}

/** 关闭弹窗，并做一次 DOM 兜底（EDA 偶尔不会真正销毁模态对话框） */
async function closeDialog(): Promise<void> {
	try {
		await eda.sys_IFrame.closeIFrame(FRAME_ID);
	}
	catch (err) {
		console.warn('[ImportFolder] closeIFrame failed:', err);
	}
	try {
		const dialogBoxes = document.querySelectorAll('[id$="_dialog_box"]');
		for (const box of Array.from(dialogBoxes)) {
			const closeButton = box.querySelector('[data-test="close"]') as HTMLElement | null;
			if (!closeButton) {
				continue;
			}
			const eventInit: MouseEventInit = { bubbles: true, cancelable: true, view: window };
			for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
				closeButton.dispatchEvent(new MouseEvent(type, eventInit));
			}
		}
	}
	catch (err) {
		console.warn('[ImportFolder] dialog close button fallback failed:', err);
	}
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function activate(status?: 'onStartupFinished', arg?: string): void {}

/**
 * 菜单入口：打开「加载工程/库文件夹」弹窗。
 * Menu entry: open the "Load Project/Library Folder" dialog.
 */
export async function openImportFolderDialog(): Promise<void> {
	try {
		// 重复点击时先关掉旧窗口，避免多个弹窗叠加
		try {
			const exists = await eda.sys_IFrame.isIFrameAlreadyExist(FRAME_ID);
			if (exists) {
				await eda.sys_IFrame.closeIFrame(FRAME_ID);
				await sleep(200);
			}
		}
		catch (err) {
			console.warn('[ImportFolder] isIFrameAlreadyExist failed:', err);
		}

		await eda.sys_Storage.setExtensionUserConfig(STORE_KEY, JSON.stringify({ cmd: '', seq: Date.now() }));

		await eda.sys_IFrame.openIFrame(`/iframe/import-folder.html`, FRAME_WIDTH, FRAME_HEIGHT, FRAME_ID, {
			title: eda.sys_I18n.text('Load Project/Library Folder'),
			maximizeButton: false,
			minimizeButton: false,
		});

		// 等待弹窗发来的关闭指令；用户手动关闭弹窗时也会检测到并退出轮询
		const startedAt = Date.now();
		for (;;) {
			await sleep(POLL_INTERVAL);
			if (Date.now() - startedAt > POLL_MAX_DURATION) {
				break;
			}

			try {
				const frameExists = await eda.sys_IFrame.isIFrameAlreadyExist(FRAME_ID);
				if (!frameExists) {
					break;
				}
			}
			catch {
				// 忽略检测失败，继续轮询
			}

			let raw: string | null = null;
			try {
				raw = await eda.sys_Storage.getExtensionUserConfig(STORE_KEY);
			}
			catch {
				continue;
			}
			if (!raw) {
				continue;
			}

			let command: { cmd?: string } | null = null;
			try {
				command = JSON.parse(raw) as { cmd?: string };
			}
			catch {
				continue;
			}

			if (command?.cmd === 'close') {
				await eda.sys_Storage.setExtensionUserConfig(STORE_KEY, JSON.stringify({ cmd: 'closing', seq: Date.now() }));
				await closeDialog();
				break;
			}
		}
	}
	catch (err) {
		console.error('[ImportFolder] openImportFolderDialog failed:', err);
		await eda.sys_Dialog.showInformationMessage(
			eda.sys_I18n.text('Failed to open the import dialog: ${1}', undefined, undefined, String(err)),
		);
	}
}
