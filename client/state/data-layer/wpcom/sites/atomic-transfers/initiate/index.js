import { translate } from 'i18n-calypso';
import { ATOMIC_PLUGIN_INSTALL_INITIATE_WITH_TRANSFER } from 'calypso/state/action-types';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { requestAtomicTransferStatus } from 'calypso/state/atomic-transfer-with-plugin/actions';
import { registerHandlers } from 'calypso/state/data-layer/handler-registry';
import { http } from 'calypso/state/data-layer/wpcom-http/actions';
import { dispatchRequest } from 'calypso/state/data-layer/wpcom-http/utils';
import { errorNotice } from 'calypso/state/notices/actions';

const initiateAtomicTransferandInstall = ( action ) =>
	http(
		{
			apiNamespace: 'wpcom/v2',
			method: 'POST',
			path: `/sites/${ action.siteId }/atomic/transfers/`,
			body: {
				software_set: action.softwareSet,
			},
		},
		action
	);

export const receiveError = ( error ) => {
	return [
		recordTracksEvent( 'calypso_atomic_transfer_inititate_failure', {
			context: 'atomic_transfer',
			error: error.error,
		} ),
		errorNotice(
			translate( "Sorry, we've hit a snag. Please contact support so we can help you out." )
		),
	];
};

export const receiveResponse = ( action ) => {
	return [
		recordTracksEvent( 'calypso_atomic_transfer_inititate_success', {
			context: 'atomic_transfer',
		} ),
		requestAtomicTransferStatus( action.siteId ),
	];
};

registerHandlers( 'state/data-layer/wpcom/sites/atomic-transfers/initiate', {
	[ ATOMIC_PLUGIN_INSTALL_INITIATE_WITH_TRANSFER ]: [
		dispatchRequest( {
			fetch: initiateAtomicTransferandInstall,
			onSuccess: receiveResponse,
			onError: receiveError,
		} ),
	],
} );
