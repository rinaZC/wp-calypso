import { withStorageKey } from '@automattic/state-utils';
import {
	ATOMIC_PLUGIN_INSTALL_INITIATE_WITH_TRANSFER,
	ATOMIC_PLUGIN_INSTALL_INITIATE,
	ATOMIC_PLUGIN_INSTALL_REQUEST_TRANSFER_STATUS,
	ATOMIC_PLUGIN_INSTALL_REQUEST_STATUS,
	ATOMIC_PLUGIN_INSTALL_SET_TRANSFER_STATUS,
	ATOMIC_PLUGIN_INSTALL_SET_STATUS,
} from 'calypso/state/action-types';
import { combineReducers, keyedReducer } from 'calypso/state/utils';

function softwareInstall( state = {}, action ) {
	switch ( action.type ) {
		case ATOMIC_PLUGIN_INSTALL_INITIATE:
			return { ...state, ...action.softwareSet };
		case ATOMIC_PLUGIN_INSTALL_REQUEST_STATUS:
			return { ...state, ...action.softwareSet };
		case ATOMIC_PLUGIN_INSTALL_SET_STATUS:
			return { ...state, ...action.softwareSet, ...action.status };
	}
}

function softwareInstallWithTransfer( state = {}, action ) {
	switch ( action.type ) {
		case ATOMIC_PLUGIN_INSTALL_INITIATE_WITH_TRANSFER:
			return { ...state, ...action.softwareSet };
		case ATOMIC_PLUGIN_INSTALL_REQUEST_TRANSFER_STATUS:
			return { ...state, ...action.softwareSet };
		case ATOMIC_PLUGIN_INSTALL_SET_TRANSFER_STATUS:
			return { ...state, ...action.softwareSet, ...action.status };
	}
}

export default combineReducers( {
	softwareInstall: withStorageKey( 'softwareInstall', keyedReducer( 'siteId', softwareInstall ) ),
	softwareInstallWithTransfer: withStorageKey(
		'softwareInstallWithTransfer',
		keyedReducer( 'siteId', softwareInstallWithTransfer )
	),
} );
