import { isEnabled } from '@automattic/calypso-config';
import { Title } from '@automattic/onboarding';
import React from 'react';
import { connect } from 'react-redux';
import { LoadingEllipsis } from 'calypso/components/loading-ellipsis';
import { Interval, EVERY_FIVE_SECONDS } from 'calypso/lib/interval';
import { decodeURIComponentIfValid } from 'calypso/lib/url';
import StepWrapper from 'calypso/signup/step-wrapper';
import { fetchImporterState } from 'calypso/state/imports/actions';
import {
	getImporterStatusForSiteId,
	isImporterStatusHydrated,
} from 'calypso/state/imports/selectors';
import { canCurrentUser } from 'calypso/state/selectors/can-current-user';
import { getSiteId } from 'calypso/state/sites/selectors';
import { Importer, QueryObject, ImportJob } from './types';
import { getImporterTypeForEngine } from './util';
import WixImporter from './wix';

import './style.scss';

/* eslint-disable wpcalypso/jsx-classname-namespace */

interface Props {
	stepName: string;
	stepSectionName: string;
	queryObject: QueryObject;
	siteId: number;
	siteSlug: string;
	fromSite: string;
	canImport: boolean;
	isImporterStatusHydrated: boolean;
	siteImports: ImportJob[];
	fetchImporterState: ( siteId: number ) => void;
}
const ImportOnboardingFrom: React.FunctionComponent< Props > = ( props ) => {
	const {
		stepSectionName,
		siteId,
		canImport,
		siteSlug,
		siteImports,
		isImporterStatusHydrated,
		fromSite,
	} = props;
	const engine: Importer = stepSectionName.toLowerCase() as Importer;

	/**
	 ↓ Fields
	 */
	function getImportJob( engine: Importer ): ImportJob | undefined {
		return siteImports.find( ( x ) => x.type === getImporterTypeForEngine( engine ) );
	}

	/**
	 ↓ Methods
	 */
	function fetchImporters() {
		siteId && props.fetchImporterState( siteId );
	}

	function isLoading() {
		return ! isImporterStatusHydrated;
	}

	function hasPermission(): boolean {
		return canImport;
	}

	return (
		<>
			<Interval onTick={ fetchImporters } period={ EVERY_FIVE_SECONDS } />

			<StepWrapper
				flowName={ 'import-from' }
				hideSkip={ true }
				hideBack={ true }
				hideNext={ true }
				hideFormattedHeader={ true }
				stepContent={
					<div className="import__onboarding-page import-layout__center">
						<div className="import-layout__center">
							{ ( () => {
								/**
								 * Loading screen
								 */
								if ( isLoading() ) {
									return <LoadingEllipsis />;
								} else if ( ! hasPermission() ) {
									/**
									 * Permission screen
									 */
									return <Title>You are not authorized to view this page</Title>;
								} else if ( engine === 'wix' && isEnabled( 'gutenboarding/import-from-wix' ) ) {
									/**
									 * Wix importer
									 */
									return (
										<WixImporter
											job={ getImportJob( engine ) }
											siteId={ siteId }
											siteSlug={ siteSlug }
											fromSite={ fromSite }
										/>
									);
								}
							} )() }
						</div>
					</div>
				}
			/>
		</>
	);
};

export default connect(
	( state, props: Props ) => {
		const { queryObject } = props;
		const siteSlug = decodeURIComponentIfValid( queryObject.to );
		const fromSite = decodeURIComponentIfValid( queryObject.from );
		const siteId = getSiteId( state, siteSlug ) as number;

		return {
			siteId,
			siteSlug,
			fromSite,
			siteImports: getImporterStatusForSiteId( state, siteId ),
			isImporterStatusHydrated: isImporterStatusHydrated( state ),
			canImport: canCurrentUser( state, siteId, 'manage_options' ),
		};
	},
	{
		fetchImporterState,
	}
)( ImportOnboardingFrom );
