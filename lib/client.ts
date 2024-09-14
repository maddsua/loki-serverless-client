import { LogBuffer, transformEntry, type LogEntry } from "./buffer.js";
import { LokiConsole } from "./console.js";
import { postEntries, type Credentials } from "./rest.js";

export interface LokiOptions {
	host: string;
	apiPath?: string;
	proto?: 'http' | 'https';
	token?: string;
	batching?: boolean;
	labels?: Record<string, string>;
	consoleMirroring?: boolean;
};

export class Loki {

	private m_creds: Credentials;
	private m_buffer: LogBuffer | null;
	private m_labels: Record<string, string>;

	constructor(opts: LokiOptions) {

		const remote = new URL(opts.host.includes('://') ?
			opts.host : `${opts.proto || 'https'}://${opts.host}/`);

		remote.pathname = opts.apiPath || '/loki/api/v1/push';

		this.m_creds = { remote, token: opts.token };
		this.m_labels = opts.labels || {};
		this.m_buffer = opts.batching ? new LogBuffer(this.m_labels) : null;

		this.console = new LokiConsole(this, opts.consoleMirroring);
	}

	push = async (entry: LogEntry): Promise<Error | null> => {

		if (this.m_buffer) {
			this.m_buffer.pushEntry(entry);
			return null;
		}

		return await postEntries(this.m_creds, [{
			stream: Object.assign(this.m_labels, entry.labels),
			values: [transformEntry(entry)]
		}]).then(() => null).catch((err: Error) => err);
	};

	flush = async (): Promise<void> => {

		if (!this.m_buffer || this.m_buffer.isEmpty()) {
			return;
		}

		await postEntries(this.m_creds, this.m_buffer.collect());
	};

	console: LokiConsole;
};
