import { connect } from 'react-redux';
import Main from 'calypso/components/main';
import BodySectionCssClass from 'calypso/layout/body-section-css-class';
import { getSelectedDomain } from 'calypso/lib/domains';
import { getCurrentRoute } from 'calypso/state/selectors/get-current-route';
import isDomainOnlySite from 'calypso/state/selectors/is-domain-only-site';
import SettingsHeader from './settings-header';
import { SettingsPageProps } from './types';

const Settings = ( props: SettingsPageProps ): JSX.Element => {
	const domain = props.domains && getSelectedDomain( props );

	return (
		<Main wideLayout>
			<BodySectionCssClass bodyClass={ [ 'edit__body-white' ] } />
			<SettingsHeader domain={ domain } />
			Page goes here.
		</Main>
	);
};

export default connect( ( state, ownProps: SettingsPageProps ) => {
	return {
		currentRoute: getCurrentRoute( state ),
		hasDomainOnlySite: isDomainOnlySite( state, ownProps.selectedSite!.ID ),
	};
} )( Settings );
