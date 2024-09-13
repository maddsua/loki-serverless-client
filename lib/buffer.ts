import type { LokiStream, LokiValue } from "./rest";

export interface LogEntry {
	labels: Record<string, string>;
	date: Date;
	message: string;
	metadata?: Record<string, string>;
};

export class LogBuffer {

	private m_entries: LogEntry[];
	private m_labels: Record<string, string>;

	constructor(labels?: Record<string, string>) {
		this.m_entries = [];
		this.m_labels = labels || {};
	}

	push = (message: string, labels?: Record<string, string>) => this.m_entries.push({
		message,
		labels: labels || {},
		date: new Date()
	});

	pushEntry = (entry: LogEntry) => this.m_entries.push(entry);

	collect = (): LokiStream[] => {

		const labelSets = new Map<string, LogEntry[]>();

		for (const item of this.m_entries) {

			const labelKey = Object.entries(item.labels)
				.map(([label, value]) => `${label}=${value}`).join(';');

			const set = labelSets.get(labelKey);

			if (!set?.length) {
				labelSets.set(labelKey, [item]);
				continue;
			}

			labelSets.set(labelKey, set.concat(item));
		}

		return Array.from(labelSets.entries()).map(([_, entries]) => ({
			stream: Object.assign({}, this.m_labels, entries[0].labels),
			values: entries.map(item => transformEntry(item))
		}));
	}

	isEmpty = (): boolean => !this.m_entries.length;

};

export const transformEntry = (entry: LogEntry): LokiValue => (entry.metadata ?
	[ `${entry.date.getTime() * 1000000}`, entry.message, entry.metadata ] :
	[ `${entry.date.getTime() * 1000000}`, entry.message ]
);
