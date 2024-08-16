import { LogBuffer, LogEntry, transformEntry } from "./buffer";
import { postEntries, type Credentials } from "./rest";

export interface LokiProps {
	host: string;
	proto?: 'http' | 'https';
	token?: string;
	batching?: boolean;
	labels?: Record<string, string>;
};

export class Loki {

	private m_creds: Credentials;
	private m_buffer: LogBuffer | null;
	private m_labels: Record<string, string>;

	constructor(props: LokiProps) {

		const remote = new URL(props.host.includes('://') ?
			props.host : `${props.proto || 'https'}://${props.host}/`);
		remote.pathname = '/loki/api/v1/push';

		this.m_creds = { remote, token: props.token };
		this.m_buffer = props.batching ? new LogBuffer() : null;
		this.m_labels = props.labels || {};
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
};
