import { isDomainTransfer, isJetpackPlan } from '@automattic/calypso-products';

export const cancellationOptionsForPurchase = ( purchase ) => {
	if ( isJetpackPlan( purchase ) ) {
		return [ 'couldNotActivate', 'didNotInclude', 'downgradeToAnotherPlan', 'onlyNeedFree' ];
	}

	if ( isDomainTransfer( purchase ) ) {
		return [ 'noLongerWantToTransfer', 'couldNotCompleteTransfer', 'useDomainWithoutTransferring' ];
	}

	return [ 'couldNotInstall', 'tooHard', 'didNotInclude', 'onlyNeedFree' ];
};

export const nextAdventureOptionsForPurchase = ( purchase ) => {
	if ( isJetpackPlan( purchase ) ) {
		return [ 'stayingHere', 'otherPlugin', 'leavingWP', 'noNeed' ];
	}

	if ( isDomainTransfer( purchase ) ) {
		return [];
	}

	return [ 'stayingHere', 'otherWordPress', 'differentService', 'noNeed' ];
};
