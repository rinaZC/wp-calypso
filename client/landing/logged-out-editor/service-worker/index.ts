/**
 * Internal dependencies
 */
import { createMedia, readMedia } from './media';

self.addEventListener( 'fetch', ( event: FetchEvent ) => {
	if ( ! /\/wp\/v2\//.test( event.request.url ) ) {
		return;
	}

	const { url, method } = event.request;
	const { pathname } = new URL( url );

	if ( /^\/wp\/v2\/media$/.test( pathname ) && method === 'POST' ) {
		event.respondWith( createMedia( event.request ) );
		return;
	} else if ( /^\/wp\/v2\/media\/\d+$/.test( pathname ) && method === 'GET' ) {
		event.respondWith( readMedia( event.request ) );
		return;
	}

	// Log an unimplemented endpoints
	console.log( 'WORKER: Missing API endpoint intercept', event.request ); // eslint-disable-line no-console
} );
