import * as fflate from 'fflate';

export function encode(str: string) {
	const compressed = fflate.strToU8(str.trim());
	const deflated = fflate.deflateSync(compressed);
	const base64Compressed = btoa(String.fromCharCode.apply(null, deflated))
		.replace(/=/g, '')
		.replace(/\+/g, '~')
		.replace(/\//g, '_');

	return base64Compressed;
}

export function decode(encoded: string) {
	let base64String = encoded.replace(/~/g, '+').replace(/_/g, '/');

	const paddingLength = (4 - (base64String.length % 4)) % 4;
	base64String += '='.repeat(paddingLength);

	const deflated = Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0));

	try {
		const decompressed = fflate.inflateSync(deflated);
		const str = fflate.strFromU8(decompressed);
		return str;
	} catch (error) {
		console.error('Decompression error:', error);
		return 'Error: Could not decompress data';
	}
}
