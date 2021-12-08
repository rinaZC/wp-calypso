import { ATOMIC_PLUGIN_INSTALL_REQUEST_TRANSFER_STATUS } from 'calypso/state/action-types';
import { setAtomicTransferStatus } from 'calypso/state/atomic-transfer-with-plugin/actions';
import { registerHandlers } from 'calypso/state/data-layer/handler-registry';
import { http } from 'calypso/state/data-layer/wpcom-http/actions';
import { dispatchRequest } from 'calypso/state/data-layer/wpcom-http/utils';

const requestTransferToAtomicStatus = ( action ) =>
	http(
		{
			apiNamespace: 'wpcom/v2',
			method: 'GET',
			path: `/sites/${ action.siteId }/atomic/transfers/latest`,
		},
		action
	);

export const receiveError = ( action, { error } ) => {
	setAtomicTransferStatus( action.siteId, action.softwareSet, error );
};

export const receiveResponse = ( action, { success } ) => {
	setAtomicTransferStatus( action.siteId, action.softwareSet, success.status );
};

registerHandlers( 'state/data-layer/wpcom/sites/atomic-transfers/status', {
	[ ATOMIC_PLUGIN_INSTALL_REQUEST_TRANSFER_STATUS ]: [
		dispatchRequest( {
			fetch: requestTransferToAtomicStatus,
			onSuccess: receiveResponse,
			onError: receiveError,
		} ),
	],
} );
