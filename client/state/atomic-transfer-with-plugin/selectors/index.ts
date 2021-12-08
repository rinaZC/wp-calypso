import { get } from 'lodash';
import type { AppState } from 'calypso/types';

export function getAtomicInstallStatus( state: AppState, siteId: number | null ): any {
	return get( state, [ 'softwareInstall', siteId ?? 0 ], {} );
}

export function getAtomicInstallWithTransferStatus( state: AppState, siteId: number | null ): any {
	return get( state, [ 'softwareInstallWithTransfer', siteId ?? 0 ], {} );
}
