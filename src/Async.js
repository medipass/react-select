import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from './Select';
import stripDiacritics from './utils/stripDiacritics';
const propTypes = {
	autoload: PropTypes.bool.isRequired,       // automatically call the `loadOptions` prop on-mount; defaults to true
	cache: PropTypes.any,                      // object to use to cache results; set to null/false to disable caching
	children: PropTypes.func.isRequired,       // Child function responsible for creating the inner Select component; (props: Object): PropTypes.element
	ignoreAccents: PropTypes.bool,             // strip diacritics when filtering; defaults to true
	ignoreCase: PropTypes.bool,                // perform case-insensitive filtering; defaults to true
	loadOptions: PropTypes.func.isRequired,    // callback to load options asynchronously; (inputValue: string, callback: Function): ?Promise
	loadingPlaceholder: PropTypes.oneOfType([  // replaces the placeholder while options are loading
		PropTypes.string,
		PropTypes.node
	]),
	multi: PropTypes.bool,                     // multi-value input
	pagination: PropTypes.bool,								 // automatically load more options when the option list is scrolled to the end; default to false
	noResultsText: PropTypes.oneOfType([       // field noResultsText, displayed when no options come back from the server
		PropTypes.string,
		PropTypes.node
	]),
	onChange: PropTypes.func,                  // onChange handler: function (newValue) {}
	onInputChange: PropTypes.func,             // optional for keeping track of what is being typed
	options: PropTypes.array.isRequired,       // array of options
	placeholder: PropTypes.oneOfType([         // field placeholder, displayed when there's no value (shared with Select)
		PropTypes.string,
		PropTypes.node
	]),
	searchPromptText: PropTypes.oneOfType([    // label to prompt for search input
		PropTypes.string,
		PropTypes.node
	]),
	value: PropTypes.any,                      // initial field value
};

const defaultCache = {};

const defaultProps = {
	autoload: true,
	cache: defaultCache,
	children: defaultChildren,
	ignoreAccents: true,
	ignoreCase: true,
	loadingPlaceholder: 'Loading...',
	options: [],
	pagination: false,
	searchPromptText: 'Type to search',
};

export default class Async extends Component {
	constructor (props, context) {
		super(props, context);

		this._cache = props.cache === defaultCache ? {} : props.cache;

		this.state = {
			inputValue: '',
			isLoading: false,
			isLoadingPage: false,
			page: 1,
			options: props.options,
			cacheKey: 'default'
		};

		this._onInputChange = this._onInputChange.bind(this);
		this._onMenuScrollToBottom = this._onMenuScrollToBottom.bind(this);
	}

	componentDidMount () {
		const { autoload } = this.props;
		const { cacheKey } = this.state;

		if (autoload) {
			this.loadOptions('', 1, cacheKey);
		}
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.options !== this.props.options) {
			this.setState({
				options: nextProps.options,
			});
		}
	}

	componentWillUnmount () {
		this._callback = null;
	}

	loadOptions (inputValue, page = 1, cacheKey = 'default') {
		const { loadOptions, pagination } = this.props;
		const cache = this._cache;

		this.setState({ cacheKey });

		if (
			cache &&
			Object.prototype.hasOwnProperty.call(cache, `${cacheKey}${inputValue ? `_${inputValue}` : ''}`)
		) {
			this.setState({
				options: cache[`${cacheKey}${inputValue ? `_${inputValue}` : ''}`].options,
				page: cache[`${cacheKey}${inputValue ? `_${inputValue}` : ''}`].page,
			});

			if (
				!pagination ||
				(pagination && (cache[`${cacheKey}${inputValue ? `_${inputValue}` : ''}`].page >= page || cache[`${cacheKey}${inputValue ? `_${inputValue}` : ''}`].hasReachedLastPage))
			) {
				return;
			}
		}

		const callback = (error, data) => {
			if (callback === this._callback) {
				this._callback = null;

				let options = data && data.options || [];

				const hasReachedLastPage = pagination && options.length === 0;

				if(page > 1) {
					options = this.state.currentOptions.concat(options);
				}

				if (cache) {
					cache[`${cacheKey}${inputValue ? `_${inputValue}` : ''}`] = { page, options, hasReachedLastPage };
				}

				this.setState({
					isLoading: false,
					isLoadingPage: false,
					page,
					options
				});
			}
		};

		// Ignore all but the most recent request
		this._callback = callback;

		let promise;

		if (pagination) {
			promise = loadOptions(inputValue, page, callback);
		} else {
			promise = loadOptions(inputValue, callback);
		}

		if (promise) {
			promise.then(
				(data) => callback(null, data),
				(error) => callback(error)
			);
		}

		if (
			this._callback &&
			!this.state.isLoading
		) {
			this.setState({
				isLoading: true,
				isLoadingPage: page > this.state.page,
				currentOptions: this.state.options,
				options: this.props.pagination ? [...this.state.options, { loading: true }] : this.state.options
			});
		}
	}

	_onInputChange (inputValue) {
		const { ignoreAccents, ignoreCase, onInputChange } = this.props;
		const { cacheKey } = this.state;
		let transformedInputValue = inputValue;

		if (ignoreAccents) {
			transformedInputValue = stripDiacritics(transformedInputValue);
		}

		if (ignoreCase) {
			transformedInputValue = transformedInputValue.toLowerCase();
		}

		if (onInputChange) {
			onInputChange(transformedInputValue);
		}

		this.setState({ inputValue });
		this.loadOptions(transformedInputValue, 1, cacheKey);

		// Return the original input value to avoid modifying the user's view of the input while typing.
		return inputValue;
	}

	noResultsText() {
		const { loadingPlaceholder, noResultsText, searchPromptText } = this.props;
		const { inputValue, isLoading } = this.state;

		if (isLoading) {
			return loadingPlaceholder;
		}
		if (inputValue && noResultsText) {
			return noResultsText;
		}
		return searchPromptText;
	}

	focus () {
		this.select.focus();
	}

	_onMenuScrollToBottom (inputValue) {
		const { cacheKey } = this.state;
		if (!this.props.pagination || this.state.isLoading) return;

		this.loadOptions(inputValue, this.state.page + 1, cacheKey);
	}

	render () {
		const { children, loadingPlaceholder, placeholder } = this.props;
		const { isLoading, isLoadingPage, options } = this.state;

		const props = {
			noResultsText: this.noResultsText(),
			placeholder: isLoading ? loadingPlaceholder : placeholder,
			options: (isLoading && loadingPlaceholder && !isLoadingPage) ? [] : options,
			ref: (ref) => (this.select = ref),
		};

		return children({
			...this.props,
			...props,
			isLoading,
			onInputChange: this._onInputChange,
			onMenuScrollToBottom: this._onMenuScrollToBottom,
		});
	}
}

Async.propTypes = propTypes;
Async.defaultProps = defaultProps;

function defaultChildren (props) {
	return (
		<Select {...props} />
	);
}
