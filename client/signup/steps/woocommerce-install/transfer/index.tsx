import { Title } from '@automattic/onboarding';
import { useI18n } from '@wordpress/react-i18n';
import { ReactElement, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import StepWrapper from 'calypso/signup/step-wrapper';
import { fetchAutomatedTransferStatus } from 'calypso/state/automated-transfer/actions';
import { transferStates } from 'calypso/state/automated-transfer/constants';
import {
	isFetchingAutomatedTransferStatus,
	getAutomatedTransferStatus,
} from 'calypso/state/automated-transfer/selectors';
import { getSiteWooCommerceUrl } from 'calypso/state/sites/selectors';
import { initiateThemeTransfer } from 'calypso/state/themes/actions';
import { hasUploadFailed } from 'calypso/state/themes/upload-theme/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import type { WooCommerceInstallProps } from '../';

import './style.scss';

export default function Transfer( props: WooCommerceInstallProps ): ReactElement | null {
	const { goToStep, isReskinned } = props;
	const { __ } = useI18n();
	const dispatch = useDispatch();

	const [ progress, setProgress ] = useState( 0.1 );
	const [ error, setError ] = useState( { transferFailed: false, transferStatus: null } );
	const [ step, setStep ] = useState( __( 'Building your store' ) );

	// selectedSiteId is set by the controller whenever site is provided as a query param.
	const siteId = useSelector( getSelectedSiteId ) as number;
	const fetchingTransferStatus = !! useSelector( ( state ) =>
		isFetchingAutomatedTransferStatus( state, siteId )
	);
	const transferStatus = useSelector( ( state ) => getAutomatedTransferStatus( state, siteId ) );
	const transferFailed = useSelector( ( state ) => hasUploadFailed( state, siteId ) );

	const wcAdmin = useSelector( ( state ) => getSiteWooCommerceUrl( state, siteId ) ) ?? '/';

	// Initiate Atomic transfer
	useEffect( () => {
		if ( ! siteId ) {
			return;
		}

		dispatch( fetchAutomatedTransferStatus( siteId ) );
		dispatch( initiateThemeTransfer( siteId, null, 'woocommerce' ) );
	}, [ siteId, dispatch ] );

	// Watch transfer status
	useEffect( () => {
		if ( ! siteId ) {
			goToStep( 'confirm' );
			return;
		}

		if ( fetchingTransferStatus ) {
			return;
		}

		// Note: most of these states are never seen and the ones you do see will
		// sometimes be missed from transfer to transfer due to polling request timing.
		switch ( transferStatus ) {
			case transferStates.NONE:
			case transferStates.PENDING:
			case transferStates.INQUIRING:
			case transferStates.PROVISIONED:
			case transferStates.FAILURE:
			case transferStates.START:
			case transferStates.REVERTED:
				setProgress( 0.2 );
				break;
			case transferStates.SETUP:
			case transferStates.CONFLICTS:
			case transferStates.ACTIVE:
				setProgress( 0.5 );
				break;
			case transferStates.UPLOADING:
			case transferStates.BACKFILLING:
				setProgress( 0.6 );
				break;
			case transferStates.COMPLETE:
				setProgress( 1 );
				break;
		}

		if (
			transferFailed ||
			transferStatus === transferStates.ERROR ||
			transferStatus === transferStates.FAILURE ||
			transferStatus === transferStates.REQUEST_FAILURE ||
			transferStatus === transferStates.CONFLICTS
		) {
			setProgress( 1 );
			setError( { transferFailed, transferStatus } );
		}
	}, [ siteId, goToStep, fetchingTransferStatus, transferStatus, transferFailed, wcAdmin, __ ] );

	// Progress smoothing, works out to be around 40seconds unless transfer step polling dictates otherwise
	const [ simulatedProgress, setSimulatedProgress ] = useState( 0.01 );
	useEffect( () => {
		const timeOutReference = setTimeout( () => {
			if ( progress > simulatedProgress || progress === 1 ) {
				setSimulatedProgress( progress );
			} else if ( simulatedProgress < 1 ) {
				setSimulatedProgress( ( previousProgress ) => {
					let newProgress = previousProgress + Math.random() * 0.05;
					// Stall at 95%, allow complete to finish up
					if ( newProgress >= 0.95 ) {
						newProgress = 0.95;
					}
					return newProgress;
				} );
			}
		}, 1000 );

		if ( simulatedProgress >= 0.8 ) {
			setStep( __( 'Turning on the lights' ) );
		} else if ( simulatedProgress >= 0.6 ) {
			setStep( __( 'Last paint touchups' ) );
		} else if ( simulatedProgress >= 0 ) {
			setStep( __( 'Building your store' ) );
		}

		return () => clearTimeout( timeOutReference );
	}, [ simulatedProgress, progress, __ ] );

	useEffect( () => {
		if ( simulatedProgress < 1 ) {
			return;
		}

		const timer = setTimeout( () => {
			window.location.href = wcAdmin;
		}, 5000 );

		return function () {
			if ( ! timer ) {
				return;
			}
			window.clearTimeout( timer );
		};
	}, [ simulatedProgress, wcAdmin ] );

	return (
		<StepWrapper
			flowName="woocommerce-install"
			hideSkip={ true }
			nextLabelText={ __( 'Confirm' ) }
			allowBackFirstStep={ true }
			backUrl="/woocommerce-installation"
			hideFormattedHeader={ true }
			className="transfer__step-wrapper"
			isWideLayout={ isReskinned }
			stepContent={
				<>
					<div className="transfer__heading-wrapper woocommerce-install__heading-wrapper">
						<div className="transfer__heading woocommerce-install__heading">
							<Title>{ step }</Title>
						</div>
					</div>
					<div className="transfer__content woocommerce-install__content">
						{ error.transferFailed && 'error...' /* todo */ }
						{ error.transferFailed && error.transferStatus }
						<div
							className="transfer__progress-bar"
							style={ { '--progress': simulatedProgress } as React.CSSProperties }
						/>
					</div>
				</>
			}
			{ ...props }
		/>
	);
}
