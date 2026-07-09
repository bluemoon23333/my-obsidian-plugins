import { App, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

interface PluginSettings {
	diaryFormat: string;
	timeRecordTitle: string;

	sleepKeywords: string;
	workKeywords: string;
	hobbyKeywords: string;

	sleepMaxScore: number;
	workMaxScore: number;
	workStandardHours: number;

	hobbyMode: 'mode1' | 'mode2';
	hobbyMaxScore: number;
	hobbyStandardHours: number;

	completenessMaxScore: number;
	allowedChoresHours: number;

	selfEvaluationField: string;
	habitSectionTitle: string;
	habitEmoji: string;

	finalScoreField: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	diaryFormat: 'YYYY-MM-DD',
	timeRecordTitle: '今日时间记录',

	sleepKeywords: '睡觉\n睡眠',
	workKeywords: '工作\n学习\n事项规划\n人生管理',
	hobbyKeywords: '运动\n力量训练\n兴趣爱好\n娱乐',

	sleepMaxScore: 20,
	workMaxScore: 30,
	workStandardHours: 6,

	hobbyMode: 'mode1',
	hobbyMaxScore: 15,
	hobbyStandardHours: 2,

	completenessMaxScore: 10,
	allowedChoresHours: 2,

	selfEvaluationField: '自我评分',
	habitSectionTitle: '习惯打卡',
	habitEmoji: '🍭',

	finalScoreField: '经验值',
};

interface TimeEvent {
	name: string;
	tags: string[];
	start: number;
	end: number;
	duration: number;
}

export default class DailyExpScorePlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('star', '计算今日经验值', () => {
			this.calculateTodayExp();
		});

		this.addCommand({
			id: 'calculate-today-exp',
			name: '计算今日经验值',
			callback: () => {
				this.calculateTodayExp();
			},
		});

		this.addSettingTab(new DailyExpScoreSettingTab(this.app, this));
	}

	onunload() { }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async calculateTodayExp() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('请先打开一个日记文件。');
			return;
		}

		if (!this.isDiaryFile(activeFile.basename)) {
			new Notice(`当前文件不是日记文件，文件名格式应为：${this.settings.diaryFormat}`);
			return;
		}

		const content = await this.app.vault.read(activeFile);

		const timeRecord = this.extractSection(content, this.settings.timeRecordTitle);
		if (timeRecord === null) {
			new Notice(`未找到时间记录板块：${this.settings.timeRecordTitle}`);
			return;
		}

		const events = this.parseTimeEvents(timeRecord);
		if (events.length === 0) {
			new Notice('时间记录板块中没有解析到任何事件。');
			return;
		}

		const sleepEvents = this.filterEventsByKeywords(events, this.settings.sleepKeywords);
		const sleepScore = sleepEvents.length > 0
			? this.calculateSleepScore(this.extractIntervals(sleepEvents))
			: 0;

		const workEvents = this.filterEventsByKeywords(events, this.settings.workKeywords);
		const workHours = this.sumDurations(workEvents);
		const workScore = this.calculateWorkScore(workHours);

		const hobbyEvents = this.filterEventsByKeywords(events, this.settings.hobbyKeywords);
		const hobbyHours = this.sumDurations(hobbyEvents);
		const hobbyScore = this.calculateHobbyScore(hobbyHours, workHours);

		const recordedHours = this.calculateRecordedHours(events);
		const completenessScore = this.calculateCompletenessScore(recordedHours);

		const selfEvalScore = this.getSelfEvaluationScore(activeFile);

		const habitScore = this.parseHabitScore(content);
		if (habitScore === null) {
			new Notice(`未找到习惯打卡部分：${this.settings.habitSectionTitle}`);
			return;
		}

		const totalScore = sleepScore + workScore + hobbyScore + completenessScore + selfEvalScore + habitScore;

		await this.updateFrontMatter(activeFile, totalScore);

		const breakdown = `睡眠 ${sleepScore.toFixed(2)} + 工作学习 ${workScore.toFixed(2)} + 兴趣爱好 ${hobbyScore.toFixed(2)} + 完整度 ${completenessScore.toFixed(2)} + 自我评估 ${selfEvalScore.toFixed(2)} + 习惯 ${habitScore.toFixed(2)}`;
		new Notice(`今日经验值：${totalScore.toFixed(2)}\n${breakdown}`, 8000);
	}

	isDiaryFile(basename: string): boolean {
		const moment = (window as any).moment;
		if (!moment) return false;
		return moment(basename, this.settings.diaryFormat, true).isValid();
	}

	extractSection(content: string, title: string): string | null {
		const escapedTitle = this.escapeRegex(title);
		const regex = new RegExp(`^#{1,6}\\s*${escapedTitle}\\s*$`, 'm');
		const match = content.match(regex);
		if (!match || match.index === undefined) return null;

		const startIdx = match.index + match[0].length;
		const remaining = content.substring(startIdx);
		const nextHeadingMatch = remaining.match(/^#{1,6}\s/m);
		const endIdx = nextHeadingMatch && nextHeadingMatch.index !== undefined
			? nextHeadingMatch.index
			: remaining.length;

		return remaining.substring(0, endIdx).trim();
	}

	parseTimeEvents(text: string): TimeEvent[] {
		const lines = text.split('\n');
		const events: TimeEvent[] = [];

		for (const rawLine of lines) {
			const line = rawLine.trim();
			if (!line) continue;

			const tagMatch = line.match(/^\[([^\]]+)\]$/);
			if (tagMatch) {
				if (events.length > 0) {
					events[events.length - 1].tags.push(tagMatch[1].trim());
				}
				continue;
			}

			const eventMatch = line.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})\s*[\t ]*【([^】]+)】/);
			if (!eventMatch) continue;

			const startHour = parseInt(eventMatch[1], 10);
			const startMin = parseInt(eventMatch[2], 10);
			const endHour = parseInt(eventMatch[3], 10);
			const endMin = parseInt(eventMatch[4], 10);
			const name = eventMatch[5].trim();

			let start = startHour + startMin / 60;
			let end = endHour + endMin / 60;
			if (end < start) {
				end += 24;
			}

			events.push({
				name,
				tags: [],
				start,
				end,
				duration: end - start,
			});
		}

		return events;
	}

	filterEventsByKeywords(events: TimeEvent[], keywordsText: string): TimeEvent[] {
		const keywords = keywordsText
			.split('\n')
			.map(k => k.trim())
			.filter(k => k.length > 0);
		if (keywords.length === 0) return [];

		return events.filter(e => {
			const text = `${e.name} ${e.tags.join(' ')}`.toLowerCase();
			return keywords.some(k => text.includes(k.toLowerCase()));
		});
	}

	extractIntervals(events: TimeEvent[]): [number, number][] {
		return events.map(e => [e.start, e.end]);
	}

	mergeIntervals(intervals: [number, number][]): [number, number][] {
		if (intervals.length === 0) return [];

		const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
		const merged: [number, number][] = [sorted[0]];

		for (let i = 1; i < sorted.length; i++) {
			const last = merged[merged.length - 1];
			const current = sorted[i];
			if (current[0] <= last[1]) {
				last[1] = Math.max(last[1], current[1]);
			} else {
				merged.push(current);
			}
		}

		return merged;
	}

	sumDurations(events: TimeEvent[]): number {
		return events.reduce((sum, e) => sum + e.duration, 0);
	}

	calculateRecordedHours(events: TimeEvent[]): number {
		let total = 0;
		for (const e of events) {
			const start = Math.max(e.start, 0);
			const end = Math.min(e.end, 24);
			if (end > start) {
				total += end - start;
			}
		}
		return total;
	}

	sleepCurve(x: number): number {
		return 1 + 9 / (1 + Math.exp(-5.0 * (x - 0.50))) - 9 / (1 + Math.exp(-6.0 * (x - 9.75)));
	}

	workCurve(x: number): number {
		return 7 + 3 / (1 + Math.exp(-1.95 * (x - 2.40))) - 10 / (1 + Math.exp(-3.30 * (x - 8.49)));
	}

	hobbyCurve(x: number): number {
		return 10 + 2 / (1 + Math.exp(-7.12 * (x - 0.75))) - 12 / (1 + Math.exp(-9.42 * (x - 2.49)));
	}

	integrate(fn: (x: number) => number, a: number, b: number, n: number = 2000): number {
		if (a >= b) return 0;
		const h = (b - a) / n;
		let sum = fn(a) + fn(b);
		for (let i = 1; i < n; i++) {
			const x = a + i * h;
			sum += (i % 2 === 0 ? 2 : 4) * fn(x);
		}
		return sum * h / 3;
	}

	calculateSleepScore(intervals: [number, number][]): number {
		const merged = this.mergeIntervals(intervals);
		let numerator = 0;

		for (const [rawStart, rawEnd] of merged) {
			if (rawEnd <= 24) {
				numerator += this.integrate(this.sleepCurve, rawStart, rawEnd);
			} else {
				numerator += this.integrate(this.sleepCurve, rawStart, 24);
				numerator += this.integrate(this.sleepCurve, 0, rawEnd - 24);
			}
		}

		const denominator = this.integrate(this.sleepCurve, 0.5, 9.5);
		const ratio = denominator > 0 ? numerator / denominator : 0;
		return this.settings.sleepMaxScore * ratio;
	}

	calculateWorkScore(hours: number): number {
		const numerator = this.integrate(this.workCurve, 0, hours);
		const denominator = this.integrate(this.workCurve, 0, this.settings.workStandardHours);
		const ratio = denominator > 0 ? numerator / denominator : 0;
		return this.settings.workMaxScore * ratio;
	}

	calculateHobbyScore(hobbyHours: number, workHours: number): number {
		const workStandard = this.settings.workStandardHours;
		const coefficient = workHours >= workStandard ? 1 : (workHours / workStandard);
		const hobbyIntegral = this.integrate(this.hobbyCurve, 0, hobbyHours);

		if (this.settings.hobbyMode === 'mode1') {
			const denominator = this.integrate(this.hobbyCurve, 0, this.settings.hobbyStandardHours);
			const ratio = denominator > 0 ? hobbyIntegral / denominator : 0;
			return this.settings.hobbyMaxScore * ratio * coefficient;
		} else {
			const denominator = this.integrate(this.workCurve, 0, workStandard);
			const ratio = denominator > 0 ? hobbyIntegral / denominator : 0;
			return this.settings.workMaxScore * ratio * coefficient;
		}
	}

	calculateCompletenessScore(recordedHours: number): number {
		const denominator = 24 - this.settings.allowedChoresHours;
		const ratio = denominator > 0 ? recordedHours / denominator : 0;
		return this.settings.completenessMaxScore * ratio;
	}

	getSelfEvaluationScore(file: TFile): number {
		const cache = this.app.metadataCache.getFileCache(file);
		const field = this.settings.selfEvaluationField;
		if (cache?.frontmatter && field in cache.frontmatter) {
			const value = parseFloat(cache.frontmatter[field]);
			if (!isNaN(value)) return value;
		}
		return 0;
	}

	parseHabitScore(content: string): number | null {
		const escapedTitle = this.escapeRegex(this.settings.habitSectionTitle);
		const regex = new RegExp(`^>\\s*\\[!\\w+\\][+-]?\\s*${escapedTitle}\\s*$`, 'm');
		const match = content.match(regex);
		console.log('[每日经验值] 习惯打卡正则:', regex.source, '匹配结果:', match ? '找到' : '未找到');
		if (!match || match.index === undefined) return null;

		const startIdx = match.index + match[0].length;
		const remaining = content.substring(startIdx);
		const lines = remaining.split('\n');
		const emoji = this.settings.habitEmoji;
		let total = 0;

		for (const rawLine of lines) {
			const trimmed = rawLine.trim();
			if (!trimmed) continue;
			if (!trimmed.startsWith('>')) break;

			const lineContent = trimmed.replace(/^>\s*/, '');
			console.log('[每日经验值] 处理习惯行:', JSON.stringify(lineContent));

			if (!/^-\s*\[x\]/i.test(lineContent)) {
				console.log('[每日经验值]   -> 未匹配已勾选任务');
				continue;
			}

			const idx = lineContent.indexOf(emoji);
			console.log('[每日经验值]   -> 已勾选，emoji 位置:', idx, 'emoji:', emoji);
			if (idx === -1) continue;

			const afterEmoji = lineContent.substring(idx + emoji.length);
			const numMatch = afterEmoji.match(/^\s*(\d+(?:\.\d+)?)/);
			console.log('[每日经验值]   -> emoji 后文本:', JSON.stringify(afterEmoji), '数字匹配:', numMatch);
			if (numMatch) {
				const value = parseFloat(numMatch[1]);
				total += value;
				console.log('[每日经验值]   -> 累加:', value);
			}
		}

		console.log('[每日经验值] 习惯打卡总分:', total);
		return total;
	}

	async updateFrontMatter(file: TFile, score: number) {
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter[this.settings.finalScoreField] = parseFloat(score.toFixed(2));
		});
	}

	escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}

class DailyExpScoreSettingTab extends PluginSettingTab {
	plugin: DailyExpScorePlugin;

	constructor(app: App, plugin: DailyExpScorePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: '每日经验值计算设置' });

		containerEl.createEl('h3', { text: '日记与时间记录' });

		new Setting(containerEl)
			.setName('日记文件名格式')
			.setDesc('用于判断当前文件是否为日记，例如 YYYY-MM-DD。')
			.addText(text => text
				.setPlaceholder('YYYY-MM-DD')
				.setValue(this.plugin.settings.diaryFormat)
				.onChange(async (value) => {
					this.plugin.settings.diaryFormat = value || 'YYYY-MM-DD';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('时间记录板块标题')
			.setDesc('插件会查找该标题下方的内容作为今日时间记录。')
			.addText(text => text
				.setPlaceholder('今日时间记录')
				.setValue(this.plugin.settings.timeRecordTitle)
				.onChange(async (value) => {
					this.plugin.settings.timeRecordTitle = value || '今日时间记录';
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: '关键词设置' });
		containerEl.createEl('p', { text: '每行一个关键词，事件名称或标签中包含任一关键词即匹配。' });

		new Setting(containerEl)
			.setName('睡眠关键词')
			.addTextArea(text => text
				.setValue(this.plugin.settings.sleepKeywords)
				.onChange(async (value) => {
					this.plugin.settings.sleepKeywords = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('工作学习关键词')
			.addTextArea(text => text
				.setValue(this.plugin.settings.workKeywords)
				.onChange(async (value) => {
					this.plugin.settings.workKeywords = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('兴趣爱好关键词')
			.addTextArea(text => text
				.setValue(this.plugin.settings.hobbyKeywords)
				.onChange(async (value) => {
					this.plugin.settings.hobbyKeywords = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: '评分权重' });

		new Setting(containerEl)
			.setName('睡眠评价分标准分')
			.setDesc('标准睡眠区间 0:30-9:30 对应此项标准分（不是上限，可超额）。')
			.addText(text => text
				.setValue(String(this.plugin.settings.sleepMaxScore))
				.onChange(async (value) => {
					const num = parseFloat(value);
					this.plugin.settings.sleepMaxScore = isNaN(num) ? 0 : num;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('工作学习时长分标准分')
			.setDesc('对应下方标准时长的标准分（不是上限，可超额）。')
			.addText(text => text
				.setValue(String(this.plugin.settings.workMaxScore))
				.onChange(async (value) => {
					const num = parseFloat(value);
					this.plugin.settings.workMaxScore = isNaN(num) ? 0 : num;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('工作学习标准时长（小时）')
			.setDesc('公式中作为分母的 "6 小时"，可修改。')
			.addText(text => text
				.setValue(String(this.plugin.settings.workStandardHours))
				.onChange(async (value) => {
					const num = parseFloat(value);
					this.plugin.settings.workStandardHours = isNaN(num) || num <= 0 ? 6 : num;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('兴趣爱好计算方式')
			.setDesc('方式一：与下方兴趣爱好标准时长积分比较；方式二：与工作学习标准时长积分比较。')
			.addDropdown(dropdown => dropdown
				.addOption('mode1', '方式一')
				.addOption('mode2', '方式二')
				.setValue(this.plugin.settings.hobbyMode)
				.onChange(async (value) => {
					this.plugin.settings.hobbyMode = value as 'mode1' | 'mode2';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('兴趣爱好分标准分（方式一）')
			.setDesc('不是上限，可超额。')
			.addText(text => text
				.setValue(String(this.plugin.settings.hobbyMaxScore))
				.onChange(async (value) => {
					const num = parseFloat(value);
					this.plugin.settings.hobbyMaxScore = isNaN(num) ? 0 : num;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('兴趣爱好标准时长（小时）')
			.setDesc('方式一公式中作为分母的 "2 小时"，可修改。')
			.addText(text => text
				.setValue(String(this.plugin.settings.hobbyStandardHours))
				.onChange(async (value) => {
					const num = parseFloat(value);
					this.plugin.settings.hobbyStandardHours = isNaN(num) || num <= 0 ? 2 : num;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('时间记录完整度分标准分')
			.setDesc('不是上限，可超额。')
			.addText(text => text
				.setValue(String(this.plugin.settings.completenessMaxScore))
				.onChange(async (value) => {
					const num = parseFloat(value);
					this.plugin.settings.completenessMaxScore = isNaN(num) ? 0 : num;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('允许琐事时长（小时）')
			.setDesc('完整度计算中允许不记录的时间，默认 2 小时。')
			.addText(text => text
				.setValue(String(this.plugin.settings.allowedChoresHours))
				.onChange(async (value) => {
					const num = parseFloat(value);
					this.plugin.settings.allowedChoresHours = isNaN(num) ? 2 : num;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: '其他设置' });

		new Setting(containerEl)
			.setName('自我评估元数据字段')
			.setDesc('从当前日记的 YAML 前置元数据中读取该字段的数值。')
			.addText(text => text
				.setPlaceholder('自我评分')
				.setValue(this.plugin.settings.selfEvaluationField)
				.onChange(async (value) => {
					this.plugin.settings.selfEvaluationField = value || '自我评分';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('习惯打卡板块标题')
			.setDesc('插件会查找该标题对应的 Callout 块。')
			.addText(text => text
				.setPlaceholder('习惯打卡')
				.setValue(this.plugin.settings.habitSectionTitle)
				.onChange(async (value) => {
					this.plugin.settings.habitSectionTitle = value || '习惯打卡';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('习惯分数 Emoji')
			.setDesc('勾选习惯中该 Emoji 后面的数字会被累加。')
			.addText(text => text
				.setPlaceholder('🍭')
				.setValue(this.plugin.settings.habitEmoji)
				.onChange(async (value) => {
					this.plugin.settings.habitEmoji = value || '🍭';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('最终得分元数据字段')
			.setDesc('计算完成后，将总经验值写入该 YAML 字段。')
			.addText(text => text
				.setPlaceholder('经验值')
				.setValue(this.plugin.settings.finalScoreField)
				.onChange(async (value) => {
					this.plugin.settings.finalScoreField = value || '经验值';
					await this.plugin.saveSettings();
				}));
	}
}
