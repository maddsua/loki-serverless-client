
import type { Loki } from "./client";

export type LogLevel = 'info' | 'log' | 'warn' | 'error' | 'debug';

export class LokiConsole {

	private parent: Loki;

	constructor(loki: Loki) {
		this.parent = loki;
	}

	private push = (content: any[], level: LogLevel) => {
		this.parent.push({
			date: new Date(),
			labels: { type: 'log', level, },
			message: stringifyContent(content),
		});
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
	}

	try {

		if (item instanceof Error) {
			return item.message;
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

		return JSON.stringify(item);
		
	} catch (error) {
		return '[unsupported value]';
	}
};
