import { isEnabled } from '@automattic/calypso-config';
import DesignPicker, {
	FeaturedPicksButtons,
	isBlankCanvasDesign,
	getDesignUrl,
	useCategorization,
} from '@automattic/design-picker';
import { englishLocales } from '@automattic/i18n-utils';
import { shuffle } from '@automattic/js-utils';
import { useViewportMatch } from '@wordpress/compose';
import classnames from 'classnames';
import { getLocaleSlug, useTranslate } from 'i18n-calypso';
import page from 'page';
import PropTypes from 'prop-types';
import { useEffect, useLayoutEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormattedHeader from 'calypso/components/formatted-header';
import WebPreview from 'calypso/components/web-preview';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import StepWrapper from 'calypso/signup/step-wrapper';
import { getStepUrl } from 'calypso/signup/utils';
import { isUserLoggedIn } from 'calypso/state/current-user/selectors';
import { saveSignupStep, submitSignupStep } from 'calypso/state/signup/progress/actions';
import { getRecommendedThemes as fetchRecommendedThemes } from 'calypso/state/themes/actions';
import { getRecommendedThemes } from 'calypso/state/themes/selectors';
import DIFMThemes from '../difm-design-picker/themes';
import PreviewToolbar from './preview-toolbar';
import './style.scss';

// Ideally this data should come from the themes API, maybe by a tag that's applied to
// themes? e.g. `link-in-bio` or `no-fold`
const STATIC_PREVIEWS = [ 'bantry', 'sigler', 'miller', 'pollard', 'paxton', 'jones', 'baker' ];

export default function DesignPickerStep( props ) {
	const { flowName, stepName, isReskinned, queryParams, showDesignPickerCategories } = props;

	// In order to show designs with a "featured" term in the theme_picks taxonomy at the below of categories filter
	const useFeaturedPicksButtons =
		showDesignPickerCategories && isEnabled( 'signup/design-picker-use-featured-picks-buttons' );

	const dispatch = useDispatch();
	const translate = useTranslate();

	const [ selectedDesign, setSelectedDesign ] = useState( null );
	const scrollTop = useRef( 0 );

	const apiThemes = useSelector( ( state ) =>
		getRecommendedThemes( state, 'auto-loading-homepage' )
	);

	const themesToBeTransformed = props.useDIFMThemes ? DIFMThemes : apiThemes;

	useEffect(
		() => {
			dispatch( saveSignupStep( { stepName: props.stepName } ) );
			if ( ! themesToBeTransformed.length ) {
				dispatch( fetchRecommendedThemes( 'auto-loading-homepage' ) );
			}
		},
		// Ignoring dependencies because we only want these actions to run on first mount
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	// Update Scroll position when section changes
	useLayoutEffect( () => {
		let timeoutID;
		if ( props.stepSectionName ) {
			scrollTop.current = document.scrollingElement.scrollTop;
		} else {
			// Defer restore scroll position to ensure DesignPicker is rendered
			timeoutID = window.setTimeout( () => {
				document.scrollingElement.scrollTop = scrollTop.current;
			} );
		}

		return () => {
			timeoutID && window.clearTimeout( timeoutID );
		};
	}, [ props.stepSectionName ] );

	const userLoggedIn = useSelector( isUserLoggedIn );

	const { designs, featuredPicksDesigns } = useMemo( () => {
		// TODO fetching and filtering code should be pulled to a shared place that's usable by both
		// `/start` and `/new` onboarding flows. Or perhaps fetching should be done within the <DesignPicker>
		// component itself. The `/new` environment needs helpers for making authenticated requests to
		// the theme API before we can do this.
		const allThemes = themesToBeTransformed.map( ( { id, name, taxonomies } ) => {
			// Designs use a "featured" term in the theme_picks taxonomy. For example: Blank Canvas
			const isFeaturedPicks = !! taxonomies?.theme_picks?.find(
				( { slug } ) => slug === 'featured'
			);

			return {
				categories: taxonomies?.theme_subject ?? [],
				// Designs in order to appear prominently in theme galleries.
				showFirst: isFeaturedPicks,
				features: [],
				is_premium: false,
				// Designs in order to appear at the below of the theme categories.
				is_featured_picks: isFeaturedPicks,
				slug: id,
				template: id,
				theme: id,
				title: name,
				...( STATIC_PREVIEWS.includes( id ) && { preview: 'static' } ),
			};
		} );

		return {
			designs: shuffle( allThemes.filter( ( theme ) => ! theme.is_featured_picks ) ),
			featuredPicksDesigns: allThemes.filter( ( theme ) => theme.is_featured_picks ),
		};
	}, [ themesToBeTransformed ] );

	// Update the selected design when the section changes
	useEffect( () => {
		setSelectedDesign( designs.find( ( { theme } ) => theme === props.stepSectionName ) );
	}, [ designs, props.stepSectionName, setSelectedDesign ] );

	const categorization = useCategorization( designs, {
		showAllFilter: props.showDesignPickerCategoriesAllFilter,
		defaultSelection: props.signupDependencies.intent === 'write' ? 'blog' : null,
		sort: sortBlogToTop,
	} );

	function pickDesign( _selectedDesign ) {
		// Design picker preview will submit the defaultDependencies via next button,
		// So only do this when the user picks the design directly
		dispatch(
			submitSignupStep(
				{
					stepName: props.stepName,
				},
				{
					selectedDesign: _selectedDesign,
					selectedSiteCategory: categorization.selection,
				}
			)
		);

		submitDesign( _selectedDesign );
	}

	function previewDesign( _selectedDesign ) {
		const locale = ! userLoggedIn ? getLocaleSlug() : '';

		recordTracksEvent( 'calypso_signup_design_preview_select', {
			theme: `pub/${ _selectedDesign.theme }`,
			template: _selectedDesign.template,
			flow: props.flowName,
			intent: props.signupDependencies.intent,
		} );
		page(
			getStepUrl( props.flowName, props.stepName, _selectedDesign.theme, locale, queryParams )
		);
	}

	function submitDesign( _selectedDesign = selectedDesign ) {
		recordTracksEvent( 'calypso_signup_select_design', {
			theme: `pub/${ _selectedDesign?.theme }`,
			template: _selectedDesign?.template,
			flow: props.flowName,
			intent: props.signupDependencies.intent,
		} );

		props.goToNextStep();
	}

	function renderDesignPicker() {
		return (
			<DesignPicker
				designs={ useFeaturedPicksButtons ? designs : [ ...featuredPicksDesigns, ...designs ] }
				theme={ isReskinned ? 'light' : 'dark' }
				locale={ translate.localeSlug }
				onSelect={ pickDesign }
				onPreview={ previewDesign }
				className={ classnames( {
					'design-picker-step__has-categories': showDesignPickerCategories,
				} ) }
				highResThumbnails
				categorization={ showDesignPickerCategories ? categorization : undefined }
				categoriesHeading={
					<FormattedHeader
						id={ 'step-header' }
						headerText={ headerText() }
						subHeaderText={ subHeaderText() }
						align="left"
					/>
				}
				categoriesFooter={
					useFeaturedPicksButtons && (
						<FeaturedPicksButtons designs={ featuredPicksDesigns } onSelect={ pickDesign } />
					)
				}
			/>
		);
	}

	function renderDesignPreview() {
		const {
			signupDependencies: { siteSlug, siteTitle, intent },
			hideExternalPreview,
		} = props;

		const previewUrl = getDesignUrl( selectedDesign, translate.localeSlug, {
			iframe: true,
			// If the user fills out the site title with write intent, we show it on the design preview
			// Otherwise, use the title of selected design directly
			site_title: intent === 'write' && siteTitle ? siteTitle : selectedDesign?.title,
		} );

		return (
			<WebPreview
				className="design-picker__web-preview"
				showPreview
				isContentOnly
				showClose={ false }
				showEdit={ false }
				externalUrl={ siteSlug }
				showExternal={ ! hideExternalPreview }
				previewUrl={ previewUrl }
				loadingMessage={ translate( '{{strong}}One moment, please…{{/strong}} loading your site.', {
					components: { strong: <strong /> },
				} ) }
				toolbarComponent={ PreviewToolbar }
			/>
		);
	}

	function headerText() {
		if ( showDesignPickerCategories ) {
			return translate( 'Themes' );
		}

		return translate( 'Choose a design' );
	}

	function subHeaderText() {
		if ( ! showDesignPickerCategories ) {
			return translate(
				'Pick your favorite homepage layout. You can customize or change it later.'
			);
		}

		const text = translate( 'Choose a starting theme. You can change it later.' );

		if ( englishLocales.includes( translate.localeSlug ) ) {
			// An English only trick so the line wraps between sentences.
			return text
				.replace( /\s/g, '\xa0' ) // Replace all spaces with non-breaking spaces
				.replace( /\.\s/g, '. ' ); // Replace all spaces at the end of sentences with a regular breaking space
		}

		return text;
	}

	function skipLabelText() {
		const { signupDependencies } = props;

		if ( signupDependencies?.intent === 'write' ) {
			return translate( 'Skip and draft first post' );
		}

		// Fall back to the default skip label used by <StepWrapper>
		return undefined;
	}

	const isMobile = useViewportMatch( 'small', '<' );

	if ( selectedDesign ) {
		const isBlankCanvas = isBlankCanvasDesign( selectedDesign );
		const designTitle = isBlankCanvas ? translate( 'Blank Canvas' ) : selectedDesign.title;
		const defaultDependencies = { selectedDesign };
		const locale = ! userLoggedIn ? getLocaleSlug() : '';

		return (
			<StepWrapper
				{ ...props }
				className="design-picker__preview"
				fallbackHeaderText={ designTitle }
				headerText={ designTitle }
				fallbackSubHeaderText={ '' }
				subHeaderText={ '' }
				stepContent={ renderDesignPreview() }
				align={ isMobile ? 'left' : 'center' }
				hideSkip
				hideNext={ false }
				nextLabelText={ translate( 'Start with %(designTitle)s', {
					args: { designTitle },
				} ) }
				defaultDependencies={ defaultDependencies }
				backUrl={ getStepUrl( flowName, stepName, '', locale, queryParams ) }
				goToNextStep={ submitDesign }
				stepSectionName={ designTitle }
			/>
		);
	}

	const headerProps = showDesignPickerCategories
		? { hideFormattedHeader: true }
		: {
				fallbackHeaderText: headerText(),
				headerText: headerText(),
				fallbackSubHeaderText: subHeaderText(),
				subHeaderText: subHeaderText(),
		  };

	return (
		<StepWrapper
			{ ...props }
			className={ classnames( {
				'design-picker__has-categories': showDesignPickerCategories,
			} ) }
			{ ...headerProps }
			stepContent={ renderDesignPicker() }
			align={ isReskinned ? 'left' : 'center' }
			skipButtonAlign={ isReskinned ? 'top' : 'bottom' }
			skipLabelText={ skipLabelText() }
		/>
	);
}

DesignPickerStep.propTypes = {
	goToNextStep: PropTypes.func.isRequired,
	signupDependencies: PropTypes.object.isRequired,
	stepName: PropTypes.string.isRequired,
};

// Ensures Blog category appears at the top of the design category list
// (directly below the All Themes category).
function sortBlogToTop( a, b ) {
	if ( a.slug === b.slug ) {
		return 0;
	} else if ( a.slug === 'blog' ) {
		return -1;
	} else if ( b.slug === 'blog' ) {
		return 1;
	}
	return 0;
}
