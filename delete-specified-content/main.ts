import { App, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, setIcon } from 'obsidian';

interface DeleteRule {
	id: string;
	name: string;
	enabled: boolean;
	mode: 'regex' | 'range';
	// 正则模式
	pattern: string;
	flags: string;
	// 起止标记模式
	startText: string;
	endText: string;
	includeMarkers: boolean;
}

interface DeleteSpecifiedContentSettings {
	rules: DeleteRule[];
}

const DEFAULT_SETTINGS: DeleteSpecifiedContentSettings = {
	rules: []
};

const DEFAULT_RULE: DeleteRule = {
	id: '',
	name: '新规则',
	enabled: true,
	mode: 'range',
	pattern: '',
	flags: 'g',
	startText: '',
	endText: '',
	includeMarkers: true
};

export default class DeleteSpecifiedContentPlugin extends Plugin {
	settings: DeleteSpecifiedContentSettings;

	async onload() {
		await this.loadSettings();

		// 左侧功能区图标
		this.addRibbonIcon('trash-2', '删除指定内容', () => {
			this.deleteSpecifiedContent();
		});

		// 命令面板命令
		this.addCommand({
			id: 'delete-specified-content',
			name: '删除当前文件中指定内容',
			editorCallback: () => {
				this.deleteSpecifiedContent();
			}
		});

		// 设置面板
		this.addSettingTab(new DeleteSpecifiedContentSettingTab(this.app, this));
	}

	onunload() {
		// 清理工作由 Obsidian 自动完成
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
	}

	deleteSpecifiedContent() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice('请先打开一个 Markdown 文件');
			return;
		}

		const editor = activeView.editor;
		const originalContent = editor.getValue();
		const enabledRules = this.settings.rules.filter(r => r.enabled);

		if (enabledRules.length === 0) {
			new Notice('没有启用的删除规则，请先在设置中添加');
			return;
		}

		let content = originalContent;
		let deletedCount = 0;
		const failedRules: string[] = [];

		for (const rule of enabledRules) {
			try {
				const result = this.applyRule(content, rule);
				if (result.content !== content) {
					deletedCount += result.matchCount;
				}
				content = result.content;
			} catch (e) {
				failedRules.push(rule.name || '未命名规则');
			}
		}

		if (content !== originalContent) {
			editor.setValue(content);
			new Notice(`已删除 ${deletedCount} 处内容`);
		} else if (failedRules.length > 0) {
			new Notice(`规则执行失败：${failedRules.join('、')}`);
		} else {
			new Notice('未找到匹配内容');
		}
	}

	applyRule(content: string, rule: DeleteRule): { content: string; matchCount: number } {
		if (rule.mode === 'regex') {
			if (!rule.pattern) return { content, matchCount: 0 };
			const regex = new RegExp(rule.pattern, rule.flags || 'g');
			let matchCount = 0;
			const newContent = content.replace(regex, () => {
				matchCount++;
				return '';
			});
			return { content: newContent, matchCount };
		} else {
			if (!rule.startText || !rule.endText) return { content, matchCount: 0 };
			let matchCount = 0;
			let searchFrom = 0;
			const parts: string[] = [];

			while (true) {
				const startIndex = content.indexOf(rule.startText, searchFrom);
				if (startIndex === -1) break;

				const endIndex = content.indexOf(rule.endText, startIndex + rule.startText.length);
				if (endIndex === -1) break;

				matchCount++;
				const deleteFrom = rule.includeMarkers ? startIndex : startIndex + rule.startText.length;
				const deleteTo = rule.includeMarkers ? endIndex + rule.endText.length : endIndex;

				parts.push(content.substring(searchFrom, deleteFrom));
				searchFrom = deleteTo;
			}

			parts.push(content.substring(searchFrom));
			return { content: parts.join(''), matchCount };
		}
	}
}

class DeleteSpecifiedContentSettingTab extends PluginSettingTab {
	plugin: DeleteSpecifiedContentPlugin;

	constructor(app: App, plugin: DeleteSpecifiedContentPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: '删除指定内容规则' });
		containerEl.createEl('p', {
			text: '在下方添加删除规则。启用状态的规则会在点击左侧图标或执行命令时被应用到当前文件。'
		});

		// 规则列表
		this.plugin.settings.rules.forEach((rule, index) => {
			this.renderRule(containerEl, rule, index);
		});

		// 添加规则按钮
		new Setting(containerEl)
			.addButton(btn => btn
				.setButtonText('添加规则')
				.setCta()
				.onClick(() => {
					const newRule: DeleteRule = { ...DEFAULT_RULE, id: this.plugin.generateId() };
					this.plugin.settings.rules.push(newRule);
					this.plugin.saveSettings();
					this.display();
				}));
	}

	renderRule(containerEl: HTMLElement, rule: DeleteRule, index: number): void {
		const ruleEl = containerEl.createDiv('delete-rule-item');

		// 头部：名称、启用开关、删除按钮
		const headerEl = ruleEl.createDiv('delete-rule-header');

		const titleEl = headerEl.createDiv('delete-rule-title');
		titleEl.setText(rule.name || '未命名规则');

		const actionsEl = headerEl.createDiv('delete-rule-actions');

		const toggleBtn = actionsEl.createEl('button');
		setIcon(toggleBtn, rule.enabled ? 'check-circle' : 'circle');
		toggleBtn.title = rule.enabled ? '已启用，点击禁用' : '已禁用，点击启用';
		toggleBtn.addEventListener('click', () => {
			rule.enabled = !rule.enabled;
			this.plugin.saveSettings();
			this.display();
		});

		const deleteBtn = actionsEl.createEl('button');
		setIcon(deleteBtn, 'trash');
		deleteBtn.title = '删除规则';
		deleteBtn.addEventListener('click', () => {
			this.plugin.settings.rules.splice(index, 1);
			this.plugin.saveSettings();
			this.display();
		});

		// 字段区域
		const fieldsEl = ruleEl.createDiv('delete-rule-fields');

		// 规则名称
		this.createTextRow(fieldsEl, '名称', rule.name, value => {
			rule.name = value;
			this.plugin.saveSettings();
			titleEl.setText(value || '未命名规则');
		});

		// 模式选择
		const modeRow = fieldsEl.createDiv('delete-rule-row');
		modeRow.createEl('label', { text: '匹配方式' });
		const modeSelect = modeRow.createEl('select');
		modeSelect.createEl('option', { text: '起止标记', value: 'range' });
		modeSelect.createEl('option', { text: '正则表达式', value: 'regex' });
		modeSelect.value = rule.mode;
		modeSelect.addEventListener('change', () => {
			rule.mode = modeSelect.value as 'regex' | 'range';
			this.plugin.saveSettings();
			this.display();
		});

		if (rule.mode === 'regex') {
			this.createTextRow(fieldsEl, '正则', rule.pattern, value => {
				rule.pattern = value;
				this.plugin.saveSettings();
			});
			this.createTextRow(fieldsEl, '标志', rule.flags, value => {
				rule.flags = value;
				this.plugin.saveSettings();
			});
			fieldsEl.createEl('div', {
				cls: 'delete-rule-hint',
				text: '提示：常用标志 g（全局匹配）、m（多行）、i（忽略大小写）。例如删除所有 HTML 注释可填写 <!--[\\s\\S]*?--> 并勾选 g。'
			});
		} else {
			this.createTextRow(fieldsEl, '开头', rule.startText, value => {
				rule.startText = value;
				this.plugin.saveSettings();
			});
			this.createTextRow(fieldsEl, '结尾', rule.endText, value => {
				rule.endText = value;
				this.plugin.saveSettings();
			});
			const markerRow = fieldsEl.createDiv('delete-rule-row');
			markerRow.createEl('label', { text: '包含标记' });
			const markerToggle = markerRow.createEl('input');
			markerToggle.type = 'checkbox';
			markerToggle.checked = rule.includeMarkers;
			markerToggle.addEventListener('change', () => {
				rule.includeMarkers = markerToggle.checked;
				this.plugin.saveSettings();
			});
			markerRow.createSpan({ text: '删除范围包含开头和结尾标记本身' });
		}
	}

	createTextRow(parent: HTMLElement, label: string, value: string, onChange: (value: string) => void): void {
		const row = parent.createDiv('delete-rule-row');
		row.createEl('label', { text: label });
		const input = row.createEl('input');
		input.type = 'text';
		input.value = value;
		input.addEventListener('input', () => {
			onChange(input.value);
		});
	}
}
