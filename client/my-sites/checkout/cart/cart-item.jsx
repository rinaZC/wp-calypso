import {
	isCredits,
	isGSuiteOrExtraLicenseOrGoogleWorkspace,
	isTheme,
	isMonthly,
	isYearly,
	isBiennially,
	isPlan,
	isBundled,
	isDomainProduct,
	calculateMonthlyPriceForPlan,
	getBillingMonthsForPlan,
} from '@automattic/calypso-products';
import { Gridicon } from '@automattic/components';
import { getCurrencyObject } from '@automattic/format-currency';
import { withShoppingCart } from '@automattic/shopping-cart';
import { localize } from 'i18n-calypso';
import { get } from 'lodash';
import { Component } from 'react';
import { withLocalizedMoment } from 'calypso/components/localized-moment';
import { gaRecordEvent } from 'calypso/lib/analytics/ga';
import { canRemoveFromCart } from 'calypso/lib/cart-values';
import { isGSuiteOrGoogleWorkspaceProductSlug } from 'calypso/lib/gsuite';
import {
	GOOGLE_WORKSPACE_BUSINESS_STARTER_YEARLY,
	GSUITE_BASIC_SLUG,
	GSUITE_BUSINESS_SLUG,
} from 'calypso/lib/gsuite/constants';
import withCartKey from 'calypso/my-sites/checkout/with-cart-key';

export class CartItem extends Component {
	removeFromCart = ( event ) => {
		event.preventDefault();
		gaRecordEvent(
			'Upgrades',
			'Clicked Remove From Cart Icon',
			'Product ID',
			this.props.cartItem.product_id
		);
		this.props.shoppingCartManager.removeProductFromCart( this.props.cartItem.uuid );
	};

	price() {
		const { cart, cartItem, translate } = this.props;

		if ( typeof cartItem.cost === 'undefined' ) {
			return translate( 'Loading price' );
		}

		if ( cartItem.free_trial ) {
			return this.getFreeTrialPrice();
		}

		if ( isBundled( cartItem ) && cartItem.cost === 0 ) {
			return this.getDomainPlanPrice( cartItem );
		}

		if ( 0 === cartItem.cost * cartItem.volume ) {
			return <span className="cart__free-text">{ translate( 'Free' ) }</span>;
		}

		if ( isGSuiteOrGoogleWorkspaceProductSlug( cartItem.product_slug ) ) {
			const {
				cost_before_coupon: costPerProductBeforeCoupon,
				is_sale_coupon_applied: isSaleCouponApplied,
				item_subtotal_display: cost,
			} = cartItem;
			const costBeforeCoupon = costPerProductBeforeCoupon * cartItem.volume;

			if ( isSaleCouponApplied ) {
				const { is_coupon_applied: isCouponApplied } = cart;

				return (
					<div className="cart__gsuite-discount">
						<span className="cart__gsuite-discount-regular-price">{ costBeforeCoupon }</span>

						<span className="cart__gsuite-discount-discounted-price">{ cost }</span>

						<span className="cart__gsuite-discount-text">
							{ isCouponApplied
								? translate( 'Discounts applied' )
								: translate( 'Discount for first year' ) }
						</span>
					</div>
				);
			}
		}

		return cartItem.item_subtotal_display;
	}

	monthlyPrice() {
		const { cartItem, translate } = this.props;
		const { currency } = cartItem;

		if ( ! this.monthlyPriceApplies() ) {
			return null;
		}

		const { months, monthlyPrice } = this.calcMonthlyBillingDetails();
		const price = getCurrencyObject( monthlyPrice, currency );

		return translate( '(%(monthlyPrice)s %(currency)s x %(months)d months)', {
			args: {
				months,
				currency,
				monthlyPrice: `${ price.integer }${
					monthlyPrice - price.integer > 0 ? price.fraction : ''
				}`,
			},
		} );
	}

	monthlyPriceApplies() {
		const { cartItem } = this.props;
		const { cost } = cartItem;

		if ( ! isPlan( cartItem ) ) {
			return false;
		}

		if ( isMonthly( cartItem ) ) {
			return false;
		}

		const hasValidPrice = typeof cost !== 'undefined' && cost > 0;
		if ( ! hasValidPrice ) {
			return false;
		}

		return true;
	}

	calcMonthlyBillingDetails() {
		const { cost, product_slug } = this.props.cartItem;
		return {
			monthlyPrice: calculateMonthlyPriceForPlan( product_slug, cost ),
			months: getBillingMonthsForPlan( product_slug ),
		};
	}

	getDomainPlanPrice( cartItem ) {
		const { translate } = this.props;

		if ( cartItem && cartItem.product_cost ) {
			return (
				<span>
					<span className="cart__free-with-plan">
						{ cartItem.product_cost } { cartItem.currency }
					</span>
					<span className="cart__free-text">{ translate( 'First year free with your plan' ) }</span>
				</span>
			);
		}

		return <em>{ translate( 'First year free with your plan' ) }</em>;
	}

	getFreeTrialPrice() {
		const freeTrialText = this.props.translate( 'Free %(days)s Day Trial', {
			args: { days: '14' },
		} );

		return <span>{ freeTrialText }</span>;
	}

	getProductInfo() {
		const { cartItem, selectedSite } = this.props;
		const domain =
			cartItem.meta ||
			get( cartItem, 'extra.domain_to_bundle' ) ||
			( selectedSite && selectedSite.domain );
		let info = null;

		if ( isGSuiteOrExtraLicenseOrGoogleWorkspace( cartItem ) && cartItem.extra.google_apps_users ) {
			info = cartItem.extra.google_apps_users.map( ( user ) => (
				<div key={ `user-${ user.email }` }>{ user.email }</div>
			) );
		} else if ( isCredits( cartItem ) ) {
			info = null;
		} else if ( isTheme( cartItem ) ) {
			info = selectedSite && selectedSite.domain;
		} else {
			info = domain;
		}
		return info;
	}

	getDomainRenewalExpiryDate() {
		const { cartItem } = this.props;

		return (
			get( cartItem, 'is_domain_registration' ) &&
			get( cartItem, 'is_renewal' ) &&
			get( cartItem, 'domain_post_renewal_expiration_date' )
		);
	}

	renderDomainRenewalExpiryDate() {
		const domainRenewalExpiryDate = this.getDomainRenewalExpiryDate();

		if ( ! domainRenewalExpiryDate ) {
			return null;
		}

		const { moment, translate } = this.props;
		const domainRenewalExpiryDateText = translate( 'Renew until %(renewalDate)s', {
			args: {
				renewalDate: moment( domainRenewalExpiryDate ).format( 'LL' ),
			},
		} );

		/*eslint-disable wpcalypso/jsx-classname-namespace*/
		return <span className="product-domain-renewal-date">{ domainRenewalExpiryDateText }</span>;
		/*eslint-enable wpcalypso/jsx-classname-namespace*/
	}

	render() {
		const { cartItem, translate } = this.props;

		let name = this.getProductName();
		const subscriptionLength = this.getSubscriptionLength();
		if ( subscriptionLength ) {
			name += ' - ' + subscriptionLength;
		}

		if ( isTheme( cartItem ) ) {
			name += ' - ' + translate( 'never expires' );
		}

		if ( isDomainProduct( cartItem ) && cartItem?.extra?.premium ) {
			name = translate( 'Premium' ) + ' ' + name;
		}

		/*eslint-disable wpcalypso/jsx-classname-namespace*/
		return (
			<li className="cart-item">
				<div className="primary-details">
					<span className="product-name" data-e2e-product-slug={ cartItem.product_slug }>
						{ name || translate( 'Loading…' ) }
					</span>
					<span className="product-domain">{ this.getProductInfo() }</span>
					{ this.renderDomainRenewalExpiryDate() }
				</div>

				<div className="secondary-details">
					<span className="product-price">{ this.price() }</span>
					<span className="product-monthly-price">{ this.monthlyPrice() }</span>
					{ this.removeButton() }
				</div>
			</li>
		);
		/*eslint-enable wpcalypso/jsx-classname-namespace*/
	}

	getSubscriptionLength() {
		const { cartItem, translate } = this.props;
		if ( this.isDomainProductDiscountedTo0() ) {
			return false;
		}

		const hasBillPeriod = cartItem.bill_period && parseInt( cartItem.bill_period ) !== -1;
		if ( ! hasBillPeriod ) {
			return false;
		}

		if ( isMonthly( cartItem ) ) {
			return translate( 'monthly subscription' );
		} else if ( isYearly( cartItem ) ) {
			return translate( 'annual subscription' );
		} else if ( isBiennially( cartItem ) ) {
			return translate( 'two year subscription' );
		}

		return false;
	}

	isDomainProductDiscountedTo0() {
		const { cartItem } = this.props;
		return isDomainProduct( cartItem ) && isBundled( cartItem ) && cartItem.cost === 0;
	}

	getProductName() {
		const { cartItem, translate } = this.props;
		const options = {
			count: cartItem.volume,
			args: {
				volume: cartItem.volume,
				productName: cartItem.product_name,
			},
		};

		if ( ! cartItem.volume ) {
			return cartItem.product_name;
		} else if ( cartItem.volume === 1 ) {
			switch ( cartItem.product_slug ) {
				case GOOGLE_WORKSPACE_BUSINESS_STARTER_YEARLY:
				case GSUITE_BASIC_SLUG:
				case GSUITE_BUSINESS_SLUG:
					return translate( '%(productName)s (1 User)', {
						args: {
							productName: cartItem.product_name,
						},
					} );

				default:
					return cartItem.product_name;
			}
		} else {
			switch ( cartItem.product_slug ) {
				case GOOGLE_WORKSPACE_BUSINESS_STARTER_YEARLY:
				case GSUITE_BASIC_SLUG:
				case GSUITE_BUSINESS_SLUG:
					return translate(
						'%(productName)s (%(volume)s User)',
						'%(productName)s (%(volume)s Users)',
						options
					);

				default:
					return translate(
						'%(productName)s (%(volume)s Item)',
						'%(productName)s (%(volume)s Items)',
						options
					);
			}
		}
	}

	removeButton() {
		const { cart, cartItem, translate } = this.props;
		const labelText = translate( 'Remove item' );

		if ( canRemoveFromCart( cart, cartItem ) ) {
			return (
				<button
					className="cart__remove-item"
					onClick={ this.removeFromCart }
					aria-label={ labelText }
					title={ labelText }
				>
					<Gridicon icon="trash" size={ 24 } />
				</button>
			);
		}
	}
}

export default withCartKey( withShoppingCart( localize( withLocalizedMoment( CartItem ) ) ) );
