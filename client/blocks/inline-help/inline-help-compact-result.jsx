import PropTypes from 'prop-types';
import { Component } from 'react';
import { decodeEntities, preventWidows } from 'calypso/lib/formatting';

class InlineHelpCompactResult extends Component {
	static propTypes = {
		helpLink: PropTypes.object.isRequired,
		onClick: PropTypes.func,
	};

	static defaultProps = {
		helpLink: {},
	};

	onClick = ( event ) => {
		this.props.onClick?.( event, this.props.helpLink );
	};

	render() {
		const { helpLink } = this.props;
		return (
			<li className="inline-help__results-item">
				<a
					href={ helpLink.link }
					title={ decodeEntities( helpLink.description ) }
					onClick={ this.onClick }
					tabIndex={ -1 }
				>
					{ preventWidows( decodeEntities( helpLink.title ) ) }
				</a>
			</li>
		);
	}
}

export default InlineHelpCompactResult;
