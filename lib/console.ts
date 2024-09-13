
import type { Loki } from "./client";

export type LogLevel = 'info' | 'log' | 'warn' | 'error' | 'debug';

export class LokiConsole {

	private m_loki: Loki;
	private m_mirror: boolean;

	constructor(loki: Loki, mirror?: boolean) {
		this.m_loki = loki;
		this.m_mirror = !!mirror;
	}

	private push = (content: any[], level: LogLevel) => {

		this.m_loki.push({
			date: new Date(),
			labels: { type: 'log', level, },
			message: stringifyContent(content),
		});

		if (this.m_mirror) {
			const logFn = console[level];
			if (typeof logFn === 'function') {
				logFn(...content);
			}
		}
	};

	info = (...args: any[]): void => this.push(args, 'info');
	log = (...args: any[]): void => this.push(args, 'log');
	warn = (...args: any[]): void => this.push(args, 'warn');
	error = (...args: any[]): void => this.push(args, 'error');
	debug = (...args: any[]): void => this.push(args, 'debug');
};

const stringifyContent = (items: any[]): string => {
	return items.map(item => stringifyItem(item))
		.filter(item => item.length).join(' ');
};

const stringifyItem = (item: any): string => {

	switch (typeof item) {
		case 'string': return item;
		case 'number': return item.toString();
		case 'bigint': return item.toString();
		case 'boolean': return item ? 'true' : 'false';
		case 'object': return serializeObject(item);
	}

	return '[unsupported value]';
};

const serializeObject = (item: object): string => {

	const unwrapped = unwrapObject(item);
	if (unwrapped) {
		return unwrapped;
	}

	try {
		return JSON.stringify(item);
	} catch (_) {
		return '[unsupported object value]';
	}

};

const unwrapObject = (item: object): string | null => {

	try {

		if (item instanceof Error) {
			return `Error: ${item.message}`;
		}
	
		if (item instanceof Set) {
			return Array.from(item.keys()).join(', ');
		}
	
		if (item instanceof Map) {
			return JSON.stringify(Array.from(item.entries()));
		}
	
		if (item instanceof RegExp) {
			return item.source;
		}

		if (item instanceof FormData) {
			return JSON.stringify(Object.fromEntries(item));
		}

	} catch (_) {
		return null;
	}

	return null;
};
