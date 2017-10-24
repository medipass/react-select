'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _debounce = require('lodash/debounce');

var _debounce2 = _interopRequireDefault(_debounce);

var _Select = require('./Select');

var _Select2 = _interopRequireDefault(_Select);

var _stripDiacritics = require('./utils/stripDiacritics');

var _stripDiacritics2 = _interopRequireDefault(_stripDiacritics);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var propTypes = {
	autoload: _propTypes2.default.bool.isRequired, // automatically call the `loadOptions` prop on-mount; defaults to true
	cache: _propTypes2.default.any, // object to use to cache results; set to null/false to disable caching
	children: _propTypes2.default.func.isRequired, // Child function responsible for creating the inner Select component; (props: Object): PropTypes.element
	ignoreAccents: _propTypes2.default.bool, // strip diacritics when filtering; defaults to true
	ignoreCase: _propTypes2.default.bool, // perform case-insensitive filtering; defaults to true
	loadOptions: _propTypes2.default.func.isRequired, // callback to load options asynchronously; (inputValue: string, callback: Function): ?Promise
	loadingPlaceholder: _propTypes2.default.oneOfType([// replaces the placeholder while options are loading
	_propTypes2.default.string, _propTypes2.default.node]),
	multi: _propTypes2.default.bool, // multi-value input
	pagination: _propTypes2.default.bool, // automatically load more options when the option list is scrolled to the end; default to false
	noResultsText: _propTypes2.default.oneOfType([// field noResultsText, displayed when no options come back from the server
	_propTypes2.default.string, _propTypes2.default.node]),
	onChange: _propTypes2.default.func, // onChange handler: function (newValue) {}
	onInputChange: _propTypes2.default.func, // optional for keeping track of what is being typed
	options: _propTypes2.default.array.isRequired, // array of options
	placeholder: _propTypes2.default.oneOfType([// field placeholder, displayed when there's no value (shared with Select)
	_propTypes2.default.string, _propTypes2.default.node]),
	searchPromptText: _propTypes2.default.oneOfType([// label to prompt for search input
	_propTypes2.default.string, _propTypes2.default.node]),
	value: _propTypes2.default.any // initial field value
};

var defaultCache = {};

var defaultProps = {
	autoload: true,
	cache: defaultCache,
	children: defaultChildren,
	ignoreAccents: true,
	ignoreCase: true,
	loadingPlaceholder: 'Loading...',
	options: [],
	pagination: false,
	searchPromptText: 'Type to search'
};

var Async = function (_Component) {
	_inherits(Async, _Component);

	function Async(props, context) {
		_classCallCheck(this, Async);

		var _this = _possibleConstructorReturn(this, (Async.__proto__ || Object.getPrototypeOf(Async)).call(this, props, context));

		_this.loadOptions = function (inputValue) {
			var page = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
			var cacheKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'default';
			var _this$props = _this.props,
			    loadOptions = _this$props.loadOptions,
			    pagination = _this$props.pagination;

			var cache = _this._cache;

			_this.setState({ cacheKey: cacheKey });

			if (cache && Object.prototype.hasOwnProperty.call(cache, '' + cacheKey + (inputValue ? '_' + inputValue : ''))) {
				_this._callback = null;

				_this.setState({
					options: cache['' + cacheKey + (inputValue ? '_' + inputValue : '')].options,
					page: cache['' + cacheKey + (inputValue ? '_' + inputValue : '')].page
				});

				if (!pagination || pagination && (cache['' + cacheKey + (inputValue ? '_' + inputValue : '')].page >= page || cache['' + cacheKey + (inputValue ? '_' + inputValue : '')].hasReachedLastPage)) {
					return;
				}
			}

			var callback = function callback(error, data) {
				var options = data && data.options || [];

				var hasReachedLastPage = pagination && options.length === 0;

				if (page > 1) {
					options = _this.state.currentOptions.concat(options);
				}

				if (cache) {
					cache['' + cacheKey + (inputValue ? '_' + inputValue : '')] = { page: page, options: options, hasReachedLastPage: hasReachedLastPage };
				}

				_this.setState({
					isLoading: false,
					isLoadingPage: false,
					page: page,
					options: options
				});
			};

			// Ignore all but the most recent request
			_this._callback = callback;

			var promise = void 0;

			if (pagination) {
				promise = loadOptions(inputValue, page, callback);
			} else {
				promise = loadOptions(inputValue, callback);
			}

			if (promise) {
				promise.then(function (data) {
					return callback(null, data);
				}, function (error) {
					return callback(error);
				});
			}

			if (_this._callback && !_this.state.isLoading) {
				_this.setState({
					isLoading: true,
					isLoadingPage: page > _this.state.page,
					currentOptions: _this.state.options,
					options: _this.props.pagination ? [].concat(_toConsumableArray(_this.state.options), [{ loading: true }]) : _this.state.options
				});
			}
		};

		_this.loadOptionsDebounced = (0, _debounce2.default)(function () {
			return _this.loadOptions.apply(_this, arguments);
		}, 500);


		_this._cache = props.cache === defaultCache ? {} : props.cache;

		_this.state = {
			inputValue: '',
			isLoading: false,
			isLoadingPage: false,
			page: 1,
			options: props.options,
			cacheKey: 'default'
		};

		_this._onInputChange = _this._onInputChange.bind(_this);
		_this._onMenuScrollToBottom = _this._onMenuScrollToBottom.bind(_this);
		return _this;
	}

	_createClass(Async, [{
		key: 'componentDidMount',
		value: function componentDidMount() {
			var autoload = this.props.autoload;
			var cacheKey = this.state.cacheKey;


			if (autoload) {
				this.loadOptions('', 1, cacheKey);
			}
		}
	}, {
		key: 'componentWillReceiveProps',
		value: function componentWillReceiveProps(nextProps) {
			if (nextProps.options !== this.props.options) {
				this.setState({
					options: nextProps.options
				});
			}
		}
	}, {
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			this._callback = null;
		}
	}, {
		key: '_onInputChange',
		value: function _onInputChange(inputValue) {
			var _props = this.props,
			    ignoreAccents = _props.ignoreAccents,
			    ignoreCase = _props.ignoreCase,
			    onInputChange = _props.onInputChange;
			var cacheKey = this.state.cacheKey;

			var transformedInputValue = inputValue;

			if (ignoreAccents) {
				transformedInputValue = (0, _stripDiacritics2.default)(transformedInputValue);
			}

			if (ignoreCase) {
				transformedInputValue = transformedInputValue.toLowerCase();
			}

			if (onInputChange) {
				onInputChange(transformedInputValue);
			}

			this.setState({ inputValue: inputValue });
			this.loadOptionsDebounced(transformedInputValue, 1, cacheKey);

			// Return the original input value to avoid modifying the user's view of the input while typing.
			return inputValue;
		}
	}, {
		key: 'noResultsText',
		value: function noResultsText() {
			var _props2 = this.props,
			    loadingPlaceholder = _props2.loadingPlaceholder,
			    noResultsText = _props2.noResultsText,
			    searchPromptText = _props2.searchPromptText;
			var _state = this.state,
			    inputValue = _state.inputValue,
			    isLoading = _state.isLoading;


			if (isLoading) {
				return loadingPlaceholder;
			}
			if (inputValue && noResultsText) {
				return noResultsText;
			}
			return searchPromptText;
		}
	}, {
		key: 'focus',
		value: function focus() {
			this.select.focus();
		}
	}, {
		key: '_onMenuScrollToBottom',
		value: function _onMenuScrollToBottom(inputValue) {
			var cacheKey = this.state.cacheKey;

			if (!this.props.pagination || this.state.isLoading) return;

			this.loadOptions(inputValue, this.state.page + 1, cacheKey);
		}
	}, {
		key: 'render',
		value: function render() {
			var _this2 = this;

			var _props3 = this.props,
			    children = _props3.children,
			    loadingPlaceholder = _props3.loadingPlaceholder,
			    placeholder = _props3.placeholder;
			var _state2 = this.state,
			    isLoading = _state2.isLoading,
			    isLoadingPage = _state2.isLoadingPage,
			    options = _state2.options;


			var props = {
				noResultsText: this.noResultsText(),
				placeholder: isLoading ? loadingPlaceholder : placeholder,
				options: isLoading && loadingPlaceholder && !isLoadingPage ? [] : options,
				ref: function ref(_ref) {
					return _this2.select = _ref;
				}
			};

			return children(_extends({}, this.props, props, {
				isLoading: isLoading,
				onInputChange: this._onInputChange,
				onMenuScrollToBottom: this._onMenuScrollToBottom
			}));
		}
	}]);

	return Async;
}(_react.Component);

exports.default = Async;


Async.propTypes = propTypes;
Async.defaultProps = defaultProps;

function defaultChildren(props) {
	return _react2.default.createElement(_Select2.default, props);
}