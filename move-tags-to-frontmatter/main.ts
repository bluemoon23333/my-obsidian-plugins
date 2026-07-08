import {
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
} from "obsidian";

interface MoveTagsSettings {
	// frontmatter 中用于存放标签的字段名
	tagFieldName: string;
}

const DEFAULT_SETTINGS: MoveTagsSettings = {
	tagFieldName: "tags",
};

/**
 * 将文件内容拆分为 frontmatter 和正文。
 * frontmatter 包含开头的 `---` 和结尾的 `---` 行。
 */
function splitFrontmatter(content: string): {
	frontmatter: string;
	body: string;
	hasFrontmatter: boolean;
} {
	const lines = content.split("\n");
	if (lines[0]?.trim() === "---") {
		for (let i = 1; i < lines.length; i++) {
			if (lines[i].trim() === "---") {
				return {
					frontmatter: lines.slice(0, i + 1).join("\n"),
					body: lines.slice(i + 1).join("\n"),
					hasFrontmatter: true,
				};
			}
		}
	}
	return { frontmatter: "", body: content, hasFrontmatter: false };
}

export default class MoveTagsToFrontmatterPlugin extends Plugin {
	settings: MoveTagsSettings;

	async onload() {
		await this.loadSettings();

		// 左侧功能区图标
		this.addRibbonIcon("tag", "移动标签到元数据", () => {
			this.moveTagsToFrontmatter();
		});

		// 命令面板命令
		this.addCommand({
			id: "move-tags-to-frontmatter",
			name: "移动标签到元数据",
			callback: () => this.moveTagsToFrontmatter(),
		});

		// 设置页
		this.addSettingTab(new MoveTagsSettingTab(this.app, this));
	}

	async moveTagsToFrontmatter(): Promise<void> {
		const file = this.app.workspace.getActiveFile();
		if (!file || !(file instanceof TFile) || file.extension !== "md") {
			new Notice("请先打开一个 Markdown 文件");
			return;
		}

		const originalContent = await this.app.vault.read(file);
		const { body } = splitFrontmatter(originalContent);

		// Obsidian 标签格式：#标签名，不含空格和 #
		const tagRegex = /#[^\s#]+/g;
		const matches = body.match(tagRegex);
		if (!matches || matches.length === 0) {
			new Notice("正文中未找到可移动的标签");
			return;
		}

		// 去重，保留首次出现的顺序，并去掉开头的 #
		const seen = new Set<string>();
		const tags: string[] = [];
		for (const match of matches) {
			const tagName = match.slice(1);
			if (!seen.has(tagName)) {
				seen.add(tagName);
				tags.push(tagName);
			}
		}

		// 更新 frontmatter：如果不存在该字段则创建为空数组，再追加新标签
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const field = this.settings.tagFieldName;
			if (!Array.isArray(frontmatter[field])) {
				frontmatter[field] = [];
			}
			const arr = frontmatter[field] as string[];
			for (const tag of tags) {
				if (!arr.includes(tag)) {
					arr.push(tag);
				}
			}
		});

		// 重新读取文件（frontmatter 已更新），清理正文中的标签
		const updatedContent = await this.app.vault.read(file);
		const { frontmatter: newFrontmatter } = splitFrontmatter(updatedContent);

		let cleanedBody = body.replace(tagRegex, "");
		cleanedBody = cleanedBody
			.replace(/[ \t]+$/gm, "") // 行尾多余空格
			.replace(/^[ \t]+$/gm, "") // 仅含空白字符的行
			.replace(/\n{3,}/g, "\n\n") // 连续空行最多保留两行
			.trim();

		const finalContent = (newFrontmatter ? newFrontmatter + "\n" : "") + cleanedBody;
		await this.app.vault.modify(file, finalContent);

		new Notice(`已将 ${tags.length} 个标签移动到 "${this.settings.tagFieldName}"`);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class MoveTagsSettingTab extends PluginSettingTab {
	plugin: MoveTagsToFrontmatterPlugin;

	constructor(app: App, plugin: MoveTagsToFrontmatterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("标签字段名")
			.setDesc("正文中找到的标签将被移动到这个 frontmatter 字段。如果字段不存在会自动创建。")
			.addText((text) =>
				text
					.setPlaceholder("tags")
					.setValue(this.plugin.settings.tagFieldName)
					.onChange(async (value) => {
						this.plugin.settings.tagFieldName = value.trim() || "tags";
						await this.plugin.saveSettings();
					})
			);
	}
}
