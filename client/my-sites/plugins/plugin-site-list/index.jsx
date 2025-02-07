import classNames from 'classnames';
import { useTranslate } from 'i18n-calypso';
import { compact } from 'lodash';
import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import PluginSite from 'calypso/my-sites/plugins/plugin-site/plugin-site';
import { siteObjectsToSiteIds } from 'calypso/my-sites/plugins/utils';
import {
	getPluginOnSites,
	getSiteObjectsWithPlugin,
} from 'calypso/state/plugins/installed/selectors';
import getNetworkSites from 'calypso/state/selectors/get-network-sites';
import isConnectedSecondaryNetworkSite from 'calypso/state/selectors/is-connected-secondary-network-site';

import './style.scss';

const PluginSiteList = ( props ) => {
	const translate = useTranslate();
	const siteIds = siteObjectsToSiteIds( props.sites );
	const sitesWithPlugin = useSelector( ( state ) =>
		getSiteObjectsWithPlugin( state, siteIds, props.plugin.slug )
	);
	const sitesWithSecondarySites = useSelector( ( state ) =>
		getSitesWithSecondarySites( state, props.sites )
	);
	const pluginsOnSites = useSelector( ( state ) =>
		getPluginOnSites( state, siteIds, props.plugin.slug )
	);

	const getSecondaryPluginSites = useCallback(
		( site, secondarySites ) => {
			const pluginsOnSite = pluginsOnSites?.sites[ site.ID ];
			const secondarySitesWithPlugin = sitesWithPlugin.filter(
				( siteWithPlugin ) =>
					secondarySites && secondarySites.some( ( secSite ) => secSite.ID === siteWithPlugin.ID )
			);
			const secondaryPluginSites = pluginsOnSite ? secondarySitesWithPlugin : secondarySites;

			return compact( secondaryPluginSites );
		},
		[ pluginsOnSites, sitesWithPlugin ]
	);

	if ( ! props.sites || props.sites.length === 0 ) {
		return null;
	}
	return (
		<div className={ classNames( 'plugin-site-list', props.className ) }>
			<div className={ classNames( 'plugin-site-list__title', { primary: props.titlePrimary } ) }>
				{ props.title }
			</div>
			<div className="plugin-site-list__content">
				<div className="plugin-site-list__header">
					<div className="plugin-site-list__header-title domain">{ translate( 'Domain' ) }</div>
					{ props.showAdditionalHeaders && (
						<>
							<div className="plugin-site-list__header-title">{ translate( 'Active' ) }</div>
							<div className="plugin-site-list__header-title">{ translate( 'Autoupdates' ) }</div>
							<div className="plugin-site-list__header-title empty" />
						</>
					) }
				</div>

				{ sitesWithSecondarySites.map( ( { site, secondarySites } ) => (
					<PluginSite
						key={ 'pluginSite' + site.ID }
						site={ site }
						secondarySites={ getSecondaryPluginSites( site, secondarySites ) }
						plugin={ props.plugin }
						wporg={ props.wporg }
					/>
				) ) }
			</div>
		</div>
	);
};

PluginSiteList.propTypes = {
	plugin: PropTypes.object,
	sites: PropTypes.array,
	sitesWithSecondarySites: PropTypes.array,
	title: PropTypes.string,
};

// TODO: make this memoized after sites-list is removed and `sites` comes from Redux
function getSitesWithSecondarySites( state, sites ) {
	return sites
		.filter( ( site ) => ! isConnectedSecondaryNetworkSite( state, site.ID ) )
		.map( ( site ) => ( {
			site,
			secondarySites: getNetworkSites( state, site.ID ),
		} ) );
}

export default PluginSiteList;
