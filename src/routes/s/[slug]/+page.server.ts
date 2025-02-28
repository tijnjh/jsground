import type { PageServerLoad } from './$types';

import { decode } from '$lib/sharing';

export const load: PageServerLoad = ({ params }: any) => {
	return {
		code: decode(params.slug)
	};
};
