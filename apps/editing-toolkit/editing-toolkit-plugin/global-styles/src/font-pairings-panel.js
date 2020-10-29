/**
 * External dependencies
 */
import { ENTER } from '@wordpress/keycodes';
import classnames from 'classnames';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import NoSupport from './no-support';
import { getFontTitle } from '../../../../../client/landing/gutenboarding/constants';

export default ( { fontPairings, fontBase, fontHeadings, update } ) => {
	return (
		<>
			<h3>{ __( 'Font Pairings', 'full-site-editing' ) }</h3>
			{ fontPairings && fontHeadings && fontBase ? (
				<div className="style-preview__font-options">
					<div className="style-preview__font-options-desktop">
						{ fontPairings.map( ( { label, headings, base, preview } ) => {
							const isSelected = headings === fontHeadings && base === fontBase;
							const classes = classnames( 'font-pairings-panel', {
								'is-selected': isSelected,
							} );
							return (
								<Button
									className={ classnames( 'style-preview__font-option', {
										'is-selected': isSelected,
									} ) }
									onClick={ () => update( { headings, base } ) }
									onKeyDown={ ( event ) =>
										event.keyCode === ENTER ? update( { headings, base } ) : null
									}
									key={ label }
								>
									<span className="style-preview__font-option-contents">
										<span style={ { fontFamily: headings, fontWeight: 700 } }>
											{ getFontTitle( headings ) }
										</span>
										&nbsp;/&nbsp;
										<span style={ { fontFamily: base } }>{ getFontTitle( base ) }</span>
									</span>
								</Button>
							);
						} ) }
					</div>
				</div>
			) : (
				<NoSupport unsupportedFeature={ __( 'font pairings', 'full-site-editing' ) } />
			) }
		</>
	);
};
