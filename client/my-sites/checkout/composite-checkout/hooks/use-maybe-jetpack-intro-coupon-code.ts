import { isJetpackSearch } from '@automattic/calypso-products';
import { useMemo } from 'react';
import type { RequestCartProduct } from '@automattic/shopping-cart';

const JETPACK_SEARCH_INTRO_COUPON_CODE = 'FIRSTYEAR50';

const isYearly = ( product: RequestCartProduct ) => ! product.product_slug.endsWith( '_monthly' );
const isNewPurchase = ( product: RequestCartProduct ) => product.extra.purchaseType !== 'renewal';

// **NOTE**: This hook can be safely deleted when we no longer need to
// rely on auto-applied coupons for introductory new purchase pricing.
const useMaybeJetpackIntroCouponCode = (
	products: RequestCartProduct[],
	isCouponApplied: boolean
): string | undefined => {
	return useMemo( () => {
		// If a coupon is already applied to this cart, don't try to apply another one.
		if ( isCouponApplied ) {
			return undefined;
		}

		const isEligibleForFirstYear50 = products.filter(
			( product ) => isNewPurchase( product ) && isYearly( product ) && isJetpackSearch( product )
		);

		if ( isEligibleForFirstYear50 ) {
			return JETPACK_SEARCH_INTRO_COUPON_CODE;
		}

		return undefined;
	}, [ products, isCouponApplied ] );
};

export default useMaybeJetpackIntroCouponCode;
