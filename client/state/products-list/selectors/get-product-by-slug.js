import { get } from 'lodash';

import 'calypso/state/products-list/init';

/**
 * Retrieves the product with the specified slug.
 *
 * @param {object} state - global state tree
 * @param {string} productSlug - internal product slug, eg 'jetpack_premium'
 * @returns {import('./get-products-list').ProductListItem|null} the corresponding product, or null if not found
 */
export function getProductBySlug( state, productSlug ) {
	return get( state, [ 'productsList', 'items', productSlug ], null );
}
