export interface Credentials {
	remote: URL;
	token?: string;
};

export const postEntries = async (creds: Credentials, streams: LokiStream[]): Promise<void> => {

	const headers = new Headers({
		'Content-Type': 'application/json',
	});

	if (creds.token) {
		headers.set('Authorization', `Bearer ${creds.token}`);
	}

	const payload: LokiPushPayload = {
		streams
	};

	const request = new Request(creds.remote, {
		method: 'POST',
		headers,
		body: JSON.stringify(payload)
	});

	const response = await fetch(request).catch(() => null);
	if (!response) {
		throw new Error('Failed to connect to loki: network error');
	}

	if (!response.ok) {

		const errorMessage = await response.text().catch(() => null);
		if (!errorMessage) {
			throw new Error('Failed to push logs: unknown error');
		}

		throw new Error(errorMessage);
	}
};

export interface LokiPushPayload {
	streams: LokiStream[];
};

export interface LokiStream {
	stream: LokiStreamLabels;
	values: LokiValue[];
};

export type LokiStreamLabels = Record<string, string>;

export type LokiValue = LokiBasicValue | LokiValueWithMetadata;
export type LokiBasicValue = [string, string];
export type LokiValueWithMetadata = [string, string, Record<string, string>];
