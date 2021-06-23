(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3')) :
	typeof define === 'function' && define.amd ? define(['exports', 'd3'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Appmap = {}, global.d3));
}(this, (function (exports, d3) { 'use strict';

	var isMergeableObject = function isMergeableObject(value) {
		return isNonNullObject(value)
			&& !isSpecial(value)
	};

	function isNonNullObject(value) {
		return !!value && typeof value === 'object'
	}

	function isSpecial(value) {
		var stringValue = Object.prototype.toString.call(value);

		return stringValue === '[object RegExp]'
			|| stringValue === '[object Date]'
			|| isReactElement(value)
	}

	// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
	var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
	var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

	function isReactElement(value) {
		return value.$$typeof === REACT_ELEMENT_TYPE
	}

	function emptyTarget(val) {
		return Array.isArray(val) ? [] : {}
	}

	function cloneUnlessOtherwiseSpecified(value, options) {
		return (options.clone !== false && options.isMergeableObject(value))
			? deepmerge(emptyTarget(value), value, options)
			: value
	}

	function defaultArrayMerge(target, source, options) {
		return target.concat(source).map(function(element) {
			return cloneUnlessOtherwiseSpecified(element, options)
		})
	}

	function getMergeFunction(key, options) {
		if (!options.customMerge) {
			return deepmerge
		}
		var customMerge = options.customMerge(key);
		return typeof customMerge === 'function' ? customMerge : deepmerge
	}

	function getEnumerableOwnPropertySymbols(target) {
		return Object.getOwnPropertySymbols
			? Object.getOwnPropertySymbols(target).filter(function(symbol) {
				return target.propertyIsEnumerable(symbol)
			})
			: []
	}

	function getKeys(target) {
		return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
	}

	function propertyIsOnObject(object, property) {
		try {
			return property in object
		} catch(_) {
			return false
		}
	}

	// Protects from prototype poisoning and unexpected merging up the prototype chain.
	function propertyIsUnsafe(target, key) {
		return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
			&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
				&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
	}

	function mergeObject(target, source, options) {
		var destination = {};
		if (options.isMergeableObject(target)) {
			getKeys(target).forEach(function(key) {
				destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
			});
		}
		getKeys(source).forEach(function(key) {
			if (propertyIsUnsafe(target, key)) {
				return
			}

			if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
				destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
			} else {
				destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
			}
		});
		return destination
	}

	function deepmerge(target, source, options) {
		options = options || {};
		options.arrayMerge = options.arrayMerge || defaultArrayMerge;
		options.isMergeableObject = options.isMergeableObject || isMergeableObject;
		// cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
		// implementations can use it. The caller may not replace it.
		options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;

		var sourceIsArray = Array.isArray(source);
		var targetIsArray = Array.isArray(target);
		var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

		if (!sourceAndTargetTypesMatch) {
			return cloneUnlessOtherwiseSpecified(source, options)
		} else if (sourceIsArray) {
			return options.arrayMerge(target, source, options)
		} else {
			return mergeObject(target, source, options)
		}
	}

	deepmerge.all = function deepmergeAll(array, options) {
		if (!Array.isArray(array)) {
			throw new Error('first argument should be an array')
		}

		return array.reduce(function(prev, next) {
			return deepmerge(prev, next, options)
		}, {})
	};

	var deepmerge_1 = deepmerge;

	var cjs = deepmerge_1;

	class Transform {
	  constructor(x = 0, y = 0, k = 1) {
	    this.x = x;
	    this.y = y;
	    this.k = k;
	  }

	  toString() {
	    return [
	      this.x !== 0 ? `translateX(${this.x}px)` : null,
	      this.y !== 0 ? `translateY(${this.y}px)` : null,
	      this.k !== 1 ? `scale(${this.k}` : null,
	    ].join(' ');
	  }
	}

	var Geometry = {
	  // Checks if a rect (such as a DOMRect) fully contains another.
	  contains(outer, inner) {
	    return outer.top <= inner.top
	      && outer.bottom >= inner.bottom
	      && outer.left <= inner.left
	      && outer.right >= inner.right;
	  },

	  // delta returns the shortest relative translation to place inner within
	  // outer
	  delta(outer, inner) {
	    let x = 0;
	    let y = 0;

	    if (outer.left >= inner.left) {
	      x = outer.left - inner.left;
	    } else if (outer.right <= inner.right) {
	      x = outer.right - inner.right;
	    }

	    if (outer.top >= inner.top) {
	      y = outer.top - inner.top;
	    } else if (outer.bottom <= inner.bottom) {
	      y = outer.bottom - inner.bottom;
	    }

	    return { x, y };
	  },

	  // calculates a transform that shifts from one position to another
	  shift(from, to) {
	    return new Transform(from.x - to.x, from.y - to.y);
	  },

	  Transform,
	};

	const tint = d3.scaleOrdinal()
	  .range(d3.schemeCategory10
	    .map((c) => {
	      const rgba = d3.rgb(c);
	      rgba.opacity = 0.05;
	      return rgba;
	    }));

	const color = d3.scaleOrdinal()
	  .range(d3.schemeCategory10
	    .map((c) => {
	      const rgba = d3.rgb(c);
	      rgba.opacity = 0.8;
	      return rgba;
	    }));

	const has = Object.prototype.hasOwnProperty;
	const capitalizeString = (str) => {
	  if (typeof str !== 'string') {
	    return '';
	  }

	  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
	};

	const UPPER = 0x1;
	const LOWER = 0x10;
	const getCase = char => (/[A-Z]/.exec(char) === null ? LOWER : UPPER);
	const getCasePattern = (str) => {
	  if (str.length <= 2) {
	    return null;
	  }

	  return {
	    firstCase: getCase(str[0]),
	    secondCase: getCase(str[1]),
	  };
	};

	const splitCamelCase = (str) => {
	  const strLen = str.length;
	  if (strLen < 1) {
	    return [];
	  }

	  const casePattern = getCasePattern(str);
	  if (!casePattern) {
	    return [str];
	  }

	  const { firstCase, secondCase } = casePattern;
	  const ret = [];
	  let matched = false;
	  for (let i = 2; i < strLen; i += 1) {
	    const charCase = getCase(str[i]);
	    if (charCase === UPPER) {
	      if (firstCase === LOWER || secondCase === LOWER) {
	        const token = str.slice(0, i);
	        ret.push(token);
	        ret.push(...splitCamelCase(str.slice(i)));
	        matched = true;
	        break;
	      }
	    } else if (charCase === LOWER
	               && firstCase === UPPER
	               && secondCase === UPPER) {
	      const token = str.slice(0, i - 1);
	      ret.push(token);
	      ret.push(...splitCamelCase(str.slice(i - 1)));
	      matched = true;
	      break;
	    }
	  }

	  if (!matched) {
	    ret.push(str);
	  }

	  return ret;
	};

	// tokenizeIdentifier returns tokens of an identifier split by non-alphanumeric and camel casing
	// example:
	//  someMethodName   -> [ 'some', 'method', 'name' ]
	//  some_method_name -> [ 'some', 'method', 'name' ]
	//  org.company.MyPackage.MyClass -> [ 'org', 'company', 'My', 'Package', 'My', 'Class']
	const tokenizeIdentifier = ((id) => {
	  const ret = [];

	  // Split first by non-alphanumeric tokens
	  const tokens = (id || '').split(/[\$.:#\-_]/);

	  // Split remaining tokens by camel case
	  tokens.forEach((token) => {
	    ret.push(...splitCamelCase(token));
	  });

	  return ret;
	});

	const getHttpLabel = (event) => {
	  if (has.call(event, 'http_server_request') === false) {
	    return null;
	  }

	  const requestMethod = event.http_server_request.request_method;
	  const pathInfo = event.http_server_request.path_info;
	  let label;

	  try {
	    // the url is fake, we only care about the path info anyway
	    const url = new URL(pathInfo, 'http://hostname');
	    label = `${requestMethod} ${url.pathname}`;
	  } catch (ex) {
	    label = 'HTTP Request';
	  }

	  return label;
	};

	const sqlLabels = new Set([
	  'insert',
	  'update',
	  'select',
	  'delete',
	  'alter',
	  'create',
	  'drop',
	  'rename',
	  'truncate',
	  'replace',
	  'savepoint',
	  'release',
	  'rollback',
	  'lock',
	  'unlock',
	  'set',
	  'start',
	  'call',
	  'delete',
	  'do',
	  'perform',
	  'handler',
	  'load',
	  'purge',
	  'reset',
	  'prepare',
	  'execute',
	  'deallocate',
	  'xa'
	]);

	const getSqlLabel = (event) => {
	  if (has.call(event, 'sql_query') === false) {
	    return null;
	  }

	  const sql = event.sql_query.normalized_sql || event.sql_query.sql || '';
	  const sqlChars = [...sql.trimLeft()];
	  if (sqlChars.length > 0 && sqlChars[0] === '(') {
	    // if the query is wrapped in parenthesis, drop the opening parenthesis
	    // it doesn't matter if we leave a hanging closing parenthesis.
	    // e.g. (SELECT 1);

	    sqlChars.shift();
	  }

	  // drop sub-queries and parenthesized expressions
	  let depth = 0;
	  const topLevelSql = sqlChars.reduce((arr, c) => {
	    if (c === '(') {
	      ++depth;
	    }

	    if (depth === 0) {
	      arr.push(c);
	    }

	    if (c === ')') {
	      --depth;
	    }

	    return arr;
	  }, []).join('');

	  let queryType = null;
	  if (topLevelSql.search(/\s/) === -1) {
	    // There's only a single token
	    // e.g. BEGIN, COMMIT, CHECKPOINT
	    queryType = topLevelSql;
	  } else {
	    // convert non-word sequences to spaces and split by space
	    // find the first known token
	    queryType = topLevelSql
	      .replace(/[^\w]+/g, ' ')
	      .toLowerCase()
	      .split(' ')
	      .find(t => sqlLabels.has(t));
	  }

	  return ['SQL', capitalizeString(queryType) || null].join(' ');
	};

	const getLabel = (event) => {
	  let label = getHttpLabel(event);
	  if (!label) {
	    label = getSqlLabel(event);
	  }
	  return label;
	};

	// Builds the fully qualified function name of a function (static or instance) within a
	// fully qualified class name.
	function fullyQualifiedFunctionName(event) {
	  const { defined_class, method_id } = event;
	  if ( defined_class && method_id ) {
	    return [defined_class, method_id].join(event.static ? '.' : '#');
	  }

	  return getLabel(event);
	}

	const REPOSITORY_RESOLVERS = {
	  github: (d) => {
	    const match = d.url.match(/github.com[:|/]?(.*).git/);
	    if (!match || match.length <= 1) {
	      return;
	    }

	    const hash = typeof d.lineNumber === 'number' ? `#L${d.lineNumber}` : '';
	    return `https://github.com/${match[1]}/blob/${d.commit}/${d.path}${hash}`;
	  }
	};

	function getRepositoryUrl(url, path, commit='master', lineNumber=null) {
	  if (!url || !path) {
	    return;
	  }

	  const d = { url, path, lineNumber, commit };
	  const resolvers = Object.values(REPOSITORY_RESOLVERS);
	  for (let i = 0; i < resolvers.length; ++i) {
	    const url = resolvers[i](d);
	    if (url) {
	      return url;
	    }
	  }
	}

	function hashify(obj) {
	  const clone = { ...obj };
	  Object.keys(obj).forEach((key) => {
	    const val = obj[key];
	    if (Array.isArray(val)) {
	      clone[key] = new Set(val);
	    } else if (val instanceof Set) {
	      clone[key] = val;
	    } else if (val && typeof val === 'object') {
	      clone[key] = hashify(val);
	    } else {
	      clone[key] = val;
	    }
	  });
	  return clone;
	}

	// Move the minimum amount to put the element into view
	function lazyPanToElement(viewport, element, padding = 0) {
	  if (!element) {
	    return;
	  }

	  let { x, y } = Geometry.delta(
	    viewport.element.getBoundingClientRect(),
	    element.getBoundingClientRect(),
	  );

	  // Apply padding
	  x += Math.sign(x) * padding;
	  y += Math.sign(y) * padding;

	  // Scale the offset using the current transform. This is necessary to put the
	  // element in view at different scales.
	  const { k } = viewport.transform;
	  x /= k;
	  y /= k;

	  viewport.translateBy(x, y);
	}

	function nodeFullyVisible(viewport, node) {
	  if (!node) return false;
	  return Geometry.contains(
	    viewport.element.getBoundingClientRect(),
	    node.getBoundingClientRect(),
	  );
	}

	// Pan the scenario view to given HTMLElement node.
	function panToNode(viewport, node) {
	  // To minimize panning do not move the view if the node is already fully visible.
	  if (!node || nodeFullyVisible(viewport, node)) {
	    return;
	  }

	  let target;
	  // If a node is already selected and visible, pan so that
	  // the new selection will be in the same place.
	  const highlightedNode = viewport.element.querySelector('.node.highlight');
	  if (nodeFullyVisible(viewport, highlightedNode)) {
	    const xform = d3.zoomTransform(highlightedNode);

	    // we'll have to offset for the border
	    const style = getComputedStyle(highlightedNode);
	    target = xform.apply([
	      highlightedNode.offsetLeft + Number.parseInt(style.borderLeftWidth, 10),
	      highlightedNode.offsetTop + Number.parseInt(style.borderTopWidth, 10),
	    ]);
	  }

	  viewport.translateTo(node.offsetLeft, node.offsetTop, target);
	}

	function getEventTarget(target, container = document, selector = '') {
	  const selectedElements = Array.from(container.querySelectorAll(selector));
	  let el = target;

	  while (el) {
	    if (selectedElements.includes(el)) {
	      break;
	    }

	    el = el.parentNode;
	  }

	  return el;
	}

	// @ts-check

	class CodeObject {
	  constructor(/** @type {Object<name: string, type: string, location: string, static: boolean>} */ data, /** @type {CodeObject} */ parent) {
	    this.data = {...data};

	    if (!(this.data.labels instanceof Set)) {
	      this.data.labels = new Set(this.data.labels);
	    }

	    this.parent = parent;
	    this.children = [];
	    if ( this.parent ) {
	      this.parent.children.push(this);
	    }
	  }

	  get id() {
	    const tokens = this.buildId();

	    if ( this.parent && this.type === 'function' ) {
	      const separator = this.static ? '.' : '#';
	      tokens[tokens.length - 2] = separator;
	    }

	    return tokens.join('');
	  }

	  get name() {
	    return this.data.name;
	  }

	  get type() {
	    return this.data.type;
	  }

	  get static() {
	    return this.data.static;
	  }

	  get location() {
	    return this.data.location;
	  }

	  get labels() {
	    return this.data.labels;
	  }

	  /**
	   * Gets the source locations for this code object. For a package, no source locations are returned
	   * (there would be too many to be useful). For a class, the paths to all files which add methods to the class are 
	   * returned. For a function, the path and line number is returned.
	   * 
	   * @returns {Array<String>}
	   */
	  get locations() {
	    switch ( this.type ) {
	    case 'package':
	      return [];
	    case 'class':
	      return Array.from(this.classLocations()).sort();
	    case 'function':
	      return [ this.location ];
	    }
	  }

	  /**
	   * @returns {String}
	   */
	  get packageOf() {
	    const tokens = this.collectAncestors('package');
	    if ( tokens.length === 0 ) {
	      return null;
	    }
	    return tokens.join('/');
	  }

	  /**
	   * @returns {String}
	   */
	  get classOf() {
	    const tokens = this.collectAncestors('class');
	    if ( tokens.length === 0 ) {
	      return null;
	    }
	    return tokens.join('::');
	  }

	  /**
	   * @param {Function} fn 
	   */
	  visit(fn, stack = []) {
	    stack.push(this);
	    fn(this, stack);
	    this.children.forEach((child) => child.visit(fn, stack));
	    stack.pop();
	  }

	  /**
	   * @param {Array<String>} tokens 
	   * @returns {Array<String>}
	   */
	  buildId(tokens = []) {
	    if ( this.parent ) {
	      this.parent.buildId(tokens);

	      let separator;
	      switch (this.parent.type) {
	      case 'package':
	        separator = '/';
	        break;
	      case 'class':
	        separator = '::';
	        break;
	      }
	      tokens.push(separator);    
	    }
	    tokens.push(this.name);
	    return tokens;
	  }

	  /**
	   * @param {String} type
	   * @param {Array<String>} tokens 
	   * @returns {Array<String>}
	   */
	  collectAncestors(type, tokens = []) {
	    if ( this.parent ) {
	      this.parent.collectAncestors(type, tokens);
	    }
	    if ( this.type === type ) {
	      tokens.push(this.name);
	    }
	    return tokens;
	  }

	  /**
	   * @param {Set<string>} paths 
	   * @returns {Set<string>}
	   */
	  classLocations(paths = new Set()) {
	    this.children.forEach((child) => child.classLocations(paths));

	    if ( this.type === 'function' ) {
	      const tokens = this.data.location.split(':', 2);
	      paths.add(tokens[0]);
	    }
	    return paths;
	  }

	  toJSON() {
	    const obj = {
	      name: this.data.name,
	      type: this.data.type,
	    };

	    if (this.data.type === 'function') {
	      obj.static = this.data.static;
	      obj.location = this.data.location;
	    }

	    if (this.children.length > 0) {
	      obj.children = this.children;
	    }

	    return obj;
	  }
	}

	class ClassMap {
	  /**
	   * @param {Array<{type: string, name: string, location: string, static: boolean}>} classMap 
	   */
	  constructor(classMap) {
	    this.codeObjectsByLocation = /** @type {Object<string:Array<CodeObject>>} */ {};
	    this.codeObjects = /** @type {Array<CodeObject>} */ [];
	    this.codeObjectsById = /** @type {Object<string:CodeObject>} */ {};

	    /**
	     * @param {*} data
	     * @param {CodeObject} parent
	     * @returns {CodeObject}
	     */
	    function buildCodeObject(data, parent = null) {
	      const co = new CodeObject(data, parent);
	      this.codeObjects.push(co);
	      this.codeObjectsById[co.id] = co;

	      (data.children || []).forEach((child) => {
	        buildCodeObject.bind(this)(child, co);
	      });

	      if ( co.type !== 'package' ) {
	        co.locations.forEach((location) => {
	          let codeObjects = this.codeObjectsByLocation[location];
	          if ( !codeObjects ) {
	            codeObjects = [];
	            this.codeObjectsByLocation[location] = codeObjects;
	          }
	          codeObjects.push(co);
	        });
	      }

	      return co;
	    }

	    this.roots = classMap.map((root) => buildCodeObject.bind(this)(root));
	  }

	  /**
	   * @param {Function} fn
	   */
	  visit(fn) {
	    this.roots.forEach((co) => co.visit(fn));
	  }

	  /**
	   * @param {string} query
	   */
	  search(query) {
	    const queryLower = query.toLowerCase();
	    return this.codeObjects.filter((co) => co.id.toLowerCase().indexOf(queryLower) !== -1);
	  }

	  /**
	   * @param {String} id
	   * @returns {CodeObject}
	   */
	  codeObjectFromId(id) {
	    return this.codeObjectsById[id];
	  }

	  /**
	   * @param {String} location
	   * @returns {Array<CodeObject>}
	   */
	  codeObjectsAtLocation(location) {
	    return this.codeObjectsByLocation[location] || [];
	  }

	  /**
	   * @param {Object} event
	   * @returns {CodeObject}
	   */
	  codeObjectFromEvent(event) {
	    if (!event) {
	      return null;
	    }

	    const codeObjects = this.codeObjectsByLocation[`${event.path}:${event.lineno}`];
	    if (codeObjects) {
	      return codeObjects.find(obj =>
	        obj.data.name === event.method_id && obj.data.static === event.static);
	    }

	    return null;
	  }

	  toJSON() {
	    return this.codeObjects;
	  }
	}

	// Deprecated. Prefer `Event` instead.
	class CallNode {
	  constructor(input = {}, output = {}, caller = null, labels = []) {
	    this.input = input;
	    this.output = output;
	    this.children = [];
	    this.labels = labels;

	    // Cyclic references shall not be enumerable
	    Object.defineProperty(this, '_caller', {
	      enumerable: false,
	      writable: true,
	      value: caller,
	    });
	  }

	  get caller() {
	    return this._caller;
	  }

	  set caller(value) {
	    return this._caller = value;
	  }

	  clone() {
	    const input = Object.assign({}, this.input);
	    const output = Object.assign({}, this.output);
	    const labels = Object.assign([], this.labels);
	    const newNode = new CallNode(input, output, null, labels);

	    if (this.displayName) {
	      newNode.displayName = this.displayName;
	    }

	    this.children.forEach((child) => {
	      const newChild = child.clone();
	      newNode.addChild(newChild);
	      newChild.caller = newNode;
	    });

	    return newNode;
	  }

	  addChild(node) {
	    this.children.push(node);
	  }

	  // Replace a given child with a different set of children.
	  replaceChild(child, children) {
	    const idx = this.children.indexOf(child);
	    if ( idx === -1 ) {
	      throw new Error(`${child} not found in call tree`);
	    }

	    this.children.splice(idx, 1, ...children);
	    children.forEach(c => c.caller = this);
	    child.caller = null;
	  }

	  removeChild(child) {
	    const childIndex = this.children.indexOf(child);
	    if (childIndex < 0) {
	      throw new Error(`${child} found orphaned by ${this} !`);
	    }
	    this.children.splice(childIndex, 1);
	  }

	  postOrderForEach(fn, stack = []) {
	    stack.push(this);
	    const children = [...this.children];
	    children.forEach(child => child.postOrderForEach(fn, stack));
	    fn(this, stack);
	    stack.pop(this);
	  }

	  preOrderForEach(fn, stack = []) {
	    stack.push(this);
	    fn(this, stack);
	    const children = [...this.children];
	    children.forEach(child => child.preOrderForEach(fn, stack));
	    stack.pop(this);
	  }

	  forEach(fn) { this.postOrderForEach(fn); }

	  // filter returns a tree in which all nodes match a condition. If a node fails the
	  // condition, its children are adopted by it's parent.
	  filter(conditionFn) {
	    const root = this.clone();
	    root.forEach((node, stack) => {
	      if (node.isRoot()) {
	        return;
	      }

	      if (!conditionFn(node, stack)) {
	        const parent = node.caller;
	        parent.replaceChild(node, node.children);
	      }
	    });

	    return root;
	  }

	  // include returns a tree in which all leaf nodes match a condition.
	  // If a node passes the condition, the node and all of its parents are retained
	  // in the tree. If it fails, the node and its children are removed from the tree.
	  // Note that if a node passes the condition, the condition will not be evaluated
	  // for that node's parent nodes, since they are already marked as retained.
	  include(conditionFn) {
	    const root = this.clone();
	    root.postOrderForEach((node, stack) => {
	      if (node.isRoot()) {
	        return;
	      }

	      if (node.marked_include && node.caller) {
	        node.caller.marked_include = true;
	        return;
	      }

	      node.marked_include = conditionFn(node, stack);
	      if (node.marked_include) {
	        if (node.caller) {
	          node.caller.marked_include = true;
	        }
	        return;
	      }

	      if (node.caller) {
	        node.caller.removeChild(node);
	      }
	    });

	    root.postOrderForEach((node) => {
	      delete node.marked_include;
	    });

	    return root;
	  }

	  // exclude returns a tree in which all nodes that match a condition are removed, along
	  // with their child nodes.
	  exclude(conditionFn) {
	    const root = this.clone();
	    root.forEach((node, stack) => {
	      if (node.isRoot()) {
	        return;
	      }

	      if (conditionFn(node, stack)) {
	        const parent = node.caller;
	        parent.removeChild(node);
	      }
	    });

	    return root;
	  }

	  // toArray returns this tree as a one dimensional array
	  toArray() {
	    const childEvents = this.children
	      .map(child => child.toArray())
	      .flat();

	    if (this.isRoot()) {
	      return childEvents;
	    }

	    return [this, ...childEvents];
	  }

	  // find calls find recursively on all children
	  // iterates in pre-order
	  find(fn) {
	    if (fn(this)) {
	      return this;
	    }

	    for (let i = 0; i < this.children.length; i += 1) {
	      const match = this.children[i].find(fn);
	      if (match) {
	        return match;
	      }
	    }

	    return null;
	  }

	  // depth returns the depth of this node
	  depth() {
	    return this.ancestors().length;
	  }

	  // ancestors returns an array of this nodes ancestors
	  ancestors() {
	    const nodes = [];

	    let parent = this.caller;
	    while (parent) {
	      nodes.push(parent);
	      parent = parent.caller;
	    }

	    return nodes;
	  }

	  // returns whether or not a node has a particular node in its ancestry
	  hasAncestor(ancestor) {
	    let node = this;
	    while (node) {
	      if (node === ancestor) {
	        return true;
	      }
	      node = node.caller;
	    }
	    return false;
	  }

	  descendants() {
	    return [this, ...this.children.map(x => x.descendants()).flat()];
	  }

	  next() {
	    if (this.children.length > 0) {
	      return this.children[0];
	    }

	    let child = this;
	    let parent = this.caller;
	    const fnChildIndex = (n => n === child);
	    while (parent) {
	      const myIndex = parent.children.findIndex(fnChildIndex);
	      if (myIndex < 0) {
	        throw new Error(`${this} found orphaned by ${parent}!`);
	      }

	      if (myIndex < parent.children.length - 1) {
	        return parent.children[myIndex + 1];
	      }

	      child = parent;
	      parent = parent.caller;
	    }

	    return null;
	  }

	  previous() {
	    const parent = this.caller;
	    if (!parent) {
	      return null;
	    }

	    if (parent.children.length === 1) {
	      return parent;
	    }

	    const myIndex = parent.children.findIndex(n => n === this);
	    if (myIndex < 0) {
	      throw new Error(`${this.input.id} found orphaned by ${parent.input.id}!`);
	    }

	    if (myIndex > 0) {
	      // this branch will yield our previous node
	      let candidate = parent.children[myIndex - 1];

	      // iterate until we find a leaf node
	      while (candidate.children.length > 0) {
	        candidate = candidate.children[candidate.children.length - 1];
	      }

	      return candidate;
	    }

	    return parent;
	  }

	  // return the node to the left, at given max depth
	  left(depth) {
	    const target = depth || this.depth();

	    // find the target or the nearest descendant
	    let current = this;
	    for (;;) {
	      const parent = current.caller;
	      if (!parent) return this;

	      const siblings = parent.children;
	      const i = siblings.indexOf(current);
	      if (i !== 0) {
	        current = parent.children[i - 1];
	        break;
	      } else {
	        current = parent;
	      }
	    }

	    // find rightmost child closest to the right depth
	    while (current.depth() !== target) {
	      const { children } = current;
	      if (children.length === 0) break;
	      current = children[children.length - 1];
	    }

	    return current;
	  }

	  // return the node to the right, at given max depth
	  right(depth) {
	    const target = depth || this.depth();

	    // find the target or the nearest descendant
	    let current = this;
	    for (;;) {
	      const parent = current.caller;
	      if (!parent) return this;

	      const siblings = parent.children;
	      const i = siblings.indexOf(current);
	      if (i !== siblings.length - 1) {
	        current = parent.children[i + 1];
	        break;
	      } else {
	        current = parent;
	      }
	    }

	    // find leftmost child closest to the right depth
	    while (current.depth() !== target) {
	      const { children } = current;
	      if (children.length === 0) break;
	      [current] = children;
	    }

	    return current;
	  }

	  isRoot() {
	    return this.caller === null;
	  }

	  count() {
	    let numNodes = 0;
	    this.forEach(() => numNodes += 1);
	    return numNodes;
	  }

	  get id() {
	    if (this.input && this.input.id) {
	      return this.input.id;
	    }
	    return null;
	  }
	}

	function getListenerArray(eventSource, eventType) {
	  let listeners = eventSource.listeners[eventType];
	  if (!listeners) {
	    listeners = [];
	    eventSource.listeners[eventType] = listeners;
	  }
	  return listeners;
	}

	class EventSource {
	  constructor() {
	    this.listeners = {};
	    this.anyListeners = [];
	  }

	  once(eventType, fn) {
	    const handlers = getListenerArray(this, eventType);
	    handlers.push({ fn, once: true });
	    return this;
	  }

	  on(eventType, fn) {
	    const handlers = getListenerArray(this, eventType);
	    handlers.push({ fn });
	    return this;
	  }

	  off(eventType, fn) {
	    const handlers = this.listeners[eventType];

	    if (handlers) {
	      const updatedHandlers = handlers.filter((h) => h.fn && h.fn !== fn);
	      if (updatedHandlers.length === 0) {
	        delete this.listeners[eventType];
	      } else if (updatedHandlers.length !== handlers.length) {
	        this.listeners[eventType] = updatedHandlers;
	      }
	    }

	    return this;
	  }

	  emit(eventType, data = undefined) {
	    const handlers = this.listeners[eventType];

	    if (handlers) {
	      let includesOnce = false;
	      handlers.forEach((handler) => {
	        if (handler.once) {
	          includesOnce = true;
	        }

	        try {
	          handler.fn(data);
	        } catch (e) {
	          console.error(`error occurred while executing event ${eventType}`);
	          console.error(e);
	        }
	      });

	      if (includesOnce) {
	        // Only reassign this value if we've encountered a handler that's run once
	        this.listeners[eventType] = this.listeners[eventType].filter((h) => !h.once);
	      }
	    }

	    this.anyListeners.forEach((eventSource) => eventSource.emit(eventType, data));

	    return this;
	  }

	  // Pipe events from EventSource A to EventSource B. If `eventTypes` are
	  // provided, bind only those types. Otherwise, pipe any event.
	  pipe(eventSource, ...eventTypes) {
	    if (eventTypes.length) {
	      eventTypes.forEach((type) => eventSource.on(type, (data) => this.emit(data)));
	      return this;
	    }

	    eventSource.any(this);
	    return this;
	  }

	  // Bind `eventSource` to recieve any event sent from `this`.
	  any(eventSource) {
	    this.anyListeners.push(eventSource);
	    return this;
	  }
	}

	class CallTree extends EventSource {
	  constructor (events, functionLabels = (_) => []) {
	    super();

	    this.dataStore = {
	      rootEvent: this.rootNode,
	      selectedEvent: this.rootNode,
	    };

	    this.rootEvent = new CallNode();
	    const stack = [this.rootEvent];
	    events.forEach((e) => {
	      if (e.event !== 'call') {
	        if (stack.length > 1) {
	          stack.pop();
	        }
	        return;
	      }

	      const parent = stack[stack.length - 1];
	      const callNode = new CallNode(e, e.returnEvent, parent, functionLabels(e));
	      parent.addChild(callNode);
	      stack.push(callNode);
	    });

	    return this;
	  }

	  get rootEvent() {
	    return this.dataStore.rootEvent;
	  }

	  set rootEvent(event) {
	    this.dataStore.rootEvent = event;
	    this.emit('rootEvent', event);
	  }

	  get selectedEvent() {
	    return this.dataStore.selectedEvent;
	  }

	  set selectedEvent(event) {
	    this.dataStore.selectedEvent = event;
	    this.emit('selectedEvent', event);
	  }
	}

	const HTTP_PACKAGE = 'HTTP';
	const SQL_PACKAGE = 'SQL';

	class Components {
	  constructor(scenarioData) {
	    /* eslint-disable camelcase */
	    // map of all packages which are invoked from each package
	    this.package_calls = {}; // Hash.new { |h, k| h[k] = Set.new }
	    // for each class, a set of classes which are called
	    this.class_calls = {}; // Hash.new { |h, k| h[k] = Set.new }
	    // for each class, a set of classes which are its callers
	    this.class_callers = {}; // Hash.new { |h, k| h[k] = Set.new }
	    // map of all classes in each package
	    this.package_classes = {}; // Hash.new { |h, k| h[k] = Set.new }
	    // the package of each class
	    this.class_package = {};
	    // Packages which are invoked from HTTP_PACKAGE
	    this.controller_packages = new Set();
	    // Packages which invoke a SQL query
	    this.querying_packages = new Set();
	    // All packages
	    this.packages = new Set();
	    // Path and line numbers of classes
	    this.class_locations = {};
	    // Source control related metadata
	    this.source_control = {};
	    /* eslint-enable camelcase */

	    if (!scenarioData.events || !scenarioData.classMap) {
	      return;
	    }

	    const locationIndex = {};
	    const fqPackageName = [];
	    const fqClassName = [];

	    function buildLocationIndex(cls) {
	      if ( cls.type === 'class' ) {
	        fqClassName.push(cls.name);
	      }
	      if ( cls.type === 'package' ) {
	        fqPackageName.push(cls.name);
	      }

	      if ( cls.type === 'function' ) {
	        const locationKey = [cls.location || '<path>:<line>', cls.name].join('#');
	        const className = fqClassName.join('::');
	        const packageName = fqPackageName.join('/');
	        locationIndex[locationKey] = { className, packageName };
	      }

	      (cls.children || []).forEach(buildLocationIndex);

	      if ( cls.type === 'class' ) {
	        fqClassName.pop();
	      }
	      if ( cls.type === 'package' ) {
	        fqPackageName.pop();
	      }
	    }

	    scenarioData.classMap.forEach(buildLocationIndex);

	    const callStack = [];
	    const uniqueInvocations = new Set();
	    const invocationGraph = [];
	    scenarioData.events.forEach((event) => {
	      if ( event.event === 'return' ) {
	        return callStack.pop();
	      }

	      const locationKey = [[event.path || '<path>', event.lineno || '<line>'].join(':'), event.method_id].join('#');
	      let calleeClassDef;
	      if ( event.sql_query ) {
	        calleeClassDef = { className: SQL_PACKAGE, packageName: SQL_PACKAGE };
	      } else if ( event.http_server_request ) {
	        calleeClassDef = { className: `${event.http_server_request.request_method} ${event.http_server_request.path_info}`, packageName: HTTP_PACKAGE };
	      } else {
	        calleeClassDef = locationIndex[locationKey];
	        if ( !calleeClassDef ) {
	          // define custom package and class when location is unknown
	          calleeClassDef = { className: event.defined_class, packageName: event.defined_class.split('::')[0] };
	        }
	      }

	      if ( callStack.length > 0 ) {
	        const callerClassDef = callStack[callStack.length - 1];
	        const call = [callerClassDef, calleeClassDef];
	        const callKey = JSON.stringify(call);
	        if ( uniqueInvocations.add(callKey) ) {
	          invocationGraph.push(call);
	        }
	      }

	      callStack.push(calleeClassDef);

	      return null;
	    });

	    invocationGraph.forEach((call) => {
	      call.forEach((type) => {
	        this.packages.add(type.packageName);
	        if (!this.package_classes[type.packageName]) {
	          this.package_classes[type.packageName] = new Set();
	        }
	        this.package_classes[type.packageName].add(type.className);
	        this.class_package[type.className] = type.packageName;
	      });

	      const [caller, callee] = call;

	      if ( caller.packageName === HTTP_PACKAGE ) {
	        this.controller_packages.add(callee.packageName);
	      }
	      if ( callee.packageName === SQL_PACKAGE ) {
	        this.querying_packages.add(caller.packageName);
	      }

	      if (!this.package_calls[caller.packageName]) {
	        this.package_calls[caller.packageName] = new Set();
	      }
	      this.package_calls[caller.packageName].add(callee.packageName);

	      if (!this.class_calls[caller.className]) {
	        this.class_calls[caller.className] = new Set();
	      }
	      this.class_calls[caller.className].add(callee.className);

	      if (!this.class_callers[callee.className]) {
	        this.class_callers[callee.className] = new Set();
	      }
	      this.class_callers[callee.className].add(caller.className);
	    });
	  }
	}

	const capitalizeString$1 = (str) => {
	  if (typeof str !== 'string') {
	    return '';
	  }

	  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
	};

	const has$1 = Object.prototype.hasOwnProperty;

	const getHttpLabel$1 = (event) => {
	  if (has$1.call(event, 'http_server_request') === false) {
	    return null;
	  }

	  const requestMethod = event.http_server_request.request_method;
	  const pathInfo = event.http_server_request.path_info;
	  let label;

	  try {
	    // the url is fake, we only care about the path info anyway
	    const url = new URL(pathInfo, 'http://hostname');
	    label = `${requestMethod} ${url.pathname}`;
	  } catch (ex) {
	    label = 'HTTP Request';
	  }

	  return label;
	};

	const sqlLabels$1 = new Set([
	  'insert',
	  'update',
	  'select',
	  'delete',
	  'alter',
	  'create',
	  'drop',
	  'rename',
	  'truncate',
	  'replace',
	  'savepoint',
	  'release',
	  'rollback',
	  'lock',
	  'unlock',
	  'set',
	  'start',
	  'call',
	  'delete',
	  'do',
	  'perform',
	  'handler',
	  'load',
	  'purge',
	  'reset',
	  'prepare',
	  'execute',
	  'deallocate',
	  'xa'
	]);

	const getSqlLabel$1 = (event) => {
	  if (has$1.call(event, 'sql_query') === false) {
	    return null;
	  }

	  const sql = event.sql_query.normalized_sql || event.sql_query.sql || '';
	  const sqlChars = [...sql.trimLeft()];
	  if (sqlChars.length > 0 && sqlChars[0] === '(') {
	    // if the query is wrapped in parenthesis, drop the opening parenthesis
	    // it doesn't matter if we leave a hanging closing parenthesis.
	    // e.g. (SELECT 1);

	    sqlChars.shift();
	  }

	  // drop sub-queries and parenthesized expressions
	  let depth = 0;
	  const topLevelSql = sqlChars.reduce((arr, c) => {
	    if (c === '(') {
	      ++depth;
	    }

	    if (depth === 0) {
	      arr.push(c);
	    }

	    if (c === ')') {
	      --depth;
	    }

	    return arr;
	  }, []).join('');

	  let queryType = null;
	  if (topLevelSql.search(/\s/) === -1) {
	    // There's only a single token
	    // e.g. BEGIN, COMMIT, CHECKPOINT
	    queryType = topLevelSql;
	  } else {
	    // convert non-word sequences to spaces and split by space
	    // find the first known token
	    queryType = topLevelSql
	      .replace(/[^\w]+/g, ' ')
	      .toLowerCase()
	      .split(' ')
	      .find(t => sqlLabels$1.has(t));
	  }

	  return ['SQL', capitalizeString$1(queryType) || null].join(' ');
	};

	const getLabel$1 = (event) => {
	  let label = getHttpLabel$1(event);
	  if (!label) {
	    label = getSqlLabel$1(event);
	  }
	  return label;
	};

	function mapFunctionLocations(memo, obj) {
	  if (obj.type === 'function') {
	    memo[obj.location] = obj;
	  }

	  if (obj.children) {
	    obj.children.reduce(mapFunctionLocations, memo);
	  }

	  return memo;
	}

	class EventInfo {
	  constructor(classMap) {
	    this.functionObjects = classMap.reduce(mapFunctionLocations, {});
	  }

	  getName(event) {
	    const label = getLabel$1(event);
	    if (label) {
	      return label;
	    }

	    const codeObj = this.getCodeObject(event);
	    if (codeObj) {
	      return codeObj.display_name;
	    }

	    // Fallback algorithm
	    const separator = event.static ? '.' : '#';
	    return [event.defined_class, separator, event.method_id].join('');
	  }

	  getLabels(event) {
	    const labels = [];

	    if (event.labels) {
	      labels.push(...event.labels);
	    }

	    const codeObj = this.getCodeObject(event);
	    if (codeObj && codeObj.labels.length) {
	      labels.push(...codeObj.labels);
	    }

	    return labels;
	  }

	  getCodeObject(event) {
	    return this.functionObjects[`${event.path}:${event.lineno}`];
	  }
	}

	const Models = {
	  ClassMap,
	  CallTree,
	  Components,
	  EventInfo,
	  EventSource,
	  getLabel: getLabel$1,
	};

	const STALE_TIME = 0.33; // seconds

	function removeStaleSamples(accumulator) {
	  let lastTime = Date.now();
	  for (let i = accumulator.values.length - 1; i >= 0; --i) {
	    const sample = accumulator.values[i];
	    const dt = (lastTime - sample.time) / 60.0;

	    // If enough time has passed between the new sample and the last sample,
	    // all the existing data is considered stale and removed.
	    if (dt > accumulator.staleTime) {
	      accumulator.values.splice(0, accumulator.values.length);
	      break;
	    }

	    lastTime = sample.time;
	  }
	}

	// Accumulator keeps a running average of values up to a max number of samples
	// samples decay and are removed after the staleTime
	class Accumulator {
	  constructor(maxSamples, staleTime = STALE_TIME) {
	    this.maxSamples = maxSamples;
	    this.staleTime = staleTime;
	    this.reset();
	  }

	  add(value) {
	    removeStaleSamples(this);

	    if (this.values.length >= this.maxSamples) {
	      this.values.splice(0, this.values.length - this.maxSamples + 1);
	    }

	    this.values.push({ value, time: Date.now() });
	  }

	  reset() {
	    this.values = [];
	  }

	  get length() {
	    return this.values.length;
	  }

	  get value() {
	    removeStaleSamples(this);
	    const length = this.values.length - 1;
	    return length !== 0 ? this.values.reduce((acc, sample) => acc += sample.value, 0) / length : 0;
	  }
	}

	const FRICTION_COEFFICIENT = 2.5;
	const IMPULSE_THRESHOLD = 1;
	const EPSILON = 0.2;
	const SAMPLES = 8;

	class Momentum {
	  constructor(zoom, selection) {
	    this.vX = new Accumulator(SAMPLES);
	    this.vY = new Accumulator(SAMPLES);
	    this.transform = { x: 0.0, y: 0.0, k: 0.0 };
	    this.velocity = { x: 0, y: 0 };
	    this.selection = selection;
	    this.node = selection.node();
	    this.zoom = zoom;
	    this.active = false;
	    this.ticking = false;
	  }

	  cancel() {
	    if (this.lastTick) {
	      delete this.lastTick;
	    }

	    this.active = false;
	    this.ticking = false;
	  }

	  hold() {
	    this.active = false;
	    this.holding = true;
	    this.vX.reset();
	    this.vY.reset();
	  }

	  release() {
	    if (!this.holding) {
	      return;
	    }

	    this.holding = false;
	    this.impulse(this.vX.value, this.vY.value);
	  }

	  impulse(x, y, threshold = IMPULSE_THRESHOLD) {
	    if (Math.abs(x) + Math.abs(y) < threshold) {
	      return;
	    }

	    this.velocity.x = x / this.transform.k;
	    this.velocity.y = y / this.transform.k;

	    if (this.ticking) {
	      return;
	    }

	    this.active = true;
	    this.tick();
	  }

	  tick() {
	    if (!this.moving || !this.active) {
	      this.cancel();
	      return;
	    }

	    this.ticking = true;

	    requestAnimationFrame((t) => {
	      if (!this.active) {
	        this.cancel();
	        return;
	      }

	      if (!this.lastTick) {
	        this.lastTick = t - 1;
	      }

	      const dt = (t - this.lastTick) / 1000.0;

	      this.zoom.translateBy(this.selection, this.velocity.x, this.velocity.y);

	      this.velocity.x -= this.velocity.x * FRICTION_COEFFICIENT * dt;
	      this.velocity.y -= this.velocity.y * FRICTION_COEFFICIENT * dt;

	      this.lastTick = t;
	      this.tick();
	    });
	  }

	  updateTransform(transform) {
	    // check if translation has changed by checking if scale hasn't
	    if (!this.active && transform.k === this.transform.k) {
	      this.vX.add(transform.x - this.transform.x);
	      this.vY.add(transform.y - this.transform.y);
	    }

	    this.transform.x = transform.x;
	    this.transform.y = transform.y;
	    this.transform.k = transform.k;
	  }

	  get moving() {
	    return Math.abs(this.velocity.x) + Math.abs(this.velocity.y) > EPSILON;
	  }
	}

	function momentum(zoom, selection) {
	  const m = new Momentum(zoom, selection);
	  const onZoom = zoom.on('zoom');
	  const onBlur = window.onblur;

	  selection
	    .on('mousedown', () => m.hold())
	    .on('mouseup', () => m.release())
	    .on('pointerdown', () => m.hold())
	    .on('pointerup', () => m.release())
	    .on('touchstart', () => m.hold())
	    .on('touchend', () => m.release())
	    .on('touchcancel', () => m.release());

	  window.addEventListener('mouseup', () => m.release());
	  window.addEventListener('pointerup', () => m.release());
	  window.onblur = () => {
	    if (onBlur) {
	      onBlur();
	    }

	    m.cancel();
	  };

	  zoom.on('zoom', () => {
	    m.updateTransform(d3.event.transform);
	    if (onZoom) {
	      onZoom();
	    }
	  });

	  const translateTo = zoom.translateTo;
	  zoom.translateTo = (...args) => {
	    m.cancel();
	    return translateTo(...args);
	  };

	  const translate = zoom.translate;
	  zoom.translate = (...args) => {
	    m.cancel();
	    return translate(...args);
	  };

	  return zoom;
	}

	// updateZoom updates the bar that indicates the current level of zoom.
	// `zoomScale` is a float, ranging from 0.0 (fully zoomed in) to 1.0 (fully
	// zoomed out)
	function updateZoom(viewportZoom, zoomScale) {
	  const { controls } = viewportZoom;
	  if (!viewportZoom.maxZoomBarValue) {
	    const zoomBarHeight = controls.zoomBar.getBoundingClientRect().height;
	    const zoomGrabHeight = controls.zoomGrab.getBoundingClientRect().height;
	    viewportZoom.maxZoomBarValue = zoomBarHeight - zoomGrabHeight;
	  }

	  const { maxZoomBarValue } = viewportZoom;
	  const topOffset = maxZoomBarValue - maxZoomBarValue * zoomScale;
	  viewportZoom.zoomScale = zoomScale;

	  controls.zoomGrab.style.top = `${topOffset}px`;
	}

	function createDOM(viewportZoom) {
	  const controlsContainer = document.createElement('div');
	  controlsContainer.className = 'appmap__zoom';

	  const { controls } = viewportZoom;
	  controls.buttonZoomIn = document.createElement('button');
	  controls.buttonZoomIn.setAttribute('type', 'button');
	  controls.buttonZoomIn.className = 'appmap__zoom-button';
	  controls.buttonZoomIn.innerHTML = '&plus;';
	  controlsContainer.appendChild(controls.buttonZoomIn);

	  controls.zoomBar = document.createElement('div');
	  controls.zoomBar.className = 'appmap__zoom-bar';
	  controls.zoomGrab = document.createElement('div');
	  controls.zoomGrab.className = 'appmap__zoom-grab';
	  controls.zoomBar.appendChild(controls.zoomGrab);
	  controlsContainer.appendChild(controls.zoomBar);

	  controls.buttonZoomOut = document.createElement('button');
	  controls.buttonZoomOut.setAttribute('type', 'button');
	  controls.buttonZoomOut.className = 'appmap__zoom-button';
	  controls.buttonZoomOut.innerHTML = '&minus;';
	  controlsContainer.appendChild(controls.buttonZoomOut);

	  viewportZoom.container.appendChild(controlsContainer);
	  viewportZoom.element = controlsContainer;

	  controls.buttonZoomIn.addEventListener('click', () => {
	    viewportZoom.zoomScale = Math.min(1.0, viewportZoom.zoomScale + viewportZoom.step);
	    viewportZoom.emit('zoom', viewportZoom.zoomScale);
	  });

	  controls.buttonZoomOut.addEventListener('click', () => {
	    viewportZoom.zoomScale = Math.max(0.0, viewportZoom.zoomScale - viewportZoom.step);
	    viewportZoom.emit('zoom', viewportZoom.zoomScale);
	  });

	  controls.zoomBar.addEventListener('click', (event) => {
	    if (event.target !== controls.zoomBar) {
	      return false;
	    }

	    const maxOffset = controls.zoomBar.getBoundingClientRect().height;
	    const offset = event.clientY - Math.round(controls.zoomBar.getBoundingClientRect().top);

	    viewportZoom.emit('zoom', 1.0 - offset / maxOffset);

	    return true;
	  });

	  controls.zoomBar.addEventListener('mousedown', (event) => {
	    document.body.style.cursor = 'grabbing';
	    viewportZoom.zoomGrabPosition = controls.zoomGrab.offsetTop;
	    viewportZoom.dragStart = event.clientY;
	    viewportZoom.isDragging = true;
	    event.stopPropagation();
	  });

	  document.body.addEventListener('mousemove', (event) => {
	    if (viewportZoom.isDragging) {
	      const maxOffset = controls.zoomBar.getBoundingClientRect().height;
	      const offset = viewportZoom.zoomGrabPosition + (event.clientY - viewportZoom.dragStart);
	      viewportZoom.emit('zoom', 1.0 - offset / maxOffset);
	      event.preventDefault();
	    }
	  });

	  document.body.addEventListener('mouseup', () => {
	    document.body.style.cursor = null;
	    viewportZoom.isDragging = false;
	  });
	}

	class ContainerZoom extends Models.EventSource {
	  constructor(container, options) {
	    super();

	    this.container = container.element;
	    this.step = options.step;
	    this.controls = {};
	    this.maxZoomBarValue = null;
	    this.dragStart = null;
	    this.zoomGrabPosition = null;
	    this.isDragging = false;
	    this.zoomGrabTimeout = null;

	    createDOM(this);
	    updateZoom(this, container.transform.k);
	    container.on('move', (transform) => updateZoom(this, (transform.k - options.minRatio) / (options.maxRatio - options.minRatio)));
	  }
	}

	function transformElement(item, element) {
	  if (typeof item._transform === 'function') {
	    return item._transform(element);
	  }
	  return element;
	}

	class ContextMenuItem extends EventSource {
	  constructor() {
	    super();
	    this._text = 'Untitled item';
	  }

	  text(value) {
	    this._text = value;
	    return this;
	  }

	  selector(value) {
	    this._selector = value;
	    return this;
	  }

	  condition(fn) {
	    this._condition = fn;
	    return this;
	  }

	  transform(fn) {
	    this._transform = fn;
	    return this;
	  }

	  match(e) {
	    const matchSelector = !this._selector || e.matches(this._selector);
	    if (!matchSelector) {
	      return false;
	    }

	    const subject = transformElement(this, e);
	    if (!subject) {
	      // we have a transform and it failed to resolve
	      return false;
	    }

	    const matchCondition = !this._condition || this._condition(subject);
	    return matchCondition;
	  }
	}

	function initializeDomElements(parent) {
	  const dropdown = document.createElement('div');
	  dropdown.classList.add('appmap__context-menu');
	  dropdown.style.display = 'none';

	  const dropdownMenu = document.createElement('div');
	  dropdownMenu.classList.add('dropdown-menu');
	  dropdown.appendChild(dropdownMenu);

	  // Don't propagate mousedown events to elements we're above. For example, we
	  // don't want the user being able to pan a viewport through this element.
	  // OTOH, maybe this shouldn't be a class behavior and should be handled by the
	  // context menu owner. If this causes issues in the future we can move this
	  // out.
	  dropdown.addEventListener('mousedown', (e) => e.stopPropagation());
	  dropdown.addEventListener('pointerdown', (e) => e.stopPropagation());
	  dropdown.addEventListener('touchstart', (e) => e.stopPropagation());

	  const emptyMessage = document.createElement('p');
	  emptyMessage.innerText = 'No actions available';
	  emptyMessage.style.display = 'none';
	  dropdownMenu.appendChild(emptyMessage);

	  parent.appendChild(dropdown);

	  return {
	    dropdown,
	    menu: dropdownMenu,
	    emptyMessage,
	  };
	}

	function addItem(contextMenu, item) {
	  const itemElement = document.createElement('a');
	  itemElement.classList.add('dropdown-item');
	  itemElement.innerText = item._text;
	  contextMenu.elements.menu.appendChild(itemElement);
	  item.element = itemElement;

	  return itemElement;
	}

	function addDivider(contextMenu) {
	  const divider = document.createElement('div');
	  divider.classList.add('dropdown-divider');
	  contextMenu.elements.menu.appendChild(divider);
	}

	function show(contextMenu, clickEvent) {
	  let itemsDisplayed = 0;

	  // Remove ancestors of the container element, we don't need to iterate any
	  // further than that.
	  const path = clickEvent
	    .composedPath()
	    .slice(0, clickEvent
	      .composedPath()
	      .findIndex((e) => e === contextMenu.activeArea));

	  contextMenu.items.forEach((item) => {
	    const match = path.find((e) => item.match(e));
	    if (!match) {
	      item.element.style.display = 'none';
	      return;
	    }

	    if (item.element.listener) {
	      // make sure there's no old state
	      item.element.removeEventListener('click', item.element.listener);
	    }

	    item.element.listener = () => item.emit('execute', transformElement$1(item, match));
	    item.element.addEventListener('click', item.element.listener);
	    item.element.style.display = '';
	    item.emit('show');
	    itemsDisplayed += 1;
	  });

	  contextMenu.elements.emptyMessage.style.display = itemsDisplayed > 0
	    ? 'none'
	    : '';

	  const { x, y } = contextMenu.parent.getBoundingClientRect();
	  contextMenu.elements.menu.style.transform = `translate(${clickEvent.x - x}px, ${clickEvent.y - y}px)`;
	  contextMenu.elements.dropdown.style.display = 'block';
	}

	function transformElement$1(item, element) {
	  if (typeof item._transform === 'function') {
	    return item._transform(element);
	  }
	  return element;
	}

	class ContextMenu extends EventSource {
	  constructor(container, activeArea = null) {
	    super();

	    this.parent = container;
	    this.activeArea = activeArea || container;
	    this.elements = initializeDomElements(container);
	    this.activeArea.addEventListener('contextmenu', (e) => {
	      show(this, e);
	      e.preventDefault();
	      this.emit('show');
	    });
	    this.selectors = {};
	    this.items = [];
	  }

	  divider() {
	    addDivider(this);
	    return this;
	  }

	  add(itemBuilder) {
	    const item = itemBuilder(new ContextMenuItem());

	    if (!item) {
	      return this;
	    }

	    addItem(this, item);
	    this.items.push(item);

	    return this;
	  }

	  get visible() {
	    if (!this.elements || !this.elements.menu) {
	      return false;
	    }

	    return this.elements.menu.offsetWidth > 0;
	  }

	  close() {
	    const isVisible = this.visible;
	    if (isVisible) {
	      this.elements.dropdown.style.display = 'none';
	    }
	    return isVisible;
	  }

	  // Determines whether or not an event could have originated from the context
	  // menu.
	  isEventSource(e) {
	    if (!e) return false;

	    const path = e.composedPath();

	    if (!path || !this.elements) {
	      return false;
	    }

	    return path.includes(this.elements.menu);
	  }
	}

	const AVAILABLE_THEMES = ['light', 'dark'];
	const DEFAULT_THEME = 'light';

	const defaultOptions = {
	  contextMenu: false,
	  pan: {
	    momentum: true, // if true, enables momentum on panning
	    boundary: {
	      contain: null, // selector for contained element
	      overlap: 300, // px
	    },
	    tweenTime: 250, // ms
	  },
	  theme: DEFAULT_THEME,
	  zoom: {
	    controls: false, // display zoom controls (+ / - buttons)
	    step: 0.1, // zoom step when clicking a button in the interface
	    minRatio: 0.1, // minimum zoom scale
	    maxRatio: 1.0, // maximum zoom scale
	    requireActive: false, // whether or not the user must interact with the element before zooming
	  },
	};

	const clamp = (x, min, max) => Math.min(Math.max(x, min), max);

	class Container extends Models.EventSource {
	  constructor(parent, options = {}) {
	    super();

	    const parentElement = d3.select(parent).node();

	    this.options = cjs(defaultOptions, options);

	    let { theme } = this.options;

	    if (AVAILABLE_THEMES.indexOf(theme) === -1) {
	      theme = DEFAULT_THEME;
	    }

	    this.element = document.createElement('div');
	    this.element.className = `appmap appmap--theme-${theme}`;

	    this.contentElement = document.createElement('div');
	    this.contentElement.className = 'appmap__content';
	    this.contentElement.containerController = this;
	    this.element.appendChild(this.contentElement);
	    parentElement.appendChild(this.element);

	    if (this.options.zoom) {
	      if (this.options.zoom.controls) {
	        this.zoomController = new ContainerZoom(this, this.options.zoom)
	          .on('zoom', (k) => {
	            const { minRatio, maxRatio } = this.options.zoom;
	            this.scaleTo((maxRatio - minRatio) * k + minRatio);
	            this.active = true;
	          });
	      }

	      this.zoom = d3.zoom()
	        .scaleExtent([this.options.zoom.minRatio, this.options.zoom.maxRatio])
	        .interpolate(d3.interpolate)
	        .filter(() => {
	          if (d3.event.type === 'wheel') {
	            return this.active || !this.options.zoom.requireActive;
	          }

	          // Mutating state in a filter is not so great here. So far I've been
	          // unsuccessful at binding a 'start' handler to do this. I'm all for
	          // moving this mutation somewhere more appropriate if someone would
	          // like to take the time to do so. -DB
	          this.active = true;

	          return true;
	        })
	        .on('zoom', () => {
	          const { transform } = d3.event;

	          const { offsetHeight, offsetWidth } = parentElement;

	          transform.x = clamp(
	            transform.x,
	            (this.options.pan.boundary.overlap - this.contentElement.offsetWidth) * transform.k,
	            offsetWidth - this.options.pan.boundary.overlap * transform.k,
	          );

	          transform.y = clamp(
	            transform.y,
	            (this.options.pan.boundary.overlap - this.contentElement.offsetHeight) * transform.k,
	            offsetHeight - this.options.pan.boundary.overlap * transform.k,
	          );

	          this.contentElement.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
	          this.contentElement.style.transformOrigin = '0 0';

	          this.emit('move', transform);
	        });

	      if (this.options.pan.momentum) {
	        momentum(this.zoom, d3.select(this.element));
	      }

	      d3.select(this.element)
	        .call(this.zoom)
	        .on('dblclick.zoom', null);
	    }

	    return this.contentElement;
	  }

	  setContextMenu(componentController) {
	    if (this.options.contextMenu === false || typeof this.options.contextMenu !== 'function') {
	      return;
	    }

	    this.contextMenu = new ContextMenu(this.element);

	    const contextMenuItems = this.options.contextMenu(componentController);

	    contextMenuItems.forEach((item) => this.contextMenu.add(item));
	  }

	  fitViewport(targetElement) {
	    const targetHeight = targetElement.offsetHeight;
	    const targetWidth = targetElement.offsetWidth;
	    const { clientWidth, clientHeight } = this.element.parentNode;
	    const { minRatio, maxRatio } = this.options.zoom;
	    const desiredRatio = Math.min(clientHeight / targetHeight, clientWidth / targetWidth);
	    const initialScale = Math.max(Math.min(Math.max(desiredRatio, minRatio), maxRatio), 0.8);
	    const transformMatrix = d3.zoomIdentity
	      .translate(
	        (clientWidth - targetWidth * initialScale) * 0.5,
	        (clientHeight - targetHeight * initialScale) * 0.5,
	      )
	      .scale(initialScale);

	    this.transform = transformMatrix;
	  }

	  translateTo(x, y, target = null) {
	    d3.select(this.element)
	      .transition()
	      .duration(this.options.pan.tweenTime)
	      .call(this.zoom.translateTo, x, y, target);
	  }

	  translateBy(x, y) {
	    d3.select(this.element)
	      .transition()
	      .duration(this.options.pan.tweenTime)
	      .call(this.zoom.translateBy, x, y);
	  }

	  scaleTo(k) {
	    d3.select(this.element)
	      .transition()
	      .duration(100)
	      .call(this.zoom.scaleTo, k);
	  }

	  get transform() {
	    return d3.zoomTransform(this.element);
	  }

	  set transform(transform) {
	    d3.select(this.element)
	      .call(this.zoom.transform, transform);
	  }
	}

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, basedir, module) {
		return module = {
			path: basedir,
			exports: {},
			require: function (path, base) {
				return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
			}
		}, fn(module, module.exports), module.exports;
	}

	function commonjsRequire () {
		throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
	}

	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */
	function listCacheClear() {
	  this.__data__ = [];
	  this.size = 0;
	}

	var _listCacheClear = listCacheClear;

	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq(value, other) {
	  return value === other || (value !== value && other !== other);
	}

	var eq_1 = eq;

	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
	  var length = array.length;
	  while (length--) {
	    if (eq_1(array[length][0], key)) {
	      return length;
	    }
	  }
	  return -1;
	}

	var _assocIndexOf = assocIndexOf;

	/** Used for built-in method references. */
	var arrayProto = Array.prototype;

	/** Built-in value references. */
	var splice = arrayProto.splice;

	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete(key) {
	  var data = this.__data__,
	      index = _assocIndexOf(data, key);

	  if (index < 0) {
	    return false;
	  }
	  var lastIndex = data.length - 1;
	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice.call(data, index, 1);
	  }
	  --this.size;
	  return true;
	}

	var _listCacheDelete = listCacheDelete;

	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet(key) {
	  var data = this.__data__,
	      index = _assocIndexOf(data, key);

	  return index < 0 ? undefined : data[index][1];
	}

	var _listCacheGet = listCacheGet;

	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas(key) {
	  return _assocIndexOf(this.__data__, key) > -1;
	}

	var _listCacheHas = listCacheHas;

	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet(key, value) {
	  var data = this.__data__,
	      index = _assocIndexOf(data, key);

	  if (index < 0) {
	    ++this.size;
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }
	  return this;
	}

	var _listCacheSet = listCacheSet;

	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `ListCache`.
	ListCache.prototype.clear = _listCacheClear;
	ListCache.prototype['delete'] = _listCacheDelete;
	ListCache.prototype.get = _listCacheGet;
	ListCache.prototype.has = _listCacheHas;
	ListCache.prototype.set = _listCacheSet;

	var _ListCache = ListCache;

	/**
	 * Removes all key-value entries from the stack.
	 *
	 * @private
	 * @name clear
	 * @memberOf Stack
	 */
	function stackClear() {
	  this.__data__ = new _ListCache;
	  this.size = 0;
	}

	var _stackClear = stackClear;

	/**
	 * Removes `key` and its value from the stack.
	 *
	 * @private
	 * @name delete
	 * @memberOf Stack
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function stackDelete(key) {
	  var data = this.__data__,
	      result = data['delete'](key);

	  this.size = data.size;
	  return result;
	}

	var _stackDelete = stackDelete;

	/**
	 * Gets the stack value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Stack
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function stackGet(key) {
	  return this.__data__.get(key);
	}

	var _stackGet = stackGet;

	/**
	 * Checks if a stack value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Stack
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function stackHas(key) {
	  return this.__data__.has(key);
	}

	var _stackHas = stackHas;

	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

	var _freeGlobal = freeGlobal;

	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

	/** Used as a reference to the global object. */
	var root = _freeGlobal || freeSelf || Function('return this')();

	var _root = root;

	/** Built-in value references. */
	var Symbol$1 = _root.Symbol;

	var _Symbol = Symbol$1;

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = objectProto.toString;

	/** Built-in value references. */
	var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

	/**
	 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the raw `toStringTag`.
	 */
	function getRawTag(value) {
	  var isOwn = hasOwnProperty.call(value, symToStringTag),
	      tag = value[symToStringTag];

	  try {
	    value[symToStringTag] = undefined;
	    var unmasked = true;
	  } catch (e) {}

	  var result = nativeObjectToString.call(value);
	  if (unmasked) {
	    if (isOwn) {
	      value[symToStringTag] = tag;
	    } else {
	      delete value[symToStringTag];
	    }
	  }
	  return result;
	}

	var _getRawTag = getRawTag;

	/** Used for built-in method references. */
	var objectProto$1 = Object.prototype;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString$1 = objectProto$1.toString;

	/**
	 * Converts `value` to a string using `Object.prototype.toString`.
	 *
	 * @private
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 */
	function objectToString(value) {
	  return nativeObjectToString$1.call(value);
	}

	var _objectToString = objectToString;

	/** `Object#toString` result references. */
	var nullTag = '[object Null]',
	    undefinedTag = '[object Undefined]';

	/** Built-in value references. */
	var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

	/**
	 * The base implementation of `getTag` without fallbacks for buggy environments.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	function baseGetTag(value) {
	  if (value == null) {
	    return value === undefined ? undefinedTag : nullTag;
	  }
	  return (symToStringTag$1 && symToStringTag$1 in Object(value))
	    ? _getRawTag(value)
	    : _objectToString(value);
	}

	var _baseGetTag = baseGetTag;

	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  var type = typeof value;
	  return value != null && (type == 'object' || type == 'function');
	}

	var isObject_1 = isObject;

	/** `Object#toString` result references. */
	var asyncTag = '[object AsyncFunction]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    proxyTag = '[object Proxy]';

	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  if (!isObject_1(value)) {
	    return false;
	  }
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 9 which returns 'object' for typed arrays and other constructors.
	  var tag = _baseGetTag(value);
	  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
	}

	var isFunction_1 = isFunction;

	/** Used to detect overreaching core-js shims. */
	var coreJsData = _root['__core-js_shared__'];

	var _coreJsData = coreJsData;

	/** Used to detect methods masquerading as native. */
	var maskSrcKey = (function() {
	  var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
	  return uid ? ('Symbol(src)_1.' + uid) : '';
	}());

	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked(func) {
	  return !!maskSrcKey && (maskSrcKey in func);
	}

	var _isMasked = isMasked;

	/** Used for built-in method references. */
	var funcProto = Function.prototype;

	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;

	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to convert.
	 * @returns {string} Returns the source code.
	 */
	function toSource(func) {
	  if (func != null) {
	    try {
	      return funcToString.call(func);
	    } catch (e) {}
	    try {
	      return (func + '');
	    } catch (e) {}
	  }
	  return '';
	}

	var _toSource = toSource;

	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;

	/** Used for built-in method references. */
	var funcProto$1 = Function.prototype,
	    objectProto$2 = Object.prototype;

	/** Used to resolve the decompiled source of functions. */
	var funcToString$1 = funcProto$1.toString;

	/** Used to check objects for own properties. */
	var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	  funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);

	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative(value) {
	  if (!isObject_1(value) || _isMasked(value)) {
	    return false;
	  }
	  var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
	  return pattern.test(_toSource(value));
	}

	var _baseIsNative = baseIsNative;

	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function getValue(object, key) {
	  return object == null ? undefined : object[key];
	}

	var _getValue = getValue;

	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	  var value = _getValue(object, key);
	  return _baseIsNative(value) ? value : undefined;
	}

	var _getNative = getNative;

	/* Built-in method references that are verified to be native. */
	var Map = _getNative(_root, 'Map');

	var _Map = Map;

	/* Built-in method references that are verified to be native. */
	var nativeCreate = _getNative(Object, 'create');

	var _nativeCreate = nativeCreate;

	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear() {
	  this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
	  this.size = 0;
	}

	var _hashClear = hashClear;

	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete(key) {
	  var result = this.has(key) && delete this.__data__[key];
	  this.size -= result ? 1 : 0;
	  return result;
	}

	var _hashDelete = hashDelete;

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';

	/** Used for built-in method references. */
	var objectProto$3 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(key) {
	  var data = this.__data__;
	  if (_nativeCreate) {
	    var result = data[key];
	    return result === HASH_UNDEFINED ? undefined : result;
	  }
	  return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
	}

	var _hashGet = hashGet;

	/** Used for built-in method references. */
	var objectProto$4 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(key) {
	  var data = this.__data__;
	  return _nativeCreate ? (data[key] !== undefined) : hasOwnProperty$3.call(data, key);
	}

	var _hashHas = hashHas;

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet(key, value) {
	  var data = this.__data__;
	  this.size += this.has(key) ? 0 : 1;
	  data[key] = (_nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
	  return this;
	}

	var _hashSet = hashSet;

	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `Hash`.
	Hash.prototype.clear = _hashClear;
	Hash.prototype['delete'] = _hashDelete;
	Hash.prototype.get = _hashGet;
	Hash.prototype.has = _hashHas;
	Hash.prototype.set = _hashSet;

	var _Hash = Hash;

	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear() {
	  this.size = 0;
	  this.__data__ = {
	    'hash': new _Hash,
	    'map': new (_Map || _ListCache),
	    'string': new _Hash
	  };
	}

	var _mapCacheClear = mapCacheClear;

	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
	  var type = typeof value;
	  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
	    ? (value !== '__proto__')
	    : (value === null);
	}

	var _isKeyable = isKeyable;

	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData(map, key) {
	  var data = map.__data__;
	  return _isKeyable(key)
	    ? data[typeof key == 'string' ? 'string' : 'hash']
	    : data.map;
	}

	var _getMapData = getMapData;

	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete(key) {
	  var result = _getMapData(this, key)['delete'](key);
	  this.size -= result ? 1 : 0;
	  return result;
	}

	var _mapCacheDelete = mapCacheDelete;

	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet(key) {
	  return _getMapData(this, key).get(key);
	}

	var _mapCacheGet = mapCacheGet;

	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas(key) {
	  return _getMapData(this, key).has(key);
	}

	var _mapCacheHas = mapCacheHas;

	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet(key, value) {
	  var data = _getMapData(this, key),
	      size = data.size;

	  data.set(key, value);
	  this.size += data.size == size ? 0 : 1;
	  return this;
	}

	var _mapCacheSet = mapCacheSet;

	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `MapCache`.
	MapCache.prototype.clear = _mapCacheClear;
	MapCache.prototype['delete'] = _mapCacheDelete;
	MapCache.prototype.get = _mapCacheGet;
	MapCache.prototype.has = _mapCacheHas;
	MapCache.prototype.set = _mapCacheSet;

	var _MapCache = MapCache;

	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE = 200;

	/**
	 * Sets the stack `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Stack
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the stack cache instance.
	 */
	function stackSet(key, value) {
	  var data = this.__data__;
	  if (data instanceof _ListCache) {
	    var pairs = data.__data__;
	    if (!_Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
	      pairs.push([key, value]);
	      this.size = ++data.size;
	      return this;
	    }
	    data = this.__data__ = new _MapCache(pairs);
	  }
	  data.set(key, value);
	  this.size = data.size;
	  return this;
	}

	var _stackSet = stackSet;

	/**
	 * Creates a stack cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Stack(entries) {
	  var data = this.__data__ = new _ListCache(entries);
	  this.size = data.size;
	}

	// Add methods to `Stack`.
	Stack.prototype.clear = _stackClear;
	Stack.prototype['delete'] = _stackDelete;
	Stack.prototype.get = _stackGet;
	Stack.prototype.has = _stackHas;
	Stack.prototype.set = _stackSet;

	var _Stack = Stack;

	/**
	 * A specialized version of `_.forEach` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns `array`.
	 */
	function arrayEach(array, iteratee) {
	  var index = -1,
	      length = array == null ? 0 : array.length;

	  while (++index < length) {
	    if (iteratee(array[index], index, array) === false) {
	      break;
	    }
	  }
	  return array;
	}

	var _arrayEach = arrayEach;

	var defineProperty = (function() {
	  try {
	    var func = _getNative(Object, 'defineProperty');
	    func({}, '', {});
	    return func;
	  } catch (e) {}
	}());

	var _defineProperty = defineProperty;

	/**
	 * The base implementation of `assignValue` and `assignMergeValue` without
	 * value checks.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function baseAssignValue(object, key, value) {
	  if (key == '__proto__' && _defineProperty) {
	    _defineProperty(object, key, {
	      'configurable': true,
	      'enumerable': true,
	      'value': value,
	      'writable': true
	    });
	  } else {
	    object[key] = value;
	  }
	}

	var _baseAssignValue = baseAssignValue;

	/** Used for built-in method references. */
	var objectProto$5 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

	/**
	 * Assigns `value` to `key` of `object` if the existing value is not equivalent
	 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * for equality comparisons.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function assignValue(object, key, value) {
	  var objValue = object[key];
	  if (!(hasOwnProperty$4.call(object, key) && eq_1(objValue, value)) ||
	      (value === undefined && !(key in object))) {
	    _baseAssignValue(object, key, value);
	  }
	}

	var _assignValue = assignValue;

	/**
	 * Copies properties of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy properties from.
	 * @param {Array} props The property identifiers to copy.
	 * @param {Object} [object={}] The object to copy properties to.
	 * @param {Function} [customizer] The function to customize copied values.
	 * @returns {Object} Returns `object`.
	 */
	function copyObject(source, props, object, customizer) {
	  var isNew = !object;
	  object || (object = {});

	  var index = -1,
	      length = props.length;

	  while (++index < length) {
	    var key = props[index];

	    var newValue = customizer
	      ? customizer(object[key], source[key], key, object, source)
	      : undefined;

	    if (newValue === undefined) {
	      newValue = source[key];
	    }
	    if (isNew) {
	      _baseAssignValue(object, key, newValue);
	    } else {
	      _assignValue(object, key, newValue);
	    }
	  }
	  return object;
	}

	var _copyObject = copyObject;

	/**
	 * The base implementation of `_.times` without support for iteratee shorthands
	 * or max array length checks.
	 *
	 * @private
	 * @param {number} n The number of times to invoke `iteratee`.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the array of results.
	 */
	function baseTimes(n, iteratee) {
	  var index = -1,
	      result = Array(n);

	  while (++index < n) {
	    result[index] = iteratee(index);
	  }
	  return result;
	}

	var _baseTimes = baseTimes;

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return value != null && typeof value == 'object';
	}

	var isObjectLike_1 = isObjectLike;

	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]';

	/**
	 * The base implementation of `_.isArguments`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 */
	function baseIsArguments(value) {
	  return isObjectLike_1(value) && _baseGetTag(value) == argsTag;
	}

	var _baseIsArguments = baseIsArguments;

	/** Used for built-in method references. */
	var objectProto$6 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$5 = objectProto$6.hasOwnProperty;

	/** Built-in value references. */
	var propertyIsEnumerable = objectProto$6.propertyIsEnumerable;

	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
	  return isObjectLike_1(value) && hasOwnProperty$5.call(value, 'callee') &&
	    !propertyIsEnumerable.call(value, 'callee');
	};

	var isArguments_1 = isArguments;

	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;

	var isArray_1 = isArray;

	/**
	 * This method returns `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {boolean} Returns `false`.
	 * @example
	 *
	 * _.times(2, _.stubFalse);
	 * // => [false, false]
	 */
	function stubFalse() {
	  return false;
	}

	var stubFalse_1 = stubFalse;

	var isBuffer_1 = createCommonjsModule(function (module, exports) {
	/** Detect free variable `exports`. */
	var freeExports =  exports && !exports.nodeType && exports;

	/** Detect free variable `module`. */
	var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports = freeModule && freeModule.exports === freeExports;

	/** Built-in value references. */
	var Buffer = moduleExports ? _root.Buffer : undefined;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

	/**
	 * Checks if `value` is a buffer.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
	 * @example
	 *
	 * _.isBuffer(new Buffer(2));
	 * // => true
	 *
	 * _.isBuffer(new Uint8Array(2));
	 * // => false
	 */
	var isBuffer = nativeIsBuffer || stubFalse_1;

	module.exports = isBuffer;
	});

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;

	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;

	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  var type = typeof value;
	  length = length == null ? MAX_SAFE_INTEGER : length;

	  return !!length &&
	    (type == 'number' ||
	      (type != 'symbol' && reIsUint.test(value))) &&
	        (value > -1 && value % 1 == 0 && value < length);
	}

	var _isIndex = isIndex;

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER$1 = 9007199254740991;

	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength(value) {
	  return typeof value == 'number' &&
	    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
	}

	var isLength_1 = isLength;

	/** `Object#toString` result references. */
	var argsTag$1 = '[object Arguments]',
	    arrayTag = '[object Array]',
	    boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    funcTag$1 = '[object Function]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    objectTag = '[object Object]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    weakMapTag = '[object WeakMap]';

	var arrayBufferTag = '[object ArrayBuffer]',
	    dataViewTag = '[object DataView]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';

	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags = {};
	typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
	typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
	typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
	typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
	typedArrayTags[uint32Tag] = true;
	typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
	typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
	typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
	typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
	typedArrayTags[mapTag] = typedArrayTags[numberTag] =
	typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
	typedArrayTags[setTag] = typedArrayTags[stringTag] =
	typedArrayTags[weakMapTag] = false;

	/**
	 * The base implementation of `_.isTypedArray` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 */
	function baseIsTypedArray(value) {
	  return isObjectLike_1(value) &&
	    isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
	}

	var _baseIsTypedArray = baseIsTypedArray;

	/**
	 * The base implementation of `_.unary` without support for storing metadata.
	 *
	 * @private
	 * @param {Function} func The function to cap arguments for.
	 * @returns {Function} Returns the new capped function.
	 */
	function baseUnary(func) {
	  return function(value) {
	    return func(value);
	  };
	}

	var _baseUnary = baseUnary;

	var _nodeUtil = createCommonjsModule(function (module, exports) {
	/** Detect free variable `exports`. */
	var freeExports =  exports && !exports.nodeType && exports;

	/** Detect free variable `module`. */
	var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports = freeModule && freeModule.exports === freeExports;

	/** Detect free variable `process` from Node.js. */
	var freeProcess = moduleExports && _freeGlobal.process;

	/** Used to access faster Node.js helpers. */
	var nodeUtil = (function() {
	  try {
	    // Use `util.types` for Node.js 10+.
	    var types = freeModule && freeModule.require && freeModule.require('util').types;

	    if (types) {
	      return types;
	    }

	    // Legacy `process.binding('util')` for Node.js < 10.
	    return freeProcess && freeProcess.binding && freeProcess.binding('util');
	  } catch (e) {}
	}());

	module.exports = nodeUtil;
	});

	/* Node.js helper references. */
	var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;

	/**
	 * Checks if `value` is classified as a typed array.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 * @example
	 *
	 * _.isTypedArray(new Uint8Array);
	 * // => true
	 *
	 * _.isTypedArray([]);
	 * // => false
	 */
	var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;

	var isTypedArray_1 = isTypedArray;

	/** Used for built-in method references. */
	var objectProto$7 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$6 = objectProto$7.hasOwnProperty;

	/**
	 * Creates an array of the enumerable property names of the array-like `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @param {boolean} inherited Specify returning inherited property names.
	 * @returns {Array} Returns the array of property names.
	 */
	function arrayLikeKeys(value, inherited) {
	  var isArr = isArray_1(value),
	      isArg = !isArr && isArguments_1(value),
	      isBuff = !isArr && !isArg && isBuffer_1(value),
	      isType = !isArr && !isArg && !isBuff && isTypedArray_1(value),
	      skipIndexes = isArr || isArg || isBuff || isType,
	      result = skipIndexes ? _baseTimes(value.length, String) : [],
	      length = result.length;

	  for (var key in value) {
	    if ((inherited || hasOwnProperty$6.call(value, key)) &&
	        !(skipIndexes && (
	           // Safari 9 has enumerable `arguments.length` in strict mode.
	           key == 'length' ||
	           // Node.js 0.10 has enumerable non-index properties on buffers.
	           (isBuff && (key == 'offset' || key == 'parent')) ||
	           // PhantomJS 2 has enumerable non-index properties on typed arrays.
	           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
	           // Skip index properties.
	           _isIndex(key, length)
	        ))) {
	      result.push(key);
	    }
	  }
	  return result;
	}

	var _arrayLikeKeys = arrayLikeKeys;

	/** Used for built-in method references. */
	var objectProto$8 = Object.prototype;

	/**
	 * Checks if `value` is likely a prototype object.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	 */
	function isPrototype(value) {
	  var Ctor = value && value.constructor,
	      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$8;

	  return value === proto;
	}

	var _isPrototype = isPrototype;

	/**
	 * Creates a unary function that invokes `func` with its argument transformed.
	 *
	 * @private
	 * @param {Function} func The function to wrap.
	 * @param {Function} transform The argument transform.
	 * @returns {Function} Returns the new function.
	 */
	function overArg(func, transform) {
	  return function(arg) {
	    return func(transform(arg));
	  };
	}

	var _overArg = overArg;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeKeys = _overArg(Object.keys, Object);

	var _nativeKeys = nativeKeys;

	/** Used for built-in method references. */
	var objectProto$9 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$7 = objectProto$9.hasOwnProperty;

	/**
	 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeys(object) {
	  if (!_isPrototype(object)) {
	    return _nativeKeys(object);
	  }
	  var result = [];
	  for (var key in Object(object)) {
	    if (hasOwnProperty$7.call(object, key) && key != 'constructor') {
	      result.push(key);
	    }
	  }
	  return result;
	}

	var _baseKeys = baseKeys;

	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike(value) {
	  return value != null && isLength_1(value.length) && !isFunction_1(value);
	}

	var isArrayLike_1 = isArrayLike;

	/**
	 * Creates an array of the own enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects. See the
	 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * for more details.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keys(new Foo);
	 * // => ['a', 'b'] (iteration order is not guaranteed)
	 *
	 * _.keys('hi');
	 * // => ['0', '1']
	 */
	function keys(object) {
	  return isArrayLike_1(object) ? _arrayLikeKeys(object) : _baseKeys(object);
	}

	var keys_1 = keys;

	/**
	 * The base implementation of `_.assign` without support for multiple sources
	 * or `customizer` functions.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @returns {Object} Returns `object`.
	 */
	function baseAssign(object, source) {
	  return object && _copyObject(source, keys_1(source), object);
	}

	var _baseAssign = baseAssign;

	/**
	 * This function is like
	 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * except that it includes inherited enumerable properties.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function nativeKeysIn(object) {
	  var result = [];
	  if (object != null) {
	    for (var key in Object(object)) {
	      result.push(key);
	    }
	  }
	  return result;
	}

	var _nativeKeysIn = nativeKeysIn;

	/** Used for built-in method references. */
	var objectProto$a = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$8 = objectProto$a.hasOwnProperty;

	/**
	 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeysIn(object) {
	  if (!isObject_1(object)) {
	    return _nativeKeysIn(object);
	  }
	  var isProto = _isPrototype(object),
	      result = [];

	  for (var key in object) {
	    if (!(key == 'constructor' && (isProto || !hasOwnProperty$8.call(object, key)))) {
	      result.push(key);
	    }
	  }
	  return result;
	}

	var _baseKeysIn = baseKeysIn;

	/**
	 * Creates an array of the own and inherited enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keysIn(new Foo);
	 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
	 */
	function keysIn(object) {
	  return isArrayLike_1(object) ? _arrayLikeKeys(object, true) : _baseKeysIn(object);
	}

	var keysIn_1 = keysIn;

	/**
	 * The base implementation of `_.assignIn` without support for multiple sources
	 * or `customizer` functions.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @returns {Object} Returns `object`.
	 */
	function baseAssignIn(object, source) {
	  return object && _copyObject(source, keysIn_1(source), object);
	}

	var _baseAssignIn = baseAssignIn;

	var _cloneBuffer = createCommonjsModule(function (module, exports) {
	/** Detect free variable `exports`. */
	var freeExports =  exports && !exports.nodeType && exports;

	/** Detect free variable `module`. */
	var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports = freeModule && freeModule.exports === freeExports;

	/** Built-in value references. */
	var Buffer = moduleExports ? _root.Buffer : undefined,
	    allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

	/**
	 * Creates a clone of  `buffer`.
	 *
	 * @private
	 * @param {Buffer} buffer The buffer to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Buffer} Returns the cloned buffer.
	 */
	function cloneBuffer(buffer, isDeep) {
	  if (isDeep) {
	    return buffer.slice();
	  }
	  var length = buffer.length,
	      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

	  buffer.copy(result);
	  return result;
	}

	module.exports = cloneBuffer;
	});

	/**
	 * Copies the values of `source` to `array`.
	 *
	 * @private
	 * @param {Array} source The array to copy values from.
	 * @param {Array} [array=[]] The array to copy values to.
	 * @returns {Array} Returns `array`.
	 */
	function copyArray(source, array) {
	  var index = -1,
	      length = source.length;

	  array || (array = Array(length));
	  while (++index < length) {
	    array[index] = source[index];
	  }
	  return array;
	}

	var _copyArray = copyArray;

	/**
	 * A specialized version of `_.filter` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {Array} Returns the new filtered array.
	 */
	function arrayFilter(array, predicate) {
	  var index = -1,
	      length = array == null ? 0 : array.length,
	      resIndex = 0,
	      result = [];

	  while (++index < length) {
	    var value = array[index];
	    if (predicate(value, index, array)) {
	      result[resIndex++] = value;
	    }
	  }
	  return result;
	}

	var _arrayFilter = arrayFilter;

	/**
	 * This method returns a new empty array.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {Array} Returns the new empty array.
	 * @example
	 *
	 * var arrays = _.times(2, _.stubArray);
	 *
	 * console.log(arrays);
	 * // => [[], []]
	 *
	 * console.log(arrays[0] === arrays[1]);
	 * // => false
	 */
	function stubArray() {
	  return [];
	}

	var stubArray_1 = stubArray;

	/** Used for built-in method references. */
	var objectProto$b = Object.prototype;

	/** Built-in value references. */
	var propertyIsEnumerable$1 = objectProto$b.propertyIsEnumerable;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeGetSymbols = Object.getOwnPropertySymbols;

	/**
	 * Creates an array of the own enumerable symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of symbols.
	 */
	var getSymbols = !nativeGetSymbols ? stubArray_1 : function(object) {
	  if (object == null) {
	    return [];
	  }
	  object = Object(object);
	  return _arrayFilter(nativeGetSymbols(object), function(symbol) {
	    return propertyIsEnumerable$1.call(object, symbol);
	  });
	};

	var _getSymbols = getSymbols;

	/**
	 * Copies own symbols of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy symbols from.
	 * @param {Object} [object={}] The object to copy symbols to.
	 * @returns {Object} Returns `object`.
	 */
	function copySymbols(source, object) {
	  return _copyObject(source, _getSymbols(source), object);
	}

	var _copySymbols = copySymbols;

	/**
	 * Appends the elements of `values` to `array`.
	 *
	 * @private
	 * @param {Array} array The array to modify.
	 * @param {Array} values The values to append.
	 * @returns {Array} Returns `array`.
	 */
	function arrayPush(array, values) {
	  var index = -1,
	      length = values.length,
	      offset = array.length;

	  while (++index < length) {
	    array[offset + index] = values[index];
	  }
	  return array;
	}

	var _arrayPush = arrayPush;

	/** Built-in value references. */
	var getPrototype = _overArg(Object.getPrototypeOf, Object);

	var _getPrototype = getPrototype;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeGetSymbols$1 = Object.getOwnPropertySymbols;

	/**
	 * Creates an array of the own and inherited enumerable symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of symbols.
	 */
	var getSymbolsIn = !nativeGetSymbols$1 ? stubArray_1 : function(object) {
	  var result = [];
	  while (object) {
	    _arrayPush(result, _getSymbols(object));
	    object = _getPrototype(object);
	  }
	  return result;
	};

	var _getSymbolsIn = getSymbolsIn;

	/**
	 * Copies own and inherited symbols of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy symbols from.
	 * @param {Object} [object={}] The object to copy symbols to.
	 * @returns {Object} Returns `object`.
	 */
	function copySymbolsIn(source, object) {
	  return _copyObject(source, _getSymbolsIn(source), object);
	}

	var _copySymbolsIn = copySymbolsIn;

	/**
	 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
	 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
	 * symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @param {Function} symbolsFunc The function to get the symbols of `object`.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function baseGetAllKeys(object, keysFunc, symbolsFunc) {
	  var result = keysFunc(object);
	  return isArray_1(object) ? result : _arrayPush(result, symbolsFunc(object));
	}

	var _baseGetAllKeys = baseGetAllKeys;

	/**
	 * Creates an array of own enumerable property names and symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function getAllKeys(object) {
	  return _baseGetAllKeys(object, keys_1, _getSymbols);
	}

	var _getAllKeys = getAllKeys;

	/**
	 * Creates an array of own and inherited enumerable property names and
	 * symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function getAllKeysIn(object) {
	  return _baseGetAllKeys(object, keysIn_1, _getSymbolsIn);
	}

	var _getAllKeysIn = getAllKeysIn;

	/* Built-in method references that are verified to be native. */
	var DataView$1 = _getNative(_root, 'DataView');

	var _DataView = DataView$1;

	/* Built-in method references that are verified to be native. */
	var Promise$1 = _getNative(_root, 'Promise');

	var _Promise = Promise$1;

	/* Built-in method references that are verified to be native. */
	var Set$1 = _getNative(_root, 'Set');

	var _Set = Set$1;

	/* Built-in method references that are verified to be native. */
	var WeakMap = _getNative(_root, 'WeakMap');

	var _WeakMap = WeakMap;

	/** `Object#toString` result references. */
	var mapTag$1 = '[object Map]',
	    objectTag$1 = '[object Object]',
	    promiseTag = '[object Promise]',
	    setTag$1 = '[object Set]',
	    weakMapTag$1 = '[object WeakMap]';

	var dataViewTag$1 = '[object DataView]';

	/** Used to detect maps, sets, and weakmaps. */
	var dataViewCtorString = _toSource(_DataView),
	    mapCtorString = _toSource(_Map),
	    promiseCtorString = _toSource(_Promise),
	    setCtorString = _toSource(_Set),
	    weakMapCtorString = _toSource(_WeakMap);

	/**
	 * Gets the `toStringTag` of `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	var getTag = _baseGetTag;

	// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
	if ((_DataView && getTag(new _DataView(new ArrayBuffer(1))) != dataViewTag$1) ||
	    (_Map && getTag(new _Map) != mapTag$1) ||
	    (_Promise && getTag(_Promise.resolve()) != promiseTag) ||
	    (_Set && getTag(new _Set) != setTag$1) ||
	    (_WeakMap && getTag(new _WeakMap) != weakMapTag$1)) {
	  getTag = function(value) {
	    var result = _baseGetTag(value),
	        Ctor = result == objectTag$1 ? value.constructor : undefined,
	        ctorString = Ctor ? _toSource(Ctor) : '';

	    if (ctorString) {
	      switch (ctorString) {
	        case dataViewCtorString: return dataViewTag$1;
	        case mapCtorString: return mapTag$1;
	        case promiseCtorString: return promiseTag;
	        case setCtorString: return setTag$1;
	        case weakMapCtorString: return weakMapTag$1;
	      }
	    }
	    return result;
	  };
	}

	var _getTag = getTag;

	/** Used for built-in method references. */
	var objectProto$c = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$9 = objectProto$c.hasOwnProperty;

	/**
	 * Initializes an array clone.
	 *
	 * @private
	 * @param {Array} array The array to clone.
	 * @returns {Array} Returns the initialized clone.
	 */
	function initCloneArray(array) {
	  var length = array.length,
	      result = new array.constructor(length);

	  // Add properties assigned by `RegExp#exec`.
	  if (length && typeof array[0] == 'string' && hasOwnProperty$9.call(array, 'index')) {
	    result.index = array.index;
	    result.input = array.input;
	  }
	  return result;
	}

	var _initCloneArray = initCloneArray;

	/** Built-in value references. */
	var Uint8Array = _root.Uint8Array;

	var _Uint8Array = Uint8Array;

	/**
	 * Creates a clone of `arrayBuffer`.
	 *
	 * @private
	 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
	 * @returns {ArrayBuffer} Returns the cloned array buffer.
	 */
	function cloneArrayBuffer(arrayBuffer) {
	  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
	  new _Uint8Array(result).set(new _Uint8Array(arrayBuffer));
	  return result;
	}

	var _cloneArrayBuffer = cloneArrayBuffer;

	/**
	 * Creates a clone of `dataView`.
	 *
	 * @private
	 * @param {Object} dataView The data view to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned data view.
	 */
	function cloneDataView(dataView, isDeep) {
	  var buffer = isDeep ? _cloneArrayBuffer(dataView.buffer) : dataView.buffer;
	  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
	}

	var _cloneDataView = cloneDataView;

	/** Used to match `RegExp` flags from their coerced string values. */
	var reFlags = /\w*$/;

	/**
	 * Creates a clone of `regexp`.
	 *
	 * @private
	 * @param {Object} regexp The regexp to clone.
	 * @returns {Object} Returns the cloned regexp.
	 */
	function cloneRegExp(regexp) {
	  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
	  result.lastIndex = regexp.lastIndex;
	  return result;
	}

	var _cloneRegExp = cloneRegExp;

	/** Used to convert symbols to primitives and strings. */
	var symbolProto = _Symbol ? _Symbol.prototype : undefined,
	    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

	/**
	 * Creates a clone of the `symbol` object.
	 *
	 * @private
	 * @param {Object} symbol The symbol object to clone.
	 * @returns {Object} Returns the cloned symbol object.
	 */
	function cloneSymbol(symbol) {
	  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
	}

	var _cloneSymbol = cloneSymbol;

	/**
	 * Creates a clone of `typedArray`.
	 *
	 * @private
	 * @param {Object} typedArray The typed array to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned typed array.
	 */
	function cloneTypedArray(typedArray, isDeep) {
	  var buffer = isDeep ? _cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
	  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
	}

	var _cloneTypedArray = cloneTypedArray;

	/** `Object#toString` result references. */
	var boolTag$1 = '[object Boolean]',
	    dateTag$1 = '[object Date]',
	    mapTag$2 = '[object Map]',
	    numberTag$1 = '[object Number]',
	    regexpTag$1 = '[object RegExp]',
	    setTag$2 = '[object Set]',
	    stringTag$1 = '[object String]',
	    symbolTag = '[object Symbol]';

	var arrayBufferTag$1 = '[object ArrayBuffer]',
	    dataViewTag$2 = '[object DataView]',
	    float32Tag$1 = '[object Float32Array]',
	    float64Tag$1 = '[object Float64Array]',
	    int8Tag$1 = '[object Int8Array]',
	    int16Tag$1 = '[object Int16Array]',
	    int32Tag$1 = '[object Int32Array]',
	    uint8Tag$1 = '[object Uint8Array]',
	    uint8ClampedTag$1 = '[object Uint8ClampedArray]',
	    uint16Tag$1 = '[object Uint16Array]',
	    uint32Tag$1 = '[object Uint32Array]';

	/**
	 * Initializes an object clone based on its `toStringTag`.
	 *
	 * **Note:** This function only supports cloning values with tags of
	 * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @param {string} tag The `toStringTag` of the object to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneByTag(object, tag, isDeep) {
	  var Ctor = object.constructor;
	  switch (tag) {
	    case arrayBufferTag$1:
	      return _cloneArrayBuffer(object);

	    case boolTag$1:
	    case dateTag$1:
	      return new Ctor(+object);

	    case dataViewTag$2:
	      return _cloneDataView(object, isDeep);

	    case float32Tag$1: case float64Tag$1:
	    case int8Tag$1: case int16Tag$1: case int32Tag$1:
	    case uint8Tag$1: case uint8ClampedTag$1: case uint16Tag$1: case uint32Tag$1:
	      return _cloneTypedArray(object, isDeep);

	    case mapTag$2:
	      return new Ctor;

	    case numberTag$1:
	    case stringTag$1:
	      return new Ctor(object);

	    case regexpTag$1:
	      return _cloneRegExp(object);

	    case setTag$2:
	      return new Ctor;

	    case symbolTag:
	      return _cloneSymbol(object);
	  }
	}

	var _initCloneByTag = initCloneByTag;

	/** Built-in value references. */
	var objectCreate = Object.create;

	/**
	 * The base implementation of `_.create` without support for assigning
	 * properties to the created object.
	 *
	 * @private
	 * @param {Object} proto The object to inherit from.
	 * @returns {Object} Returns the new object.
	 */
	var baseCreate = (function() {
	  function object() {}
	  return function(proto) {
	    if (!isObject_1(proto)) {
	      return {};
	    }
	    if (objectCreate) {
	      return objectCreate(proto);
	    }
	    object.prototype = proto;
	    var result = new object;
	    object.prototype = undefined;
	    return result;
	  };
	}());

	var _baseCreate = baseCreate;

	/**
	 * Initializes an object clone.
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneObject(object) {
	  return (typeof object.constructor == 'function' && !_isPrototype(object))
	    ? _baseCreate(_getPrototype(object))
	    : {};
	}

	var _initCloneObject = initCloneObject;

	/** `Object#toString` result references. */
	var mapTag$3 = '[object Map]';

	/**
	 * The base implementation of `_.isMap` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
	 */
	function baseIsMap(value) {
	  return isObjectLike_1(value) && _getTag(value) == mapTag$3;
	}

	var _baseIsMap = baseIsMap;

	/* Node.js helper references. */
	var nodeIsMap = _nodeUtil && _nodeUtil.isMap;

	/**
	 * Checks if `value` is classified as a `Map` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
	 * @example
	 *
	 * _.isMap(new Map);
	 * // => true
	 *
	 * _.isMap(new WeakMap);
	 * // => false
	 */
	var isMap = nodeIsMap ? _baseUnary(nodeIsMap) : _baseIsMap;

	var isMap_1 = isMap;

	/** `Object#toString` result references. */
	var setTag$3 = '[object Set]';

	/**
	 * The base implementation of `_.isSet` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
	 */
	function baseIsSet(value) {
	  return isObjectLike_1(value) && _getTag(value) == setTag$3;
	}

	var _baseIsSet = baseIsSet;

	/* Node.js helper references. */
	var nodeIsSet = _nodeUtil && _nodeUtil.isSet;

	/**
	 * Checks if `value` is classified as a `Set` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
	 * @example
	 *
	 * _.isSet(new Set);
	 * // => true
	 *
	 * _.isSet(new WeakSet);
	 * // => false
	 */
	var isSet = nodeIsSet ? _baseUnary(nodeIsSet) : _baseIsSet;

	var isSet_1 = isSet;

	/** Used to compose bitmasks for cloning. */
	var CLONE_DEEP_FLAG = 1,
	    CLONE_FLAT_FLAG = 2,
	    CLONE_SYMBOLS_FLAG = 4;

	/** `Object#toString` result references. */
	var argsTag$2 = '[object Arguments]',
	    arrayTag$1 = '[object Array]',
	    boolTag$2 = '[object Boolean]',
	    dateTag$2 = '[object Date]',
	    errorTag$1 = '[object Error]',
	    funcTag$2 = '[object Function]',
	    genTag$1 = '[object GeneratorFunction]',
	    mapTag$4 = '[object Map]',
	    numberTag$2 = '[object Number]',
	    objectTag$2 = '[object Object]',
	    regexpTag$2 = '[object RegExp]',
	    setTag$4 = '[object Set]',
	    stringTag$2 = '[object String]',
	    symbolTag$1 = '[object Symbol]',
	    weakMapTag$2 = '[object WeakMap]';

	var arrayBufferTag$2 = '[object ArrayBuffer]',
	    dataViewTag$3 = '[object DataView]',
	    float32Tag$2 = '[object Float32Array]',
	    float64Tag$2 = '[object Float64Array]',
	    int8Tag$2 = '[object Int8Array]',
	    int16Tag$2 = '[object Int16Array]',
	    int32Tag$2 = '[object Int32Array]',
	    uint8Tag$2 = '[object Uint8Array]',
	    uint8ClampedTag$2 = '[object Uint8ClampedArray]',
	    uint16Tag$2 = '[object Uint16Array]',
	    uint32Tag$2 = '[object Uint32Array]';

	/** Used to identify `toStringTag` values supported by `_.clone`. */
	var cloneableTags = {};
	cloneableTags[argsTag$2] = cloneableTags[arrayTag$1] =
	cloneableTags[arrayBufferTag$2] = cloneableTags[dataViewTag$3] =
	cloneableTags[boolTag$2] = cloneableTags[dateTag$2] =
	cloneableTags[float32Tag$2] = cloneableTags[float64Tag$2] =
	cloneableTags[int8Tag$2] = cloneableTags[int16Tag$2] =
	cloneableTags[int32Tag$2] = cloneableTags[mapTag$4] =
	cloneableTags[numberTag$2] = cloneableTags[objectTag$2] =
	cloneableTags[regexpTag$2] = cloneableTags[setTag$4] =
	cloneableTags[stringTag$2] = cloneableTags[symbolTag$1] =
	cloneableTags[uint8Tag$2] = cloneableTags[uint8ClampedTag$2] =
	cloneableTags[uint16Tag$2] = cloneableTags[uint32Tag$2] = true;
	cloneableTags[errorTag$1] = cloneableTags[funcTag$2] =
	cloneableTags[weakMapTag$2] = false;

	/**
	 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
	 * traversed objects.
	 *
	 * @private
	 * @param {*} value The value to clone.
	 * @param {boolean} bitmask The bitmask flags.
	 *  1 - Deep clone
	 *  2 - Flatten inherited properties
	 *  4 - Clone symbols
	 * @param {Function} [customizer] The function to customize cloning.
	 * @param {string} [key] The key of `value`.
	 * @param {Object} [object] The parent object of `value`.
	 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
	 * @returns {*} Returns the cloned value.
	 */
	function baseClone(value, bitmask, customizer, key, object, stack) {
	  var result,
	      isDeep = bitmask & CLONE_DEEP_FLAG,
	      isFlat = bitmask & CLONE_FLAT_FLAG,
	      isFull = bitmask & CLONE_SYMBOLS_FLAG;

	  if (customizer) {
	    result = object ? customizer(value, key, object, stack) : customizer(value);
	  }
	  if (result !== undefined) {
	    return result;
	  }
	  if (!isObject_1(value)) {
	    return value;
	  }
	  var isArr = isArray_1(value);
	  if (isArr) {
	    result = _initCloneArray(value);
	    if (!isDeep) {
	      return _copyArray(value, result);
	    }
	  } else {
	    var tag = _getTag(value),
	        isFunc = tag == funcTag$2 || tag == genTag$1;

	    if (isBuffer_1(value)) {
	      return _cloneBuffer(value, isDeep);
	    }
	    if (tag == objectTag$2 || tag == argsTag$2 || (isFunc && !object)) {
	      result = (isFlat || isFunc) ? {} : _initCloneObject(value);
	      if (!isDeep) {
	        return isFlat
	          ? _copySymbolsIn(value, _baseAssignIn(result, value))
	          : _copySymbols(value, _baseAssign(result, value));
	      }
	    } else {
	      if (!cloneableTags[tag]) {
	        return object ? value : {};
	      }
	      result = _initCloneByTag(value, tag, isDeep);
	    }
	  }
	  // Check for circular references and return its corresponding clone.
	  stack || (stack = new _Stack);
	  var stacked = stack.get(value);
	  if (stacked) {
	    return stacked;
	  }
	  stack.set(value, result);

	  if (isSet_1(value)) {
	    value.forEach(function(subValue) {
	      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
	    });
	  } else if (isMap_1(value)) {
	    value.forEach(function(subValue, key) {
	      result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
	    });
	  }

	  var keysFunc = isFull
	    ? (isFlat ? _getAllKeysIn : _getAllKeys)
	    : (isFlat ? keysIn_1 : keys_1);

	  var props = isArr ? undefined : keysFunc(value);
	  _arrayEach(props || value, function(subValue, key) {
	    if (props) {
	      key = subValue;
	      subValue = value[key];
	    }
	    // Recursively populate clone (susceptible to call stack limits).
	    _assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
	  });
	  return result;
	}

	var _baseClone = baseClone;

	/** Used to compose bitmasks for cloning. */
	var CLONE_SYMBOLS_FLAG$1 = 4;

	/**
	 * Creates a shallow clone of `value`.
	 *
	 * **Note:** This method is loosely based on the
	 * [structured clone algorithm](https://mdn.io/Structured_clone_algorithm)
	 * and supports cloning arrays, array buffers, booleans, date objects, maps,
	 * numbers, `Object` objects, regexes, sets, strings, symbols, and typed
	 * arrays. The own enumerable properties of `arguments` objects are cloned
	 * as plain objects. An empty object is returned for uncloneable values such
	 * as error objects, functions, DOM nodes, and WeakMaps.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to clone.
	 * @returns {*} Returns the cloned value.
	 * @see _.cloneDeep
	 * @example
	 *
	 * var objects = [{ 'a': 1 }, { 'b': 2 }];
	 *
	 * var shallow = _.clone(objects);
	 * console.log(shallow[0] === objects[0]);
	 * // => true
	 */
	function clone(value) {
	  return _baseClone(value, CLONE_SYMBOLS_FLAG$1);
	}

	var clone_1 = clone;

	/**
	 * Creates a function that returns `value`.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.4.0
	 * @category Util
	 * @param {*} value The value to return from the new function.
	 * @returns {Function} Returns the new constant function.
	 * @example
	 *
	 * var objects = _.times(2, _.constant({ 'a': 1 }));
	 *
	 * console.log(objects);
	 * // => [{ 'a': 1 }, { 'a': 1 }]
	 *
	 * console.log(objects[0] === objects[1]);
	 * // => true
	 */
	function constant(value) {
	  return function() {
	    return value;
	  };
	}

	var constant_1 = constant;

	/**
	 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
	 *
	 * @private
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {Function} Returns the new base function.
	 */
	function createBaseFor(fromRight) {
	  return function(object, iteratee, keysFunc) {
	    var index = -1,
	        iterable = Object(object),
	        props = keysFunc(object),
	        length = props.length;

	    while (length--) {
	      var key = props[fromRight ? length : ++index];
	      if (iteratee(iterable[key], key, iterable) === false) {
	        break;
	      }
	    }
	    return object;
	  };
	}

	var _createBaseFor = createBaseFor;

	/**
	 * The base implementation of `baseForOwn` which iterates over `object`
	 * properties returned by `keysFunc` and invokes `iteratee` for each property.
	 * Iteratee functions may exit iteration early by explicitly returning `false`.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @returns {Object} Returns `object`.
	 */
	var baseFor = _createBaseFor();

	var _baseFor = baseFor;

	/**
	 * The base implementation of `_.forOwn` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Object} Returns `object`.
	 */
	function baseForOwn(object, iteratee) {
	  return object && _baseFor(object, iteratee, keys_1);
	}

	var _baseForOwn = baseForOwn;

	/**
	 * Creates a `baseEach` or `baseEachRight` function.
	 *
	 * @private
	 * @param {Function} eachFunc The function to iterate over a collection.
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {Function} Returns the new base function.
	 */
	function createBaseEach(eachFunc, fromRight) {
	  return function(collection, iteratee) {
	    if (collection == null) {
	      return collection;
	    }
	    if (!isArrayLike_1(collection)) {
	      return eachFunc(collection, iteratee);
	    }
	    var length = collection.length,
	        index = fromRight ? length : -1,
	        iterable = Object(collection);

	    while ((fromRight ? index-- : ++index < length)) {
	      if (iteratee(iterable[index], index, iterable) === false) {
	        break;
	      }
	    }
	    return collection;
	  };
	}

	var _createBaseEach = createBaseEach;

	/**
	 * The base implementation of `_.forEach` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array|Object} Returns `collection`.
	 */
	var baseEach = _createBaseEach(_baseForOwn);

	var _baseEach = baseEach;

	/**
	 * This method returns the first argument it receives.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Util
	 * @param {*} value Any value.
	 * @returns {*} Returns `value`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 *
	 * console.log(_.identity(object) === object);
	 * // => true
	 */
	function identity(value) {
	  return value;
	}

	var identity_1 = identity;

	/**
	 * Casts `value` to `identity` if it's not a function.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {Function} Returns cast function.
	 */
	function castFunction(value) {
	  return typeof value == 'function' ? value : identity_1;
	}

	var _castFunction = castFunction;

	/**
	 * Iterates over elements of `collection` and invokes `iteratee` for each element.
	 * The iteratee is invoked with three arguments: (value, index|key, collection).
	 * Iteratee functions may exit iteration early by explicitly returning `false`.
	 *
	 * **Note:** As with other "Collections" methods, objects with a "length"
	 * property are iterated like arrays. To avoid this behavior use `_.forIn`
	 * or `_.forOwn` for object iteration.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @alias each
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Array|Object} Returns `collection`.
	 * @see _.forEachRight
	 * @example
	 *
	 * _.forEach([1, 2], function(value) {
	 *   console.log(value);
	 * });
	 * // => Logs `1` then `2`.
	 *
	 * _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
	 *   console.log(key);
	 * });
	 * // => Logs 'a' then 'b' (iteration order is not guaranteed).
	 */
	function forEach(collection, iteratee) {
	  var func = isArray_1(collection) ? _arrayEach : _baseEach;
	  return func(collection, _castFunction(iteratee));
	}

	var forEach_1 = forEach;

	var each = forEach_1;

	/**
	 * The base implementation of `_.filter` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {Array} Returns the new filtered array.
	 */
	function baseFilter(collection, predicate) {
	  var result = [];
	  _baseEach(collection, function(value, index, collection) {
	    if (predicate(value, index, collection)) {
	      result.push(value);
	    }
	  });
	  return result;
	}

	var _baseFilter = baseFilter;

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

	/**
	 * Adds `value` to the array cache.
	 *
	 * @private
	 * @name add
	 * @memberOf SetCache
	 * @alias push
	 * @param {*} value The value to cache.
	 * @returns {Object} Returns the cache instance.
	 */
	function setCacheAdd(value) {
	  this.__data__.set(value, HASH_UNDEFINED$2);
	  return this;
	}

	var _setCacheAdd = setCacheAdd;

	/**
	 * Checks if `value` is in the array cache.
	 *
	 * @private
	 * @name has
	 * @memberOf SetCache
	 * @param {*} value The value to search for.
	 * @returns {number} Returns `true` if `value` is found, else `false`.
	 */
	function setCacheHas(value) {
	  return this.__data__.has(value);
	}

	var _setCacheHas = setCacheHas;

	/**
	 *
	 * Creates an array cache object to store unique values.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [values] The values to cache.
	 */
	function SetCache(values) {
	  var index = -1,
	      length = values == null ? 0 : values.length;

	  this.__data__ = new _MapCache;
	  while (++index < length) {
	    this.add(values[index]);
	  }
	}

	// Add methods to `SetCache`.
	SetCache.prototype.add = SetCache.prototype.push = _setCacheAdd;
	SetCache.prototype.has = _setCacheHas;

	var _SetCache = SetCache;

	/**
	 * A specialized version of `_.some` for arrays without support for iteratee
	 * shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {boolean} Returns `true` if any element passes the predicate check,
	 *  else `false`.
	 */
	function arraySome(array, predicate) {
	  var index = -1,
	      length = array == null ? 0 : array.length;

	  while (++index < length) {
	    if (predicate(array[index], index, array)) {
	      return true;
	    }
	  }
	  return false;
	}

	var _arraySome = arraySome;

	/**
	 * Checks if a `cache` value for `key` exists.
	 *
	 * @private
	 * @param {Object} cache The cache to query.
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function cacheHas(cache, key) {
	  return cache.has(key);
	}

	var _cacheHas = cacheHas;

	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1,
	    COMPARE_UNORDERED_FLAG = 2;

	/**
	 * A specialized version of `baseIsEqualDeep` for arrays with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Array} array The array to compare.
	 * @param {Array} other The other array to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `array` and `other` objects.
	 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
	 */
	function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
	  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
	      arrLength = array.length,
	      othLength = other.length;

	  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
	    return false;
	  }
	  // Check that cyclic values are equal.
	  var arrStacked = stack.get(array);
	  var othStacked = stack.get(other);
	  if (arrStacked && othStacked) {
	    return arrStacked == other && othStacked == array;
	  }
	  var index = -1,
	      result = true,
	      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new _SetCache : undefined;

	  stack.set(array, other);
	  stack.set(other, array);

	  // Ignore non-index properties.
	  while (++index < arrLength) {
	    var arrValue = array[index],
	        othValue = other[index];

	    if (customizer) {
	      var compared = isPartial
	        ? customizer(othValue, arrValue, index, other, array, stack)
	        : customizer(arrValue, othValue, index, array, other, stack);
	    }
	    if (compared !== undefined) {
	      if (compared) {
	        continue;
	      }
	      result = false;
	      break;
	    }
	    // Recursively compare arrays (susceptible to call stack limits).
	    if (seen) {
	      if (!_arraySome(other, function(othValue, othIndex) {
	            if (!_cacheHas(seen, othIndex) &&
	                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
	              return seen.push(othIndex);
	            }
	          })) {
	        result = false;
	        break;
	      }
	    } else if (!(
	          arrValue === othValue ||
	            equalFunc(arrValue, othValue, bitmask, customizer, stack)
	        )) {
	      result = false;
	      break;
	    }
	  }
	  stack['delete'](array);
	  stack['delete'](other);
	  return result;
	}

	var _equalArrays = equalArrays;

	/**
	 * Converts `map` to its key-value pairs.
	 *
	 * @private
	 * @param {Object} map The map to convert.
	 * @returns {Array} Returns the key-value pairs.
	 */
	function mapToArray(map) {
	  var index = -1,
	      result = Array(map.size);

	  map.forEach(function(value, key) {
	    result[++index] = [key, value];
	  });
	  return result;
	}

	var _mapToArray = mapToArray;

	/**
	 * Converts `set` to an array of its values.
	 *
	 * @private
	 * @param {Object} set The set to convert.
	 * @returns {Array} Returns the values.
	 */
	function setToArray(set) {
	  var index = -1,
	      result = Array(set.size);

	  set.forEach(function(value) {
	    result[++index] = value;
	  });
	  return result;
	}

	var _setToArray = setToArray;

	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG$1 = 1,
	    COMPARE_UNORDERED_FLAG$1 = 2;

	/** `Object#toString` result references. */
	var boolTag$3 = '[object Boolean]',
	    dateTag$3 = '[object Date]',
	    errorTag$2 = '[object Error]',
	    mapTag$5 = '[object Map]',
	    numberTag$3 = '[object Number]',
	    regexpTag$3 = '[object RegExp]',
	    setTag$5 = '[object Set]',
	    stringTag$3 = '[object String]',
	    symbolTag$2 = '[object Symbol]';

	var arrayBufferTag$3 = '[object ArrayBuffer]',
	    dataViewTag$4 = '[object DataView]';

	/** Used to convert symbols to primitives and strings. */
	var symbolProto$1 = _Symbol ? _Symbol.prototype : undefined,
	    symbolValueOf$1 = symbolProto$1 ? symbolProto$1.valueOf : undefined;

	/**
	 * A specialized version of `baseIsEqualDeep` for comparing objects of
	 * the same `toStringTag`.
	 *
	 * **Note:** This function only supports comparing values with tags of
	 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {string} tag The `toStringTag` of the objects to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
	  switch (tag) {
	    case dataViewTag$4:
	      if ((object.byteLength != other.byteLength) ||
	          (object.byteOffset != other.byteOffset)) {
	        return false;
	      }
	      object = object.buffer;
	      other = other.buffer;

	    case arrayBufferTag$3:
	      if ((object.byteLength != other.byteLength) ||
	          !equalFunc(new _Uint8Array(object), new _Uint8Array(other))) {
	        return false;
	      }
	      return true;

	    case boolTag$3:
	    case dateTag$3:
	    case numberTag$3:
	      // Coerce booleans to `1` or `0` and dates to milliseconds.
	      // Invalid dates are coerced to `NaN`.
	      return eq_1(+object, +other);

	    case errorTag$2:
	      return object.name == other.name && object.message == other.message;

	    case regexpTag$3:
	    case stringTag$3:
	      // Coerce regexes to strings and treat strings, primitives and objects,
	      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
	      // for more details.
	      return object == (other + '');

	    case mapTag$5:
	      var convert = _mapToArray;

	    case setTag$5:
	      var isPartial = bitmask & COMPARE_PARTIAL_FLAG$1;
	      convert || (convert = _setToArray);

	      if (object.size != other.size && !isPartial) {
	        return false;
	      }
	      // Assume cyclic values are equal.
	      var stacked = stack.get(object);
	      if (stacked) {
	        return stacked == other;
	      }
	      bitmask |= COMPARE_UNORDERED_FLAG$1;

	      // Recursively compare objects (susceptible to call stack limits).
	      stack.set(object, other);
	      var result = _equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
	      stack['delete'](object);
	      return result;

	    case symbolTag$2:
	      if (symbolValueOf$1) {
	        return symbolValueOf$1.call(object) == symbolValueOf$1.call(other);
	      }
	  }
	  return false;
	}

	var _equalByTag = equalByTag;

	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG$2 = 1;

	/** Used for built-in method references. */
	var objectProto$d = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$a = objectProto$d.hasOwnProperty;

	/**
	 * A specialized version of `baseIsEqualDeep` for objects with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
	  var isPartial = bitmask & COMPARE_PARTIAL_FLAG$2,
	      objProps = _getAllKeys(object),
	      objLength = objProps.length,
	      othProps = _getAllKeys(other),
	      othLength = othProps.length;

	  if (objLength != othLength && !isPartial) {
	    return false;
	  }
	  var index = objLength;
	  while (index--) {
	    var key = objProps[index];
	    if (!(isPartial ? key in other : hasOwnProperty$a.call(other, key))) {
	      return false;
	    }
	  }
	  // Check that cyclic values are equal.
	  var objStacked = stack.get(object);
	  var othStacked = stack.get(other);
	  if (objStacked && othStacked) {
	    return objStacked == other && othStacked == object;
	  }
	  var result = true;
	  stack.set(object, other);
	  stack.set(other, object);

	  var skipCtor = isPartial;
	  while (++index < objLength) {
	    key = objProps[index];
	    var objValue = object[key],
	        othValue = other[key];

	    if (customizer) {
	      var compared = isPartial
	        ? customizer(othValue, objValue, key, other, object, stack)
	        : customizer(objValue, othValue, key, object, other, stack);
	    }
	    // Recursively compare objects (susceptible to call stack limits).
	    if (!(compared === undefined
	          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
	          : compared
	        )) {
	      result = false;
	      break;
	    }
	    skipCtor || (skipCtor = key == 'constructor');
	  }
	  if (result && !skipCtor) {
	    var objCtor = object.constructor,
	        othCtor = other.constructor;

	    // Non `Object` object instances with different constructors are not equal.
	    if (objCtor != othCtor &&
	        ('constructor' in object && 'constructor' in other) &&
	        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
	          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
	      result = false;
	    }
	  }
	  stack['delete'](object);
	  stack['delete'](other);
	  return result;
	}

	var _equalObjects = equalObjects;

	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG$3 = 1;

	/** `Object#toString` result references. */
	var argsTag$3 = '[object Arguments]',
	    arrayTag$2 = '[object Array]',
	    objectTag$3 = '[object Object]';

	/** Used for built-in method references. */
	var objectProto$e = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$b = objectProto$e.hasOwnProperty;

	/**
	 * A specialized version of `baseIsEqual` for arrays and objects which performs
	 * deep comparisons and tracks traversed objects enabling objects with circular
	 * references to be compared.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
	  var objIsArr = isArray_1(object),
	      othIsArr = isArray_1(other),
	      objTag = objIsArr ? arrayTag$2 : _getTag(object),
	      othTag = othIsArr ? arrayTag$2 : _getTag(other);

	  objTag = objTag == argsTag$3 ? objectTag$3 : objTag;
	  othTag = othTag == argsTag$3 ? objectTag$3 : othTag;

	  var objIsObj = objTag == objectTag$3,
	      othIsObj = othTag == objectTag$3,
	      isSameTag = objTag == othTag;

	  if (isSameTag && isBuffer_1(object)) {
	    if (!isBuffer_1(other)) {
	      return false;
	    }
	    objIsArr = true;
	    objIsObj = false;
	  }
	  if (isSameTag && !objIsObj) {
	    stack || (stack = new _Stack);
	    return (objIsArr || isTypedArray_1(object))
	      ? _equalArrays(object, other, bitmask, customizer, equalFunc, stack)
	      : _equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
	  }
	  if (!(bitmask & COMPARE_PARTIAL_FLAG$3)) {
	    var objIsWrapped = objIsObj && hasOwnProperty$b.call(object, '__wrapped__'),
	        othIsWrapped = othIsObj && hasOwnProperty$b.call(other, '__wrapped__');

	    if (objIsWrapped || othIsWrapped) {
	      var objUnwrapped = objIsWrapped ? object.value() : object,
	          othUnwrapped = othIsWrapped ? other.value() : other;

	      stack || (stack = new _Stack);
	      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
	    }
	  }
	  if (!isSameTag) {
	    return false;
	  }
	  stack || (stack = new _Stack);
	  return _equalObjects(object, other, bitmask, customizer, equalFunc, stack);
	}

	var _baseIsEqualDeep = baseIsEqualDeep;

	/**
	 * The base implementation of `_.isEqual` which supports partial comparisons
	 * and tracks traversed objects.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @param {boolean} bitmask The bitmask flags.
	 *  1 - Unordered comparison
	 *  2 - Partial comparison
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 */
	function baseIsEqual(value, other, bitmask, customizer, stack) {
	  if (value === other) {
	    return true;
	  }
	  if (value == null || other == null || (!isObjectLike_1(value) && !isObjectLike_1(other))) {
	    return value !== value && other !== other;
	  }
	  return _baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
	}

	var _baseIsEqual = baseIsEqual;

	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG$4 = 1,
	    COMPARE_UNORDERED_FLAG$2 = 2;

	/**
	 * The base implementation of `_.isMatch` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Object} object The object to inspect.
	 * @param {Object} source The object of property values to match.
	 * @param {Array} matchData The property names, values, and compare flags to match.
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
	 */
	function baseIsMatch(object, source, matchData, customizer) {
	  var index = matchData.length,
	      length = index,
	      noCustomizer = !customizer;

	  if (object == null) {
	    return !length;
	  }
	  object = Object(object);
	  while (index--) {
	    var data = matchData[index];
	    if ((noCustomizer && data[2])
	          ? data[1] !== object[data[0]]
	          : !(data[0] in object)
	        ) {
	      return false;
	    }
	  }
	  while (++index < length) {
	    data = matchData[index];
	    var key = data[0],
	        objValue = object[key],
	        srcValue = data[1];

	    if (noCustomizer && data[2]) {
	      if (objValue === undefined && !(key in object)) {
	        return false;
	      }
	    } else {
	      var stack = new _Stack;
	      if (customizer) {
	        var result = customizer(objValue, srcValue, key, object, source, stack);
	      }
	      if (!(result === undefined
	            ? _baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG$4 | COMPARE_UNORDERED_FLAG$2, customizer, stack)
	            : result
	          )) {
	        return false;
	      }
	    }
	  }
	  return true;
	}

	var _baseIsMatch = baseIsMatch;

	/**
	 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` if suitable for strict
	 *  equality comparisons, else `false`.
	 */
	function isStrictComparable(value) {
	  return value === value && !isObject_1(value);
	}

	var _isStrictComparable = isStrictComparable;

	/**
	 * Gets the property names, values, and compare flags of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the match data of `object`.
	 */
	function getMatchData(object) {
	  var result = keys_1(object),
	      length = result.length;

	  while (length--) {
	    var key = result[length],
	        value = object[key];

	    result[length] = [key, value, _isStrictComparable(value)];
	  }
	  return result;
	}

	var _getMatchData = getMatchData;

	/**
	 * A specialized version of `matchesProperty` for source values suitable
	 * for strict equality comparisons, i.e. `===`.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @param {*} srcValue The value to match.
	 * @returns {Function} Returns the new spec function.
	 */
	function matchesStrictComparable(key, srcValue) {
	  return function(object) {
	    if (object == null) {
	      return false;
	    }
	    return object[key] === srcValue &&
	      (srcValue !== undefined || (key in Object(object)));
	  };
	}

	var _matchesStrictComparable = matchesStrictComparable;

	/**
	 * The base implementation of `_.matches` which doesn't clone `source`.
	 *
	 * @private
	 * @param {Object} source The object of property values to match.
	 * @returns {Function} Returns the new spec function.
	 */
	function baseMatches(source) {
	  var matchData = _getMatchData(source);
	  if (matchData.length == 1 && matchData[0][2]) {
	    return _matchesStrictComparable(matchData[0][0], matchData[0][1]);
	  }
	  return function(object) {
	    return object === source || _baseIsMatch(object, source, matchData);
	  };
	}

	var _baseMatches = baseMatches;

	/** `Object#toString` result references. */
	var symbolTag$3 = '[object Symbol]';

	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */
	function isSymbol(value) {
	  return typeof value == 'symbol' ||
	    (isObjectLike_1(value) && _baseGetTag(value) == symbolTag$3);
	}

	var isSymbol_1 = isSymbol;

	/** Used to match property names within property paths. */
	var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
	    reIsPlainProp = /^\w*$/;

	/**
	 * Checks if `value` is a property name and not a property path.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	 */
	function isKey(value, object) {
	  if (isArray_1(value)) {
	    return false;
	  }
	  var type = typeof value;
	  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
	      value == null || isSymbol_1(value)) {
	    return true;
	  }
	  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
	    (object != null && value in Object(object));
	}

	var _isKey = isKey;

	/** Error message constants. */
	var FUNC_ERROR_TEXT = 'Expected a function';

	/**
	 * Creates a function that memoizes the result of `func`. If `resolver` is
	 * provided, it determines the cache key for storing the result based on the
	 * arguments provided to the memoized function. By default, the first argument
	 * provided to the memoized function is used as the map cache key. The `func`
	 * is invoked with the `this` binding of the memoized function.
	 *
	 * **Note:** The cache is exposed as the `cache` property on the memoized
	 * function. Its creation may be customized by replacing the `_.memoize.Cache`
	 * constructor with one whose instances implement the
	 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
	 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to have its output memoized.
	 * @param {Function} [resolver] The function to resolve the cache key.
	 * @returns {Function} Returns the new memoized function.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2 };
	 * var other = { 'c': 3, 'd': 4 };
	 *
	 * var values = _.memoize(_.values);
	 * values(object);
	 * // => [1, 2]
	 *
	 * values(other);
	 * // => [3, 4]
	 *
	 * object.a = 2;
	 * values(object);
	 * // => [1, 2]
	 *
	 * // Modify the result cache.
	 * values.cache.set(object, ['a', 'b']);
	 * values(object);
	 * // => ['a', 'b']
	 *
	 * // Replace `_.memoize.Cache`.
	 * _.memoize.Cache = WeakMap;
	 */
	function memoize(func, resolver) {
	  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
	    throw new TypeError(FUNC_ERROR_TEXT);
	  }
	  var memoized = function() {
	    var args = arguments,
	        key = resolver ? resolver.apply(this, args) : args[0],
	        cache = memoized.cache;

	    if (cache.has(key)) {
	      return cache.get(key);
	    }
	    var result = func.apply(this, args);
	    memoized.cache = cache.set(key, result) || cache;
	    return result;
	  };
	  memoized.cache = new (memoize.Cache || _MapCache);
	  return memoized;
	}

	// Expose `MapCache`.
	memoize.Cache = _MapCache;

	var memoize_1 = memoize;

	/** Used as the maximum memoize cache size. */
	var MAX_MEMOIZE_SIZE = 500;

	/**
	 * A specialized version of `_.memoize` which clears the memoized function's
	 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
	 *
	 * @private
	 * @param {Function} func The function to have its output memoized.
	 * @returns {Function} Returns the new memoized function.
	 */
	function memoizeCapped(func) {
	  var result = memoize_1(func, function(key) {
	    if (cache.size === MAX_MEMOIZE_SIZE) {
	      cache.clear();
	    }
	    return key;
	  });

	  var cache = result.cache;
	  return result;
	}

	var _memoizeCapped = memoizeCapped;

	/** Used to match property names within property paths. */
	var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

	/** Used to match backslashes in property paths. */
	var reEscapeChar = /\\(\\)?/g;

	/**
	 * Converts `string` to a property path array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the property path array.
	 */
	var stringToPath = _memoizeCapped(function(string) {
	  var result = [];
	  if (string.charCodeAt(0) === 46 /* . */) {
	    result.push('');
	  }
	  string.replace(rePropName, function(match, number, quote, subString) {
	    result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
	  });
	  return result;
	});

	var _stringToPath = stringToPath;

	/**
	 * A specialized version of `_.map` for arrays without support for iteratee
	 * shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function arrayMap(array, iteratee) {
	  var index = -1,
	      length = array == null ? 0 : array.length,
	      result = Array(length);

	  while (++index < length) {
	    result[index] = iteratee(array[index], index, array);
	  }
	  return result;
	}

	var _arrayMap = arrayMap;

	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0;

	/** Used to convert symbols to primitives and strings. */
	var symbolProto$2 = _Symbol ? _Symbol.prototype : undefined,
	    symbolToString = symbolProto$2 ? symbolProto$2.toString : undefined;

	/**
	 * The base implementation of `_.toString` which doesn't convert nullish
	 * values to empty strings.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */
	function baseToString(value) {
	  // Exit early for strings to avoid a performance hit in some environments.
	  if (typeof value == 'string') {
	    return value;
	  }
	  if (isArray_1(value)) {
	    // Recursively convert values (susceptible to call stack limits).
	    return _arrayMap(value, baseToString) + '';
	  }
	  if (isSymbol_1(value)) {
	    return symbolToString ? symbolToString.call(value) : '';
	  }
	  var result = (value + '');
	  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
	}

	var _baseToString = baseToString;

	/**
	 * Converts `value` to a string. An empty string is returned for `null`
	 * and `undefined` values. The sign of `-0` is preserved.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 * @example
	 *
	 * _.toString(null);
	 * // => ''
	 *
	 * _.toString(-0);
	 * // => '-0'
	 *
	 * _.toString([1, 2, 3]);
	 * // => '1,2,3'
	 */
	function toString(value) {
	  return value == null ? '' : _baseToString(value);
	}

	var toString_1 = toString;

	/**
	 * Casts `value` to a path array if it's not one.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {Array} Returns the cast property path array.
	 */
	function castPath(value, object) {
	  if (isArray_1(value)) {
	    return value;
	  }
	  return _isKey(value, object) ? [value] : _stringToPath(toString_1(value));
	}

	var _castPath = castPath;

	/** Used as references for various `Number` constants. */
	var INFINITY$1 = 1 / 0;

	/**
	 * Converts `value` to a string key if it's not a string or symbol.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {string|symbol} Returns the key.
	 */
	function toKey(value) {
	  if (typeof value == 'string' || isSymbol_1(value)) {
	    return value;
	  }
	  var result = (value + '');
	  return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
	}

	var _toKey = toKey;

	/**
	 * The base implementation of `_.get` without support for default values.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @returns {*} Returns the resolved value.
	 */
	function baseGet(object, path) {
	  path = _castPath(path, object);

	  var index = 0,
	      length = path.length;

	  while (object != null && index < length) {
	    object = object[_toKey(path[index++])];
	  }
	  return (index && index == length) ? object : undefined;
	}

	var _baseGet = baseGet;

	/**
	 * Gets the value at `path` of `object`. If the resolved value is
	 * `undefined`, the `defaultValue` is returned in its place.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
	 * @returns {*} Returns the resolved value.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.get(object, 'a[0].b.c');
	 * // => 3
	 *
	 * _.get(object, ['a', '0', 'b', 'c']);
	 * // => 3
	 *
	 * _.get(object, 'a.b.c', 'default');
	 * // => 'default'
	 */
	function get(object, path, defaultValue) {
	  var result = object == null ? undefined : _baseGet(object, path);
	  return result === undefined ? defaultValue : result;
	}

	var get_1 = get;

	/**
	 * The base implementation of `_.hasIn` without support for deep paths.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {Array|string} key The key to check.
	 * @returns {boolean} Returns `true` if `key` exists, else `false`.
	 */
	function baseHasIn(object, key) {
	  return object != null && key in Object(object);
	}

	var _baseHasIn = baseHasIn;

	/**
	 * Checks if `path` exists on `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path to check.
	 * @param {Function} hasFunc The function to check properties.
	 * @returns {boolean} Returns `true` if `path` exists, else `false`.
	 */
	function hasPath(object, path, hasFunc) {
	  path = _castPath(path, object);

	  var index = -1,
	      length = path.length,
	      result = false;

	  while (++index < length) {
	    var key = _toKey(path[index]);
	    if (!(result = object != null && hasFunc(object, key))) {
	      break;
	    }
	    object = object[key];
	  }
	  if (result || ++index != length) {
	    return result;
	  }
	  length = object == null ? 0 : object.length;
	  return !!length && isLength_1(length) && _isIndex(key, length) &&
	    (isArray_1(object) || isArguments_1(object));
	}

	var _hasPath = hasPath;

	/**
	 * Checks if `path` is a direct or inherited property of `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path to check.
	 * @returns {boolean} Returns `true` if `path` exists, else `false`.
	 * @example
	 *
	 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
	 *
	 * _.hasIn(object, 'a');
	 * // => true
	 *
	 * _.hasIn(object, 'a.b');
	 * // => true
	 *
	 * _.hasIn(object, ['a', 'b']);
	 * // => true
	 *
	 * _.hasIn(object, 'b');
	 * // => false
	 */
	function hasIn(object, path) {
	  return object != null && _hasPath(object, path, _baseHasIn);
	}

	var hasIn_1 = hasIn;

	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG$5 = 1,
	    COMPARE_UNORDERED_FLAG$3 = 2;

	/**
	 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
	 *
	 * @private
	 * @param {string} path The path of the property to get.
	 * @param {*} srcValue The value to match.
	 * @returns {Function} Returns the new spec function.
	 */
	function baseMatchesProperty(path, srcValue) {
	  if (_isKey(path) && _isStrictComparable(srcValue)) {
	    return _matchesStrictComparable(_toKey(path), srcValue);
	  }
	  return function(object) {
	    var objValue = get_1(object, path);
	    return (objValue === undefined && objValue === srcValue)
	      ? hasIn_1(object, path)
	      : _baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG$5 | COMPARE_UNORDERED_FLAG$3);
	  };
	}

	var _baseMatchesProperty = baseMatchesProperty;

	/**
	 * The base implementation of `_.property` without support for deep paths.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @returns {Function} Returns the new accessor function.
	 */
	function baseProperty(key) {
	  return function(object) {
	    return object == null ? undefined : object[key];
	  };
	}

	var _baseProperty = baseProperty;

	/**
	 * A specialized version of `baseProperty` which supports deep paths.
	 *
	 * @private
	 * @param {Array|string} path The path of the property to get.
	 * @returns {Function} Returns the new accessor function.
	 */
	function basePropertyDeep(path) {
	  return function(object) {
	    return _baseGet(object, path);
	  };
	}

	var _basePropertyDeep = basePropertyDeep;

	/**
	 * Creates a function that returns the value at `path` of a given object.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.4.0
	 * @category Util
	 * @param {Array|string} path The path of the property to get.
	 * @returns {Function} Returns the new accessor function.
	 * @example
	 *
	 * var objects = [
	 *   { 'a': { 'b': 2 } },
	 *   { 'a': { 'b': 1 } }
	 * ];
	 *
	 * _.map(objects, _.property('a.b'));
	 * // => [2, 1]
	 *
	 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
	 * // => [1, 2]
	 */
	function property(path) {
	  return _isKey(path) ? _baseProperty(_toKey(path)) : _basePropertyDeep(path);
	}

	var property_1 = property;

	/**
	 * The base implementation of `_.iteratee`.
	 *
	 * @private
	 * @param {*} [value=_.identity] The value to convert to an iteratee.
	 * @returns {Function} Returns the iteratee.
	 */
	function baseIteratee(value) {
	  // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
	  // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
	  if (typeof value == 'function') {
	    return value;
	  }
	  if (value == null) {
	    return identity_1;
	  }
	  if (typeof value == 'object') {
	    return isArray_1(value)
	      ? _baseMatchesProperty(value[0], value[1])
	      : _baseMatches(value);
	  }
	  return property_1(value);
	}

	var _baseIteratee = baseIteratee;

	/**
	 * Iterates over elements of `collection`, returning an array of all elements
	 * `predicate` returns truthy for. The predicate is invoked with three
	 * arguments: (value, index|key, collection).
	 *
	 * **Note:** Unlike `_.remove`, this method returns a new array.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @returns {Array} Returns the new filtered array.
	 * @see _.reject
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'barney', 'age': 36, 'active': true },
	 *   { 'user': 'fred',   'age': 40, 'active': false }
	 * ];
	 *
	 * _.filter(users, function(o) { return !o.active; });
	 * // => objects for ['fred']
	 *
	 * // The `_.matches` iteratee shorthand.
	 * _.filter(users, { 'age': 36, 'active': true });
	 * // => objects for ['barney']
	 *
	 * // The `_.matchesProperty` iteratee shorthand.
	 * _.filter(users, ['active', false]);
	 * // => objects for ['fred']
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.filter(users, 'active');
	 * // => objects for ['barney']
	 *
	 * // Combining several predicates using `_.overEvery` or `_.overSome`.
	 * _.filter(users, _.overSome([{ 'age': 36 }, ['age', 40]]));
	 * // => objects for ['fred', 'barney']
	 */
	function filter(collection, predicate) {
	  var func = isArray_1(collection) ? _arrayFilter : _baseFilter;
	  return func(collection, _baseIteratee(predicate));
	}

	var filter_1 = filter;

	/** Used for built-in method references. */
	var objectProto$f = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$c = objectProto$f.hasOwnProperty;

	/**
	 * The base implementation of `_.has` without support for deep paths.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {Array|string} key The key to check.
	 * @returns {boolean} Returns `true` if `key` exists, else `false`.
	 */
	function baseHas(object, key) {
	  return object != null && hasOwnProperty$c.call(object, key);
	}

	var _baseHas = baseHas;

	/**
	 * Checks if `path` is a direct property of `object`.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path to check.
	 * @returns {boolean} Returns `true` if `path` exists, else `false`.
	 * @example
	 *
	 * var object = { 'a': { 'b': 2 } };
	 * var other = _.create({ 'a': _.create({ 'b': 2 }) });
	 *
	 * _.has(object, 'a');
	 * // => true
	 *
	 * _.has(object, 'a.b');
	 * // => true
	 *
	 * _.has(object, ['a', 'b']);
	 * // => true
	 *
	 * _.has(other, 'a');
	 * // => false
	 */
	function has$2(object, path) {
	  return object != null && _hasPath(object, path, _baseHas);
	}

	var has_1 = has$2;

	/** `Object#toString` result references. */
	var mapTag$6 = '[object Map]',
	    setTag$6 = '[object Set]';

	/** Used for built-in method references. */
	var objectProto$g = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$d = objectProto$g.hasOwnProperty;

	/**
	 * Checks if `value` is an empty object, collection, map, or set.
	 *
	 * Objects are considered empty if they have no own enumerable string keyed
	 * properties.
	 *
	 * Array-like values such as `arguments` objects, arrays, buffers, strings, or
	 * jQuery-like collections are considered empty if they have a `length` of `0`.
	 * Similarly, maps and sets are considered empty if they have a `size` of `0`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
	 * @example
	 *
	 * _.isEmpty(null);
	 * // => true
	 *
	 * _.isEmpty(true);
	 * // => true
	 *
	 * _.isEmpty(1);
	 * // => true
	 *
	 * _.isEmpty([1, 2, 3]);
	 * // => false
	 *
	 * _.isEmpty({ 'a': 1 });
	 * // => false
	 */
	function isEmpty(value) {
	  if (value == null) {
	    return true;
	  }
	  if (isArrayLike_1(value) &&
	      (isArray_1(value) || typeof value == 'string' || typeof value.splice == 'function' ||
	        isBuffer_1(value) || isTypedArray_1(value) || isArguments_1(value))) {
	    return !value.length;
	  }
	  var tag = _getTag(value);
	  if (tag == mapTag$6 || tag == setTag$6) {
	    return !value.size;
	  }
	  if (_isPrototype(value)) {
	    return !_baseKeys(value).length;
	  }
	  for (var key in value) {
	    if (hasOwnProperty$d.call(value, key)) {
	      return false;
	    }
	  }
	  return true;
	}

	var isEmpty_1 = isEmpty;

	/**
	 * Checks if `value` is `undefined`.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
	 * @example
	 *
	 * _.isUndefined(void 0);
	 * // => true
	 *
	 * _.isUndefined(null);
	 * // => false
	 */
	function isUndefined(value) {
	  return value === undefined;
	}

	var isUndefined_1 = isUndefined;

	/**
	 * The base implementation of `_.map` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function baseMap(collection, iteratee) {
	  var index = -1,
	      result = isArrayLike_1(collection) ? Array(collection.length) : [];

	  _baseEach(collection, function(value, key, collection) {
	    result[++index] = iteratee(value, key, collection);
	  });
	  return result;
	}

	var _baseMap = baseMap;

	/**
	 * Creates an array of values by running each element in `collection` thru
	 * `iteratee`. The iteratee is invoked with three arguments:
	 * (value, index|key, collection).
	 *
	 * Many lodash methods are guarded to work as iteratees for methods like
	 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
	 *
	 * The guarded methods are:
	 * `ary`, `chunk`, `curry`, `curryRight`, `drop`, `dropRight`, `every`,
	 * `fill`, `invert`, `parseInt`, `random`, `range`, `rangeRight`, `repeat`,
	 * `sampleSize`, `slice`, `some`, `sortBy`, `split`, `take`, `takeRight`,
	 * `template`, `trim`, `trimEnd`, `trimStart`, and `words`
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 * @example
	 *
	 * function square(n) {
	 *   return n * n;
	 * }
	 *
	 * _.map([4, 8], square);
	 * // => [16, 64]
	 *
	 * _.map({ 'a': 4, 'b': 8 }, square);
	 * // => [16, 64] (iteration order is not guaranteed)
	 *
	 * var users = [
	 *   { 'user': 'barney' },
	 *   { 'user': 'fred' }
	 * ];
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.map(users, 'user');
	 * // => ['barney', 'fred']
	 */
	function map(collection, iteratee) {
	  var func = isArray_1(collection) ? _arrayMap : _baseMap;
	  return func(collection, _baseIteratee(iteratee));
	}

	var map_1 = map;

	/**
	 * A specialized version of `_.reduce` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {*} [accumulator] The initial value.
	 * @param {boolean} [initAccum] Specify using the first element of `array` as
	 *  the initial value.
	 * @returns {*} Returns the accumulated value.
	 */
	function arrayReduce(array, iteratee, accumulator, initAccum) {
	  var index = -1,
	      length = array == null ? 0 : array.length;

	  if (initAccum && length) {
	    accumulator = array[++index];
	  }
	  while (++index < length) {
	    accumulator = iteratee(accumulator, array[index], index, array);
	  }
	  return accumulator;
	}

	var _arrayReduce = arrayReduce;

	/**
	 * The base implementation of `_.reduce` and `_.reduceRight`, without support
	 * for iteratee shorthands, which iterates over `collection` using `eachFunc`.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {*} accumulator The initial value.
	 * @param {boolean} initAccum Specify using the first or last element of
	 *  `collection` as the initial value.
	 * @param {Function} eachFunc The function to iterate over `collection`.
	 * @returns {*} Returns the accumulated value.
	 */
	function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
	  eachFunc(collection, function(value, index, collection) {
	    accumulator = initAccum
	      ? (initAccum = false, value)
	      : iteratee(accumulator, value, index, collection);
	  });
	  return accumulator;
	}

	var _baseReduce = baseReduce;

	/**
	 * Reduces `collection` to a value which is the accumulated result of running
	 * each element in `collection` thru `iteratee`, where each successive
	 * invocation is supplied the return value of the previous. If `accumulator`
	 * is not given, the first element of `collection` is used as the initial
	 * value. The iteratee is invoked with four arguments:
	 * (accumulator, value, index|key, collection).
	 *
	 * Many lodash methods are guarded to work as iteratees for methods like
	 * `_.reduce`, `_.reduceRight`, and `_.transform`.
	 *
	 * The guarded methods are:
	 * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `orderBy`,
	 * and `sortBy`
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @param {*} [accumulator] The initial value.
	 * @returns {*} Returns the accumulated value.
	 * @see _.reduceRight
	 * @example
	 *
	 * _.reduce([1, 2], function(sum, n) {
	 *   return sum + n;
	 * }, 0);
	 * // => 3
	 *
	 * _.reduce({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
	 *   (result[value] || (result[value] = [])).push(key);
	 *   return result;
	 * }, {});
	 * // => { '1': ['a', 'c'], '2': ['b'] } (iteration order is not guaranteed)
	 */
	function reduce(collection, iteratee, accumulator) {
	  var func = isArray_1(collection) ? _arrayReduce : _baseReduce,
	      initAccum = arguments.length < 3;

	  return func(collection, _baseIteratee(iteratee), accumulator, initAccum, _baseEach);
	}

	var reduce_1 = reduce;

	/** `Object#toString` result references. */
	var stringTag$4 = '[object String]';

	/**
	 * Checks if `value` is classified as a `String` primitive or object.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a string, else `false`.
	 * @example
	 *
	 * _.isString('abc');
	 * // => true
	 *
	 * _.isString(1);
	 * // => false
	 */
	function isString(value) {
	  return typeof value == 'string' ||
	    (!isArray_1(value) && isObjectLike_1(value) && _baseGetTag(value) == stringTag$4);
	}

	var isString_1 = isString;

	/**
	 * Gets the size of an ASCII `string`.
	 *
	 * @private
	 * @param {string} string The string inspect.
	 * @returns {number} Returns the string size.
	 */
	var asciiSize = _baseProperty('length');

	var _asciiSize = asciiSize;

	/** Used to compose unicode character classes. */
	var rsAstralRange = '\\ud800-\\udfff',
	    rsComboMarksRange = '\\u0300-\\u036f',
	    reComboHalfMarksRange = '\\ufe20-\\ufe2f',
	    rsComboSymbolsRange = '\\u20d0-\\u20ff',
	    rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
	    rsVarRange = '\\ufe0e\\ufe0f';

	/** Used to compose unicode capture groups. */
	var rsZWJ = '\\u200d';

	/** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
	var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboRange + rsVarRange + ']');

	/**
	 * Checks if `string` contains Unicode symbols.
	 *
	 * @private
	 * @param {string} string The string to inspect.
	 * @returns {boolean} Returns `true` if a symbol is found, else `false`.
	 */
	function hasUnicode(string) {
	  return reHasUnicode.test(string);
	}

	var _hasUnicode = hasUnicode;

	/** Used to compose unicode character classes. */
	var rsAstralRange$1 = '\\ud800-\\udfff',
	    rsComboMarksRange$1 = '\\u0300-\\u036f',
	    reComboHalfMarksRange$1 = '\\ufe20-\\ufe2f',
	    rsComboSymbolsRange$1 = '\\u20d0-\\u20ff',
	    rsComboRange$1 = rsComboMarksRange$1 + reComboHalfMarksRange$1 + rsComboSymbolsRange$1,
	    rsVarRange$1 = '\\ufe0e\\ufe0f';

	/** Used to compose unicode capture groups. */
	var rsAstral = '[' + rsAstralRange$1 + ']',
	    rsCombo = '[' + rsComboRange$1 + ']',
	    rsFitz = '\\ud83c[\\udffb-\\udfff]',
	    rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
	    rsNonAstral = '[^' + rsAstralRange$1 + ']',
	    rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
	    rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
	    rsZWJ$1 = '\\u200d';

	/** Used to compose unicode regexes. */
	var reOptMod = rsModifier + '?',
	    rsOptVar = '[' + rsVarRange$1 + ']?',
	    rsOptJoin = '(?:' + rsZWJ$1 + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
	    rsSeq = rsOptVar + reOptMod + rsOptJoin,
	    rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';

	/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
	var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

	/**
	 * Gets the size of a Unicode `string`.
	 *
	 * @private
	 * @param {string} string The string inspect.
	 * @returns {number} Returns the string size.
	 */
	function unicodeSize(string) {
	  var result = reUnicode.lastIndex = 0;
	  while (reUnicode.test(string)) {
	    ++result;
	  }
	  return result;
	}

	var _unicodeSize = unicodeSize;

	/**
	 * Gets the number of symbols in `string`.
	 *
	 * @private
	 * @param {string} string The string to inspect.
	 * @returns {number} Returns the string size.
	 */
	function stringSize(string) {
	  return _hasUnicode(string)
	    ? _unicodeSize(string)
	    : _asciiSize(string);
	}

	var _stringSize = stringSize;

	/** `Object#toString` result references. */
	var mapTag$7 = '[object Map]',
	    setTag$7 = '[object Set]';

	/**
	 * Gets the size of `collection` by returning its length for array-like
	 * values or the number of own enumerable string keyed properties for objects.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object|string} collection The collection to inspect.
	 * @returns {number} Returns the collection size.
	 * @example
	 *
	 * _.size([1, 2, 3]);
	 * // => 3
	 *
	 * _.size({ 'a': 1, 'b': 2 });
	 * // => 2
	 *
	 * _.size('pebbles');
	 * // => 7
	 */
	function size(collection) {
	  if (collection == null) {
	    return 0;
	  }
	  if (isArrayLike_1(collection)) {
	    return isString_1(collection) ? _stringSize(collection) : collection.length;
	  }
	  var tag = _getTag(collection);
	  if (tag == mapTag$7 || tag == setTag$7) {
	    return collection.size;
	  }
	  return _baseKeys(collection).length;
	}

	var size_1 = size;

	/**
	 * An alternative to `_.reduce`; this method transforms `object` to a new
	 * `accumulator` object which is the result of running each of its own
	 * enumerable string keyed properties thru `iteratee`, with each invocation
	 * potentially mutating the `accumulator` object. If `accumulator` is not
	 * provided, a new object with the same `[[Prototype]]` will be used. The
	 * iteratee is invoked with four arguments: (accumulator, value, key, object).
	 * Iteratee functions may exit iteration early by explicitly returning `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 1.3.0
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @param {*} [accumulator] The custom accumulator value.
	 * @returns {*} Returns the accumulated value.
	 * @example
	 *
	 * _.transform([2, 3, 4], function(result, n) {
	 *   result.push(n *= n);
	 *   return n % 2 == 0;
	 * }, []);
	 * // => [4, 9]
	 *
	 * _.transform({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
	 *   (result[value] || (result[value] = [])).push(key);
	 * }, {});
	 * // => { '1': ['a', 'c'], '2': ['b'] }
	 */
	function transform(object, iteratee, accumulator) {
	  var isArr = isArray_1(object),
	      isArrLike = isArr || isBuffer_1(object) || isTypedArray_1(object);

	  iteratee = _baseIteratee(iteratee);
	  if (accumulator == null) {
	    var Ctor = object && object.constructor;
	    if (isArrLike) {
	      accumulator = isArr ? new Ctor : [];
	    }
	    else if (isObject_1(object)) {
	      accumulator = isFunction_1(Ctor) ? _baseCreate(_getPrototype(object)) : {};
	    }
	    else {
	      accumulator = {};
	    }
	  }
	  (isArrLike ? _arrayEach : _baseForOwn)(object, function(value, index, object) {
	    return iteratee(accumulator, value, index, object);
	  });
	  return accumulator;
	}

	var transform_1 = transform;

	/** Built-in value references. */
	var spreadableSymbol = _Symbol ? _Symbol.isConcatSpreadable : undefined;

	/**
	 * Checks if `value` is a flattenable `arguments` object or array.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
	 */
	function isFlattenable(value) {
	  return isArray_1(value) || isArguments_1(value) ||
	    !!(spreadableSymbol && value && value[spreadableSymbol]);
	}

	var _isFlattenable = isFlattenable;

	/**
	 * The base implementation of `_.flatten` with support for restricting flattening.
	 *
	 * @private
	 * @param {Array} array The array to flatten.
	 * @param {number} depth The maximum recursion depth.
	 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
	 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
	 * @param {Array} [result=[]] The initial result value.
	 * @returns {Array} Returns the new flattened array.
	 */
	function baseFlatten(array, depth, predicate, isStrict, result) {
	  var index = -1,
	      length = array.length;

	  predicate || (predicate = _isFlattenable);
	  result || (result = []);

	  while (++index < length) {
	    var value = array[index];
	    if (depth > 0 && predicate(value)) {
	      if (depth > 1) {
	        // Recursively flatten arrays (susceptible to call stack limits).
	        baseFlatten(value, depth - 1, predicate, isStrict, result);
	      } else {
	        _arrayPush(result, value);
	      }
	    } else if (!isStrict) {
	      result[result.length] = value;
	    }
	  }
	  return result;
	}

	var _baseFlatten = baseFlatten;

	/**
	 * A faster alternative to `Function#apply`, this function invokes `func`
	 * with the `this` binding of `thisArg` and the arguments of `args`.
	 *
	 * @private
	 * @param {Function} func The function to invoke.
	 * @param {*} thisArg The `this` binding of `func`.
	 * @param {Array} args The arguments to invoke `func` with.
	 * @returns {*} Returns the result of `func`.
	 */
	function apply(func, thisArg, args) {
	  switch (args.length) {
	    case 0: return func.call(thisArg);
	    case 1: return func.call(thisArg, args[0]);
	    case 2: return func.call(thisArg, args[0], args[1]);
	    case 3: return func.call(thisArg, args[0], args[1], args[2]);
	  }
	  return func.apply(thisArg, args);
	}

	var _apply = apply;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeMax = Math.max;

	/**
	 * A specialized version of `baseRest` which transforms the rest array.
	 *
	 * @private
	 * @param {Function} func The function to apply a rest parameter to.
	 * @param {number} [start=func.length-1] The start position of the rest parameter.
	 * @param {Function} transform The rest array transform.
	 * @returns {Function} Returns the new function.
	 */
	function overRest(func, start, transform) {
	  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
	  return function() {
	    var args = arguments,
	        index = -1,
	        length = nativeMax(args.length - start, 0),
	        array = Array(length);

	    while (++index < length) {
	      array[index] = args[start + index];
	    }
	    index = -1;
	    var otherArgs = Array(start + 1);
	    while (++index < start) {
	      otherArgs[index] = args[index];
	    }
	    otherArgs[start] = transform(array);
	    return _apply(func, this, otherArgs);
	  };
	}

	var _overRest = overRest;

	/**
	 * The base implementation of `setToString` without support for hot loop shorting.
	 *
	 * @private
	 * @param {Function} func The function to modify.
	 * @param {Function} string The `toString` result.
	 * @returns {Function} Returns `func`.
	 */
	var baseSetToString = !_defineProperty ? identity_1 : function(func, string) {
	  return _defineProperty(func, 'toString', {
	    'configurable': true,
	    'enumerable': false,
	    'value': constant_1(string),
	    'writable': true
	  });
	};

	var _baseSetToString = baseSetToString;

	/** Used to detect hot functions by number of calls within a span of milliseconds. */
	var HOT_COUNT = 800,
	    HOT_SPAN = 16;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeNow = Date.now;

	/**
	 * Creates a function that'll short out and invoke `identity` instead
	 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
	 * milliseconds.
	 *
	 * @private
	 * @param {Function} func The function to restrict.
	 * @returns {Function} Returns the new shortable function.
	 */
	function shortOut(func) {
	  var count = 0,
	      lastCalled = 0;

	  return function() {
	    var stamp = nativeNow(),
	        remaining = HOT_SPAN - (stamp - lastCalled);

	    lastCalled = stamp;
	    if (remaining > 0) {
	      if (++count >= HOT_COUNT) {
	        return arguments[0];
	      }
	    } else {
	      count = 0;
	    }
	    return func.apply(undefined, arguments);
	  };
	}

	var _shortOut = shortOut;

	/**
	 * Sets the `toString` method of `func` to return `string`.
	 *
	 * @private
	 * @param {Function} func The function to modify.
	 * @param {Function} string The `toString` result.
	 * @returns {Function} Returns `func`.
	 */
	var setToString = _shortOut(_baseSetToString);

	var _setToString = setToString;

	/**
	 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
	 *
	 * @private
	 * @param {Function} func The function to apply a rest parameter to.
	 * @param {number} [start=func.length-1] The start position of the rest parameter.
	 * @returns {Function} Returns the new function.
	 */
	function baseRest(func, start) {
	  return _setToString(_overRest(func, start, identity_1), func + '');
	}

	var _baseRest = baseRest;

	/**
	 * The base implementation of `_.findIndex` and `_.findLastIndex` without
	 * support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {Function} predicate The function invoked per iteration.
	 * @param {number} fromIndex The index to search from.
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function baseFindIndex(array, predicate, fromIndex, fromRight) {
	  var length = array.length,
	      index = fromIndex + (fromRight ? 1 : -1);

	  while ((fromRight ? index-- : ++index < length)) {
	    if (predicate(array[index], index, array)) {
	      return index;
	    }
	  }
	  return -1;
	}

	var _baseFindIndex = baseFindIndex;

	/**
	 * The base implementation of `_.isNaN` without support for number objects.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
	 */
	function baseIsNaN(value) {
	  return value !== value;
	}

	var _baseIsNaN = baseIsNaN;

	/**
	 * A specialized version of `_.indexOf` which performs strict equality
	 * comparisons of values, i.e. `===`.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} value The value to search for.
	 * @param {number} fromIndex The index to search from.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function strictIndexOf(array, value, fromIndex) {
	  var index = fromIndex - 1,
	      length = array.length;

	  while (++index < length) {
	    if (array[index] === value) {
	      return index;
	    }
	  }
	  return -1;
	}

	var _strictIndexOf = strictIndexOf;

	/**
	 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} value The value to search for.
	 * @param {number} fromIndex The index to search from.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function baseIndexOf(array, value, fromIndex) {
	  return value === value
	    ? _strictIndexOf(array, value, fromIndex)
	    : _baseFindIndex(array, _baseIsNaN, fromIndex);
	}

	var _baseIndexOf = baseIndexOf;

	/**
	 * A specialized version of `_.includes` for arrays without support for
	 * specifying an index to search from.
	 *
	 * @private
	 * @param {Array} [array] The array to inspect.
	 * @param {*} target The value to search for.
	 * @returns {boolean} Returns `true` if `target` is found, else `false`.
	 */
	function arrayIncludes(array, value) {
	  var length = array == null ? 0 : array.length;
	  return !!length && _baseIndexOf(array, value, 0) > -1;
	}

	var _arrayIncludes = arrayIncludes;

	/**
	 * This function is like `arrayIncludes` except that it accepts a comparator.
	 *
	 * @private
	 * @param {Array} [array] The array to inspect.
	 * @param {*} target The value to search for.
	 * @param {Function} comparator The comparator invoked per element.
	 * @returns {boolean} Returns `true` if `target` is found, else `false`.
	 */
	function arrayIncludesWith(array, value, comparator) {
	  var index = -1,
	      length = array == null ? 0 : array.length;

	  while (++index < length) {
	    if (comparator(value, array[index])) {
	      return true;
	    }
	  }
	  return false;
	}

	var _arrayIncludesWith = arrayIncludesWith;

	/**
	 * This method returns `undefined`.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.3.0
	 * @category Util
	 * @example
	 *
	 * _.times(2, _.noop);
	 * // => [undefined, undefined]
	 */
	function noop() {
	  // No operation performed.
	}

	var noop_1 = noop;

	/** Used as references for various `Number` constants. */
	var INFINITY$2 = 1 / 0;

	/**
	 * Creates a set object of `values`.
	 *
	 * @private
	 * @param {Array} values The values to add to the set.
	 * @returns {Object} Returns the new set.
	 */
	var createSet = !(_Set && (1 / _setToArray(new _Set([,-0]))[1]) == INFINITY$2) ? noop_1 : function(values) {
	  return new _Set(values);
	};

	var _createSet = createSet;

	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE$1 = 200;

	/**
	 * The base implementation of `_.uniqBy` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {Function} [iteratee] The iteratee invoked per element.
	 * @param {Function} [comparator] The comparator invoked per element.
	 * @returns {Array} Returns the new duplicate free array.
	 */
	function baseUniq(array, iteratee, comparator) {
	  var index = -1,
	      includes = _arrayIncludes,
	      length = array.length,
	      isCommon = true,
	      result = [],
	      seen = result;

	  if (comparator) {
	    isCommon = false;
	    includes = _arrayIncludesWith;
	  }
	  else if (length >= LARGE_ARRAY_SIZE$1) {
	    var set = iteratee ? null : _createSet(array);
	    if (set) {
	      return _setToArray(set);
	    }
	    isCommon = false;
	    includes = _cacheHas;
	    seen = new _SetCache;
	  }
	  else {
	    seen = iteratee ? [] : result;
	  }
	  outer:
	  while (++index < length) {
	    var value = array[index],
	        computed = iteratee ? iteratee(value) : value;

	    value = (comparator || value !== 0) ? value : 0;
	    if (isCommon && computed === computed) {
	      var seenIndex = seen.length;
	      while (seenIndex--) {
	        if (seen[seenIndex] === computed) {
	          continue outer;
	        }
	      }
	      if (iteratee) {
	        seen.push(computed);
	      }
	      result.push(value);
	    }
	    else if (!includes(seen, computed, comparator)) {
	      if (seen !== result) {
	        seen.push(computed);
	      }
	      result.push(value);
	    }
	  }
	  return result;
	}

	var _baseUniq = baseUniq;

	/**
	 * This method is like `_.isArrayLike` except that it also checks if `value`
	 * is an object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array-like object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArrayLikeObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLikeObject(document.body.children);
	 * // => true
	 *
	 * _.isArrayLikeObject('abc');
	 * // => false
	 *
	 * _.isArrayLikeObject(_.noop);
	 * // => false
	 */
	function isArrayLikeObject(value) {
	  return isObjectLike_1(value) && isArrayLike_1(value);
	}

	var isArrayLikeObject_1 = isArrayLikeObject;

	/**
	 * Creates an array of unique values, in order, from all given arrays using
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * for equality comparisons.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Array
	 * @param {...Array} [arrays] The arrays to inspect.
	 * @returns {Array} Returns the new array of combined values.
	 * @example
	 *
	 * _.union([2], [1, 2]);
	 * // => [2, 1]
	 */
	var union = _baseRest(function(arrays) {
	  return _baseUniq(_baseFlatten(arrays, 1, isArrayLikeObject_1, true));
	});

	var union_1 = union;

	/**
	 * The base implementation of `_.values` and `_.valuesIn` which creates an
	 * array of `object` property values corresponding to the property names
	 * of `props`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array} props The property names to get values for.
	 * @returns {Object} Returns the array of property values.
	 */
	function baseValues(object, props) {
	  return _arrayMap(props, function(key) {
	    return object[key];
	  });
	}

	var _baseValues = baseValues;

	/**
	 * Creates an array of the own enumerable string keyed property values of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property values.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.values(new Foo);
	 * // => [1, 2] (iteration order is not guaranteed)
	 *
	 * _.values('hi');
	 * // => ['h', 'i']
	 */
	function values(object) {
	  return object == null ? [] : _baseValues(object, keys_1(object));
	}

	var values_1 = values;

	/* global window */

	var lodash;

	if (typeof commonjsRequire === "function") {
	  try {
	    lodash = {
	      clone: clone_1,
	      constant: constant_1,
	      each: each,
	      filter: filter_1,
	      has:  has_1,
	      isArray: isArray_1,
	      isEmpty: isEmpty_1,
	      isFunction: isFunction_1,
	      isUndefined: isUndefined_1,
	      keys: keys_1,
	      map: map_1,
	      reduce: reduce_1,
	      size: size_1,
	      transform: transform_1,
	      union: union_1,
	      values: values_1
	    };
	  } catch (e) {
	    // continue regardless of error
	  }
	}

	if (!lodash) {
	  lodash = window._;
	}

	var lodash_1 = lodash;

	var graph = Graph;

	var DEFAULT_EDGE_NAME = "\x00";
	var GRAPH_NODE = "\x00";
	var EDGE_KEY_DELIM = "\x01";

	// Implementation notes:
	//
	//  * Node id query functions should return string ids for the nodes
	//  * Edge id query functions should return an "edgeObj", edge object, that is
	//    composed of enough information to uniquely identify an edge: {v, w, name}.
	//  * Internally we use an "edgeId", a stringified form of the edgeObj, to
	//    reference edges. This is because we need a performant way to look these
	//    edges up and, object properties, which have string keys, are the closest
	//    we're going to get to a performant hashtable in JavaScript.

	function Graph(opts) {
	  this._isDirected = lodash_1.has(opts, "directed") ? opts.directed : true;
	  this._isMultigraph = lodash_1.has(opts, "multigraph") ? opts.multigraph : false;
	  this._isCompound = lodash_1.has(opts, "compound") ? opts.compound : false;

	  // Label for the graph itself
	  this._label = undefined;

	  // Defaults to be set when creating a new node
	  this._defaultNodeLabelFn = lodash_1.constant(undefined);

	  // Defaults to be set when creating a new edge
	  this._defaultEdgeLabelFn = lodash_1.constant(undefined);

	  // v -> label
	  this._nodes = {};

	  if (this._isCompound) {
	    // v -> parent
	    this._parent = {};

	    // v -> children
	    this._children = {};
	    this._children[GRAPH_NODE] = {};
	  }

	  // v -> edgeObj
	  this._in = {};

	  // u -> v -> Number
	  this._preds = {};

	  // v -> edgeObj
	  this._out = {};

	  // v -> w -> Number
	  this._sucs = {};

	  // e -> edgeObj
	  this._edgeObjs = {};

	  // e -> label
	  this._edgeLabels = {};
	}

	/* Number of nodes in the graph. Should only be changed by the implementation. */
	Graph.prototype._nodeCount = 0;

	/* Number of edges in the graph. Should only be changed by the implementation. */
	Graph.prototype._edgeCount = 0;


	/* === Graph functions ========= */

	Graph.prototype.isDirected = function() {
	  return this._isDirected;
	};

	Graph.prototype.isMultigraph = function() {
	  return this._isMultigraph;
	};

	Graph.prototype.isCompound = function() {
	  return this._isCompound;
	};

	Graph.prototype.setGraph = function(label) {
	  this._label = label;
	  return this;
	};

	Graph.prototype.graph = function() {
	  return this._label;
	};


	/* === Node functions ========== */

	Graph.prototype.setDefaultNodeLabel = function(newDefault) {
	  if (!lodash_1.isFunction(newDefault)) {
	    newDefault = lodash_1.constant(newDefault);
	  }
	  this._defaultNodeLabelFn = newDefault;
	  return this;
	};

	Graph.prototype.nodeCount = function() {
	  return this._nodeCount;
	};

	Graph.prototype.nodes = function() {
	  return lodash_1.keys(this._nodes);
	};

	Graph.prototype.sources = function() {
	  var self = this;
	  return lodash_1.filter(this.nodes(), function(v) {
	    return lodash_1.isEmpty(self._in[v]);
	  });
	};

	Graph.prototype.sinks = function() {
	  var self = this;
	  return lodash_1.filter(this.nodes(), function(v) {
	    return lodash_1.isEmpty(self._out[v]);
	  });
	};

	Graph.prototype.setNodes = function(vs, value) {
	  var args = arguments;
	  var self = this;
	  lodash_1.each(vs, function(v) {
	    if (args.length > 1) {
	      self.setNode(v, value);
	    } else {
	      self.setNode(v);
	    }
	  });
	  return this;
	};

	Graph.prototype.setNode = function(v, value) {
	  if (lodash_1.has(this._nodes, v)) {
	    if (arguments.length > 1) {
	      this._nodes[v] = value;
	    }
	    return this;
	  }

	  this._nodes[v] = arguments.length > 1 ? value : this._defaultNodeLabelFn(v);
	  if (this._isCompound) {
	    this._parent[v] = GRAPH_NODE;
	    this._children[v] = {};
	    this._children[GRAPH_NODE][v] = true;
	  }
	  this._in[v] = {};
	  this._preds[v] = {};
	  this._out[v] = {};
	  this._sucs[v] = {};
	  ++this._nodeCount;
	  return this;
	};

	Graph.prototype.node = function(v) {
	  return this._nodes[v];
	};

	Graph.prototype.hasNode = function(v) {
	  return lodash_1.has(this._nodes, v);
	};

	Graph.prototype.removeNode =  function(v) {
	  var self = this;
	  if (lodash_1.has(this._nodes, v)) {
	    var removeEdge = function(e) { self.removeEdge(self._edgeObjs[e]); };
	    delete this._nodes[v];
	    if (this._isCompound) {
	      this._removeFromParentsChildList(v);
	      delete this._parent[v];
	      lodash_1.each(this.children(v), function(child) {
	        self.setParent(child);
	      });
	      delete this._children[v];
	    }
	    lodash_1.each(lodash_1.keys(this._in[v]), removeEdge);
	    delete this._in[v];
	    delete this._preds[v];
	    lodash_1.each(lodash_1.keys(this._out[v]), removeEdge);
	    delete this._out[v];
	    delete this._sucs[v];
	    --this._nodeCount;
	  }
	  return this;
	};

	Graph.prototype.setParent = function(v, parent) {
	  if (!this._isCompound) {
	    throw new Error("Cannot set parent in a non-compound graph");
	  }

	  if (lodash_1.isUndefined(parent)) {
	    parent = GRAPH_NODE;
	  } else {
	    // Coerce parent to string
	    parent += "";
	    for (var ancestor = parent;
	      !lodash_1.isUndefined(ancestor);
	      ancestor = this.parent(ancestor)) {
	      if (ancestor === v) {
	        throw new Error("Setting " + parent+ " as parent of " + v +
	                        " would create a cycle");
	      }
	    }

	    this.setNode(parent);
	  }

	  this.setNode(v);
	  this._removeFromParentsChildList(v);
	  this._parent[v] = parent;
	  this._children[parent][v] = true;
	  return this;
	};

	Graph.prototype._removeFromParentsChildList = function(v) {
	  delete this._children[this._parent[v]][v];
	};

	Graph.prototype.parent = function(v) {
	  if (this._isCompound) {
	    var parent = this._parent[v];
	    if (parent !== GRAPH_NODE) {
	      return parent;
	    }
	  }
	};

	Graph.prototype.children = function(v) {
	  if (lodash_1.isUndefined(v)) {
	    v = GRAPH_NODE;
	  }

	  if (this._isCompound) {
	    var children = this._children[v];
	    if (children) {
	      return lodash_1.keys(children);
	    }
	  } else if (v === GRAPH_NODE) {
	    return this.nodes();
	  } else if (this.hasNode(v)) {
	    return [];
	  }
	};

	Graph.prototype.predecessors = function(v) {
	  var predsV = this._preds[v];
	  if (predsV) {
	    return lodash_1.keys(predsV);
	  }
	};

	Graph.prototype.successors = function(v) {
	  var sucsV = this._sucs[v];
	  if (sucsV) {
	    return lodash_1.keys(sucsV);
	  }
	};

	Graph.prototype.neighbors = function(v) {
	  var preds = this.predecessors(v);
	  if (preds) {
	    return lodash_1.union(preds, this.successors(v));
	  }
	};

	Graph.prototype.isLeaf = function (v) {
	  var neighbors;
	  if (this.isDirected()) {
	    neighbors = this.successors(v);
	  } else {
	    neighbors = this.neighbors(v);
	  }
	  return neighbors.length === 0;
	};

	Graph.prototype.filterNodes = function(filter) {
	  var copy = new this.constructor({
	    directed: this._isDirected,
	    multigraph: this._isMultigraph,
	    compound: this._isCompound
	  });

	  copy.setGraph(this.graph());

	  var self = this;
	  lodash_1.each(this._nodes, function(value, v) {
	    if (filter(v)) {
	      copy.setNode(v, value);
	    }
	  });

	  lodash_1.each(this._edgeObjs, function(e) {
	    if (copy.hasNode(e.v) && copy.hasNode(e.w)) {
	      copy.setEdge(e, self.edge(e));
	    }
	  });

	  var parents = {};
	  function findParent(v) {
	    var parent = self.parent(v);
	    if (parent === undefined || copy.hasNode(parent)) {
	      parents[v] = parent;
	      return parent;
	    } else if (parent in parents) {
	      return parents[parent];
	    } else {
	      return findParent(parent);
	    }
	  }

	  if (this._isCompound) {
	    lodash_1.each(copy.nodes(), function(v) {
	      copy.setParent(v, findParent(v));
	    });
	  }

	  return copy;
	};

	/* === Edge functions ========== */

	Graph.prototype.setDefaultEdgeLabel = function(newDefault) {
	  if (!lodash_1.isFunction(newDefault)) {
	    newDefault = lodash_1.constant(newDefault);
	  }
	  this._defaultEdgeLabelFn = newDefault;
	  return this;
	};

	Graph.prototype.edgeCount = function() {
	  return this._edgeCount;
	};

	Graph.prototype.edges = function() {
	  return lodash_1.values(this._edgeObjs);
	};

	Graph.prototype.setPath = function(vs, value) {
	  var self = this;
	  var args = arguments;
	  lodash_1.reduce(vs, function(v, w) {
	    if (args.length > 1) {
	      self.setEdge(v, w, value);
	    } else {
	      self.setEdge(v, w);
	    }
	    return w;
	  });
	  return this;
	};

	/*
	 * setEdge(v, w, [value, [name]])
	 * setEdge({ v, w, [name] }, [value])
	 */
	Graph.prototype.setEdge = function() {
	  var v, w, name, value;
	  var valueSpecified = false;
	  var arg0 = arguments[0];

	  if (typeof arg0 === "object" && arg0 !== null && "v" in arg0) {
	    v = arg0.v;
	    w = arg0.w;
	    name = arg0.name;
	    if (arguments.length === 2) {
	      value = arguments[1];
	      valueSpecified = true;
	    }
	  } else {
	    v = arg0;
	    w = arguments[1];
	    name = arguments[3];
	    if (arguments.length > 2) {
	      value = arguments[2];
	      valueSpecified = true;
	    }
	  }

	  v = "" + v;
	  w = "" + w;
	  if (!lodash_1.isUndefined(name)) {
	    name = "" + name;
	  }

	  var e = edgeArgsToId(this._isDirected, v, w, name);
	  if (lodash_1.has(this._edgeLabels, e)) {
	    if (valueSpecified) {
	      this._edgeLabels[e] = value;
	    }
	    return this;
	  }

	  if (!lodash_1.isUndefined(name) && !this._isMultigraph) {
	    throw new Error("Cannot set a named edge when isMultigraph = false");
	  }

	  // It didn't exist, so we need to create it.
	  // First ensure the nodes exist.
	  this.setNode(v);
	  this.setNode(w);

	  this._edgeLabels[e] = valueSpecified ? value : this._defaultEdgeLabelFn(v, w, name);

	  var edgeObj = edgeArgsToObj(this._isDirected, v, w, name);
	  // Ensure we add undirected edges in a consistent way.
	  v = edgeObj.v;
	  w = edgeObj.w;

	  Object.freeze(edgeObj);
	  this._edgeObjs[e] = edgeObj;
	  incrementOrInitEntry(this._preds[w], v);
	  incrementOrInitEntry(this._sucs[v], w);
	  this._in[w][e] = edgeObj;
	  this._out[v][e] = edgeObj;
	  this._edgeCount++;
	  return this;
	};

	Graph.prototype.edge = function(v, w, name) {
	  var e = (arguments.length === 1
	    ? edgeObjToId(this._isDirected, arguments[0])
	    : edgeArgsToId(this._isDirected, v, w, name));
	  return this._edgeLabels[e];
	};

	Graph.prototype.hasEdge = function(v, w, name) {
	  var e = (arguments.length === 1
	    ? edgeObjToId(this._isDirected, arguments[0])
	    : edgeArgsToId(this._isDirected, v, w, name));
	  return lodash_1.has(this._edgeLabels, e);
	};

	Graph.prototype.removeEdge = function(v, w, name) {
	  var e = (arguments.length === 1
	    ? edgeObjToId(this._isDirected, arguments[0])
	    : edgeArgsToId(this._isDirected, v, w, name));
	  var edge = this._edgeObjs[e];
	  if (edge) {
	    v = edge.v;
	    w = edge.w;
	    delete this._edgeLabels[e];
	    delete this._edgeObjs[e];
	    decrementOrRemoveEntry(this._preds[w], v);
	    decrementOrRemoveEntry(this._sucs[v], w);
	    delete this._in[w][e];
	    delete this._out[v][e];
	    this._edgeCount--;
	  }
	  return this;
	};

	Graph.prototype.inEdges = function(v, u) {
	  var inV = this._in[v];
	  if (inV) {
	    var edges = lodash_1.values(inV);
	    if (!u) {
	      return edges;
	    }
	    return lodash_1.filter(edges, function(edge) { return edge.v === u; });
	  }
	};

	Graph.prototype.outEdges = function(v, w) {
	  var outV = this._out[v];
	  if (outV) {
	    var edges = lodash_1.values(outV);
	    if (!w) {
	      return edges;
	    }
	    return lodash_1.filter(edges, function(edge) { return edge.w === w; });
	  }
	};

	Graph.prototype.nodeEdges = function(v, w) {
	  var inEdges = this.inEdges(v, w);
	  if (inEdges) {
	    return inEdges.concat(this.outEdges(v, w));
	  }
	};

	function incrementOrInitEntry(map, k) {
	  if (map[k]) {
	    map[k]++;
	  } else {
	    map[k] = 1;
	  }
	}

	function decrementOrRemoveEntry(map, k) {
	  if (!--map[k]) { delete map[k]; }
	}

	function edgeArgsToId(isDirected, v_, w_, name) {
	  var v = "" + v_;
	  var w = "" + w_;
	  if (!isDirected && v > w) {
	    var tmp = v;
	    v = w;
	    w = tmp;
	  }
	  return v + EDGE_KEY_DELIM + w + EDGE_KEY_DELIM +
	             (lodash_1.isUndefined(name) ? DEFAULT_EDGE_NAME : name);
	}

	function edgeArgsToObj(isDirected, v_, w_, name) {
	  var v = "" + v_;
	  var w = "" + w_;
	  if (!isDirected && v > w) {
	    var tmp = v;
	    v = w;
	    w = tmp;
	  }
	  var edgeObj =  { v: v, w: w };
	  if (name) {
	    edgeObj.name = name;
	  }
	  return edgeObj;
	}

	function edgeObjToId(isDirected, edgeObj) {
	  return edgeArgsToId(isDirected, edgeObj.v, edgeObj.w, edgeObj.name);
	}

	var version = '2.1.8';

	// Includes only the "core" of graphlib
	var lib = {
	  Graph: graph,
	  version: version
	};

	var json = {
	  write: write,
	  read: read
	};

	function write(g) {
	  var json = {
	    options: {
	      directed: g.isDirected(),
	      multigraph: g.isMultigraph(),
	      compound: g.isCompound()
	    },
	    nodes: writeNodes(g),
	    edges: writeEdges(g)
	  };
	  if (!lodash_1.isUndefined(g.graph())) {
	    json.value = lodash_1.clone(g.graph());
	  }
	  return json;
	}

	function writeNodes(g) {
	  return lodash_1.map(g.nodes(), function(v) {
	    var nodeValue = g.node(v);
	    var parent = g.parent(v);
	    var node = { v: v };
	    if (!lodash_1.isUndefined(nodeValue)) {
	      node.value = nodeValue;
	    }
	    if (!lodash_1.isUndefined(parent)) {
	      node.parent = parent;
	    }
	    return node;
	  });
	}

	function writeEdges(g) {
	  return lodash_1.map(g.edges(), function(e) {
	    var edgeValue = g.edge(e);
	    var edge = { v: e.v, w: e.w };
	    if (!lodash_1.isUndefined(e.name)) {
	      edge.name = e.name;
	    }
	    if (!lodash_1.isUndefined(edgeValue)) {
	      edge.value = edgeValue;
	    }
	    return edge;
	  });
	}

	function read(json) {
	  var g = new graph(json.options).setGraph(json.value);
	  lodash_1.each(json.nodes, function(entry) {
	    g.setNode(entry.v, entry.value);
	    if (entry.parent) {
	      g.setParent(entry.v, entry.parent);
	    }
	  });
	  lodash_1.each(json.edges, function(entry) {
	    g.setEdge({ v: entry.v, w: entry.w, name: entry.name }, entry.value);
	  });
	  return g;
	}

	var components_1 = components;

	function components(g) {
	  var visited = {};
	  var cmpts = [];
	  var cmpt;

	  function dfs(v) {
	    if (lodash_1.has(visited, v)) return;
	    visited[v] = true;
	    cmpt.push(v);
	    lodash_1.each(g.successors(v), dfs);
	    lodash_1.each(g.predecessors(v), dfs);
	  }

	  lodash_1.each(g.nodes(), function(v) {
	    cmpt = [];
	    dfs(v);
	    if (cmpt.length) {
	      cmpts.push(cmpt);
	    }
	  });

	  return cmpts;
	}

	var priorityQueue = PriorityQueue;

	/**
	 * A min-priority queue data structure. This algorithm is derived from Cormen,
	 * et al., "Introduction to Algorithms". The basic idea of a min-priority
	 * queue is that you can efficiently (in O(1) time) get the smallest key in
	 * the queue. Adding and removing elements takes O(log n) time. A key can
	 * have its priority decreased in O(log n) time.
	 */
	function PriorityQueue() {
	  this._arr = [];
	  this._keyIndices = {};
	}

	/**
	 * Returns the number of elements in the queue. Takes `O(1)` time.
	 */
	PriorityQueue.prototype.size = function() {
	  return this._arr.length;
	};

	/**
	 * Returns the keys that are in the queue. Takes `O(n)` time.
	 */
	PriorityQueue.prototype.keys = function() {
	  return this._arr.map(function(x) { return x.key; });
	};

	/**
	 * Returns `true` if **key** is in the queue and `false` if not.
	 */
	PriorityQueue.prototype.has = function(key) {
	  return lodash_1.has(this._keyIndices, key);
	};

	/**
	 * Returns the priority for **key**. If **key** is not present in the queue
	 * then this function returns `undefined`. Takes `O(1)` time.
	 *
	 * @param {Object} key
	 */
	PriorityQueue.prototype.priority = function(key) {
	  var index = this._keyIndices[key];
	  if (index !== undefined) {
	    return this._arr[index].priority;
	  }
	};

	/**
	 * Returns the key for the minimum element in this queue. If the queue is
	 * empty this function throws an Error. Takes `O(1)` time.
	 */
	PriorityQueue.prototype.min = function() {
	  if (this.size() === 0) {
	    throw new Error("Queue underflow");
	  }
	  return this._arr[0].key;
	};

	/**
	 * Inserts a new key into the priority queue. If the key already exists in
	 * the queue this function returns `false`; otherwise it will return `true`.
	 * Takes `O(n)` time.
	 *
	 * @param {Object} key the key to add
	 * @param {Number} priority the initial priority for the key
	 */
	PriorityQueue.prototype.add = function(key, priority) {
	  var keyIndices = this._keyIndices;
	  key = String(key);
	  if (!lodash_1.has(keyIndices, key)) {
	    var arr = this._arr;
	    var index = arr.length;
	    keyIndices[key] = index;
	    arr.push({key: key, priority: priority});
	    this._decrease(index);
	    return true;
	  }
	  return false;
	};

	/**
	 * Removes and returns the smallest key in the queue. Takes `O(log n)` time.
	 */
	PriorityQueue.prototype.removeMin = function() {
	  this._swap(0, this._arr.length - 1);
	  var min = this._arr.pop();
	  delete this._keyIndices[min.key];
	  this._heapify(0);
	  return min.key;
	};

	/**
	 * Decreases the priority for **key** to **priority**. If the new priority is
	 * greater than the previous priority, this function will throw an Error.
	 *
	 * @param {Object} key the key for which to raise priority
	 * @param {Number} priority the new priority for the key
	 */
	PriorityQueue.prototype.decrease = function(key, priority) {
	  var index = this._keyIndices[key];
	  if (priority > this._arr[index].priority) {
	    throw new Error("New priority is greater than current priority. " +
	        "Key: " + key + " Old: " + this._arr[index].priority + " New: " + priority);
	  }
	  this._arr[index].priority = priority;
	  this._decrease(index);
	};

	PriorityQueue.prototype._heapify = function(i) {
	  var arr = this._arr;
	  var l = 2 * i;
	  var r = l + 1;
	  var largest = i;
	  if (l < arr.length) {
	    largest = arr[l].priority < arr[largest].priority ? l : largest;
	    if (r < arr.length) {
	      largest = arr[r].priority < arr[largest].priority ? r : largest;
	    }
	    if (largest !== i) {
	      this._swap(i, largest);
	      this._heapify(largest);
	    }
	  }
	};

	PriorityQueue.prototype._decrease = function(index) {
	  var arr = this._arr;
	  var priority = arr[index].priority;
	  var parent;
	  while (index !== 0) {
	    parent = index >> 1;
	    if (arr[parent].priority < priority) {
	      break;
	    }
	    this._swap(index, parent);
	    index = parent;
	  }
	};

	PriorityQueue.prototype._swap = function(i, j) {
	  var arr = this._arr;
	  var keyIndices = this._keyIndices;
	  var origArrI = arr[i];
	  var origArrJ = arr[j];
	  arr[i] = origArrJ;
	  arr[j] = origArrI;
	  keyIndices[origArrJ.key] = i;
	  keyIndices[origArrI.key] = j;
	};

	var dijkstra_1 = dijkstra;

	var DEFAULT_WEIGHT_FUNC = lodash_1.constant(1);

	function dijkstra(g, source, weightFn, edgeFn) {
	  return runDijkstra(g, String(source),
	    weightFn || DEFAULT_WEIGHT_FUNC,
	    edgeFn || function(v) { return g.outEdges(v); });
	}

	function runDijkstra(g, source, weightFn, edgeFn) {
	  var results = {};
	  var pq = new priorityQueue();
	  var v, vEntry;

	  var updateNeighbors = function(edge) {
	    var w = edge.v !== v ? edge.v : edge.w;
	    var wEntry = results[w];
	    var weight = weightFn(edge);
	    var distance = vEntry.distance + weight;

	    if (weight < 0) {
	      throw new Error("dijkstra does not allow negative edge weights. " +
	                      "Bad edge: " + edge + " Weight: " + weight);
	    }

	    if (distance < wEntry.distance) {
	      wEntry.distance = distance;
	      wEntry.predecessor = v;
	      pq.decrease(w, distance);
	    }
	  };

	  g.nodes().forEach(function(v) {
	    var distance = v === source ? 0 : Number.POSITIVE_INFINITY;
	    results[v] = { distance: distance };
	    pq.add(v, distance);
	  });

	  while (pq.size() > 0) {
	    v = pq.removeMin();
	    vEntry = results[v];
	    if (vEntry.distance === Number.POSITIVE_INFINITY) {
	      break;
	    }

	    edgeFn(v).forEach(updateNeighbors);
	  }

	  return results;
	}

	var dijkstraAll_1 = dijkstraAll;

	function dijkstraAll(g, weightFunc, edgeFunc) {
	  return lodash_1.transform(g.nodes(), function(acc, v) {
	    acc[v] = dijkstra_1(g, v, weightFunc, edgeFunc);
	  }, {});
	}

	var tarjan_1 = tarjan;

	function tarjan(g) {
	  var index = 0;
	  var stack = [];
	  var visited = {}; // node id -> { onStack, lowlink, index }
	  var results = [];

	  function dfs(v) {
	    var entry = visited[v] = {
	      onStack: true,
	      lowlink: index,
	      index: index++
	    };
	    stack.push(v);

	    g.successors(v).forEach(function(w) {
	      if (!lodash_1.has(visited, w)) {
	        dfs(w);
	        entry.lowlink = Math.min(entry.lowlink, visited[w].lowlink);
	      } else if (visited[w].onStack) {
	        entry.lowlink = Math.min(entry.lowlink, visited[w].index);
	      }
	    });

	    if (entry.lowlink === entry.index) {
	      var cmpt = [];
	      var w;
	      do {
	        w = stack.pop();
	        visited[w].onStack = false;
	        cmpt.push(w);
	      } while (v !== w);
	      results.push(cmpt);
	    }
	  }

	  g.nodes().forEach(function(v) {
	    if (!lodash_1.has(visited, v)) {
	      dfs(v);
	    }
	  });

	  return results;
	}

	var findCycles_1 = findCycles;

	function findCycles(g) {
	  return lodash_1.filter(tarjan_1(g), function(cmpt) {
	    return cmpt.length > 1 || (cmpt.length === 1 && g.hasEdge(cmpt[0], cmpt[0]));
	  });
	}

	var floydWarshall_1 = floydWarshall;

	var DEFAULT_WEIGHT_FUNC$1 = lodash_1.constant(1);

	function floydWarshall(g, weightFn, edgeFn) {
	  return runFloydWarshall(g,
	    weightFn || DEFAULT_WEIGHT_FUNC$1,
	    edgeFn || function(v) { return g.outEdges(v); });
	}

	function runFloydWarshall(g, weightFn, edgeFn) {
	  var results = {};
	  var nodes = g.nodes();

	  nodes.forEach(function(v) {
	    results[v] = {};
	    results[v][v] = { distance: 0 };
	    nodes.forEach(function(w) {
	      if (v !== w) {
	        results[v][w] = { distance: Number.POSITIVE_INFINITY };
	      }
	    });
	    edgeFn(v).forEach(function(edge) {
	      var w = edge.v === v ? edge.w : edge.v;
	      var d = weightFn(edge);
	      results[v][w] = { distance: d, predecessor: v };
	    });
	  });

	  nodes.forEach(function(k) {
	    var rowK = results[k];
	    nodes.forEach(function(i) {
	      var rowI = results[i];
	      nodes.forEach(function(j) {
	        var ik = rowI[k];
	        var kj = rowK[j];
	        var ij = rowI[j];
	        var altDistance = ik.distance + kj.distance;
	        if (altDistance < ij.distance) {
	          ij.distance = altDistance;
	          ij.predecessor = kj.predecessor;
	        }
	      });
	    });
	  });

	  return results;
	}

	var topsort_1 = topsort;
	topsort.CycleException = CycleException;

	function topsort(g) {
	  var visited = {};
	  var stack = {};
	  var results = [];

	  function visit(node) {
	    if (lodash_1.has(stack, node)) {
	      throw new CycleException();
	    }

	    if (!lodash_1.has(visited, node)) {
	      stack[node] = true;
	      visited[node] = true;
	      lodash_1.each(g.predecessors(node), visit);
	      delete stack[node];
	      results.push(node);
	    }
	  }

	  lodash_1.each(g.sinks(), visit);

	  if (lodash_1.size(visited) !== g.nodeCount()) {
	    throw new CycleException();
	  }

	  return results;
	}

	function CycleException() {}
	CycleException.prototype = new Error(); // must be an instance of Error to pass testing

	var isAcyclic_1 = isAcyclic;

	function isAcyclic(g) {
	  try {
	    topsort_1(g);
	  } catch (e) {
	    if (e instanceof topsort_1.CycleException) {
	      return false;
	    }
	    throw e;
	  }
	  return true;
	}

	var dfs_1 = dfs;

	/*
	 * A helper that preforms a pre- or post-order traversal on the input graph
	 * and returns the nodes in the order they were visited. If the graph is
	 * undirected then this algorithm will navigate using neighbors. If the graph
	 * is directed then this algorithm will navigate using successors.
	 *
	 * Order must be one of "pre" or "post".
	 */
	function dfs(g, vs, order) {
	  if (!lodash_1.isArray(vs)) {
	    vs = [vs];
	  }

	  var navigation = (g.isDirected() ? g.successors : g.neighbors).bind(g);

	  var acc = [];
	  var visited = {};
	  lodash_1.each(vs, function(v) {
	    if (!g.hasNode(v)) {
	      throw new Error("Graph does not have node: " + v);
	    }

	    doDfs(g, v, order === "post", visited, navigation, acc);
	  });
	  return acc;
	}

	function doDfs(g, v, postorder, visited, navigation, acc) {
	  if (!lodash_1.has(visited, v)) {
	    visited[v] = true;

	    if (!postorder) { acc.push(v); }
	    lodash_1.each(navigation(v), function(w) {
	      doDfs(g, w, postorder, visited, navigation, acc);
	    });
	    if (postorder) { acc.push(v); }
	  }
	}

	var postorder_1 = postorder;

	function postorder(g, vs) {
	  return dfs_1(g, vs, "post");
	}

	var preorder_1 = preorder;

	function preorder(g, vs) {
	  return dfs_1(g, vs, "pre");
	}

	var prim_1 = prim;

	function prim(g, weightFunc) {
	  var result = new graph();
	  var parents = {};
	  var pq = new priorityQueue();
	  var v;

	  function updateNeighbors(edge) {
	    var w = edge.v === v ? edge.w : edge.v;
	    var pri = pq.priority(w);
	    if (pri !== undefined) {
	      var edgeWeight = weightFunc(edge);
	      if (edgeWeight < pri) {
	        parents[w] = v;
	        pq.decrease(w, edgeWeight);
	      }
	    }
	  }

	  if (g.nodeCount() === 0) {
	    return result;
	  }

	  lodash_1.each(g.nodes(), function(v) {
	    pq.add(v, Number.POSITIVE_INFINITY);
	    result.setNode(v);
	  });

	  // Start from an arbitrary node
	  pq.decrease(g.nodes()[0], 0);

	  var init = false;
	  while (pq.size() > 0) {
	    v = pq.removeMin();
	    if (lodash_1.has(parents, v)) {
	      result.setEdge(v, parents[v]);
	    } else if (init) {
	      throw new Error("Input graph is not connected: " + g);
	    } else {
	      init = true;
	    }

	    g.nodeEdges(v).forEach(updateNeighbors);
	  }

	  return result;
	}

	var alg = {
	  components: components_1,
	  dijkstra: dijkstra_1,
	  dijkstraAll: dijkstraAll_1,
	  findCycles: findCycles_1,
	  floydWarshall: floydWarshall_1,
	  isAcyclic: isAcyclic_1,
	  postorder: postorder_1,
	  preorder: preorder_1,
	  prim: prim_1,
	  tarjan: tarjan_1,
	  topsort: topsort_1
	};

	/**
	 * Copyright (c) 2014, Chris Pettitt
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are met:
	 *
	 * 1. Redistributions of source code must retain the above copyright notice, this
	 * list of conditions and the following disclaimer.
	 *
	 * 2. Redistributions in binary form must reproduce the above copyright notice,
	 * this list of conditions and the following disclaimer in the documentation
	 * and/or other materials provided with the distribution.
	 *
	 * 3. Neither the name of the copyright holder nor the names of its contributors
	 * may be used to endorse or promote products derived from this software without
	 * specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
	 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
	 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
	 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
	 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
	 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */



	var graphlib = {
	  Graph: lib.Graph,
	  json: json,
	  alg: alg,
	  version: lib.version
	};

	/* global window */

	var graphlib$1;

	if (typeof commonjsRequire === "function") {
	  try {
	    graphlib$1 = graphlib;
	  } catch (e) {
	    // continue regardless of error
	  }
	}

	if (!graphlib$1) {
	  graphlib$1 = window.graphlib;
	}

	var graphlib_1 = graphlib$1;

	/** Used to compose bitmasks for cloning. */
	var CLONE_DEEP_FLAG$1 = 1,
	    CLONE_SYMBOLS_FLAG$2 = 4;

	/**
	 * This method is like `_.clone` except that it recursively clones `value`.
	 *
	 * @static
	 * @memberOf _
	 * @since 1.0.0
	 * @category Lang
	 * @param {*} value The value to recursively clone.
	 * @returns {*} Returns the deep cloned value.
	 * @see _.clone
	 * @example
	 *
	 * var objects = [{ 'a': 1 }, { 'b': 2 }];
	 *
	 * var deep = _.cloneDeep(objects);
	 * console.log(deep[0] === objects[0]);
	 * // => false
	 */
	function cloneDeep(value) {
	  return _baseClone(value, CLONE_DEEP_FLAG$1 | CLONE_SYMBOLS_FLAG$2);
	}

	var cloneDeep_1 = cloneDeep;

	/**
	 * Checks if the given arguments are from an iteratee call.
	 *
	 * @private
	 * @param {*} value The potential iteratee value argument.
	 * @param {*} index The potential iteratee index or key argument.
	 * @param {*} object The potential iteratee object argument.
	 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
	 *  else `false`.
	 */
	function isIterateeCall(value, index, object) {
	  if (!isObject_1(object)) {
	    return false;
	  }
	  var type = typeof index;
	  if (type == 'number'
	        ? (isArrayLike_1(object) && _isIndex(index, object.length))
	        : (type == 'string' && index in object)
	      ) {
	    return eq_1(object[index], value);
	  }
	  return false;
	}

	var _isIterateeCall = isIterateeCall;

	/** Used for built-in method references. */
	var objectProto$h = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$e = objectProto$h.hasOwnProperty;

	/**
	 * Assigns own and inherited enumerable string keyed properties of source
	 * objects to the destination object for all destination properties that
	 * resolve to `undefined`. Source objects are applied from left to right.
	 * Once a property is set, additional values of the same property are ignored.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} [sources] The source objects.
	 * @returns {Object} Returns `object`.
	 * @see _.defaultsDeep
	 * @example
	 *
	 * _.defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
	 * // => { 'a': 1, 'b': 2 }
	 */
	var defaults = _baseRest(function(object, sources) {
	  object = Object(object);

	  var index = -1;
	  var length = sources.length;
	  var guard = length > 2 ? sources[2] : undefined;

	  if (guard && _isIterateeCall(sources[0], sources[1], guard)) {
	    length = 1;
	  }

	  while (++index < length) {
	    var source = sources[index];
	    var props = keysIn_1(source);
	    var propsIndex = -1;
	    var propsLength = props.length;

	    while (++propsIndex < propsLength) {
	      var key = props[propsIndex];
	      var value = object[key];

	      if (value === undefined ||
	          (eq_1(value, objectProto$h[key]) && !hasOwnProperty$e.call(object, key))) {
	        object[key] = source[key];
	      }
	    }
	  }

	  return object;
	});

	var defaults_1 = defaults;

	/**
	 * Creates a `_.find` or `_.findLast` function.
	 *
	 * @private
	 * @param {Function} findIndexFunc The function to find the collection index.
	 * @returns {Function} Returns the new find function.
	 */
	function createFind(findIndexFunc) {
	  return function(collection, predicate, fromIndex) {
	    var iterable = Object(collection);
	    if (!isArrayLike_1(collection)) {
	      var iteratee = _baseIteratee(predicate);
	      collection = keys_1(collection);
	      predicate = function(key) { return iteratee(iterable[key], key, iterable); };
	    }
	    var index = findIndexFunc(collection, predicate, fromIndex);
	    return index > -1 ? iterable[iteratee ? collection[index] : index] : undefined;
	  };
	}

	var _createFind = createFind;

	/** Used as references for various `Number` constants. */
	var NAN = 0 / 0;

	/** Used to match leading and trailing whitespace. */
	var reTrim = /^\s+|\s+$/g;

	/** Used to detect bad signed hexadecimal string values. */
	var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

	/** Used to detect binary string values. */
	var reIsBinary = /^0b[01]+$/i;

	/** Used to detect octal string values. */
	var reIsOctal = /^0o[0-7]+$/i;

	/** Built-in method references without a dependency on `root`. */
	var freeParseInt = parseInt;

	/**
	 * Converts `value` to a number.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {number} Returns the number.
	 * @example
	 *
	 * _.toNumber(3.2);
	 * // => 3.2
	 *
	 * _.toNumber(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toNumber(Infinity);
	 * // => Infinity
	 *
	 * _.toNumber('3.2');
	 * // => 3.2
	 */
	function toNumber(value) {
	  if (typeof value == 'number') {
	    return value;
	  }
	  if (isSymbol_1(value)) {
	    return NAN;
	  }
	  if (isObject_1(value)) {
	    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
	    value = isObject_1(other) ? (other + '') : other;
	  }
	  if (typeof value != 'string') {
	    return value === 0 ? value : +value;
	  }
	  value = value.replace(reTrim, '');
	  var isBinary = reIsBinary.test(value);
	  return (isBinary || reIsOctal.test(value))
	    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
	    : (reIsBadHex.test(value) ? NAN : +value);
	}

	var toNumber_1 = toNumber;

	/** Used as references for various `Number` constants. */
	var INFINITY$3 = 1 / 0,
	    MAX_INTEGER = 1.7976931348623157e+308;

	/**
	 * Converts `value` to a finite number.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.12.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted number.
	 * @example
	 *
	 * _.toFinite(3.2);
	 * // => 3.2
	 *
	 * _.toFinite(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toFinite(Infinity);
	 * // => 1.7976931348623157e+308
	 *
	 * _.toFinite('3.2');
	 * // => 3.2
	 */
	function toFinite(value) {
	  if (!value) {
	    return value === 0 ? value : 0;
	  }
	  value = toNumber_1(value);
	  if (value === INFINITY$3 || value === -INFINITY$3) {
	    var sign = (value < 0 ? -1 : 1);
	    return sign * MAX_INTEGER;
	  }
	  return value === value ? value : 0;
	}

	var toFinite_1 = toFinite;

	/**
	 * Converts `value` to an integer.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted integer.
	 * @example
	 *
	 * _.toInteger(3.2);
	 * // => 3
	 *
	 * _.toInteger(Number.MIN_VALUE);
	 * // => 0
	 *
	 * _.toInteger(Infinity);
	 * // => 1.7976931348623157e+308
	 *
	 * _.toInteger('3.2');
	 * // => 3
	 */
	function toInteger(value) {
	  var result = toFinite_1(value),
	      remainder = result % 1;

	  return result === result ? (remainder ? result - remainder : result) : 0;
	}

	var toInteger_1 = toInteger;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeMax$1 = Math.max;

	/**
	 * This method is like `_.find` except that it returns the index of the first
	 * element `predicate` returns truthy for instead of the element itself.
	 *
	 * @static
	 * @memberOf _
	 * @since 1.1.0
	 * @category Array
	 * @param {Array} array The array to inspect.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @param {number} [fromIndex=0] The index to search from.
	 * @returns {number} Returns the index of the found element, else `-1`.
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'barney',  'active': false },
	 *   { 'user': 'fred',    'active': false },
	 *   { 'user': 'pebbles', 'active': true }
	 * ];
	 *
	 * _.findIndex(users, function(o) { return o.user == 'barney'; });
	 * // => 0
	 *
	 * // The `_.matches` iteratee shorthand.
	 * _.findIndex(users, { 'user': 'fred', 'active': false });
	 * // => 1
	 *
	 * // The `_.matchesProperty` iteratee shorthand.
	 * _.findIndex(users, ['active', false]);
	 * // => 0
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.findIndex(users, 'active');
	 * // => 2
	 */
	function findIndex(array, predicate, fromIndex) {
	  var length = array == null ? 0 : array.length;
	  if (!length) {
	    return -1;
	  }
	  var index = fromIndex == null ? 0 : toInteger_1(fromIndex);
	  if (index < 0) {
	    index = nativeMax$1(length + index, 0);
	  }
	  return _baseFindIndex(array, _baseIteratee(predicate), index);
	}

	var findIndex_1 = findIndex;

	/**
	 * Iterates over elements of `collection`, returning the first element
	 * `predicate` returns truthy for. The predicate is invoked with three
	 * arguments: (value, index|key, collection).
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to inspect.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @param {number} [fromIndex=0] The index to search from.
	 * @returns {*} Returns the matched element, else `undefined`.
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'barney',  'age': 36, 'active': true },
	 *   { 'user': 'fred',    'age': 40, 'active': false },
	 *   { 'user': 'pebbles', 'age': 1,  'active': true }
	 * ];
	 *
	 * _.find(users, function(o) { return o.age < 40; });
	 * // => object for 'barney'
	 *
	 * // The `_.matches` iteratee shorthand.
	 * _.find(users, { 'age': 1, 'active': true });
	 * // => object for 'pebbles'
	 *
	 * // The `_.matchesProperty` iteratee shorthand.
	 * _.find(users, ['active', false]);
	 * // => object for 'fred'
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.find(users, 'active');
	 * // => object for 'barney'
	 */
	var find = _createFind(findIndex_1);

	var find_1 = find;

	/**
	 * Flattens `array` a single level deep.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Array
	 * @param {Array} array The array to flatten.
	 * @returns {Array} Returns the new flattened array.
	 * @example
	 *
	 * _.flatten([1, [2, [3, [4]], 5]]);
	 * // => [1, 2, [3, [4]], 5]
	 */
	function flatten(array) {
	  var length = array == null ? 0 : array.length;
	  return length ? _baseFlatten(array, 1) : [];
	}

	var flatten_1 = flatten;

	/**
	 * Iterates over own and inherited enumerable string keyed properties of an
	 * object and invokes `iteratee` for each property. The iteratee is invoked
	 * with three arguments: (value, key, object). Iteratee functions may exit
	 * iteration early by explicitly returning `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.3.0
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Object} Returns `object`.
	 * @see _.forInRight
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.forIn(new Foo, function(value, key) {
	 *   console.log(key);
	 * });
	 * // => Logs 'a', 'b', then 'c' (iteration order is not guaranteed).
	 */
	function forIn(object, iteratee) {
	  return object == null
	    ? object
	    : _baseFor(object, _castFunction(iteratee), keysIn_1);
	}

	var forIn_1 = forIn;

	/**
	 * Gets the last element of `array`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Array
	 * @param {Array} array The array to query.
	 * @returns {*} Returns the last element of `array`.
	 * @example
	 *
	 * _.last([1, 2, 3]);
	 * // => 3
	 */
	function last(array) {
	  var length = array == null ? 0 : array.length;
	  return length ? array[length - 1] : undefined;
	}

	var last_1 = last;

	/**
	 * Creates an object with the same keys as `object` and values generated
	 * by running each own enumerable string keyed property of `object` thru
	 * `iteratee`. The iteratee is invoked with three arguments:
	 * (value, key, object).
	 *
	 * @static
	 * @memberOf _
	 * @since 2.4.0
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Object} Returns the new mapped object.
	 * @see _.mapKeys
	 * @example
	 *
	 * var users = {
	 *   'fred':    { 'user': 'fred',    'age': 40 },
	 *   'pebbles': { 'user': 'pebbles', 'age': 1 }
	 * };
	 *
	 * _.mapValues(users, function(o) { return o.age; });
	 * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.mapValues(users, 'age');
	 * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
	 */
	function mapValues(object, iteratee) {
	  var result = {};
	  iteratee = _baseIteratee(iteratee);

	  _baseForOwn(object, function(value, key, object) {
	    _baseAssignValue(result, key, iteratee(value, key, object));
	  });
	  return result;
	}

	var mapValues_1 = mapValues;

	/**
	 * The base implementation of methods like `_.max` and `_.min` which accepts a
	 * `comparator` to determine the extremum value.
	 *
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} iteratee The iteratee invoked per iteration.
	 * @param {Function} comparator The comparator used to compare values.
	 * @returns {*} Returns the extremum value.
	 */
	function baseExtremum(array, iteratee, comparator) {
	  var index = -1,
	      length = array.length;

	  while (++index < length) {
	    var value = array[index],
	        current = iteratee(value);

	    if (current != null && (computed === undefined
	          ? (current === current && !isSymbol_1(current))
	          : comparator(current, computed)
	        )) {
	      var computed = current,
	          result = value;
	    }
	  }
	  return result;
	}

	var _baseExtremum = baseExtremum;

	/**
	 * The base implementation of `_.gt` which doesn't coerce arguments.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if `value` is greater than `other`,
	 *  else `false`.
	 */
	function baseGt(value, other) {
	  return value > other;
	}

	var _baseGt = baseGt;

	/**
	 * Computes the maximum value of `array`. If `array` is empty or falsey,
	 * `undefined` is returned.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Math
	 * @param {Array} array The array to iterate over.
	 * @returns {*} Returns the maximum value.
	 * @example
	 *
	 * _.max([4, 2, 8, 6]);
	 * // => 8
	 *
	 * _.max([]);
	 * // => undefined
	 */
	function max(array) {
	  return (array && array.length)
	    ? _baseExtremum(array, identity_1, _baseGt)
	    : undefined;
	}

	var max_1 = max;

	/**
	 * This function is like `assignValue` except that it doesn't assign
	 * `undefined` values.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function assignMergeValue(object, key, value) {
	  if ((value !== undefined && !eq_1(object[key], value)) ||
	      (value === undefined && !(key in object))) {
	    _baseAssignValue(object, key, value);
	  }
	}

	var _assignMergeValue = assignMergeValue;

	/** `Object#toString` result references. */
	var objectTag$4 = '[object Object]';

	/** Used for built-in method references. */
	var funcProto$2 = Function.prototype,
	    objectProto$i = Object.prototype;

	/** Used to resolve the decompiled source of functions. */
	var funcToString$2 = funcProto$2.toString;

	/** Used to check objects for own properties. */
	var hasOwnProperty$f = objectProto$i.hasOwnProperty;

	/** Used to infer the `Object` constructor. */
	var objectCtorString = funcToString$2.call(Object);

	/**
	 * Checks if `value` is a plain object, that is, an object created by the
	 * `Object` constructor or one with a `[[Prototype]]` of `null`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.8.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 * }
	 *
	 * _.isPlainObject(new Foo);
	 * // => false
	 *
	 * _.isPlainObject([1, 2, 3]);
	 * // => false
	 *
	 * _.isPlainObject({ 'x': 0, 'y': 0 });
	 * // => true
	 *
	 * _.isPlainObject(Object.create(null));
	 * // => true
	 */
	function isPlainObject(value) {
	  if (!isObjectLike_1(value) || _baseGetTag(value) != objectTag$4) {
	    return false;
	  }
	  var proto = _getPrototype(value);
	  if (proto === null) {
	    return true;
	  }
	  var Ctor = hasOwnProperty$f.call(proto, 'constructor') && proto.constructor;
	  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
	    funcToString$2.call(Ctor) == objectCtorString;
	}

	var isPlainObject_1 = isPlainObject;

	/**
	 * Gets the value at `key`, unless `key` is "__proto__" or "constructor".
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function safeGet(object, key) {
	  if (key === 'constructor' && typeof object[key] === 'function') {
	    return;
	  }

	  if (key == '__proto__') {
	    return;
	  }

	  return object[key];
	}

	var _safeGet = safeGet;

	/**
	 * Converts `value` to a plain object flattening inherited enumerable string
	 * keyed properties of `value` to own properties of the plain object.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {Object} Returns the converted plain object.
	 * @example
	 *
	 * function Foo() {
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.assign({ 'a': 1 }, new Foo);
	 * // => { 'a': 1, 'b': 2 }
	 *
	 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
	 * // => { 'a': 1, 'b': 2, 'c': 3 }
	 */
	function toPlainObject(value) {
	  return _copyObject(value, keysIn_1(value));
	}

	var toPlainObject_1 = toPlainObject;

	/**
	 * A specialized version of `baseMerge` for arrays and objects which performs
	 * deep merges and tracks traversed objects enabling objects with circular
	 * references to be merged.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @param {string} key The key of the value to merge.
	 * @param {number} srcIndex The index of `source`.
	 * @param {Function} mergeFunc The function to merge values.
	 * @param {Function} [customizer] The function to customize assigned values.
	 * @param {Object} [stack] Tracks traversed source values and their merged
	 *  counterparts.
	 */
	function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
	  var objValue = _safeGet(object, key),
	      srcValue = _safeGet(source, key),
	      stacked = stack.get(srcValue);

	  if (stacked) {
	    _assignMergeValue(object, key, stacked);
	    return;
	  }
	  var newValue = customizer
	    ? customizer(objValue, srcValue, (key + ''), object, source, stack)
	    : undefined;

	  var isCommon = newValue === undefined;

	  if (isCommon) {
	    var isArr = isArray_1(srcValue),
	        isBuff = !isArr && isBuffer_1(srcValue),
	        isTyped = !isArr && !isBuff && isTypedArray_1(srcValue);

	    newValue = srcValue;
	    if (isArr || isBuff || isTyped) {
	      if (isArray_1(objValue)) {
	        newValue = objValue;
	      }
	      else if (isArrayLikeObject_1(objValue)) {
	        newValue = _copyArray(objValue);
	      }
	      else if (isBuff) {
	        isCommon = false;
	        newValue = _cloneBuffer(srcValue, true);
	      }
	      else if (isTyped) {
	        isCommon = false;
	        newValue = _cloneTypedArray(srcValue, true);
	      }
	      else {
	        newValue = [];
	      }
	    }
	    else if (isPlainObject_1(srcValue) || isArguments_1(srcValue)) {
	      newValue = objValue;
	      if (isArguments_1(objValue)) {
	        newValue = toPlainObject_1(objValue);
	      }
	      else if (!isObject_1(objValue) || isFunction_1(objValue)) {
	        newValue = _initCloneObject(srcValue);
	      }
	    }
	    else {
	      isCommon = false;
	    }
	  }
	  if (isCommon) {
	    // Recursively merge objects and arrays (susceptible to call stack limits).
	    stack.set(srcValue, newValue);
	    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
	    stack['delete'](srcValue);
	  }
	  _assignMergeValue(object, key, newValue);
	}

	var _baseMergeDeep = baseMergeDeep;

	/**
	 * The base implementation of `_.merge` without support for multiple sources.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @param {number} srcIndex The index of `source`.
	 * @param {Function} [customizer] The function to customize merged values.
	 * @param {Object} [stack] Tracks traversed source values and their merged
	 *  counterparts.
	 */
	function baseMerge(object, source, srcIndex, customizer, stack) {
	  if (object === source) {
	    return;
	  }
	  _baseFor(source, function(srcValue, key) {
	    stack || (stack = new _Stack);
	    if (isObject_1(srcValue)) {
	      _baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
	    }
	    else {
	      var newValue = customizer
	        ? customizer(_safeGet(object, key), srcValue, (key + ''), object, source, stack)
	        : undefined;

	      if (newValue === undefined) {
	        newValue = srcValue;
	      }
	      _assignMergeValue(object, key, newValue);
	    }
	  }, keysIn_1);
	}

	var _baseMerge = baseMerge;

	/**
	 * Creates a function like `_.assign`.
	 *
	 * @private
	 * @param {Function} assigner The function to assign values.
	 * @returns {Function} Returns the new assigner function.
	 */
	function createAssigner(assigner) {
	  return _baseRest(function(object, sources) {
	    var index = -1,
	        length = sources.length,
	        customizer = length > 1 ? sources[length - 1] : undefined,
	        guard = length > 2 ? sources[2] : undefined;

	    customizer = (assigner.length > 3 && typeof customizer == 'function')
	      ? (length--, customizer)
	      : undefined;

	    if (guard && _isIterateeCall(sources[0], sources[1], guard)) {
	      customizer = length < 3 ? undefined : customizer;
	      length = 1;
	    }
	    object = Object(object);
	    while (++index < length) {
	      var source = sources[index];
	      if (source) {
	        assigner(object, source, index, customizer);
	      }
	    }
	    return object;
	  });
	}

	var _createAssigner = createAssigner;

	/**
	 * This method is like `_.assign` except that it recursively merges own and
	 * inherited enumerable string keyed properties of source objects into the
	 * destination object. Source properties that resolve to `undefined` are
	 * skipped if a destination value exists. Array and plain object properties
	 * are merged recursively. Other objects and value types are overridden by
	 * assignment. Source objects are applied from left to right. Subsequent
	 * sources overwrite property assignments of previous sources.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.5.0
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} [sources] The source objects.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * var object = {
	 *   'a': [{ 'b': 2 }, { 'd': 4 }]
	 * };
	 *
	 * var other = {
	 *   'a': [{ 'c': 3 }, { 'e': 5 }]
	 * };
	 *
	 * _.merge(object, other);
	 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
	 */
	var merge = _createAssigner(function(object, source, srcIndex) {
	  _baseMerge(object, source, srcIndex);
	});

	var merge_1 = merge;

	/**
	 * The base implementation of `_.lt` which doesn't coerce arguments.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if `value` is less than `other`,
	 *  else `false`.
	 */
	function baseLt(value, other) {
	  return value < other;
	}

	var _baseLt = baseLt;

	/**
	 * Computes the minimum value of `array`. If `array` is empty or falsey,
	 * `undefined` is returned.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Math
	 * @param {Array} array The array to iterate over.
	 * @returns {*} Returns the minimum value.
	 * @example
	 *
	 * _.min([4, 2, 8, 6]);
	 * // => 2
	 *
	 * _.min([]);
	 * // => undefined
	 */
	function min(array) {
	  return (array && array.length)
	    ? _baseExtremum(array, identity_1, _baseLt)
	    : undefined;
	}

	var min_1 = min;

	/**
	 * This method is like `_.min` except that it accepts `iteratee` which is
	 * invoked for each element in `array` to generate the criterion by which
	 * the value is ranked. The iteratee is invoked with one argument: (value).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Math
	 * @param {Array} array The array to iterate over.
	 * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
	 * @returns {*} Returns the minimum value.
	 * @example
	 *
	 * var objects = [{ 'n': 1 }, { 'n': 2 }];
	 *
	 * _.minBy(objects, function(o) { return o.n; });
	 * // => { 'n': 1 }
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.minBy(objects, 'n');
	 * // => { 'n': 1 }
	 */
	function minBy(array, iteratee) {
	  return (array && array.length)
	    ? _baseExtremum(array, _baseIteratee(iteratee), _baseLt)
	    : undefined;
	}

	var minBy_1 = minBy;

	/**
	 * Gets the timestamp of the number of milliseconds that have elapsed since
	 * the Unix epoch (1 January 1970 00:00:00 UTC).
	 *
	 * @static
	 * @memberOf _
	 * @since 2.4.0
	 * @category Date
	 * @returns {number} Returns the timestamp.
	 * @example
	 *
	 * _.defer(function(stamp) {
	 *   console.log(_.now() - stamp);
	 * }, _.now());
	 * // => Logs the number of milliseconds it took for the deferred invocation.
	 */
	var now = function() {
	  return _root.Date.now();
	};

	var now_1 = now;

	/**
	 * The base implementation of `_.set`.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @param {Function} [customizer] The function to customize path creation.
	 * @returns {Object} Returns `object`.
	 */
	function baseSet(object, path, value, customizer) {
	  if (!isObject_1(object)) {
	    return object;
	  }
	  path = _castPath(path, object);

	  var index = -1,
	      length = path.length,
	      lastIndex = length - 1,
	      nested = object;

	  while (nested != null && ++index < length) {
	    var key = _toKey(path[index]),
	        newValue = value;

	    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
	      return object;
	    }

	    if (index != lastIndex) {
	      var objValue = nested[key];
	      newValue = customizer ? customizer(objValue, key, nested) : undefined;
	      if (newValue === undefined) {
	        newValue = isObject_1(objValue)
	          ? objValue
	          : (_isIndex(path[index + 1]) ? [] : {});
	      }
	    }
	    _assignValue(nested, key, newValue);
	    nested = nested[key];
	  }
	  return object;
	}

	var _baseSet = baseSet;

	/**
	 * The base implementation of  `_.pickBy` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Object} object The source object.
	 * @param {string[]} paths The property paths to pick.
	 * @param {Function} predicate The function invoked per property.
	 * @returns {Object} Returns the new object.
	 */
	function basePickBy(object, paths, predicate) {
	  var index = -1,
	      length = paths.length,
	      result = {};

	  while (++index < length) {
	    var path = paths[index],
	        value = _baseGet(object, path);

	    if (predicate(value, path)) {
	      _baseSet(result, _castPath(path, object), value);
	    }
	  }
	  return result;
	}

	var _basePickBy = basePickBy;

	/**
	 * The base implementation of `_.pick` without support for individual
	 * property identifiers.
	 *
	 * @private
	 * @param {Object} object The source object.
	 * @param {string[]} paths The property paths to pick.
	 * @returns {Object} Returns the new object.
	 */
	function basePick(object, paths) {
	  return _basePickBy(object, paths, function(value, path) {
	    return hasIn_1(object, path);
	  });
	}

	var _basePick = basePick;

	/**
	 * A specialized version of `baseRest` which flattens the rest array.
	 *
	 * @private
	 * @param {Function} func The function to apply a rest parameter to.
	 * @returns {Function} Returns the new function.
	 */
	function flatRest(func) {
	  return _setToString(_overRest(func, undefined, flatten_1), func + '');
	}

	var _flatRest = flatRest;

	/**
	 * Creates an object composed of the picked `object` properties.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The source object.
	 * @param {...(string|string[])} [paths] The property paths to pick.
	 * @returns {Object} Returns the new object.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': '2', 'c': 3 };
	 *
	 * _.pick(object, ['a', 'c']);
	 * // => { 'a': 1, 'c': 3 }
	 */
	var pick = _flatRest(function(object, paths) {
	  return object == null ? {} : _basePick(object, paths);
	});

	var pick_1 = pick;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeCeil = Math.ceil,
	    nativeMax$2 = Math.max;

	/**
	 * The base implementation of `_.range` and `_.rangeRight` which doesn't
	 * coerce arguments.
	 *
	 * @private
	 * @param {number} start The start of the range.
	 * @param {number} end The end of the range.
	 * @param {number} step The value to increment or decrement by.
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {Array} Returns the range of numbers.
	 */
	function baseRange(start, end, step, fromRight) {
	  var index = -1,
	      length = nativeMax$2(nativeCeil((end - start) / (step || 1)), 0),
	      result = Array(length);

	  while (length--) {
	    result[fromRight ? length : ++index] = start;
	    start += step;
	  }
	  return result;
	}

	var _baseRange = baseRange;

	/**
	 * Creates a `_.range` or `_.rangeRight` function.
	 *
	 * @private
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {Function} Returns the new range function.
	 */
	function createRange(fromRight) {
	  return function(start, end, step) {
	    if (step && typeof step != 'number' && _isIterateeCall(start, end, step)) {
	      end = step = undefined;
	    }
	    // Ensure the sign of `-0` is preserved.
	    start = toFinite_1(start);
	    if (end === undefined) {
	      end = start;
	      start = 0;
	    } else {
	      end = toFinite_1(end);
	    }
	    step = step === undefined ? (start < end ? 1 : -1) : toFinite_1(step);
	    return _baseRange(start, end, step, fromRight);
	  };
	}

	var _createRange = createRange;

	/**
	 * Creates an array of numbers (positive and/or negative) progressing from
	 * `start` up to, but not including, `end`. A step of `-1` is used if a negative
	 * `start` is specified without an `end` or `step`. If `end` is not specified,
	 * it's set to `start` with `start` then set to `0`.
	 *
	 * **Note:** JavaScript follows the IEEE-754 standard for resolving
	 * floating-point values which can produce unexpected results.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Util
	 * @param {number} [start=0] The start of the range.
	 * @param {number} end The end of the range.
	 * @param {number} [step=1] The value to increment or decrement by.
	 * @returns {Array} Returns the range of numbers.
	 * @see _.inRange, _.rangeRight
	 * @example
	 *
	 * _.range(4);
	 * // => [0, 1, 2, 3]
	 *
	 * _.range(-4);
	 * // => [0, -1, -2, -3]
	 *
	 * _.range(1, 5);
	 * // => [1, 2, 3, 4]
	 *
	 * _.range(0, 20, 5);
	 * // => [0, 5, 10, 15]
	 *
	 * _.range(0, -4, -1);
	 * // => [0, -1, -2, -3]
	 *
	 * _.range(1, 4, 0);
	 * // => [1, 1, 1]
	 *
	 * _.range(0);
	 * // => []
	 */
	var range = _createRange();

	var range_1 = range;

	/**
	 * The base implementation of `_.sortBy` which uses `comparer` to define the
	 * sort order of `array` and replaces criteria objects with their corresponding
	 * values.
	 *
	 * @private
	 * @param {Array} array The array to sort.
	 * @param {Function} comparer The function to define sort order.
	 * @returns {Array} Returns `array`.
	 */
	function baseSortBy(array, comparer) {
	  var length = array.length;

	  array.sort(comparer);
	  while (length--) {
	    array[length] = array[length].value;
	  }
	  return array;
	}

	var _baseSortBy = baseSortBy;

	/**
	 * Compares values to sort them in ascending order.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {number} Returns the sort order indicator for `value`.
	 */
	function compareAscending(value, other) {
	  if (value !== other) {
	    var valIsDefined = value !== undefined,
	        valIsNull = value === null,
	        valIsReflexive = value === value,
	        valIsSymbol = isSymbol_1(value);

	    var othIsDefined = other !== undefined,
	        othIsNull = other === null,
	        othIsReflexive = other === other,
	        othIsSymbol = isSymbol_1(other);

	    if ((!othIsNull && !othIsSymbol && !valIsSymbol && value > other) ||
	        (valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol) ||
	        (valIsNull && othIsDefined && othIsReflexive) ||
	        (!valIsDefined && othIsReflexive) ||
	        !valIsReflexive) {
	      return 1;
	    }
	    if ((!valIsNull && !valIsSymbol && !othIsSymbol && value < other) ||
	        (othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol) ||
	        (othIsNull && valIsDefined && valIsReflexive) ||
	        (!othIsDefined && valIsReflexive) ||
	        !othIsReflexive) {
	      return -1;
	    }
	  }
	  return 0;
	}

	var _compareAscending = compareAscending;

	/**
	 * Used by `_.orderBy` to compare multiple properties of a value to another
	 * and stable sort them.
	 *
	 * If `orders` is unspecified, all values are sorted in ascending order. Otherwise,
	 * specify an order of "desc" for descending or "asc" for ascending sort order
	 * of corresponding values.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {boolean[]|string[]} orders The order to sort by for each property.
	 * @returns {number} Returns the sort order indicator for `object`.
	 */
	function compareMultiple(object, other, orders) {
	  var index = -1,
	      objCriteria = object.criteria,
	      othCriteria = other.criteria,
	      length = objCriteria.length,
	      ordersLength = orders.length;

	  while (++index < length) {
	    var result = _compareAscending(objCriteria[index], othCriteria[index]);
	    if (result) {
	      if (index >= ordersLength) {
	        return result;
	      }
	      var order = orders[index];
	      return result * (order == 'desc' ? -1 : 1);
	    }
	  }
	  // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
	  // that causes it, under certain circumstances, to provide the same value for
	  // `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247
	  // for more details.
	  //
	  // This also ensures a stable sort in V8 and other engines.
	  // See https://bugs.chromium.org/p/v8/issues/detail?id=90 for more details.
	  return object.index - other.index;
	}

	var _compareMultiple = compareMultiple;

	/**
	 * The base implementation of `_.orderBy` without param guards.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
	 * @param {string[]} orders The sort orders of `iteratees`.
	 * @returns {Array} Returns the new sorted array.
	 */
	function baseOrderBy(collection, iteratees, orders) {
	  if (iteratees.length) {
	    iteratees = _arrayMap(iteratees, function(iteratee) {
	      if (isArray_1(iteratee)) {
	        return function(value) {
	          return _baseGet(value, iteratee.length === 1 ? iteratee[0] : iteratee);
	        }
	      }
	      return iteratee;
	    });
	  } else {
	    iteratees = [identity_1];
	  }

	  var index = -1;
	  iteratees = _arrayMap(iteratees, _baseUnary(_baseIteratee));

	  var result = _baseMap(collection, function(value, key, collection) {
	    var criteria = _arrayMap(iteratees, function(iteratee) {
	      return iteratee(value);
	    });
	    return { 'criteria': criteria, 'index': ++index, 'value': value };
	  });

	  return _baseSortBy(result, function(object, other) {
	    return _compareMultiple(object, other, orders);
	  });
	}

	var _baseOrderBy = baseOrderBy;

	/**
	 * Creates an array of elements, sorted in ascending order by the results of
	 * running each element in a collection thru each iteratee. This method
	 * performs a stable sort, that is, it preserves the original sort order of
	 * equal elements. The iteratees are invoked with one argument: (value).
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {...(Function|Function[])} [iteratees=[_.identity]]
	 *  The iteratees to sort by.
	 * @returns {Array} Returns the new sorted array.
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'fred',   'age': 48 },
	 *   { 'user': 'barney', 'age': 36 },
	 *   { 'user': 'fred',   'age': 30 },
	 *   { 'user': 'barney', 'age': 34 }
	 * ];
	 *
	 * _.sortBy(users, [function(o) { return o.user; }]);
	 * // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 30]]
	 *
	 * _.sortBy(users, ['user', 'age']);
	 * // => objects for [['barney', 34], ['barney', 36], ['fred', 30], ['fred', 48]]
	 */
	var sortBy = _baseRest(function(collection, iteratees) {
	  if (collection == null) {
	    return [];
	  }
	  var length = iteratees.length;
	  if (length > 1 && _isIterateeCall(collection, iteratees[0], iteratees[1])) {
	    iteratees = [];
	  } else if (length > 2 && _isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
	    iteratees = [iteratees[0]];
	  }
	  return _baseOrderBy(collection, _baseFlatten(iteratees, 1), []);
	});

	var sortBy_1 = sortBy;

	/** Used to generate unique IDs. */
	var idCounter = 0;

	/**
	 * Generates a unique ID. If `prefix` is given, the ID is appended to it.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Util
	 * @param {string} [prefix=''] The value to prefix the ID with.
	 * @returns {string} Returns the unique ID.
	 * @example
	 *
	 * _.uniqueId('contact_');
	 * // => 'contact_104'
	 *
	 * _.uniqueId();
	 * // => '105'
	 */
	function uniqueId(prefix) {
	  var id = ++idCounter;
	  return toString_1(prefix) + id;
	}

	var uniqueId_1 = uniqueId;

	/**
	 * This base implementation of `_.zipObject` which assigns values using `assignFunc`.
	 *
	 * @private
	 * @param {Array} props The property identifiers.
	 * @param {Array} values The property values.
	 * @param {Function} assignFunc The function to assign values.
	 * @returns {Object} Returns the new object.
	 */
	function baseZipObject(props, values, assignFunc) {
	  var index = -1,
	      length = props.length,
	      valsLength = values.length,
	      result = {};

	  while (++index < length) {
	    var value = index < valsLength ? values[index] : undefined;
	    assignFunc(result, props[index], value);
	  }
	  return result;
	}

	var _baseZipObject = baseZipObject;

	/**
	 * This method is like `_.fromPairs` except that it accepts two arrays,
	 * one of property identifiers and one of corresponding values.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.4.0
	 * @category Array
	 * @param {Array} [props=[]] The property identifiers.
	 * @param {Array} [values=[]] The property values.
	 * @returns {Object} Returns the new object.
	 * @example
	 *
	 * _.zipObject(['a', 'b'], [1, 2]);
	 * // => { 'a': 1, 'b': 2 }
	 */
	function zipObject(props, values) {
	  return _baseZipObject(props || [], values || [], _assignValue);
	}

	var zipObject_1 = zipObject;

	/* global window */

	var lodash$1;

	if (typeof commonjsRequire === "function") {
	  try {
	    lodash$1 = {
	      cloneDeep: cloneDeep_1,
	      constant: constant_1,
	      defaults: defaults_1,
	      each: each,
	      filter: filter_1,
	      find: find_1,
	      flatten: flatten_1,
	      forEach: forEach_1,
	      forIn: forIn_1,
	      has:  has_1,
	      isUndefined: isUndefined_1,
	      last: last_1,
	      map: map_1,
	      mapValues: mapValues_1,
	      max: max_1,
	      merge: merge_1,
	      min: min_1,
	      minBy: minBy_1,
	      now: now_1,
	      pick: pick_1,
	      range: range_1,
	      reduce: reduce_1,
	      sortBy: sortBy_1,
	      uniqueId: uniqueId_1,
	      values: values_1,
	      zipObject: zipObject_1,
	    };
	  } catch (e) {
	    // continue regardless of error
	  }
	}

	if (!lodash$1) {
	  lodash$1 = window._;
	}

	var lodash_1$1 = lodash$1;

	/*
	 * Simple doubly linked list implementation derived from Cormen, et al.,
	 * "Introduction to Algorithms".
	 */

	var list = List;

	function List() {
	  var sentinel = {};
	  sentinel._next = sentinel._prev = sentinel;
	  this._sentinel = sentinel;
	}

	List.prototype.dequeue = function() {
	  var sentinel = this._sentinel;
	  var entry = sentinel._prev;
	  if (entry !== sentinel) {
	    unlink(entry);
	    return entry;
	  }
	};

	List.prototype.enqueue = function(entry) {
	  var sentinel = this._sentinel;
	  if (entry._prev && entry._next) {
	    unlink(entry);
	  }
	  entry._next = sentinel._next;
	  sentinel._next._prev = entry;
	  sentinel._next = entry;
	  entry._prev = sentinel;
	};

	List.prototype.toString = function() {
	  var strs = [];
	  var sentinel = this._sentinel;
	  var curr = sentinel._prev;
	  while (curr !== sentinel) {
	    strs.push(JSON.stringify(curr, filterOutLinks));
	    curr = curr._prev;
	  }
	  return "[" + strs.join(", ") + "]";
	};

	function unlink(entry) {
	  entry._prev._next = entry._next;
	  entry._next._prev = entry._prev;
	  delete entry._next;
	  delete entry._prev;
	}

	function filterOutLinks(k, v) {
	  if (k !== "_next" && k !== "_prev") {
	    return v;
	  }
	}

	var Graph$1 = graphlib_1.Graph;


	/*
	 * A greedy heuristic for finding a feedback arc set for a graph. A feedback
	 * arc set is a set of edges that can be removed to make a graph acyclic.
	 * The algorithm comes from: P. Eades, X. Lin, and W. F. Smyth, "A fast and
	 * effective heuristic for the feedback arc set problem." This implementation
	 * adjusts that from the paper to allow for weighted edges.
	 */
	var greedyFas = greedyFAS;

	var DEFAULT_WEIGHT_FN = lodash_1$1.constant(1);

	function greedyFAS(g, weightFn) {
	  if (g.nodeCount() <= 1) {
	    return [];
	  }
	  var state = buildState(g, weightFn || DEFAULT_WEIGHT_FN);
	  var results = doGreedyFAS(state.graph, state.buckets, state.zeroIdx);

	  // Expand multi-edges
	  return lodash_1$1.flatten(lodash_1$1.map(results, function(e) {
	    return g.outEdges(e.v, e.w);
	  }), true);
	}

	function doGreedyFAS(g, buckets, zeroIdx) {
	  var results = [];
	  var sources = buckets[buckets.length - 1];
	  var sinks = buckets[0];

	  var entry;
	  while (g.nodeCount()) {
	    while ((entry = sinks.dequeue()))   { removeNode(g, buckets, zeroIdx, entry); }
	    while ((entry = sources.dequeue())) { removeNode(g, buckets, zeroIdx, entry); }
	    if (g.nodeCount()) {
	      for (var i = buckets.length - 2; i > 0; --i) {
	        entry = buckets[i].dequeue();
	        if (entry) {
	          results = results.concat(removeNode(g, buckets, zeroIdx, entry, true));
	          break;
	        }
	      }
	    }
	  }

	  return results;
	}

	function removeNode(g, buckets, zeroIdx, entry, collectPredecessors) {
	  var results = collectPredecessors ? [] : undefined;

	  lodash_1$1.forEach(g.inEdges(entry.v), function(edge) {
	    var weight = g.edge(edge);
	    var uEntry = g.node(edge.v);

	    if (collectPredecessors) {
	      results.push({ v: edge.v, w: edge.w });
	    }

	    uEntry.out -= weight;
	    assignBucket(buckets, zeroIdx, uEntry);
	  });

	  lodash_1$1.forEach(g.outEdges(entry.v), function(edge) {
	    var weight = g.edge(edge);
	    var w = edge.w;
	    var wEntry = g.node(w);
	    wEntry["in"] -= weight;
	    assignBucket(buckets, zeroIdx, wEntry);
	  });

	  g.removeNode(entry.v);

	  return results;
	}

	function buildState(g, weightFn) {
	  var fasGraph = new Graph$1();
	  var maxIn = 0;
	  var maxOut = 0;

	  lodash_1$1.forEach(g.nodes(), function(v) {
	    fasGraph.setNode(v, { v: v, "in": 0, out: 0 });
	  });

	  // Aggregate weights on nodes, but also sum the weights across multi-edges
	  // into a single edge for the fasGraph.
	  lodash_1$1.forEach(g.edges(), function(e) {
	    var prevWeight = fasGraph.edge(e.v, e.w) || 0;
	    var weight = weightFn(e);
	    var edgeWeight = prevWeight + weight;
	    fasGraph.setEdge(e.v, e.w, edgeWeight);
	    maxOut = Math.max(maxOut, fasGraph.node(e.v).out += weight);
	    maxIn  = Math.max(maxIn,  fasGraph.node(e.w)["in"]  += weight);
	  });

	  var buckets = lodash_1$1.range(maxOut + maxIn + 3).map(function() { return new list(); });
	  var zeroIdx = maxIn + 1;

	  lodash_1$1.forEach(fasGraph.nodes(), function(v) {
	    assignBucket(buckets, zeroIdx, fasGraph.node(v));
	  });

	  return { graph: fasGraph, buckets: buckets, zeroIdx: zeroIdx };
	}

	function assignBucket(buckets, zeroIdx, entry) {
	  if (!entry.out) {
	    buckets[0].enqueue(entry);
	  } else if (!entry["in"]) {
	    buckets[buckets.length - 1].enqueue(entry);
	  } else {
	    buckets[entry.out - entry["in"] + zeroIdx].enqueue(entry);
	  }
	}

	var acyclic = {
	  run: run,
	  undo: undo
	};

	function run(g) {
	  var fas = (g.graph().acyclicer === "greedy"
	    ? greedyFas(g, weightFn(g))
	    : dfsFAS(g));
	  lodash_1$1.forEach(fas, function(e) {
	    var label = g.edge(e);
	    g.removeEdge(e);
	    label.forwardName = e.name;
	    label.reversed = true;
	    g.setEdge(e.w, e.v, label, lodash_1$1.uniqueId("rev"));
	  });

	  function weightFn(g) {
	    return function(e) {
	      return g.edge(e).weight;
	    };
	  }
	}

	function dfsFAS(g) {
	  var fas = [];
	  var stack = {};
	  var visited = {};

	  function dfs(v) {
	    if (lodash_1$1.has(visited, v)) {
	      return;
	    }
	    visited[v] = true;
	    stack[v] = true;
	    lodash_1$1.forEach(g.outEdges(v), function(e) {
	      if (lodash_1$1.has(stack, e.w)) {
	        fas.push(e);
	      } else {
	        dfs(e.w);
	      }
	    });
	    delete stack[v];
	  }

	  lodash_1$1.forEach(g.nodes(), dfs);
	  return fas;
	}

	function undo(g) {
	  lodash_1$1.forEach(g.edges(), function(e) {
	    var label = g.edge(e);
	    if (label.reversed) {
	      g.removeEdge(e);

	      var forwardName = label.forwardName;
	      delete label.reversed;
	      delete label.forwardName;
	      g.setEdge(e.w, e.v, label, forwardName);
	    }
	  });
	}

	var Graph$2 = graphlib_1.Graph;

	var util = {
	  addDummyNode: addDummyNode,
	  simplify: simplify,
	  asNonCompoundGraph: asNonCompoundGraph,
	  successorWeights: successorWeights,
	  predecessorWeights: predecessorWeights,
	  intersectRect: intersectRect,
	  buildLayerMatrix: buildLayerMatrix,
	  normalizeRanks: normalizeRanks,
	  removeEmptyRanks: removeEmptyRanks,
	  addBorderNode: addBorderNode,
	  maxRank: maxRank,
	  partition: partition,
	  time: time,
	  notime: notime
	};

	/*
	 * Adds a dummy node to the graph and return v.
	 */
	function addDummyNode(g, type, attrs, name) {
	  var v;
	  do {
	    v = lodash_1$1.uniqueId(name);
	  } while (g.hasNode(v));

	  attrs.dummy = type;
	  g.setNode(v, attrs);
	  return v;
	}

	/*
	 * Returns a new graph with only simple edges. Handles aggregation of data
	 * associated with multi-edges.
	 */
	function simplify(g) {
	  var simplified = new Graph$2().setGraph(g.graph());
	  lodash_1$1.forEach(g.nodes(), function(v) { simplified.setNode(v, g.node(v)); });
	  lodash_1$1.forEach(g.edges(), function(e) {
	    var simpleLabel = simplified.edge(e.v, e.w) || { weight: 0, minlen: 1 };
	    var label = g.edge(e);
	    simplified.setEdge(e.v, e.w, {
	      weight: simpleLabel.weight + label.weight,
	      minlen: Math.max(simpleLabel.minlen, label.minlen)
	    });
	  });
	  return simplified;
	}

	function asNonCompoundGraph(g) {
	  var simplified = new Graph$2({ multigraph: g.isMultigraph() }).setGraph(g.graph());
	  lodash_1$1.forEach(g.nodes(), function(v) {
	    if (!g.children(v).length) {
	      simplified.setNode(v, g.node(v));
	    }
	  });
	  lodash_1$1.forEach(g.edges(), function(e) {
	    simplified.setEdge(e, g.edge(e));
	  });
	  return simplified;
	}

	function successorWeights(g) {
	  var weightMap = lodash_1$1.map(g.nodes(), function(v) {
	    var sucs = {};
	    lodash_1$1.forEach(g.outEdges(v), function(e) {
	      sucs[e.w] = (sucs[e.w] || 0) + g.edge(e).weight;
	    });
	    return sucs;
	  });
	  return lodash_1$1.zipObject(g.nodes(), weightMap);
	}

	function predecessorWeights(g) {
	  var weightMap = lodash_1$1.map(g.nodes(), function(v) {
	    var preds = {};
	    lodash_1$1.forEach(g.inEdges(v), function(e) {
	      preds[e.v] = (preds[e.v] || 0) + g.edge(e).weight;
	    });
	    return preds;
	  });
	  return lodash_1$1.zipObject(g.nodes(), weightMap);
	}

	/*
	 * Finds where a line starting at point ({x, y}) would intersect a rectangle
	 * ({x, y, width, height}) if it were pointing at the rectangle's center.
	 */
	function intersectRect(rect, point) {
	  var x = rect.x;
	  var y = rect.y;

	  // Rectangle intersection algorithm from:
	  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
	  var dx = point.x - x;
	  var dy = point.y - y;
	  var w = rect.width / 2;
	  var h = rect.height / 2;

	  if (!dx && !dy) {
	    throw new Error("Not possible to find intersection inside of the rectangle");
	  }

	  var sx, sy;
	  if (Math.abs(dy) * w > Math.abs(dx) * h) {
	    // Intersection is top or bottom of rect.
	    if (dy < 0) {
	      h = -h;
	    }
	    sx = h * dx / dy;
	    sy = h;
	  } else {
	    // Intersection is left or right of rect.
	    if (dx < 0) {
	      w = -w;
	    }
	    sx = w;
	    sy = w * dy / dx;
	  }

	  return { x: x + sx, y: y + sy };
	}

	/*
	 * Given a DAG with each node assigned "rank" and "order" properties, this
	 * function will produce a matrix with the ids of each node.
	 */
	function buildLayerMatrix(g) {
	  var layering = lodash_1$1.map(lodash_1$1.range(maxRank(g) + 1), function() { return []; });
	  lodash_1$1.forEach(g.nodes(), function(v) {
	    var node = g.node(v);
	    var rank = node.rank;
	    if (!lodash_1$1.isUndefined(rank)) {
	      layering[rank][node.order] = v;
	    }
	  });
	  return layering;
	}

	/*
	 * Adjusts the ranks for all nodes in the graph such that all nodes v have
	 * rank(v) >= 0 and at least one node w has rank(w) = 0.
	 */
	function normalizeRanks(g) {
	  var min = lodash_1$1.min(lodash_1$1.map(g.nodes(), function(v) { return g.node(v).rank; }));
	  lodash_1$1.forEach(g.nodes(), function(v) {
	    var node = g.node(v);
	    if (lodash_1$1.has(node, "rank")) {
	      node.rank -= min;
	    }
	  });
	}

	function removeEmptyRanks(g) {
	  // Ranks may not start at 0, so we need to offset them
	  var offset = lodash_1$1.min(lodash_1$1.map(g.nodes(), function(v) { return g.node(v).rank; }));

	  var layers = [];
	  lodash_1$1.forEach(g.nodes(), function(v) {
	    var rank = g.node(v).rank - offset;
	    if (!layers[rank]) {
	      layers[rank] = [];
	    }
	    layers[rank].push(v);
	  });

	  var delta = 0;
	  var nodeRankFactor = g.graph().nodeRankFactor;
	  lodash_1$1.forEach(layers, function(vs, i) {
	    if (lodash_1$1.isUndefined(vs) && i % nodeRankFactor !== 0) {
	      --delta;
	    } else if (delta) {
	      lodash_1$1.forEach(vs, function(v) { g.node(v).rank += delta; });
	    }
	  });
	}

	function addBorderNode(g, prefix, rank, order) {
	  var node = {
	    width: 0,
	    height: 0
	  };
	  if (arguments.length >= 4) {
	    node.rank = rank;
	    node.order = order;
	  }
	  return addDummyNode(g, "border", node, prefix);
	}

	function maxRank(g) {
	  return lodash_1$1.max(lodash_1$1.map(g.nodes(), function(v) {
	    var rank = g.node(v).rank;
	    if (!lodash_1$1.isUndefined(rank)) {
	      return rank;
	    }
	  }));
	}

	/*
	 * Partition a collection into two groups: `lhs` and `rhs`. If the supplied
	 * function returns true for an entry it goes into `lhs`. Otherwise it goes
	 * into `rhs.
	 */
	function partition(collection, fn) {
	  var result = { lhs: [], rhs: [] };
	  lodash_1$1.forEach(collection, function(value) {
	    if (fn(value)) {
	      result.lhs.push(value);
	    } else {
	      result.rhs.push(value);
	    }
	  });
	  return result;
	}

	/*
	 * Returns a new function that wraps `fn` with a timer. The wrapper logs the
	 * time it takes to execute the function.
	 */
	function time(name, fn) {
	  var start = lodash_1$1.now();
	  try {
	    return fn();
	  } finally {
	    console.log(name + " time: " + (lodash_1$1.now() - start) + "ms");
	  }
	}

	function notime(name, fn) {
	  return fn();
	}

	var normalize = {
	  run: run$1,
	  undo: undo$1
	};

	/*
	 * Breaks any long edges in the graph into short segments that span 1 layer
	 * each. This operation is undoable with the denormalize function.
	 *
	 * Pre-conditions:
	 *
	 *    1. The input graph is a DAG.
	 *    2. Each node in the graph has a "rank" property.
	 *
	 * Post-condition:
	 *
	 *    1. All edges in the graph have a length of 1.
	 *    2. Dummy nodes are added where edges have been split into segments.
	 *    3. The graph is augmented with a "dummyChains" attribute which contains
	 *       the first dummy in each chain of dummy nodes produced.
	 */
	function run$1(g) {
	  g.graph().dummyChains = [];
	  lodash_1$1.forEach(g.edges(), function(edge) { normalizeEdge(g, edge); });
	}

	function normalizeEdge(g, e) {
	  var v = e.v;
	  var vRank = g.node(v).rank;
	  var w = e.w;
	  var wRank = g.node(w).rank;
	  var name = e.name;
	  var edgeLabel = g.edge(e);
	  var labelRank = edgeLabel.labelRank;

	  if (wRank === vRank + 1) return;

	  g.removeEdge(e);

	  var dummy, attrs, i;
	  for (i = 0, ++vRank; vRank < wRank; ++i, ++vRank) {
	    edgeLabel.points = [];
	    attrs = {
	      width: 0, height: 0,
	      edgeLabel: edgeLabel, edgeObj: e,
	      rank: vRank
	    };
	    dummy = util.addDummyNode(g, "edge", attrs, "_d");
	    if (vRank === labelRank) {
	      attrs.width = edgeLabel.width;
	      attrs.height = edgeLabel.height;
	      attrs.dummy = "edge-label";
	      attrs.labelpos = edgeLabel.labelpos;
	    }
	    g.setEdge(v, dummy, { weight: edgeLabel.weight }, name);
	    if (i === 0) {
	      g.graph().dummyChains.push(dummy);
	    }
	    v = dummy;
	  }

	  g.setEdge(v, w, { weight: edgeLabel.weight }, name);
	}

	function undo$1(g) {
	  lodash_1$1.forEach(g.graph().dummyChains, function(v) {
	    var node = g.node(v);
	    var origLabel = node.edgeLabel;
	    var w;
	    g.setEdge(node.edgeObj, origLabel);
	    while (node.dummy) {
	      w = g.successors(v)[0];
	      g.removeNode(v);
	      origLabel.points.push({ x: node.x, y: node.y });
	      if (node.dummy === "edge-label") {
	        origLabel.x = node.x;
	        origLabel.y = node.y;
	        origLabel.width = node.width;
	        origLabel.height = node.height;
	      }
	      v = w;
	      node = g.node(v);
	    }
	  });
	}

	var util$1 = {
	  longestPath: longestPath,
	  slack: slack
	};

	/*
	 * Initializes ranks for the input graph using the longest path algorithm. This
	 * algorithm scales well and is fast in practice, it yields rather poor
	 * solutions. Nodes are pushed to the lowest layer possible, leaving the bottom
	 * ranks wide and leaving edges longer than necessary. However, due to its
	 * speed, this algorithm is good for getting an initial ranking that can be fed
	 * into other algorithms.
	 *
	 * This algorithm does not normalize layers because it will be used by other
	 * algorithms in most cases. If using this algorithm directly, be sure to
	 * run normalize at the end.
	 *
	 * Pre-conditions:
	 *
	 *    1. Input graph is a DAG.
	 *    2. Input graph node labels can be assigned properties.
	 *
	 * Post-conditions:
	 *
	 *    1. Each node will be assign an (unnormalized) "rank" property.
	 */
	function longestPath(g) {
	  var visited = {};

	  function dfs(v) {
	    var label = g.node(v);
	    if (lodash_1$1.has(visited, v)) {
	      return label.rank;
	    }
	    visited[v] = true;

	    var rank = lodash_1$1.min(lodash_1$1.map(g.outEdges(v), function(e) {
	      return dfs(e.w) - g.edge(e).minlen;
	    }));

	    if (rank === Number.POSITIVE_INFINITY || // return value of _.map([]) for Lodash 3
	        rank === undefined || // return value of _.map([]) for Lodash 4
	        rank === null) { // return value of _.map([null])
	      rank = 0;
	    }

	    return (label.rank = rank);
	  }

	  lodash_1$1.forEach(g.sources(), dfs);
	}

	/*
	 * Returns the amount of slack for the given edge. The slack is defined as the
	 * difference between the length of the edge and its minimum length.
	 */
	function slack(g, e) {
	  return g.node(e.w).rank - g.node(e.v).rank - g.edge(e).minlen;
	}

	var Graph$3 = graphlib_1.Graph;
	var slack$1 = util$1.slack;

	var feasibleTree_1 = feasibleTree;

	/*
	 * Constructs a spanning tree with tight edges and adjusted the input node's
	 * ranks to achieve this. A tight edge is one that is has a length that matches
	 * its "minlen" attribute.
	 *
	 * The basic structure for this function is derived from Gansner, et al., "A
	 * Technique for Drawing Directed Graphs."
	 *
	 * Pre-conditions:
	 *
	 *    1. Graph must be a DAG.
	 *    2. Graph must be connected.
	 *    3. Graph must have at least one node.
	 *    5. Graph nodes must have been previously assigned a "rank" property that
	 *       respects the "minlen" property of incident edges.
	 *    6. Graph edges must have a "minlen" property.
	 *
	 * Post-conditions:
	 *
	 *    - Graph nodes will have their rank adjusted to ensure that all edges are
	 *      tight.
	 *
	 * Returns a tree (undirected graph) that is constructed using only "tight"
	 * edges.
	 */
	function feasibleTree(g) {
	  var t = new Graph$3({ directed: false });

	  // Choose arbitrary node from which to start our tree
	  var start = g.nodes()[0];
	  var size = g.nodeCount();
	  t.setNode(start, {});

	  var edge, delta;
	  while (tightTree(t, g) < size) {
	    edge = findMinSlackEdge(t, g);
	    delta = t.hasNode(edge.v) ? slack$1(g, edge) : -slack$1(g, edge);
	    shiftRanks(t, g, delta);
	  }

	  return t;
	}

	/*
	 * Finds a maximal tree of tight edges and returns the number of nodes in the
	 * tree.
	 */
	function tightTree(t, g) {
	  function dfs(v) {
	    lodash_1$1.forEach(g.nodeEdges(v), function(e) {
	      var edgeV = e.v,
	        w = (v === edgeV) ? e.w : edgeV;
	      if (!t.hasNode(w) && !slack$1(g, e)) {
	        t.setNode(w, {});
	        t.setEdge(v, w, {});
	        dfs(w);
	      }
	    });
	  }

	  lodash_1$1.forEach(t.nodes(), dfs);
	  return t.nodeCount();
	}

	/*
	 * Finds the edge with the smallest slack that is incident on tree and returns
	 * it.
	 */
	function findMinSlackEdge(t, g) {
	  return lodash_1$1.minBy(g.edges(), function(e) {
	    if (t.hasNode(e.v) !== t.hasNode(e.w)) {
	      return slack$1(g, e);
	    }
	  });
	}

	function shiftRanks(t, g, delta) {
	  lodash_1$1.forEach(t.nodes(), function(v) {
	    g.node(v).rank += delta;
	  });
	}

	var slack$2 = util$1.slack;
	var initRank = util$1.longestPath;
	var preorder$1 = graphlib_1.alg.preorder;
	var postorder$1 = graphlib_1.alg.postorder;
	var simplify$1 = util.simplify;

	var networkSimplex_1 = networkSimplex;

	// Expose some internals for testing purposes
	networkSimplex.initLowLimValues = initLowLimValues;
	networkSimplex.initCutValues = initCutValues;
	networkSimplex.calcCutValue = calcCutValue;
	networkSimplex.leaveEdge = leaveEdge;
	networkSimplex.enterEdge = enterEdge;
	networkSimplex.exchangeEdges = exchangeEdges;

	/*
	 * The network simplex algorithm assigns ranks to each node in the input graph
	 * and iteratively improves the ranking to reduce the length of edges.
	 *
	 * Preconditions:
	 *
	 *    1. The input graph must be a DAG.
	 *    2. All nodes in the graph must have an object value.
	 *    3. All edges in the graph must have "minlen" and "weight" attributes.
	 *
	 * Postconditions:
	 *
	 *    1. All nodes in the graph will have an assigned "rank" attribute that has
	 *       been optimized by the network simplex algorithm. Ranks start at 0.
	 *
	 *
	 * A rough sketch of the algorithm is as follows:
	 *
	 *    1. Assign initial ranks to each node. We use the longest path algorithm,
	 *       which assigns ranks to the lowest position possible. In general this
	 *       leads to very wide bottom ranks and unnecessarily long edges.
	 *    2. Construct a feasible tight tree. A tight tree is one such that all
	 *       edges in the tree have no slack (difference between length of edge
	 *       and minlen for the edge). This by itself greatly improves the assigned
	 *       rankings by shorting edges.
	 *    3. Iteratively find edges that have negative cut values. Generally a
	 *       negative cut value indicates that the edge could be removed and a new
	 *       tree edge could be added to produce a more compact graph.
	 *
	 * Much of the algorithms here are derived from Gansner, et al., "A Technique
	 * for Drawing Directed Graphs." The structure of the file roughly follows the
	 * structure of the overall algorithm.
	 */
	function networkSimplex(g) {
	  g = simplify$1(g);
	  initRank(g);
	  var t = feasibleTree_1(g);
	  initLowLimValues(t);
	  initCutValues(t, g);

	  var e, f;
	  while ((e = leaveEdge(t))) {
	    f = enterEdge(t, g, e);
	    exchangeEdges(t, g, e, f);
	  }
	}

	/*
	 * Initializes cut values for all edges in the tree.
	 */
	function initCutValues(t, g) {
	  var vs = postorder$1(t, t.nodes());
	  vs = vs.slice(0, vs.length - 1);
	  lodash_1$1.forEach(vs, function(v) {
	    assignCutValue(t, g, v);
	  });
	}

	function assignCutValue(t, g, child) {
	  var childLab = t.node(child);
	  var parent = childLab.parent;
	  t.edge(child, parent).cutvalue = calcCutValue(t, g, child);
	}

	/*
	 * Given the tight tree, its graph, and a child in the graph calculate and
	 * return the cut value for the edge between the child and its parent.
	 */
	function calcCutValue(t, g, child) {
	  var childLab = t.node(child);
	  var parent = childLab.parent;
	  // True if the child is on the tail end of the edge in the directed graph
	  var childIsTail = true;
	  // The graph's view of the tree edge we're inspecting
	  var graphEdge = g.edge(child, parent);
	  // The accumulated cut value for the edge between this node and its parent
	  var cutValue = 0;

	  if (!graphEdge) {
	    childIsTail = false;
	    graphEdge = g.edge(parent, child);
	  }

	  cutValue = graphEdge.weight;

	  lodash_1$1.forEach(g.nodeEdges(child), function(e) {
	    var isOutEdge = e.v === child,
	      other = isOutEdge ? e.w : e.v;

	    if (other !== parent) {
	      var pointsToHead = isOutEdge === childIsTail,
	        otherWeight = g.edge(e).weight;

	      cutValue += pointsToHead ? otherWeight : -otherWeight;
	      if (isTreeEdge(t, child, other)) {
	        var otherCutValue = t.edge(child, other).cutvalue;
	        cutValue += pointsToHead ? -otherCutValue : otherCutValue;
	      }
	    }
	  });

	  return cutValue;
	}

	function initLowLimValues(tree, root) {
	  if (arguments.length < 2) {
	    root = tree.nodes()[0];
	  }
	  dfsAssignLowLim(tree, {}, 1, root);
	}

	function dfsAssignLowLim(tree, visited, nextLim, v, parent) {
	  var low = nextLim;
	  var label = tree.node(v);

	  visited[v] = true;
	  lodash_1$1.forEach(tree.neighbors(v), function(w) {
	    if (!lodash_1$1.has(visited, w)) {
	      nextLim = dfsAssignLowLim(tree, visited, nextLim, w, v);
	    }
	  });

	  label.low = low;
	  label.lim = nextLim++;
	  if (parent) {
	    label.parent = parent;
	  } else {
	    // TODO should be able to remove this when we incrementally update low lim
	    delete label.parent;
	  }

	  return nextLim;
	}

	function leaveEdge(tree) {
	  return lodash_1$1.find(tree.edges(), function(e) {
	    return tree.edge(e).cutvalue < 0;
	  });
	}

	function enterEdge(t, g, edge) {
	  var v = edge.v;
	  var w = edge.w;

	  // For the rest of this function we assume that v is the tail and w is the
	  // head, so if we don't have this edge in the graph we should flip it to
	  // match the correct orientation.
	  if (!g.hasEdge(v, w)) {
	    v = edge.w;
	    w = edge.v;
	  }

	  var vLabel = t.node(v);
	  var wLabel = t.node(w);
	  var tailLabel = vLabel;
	  var flip = false;

	  // If the root is in the tail of the edge then we need to flip the logic that
	  // checks for the head and tail nodes in the candidates function below.
	  if (vLabel.lim > wLabel.lim) {
	    tailLabel = wLabel;
	    flip = true;
	  }

	  var candidates = lodash_1$1.filter(g.edges(), function(edge) {
	    return flip === isDescendant(t, t.node(edge.v), tailLabel) &&
	           flip !== isDescendant(t, t.node(edge.w), tailLabel);
	  });

	  return lodash_1$1.minBy(candidates, function(edge) { return slack$2(g, edge); });
	}

	function exchangeEdges(t, g, e, f) {
	  var v = e.v;
	  var w = e.w;
	  t.removeEdge(v, w);
	  t.setEdge(f.v, f.w, {});
	  initLowLimValues(t);
	  initCutValues(t, g);
	  updateRanks(t, g);
	}

	function updateRanks(t, g) {
	  var root = lodash_1$1.find(t.nodes(), function(v) { return !g.node(v).parent; });
	  var vs = preorder$1(t, root);
	  vs = vs.slice(1);
	  lodash_1$1.forEach(vs, function(v) {
	    var parent = t.node(v).parent,
	      edge = g.edge(v, parent),
	      flipped = false;

	    if (!edge) {
	      edge = g.edge(parent, v);
	      flipped = true;
	    }

	    g.node(v).rank = g.node(parent).rank + (flipped ? edge.minlen : -edge.minlen);
	  });
	}

	/*
	 * Returns true if the edge is in the tree.
	 */
	function isTreeEdge(tree, u, v) {
	  return tree.hasEdge(u, v);
	}

	/*
	 * Returns true if the specified node is descendant of the root node per the
	 * assigned low and lim attributes in the tree.
	 */
	function isDescendant(tree, vLabel, rootLabel) {
	  return rootLabel.low <= vLabel.lim && vLabel.lim <= rootLabel.lim;
	}

	var longestPath$1 = util$1.longestPath;



	var rank_1 = rank;

	/*
	 * Assigns a rank to each node in the input graph that respects the "minlen"
	 * constraint specified on edges between nodes.
	 *
	 * This basic structure is derived from Gansner, et al., "A Technique for
	 * Drawing Directed Graphs."
	 *
	 * Pre-conditions:
	 *
	 *    1. Graph must be a connected DAG
	 *    2. Graph nodes must be objects
	 *    3. Graph edges must have "weight" and "minlen" attributes
	 *
	 * Post-conditions:
	 *
	 *    1. Graph nodes will have a "rank" attribute based on the results of the
	 *       algorithm. Ranks can start at any index (including negative), we'll
	 *       fix them up later.
	 */
	function rank(g) {
	  switch(g.graph().ranker) {
	  case "network-simplex": networkSimplexRanker(g); break;
	  case "tight-tree": tightTreeRanker(g); break;
	  case "longest-path": longestPathRanker(g); break;
	  default: networkSimplexRanker(g);
	  }
	}

	// A fast and simple ranker, but results are far from optimal.
	var longestPathRanker = longestPath$1;

	function tightTreeRanker(g) {
	  longestPath$1(g);
	  feasibleTree_1(g);
	}

	function networkSimplexRanker(g) {
	  networkSimplex_1(g);
	}

	var parentDummyChains_1 = parentDummyChains;

	function parentDummyChains(g) {
	  var postorderNums = postorder$2(g);

	  lodash_1$1.forEach(g.graph().dummyChains, function(v) {
	    var node = g.node(v);
	    var edgeObj = node.edgeObj;
	    var pathData = findPath(g, postorderNums, edgeObj.v, edgeObj.w);
	    var path = pathData.path;
	    var lca = pathData.lca;
	    var pathIdx = 0;
	    var pathV = path[pathIdx];
	    var ascending = true;

	    while (v !== edgeObj.w) {
	      node = g.node(v);

	      if (ascending) {
	        while ((pathV = path[pathIdx]) !== lca &&
	               g.node(pathV).maxRank < node.rank) {
	          pathIdx++;
	        }

	        if (pathV === lca) {
	          ascending = false;
	        }
	      }

	      if (!ascending) {
	        while (pathIdx < path.length - 1 &&
	               g.node(pathV = path[pathIdx + 1]).minRank <= node.rank) {
	          pathIdx++;
	        }
	        pathV = path[pathIdx];
	      }

	      g.setParent(v, pathV);
	      v = g.successors(v)[0];
	    }
	  });
	}

	// Find a path from v to w through the lowest common ancestor (LCA). Return the
	// full path and the LCA.
	function findPath(g, postorderNums, v, w) {
	  var vPath = [];
	  var wPath = [];
	  var low = Math.min(postorderNums[v].low, postorderNums[w].low);
	  var lim = Math.max(postorderNums[v].lim, postorderNums[w].lim);
	  var parent;
	  var lca;

	  // Traverse up from v to find the LCA
	  parent = v;
	  do {
	    parent = g.parent(parent);
	    vPath.push(parent);
	  } while (parent &&
	           (postorderNums[parent].low > low || lim > postorderNums[parent].lim));
	  lca = parent;

	  // Traverse from w to LCA
	  parent = w;
	  while ((parent = g.parent(parent)) !== lca) {
	    wPath.push(parent);
	  }

	  return { path: vPath.concat(wPath.reverse()), lca: lca };
	}

	function postorder$2(g) {
	  var result = {};
	  var lim = 0;

	  function dfs(v) {
	    var low = lim;
	    lodash_1$1.forEach(g.children(v), dfs);
	    result[v] = { low: low, lim: lim++ };
	  }
	  lodash_1$1.forEach(g.children(), dfs);

	  return result;
	}

	var nestingGraph = {
	  run: run$2,
	  cleanup: cleanup
	};

	/*
	 * A nesting graph creates dummy nodes for the tops and bottoms of subgraphs,
	 * adds appropriate edges to ensure that all cluster nodes are placed between
	 * these boundries, and ensures that the graph is connected.
	 *
	 * In addition we ensure, through the use of the minlen property, that nodes
	 * and subgraph border nodes to not end up on the same rank.
	 *
	 * Preconditions:
	 *
	 *    1. Input graph is a DAG
	 *    2. Nodes in the input graph has a minlen attribute
	 *
	 * Postconditions:
	 *
	 *    1. Input graph is connected.
	 *    2. Dummy nodes are added for the tops and bottoms of subgraphs.
	 *    3. The minlen attribute for nodes is adjusted to ensure nodes do not
	 *       get placed on the same rank as subgraph border nodes.
	 *
	 * The nesting graph idea comes from Sander, "Layout of Compound Directed
	 * Graphs."
	 */
	function run$2(g) {
	  var root = util.addDummyNode(g, "root", {}, "_root");
	  var depths = treeDepths(g);
	  var height = lodash_1$1.max(lodash_1$1.values(depths)) - 1; // Note: depths is an Object not an array
	  var nodeSep = 2 * height + 1;

	  g.graph().nestingRoot = root;

	  // Multiply minlen by nodeSep to align nodes on non-border ranks.
	  lodash_1$1.forEach(g.edges(), function(e) { g.edge(e).minlen *= nodeSep; });

	  // Calculate a weight that is sufficient to keep subgraphs vertically compact
	  var weight = sumWeights(g) + 1;

	  // Create border nodes and link them up
	  lodash_1$1.forEach(g.children(), function(child) {
	    dfs$1(g, root, nodeSep, weight, height, depths, child);
	  });

	  // Save the multiplier for node layers for later removal of empty border
	  // layers.
	  g.graph().nodeRankFactor = nodeSep;
	}

	function dfs$1(g, root, nodeSep, weight, height, depths, v) {
	  var children = g.children(v);
	  if (!children.length) {
	    if (v !== root) {
	      g.setEdge(root, v, { weight: 0, minlen: nodeSep });
	    }
	    return;
	  }

	  var top = util.addBorderNode(g, "_bt");
	  var bottom = util.addBorderNode(g, "_bb");
	  var label = g.node(v);

	  g.setParent(top, v);
	  label.borderTop = top;
	  g.setParent(bottom, v);
	  label.borderBottom = bottom;

	  lodash_1$1.forEach(children, function(child) {
	    dfs$1(g, root, nodeSep, weight, height, depths, child);

	    var childNode = g.node(child);
	    var childTop = childNode.borderTop ? childNode.borderTop : child;
	    var childBottom = childNode.borderBottom ? childNode.borderBottom : child;
	    var thisWeight = childNode.borderTop ? weight : 2 * weight;
	    var minlen = childTop !== childBottom ? 1 : height - depths[v] + 1;

	    g.setEdge(top, childTop, {
	      weight: thisWeight,
	      minlen: minlen,
	      nestingEdge: true
	    });

	    g.setEdge(childBottom, bottom, {
	      weight: thisWeight,
	      minlen: minlen,
	      nestingEdge: true
	    });
	  });

	  if (!g.parent(v)) {
	    g.setEdge(root, top, { weight: 0, minlen: height + depths[v] });
	  }
	}

	function treeDepths(g) {
	  var depths = {};
	  function dfs(v, depth) {
	    var children = g.children(v);
	    if (children && children.length) {
	      lodash_1$1.forEach(children, function(child) {
	        dfs(child, depth + 1);
	      });
	    }
	    depths[v] = depth;
	  }
	  lodash_1$1.forEach(g.children(), function(v) { dfs(v, 1); });
	  return depths;
	}

	function sumWeights(g) {
	  return lodash_1$1.reduce(g.edges(), function(acc, e) {
	    return acc + g.edge(e).weight;
	  }, 0);
	}

	function cleanup(g) {
	  var graphLabel = g.graph();
	  g.removeNode(graphLabel.nestingRoot);
	  delete graphLabel.nestingRoot;
	  lodash_1$1.forEach(g.edges(), function(e) {
	    var edge = g.edge(e);
	    if (edge.nestingEdge) {
	      g.removeEdge(e);
	    }
	  });
	}

	var addBorderSegments_1 = addBorderSegments;

	function addBorderSegments(g) {
	  function dfs(v) {
	    var children = g.children(v);
	    var node = g.node(v);
	    if (children.length) {
	      lodash_1$1.forEach(children, dfs);
	    }

	    if (lodash_1$1.has(node, "minRank")) {
	      node.borderLeft = [];
	      node.borderRight = [];
	      for (var rank = node.minRank, maxRank = node.maxRank + 1;
	        rank < maxRank;
	        ++rank) {
	        addBorderNode$1(g, "borderLeft", "_bl", v, node, rank);
	        addBorderNode$1(g, "borderRight", "_br", v, node, rank);
	      }
	    }
	  }

	  lodash_1$1.forEach(g.children(), dfs);
	}

	function addBorderNode$1(g, prop, prefix, sg, sgNode, rank) {
	  var label = { width: 0, height: 0, rank: rank, borderType: prop };
	  var prev = sgNode[prop][rank - 1];
	  var curr = util.addDummyNode(g, "border", label, prefix);
	  sgNode[prop][rank] = curr;
	  g.setParent(curr, sg);
	  if (prev) {
	    g.setEdge(prev, curr, { weight: 1 });
	  }
	}

	var coordinateSystem = {
	  adjust: adjust,
	  undo: undo$2
	};

	function adjust(g) {
	  var rankDir = g.graph().rankdir.toLowerCase();
	  if (rankDir === "lr" || rankDir === "rl") {
	    swapWidthHeight(g);
	  }
	}

	function undo$2(g) {
	  var rankDir = g.graph().rankdir.toLowerCase();
	  if (rankDir === "bt" || rankDir === "rl") {
	    reverseY(g);
	  }

	  if (rankDir === "lr" || rankDir === "rl") {
	    swapXY(g);
	    swapWidthHeight(g);
	  }
	}

	function swapWidthHeight(g) {
	  lodash_1$1.forEach(g.nodes(), function(v) { swapWidthHeightOne(g.node(v)); });
	  lodash_1$1.forEach(g.edges(), function(e) { swapWidthHeightOne(g.edge(e)); });
	}

	function swapWidthHeightOne(attrs) {
	  var w = attrs.width;
	  attrs.width = attrs.height;
	  attrs.height = w;
	}

	function reverseY(g) {
	  lodash_1$1.forEach(g.nodes(), function(v) { reverseYOne(g.node(v)); });

	  lodash_1$1.forEach(g.edges(), function(e) {
	    var edge = g.edge(e);
	    lodash_1$1.forEach(edge.points, reverseYOne);
	    if (lodash_1$1.has(edge, "y")) {
	      reverseYOne(edge);
	    }
	  });
	}

	function reverseYOne(attrs) {
	  attrs.y = -attrs.y;
	}

	function swapXY(g) {
	  lodash_1$1.forEach(g.nodes(), function(v) { swapXYOne(g.node(v)); });

	  lodash_1$1.forEach(g.edges(), function(e) {
	    var edge = g.edge(e);
	    lodash_1$1.forEach(edge.points, swapXYOne);
	    if (lodash_1$1.has(edge, "x")) {
	      swapXYOne(edge);
	    }
	  });
	}

	function swapXYOne(attrs) {
	  var x = attrs.x;
	  attrs.x = attrs.y;
	  attrs.y = x;
	}

	var initOrder_1 = initOrder;

	/*
	 * Assigns an initial order value for each node by performing a DFS search
	 * starting from nodes in the first rank. Nodes are assigned an order in their
	 * rank as they are first visited.
	 *
	 * This approach comes from Gansner, et al., "A Technique for Drawing Directed
	 * Graphs."
	 *
	 * Returns a layering matrix with an array per layer and each layer sorted by
	 * the order of its nodes.
	 */
	function initOrder(g) {
	  var visited = {};
	  var simpleNodes = lodash_1$1.filter(g.nodes(), function(v) {
	    return !g.children(v).length;
	  });
	  var maxRank = lodash_1$1.max(lodash_1$1.map(simpleNodes, function(v) { return g.node(v).rank; }));
	  var layers = lodash_1$1.map(lodash_1$1.range(maxRank + 1), function() { return []; });

	  function dfs(v) {
	    if (lodash_1$1.has(visited, v)) return;
	    visited[v] = true;
	    var node = g.node(v);
	    layers[node.rank].push(v);
	    lodash_1$1.forEach(g.successors(v), dfs);
	  }

	  var orderedVs = lodash_1$1.sortBy(simpleNodes, function(v) { return g.node(v).rank; });
	  lodash_1$1.forEach(orderedVs, dfs);

	  return layers;
	}

	var crossCount_1 = crossCount;

	/*
	 * A function that takes a layering (an array of layers, each with an array of
	 * ordererd nodes) and a graph and returns a weighted crossing count.
	 *
	 * Pre-conditions:
	 *
	 *    1. Input graph must be simple (not a multigraph), directed, and include
	 *       only simple edges.
	 *    2. Edges in the input graph must have assigned weights.
	 *
	 * Post-conditions:
	 *
	 *    1. The graph and layering matrix are left unchanged.
	 *
	 * This algorithm is derived from Barth, et al., "Bilayer Cross Counting."
	 */
	function crossCount(g, layering) {
	  var cc = 0;
	  for (var i = 1; i < layering.length; ++i) {
	    cc += twoLayerCrossCount(g, layering[i-1], layering[i]);
	  }
	  return cc;
	}

	function twoLayerCrossCount(g, northLayer, southLayer) {
	  // Sort all of the edges between the north and south layers by their position
	  // in the north layer and then the south. Map these edges to the position of
	  // their head in the south layer.
	  var southPos = lodash_1$1.zipObject(southLayer,
	    lodash_1$1.map(southLayer, function (v, i) { return i; }));
	  var southEntries = lodash_1$1.flatten(lodash_1$1.map(northLayer, function(v) {
	    return lodash_1$1.sortBy(lodash_1$1.map(g.outEdges(v), function(e) {
	      return { pos: southPos[e.w], weight: g.edge(e).weight };
	    }), "pos");
	  }), true);

	  // Build the accumulator tree
	  var firstIndex = 1;
	  while (firstIndex < southLayer.length) firstIndex <<= 1;
	  var treeSize = 2 * firstIndex - 1;
	  firstIndex -= 1;
	  var tree = lodash_1$1.map(new Array(treeSize), function() { return 0; });

	  // Calculate the weighted crossings
	  var cc = 0;
	  lodash_1$1.forEach(southEntries.forEach(function(entry) {
	    var index = entry.pos + firstIndex;
	    tree[index] += entry.weight;
	    var weightSum = 0;
	    while (index > 0) {
	      if (index % 2) {
	        weightSum += tree[index + 1];
	      }
	      index = (index - 1) >> 1;
	      tree[index] += entry.weight;
	    }
	    cc += entry.weight * weightSum;
	  }));

	  return cc;
	}

	var barycenter_1 = barycenter;

	function barycenter(g, movable) {
	  return lodash_1$1.map(movable, function(v) {
	    var inV = g.inEdges(v);
	    if (!inV.length) {
	      return { v: v };
	    } else {
	      var result = lodash_1$1.reduce(inV, function(acc, e) {
	        var edge = g.edge(e),
	          nodeU = g.node(e.v);
	        return {
	          sum: acc.sum + (edge.weight * nodeU.order),
	          weight: acc.weight + edge.weight
	        };
	      }, { sum: 0, weight: 0 });

	      return {
	        v: v,
	        barycenter: result.sum / result.weight,
	        weight: result.weight
	      };
	    }
	  });
	}

	var resolveConflicts_1 = resolveConflicts;

	/*
	 * Given a list of entries of the form {v, barycenter, weight} and a
	 * constraint graph this function will resolve any conflicts between the
	 * constraint graph and the barycenters for the entries. If the barycenters for
	 * an entry would violate a constraint in the constraint graph then we coalesce
	 * the nodes in the conflict into a new node that respects the contraint and
	 * aggregates barycenter and weight information.
	 *
	 * This implementation is based on the description in Forster, "A Fast and
	 * Simple Hueristic for Constrained Two-Level Crossing Reduction," thought it
	 * differs in some specific details.
	 *
	 * Pre-conditions:
	 *
	 *    1. Each entry has the form {v, barycenter, weight}, or if the node has
	 *       no barycenter, then {v}.
	 *
	 * Returns:
	 *
	 *    A new list of entries of the form {vs, i, barycenter, weight}. The list
	 *    `vs` may either be a singleton or it may be an aggregation of nodes
	 *    ordered such that they do not violate constraints from the constraint
	 *    graph. The property `i` is the lowest original index of any of the
	 *    elements in `vs`.
	 */
	function resolveConflicts(entries, cg) {
	  var mappedEntries = {};
	  lodash_1$1.forEach(entries, function(entry, i) {
	    var tmp = mappedEntries[entry.v] = {
	      indegree: 0,
	      "in": [],
	      out: [],
	      vs: [entry.v],
	      i: i
	    };
	    if (!lodash_1$1.isUndefined(entry.barycenter)) {
	      tmp.barycenter = entry.barycenter;
	      tmp.weight = entry.weight;
	    }
	  });

	  lodash_1$1.forEach(cg.edges(), function(e) {
	    var entryV = mappedEntries[e.v];
	    var entryW = mappedEntries[e.w];
	    if (!lodash_1$1.isUndefined(entryV) && !lodash_1$1.isUndefined(entryW)) {
	      entryW.indegree++;
	      entryV.out.push(mappedEntries[e.w]);
	    }
	  });

	  var sourceSet = lodash_1$1.filter(mappedEntries, function(entry) {
	    return !entry.indegree;
	  });

	  return doResolveConflicts(sourceSet);
	}

	function doResolveConflicts(sourceSet) {
	  var entries = [];

	  function handleIn(vEntry) {
	    return function(uEntry) {
	      if (uEntry.merged) {
	        return;
	      }
	      if (lodash_1$1.isUndefined(uEntry.barycenter) ||
	          lodash_1$1.isUndefined(vEntry.barycenter) ||
	          uEntry.barycenter >= vEntry.barycenter) {
	        mergeEntries(vEntry, uEntry);
	      }
	    };
	  }

	  function handleOut(vEntry) {
	    return function(wEntry) {
	      wEntry["in"].push(vEntry);
	      if (--wEntry.indegree === 0) {
	        sourceSet.push(wEntry);
	      }
	    };
	  }

	  while (sourceSet.length) {
	    var entry = sourceSet.pop();
	    entries.push(entry);
	    lodash_1$1.forEach(entry["in"].reverse(), handleIn(entry));
	    lodash_1$1.forEach(entry.out, handleOut(entry));
	  }

	  return lodash_1$1.map(lodash_1$1.filter(entries, function(entry) { return !entry.merged; }),
	    function(entry) {
	      return lodash_1$1.pick(entry, ["vs", "i", "barycenter", "weight"]);
	    });

	}

	function mergeEntries(target, source) {
	  var sum = 0;
	  var weight = 0;

	  if (target.weight) {
	    sum += target.barycenter * target.weight;
	    weight += target.weight;
	  }

	  if (source.weight) {
	    sum += source.barycenter * source.weight;
	    weight += source.weight;
	  }

	  target.vs = source.vs.concat(target.vs);
	  target.barycenter = sum / weight;
	  target.weight = weight;
	  target.i = Math.min(source.i, target.i);
	  source.merged = true;
	}

	var sort_1 = sort;

	function sort(entries, biasRight) {
	  var parts = util.partition(entries, function(entry) {
	    return lodash_1$1.has(entry, "barycenter");
	  });
	  var sortable = parts.lhs,
	    unsortable = lodash_1$1.sortBy(parts.rhs, function(entry) { return -entry.i; }),
	    vs = [],
	    sum = 0,
	    weight = 0,
	    vsIndex = 0;

	  sortable.sort(compareWithBias(!!biasRight));

	  vsIndex = consumeUnsortable(vs, unsortable, vsIndex);

	  lodash_1$1.forEach(sortable, function (entry) {
	    vsIndex += entry.vs.length;
	    vs.push(entry.vs);
	    sum += entry.barycenter * entry.weight;
	    weight += entry.weight;
	    vsIndex = consumeUnsortable(vs, unsortable, vsIndex);
	  });

	  var result = { vs: lodash_1$1.flatten(vs, true) };
	  if (weight) {
	    result.barycenter = sum / weight;
	    result.weight = weight;
	  }
	  return result;
	}

	function consumeUnsortable(vs, unsortable, index) {
	  var last;
	  while (unsortable.length && (last = lodash_1$1.last(unsortable)).i <= index) {
	    unsortable.pop();
	    vs.push(last.vs);
	    index++;
	  }
	  return index;
	}

	function compareWithBias(bias) {
	  return function(entryV, entryW) {
	    if (entryV.barycenter < entryW.barycenter) {
	      return -1;
	    } else if (entryV.barycenter > entryW.barycenter) {
	      return 1;
	    }

	    return !bias ? entryV.i - entryW.i : entryW.i - entryV.i;
	  };
	}

	var sortSubgraph_1 = sortSubgraph;

	function sortSubgraph(g, v, cg, biasRight) {
	  var movable = g.children(v);
	  var node = g.node(v);
	  var bl = node ? node.borderLeft : undefined;
	  var br = node ? node.borderRight: undefined;
	  var subgraphs = {};

	  if (bl) {
	    movable = lodash_1$1.filter(movable, function(w) {
	      return w !== bl && w !== br;
	    });
	  }

	  var barycenters = barycenter_1(g, movable);
	  lodash_1$1.forEach(barycenters, function(entry) {
	    if (g.children(entry.v).length) {
	      var subgraphResult = sortSubgraph(g, entry.v, cg, biasRight);
	      subgraphs[entry.v] = subgraphResult;
	      if (lodash_1$1.has(subgraphResult, "barycenter")) {
	        mergeBarycenters(entry, subgraphResult);
	      }
	    }
	  });

	  var entries = resolveConflicts_1(barycenters, cg);
	  expandSubgraphs(entries, subgraphs);

	  var result = sort_1(entries, biasRight);

	  if (bl) {
	    result.vs = lodash_1$1.flatten([bl, result.vs, br], true);
	    if (g.predecessors(bl).length) {
	      var blPred = g.node(g.predecessors(bl)[0]),
	        brPred = g.node(g.predecessors(br)[0]);
	      if (!lodash_1$1.has(result, "barycenter")) {
	        result.barycenter = 0;
	        result.weight = 0;
	      }
	      result.barycenter = (result.barycenter * result.weight +
	                           blPred.order + brPred.order) / (result.weight + 2);
	      result.weight += 2;
	    }
	  }

	  return result;
	}

	function expandSubgraphs(entries, subgraphs) {
	  lodash_1$1.forEach(entries, function(entry) {
	    entry.vs = lodash_1$1.flatten(entry.vs.map(function(v) {
	      if (subgraphs[v]) {
	        return subgraphs[v].vs;
	      }
	      return v;
	    }), true);
	  });
	}

	function mergeBarycenters(target, other) {
	  if (!lodash_1$1.isUndefined(target.barycenter)) {
	    target.barycenter = (target.barycenter * target.weight +
	                         other.barycenter * other.weight) /
	                        (target.weight + other.weight);
	    target.weight += other.weight;
	  } else {
	    target.barycenter = other.barycenter;
	    target.weight = other.weight;
	  }
	}

	var Graph$4 = graphlib_1.Graph;

	var buildLayerGraph_1 = buildLayerGraph;

	/*
	 * Constructs a graph that can be used to sort a layer of nodes. The graph will
	 * contain all base and subgraph nodes from the request layer in their original
	 * hierarchy and any edges that are incident on these nodes and are of the type
	 * requested by the "relationship" parameter.
	 *
	 * Nodes from the requested rank that do not have parents are assigned a root
	 * node in the output graph, which is set in the root graph attribute. This
	 * makes it easy to walk the hierarchy of movable nodes during ordering.
	 *
	 * Pre-conditions:
	 *
	 *    1. Input graph is a DAG
	 *    2. Base nodes in the input graph have a rank attribute
	 *    3. Subgraph nodes in the input graph has minRank and maxRank attributes
	 *    4. Edges have an assigned weight
	 *
	 * Post-conditions:
	 *
	 *    1. Output graph has all nodes in the movable rank with preserved
	 *       hierarchy.
	 *    2. Root nodes in the movable layer are made children of the node
	 *       indicated by the root attribute of the graph.
	 *    3. Non-movable nodes incident on movable nodes, selected by the
	 *       relationship parameter, are included in the graph (without hierarchy).
	 *    4. Edges incident on movable nodes, selected by the relationship
	 *       parameter, are added to the output graph.
	 *    5. The weights for copied edges are aggregated as need, since the output
	 *       graph is not a multi-graph.
	 */
	function buildLayerGraph(g, rank, relationship) {
	  var root = createRootNode(g),
	    result = new Graph$4({ compound: true }).setGraph({ root: root })
	      .setDefaultNodeLabel(function(v) { return g.node(v); });

	  lodash_1$1.forEach(g.nodes(), function(v) {
	    var node = g.node(v),
	      parent = g.parent(v);

	    if (node.rank === rank || node.minRank <= rank && rank <= node.maxRank) {
	      result.setNode(v);
	      result.setParent(v, parent || root);

	      // This assumes we have only short edges!
	      lodash_1$1.forEach(g[relationship](v), function(e) {
	        var u = e.v === v ? e.w : e.v,
	          edge = result.edge(u, v),
	          weight = !lodash_1$1.isUndefined(edge) ? edge.weight : 0;
	        result.setEdge(u, v, { weight: g.edge(e).weight + weight });
	      });

	      if (lodash_1$1.has(node, "minRank")) {
	        result.setNode(v, {
	          borderLeft: node.borderLeft[rank],
	          borderRight: node.borderRight[rank]
	        });
	      }
	    }
	  });

	  return result;
	}

	function createRootNode(g) {
	  var v;
	  while (g.hasNode((v = lodash_1$1.uniqueId("_root"))));
	  return v;
	}

	var addSubgraphConstraints_1 = addSubgraphConstraints;

	function addSubgraphConstraints(g, cg, vs) {
	  var prev = {},
	    rootPrev;

	  lodash_1$1.forEach(vs, function(v) {
	    var child = g.parent(v),
	      parent,
	      prevChild;
	    while (child) {
	      parent = g.parent(child);
	      if (parent) {
	        prevChild = prev[parent];
	        prev[parent] = child;
	      } else {
	        prevChild = rootPrev;
	        rootPrev = child;
	      }
	      if (prevChild && prevChild !== child) {
	        cg.setEdge(prevChild, child);
	        return;
	      }
	      child = parent;
	    }
	  });

	  /*
	  function dfs(v) {
	    var children = v ? g.children(v) : g.children();
	    if (children.length) {
	      var min = Number.POSITIVE_INFINITY,
	          subgraphs = [];
	      _.each(children, function(child) {
	        var childMin = dfs(child);
	        if (g.children(child).length) {
	          subgraphs.push({ v: child, order: childMin });
	        }
	        min = Math.min(min, childMin);
	      });
	      _.reduce(_.sortBy(subgraphs, "order"), function(prev, curr) {
	        cg.setEdge(prev.v, curr.v);
	        return curr;
	      });
	      return min;
	    }
	    return g.node(v).order;
	  }
	  dfs(undefined);
	  */
	}

	var Graph$5 = graphlib_1.Graph;


	var order_1 = order;

	/*
	 * Applies heuristics to minimize edge crossings in the graph and sets the best
	 * order solution as an order attribute on each node.
	 *
	 * Pre-conditions:
	 *
	 *    1. Graph must be DAG
	 *    2. Graph nodes must be objects with a "rank" attribute
	 *    3. Graph edges must have the "weight" attribute
	 *
	 * Post-conditions:
	 *
	 *    1. Graph nodes will have an "order" attribute based on the results of the
	 *       algorithm.
	 */
	function order(g) {
	  var maxRank = util.maxRank(g),
	    downLayerGraphs = buildLayerGraphs(g, lodash_1$1.range(1, maxRank + 1), "inEdges"),
	    upLayerGraphs = buildLayerGraphs(g, lodash_1$1.range(maxRank - 1, -1, -1), "outEdges");

	  var layering = initOrder_1(g);
	  assignOrder(g, layering);

	  var bestCC = Number.POSITIVE_INFINITY,
	    best;

	  for (var i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
	    sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2);

	    layering = util.buildLayerMatrix(g);
	    var cc = crossCount_1(g, layering);
	    if (cc < bestCC) {
	      lastBest = 0;
	      best = lodash_1$1.cloneDeep(layering);
	      bestCC = cc;
	    }
	  }

	  assignOrder(g, best);
	}

	function buildLayerGraphs(g, ranks, relationship) {
	  return lodash_1$1.map(ranks, function(rank) {
	    return buildLayerGraph_1(g, rank, relationship);
	  });
	}

	function sweepLayerGraphs(layerGraphs, biasRight) {
	  var cg = new Graph$5();
	  lodash_1$1.forEach(layerGraphs, function(lg) {
	    var root = lg.graph().root;
	    var sorted = sortSubgraph_1(lg, root, cg, biasRight);
	    lodash_1$1.forEach(sorted.vs, function(v, i) {
	      lg.node(v).order = i;
	    });
	    addSubgraphConstraints_1(lg, cg, sorted.vs);
	  });
	}

	function assignOrder(g, layering) {
	  lodash_1$1.forEach(layering, function(layer) {
	    lodash_1$1.forEach(layer, function(v, i) {
	      g.node(v).order = i;
	    });
	  });
	}

	var Graph$6 = graphlib_1.Graph;


	/*
	 * This module provides coordinate assignment based on Brandes and Köpf, "Fast
	 * and Simple Horizontal Coordinate Assignment."
	 */

	var bk = {
	  positionX: positionX,
	  findType1Conflicts: findType1Conflicts,
	  findType2Conflicts: findType2Conflicts,
	  addConflict: addConflict,
	  hasConflict: hasConflict,
	  verticalAlignment: verticalAlignment,
	  horizontalCompaction: horizontalCompaction,
	  alignCoordinates: alignCoordinates,
	  findSmallestWidthAlignment: findSmallestWidthAlignment,
	  balance: balance
	};

	/*
	 * Marks all edges in the graph with a type-1 conflict with the "type1Conflict"
	 * property. A type-1 conflict is one where a non-inner segment crosses an
	 * inner segment. An inner segment is an edge with both incident nodes marked
	 * with the "dummy" property.
	 *
	 * This algorithm scans layer by layer, starting with the second, for type-1
	 * conflicts between the current layer and the previous layer. For each layer
	 * it scans the nodes from left to right until it reaches one that is incident
	 * on an inner segment. It then scans predecessors to determine if they have
	 * edges that cross that inner segment. At the end a final scan is done for all
	 * nodes on the current rank to see if they cross the last visited inner
	 * segment.
	 *
	 * This algorithm (safely) assumes that a dummy node will only be incident on a
	 * single node in the layers being scanned.
	 */
	function findType1Conflicts(g, layering) {
	  var conflicts = {};

	  function visitLayer(prevLayer, layer) {
	    var
	      // last visited node in the previous layer that is incident on an inner
	      // segment.
	      k0 = 0,
	      // Tracks the last node in this layer scanned for crossings with a type-1
	      // segment.
	      scanPos = 0,
	      prevLayerLength = prevLayer.length,
	      lastNode = lodash_1$1.last(layer);

	    lodash_1$1.forEach(layer, function(v, i) {
	      var w = findOtherInnerSegmentNode(g, v),
	        k1 = w ? g.node(w).order : prevLayerLength;

	      if (w || v === lastNode) {
	        lodash_1$1.forEach(layer.slice(scanPos, i +1), function(scanNode) {
	          lodash_1$1.forEach(g.predecessors(scanNode), function(u) {
	            var uLabel = g.node(u),
	              uPos = uLabel.order;
	            if ((uPos < k0 || k1 < uPos) &&
	                !(uLabel.dummy && g.node(scanNode).dummy)) {
	              addConflict(conflicts, u, scanNode);
	            }
	          });
	        });
	        scanPos = i + 1;
	        k0 = k1;
	      }
	    });

	    return layer;
	  }

	  lodash_1$1.reduce(layering, visitLayer);
	  return conflicts;
	}

	function findType2Conflicts(g, layering) {
	  var conflicts = {};

	  function scan(south, southPos, southEnd, prevNorthBorder, nextNorthBorder) {
	    var v;
	    lodash_1$1.forEach(lodash_1$1.range(southPos, southEnd), function(i) {
	      v = south[i];
	      if (g.node(v).dummy) {
	        lodash_1$1.forEach(g.predecessors(v), function(u) {
	          var uNode = g.node(u);
	          if (uNode.dummy &&
	              (uNode.order < prevNorthBorder || uNode.order > nextNorthBorder)) {
	            addConflict(conflicts, u, v);
	          }
	        });
	      }
	    });
	  }


	  function visitLayer(north, south) {
	    var prevNorthPos = -1,
	      nextNorthPos,
	      southPos = 0;

	    lodash_1$1.forEach(south, function(v, southLookahead) {
	      if (g.node(v).dummy === "border") {
	        var predecessors = g.predecessors(v);
	        if (predecessors.length) {
	          nextNorthPos = g.node(predecessors[0]).order;
	          scan(south, southPos, southLookahead, prevNorthPos, nextNorthPos);
	          southPos = southLookahead;
	          prevNorthPos = nextNorthPos;
	        }
	      }
	      scan(south, southPos, south.length, nextNorthPos, north.length);
	    });

	    return south;
	  }

	  lodash_1$1.reduce(layering, visitLayer);
	  return conflicts;
	}

	function findOtherInnerSegmentNode(g, v) {
	  if (g.node(v).dummy) {
	    return lodash_1$1.find(g.predecessors(v), function(u) {
	      return g.node(u).dummy;
	    });
	  }
	}

	function addConflict(conflicts, v, w) {
	  if (v > w) {
	    var tmp = v;
	    v = w;
	    w = tmp;
	  }

	  var conflictsV = conflicts[v];
	  if (!conflictsV) {
	    conflicts[v] = conflictsV = {};
	  }
	  conflictsV[w] = true;
	}

	function hasConflict(conflicts, v, w) {
	  if (v > w) {
	    var tmp = v;
	    v = w;
	    w = tmp;
	  }
	  return lodash_1$1.has(conflicts[v], w);
	}

	/*
	 * Try to align nodes into vertical "blocks" where possible. This algorithm
	 * attempts to align a node with one of its median neighbors. If the edge
	 * connecting a neighbor is a type-1 conflict then we ignore that possibility.
	 * If a previous node has already formed a block with a node after the node
	 * we're trying to form a block with, we also ignore that possibility - our
	 * blocks would be split in that scenario.
	 */
	function verticalAlignment(g, layering, conflicts, neighborFn) {
	  var root = {},
	    align = {},
	    pos = {};

	  // We cache the position here based on the layering because the graph and
	  // layering may be out of sync. The layering matrix is manipulated to
	  // generate different extreme alignments.
	  lodash_1$1.forEach(layering, function(layer) {
	    lodash_1$1.forEach(layer, function(v, order) {
	      root[v] = v;
	      align[v] = v;
	      pos[v] = order;
	    });
	  });

	  lodash_1$1.forEach(layering, function(layer) {
	    var prevIdx = -1;
	    lodash_1$1.forEach(layer, function(v) {
	      var ws = neighborFn(v);
	      if (ws.length) {
	        ws = lodash_1$1.sortBy(ws, function(w) { return pos[w]; });
	        var mp = (ws.length - 1) / 2;
	        for (var i = Math.floor(mp), il = Math.ceil(mp); i <= il; ++i) {
	          var w = ws[i];
	          if (align[v] === v &&
	              prevIdx < pos[w] &&
	              !hasConflict(conflicts, v, w)) {
	            align[w] = v;
	            align[v] = root[v] = root[w];
	            prevIdx = pos[w];
	          }
	        }
	      }
	    });
	  });

	  return { root: root, align: align };
	}

	function horizontalCompaction(g, layering, root, align, reverseSep) {
	  // This portion of the algorithm differs from BK due to a number of problems.
	  // Instead of their algorithm we construct a new block graph and do two
	  // sweeps. The first sweep places blocks with the smallest possible
	  // coordinates. The second sweep removes unused space by moving blocks to the
	  // greatest coordinates without violating separation.
	  var xs = {},
	    blockG = buildBlockGraph(g, layering, root, reverseSep),
	    borderType = reverseSep ? "borderLeft" : "borderRight";

	  function iterate(setXsFunc, nextNodesFunc) {
	    var stack = blockG.nodes();
	    var elem = stack.pop();
	    var visited = {};
	    while (elem) {
	      if (visited[elem]) {
	        setXsFunc(elem);
	      } else {
	        visited[elem] = true;
	        stack.push(elem);
	        stack = stack.concat(nextNodesFunc(elem));
	      }

	      elem = stack.pop();
	    }
	  }

	  // First pass, assign smallest coordinates
	  function pass1(elem) {
	    xs[elem] = blockG.inEdges(elem).reduce(function(acc, e) {
	      return Math.max(acc, xs[e.v] + blockG.edge(e));
	    }, 0);
	  }

	  // Second pass, assign greatest coordinates
	  function pass2(elem) {
	    var min = blockG.outEdges(elem).reduce(function(acc, e) {
	      return Math.min(acc, xs[e.w] - blockG.edge(e));
	    }, Number.POSITIVE_INFINITY);

	    var node = g.node(elem);
	    if (min !== Number.POSITIVE_INFINITY && node.borderType !== borderType) {
	      xs[elem] = Math.max(xs[elem], min);
	    }
	  }

	  iterate(pass1, blockG.predecessors.bind(blockG));
	  iterate(pass2, blockG.successors.bind(blockG));

	  // Assign x coordinates to all nodes
	  lodash_1$1.forEach(align, function(v) {
	    xs[v] = xs[root[v]];
	  });

	  return xs;
	}


	function buildBlockGraph(g, layering, root, reverseSep) {
	  var blockGraph = new Graph$6(),
	    graphLabel = g.graph(),
	    sepFn = sep(graphLabel.nodesep, graphLabel.edgesep, reverseSep);

	  lodash_1$1.forEach(layering, function(layer) {
	    var u;
	    lodash_1$1.forEach(layer, function(v) {
	      var vRoot = root[v];
	      blockGraph.setNode(vRoot);
	      if (u) {
	        var uRoot = root[u],
	          prevMax = blockGraph.edge(uRoot, vRoot);
	        blockGraph.setEdge(uRoot, vRoot, Math.max(sepFn(g, v, u), prevMax || 0));
	      }
	      u = v;
	    });
	  });

	  return blockGraph;
	}

	/*
	 * Returns the alignment that has the smallest width of the given alignments.
	 */
	function findSmallestWidthAlignment(g, xss) {
	  return lodash_1$1.minBy(lodash_1$1.values(xss), function (xs) {
	    var max = Number.NEGATIVE_INFINITY;
	    var min = Number.POSITIVE_INFINITY;

	    lodash_1$1.forIn(xs, function (x, v) {
	      var halfWidth = width(g, v) / 2;

	      max = Math.max(x + halfWidth, max);
	      min = Math.min(x - halfWidth, min);
	    });

	    return max - min;
	  });
	}

	/*
	 * Align the coordinates of each of the layout alignments such that
	 * left-biased alignments have their minimum coordinate at the same point as
	 * the minimum coordinate of the smallest width alignment and right-biased
	 * alignments have their maximum coordinate at the same point as the maximum
	 * coordinate of the smallest width alignment.
	 */
	function alignCoordinates(xss, alignTo) {
	  var alignToVals = lodash_1$1.values(alignTo),
	    alignToMin = lodash_1$1.min(alignToVals),
	    alignToMax = lodash_1$1.max(alignToVals);

	  lodash_1$1.forEach(["u", "d"], function(vert) {
	    lodash_1$1.forEach(["l", "r"], function(horiz) {
	      var alignment = vert + horiz,
	        xs = xss[alignment],
	        delta;
	      if (xs === alignTo) return;

	      var xsVals = lodash_1$1.values(xs);
	      delta = horiz === "l" ? alignToMin - lodash_1$1.min(xsVals) : alignToMax - lodash_1$1.max(xsVals);

	      if (delta) {
	        xss[alignment] = lodash_1$1.mapValues(xs, function(x) { return x + delta; });
	      }
	    });
	  });
	}

	function balance(xss, align) {
	  return lodash_1$1.mapValues(xss.ul, function(ignore, v) {
	    if (align) {
	      return xss[align.toLowerCase()][v];
	    } else {
	      var xs = lodash_1$1.sortBy(lodash_1$1.map(xss, v));
	      return (xs[1] + xs[2]) / 2;
	    }
	  });
	}

	function positionX(g) {
	  var layering = util.buildLayerMatrix(g);
	  var conflicts = lodash_1$1.merge(
	    findType1Conflicts(g, layering),
	    findType2Conflicts(g, layering));

	  var xss = {};
	  var adjustedLayering;
	  lodash_1$1.forEach(["u", "d"], function(vert) {
	    adjustedLayering = vert === "u" ? layering : lodash_1$1.values(layering).reverse();
	    lodash_1$1.forEach(["l", "r"], function(horiz) {
	      if (horiz === "r") {
	        adjustedLayering = lodash_1$1.map(adjustedLayering, function(inner) {
	          return lodash_1$1.values(inner).reverse();
	        });
	      }

	      var neighborFn = (vert === "u" ? g.predecessors : g.successors).bind(g);
	      var align = verticalAlignment(g, adjustedLayering, conflicts, neighborFn);
	      var xs = horizontalCompaction(g, adjustedLayering,
	        align.root, align.align, horiz === "r");
	      if (horiz === "r") {
	        xs = lodash_1$1.mapValues(xs, function(x) { return -x; });
	      }
	      xss[vert + horiz] = xs;
	    });
	  });

	  var smallestWidth = findSmallestWidthAlignment(g, xss);
	  alignCoordinates(xss, smallestWidth);
	  return balance(xss, g.graph().align);
	}

	function sep(nodeSep, edgeSep, reverseSep) {
	  return function(g, v, w) {
	    var vLabel = g.node(v);
	    var wLabel = g.node(w);
	    var sum = 0;
	    var delta;

	    sum += vLabel.width / 2;
	    if (lodash_1$1.has(vLabel, "labelpos")) {
	      switch (vLabel.labelpos.toLowerCase()) {
	      case "l": delta = -vLabel.width / 2; break;
	      case "r": delta = vLabel.width / 2; break;
	      }
	    }
	    if (delta) {
	      sum += reverseSep ? delta : -delta;
	    }
	    delta = 0;

	    sum += (vLabel.dummy ? edgeSep : nodeSep) / 2;
	    sum += (wLabel.dummy ? edgeSep : nodeSep) / 2;

	    sum += wLabel.width / 2;
	    if (lodash_1$1.has(wLabel, "labelpos")) {
	      switch (wLabel.labelpos.toLowerCase()) {
	      case "l": delta = wLabel.width / 2; break;
	      case "r": delta = -wLabel.width / 2; break;
	      }
	    }
	    if (delta) {
	      sum += reverseSep ? delta : -delta;
	    }
	    delta = 0;

	    return sum;
	  };
	}

	function width(g, v) {
	  return g.node(v).width;
	}

	var positionX$1 = bk.positionX;

	var position_1 = position;

	function position(g) {
	  g = util.asNonCompoundGraph(g);

	  positionY(g);
	  lodash_1$1.forEach(positionX$1(g), function(x, v) {
	    g.node(v).x = x;
	  });
	}

	function positionY(g) {
	  var layering = util.buildLayerMatrix(g);
	  var rankSep = g.graph().ranksep;
	  var prevY = 0;
	  lodash_1$1.forEach(layering, function(layer) {
	    var maxHeight = lodash_1$1.max(lodash_1$1.map(layer, function(v) { return g.node(v).height; }));
	    lodash_1$1.forEach(layer, function(v) {
	      g.node(v).y = prevY + maxHeight / 2;
	    });
	    prevY += maxHeight + rankSep;
	  });
	}

	var normalizeRanks$1 = util.normalizeRanks;

	var removeEmptyRanks$1 = util.removeEmptyRanks;





	var util$2 = util;
	var Graph$7 = graphlib_1.Graph;

	var layout_1 = layout;

	function layout(g, opts) {
	  var time = opts && opts.debugTiming ? util$2.time : util$2.notime;
	  time("layout", function() {
	    var layoutGraph = 
	      time("  buildLayoutGraph", function() { return buildLayoutGraph(g); });
	    time("  runLayout",        function() { runLayout(layoutGraph, time); });
	    time("  updateInputGraph", function() { updateInputGraph(g, layoutGraph); });
	  });
	}

	function runLayout(g, time) {
	  time("    makeSpaceForEdgeLabels", function() { makeSpaceForEdgeLabels(g); });
	  time("    removeSelfEdges",        function() { removeSelfEdges(g); });
	  time("    acyclic",                function() { acyclic.run(g); });
	  time("    nestingGraph.run",       function() { nestingGraph.run(g); });
	  time("    rank",                   function() { rank_1(util$2.asNonCompoundGraph(g)); });
	  time("    injectEdgeLabelProxies", function() { injectEdgeLabelProxies(g); });
	  time("    removeEmptyRanks",       function() { removeEmptyRanks$1(g); });
	  time("    nestingGraph.cleanup",   function() { nestingGraph.cleanup(g); });
	  time("    normalizeRanks",         function() { normalizeRanks$1(g); });
	  time("    assignRankMinMax",       function() { assignRankMinMax(g); });
	  time("    removeEdgeLabelProxies", function() { removeEdgeLabelProxies(g); });
	  time("    normalize.run",          function() { normalize.run(g); });
	  time("    parentDummyChains",      function() { parentDummyChains_1(g); });
	  time("    addBorderSegments",      function() { addBorderSegments_1(g); });
	  time("    order",                  function() { order_1(g); });
	  time("    insertSelfEdges",        function() { insertSelfEdges(g); });
	  time("    adjustCoordinateSystem", function() { coordinateSystem.adjust(g); });
	  time("    position",               function() { position_1(g); });
	  time("    positionSelfEdges",      function() { positionSelfEdges(g); });
	  time("    removeBorderNodes",      function() { removeBorderNodes(g); });
	  time("    normalize.undo",         function() { normalize.undo(g); });
	  time("    fixupEdgeLabelCoords",   function() { fixupEdgeLabelCoords(g); });
	  time("    undoCoordinateSystem",   function() { coordinateSystem.undo(g); });
	  time("    translateGraph",         function() { translateGraph(g); });
	  time("    assignNodeIntersects",   function() { assignNodeIntersects(g); });
	  time("    reversePoints",          function() { reversePointsForReversedEdges(g); });
	  time("    acyclic.undo",           function() { acyclic.undo(g); });
	}

	/*
	 * Copies final layout information from the layout graph back to the input
	 * graph. This process only copies whitelisted attributes from the layout graph
	 * to the input graph, so it serves as a good place to determine what
	 * attributes can influence layout.
	 */
	function updateInputGraph(inputGraph, layoutGraph) {
	  lodash_1$1.forEach(inputGraph.nodes(), function(v) {
	    var inputLabel = inputGraph.node(v);
	    var layoutLabel = layoutGraph.node(v);

	    if (inputLabel) {
	      inputLabel.x = layoutLabel.x;
	      inputLabel.y = layoutLabel.y;

	      if (layoutGraph.children(v).length) {
	        inputLabel.width = layoutLabel.width;
	        inputLabel.height = layoutLabel.height;
	      }
	    }
	  });

	  lodash_1$1.forEach(inputGraph.edges(), function(e) {
	    var inputLabel = inputGraph.edge(e);
	    var layoutLabel = layoutGraph.edge(e);

	    inputLabel.points = layoutLabel.points;
	    if (lodash_1$1.has(layoutLabel, "x")) {
	      inputLabel.x = layoutLabel.x;
	      inputLabel.y = layoutLabel.y;
	    }
	  });

	  inputGraph.graph().width = layoutGraph.graph().width;
	  inputGraph.graph().height = layoutGraph.graph().height;
	}

	var graphNumAttrs = ["nodesep", "edgesep", "ranksep", "marginx", "marginy"];
	var graphDefaults = { ranksep: 50, edgesep: 20, nodesep: 50, rankdir: "tb" };
	var graphAttrs = ["acyclicer", "ranker", "rankdir", "align"];
	var nodeNumAttrs = ["width", "height"];
	var nodeDefaults = { width: 0, height: 0 };
	var edgeNumAttrs = ["minlen", "weight", "width", "height", "labeloffset"];
	var edgeDefaults = {
	  minlen: 1, weight: 1, width: 0, height: 0,
	  labeloffset: 10, labelpos: "r"
	};
	var edgeAttrs = ["labelpos"];

	/*
	 * Constructs a new graph from the input graph, which can be used for layout.
	 * This process copies only whitelisted attributes from the input graph to the
	 * layout graph. Thus this function serves as a good place to determine what
	 * attributes can influence layout.
	 */
	function buildLayoutGraph(inputGraph) {
	  var g = new Graph$7({ multigraph: true, compound: true });
	  var graph = canonicalize(inputGraph.graph());

	  g.setGraph(lodash_1$1.merge({},
	    graphDefaults,
	    selectNumberAttrs(graph, graphNumAttrs),
	    lodash_1$1.pick(graph, graphAttrs)));

	  lodash_1$1.forEach(inputGraph.nodes(), function(v) {
	    var node = canonicalize(inputGraph.node(v));
	    g.setNode(v, lodash_1$1.defaults(selectNumberAttrs(node, nodeNumAttrs), nodeDefaults));
	    g.setParent(v, inputGraph.parent(v));
	  });

	  lodash_1$1.forEach(inputGraph.edges(), function(e) {
	    var edge = canonicalize(inputGraph.edge(e));
	    g.setEdge(e, lodash_1$1.merge({},
	      edgeDefaults,
	      selectNumberAttrs(edge, edgeNumAttrs),
	      lodash_1$1.pick(edge, edgeAttrs)));
	  });

	  return g;
	}

	/*
	 * This idea comes from the Gansner paper: to account for edge labels in our
	 * layout we split each rank in half by doubling minlen and halving ranksep.
	 * Then we can place labels at these mid-points between nodes.
	 *
	 * We also add some minimal padding to the width to push the label for the edge
	 * away from the edge itself a bit.
	 */
	function makeSpaceForEdgeLabels(g) {
	  var graph = g.graph();
	  graph.ranksep /= 2;
	  lodash_1$1.forEach(g.edges(), function(e) {
	    var edge = g.edge(e);
	    edge.minlen *= 2;
	    if (edge.labelpos.toLowerCase() !== "c") {
	      if (graph.rankdir === "TB" || graph.rankdir === "BT") {
	        edge.width += edge.labeloffset;
	      } else {
	        edge.height += edge.labeloffset;
	      }
	    }
	  });
	}

	/*
	 * Creates temporary dummy nodes that capture the rank in which each edge's
	 * label is going to, if it has one of non-zero width and height. We do this
	 * so that we can safely remove empty ranks while preserving balance for the
	 * label's position.
	 */
	function injectEdgeLabelProxies(g) {
	  lodash_1$1.forEach(g.edges(), function(e) {
	    var edge = g.edge(e);
	    if (edge.width && edge.height) {
	      var v = g.node(e.v);
	      var w = g.node(e.w);
	      var label = { rank: (w.rank - v.rank) / 2 + v.rank, e: e };
	      util$2.addDummyNode(g, "edge-proxy", label, "_ep");
	    }
	  });
	}

	function assignRankMinMax(g) {
	  var maxRank = 0;
	  lodash_1$1.forEach(g.nodes(), function(v) {
	    var node = g.node(v);
	    if (node.borderTop) {
	      node.minRank = g.node(node.borderTop).rank;
	      node.maxRank = g.node(node.borderBottom).rank;
	      maxRank = lodash_1$1.max(maxRank, node.maxRank);
	    }
	  });
	  g.graph().maxRank = maxRank;
	}

	function removeEdgeLabelProxies(g) {
	  lodash_1$1.forEach(g.nodes(), function(v) {
	    var node = g.node(v);
	    if (node.dummy === "edge-proxy") {
	      g.edge(node.e).labelRank = node.rank;
	      g.removeNode(v);
	    }
	  });
	}

	function translateGraph(g) {
	  var minX = Number.POSITIVE_INFINITY;
	  var maxX = 0;
	  var minY = Number.POSITIVE_INFINITY;
	  var maxY = 0;
	  var graphLabel = g.graph();
	  var marginX = graphLabel.marginx || 0;
	  var marginY = graphLabel.marginy || 0;

	  function getExtremes(attrs) {
	    var x = attrs.x;
	    var y = attrs.y;
	    var w = attrs.width;
	    var h = attrs.height;
	    minX = Math.min(minX, x - w / 2);
	    maxX = Math.max(maxX, x + w / 2);
	    minY = Math.min(minY, y - h / 2);
	    maxY = Math.max(maxY, y + h / 2);
	  }

	  lodash_1$1.forEach(g.nodes(), function(v) { getExtremes(g.node(v)); });
	  lodash_1$1.forEach(g.edges(), function(e) {
	    var edge = g.edge(e);
	    if (lodash_1$1.has(edge, "x")) {
	      getExtremes(edge);
	    }
	  });

	  minX -= marginX;
	  minY -= marginY;

	  lodash_1$1.forEach(g.nodes(), function(v) {
	    var node = g.node(v);
	    node.x -= minX;
	    node.y -= minY;
	  });

	  lodash_1$1.forEach(g.edges(), function(e) {
	    var edge = g.edge(e);
	    lodash_1$1.forEach(edge.points, function(p) {
	      p.x -= minX;
	      p.y -= minY;
	    });
	    if (lodash_1$1.has(edge, "x")) { edge.x -= minX; }
	    if (lodash_1$1.has(edge, "y")) { edge.y -= minY; }
	  });

	  graphLabel.width = maxX - minX + marginX;
	  graphLabel.height = maxY - minY + marginY;
	}

	function assignNodeIntersects(g) {
	  lodash_1$1.forEach(g.edges(), function(e) {
	    var edge = g.edge(e);
	    var nodeV = g.node(e.v);
	    var nodeW = g.node(e.w);
	    var p1, p2;
	    if (!edge.points) {
	      edge.points = [];
	      p1 = nodeW;
	      p2 = nodeV;
	    } else {
	      p1 = edge.points[0];
	      p2 = edge.points[edge.points.length - 1];
	    }
	    edge.points.unshift(util$2.intersectRect(nodeV, p1));
	    edge.points.push(util$2.intersectRect(nodeW, p2));
	  });
	}

	function fixupEdgeLabelCoords(g) {
	  lodash_1$1.forEach(g.edges(), function(e) {
	    var edge = g.edge(e);
	    if (lodash_1$1.has(edge, "x")) {
	      if (edge.labelpos === "l" || edge.labelpos === "r") {
	        edge.width -= edge.labeloffset;
	      }
	      switch (edge.labelpos) {
	      case "l": edge.x -= edge.width / 2 + edge.labeloffset; break;
	      case "r": edge.x += edge.width / 2 + edge.labeloffset; break;
	      }
	    }
	  });
	}

	function reversePointsForReversedEdges(g) {
	  lodash_1$1.forEach(g.edges(), function(e) {
	    var edge = g.edge(e);
	    if (edge.reversed) {
	      edge.points.reverse();
	    }
	  });
	}

	function removeBorderNodes(g) {
	  lodash_1$1.forEach(g.nodes(), function(v) {
	    if (g.children(v).length) {
	      var node = g.node(v);
	      var t = g.node(node.borderTop);
	      var b = g.node(node.borderBottom);
	      var l = g.node(lodash_1$1.last(node.borderLeft));
	      var r = g.node(lodash_1$1.last(node.borderRight));

	      node.width = Math.abs(r.x - l.x);
	      node.height = Math.abs(b.y - t.y);
	      node.x = l.x + node.width / 2;
	      node.y = t.y + node.height / 2;
	    }
	  });

	  lodash_1$1.forEach(g.nodes(), function(v) {
	    if (g.node(v).dummy === "border") {
	      g.removeNode(v);
	    }
	  });
	}

	function removeSelfEdges(g) {
	  lodash_1$1.forEach(g.edges(), function(e) {
	    if (e.v === e.w) {
	      var node = g.node(e.v);
	      if (!node.selfEdges) {
	        node.selfEdges = [];
	      }
	      node.selfEdges.push({ e: e, label: g.edge(e) });
	      g.removeEdge(e);
	    }
	  });
	}

	function insertSelfEdges(g) {
	  var layers = util$2.buildLayerMatrix(g);
	  lodash_1$1.forEach(layers, function(layer) {
	    var orderShift = 0;
	    lodash_1$1.forEach(layer, function(v, i) {
	      var node = g.node(v);
	      node.order = i + orderShift;
	      lodash_1$1.forEach(node.selfEdges, function(selfEdge) {
	        util$2.addDummyNode(g, "selfedge", {
	          width: selfEdge.label.width,
	          height: selfEdge.label.height,
	          rank: node.rank,
	          order: i + (++orderShift),
	          e: selfEdge.e,
	          label: selfEdge.label
	        }, "_se");
	      });
	      delete node.selfEdges;
	    });
	  });
	}

	function positionSelfEdges(g) {
	  lodash_1$1.forEach(g.nodes(), function(v) {
	    var node = g.node(v);
	    if (node.dummy === "selfedge") {
	      var selfNode = g.node(node.e.v);
	      var x = selfNode.x + selfNode.width / 2;
	      var y = selfNode.y;
	      var dx = node.x - x;
	      var dy = selfNode.height / 2;
	      g.setEdge(node.e, node.label);
	      g.removeNode(v);
	      node.label.points = [
	        { x: x + 2 * dx / 3, y: y - dy },
	        { x: x + 5 * dx / 6, y: y - dy },
	        { x: x +     dx    , y: y },
	        { x: x + 5 * dx / 6, y: y + dy },
	        { x: x + 2 * dx / 3, y: y + dy }
	      ];
	      node.label.x = node.x;
	      node.label.y = node.y;
	    }
	  });
	}

	function selectNumberAttrs(obj, attrs) {
	  return lodash_1$1.mapValues(lodash_1$1.pick(obj, attrs), Number);
	}

	function canonicalize(attrs) {
	  var newAttrs = {};
	  lodash_1$1.forEach(attrs, function(v, k) {
	    newAttrs[k.toLowerCase()] = v;
	  });
	  return newAttrs;
	}

	var Graph$8 = graphlib_1.Graph;

	var debug = {
	  debugOrdering: debugOrdering
	};

	/* istanbul ignore next */
	function debugOrdering(g) {
	  var layerMatrix = util.buildLayerMatrix(g);

	  var h = new Graph$8({ compound: true, multigraph: true }).setGraph({});

	  lodash_1$1.forEach(g.nodes(), function(v) {
	    h.setNode(v, { label: v });
	    h.setParent(v, "layer" + g.node(v).rank);
	  });

	  lodash_1$1.forEach(g.edges(), function(e) {
	    h.setEdge(e.v, e.w, {}, e.name);
	  });

	  lodash_1$1.forEach(layerMatrix, function(layer, i) {
	    var layerV = "layer" + i;
	    h.setNode(layerV, { rank: "same" });
	    lodash_1$1.reduce(layer, function(u, v) {
	      h.setEdge(u, v, { style: "invis" });
	      return v;
	    });
	  });

	  return h;
	}

	var version$1 = "0.8.5";

	/*
	Copyright (c) 2012-2014 Chris Pettitt

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
	*/

	var dagre = {
	  graphlib: graphlib_1,

	  layout: layout_1,
	  debug: debug,
	  util: {
	    time: util.time,
	    notime: util.notime
	  },
	  version: version$1
	};

	function generateHash() {
	  return Math.random().toString(16).slice(2, 10);
	}

	function getAnimationStep(from, to, percent) {
	  return percent < 1 ? from + (to - from) * percent : to;
	}

	function createSVGElement(tagName, className = null) {
	  const el = document.createElementNS('http://www.w3.org/2000/svg', tagName);

	  if (className) {
	    el.setAttribute('class', className);
	  }

	  return el;
	}

	// transform 'dagre' points into simple array which will be passed to 'd3-line' helper
	function transformPoints(points) {
	  const result = [];

	  points.forEach((p) => {
	    result.push([p.x, p.y]);
	  });

	  return result;
	}

	// when we need to transition between 2 edges with different points length - fill smaller array with copies of it's first point
	function normalizePoints(points1, points2) {
	  if (points1.length === points2.length) {
	    return;
	  }

	  const smaller = points1.length < points2.length ? points1 : points2;
	  const bigger = points2 === smaller ? points1 : points2;

	  for (let i = 0, len = bigger.length - smaller.length; i < len; i++) {
	    smaller.splice(0, 0, smaller[0]);
	  }
	}

	function findTraversableNodesAndEdges(graph, id) {
	  const visitedNodes = new Set();
	  const visitedEdges = new Set();
	  const queue = [id];

	  // traverse left from id
	  while (queue.length > 0) {
	    const currentId = queue.pop();
	    if (!visitedNodes.has(currentId)) {
	      graph.inEdges(currentId).forEach((e) => {
	        visitedEdges.add(e);
	        queue.push(e.v);
	      });

	      visitedNodes.add(currentId);
	    }
	  }

	  // traverse right from id
	  queue.push(id);
	  visitedNodes.delete(id);

	  while (queue.length > 0) {
	    const currentId = queue.pop();
	    if (!visitedNodes.has(currentId)) {
	      graph.outEdges(currentId).forEach((e) => {
	        visitedEdges.add(e);
	        queue.push(e.w);
	      });

	      visitedNodes.add(currentId);
	    }
	  }
	  return [visitedNodes, visitedEdges];
	}

	function prepareNode(data) {
	  const node = { ...data };
	  node.label = node.label || node.id;
	  node.class = node.class || node.type;

	  if (node.id === 'HTTP') {
	    node.label = 'HTTP server requests';
	    node.shape = 'http';
	    node.class = 'http';
	  } else if (node.id === 'SQL') {
	    node.label = 'Database';
	    node.shape = 'database';
	    node.class = 'database';
	  }
	  if (node.type === 'cluster') {
	    node.label = '';
	  }

	  return node;
	}

	function Rect(width, height) {
	  const rect = createSVGElement('rect');
	  rect.setAttribute('rx', 0);
	  rect.setAttribute('ry', 0);
	  rect.setAttribute('x', -(width / 2));
	  rect.setAttribute('y', -(height / 2));
	  rect.setAttribute('width', width);
	  rect.setAttribute('height', height);
	  return rect;
	}

	function setElementPosition(nodeGroup, x, y) {
	  nodeGroup.element.setAttribute('transform', `translate(${x},${y})`);
	  nodeGroup.position = { x, y };
	}

	class ClusterGroup {
	  constructor(node) {
	    let clusterType = 'cluster--package';
	    if (node.id === 'HTTP-cluster') {
	      clusterType = 'cluster--http';
	    } else if (node.id === 'SQL-cluster') {
	      clusterType = 'cluster--database';
	    }

	    const classBordered = node.children > 1 ? 'cluster--bordered' : '';

	    this.element = createSVGElement('g', `node ${node.class} ${clusterType} ${classBordered}`);
	    this.element.dataset.id = node.id;

	    setElementPosition(this, node.x, node.y);

	    this.element.appendChild(Rect(node.width, node.height));
	  }

	  move(x, y) {
	    if (this.animationOptions && this.animationOptions.enable) {
	      const initialX = this.position.x;
	      const initialY = this.position.y;
	      const start = +new Date();
	      const { duration } = this.animationOptions;

	      const tick = () => {
	        const now = +new Date();
	        const percent = (now - start) / duration;

	        const newX = getAnimationStep(initialX, x, percent);
	        const newY = getAnimationStep(initialY, y, percent);

	        setElementPosition(this, newX, newY);

	        if (percent < 1) {
	          window.requestAnimationFrame(tick);
	        } else {
	          setElementPosition(this, x, y);
	        }
	      };
	      tick();
	    } else {
	      setElementPosition(this, x, y);
	    }
	  }

	  resize(width, height) {
	    const rect = this.element.querySelector('rect');
	    rect.setAttribute('x', -(width / 2));
	    rect.setAttribute('y', -(height / 2));
	    rect.setAttribute('width', width);
	    rect.setAttribute('height', height);
	  }

	  remove() {
	    const { element } = this;
	    element.parentNode.removeChild(element);
	  }
	}

	class LabelGroup {
	  constructor(label, isHidden = false) {
	    this.element = createSVGElement('g', 'label');

	    if (isHidden) {
	      this.element.setAttribute('opacity', 0);
	    }

	    const text = createSVGElement('text');
	    const tspan = createSVGElement('tspan');
	    tspan.setAttribute('space', 'preserve');
	    tspan.setAttribute('dy', '1em');
	    tspan.setAttribute('x', '1');
	    tspan.textContent = label;
	    text.appendChild(tspan);
	    this.element.appendChild(text);
	  }

	  getBBox() {
	    return this.element.getBBox();
	  }
	}

	function Cylinder(width, height) {
	  const path = createSVGElement('path');

	  const rx = width / 2;
	  const ry = rx / (2.5 + width / 50);

	  const shape = `M 0,${ry} a ${rx},${ry} 0,0,0 ${width} 0 a ${rx},${ry} 0,0,0 ${-width} 0 l 0,${height} a ${rx},${ry} 0,0,0 ${width} 0 l 0, ${-height}`;

	  path.setAttribute('d', shape);
	  path.setAttribute('transform', `translate(${-width / 2}, ${-(height / 2 + ry)})`);

	  return path;
	}

	function Parallelogram(width, height) {
	  const polygon = createSVGElement('polygon');
	  const w = width;
	  const h = height;
	  const points = [
	    { x: (-2 * h) / 6, y: 0 },
	    { x: w - h / 6, y: 0 },
	    { x: w + (2 * h) / 6, y: -h },
	    { x: h / 6, y: -h },
	  ];

	  polygon.setAttribute('points', points.map(function(d) { return `${d.x},${d.y}`; }).join());
	  polygon.setAttribute('transform', `translate(${-w * 0.5}, ${h * 0.5})`);

	  return polygon;
	}

	function setElementPosition$1(nodeGroup, x, y) {
	  nodeGroup.element.setAttribute('transform', `translate(${x},${y})`);
	  nodeGroup.position = { x, y };
	}

	class NodeGroup {
	  constructor(node, animationOptions = {}) {
	    this.element = createSVGElement('g', `node ${node.class}`);
	    this.element.dataset.id = node.id;
	    this.element.setAttribute('opacity', 0);

	    setElementPosition$1(this, node.x, node.y);

	    this.animationOptions = animationOptions;

	    let shape;

	    switch (node.shape) {
	      case 'http':
	        shape = Parallelogram(node.width, node.height);
	        break;
	      case 'database':
	        shape = Cylinder(node.width, node.height);
	        break;
	      default:
	        shape = Rect(node.width, node.height);
	        break;
	    }

	    this.element.appendChild(shape);

	    const labelGroup = new LabelGroup(node.label);
	    labelGroup.element.setAttribute('transform', `translate(-${node.labelWidth / 2},-${node.labelHeight / 2})`);
	    this.element.appendChild(labelGroup.element);
	  }

	  show() {
	    if (this.animationOptions && this.animationOptions.enable) {
	      const start = +new Date();
	      const { duration } = this.animationOptions;

	      const tick = () => {
	        const now = +new Date();
	        const percent = (now - start) / duration;

	        this.element.setAttribute('opacity', percent);

	        if (percent < 1) {
	          window.requestAnimationFrame(tick);
	        } else {
	          this.element.setAttribute('opacity', 1);
	        }
	      };
	      tick();
	    } else {
	      this.element.setAttribute('opacity', 1);
	    }
	  }

	  move(x, y) {
	    if (this.animationOptions && this.animationOptions.enable) {
	      const initialX = this.position.x;
	      const initialY = this.position.y;
	      const start = +new Date();
	      const { duration } = this.animationOptions;

	      const tick = () => {
	        const now = +new Date();
	        const percent = (now - start) / duration;

	        const newX = getAnimationStep(initialX, x, percent);
	        const newY = getAnimationStep(initialY, y, percent);

	        setElementPosition$1(this, newX, newY);

	        if (percent < 1) {
	          window.requestAnimationFrame(tick);
	        } else {
	          setElementPosition$1(this, x, y);
	        }
	      };
	      tick();
	    } else {
	      setElementPosition$1(this, x, y);
	    }
	  }

	  remove() {
	    const { element } = this;
	    element.parentNode.removeChild(element);
	  }
	}

	const line = d3.line().curve(d3.curveBasis);

	class Path {
	  constructor(points) {
	    this.element = createSVGElement('path');
	    this.element.setAttribute('d', line(points));
	  }

	  setPoints(points) {
	    this.element.setAttribute('d', line(points));
	  }
	}

	function Marker() {
	  const marker = createSVGElement('marker');
	  marker.setAttribute('viewBox', '0 0 10 10');
	  marker.setAttribute('refX', '10');
	  marker.setAttribute('refY', '5');
	  marker.setAttribute('markerUnits', 'strokeWidth');
	  marker.setAttribute('markerWidth', '4');
	  marker.setAttribute('markerHeight', '4');
	  marker.setAttribute('orient', 'auto');

	  const path = createSVGElement('path');
	  path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
	  marker.appendChild(path);

	  return marker;
	}

	function setPathPoints(edgeGroup, points) {
	  edgeGroup.points = points;
	  edgeGroup.path.setPoints(points);
	}

	class EdgeGroup {
	  constructor(points, animationOptions = {}) {
	    this.animationOptions = animationOptions;
	    this.points = transformPoints(points);

	    this.element = createSVGElement('g', 'edgePath');
	    this.element.setAttribute('opacity', 0);
	    this.path = new Path(this.points);

	    const defs = createSVGElement('defs');
	    const marker = Marker();

	    const arrowId = `arrowhead${generateHash()}`;
	    marker.setAttribute('id', arrowId);
	    this.path.element.setAttribute('marker-end', `url(#${arrowId})`);

	    defs.appendChild(marker);

	    this.element.appendChild(this.path.element);
	    this.element.appendChild(defs);
	  }

	  show() {
	    if (this.animationOptions && this.animationOptions.enable) {
	      const start = +new Date();
	      const { duration } = this.animationOptions;

	      const tick = () => {
	        const now = +new Date();
	        const percent = (now - start) / duration;

	        this.element.setAttribute('opacity', percent);

	        if (percent < 1) {
	          window.requestAnimationFrame(tick);
	        } else {
	          this.element.setAttribute('opacity', 1);
	        }
	      };
	      tick();
	    } else {
	      this.element.setAttribute('opacity', 1);
	    }
	  }

	  move(points) {
	    if (this.animationOptions && this.animationOptions.enable) {
	      const startPoints = Array.from(this.points);
	      const endPoints = transformPoints(points);
	      normalizePoints(startPoints, endPoints);

	      const start = +new Date();
	      const { duration } = this.animationOptions;

	      const tick = () => {
	        const now = +new Date();
	        const percent = (now - start) / duration;

	        const currentPoints = [];

	        startPoints.forEach((item, index) => {
	          currentPoints.push([
	            getAnimationStep(item[0], endPoints[index][0], percent),
	            getAnimationStep(item[1], endPoints[index][1], percent),
	          ]);
	        });

	        setPathPoints(this, currentPoints);

	        if (percent < 1) {
	          window.requestAnimationFrame(tick);
	        } else {
	          setPathPoints(this, endPoints);
	        }
	      };
	      tick();
	    } else {
	      setPathPoints(this, points);
	    }
	  }

	  remove() {
	    const { element } = this;
	    element.parentNode.removeChild(element);
	  }
	}

	const NODE_PADDING_HORIZONTAL = 15;
	const NODE_PADDING_VERTICAL = 10;

	const DEFAULT_OPTIONS = {
	  animation: {
	    enable: true,
	    duration: 300,
	  },
	};

	class Graph$9 {
	  constructor(element, options = {}) {
	    this.element = element;
	    this.options = cjs(DEFAULT_OPTIONS, options);

	    this.outputGroup = createSVGElement('g', 'output');
	    this.edgesGroup = createSVGElement('g', 'edgePaths');
	    this.clustersGroup = createSVGElement('g', 'clusters');
	    this.nodesGroup = createSVGElement('g', 'nodes');

	    this.outputGroup.appendChild(this.clustersGroup);
	    this.outputGroup.appendChild(this.edgesGroup);
	    this.outputGroup.appendChild(this.nodesGroup);

	    this.element.innerHTML = '';
	    this.element.appendChild(this.outputGroup);

	    this.graph = new dagre.graphlib.Graph({ compound: true }).setGraph({ rankdir: 'LR' }).setDefaultEdgeLabel(function() { return {}; });
	  }

	  setNode(data, parentId = null) {
	    const node = prepareNode(data);
	    // create dummy <g class="node"> with label to determine label width
	    const dummyNodeGroup = createSVGElement('g', 'node');
	    const labelGroup = new LabelGroup(node.label, true);
	    dummyNodeGroup.appendChild(labelGroup.element);
	    this.nodesGroup.appendChild(dummyNodeGroup);
	    const labelBBox = labelGroup.getBBox();
	    this.nodesGroup.removeChild(dummyNodeGroup);

	    node.labelWidth = labelBBox.width;
	    node.labelHeight = labelBBox.height;
	    node.width = labelBBox.width + NODE_PADDING_HORIZONTAL * 2;
	    node.height = labelBBox.height + NODE_PADDING_VERTICAL * 2;

	    const parent = this.graph.node(parentId);
	    if (parent && parent.id === 'HTTP-cluster') {
	      node.class = 'http';
	    }

	    this.graph.setNode(node.id, node);

	    if (parentId) {
	      this.graph.setParent(node.id, parentId);
	    }
	  }

	  removeNode(id) {
	    const edges = this.graph.nodeEdges(id);
	    const node = this.graph.node(id);

	    if (edges) {
	      edges.forEach(({ v, w }) => {
	        const edge = this.graph.edge(v, w);
	        if (edge.group) {
	          edge.group.remove();
	        }
	        this.graph.removeEdge(v, w);
	      });
	    }

	    node.group.remove();
	    this.graph.removeNode(id);
	  }

	  setEdge(start, end) {
	    if (start !== end) {
	      if (!this.graph.node(start)) {
	        this.setNode({ id: start, type: 'class' });
	      }

	      if (!this.graph.node(end)) {
	        this.setNode({ id: end, type: 'class' });
	      }

	      this.graph.setEdge(start, end);
	    }
	  }

	  render() {
	    dagre.layout(this.graph);

	    this.graph.nodes().forEach((id) => {
	      const node = this.graph.node(id);

	      if (node.group) {
	        node.group.move(node.x, node.y);

	        if (node.type === 'cluster') {
	          node.group.resize(node.width, node.height);
	        }

	        return;
	      }

	      if (node.type === 'cluster') {
	        const clusterGroup = new ClusterGroup(node);
	        node.group = clusterGroup;
	        this.clustersGroup.appendChild(clusterGroup.element);
	      } else {
	        const nodeGroup = new NodeGroup(node, this.options.animation);

	        node.group = nodeGroup;
	        node.element = nodeGroup.element;

	        this.nodesGroup.appendChild(nodeGroup.element);

	        nodeGroup.show();
	      }
	    });

	    this.graph.edges().forEach(({ v, w }) => {
	      const edge = this.graph.edge(v, w);

	      if (edge.group) {
	        edge.group.move(edge.points);
	      } else {
	        const edgeGroup = new EdgeGroup(edge.points, this.options.animation);
	        edgeGroup.element.dataset.from = v;
	        edgeGroup.element.dataset.to = w;

	        edge.group = edgeGroup;
	        edge.element = edgeGroup.element;

	        this.edgesGroup.appendChild(edgeGroup.element);

	        edgeGroup.show();
	      }
	    });

	    this.element.setAttribute('width', this.graph.graph().width);
	    this.element.setAttribute('height', this.graph.graph().height);
	  }

	  clearHighlights() {
	    this.outputGroup.querySelectorAll('.highlight,.highlight--inbound').forEach((el) => {
	      el.classList.remove('highlight');
	      el.classList.remove('highlight--inbound');
	    });
	  }

	  highlightNode(id) {
	    const highligthedNode = this.graph.node(id);
	    if (!highligthedNode || highligthedNode.element.classList.contains('dim')) {
	      return false;
	    }

	    highligthedNode.element.classList.add('highlight');

	    this.graph.nodeEdges(id).forEach((e) => {
	      const edge = this.graph.edge(e).element;
	      edge.classList.add('highlight');

	      if (id === e.w) {
	        edge.classList.add('highlight--inbound');
	      }

	      // Render highlighted connections above non-highlighted connections
	      if (!edge.classList.contains('dim')) {
	        const parent = edge.parentNode;
	        parent.removeChild(edge);
	        parent.appendChild(edge);
	      }
	    });

	    return true;
	  }

	  clearFocus() {
	    this.outputGroup.querySelectorAll('.dim').forEach((el) => {
	      el.classList.remove('dim');
	    });
	  }

	  focus(id) {
	    const [visitedNodes, visitedEdges] = findTraversableNodesAndEdges(this.graph, id);

	    this.graph.nodes().forEach((nodeId) => {
	      if (visitedNodes.has(nodeId)) {
	        return;
	      }

	      const node = this.graph.node(nodeId);
	      if (node.type !== 'cluster') {
	        node.element.classList.add('dim');
	      }
	    });

	    this.graph.edges().forEach((edgeId) => {
	      if (visitedEdges.has(edgeId)) {
	        return;
	      }

	      const edge = this.graph.edge(edgeId).element;
	      edge.classList.add('dim');

	      const parent = edge.parentNode;
	      parent.removeChild(edge);
	      parent.insertAdjacentElement('afterbegin', edge);
	    });
	  }

	  expand(id) {
	    this.graph.edges().forEach(({ v, w }) => {
	      if (v === id || w === id) {
	        const edge = this.graph.edge(v, w);
	        if (edge.group) {
	          edge.group.remove();
	          this.graph.removeEdge(v, w);
	        }
	      }
	    });

	    this.removeNode(id);

	    this.render();
	  }

	  collapse(pkg) {
	    this.render();
	  }

	  scrollToNodes(container, nodes) {
	    const nodesBox = {
	      top: [],
	      left: [],
	      right: [],
	      bottom: [],
	      x: [],
	      y: [],
	    };

	    nodes.forEach((id) => {
	      const node = this.graph.node(id);
	      if (!node) {
	        return;
	      }

	      const nodeBox = node.element.getBoundingClientRect();
	      nodesBox.top.push(nodeBox.top);
	      nodesBox.left.push(nodeBox.left);
	      nodesBox.right.push(nodeBox.right);
	      nodesBox.bottom.push(nodeBox.bottom);
	      nodesBox.x.push(node.x - nodeBox.width / 2);
	      nodesBox.y.push(node.y - nodeBox.height / 2);
	    });

	    nodesBox.top = Math.min(...nodesBox.top);
	    nodesBox.left = Math.min(...nodesBox.left);
	    nodesBox.right = Math.max(...nodesBox.right);
	    nodesBox.bottom = Math.max(...nodesBox.bottom);
	    nodesBox.offsetTop = Math.min(...nodesBox.y);
	    nodesBox.offsetLeft = Math.min(...nodesBox.x);

	    nodesBox.width = nodesBox.right - nodesBox.left;
	    nodesBox.height = nodesBox.bottom - nodesBox.top;

	    const containerBox = container.getBoundingClientRect();

	    if (Geometry.contains(containerBox, nodesBox)) {
	      return false;
	    }

	    const xRatio = containerBox.width / nodesBox.width;
	    const yRatio = containerBox.height / nodesBox.height;
	    const scale = (xRatio > 1 && yRatio > 1) ? 1 : Math.min(xRatio, yRatio) - 0.01;

	    return {
	      scale,
	      x: nodesBox.width / 2 + nodesBox.offsetLeft,
	      y: nodesBox.height / 2 + nodesBox.offsetTop,
	    };
	  }

	  makeRoot(id) {
	    const visitedNodes = new Set();
	    const visitedEdges = new Set();
	    const queue = [id];

	    while (queue.length > 0) {
	      const currentId = queue.pop();
	      if (!visitedNodes.has(currentId)) {
	        this.graph.outEdges(currentId).forEach((e) => {
	          visitedEdges.add(e);
	          queue.push(e.w);
	        });

	        visitedNodes.add(currentId);
	      }
	    }

	    // cleanup non traversable nodes
	    this.graph.nodes().forEach((node) => {
	      if (visitedNodes.has(node)) {
	        return;
	      }
	      this.removeNode(node);
	    });

	    this.render();
	  }
	}

	const DEFAULT_TARGET_COUNT = 1;
	const IDEAL_CHILD_COUNT = 1;

	function mixedDiagram(graphDefinition, targetNodeCount = DEFAULT_TARGET_COUNT) {
	  if (!graphDefinition
	      || !graphDefinition.package_calls
	      || graphDefinition.package_calls.length === 0) {
	    return {};
	  }

	  /* eslint-disable camelcase */
	  const {
	    class_calls,
	    class_callers,
	    class_package,
	    packages,
	    package_calls,
	    package_classes,
	  } = graphDefinition;
	  /* eslint-enable camelcase */

	  const diagramCalls = { ...package_calls }; // eslint-disable-line camelcase
	  const score = (packageName) => {
	    let result = 0;
	    // Other score factors can be added here.

	    // Adjust for an 'ideal' number of children.
	    const childCount = package_classes[packageName].length;
	    const childrenFactor = Math.abs(IDEAL_CHILD_COUNT - childCount);
	    result += childrenFactor;
	    return result;
	  };

	  const sortedPackages = [...packages].sort((a, b) => score(b) - score(a));
	  const diagramSize = () => new Set(Object.entries(diagramCalls).flat(2)).size;

	  while (diagramSize() < targetNodeCount) {
	    if (sortedPackages.length === 0) {
	      break;
	    }

	    const pkg = sortedPackages.pop();
	    const classes = package_classes[pkg];

	    // 1. This package is being replaced with its classes, so remove the node
	    // edges in which this package was the source
	    delete diagramCalls[pkg];

	    // 2. Remove all calls to this package as well
	    Object.values(diagramCalls).forEach((set) => set.delete(pkg));

	    // 3. Add all the calls to each class in this package. The parent should be
	    // the package (if it's present in the call graph), or the class.
	    classes.forEach((cls) => {
	      const classCallers = class_callers[cls] || [];
	      classCallers.forEach((caller) => {
	        const parent = diagramCalls[caller] ? caller : class_package[caller];
	        if (parent === pkg) {
	          return;
	        }

	        if (!diagramCalls[parent]) {
	          diagramCalls[parent] = new Set();
	        }

	        diagramCalls[parent].add(cls);
	      });
	    });

	    // 4. Add the calls made by the classes in this package. If the calls are
	    // made to a class which is collapsed into a package, call the package.
	    // Later, if that package is expanded, step 2 will replace the call to the
	    // package with a call to the class.
	    classes.forEach((cls) => {
	      const classCalls = class_calls[cls] || [];
	      classCalls.forEach((callee) => {
	        const calleePackage = class_package[callee];
	        const child = diagramCalls[calleePackage] ? calleePackage : callee;
	        if (child === pkg) {
	          return;
	        }

	        if (!diagramCalls[cls]) {
	          diagramCalls[cls] = new Set();
	        }

	        diagramCalls[cls].add(child);
	      });
	    });
	  }

	  const entries = Object.entries(diagramCalls).map(([k, vs]) => [k, [...vs]]);
	  const edges = entries
	    .map(([k, vs]) => vs.map((v) => [k, v]))
	    .flat()
	    .filter(([v, w]) => v !== w);
	  const nodes = Object.values(edges.flat(2).reduce((obj, id) => {
	    obj[id] = {
	      id,
	      type: packages.has(id) ? 'package' : 'class',
	    };
	    setChildrenCount(obj[id], graphDefinition);
	    return obj;
	  }, {}));

	  return { edges, nodes };
	}

	function setChildrenCount(obj, model) {
	  const childrenCount = new Set(model.package_classes[obj.id]).size;
	  if (childrenCount && childrenCount > 1) {
	    obj.label = `${obj.id} (${childrenCount})`;
	  }
	}

	function activeNodes(graph, model, list, fn) {
	  if (list) {
	    list.forEach((classId) => {
	      if (graph.node(classId)) {
	        fn(classId);
	        return;
	      }

	      const classPackage = model.class_package[classId];
	      if (graph.node(classPackage)) {
	        fn(classPackage);
	      }
	    });
	  }
	}

	function bindEvents(componentDiagram) {
	  const svg = componentDiagram.element.node();

	  svg.addEventListener('click', (event) => {
	    const node = getEventTarget(event.target, svg, 'g.nodes g.node');
	    if (!node) {
	      return;
	    }

	    event.stopPropagation();
	    componentDiagram.highlight(node.dataset.id);
	  });

	  svg.addEventListener('dblclick', (event) => {
	    const node = getEventTarget(event.target, svg, 'g.nodes g.node');
	    if (!node) {
	      return;
	    }

	    event.stopPropagation();
	    componentDiagram.focus(node.dataset.id);
	  });

	  svg.addEventListener('click', (event) => {
	    const edge = getEventTarget(event.target, svg, '.edgePath > path');
	    if (!edge) {
	      return;
	    }

	    event.stopPropagation();
	    componentDiagram.clearHighlights(true);

	    edge.parentNode.classList.add('highlight');
	    d3.select(svg).selectAll('.edgePath.highlight').raise();

	    componentDiagram.emit('edge', [edge.parentNode.dataset.from, edge.parentNode.dataset.to]);
	  });
	}

	const COMPONENT_OPTIONS = {
	  contextMenu(componentDiagram) {
	    return [
	      (item) => item
	        .text('Set as root')
	        .selector('.nodes .node')
	        .transform((e) => e.dataset.id)
	        .on('execute', (id) => componentDiagram.makeRoot(id)),
	      (item) => item
	        .text('Expand')
	        .selector('g.node')
	        .transform((e) => e.dataset.id)
	        .condition((id) => componentDiagram.hasPackage(id))
	        .on('execute', (id) => componentDiagram.expand(id)),
	      (item) => item
	        .text('Collapse')
	        .selector('g.node')
	        .transform((e) => e.dataset.id)
	        .condition((id) => !componentDiagram.hasPackage(id))
	        .on('execute', (id) => componentDiagram.collapse(id)),
	      (item) => item
	        .text('View source')
	        .selector('g.node.class')
	        .transform((e) => componentDiagram.sourceLocation(e.dataset.id))
	        .on('execute', (repoUrl) => window.open(repoUrl)),
	      (item) => item
	        .text('Reset view')
	        .on('execute', () => {
	          componentDiagram.render(componentDiagram.initialModel);
	        }),
	    ];
	  },
	};

	class ComponentDiagram extends Models.EventSource {
	  constructor(container, options = {}) {
	    super();

	    const componentDiagramOptions = cjs(COMPONENT_OPTIONS, options);

	    this.container = new Container(container, componentDiagramOptions);
	    this.container.containerController.setContextMenu(this);

	    this.targetCount = DEFAULT_TARGET_COUNT;
	    this.element = d3.select(this.container)
	      .append('svg')
	      .attr('class', 'appmap__component-diagram');

	    this.on('postrender', () => {
	      this.container.containerController.fitViewport(this.container);
	    });

	    this.container.containerController.element.addEventListener('click', (event) => {
	      if (!event.target.classList.contains('dropdown-item')) {
	        this.clearHighlights();
	      }

	      if (this.container.containerController.contextMenu) {
	        this.container.containerController.contextMenu.close();
	      }
	    });

	    this.container.containerController.element.addEventListener('move', () => {
	      if (this.container.containerController.contextMenu) {
	        this.container.containerController.contextMenu.close();
	      }
	    });

	    this.container.containerController.element.addEventListener('dblclick', () => {
	      this.clearFocus();
	    });
	  }

	  render(data) {
	    if (!data || typeof data !== 'object') {
	      return;
	    }

	    ['class_callers', 'class_calls', 'class_package', 'package_calls', 'package_classes'].forEach((key) => {
	      if (Object.keys(data[key]).includes('')) {
	        delete data[key][''];
	      }
	    });

	    ['class_callers', 'class_calls', 'package_calls'].forEach((k) => {
	      Object.entries(data[k]).forEach(([key, value]) => {
	        if (Array.isArray(value) && value.includes(null)) {
	          value.splice(value.indexOf(null), 1);
	        }
	      });
	    });

	    if (!this.initialModel) {
	      this.initialModel = { ...data };
	    }

	    this.currentDiagramModel = hashify(data);

	    this.graph = new Graph$9(this.element.node(), {
	      animation: {
	        duration: 600,
	      },
	    });

	    const { nodes, edges } = mixedDiagram(this.currentDiagramModel, this.targetCount);
	    nodes.forEach((node) => {
	      this.graph.setNode(node);
	    });
	    edges.forEach(([start, end]) => this.graph.setEdge(start, end));

	    this.graph.render();

	    bindEvents(this);

	    // expand nodes with 1 child
	    Object.entries(this.currentDiagramModel.package_classes).forEach(([nodeId, children]) => {
	      const nodeChildren = new Set(children);
	      if (nodeChildren.size === 1) {
	        this.expand(nodeId, false);
	      }
	    });

	    this.emit('postrender');
	  }

	  clearHighlights(noEvent = false) {
	    this.graph.clearHighlights();

	    if (!noEvent) {
	      this.emit('highlight', null);
	    }
	  }

	  highlight(nodes) {
	    this.clearHighlights(true);

	    let nodesIds = [];

	    if (Array.isArray(nodes)) {
	      nodesIds = nodes;
	    } else if (typeof nodes === 'string') {
	      nodesIds = [nodes];
	    }

	    let wasHighlighted = false;

	    nodesIds.forEach((id) => {
	      if (!this.graph.highlightNode(id)) {
	        return;
	      }

	      wasHighlighted = true;
	    });

	    if (wasHighlighted) {
	      this.scrollTo(nodes);
	      this.emit('highlight', nodesIds);
	    } else {
	      this.emit('highlight', null);
	    }

	    return wasHighlighted;
	  }

	  clearFocus() {
	    this.graph.clearFocus();

	    this.emit('focus', null);
	  }

	  focus(id) {
	    this.graph.clearFocus();
	    this.graph.focus(id);

	    this.scrollTo(id);

	    this.emit('focus', id);
	  }

	  scrollTo(nodes) {
	    let nodesIds = [];

	    if (Array.isArray(nodes)) {
	      nodesIds = nodes;
	    } else if (typeof nodes === 'string') {
	      nodesIds = [nodes];
	    }

	    const { containerController } = this.container;

	    const scrollOptions = this.graph.scrollToNodes(containerController.element, nodesIds);

	    if (scrollOptions) {
	      containerController.scaleTo(scrollOptions.scale);

	      setTimeout(() => {
	        containerController.translateTo(scrollOptions.x, scrollOptions.y);
	      }, 200);

	      this.emit('scrollTo', nodesIds);
	    }
	  }

	  expand(nodeId, scrollToSubclasses = true) {
	    const subclasses = Array.from(new Set(this.currentDiagramModel.package_classes[nodeId]));
	    if (subclasses.length === 0 || subclasses[0] === nodeId) {
	      return;
	    }

	    const clusterId = `${nodeId}-cluster`;
	    const clusterNode = { id: clusterId, type: 'cluster', children: subclasses.length };

	    this.graph.setNode(clusterNode);

	    subclasses.forEach((cls) => {
	      this.graph.setNode({ id: cls, type: 'class' }, clusterId);

	      const model = this.currentDiagramModel;
	      activeNodes(this.graph.graph, model, model.class_calls[cls], (id) => {
	        if (cls !== id) {
	          this.graph.setEdge(cls, id);
	        }
	      });

	      activeNodes(this.graph.graph, model, model.class_callers[cls], (id) => {
	        if (cls !== id) {
	          this.graph.setEdge(id, cls);
	        }
	      });
	    });

	    this.graph.expand(nodeId, clusterId);

	    if (scrollToSubclasses) {
	      this.scrollTo(subclasses);
	    }

	    this.emit('expand', nodeId);
	  }

	  collapse(nodeId, scrollToPackage = true) {
	    const pkg = this.currentDiagramModel.class_package[nodeId];
	    if (!pkg) {
	      return;
	    }

	    const pkgClasses = this.currentDiagramModel.package_classes[pkg];
	    if (!pkgClasses) {
	      return;
	    }

	    this.graph.removeNode(`${pkg}-cluster`);

	    const obj = { id: pkg, type: 'package' };
	    setChildrenCount(obj, this.currentDiagramModel);
	    this.graph.setNode(obj);

	    pkgClasses.forEach((id) => {
	      this.graph.removeNode(id);

	      const model = this.currentDiagramModel;
	      activeNodes(this.graph.graph, model, model.class_calls[id], (cls) => {
	        if (cls !== pkg) {
	          this.graph.setEdge(pkg, cls);
	        }
	      });

	      activeNodes(this.graph.graph, model, model.class_callers[id], (cls) => {
	        if (cls !== pkg) {
	          this.graph.setEdge(cls, pkg);
	        }
	      });
	    });

	    this.graph.collapse(pkg);

	    if (scrollToPackage) {
	      this.scrollTo(pkg);
	    }

	    this.emit('collapse', pkg);
	  }

	  makeRoot(nodeId) {
	    this.graph.makeRoot(nodeId);
	    this.scrollTo(nodeId);
	  }

	  sourceLocation(nodeId) {
	    const path = this.currentDiagramModel.class_locations[nodeId];
	    if (!path) {
	      return null;
	    }

	    const { url, commit } = this.currentDiagramModel.source_control;
	    return getRepositoryUrl(url, path, commit);
	  }

	  hasPackage(packageId) {
	    return this.currentDiagramModel.packages.has(packageId);
	  }
	}

	/**
	 * The base implementation of `_.slice` without an iteratee call guard.
	 *
	 * @private
	 * @param {Array} array The array to slice.
	 * @param {number} [start=0] The start position.
	 * @param {number} [end=array.length] The end position.
	 * @returns {Array} Returns the slice of `array`.
	 */
	function baseSlice(array, start, end) {
	  var index = -1,
	      length = array.length;

	  if (start < 0) {
	    start = -start > length ? 0 : (length + start);
	  }
	  end = end > length ? length : end;
	  if (end < 0) {
	    end += length;
	  }
	  length = start > end ? 0 : ((end - start) >>> 0);
	  start >>>= 0;

	  var result = Array(length);
	  while (++index < length) {
	    result[index] = array[index + start];
	  }
	  return result;
	}

	var _baseSlice = baseSlice;

	/**
	 * Casts `array` to a slice if it's needed.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {number} start The start position.
	 * @param {number} [end=array.length] The end position.
	 * @returns {Array} Returns the cast slice.
	 */
	function castSlice(array, start, end) {
	  var length = array.length;
	  end = end === undefined ? length : end;
	  return (!start && end >= length) ? array : _baseSlice(array, start, end);
	}

	var _castSlice = castSlice;

	/**
	 * Used by `_.trim` and `_.trimEnd` to get the index of the last string symbol
	 * that is not found in the character symbols.
	 *
	 * @private
	 * @param {Array} strSymbols The string symbols to inspect.
	 * @param {Array} chrSymbols The character symbols to find.
	 * @returns {number} Returns the index of the last unmatched string symbol.
	 */
	function charsEndIndex(strSymbols, chrSymbols) {
	  var index = strSymbols.length;

	  while (index-- && _baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}
	  return index;
	}

	var _charsEndIndex = charsEndIndex;

	/**
	 * Converts an ASCII `string` to an array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the converted array.
	 */
	function asciiToArray(string) {
	  return string.split('');
	}

	var _asciiToArray = asciiToArray;

	/** Used to compose unicode character classes. */
	var rsAstralRange$2 = '\\ud800-\\udfff',
	    rsComboMarksRange$2 = '\\u0300-\\u036f',
	    reComboHalfMarksRange$2 = '\\ufe20-\\ufe2f',
	    rsComboSymbolsRange$2 = '\\u20d0-\\u20ff',
	    rsComboRange$2 = rsComboMarksRange$2 + reComboHalfMarksRange$2 + rsComboSymbolsRange$2,
	    rsVarRange$2 = '\\ufe0e\\ufe0f';

	/** Used to compose unicode capture groups. */
	var rsAstral$1 = '[' + rsAstralRange$2 + ']',
	    rsCombo$1 = '[' + rsComboRange$2 + ']',
	    rsFitz$1 = '\\ud83c[\\udffb-\\udfff]',
	    rsModifier$1 = '(?:' + rsCombo$1 + '|' + rsFitz$1 + ')',
	    rsNonAstral$1 = '[^' + rsAstralRange$2 + ']',
	    rsRegional$1 = '(?:\\ud83c[\\udde6-\\uddff]){2}',
	    rsSurrPair$1 = '[\\ud800-\\udbff][\\udc00-\\udfff]',
	    rsZWJ$2 = '\\u200d';

	/** Used to compose unicode regexes. */
	var reOptMod$1 = rsModifier$1 + '?',
	    rsOptVar$1 = '[' + rsVarRange$2 + ']?',
	    rsOptJoin$1 = '(?:' + rsZWJ$2 + '(?:' + [rsNonAstral$1, rsRegional$1, rsSurrPair$1].join('|') + ')' + rsOptVar$1 + reOptMod$1 + ')*',
	    rsSeq$1 = rsOptVar$1 + reOptMod$1 + rsOptJoin$1,
	    rsSymbol$1 = '(?:' + [rsNonAstral$1 + rsCombo$1 + '?', rsCombo$1, rsRegional$1, rsSurrPair$1, rsAstral$1].join('|') + ')';

	/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
	var reUnicode$1 = RegExp(rsFitz$1 + '(?=' + rsFitz$1 + ')|' + rsSymbol$1 + rsSeq$1, 'g');

	/**
	 * Converts a Unicode `string` to an array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the converted array.
	 */
	function unicodeToArray(string) {
	  return string.match(reUnicode$1) || [];
	}

	var _unicodeToArray = unicodeToArray;

	/**
	 * Converts `string` to an array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the converted array.
	 */
	function stringToArray(string) {
	  return _hasUnicode(string)
	    ? _unicodeToArray(string)
	    : _asciiToArray(string);
	}

	var _stringToArray = stringToArray;

	/** Used to match leading and trailing whitespace. */
	var reTrimEnd = /\s+$/;

	/**
	 * Removes trailing whitespace or specified characters from `string`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category String
	 * @param {string} [string=''] The string to trim.
	 * @param {string} [chars=whitespace] The characters to trim.
	 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
	 * @returns {string} Returns the trimmed string.
	 * @example
	 *
	 * _.trimEnd('  abc  ');
	 * // => '  abc'
	 *
	 * _.trimEnd('-_-abc-_-', '_-');
	 * // => '-_-abc'
	 */
	function trimEnd(string, chars, guard) {
	  string = toString_1(string);
	  if (string && (guard || chars === undefined)) {
	    return string.replace(reTrimEnd, '');
	  }
	  if (!string || !(chars = _baseToString(chars))) {
	    return string;
	  }
	  var strSymbols = _stringToArray(string),
	      end = _charsEndIndex(strSymbols, _stringToArray(chars)) + 1;

	  return _castSlice(strSymbols, 0, end).join('');
	}

	var trimEnd_1 = trimEnd;

	var tokenTypes = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;
	/**
	 * Constants for token types
	 */
	exports["default"] = {
	    WHITESPACE: "whitespace",
	    WORD: "word",
	    STRING: "string",
	    RESERVED: "reserved",
	    RESERVED_TOPLEVEL: "reserved-toplevel",
	    RESERVED_NEWLINE: "reserved-newline",
	    OPERATOR: "operator",
	    OPEN_PAREN: "open-paren",
	    CLOSE_PAREN: "close-paren",
	    LINE_COMMENT: "line-comment",
	    BLOCK_COMMENT: "block-comment",
	    NUMBER: "number",
	    PLACEHOLDER: "placeholder"
	};
	module.exports = exports["default"];
	});

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER$2 = 9007199254740991;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeFloor = Math.floor;

	/**
	 * The base implementation of `_.repeat` which doesn't coerce arguments.
	 *
	 * @private
	 * @param {string} string The string to repeat.
	 * @param {number} n The number of times to repeat the string.
	 * @returns {string} Returns the repeated string.
	 */
	function baseRepeat(string, n) {
	  var result = '';
	  if (!string || n < 1 || n > MAX_SAFE_INTEGER$2) {
	    return result;
	  }
	  // Leverage the exponentiation by squaring algorithm for a faster repeat.
	  // See https://en.wikipedia.org/wiki/Exponentiation_by_squaring for more details.
	  do {
	    if (n % 2) {
	      result += string;
	    }
	    n = nativeFloor(n / 2);
	    if (n) {
	      string += string;
	    }
	  } while (n);

	  return result;
	}

	var _baseRepeat = baseRepeat;

	/**
	 * Repeats the given string `n` times.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category String
	 * @param {string} [string=''] The string to repeat.
	 * @param {number} [n=1] The number of times to repeat the string.
	 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
	 * @returns {string} Returns the repeated string.
	 * @example
	 *
	 * _.repeat('*', 3);
	 * // => '***'
	 *
	 * _.repeat('abc', 2);
	 * // => 'abcabc'
	 *
	 * _.repeat('abc', 0);
	 * // => ''
	 */
	function repeat(string, n, guard) {
	  if ((guard ? _isIterateeCall(string, n, guard) : n === undefined)) {
	    n = 1;
	  } else {
	    n = toInteger_1(n);
	  }
	  return _baseRepeat(toString_1(string), n);
	}

	var repeat_1 = repeat;

	var Indentation_1 = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;



	var _repeat2 = _interopRequireDefault(repeat_1);



	var _last2 = _interopRequireDefault(last_1);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var INDENT_TYPE_TOP_LEVEL = "top-level";
	var INDENT_TYPE_BLOCK_LEVEL = "block-level";

	/**
	 * Manages indentation levels.
	 *
	 * There are two types of indentation levels:
	 *
	 * - BLOCK_LEVEL : increased by open-parenthesis
	 * - TOP_LEVEL : increased by RESERVED_TOPLEVEL words
	 */

	var Indentation = function () {
	    /**
	     * @param {String} indent Indent value, default is "  " (2 spaces)
	     */
	    function Indentation(indent) {
	        _classCallCheck(this, Indentation);

	        this.indent = indent || "  ";
	        this.indentTypes = [];
	    }

	    /**
	     * Returns current indentation string.
	     * @return {String}
	     */


	    Indentation.prototype.getIndent = function getIndent() {
	        return (0, _repeat2["default"])(this.indent, this.indentTypes.length);
	    };

	    /**
	     * Increases indentation by one top-level indent.
	     */


	    Indentation.prototype.increaseToplevel = function increaseToplevel() {
	        this.indentTypes.push(INDENT_TYPE_TOP_LEVEL);
	    };

	    /**
	     * Increases indentation by one block-level indent.
	     */


	    Indentation.prototype.increaseBlockLevel = function increaseBlockLevel() {
	        this.indentTypes.push(INDENT_TYPE_BLOCK_LEVEL);
	    };

	    /**
	     * Decreases indentation by one top-level indent.
	     * Does nothing when the previous indent is not top-level.
	     */


	    Indentation.prototype.decreaseTopLevel = function decreaseTopLevel() {
	        if ((0, _last2["default"])(this.indentTypes) === INDENT_TYPE_TOP_LEVEL) {
	            this.indentTypes.pop();
	        }
	    };

	    /**
	     * Decreases indentation by one block-level indent.
	     * If there are top-level indents within the block-level indent,
	     * throws away these as well.
	     */


	    Indentation.prototype.decreaseBlockLevel = function decreaseBlockLevel() {
	        while (this.indentTypes.length > 0) {
	            var type = this.indentTypes.pop();
	            if (type !== INDENT_TYPE_TOP_LEVEL) {
	                break;
	            }
	        }
	    };

	    return Indentation;
	}();

	exports["default"] = Indentation;
	module.exports = exports["default"];
	});

	var InlineBlock_1 = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;



	var _tokenTypes2 = _interopRequireDefault(tokenTypes);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var INLINE_MAX_LENGTH = 50;

	/**
	 * Bookkeeper for inline blocks.
	 *
	 * Inline blocks are parenthized expressions that are shorter than INLINE_MAX_LENGTH.
	 * These blocks are formatted on a single line, unlike longer parenthized
	 * expressions where open-parenthesis causes newline and increase of indentation.
	 */

	var InlineBlock = function () {
	    function InlineBlock() {
	        _classCallCheck(this, InlineBlock);

	        this.level = 0;
	    }

	    /**
	     * Begins inline block when lookahead through upcoming tokens determines
	     * that the block would be smaller than INLINE_MAX_LENGTH.
	     * @param  {Object[]} tokens Array of all tokens
	     * @param  {Number} index Current token position
	     */


	    InlineBlock.prototype.beginIfPossible = function beginIfPossible(tokens, index) {
	        if (this.level === 0 && this.isInlineBlock(tokens, index)) {
	            this.level = 1;
	        } else if (this.level > 0) {
	            this.level++;
	        } else {
	            this.level = 0;
	        }
	    };

	    /**
	     * Finishes current inline block.
	     * There might be several nested ones.
	     */


	    InlineBlock.prototype.end = function end() {
	        this.level--;
	    };

	    /**
	     * True when inside an inline block
	     * @return {Boolean}
	     */


	    InlineBlock.prototype.isActive = function isActive() {
	        return this.level > 0;
	    };

	    // Check if this should be an inline parentheses block
	    // Examples are "NOW()", "COUNT(*)", "int(10)", key(`somecolumn`), DECIMAL(7,2)


	    InlineBlock.prototype.isInlineBlock = function isInlineBlock(tokens, index) {
	        var length = 0;
	        var level = 0;

	        for (var i = index; i < tokens.length; i++) {
	            var token = tokens[i];
	            length += token.value.length;

	            // Overran max length
	            if (length > INLINE_MAX_LENGTH) {
	                return false;
	            }

	            if (token.type === _tokenTypes2["default"].OPEN_PAREN) {
	                level++;
	            } else if (token.type === _tokenTypes2["default"].CLOSE_PAREN) {
	                level--;
	                if (level === 0) {
	                    return true;
	                }
	            }

	            if (this.isForbiddenToken(token)) {
	                return false;
	            }
	        }
	        return false;
	    };

	    // Reserved words that cause newlines, comments and semicolons
	    // are not allowed inside inline parentheses block


	    InlineBlock.prototype.isForbiddenToken = function isForbiddenToken(_ref) {
	        var type = _ref.type,
	            value = _ref.value;

	        return type === _tokenTypes2["default"].RESERVED_TOPLEVEL || type === _tokenTypes2["default"].RESERVED_NEWLINE || type === _tokenTypes2["default"].COMMENT || type === _tokenTypes2["default"].BLOCK_COMMENT || value === ";";
	    };

	    return InlineBlock;
	}();

	exports["default"] = InlineBlock;
	module.exports = exports["default"];
	});

	var Params_1 = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * Handles placeholder replacement with given params.
	 */
	var Params = function () {
	    /**
	     * @param {Object} params
	     */
	    function Params(params) {
	        _classCallCheck(this, Params);

	        this.params = params;
	        this.index = 0;
	    }

	    /**
	     * Returns param value that matches given placeholder with param key.
	     * @param {Object} token
	     *   @param {String} token.key Placeholder key
	     *   @param {String} token.value Placeholder value
	     * @return {String} param or token.value when params are missing
	     */


	    Params.prototype.get = function get(_ref) {
	        var key = _ref.key,
	            value = _ref.value;

	        if (!this.params) {
	            return value;
	        }
	        if (key) {
	            return this.params[key];
	        }
	        return this.params[this.index++];
	    };

	    return Params;
	}();

	exports["default"] = Params;
	module.exports = exports["default"];
	});

	var Formatter_1 = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;



	var _trimEnd2 = _interopRequireDefault(trimEnd_1);



	var _tokenTypes2 = _interopRequireDefault(tokenTypes);



	var _Indentation2 = _interopRequireDefault(Indentation_1);



	var _InlineBlock2 = _interopRequireDefault(InlineBlock_1);



	var _Params2 = _interopRequireDefault(Params_1);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Formatter = function () {
	    /**
	     * @param {Object} cfg
	     *   @param {Object} cfg.indent
	     *   @param {Object} cfg.params
	     * @param {Tokenizer} tokenizer
	     */
	    function Formatter(cfg, tokenizer) {
	        _classCallCheck(this, Formatter);

	        this.cfg = cfg || {};
	        this.indentation = new _Indentation2["default"](this.cfg.indent);
	        this.inlineBlock = new _InlineBlock2["default"]();
	        this.params = new _Params2["default"](this.cfg.params);
	        this.tokenizer = tokenizer;
	        this.previousReservedWord = {};
	        this.tokens = [];
	        this.index = 0;
	    }

	    /**
	     * Formats whitespaces in a SQL string to make it easier to read.
	     *
	     * @param {String} query The SQL query string
	     * @return {String} formatted query
	     */


	    Formatter.prototype.format = function format(query) {
	        this.tokens = this.tokenizer.tokenize(query);
	        var formattedQuery = this.getFormattedQueryFromTokens();

	        return formattedQuery.trim();
	    };

	    Formatter.prototype.getFormattedQueryFromTokens = function getFormattedQueryFromTokens() {
	        var _this = this;

	        var formattedQuery = "";

	        this.tokens.forEach(function (token, index) {
	            _this.index = index;

	            if (token.type === _tokenTypes2["default"].WHITESPACE) ; else if (token.type === _tokenTypes2["default"].LINE_COMMENT) {
	                formattedQuery = _this.formatLineComment(token, formattedQuery);
	            } else if (token.type === _tokenTypes2["default"].BLOCK_COMMENT) {
	                formattedQuery = _this.formatBlockComment(token, formattedQuery);
	            } else if (token.type === _tokenTypes2["default"].RESERVED_TOPLEVEL) {
	                formattedQuery = _this.formatToplevelReservedWord(token, formattedQuery);
	                _this.previousReservedWord = token;
	            } else if (token.type === _tokenTypes2["default"].RESERVED_NEWLINE) {
	                formattedQuery = _this.formatNewlineReservedWord(token, formattedQuery);
	                _this.previousReservedWord = token;
	            } else if (token.type === _tokenTypes2["default"].RESERVED) {
	                formattedQuery = _this.formatWithSpaces(token, formattedQuery);
	                _this.previousReservedWord = token;
	            } else if (token.type === _tokenTypes2["default"].OPEN_PAREN) {
	                formattedQuery = _this.formatOpeningParentheses(token, formattedQuery);
	            } else if (token.type === _tokenTypes2["default"].CLOSE_PAREN) {
	                formattedQuery = _this.formatClosingParentheses(token, formattedQuery);
	            } else if (token.type === _tokenTypes2["default"].PLACEHOLDER) {
	                formattedQuery = _this.formatPlaceholder(token, formattedQuery);
	            } else if (token.value === ",") {
	                formattedQuery = _this.formatComma(token, formattedQuery);
	            } else if (token.value === ":") {
	                formattedQuery = _this.formatWithSpaceAfter(token, formattedQuery);
	            } else if (token.value === ".") {
	                formattedQuery = _this.formatWithoutSpaces(token, formattedQuery);
	            } else if (token.value === ";") {
	                formattedQuery = _this.formatQuerySeparator(token, formattedQuery);
	            } else {
	                formattedQuery = _this.formatWithSpaces(token, formattedQuery);
	            }
	        });
	        return formattedQuery;
	    };

	    Formatter.prototype.formatLineComment = function formatLineComment(token, query) {
	        return this.addNewline(query + token.value);
	    };

	    Formatter.prototype.formatBlockComment = function formatBlockComment(token, query) {
	        return this.addNewline(this.addNewline(query) + this.indentComment(token.value));
	    };

	    Formatter.prototype.indentComment = function indentComment(comment) {
	        return comment.replace(/\n/g, "\n" + this.indentation.getIndent());
	    };

	    Formatter.prototype.formatToplevelReservedWord = function formatToplevelReservedWord(token, query) {
	        this.indentation.decreaseTopLevel();

	        query = this.addNewline(query);

	        this.indentation.increaseToplevel();

	        query += this.equalizeWhitespace(token.value);
	        return this.addNewline(query);
	    };

	    Formatter.prototype.formatNewlineReservedWord = function formatNewlineReservedWord(token, query) {
	        return this.addNewline(query) + this.equalizeWhitespace(token.value) + " ";
	    };

	    // Replace any sequence of whitespace characters with single space


	    Formatter.prototype.equalizeWhitespace = function equalizeWhitespace(string) {
	        return string.replace(/\s+/g, " ");
	    };

	    // Opening parentheses increase the block indent level and start a new line


	    Formatter.prototype.formatOpeningParentheses = function formatOpeningParentheses(token, query) {
	        // Take out the preceding space unless there was whitespace there in the original query
	        // or another opening parens or line comment
	        var preserveWhitespaceFor = [_tokenTypes2["default"].WHITESPACE, _tokenTypes2["default"].OPEN_PAREN, _tokenTypes2["default"].LINE_COMMENT];
	        if (!preserveWhitespaceFor.includes(this.previousToken().type)) {
	            query = (0, _trimEnd2["default"])(query);
	        }
	        query += token.value;

	        this.inlineBlock.beginIfPossible(this.tokens, this.index);

	        if (!this.inlineBlock.isActive()) {
	            this.indentation.increaseBlockLevel();
	            query = this.addNewline(query);
	        }
	        return query;
	    };

	    // Closing parentheses decrease the block indent level


	    Formatter.prototype.formatClosingParentheses = function formatClosingParentheses(token, query) {
	        if (this.inlineBlock.isActive()) {
	            this.inlineBlock.end();
	            return this.formatWithSpaceAfter(token, query);
	        } else {
	            this.indentation.decreaseBlockLevel();
	            return this.formatWithSpaces(token, this.addNewline(query));
	        }
	    };

	    Formatter.prototype.formatPlaceholder = function formatPlaceholder(token, query) {
	        return query + this.params.get(token) + " ";
	    };

	    // Commas start a new line (unless within inline parentheses or SQL "LIMIT" clause)


	    Formatter.prototype.formatComma = function formatComma(token, query) {
	        query = this.trimTrailingWhitespace(query) + token.value + " ";

	        if (this.inlineBlock.isActive()) {
	            return query;
	        } else if (/^LIMIT$/i.test(this.previousReservedWord.value)) {
	            return query;
	        } else {
	            return this.addNewline(query);
	        }
	    };

	    Formatter.prototype.formatWithSpaceAfter = function formatWithSpaceAfter(token, query) {
	        return this.trimTrailingWhitespace(query) + token.value + " ";
	    };

	    Formatter.prototype.formatWithoutSpaces = function formatWithoutSpaces(token, query) {
	        return this.trimTrailingWhitespace(query) + token.value;
	    };

	    Formatter.prototype.formatWithSpaces = function formatWithSpaces(token, query) {
	        return query + token.value + " ";
	    };

	    Formatter.prototype.formatQuerySeparator = function formatQuerySeparator(token, query) {
	        return this.trimTrailingWhitespace(query) + token.value + "\n";
	    };

	    Formatter.prototype.addNewline = function addNewline(query) {
	        return (0, _trimEnd2["default"])(query) + "\n" + this.indentation.getIndent();
	    };

	    Formatter.prototype.trimTrailingWhitespace = function trimTrailingWhitespace(query) {
	        if (this.previousNonWhitespaceToken().type === _tokenTypes2["default"].LINE_COMMENT) {
	            return (0, _trimEnd2["default"])(query) + "\n";
	        } else {
	            return (0, _trimEnd2["default"])(query);
	        }
	    };

	    Formatter.prototype.previousNonWhitespaceToken = function previousNonWhitespaceToken() {
	        var n = 1;
	        while (this.previousToken(n).type === _tokenTypes2["default"].WHITESPACE) {
	            n++;
	        }
	        return this.previousToken(n);
	    };

	    Formatter.prototype.previousToken = function previousToken() {
	        var offset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

	        return this.tokens[this.index - offset] || {};
	    };

	    return Formatter;
	}();

	exports["default"] = Formatter;
	module.exports = exports["default"];
	});

	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar$1 = /[\\^$.*+?()[\]{}|]/g,
	    reHasRegExpChar = RegExp(reRegExpChar$1.source);

	/**
	 * Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
	 * "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category String
	 * @param {string} [string=''] The string to escape.
	 * @returns {string} Returns the escaped string.
	 * @example
	 *
	 * _.escapeRegExp('[lodash](https://lodash.com/)');
	 * // => '\[lodash\]\(https://lodash\.com/\)'
	 */
	function escapeRegExp(string) {
	  string = toString_1(string);
	  return (string && reHasRegExpChar.test(string))
	    ? string.replace(reRegExpChar$1, '\\$&')
	    : string;
	}

	var escapeRegExp_1 = escapeRegExp;

	var Tokenizer_1 = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;



	var _isEmpty2 = _interopRequireDefault(isEmpty_1);



	var _escapeRegExp2 = _interopRequireDefault(escapeRegExp_1);



	var _tokenTypes2 = _interopRequireDefault(tokenTypes);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Tokenizer = function () {
	    /**
	     * @param {Object} cfg
	     *  @param {String[]} cfg.reservedWords Reserved words in SQL
	     *  @param {String[]} cfg.reservedToplevelWords Words that are set to new line separately
	     *  @param {String[]} cfg.reservedNewlineWords Words that are set to newline
	     *  @param {String[]} cfg.stringTypes String types to enable: "", '', ``, [], N''
	     *  @param {String[]} cfg.openParens Opening parentheses to enable, like (, [
	     *  @param {String[]} cfg.closeParens Closing parentheses to enable, like ), ]
	     *  @param {String[]} cfg.indexedPlaceholderTypes Prefixes for indexed placeholders, like ?
	     *  @param {String[]} cfg.namedPlaceholderTypes Prefixes for named placeholders, like @ and :
	     *  @param {String[]} cfg.lineCommentTypes Line comments to enable, like # and --
	     *  @param {String[]} cfg.specialWordChars Special chars that can be found inside of words, like @ and #
	     */
	    function Tokenizer(cfg) {
	        _classCallCheck(this, Tokenizer);

	        this.WHITESPACE_REGEX = /^(\s+)/;
	        this.NUMBER_REGEX = /^((-\s*)?[0-9]+(\.[0-9]+)?|0x[0-9a-fA-F]+|0b[01]+)\b/;
	        this.OPERATOR_REGEX = /^(!=|<>|==|<=|>=|!<|!>|\|\||::|->>|->|~~\*|~~|!~~\*|!~~|~\*|!~\*|!~|.)/;

	        this.BLOCK_COMMENT_REGEX = /^(\/\*[^]*?(?:\*\/|$))/;
	        this.LINE_COMMENT_REGEX = this.createLineCommentRegex(cfg.lineCommentTypes);

	        this.RESERVED_TOPLEVEL_REGEX = this.createReservedWordRegex(cfg.reservedToplevelWords);
	        this.RESERVED_NEWLINE_REGEX = this.createReservedWordRegex(cfg.reservedNewlineWords);
	        this.RESERVED_PLAIN_REGEX = this.createReservedWordRegex(cfg.reservedWords);

	        this.WORD_REGEX = this.createWordRegex(cfg.specialWordChars);
	        this.STRING_REGEX = this.createStringRegex(cfg.stringTypes);

	        this.OPEN_PAREN_REGEX = this.createParenRegex(cfg.openParens);
	        this.CLOSE_PAREN_REGEX = this.createParenRegex(cfg.closeParens);

	        this.INDEXED_PLACEHOLDER_REGEX = this.createPlaceholderRegex(cfg.indexedPlaceholderTypes, "[0-9]*");
	        this.IDENT_NAMED_PLACEHOLDER_REGEX = this.createPlaceholderRegex(cfg.namedPlaceholderTypes, "[a-zA-Z0-9._$]+");
	        this.STRING_NAMED_PLACEHOLDER_REGEX = this.createPlaceholderRegex(cfg.namedPlaceholderTypes, this.createStringPattern(cfg.stringTypes));
	    }

	    Tokenizer.prototype.createLineCommentRegex = function createLineCommentRegex(lineCommentTypes) {
	        return new RegExp("^((?:" + lineCommentTypes.map(function (c) {
	            return (0, _escapeRegExp2["default"])(c);
	        }).join("|") + ").*?(?:\n|$))");
	    };

	    Tokenizer.prototype.createReservedWordRegex = function createReservedWordRegex(reservedWords) {
	        var reservedWordsPattern = reservedWords.join("|").replace(/ /g, "\\s+");
	        return new RegExp("^(" + reservedWordsPattern + ")\\b", "i");
	    };

	    Tokenizer.prototype.createWordRegex = function createWordRegex() {
	        var specialChars = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

	        return new RegExp("^([\\w" + specialChars.join("") + "]+)");
	    };

	    Tokenizer.prototype.createStringRegex = function createStringRegex(stringTypes) {
	        return new RegExp("^(" + this.createStringPattern(stringTypes) + ")");
	    };

	    // This enables the following string patterns:
	    // 1. backtick quoted string using `` to escape
	    // 2. square bracket quoted string (SQL Server) using ]] to escape
	    // 3. double quoted string using "" or \" to escape
	    // 4. single quoted string using '' or \' to escape
	    // 5. national character quoted string using N'' or N\' to escape


	    Tokenizer.prototype.createStringPattern = function createStringPattern(stringTypes) {
	        var patterns = {
	            "``": "((`[^`]*($|`))+)",
	            "[]": "((\\[[^\\]]*($|\\]))(\\][^\\]]*($|\\]))*)",
	            "\"\"": "((\"[^\"\\\\]*(?:\\\\.[^\"\\\\]*)*(\"|$))+)",
	            "''": "(('[^'\\\\]*(?:\\\\.[^'\\\\]*)*('|$))+)",
	            "N''": "((N'[^N'\\\\]*(?:\\\\.[^N'\\\\]*)*('|$))+)"
	        };

	        return stringTypes.map(function (t) {
	            return patterns[t];
	        }).join("|");
	    };

	    Tokenizer.prototype.createParenRegex = function createParenRegex(parens) {
	        var _this = this;

	        return new RegExp("^(" + parens.map(function (p) {
	            return _this.escapeParen(p);
	        }).join("|") + ")", "i");
	    };

	    Tokenizer.prototype.escapeParen = function escapeParen(paren) {
	        if (paren.length === 1) {
	            // A single punctuation character
	            return (0, _escapeRegExp2["default"])(paren);
	        } else {
	            // longer word
	            return "\\b" + paren + "\\b";
	        }
	    };

	    Tokenizer.prototype.createPlaceholderRegex = function createPlaceholderRegex(types, pattern) {
	        if ((0, _isEmpty2["default"])(types)) {
	            return false;
	        }
	        var typesRegex = types.map(_escapeRegExp2["default"]).join("|");

	        return new RegExp("^((?:" + typesRegex + ")(?:" + pattern + "))");
	    };

	    /**
	     * Takes a SQL string and breaks it into tokens.
	     * Each token is an object with type and value.
	     *
	     * @param {String} input The SQL string
	     * @return {Object[]} tokens An array of tokens.
	     *  @return {String} token.type
	     *  @return {String} token.value
	     */


	    Tokenizer.prototype.tokenize = function tokenize(input) {
	        var tokens = [];
	        var token = void 0;

	        // Keep processing the string until it is empty
	        while (input.length) {
	            // Get the next token and the token type
	            token = this.getNextToken(input, token);
	            // Advance the string
	            input = input.substring(token.value.length);

	            tokens.push(token);
	        }
	        return tokens;
	    };

	    Tokenizer.prototype.getNextToken = function getNextToken(input, previousToken) {
	        return this.getWhitespaceToken(input) || this.getCommentToken(input) || this.getStringToken(input) || this.getOpenParenToken(input) || this.getCloseParenToken(input) || this.getPlaceholderToken(input) || this.getNumberToken(input) || this.getReservedWordToken(input, previousToken) || this.getWordToken(input) || this.getOperatorToken(input);
	    };

	    Tokenizer.prototype.getWhitespaceToken = function getWhitespaceToken(input) {
	        return this.getTokenOnFirstMatch({
	            input: input,
	            type: _tokenTypes2["default"].WHITESPACE,
	            regex: this.WHITESPACE_REGEX
	        });
	    };

	    Tokenizer.prototype.getCommentToken = function getCommentToken(input) {
	        return this.getLineCommentToken(input) || this.getBlockCommentToken(input);
	    };

	    Tokenizer.prototype.getLineCommentToken = function getLineCommentToken(input) {
	        return this.getTokenOnFirstMatch({
	            input: input,
	            type: _tokenTypes2["default"].LINE_COMMENT,
	            regex: this.LINE_COMMENT_REGEX
	        });
	    };

	    Tokenizer.prototype.getBlockCommentToken = function getBlockCommentToken(input) {
	        return this.getTokenOnFirstMatch({
	            input: input,
	            type: _tokenTypes2["default"].BLOCK_COMMENT,
	            regex: this.BLOCK_COMMENT_REGEX
	        });
	    };

	    Tokenizer.prototype.getStringToken = function getStringToken(input) {
	        return this.getTokenOnFirstMatch({
	            input: input,
	            type: _tokenTypes2["default"].STRING,
	            regex: this.STRING_REGEX
	        });
	    };

	    Tokenizer.prototype.getOpenParenToken = function getOpenParenToken(input) {
	        return this.getTokenOnFirstMatch({
	            input: input,
	            type: _tokenTypes2["default"].OPEN_PAREN,
	            regex: this.OPEN_PAREN_REGEX
	        });
	    };

	    Tokenizer.prototype.getCloseParenToken = function getCloseParenToken(input) {
	        return this.getTokenOnFirstMatch({
	            input: input,
	            type: _tokenTypes2["default"].CLOSE_PAREN,
	            regex: this.CLOSE_PAREN_REGEX
	        });
	    };

	    Tokenizer.prototype.getPlaceholderToken = function getPlaceholderToken(input) {
	        return this.getIdentNamedPlaceholderToken(input) || this.getStringNamedPlaceholderToken(input) || this.getIndexedPlaceholderToken(input);
	    };

	    Tokenizer.prototype.getIdentNamedPlaceholderToken = function getIdentNamedPlaceholderToken(input) {
	        return this.getPlaceholderTokenWithKey({
	            input: input,
	            regex: this.IDENT_NAMED_PLACEHOLDER_REGEX,
	            parseKey: function parseKey(v) {
	                return v.slice(1);
	            }
	        });
	    };

	    Tokenizer.prototype.getStringNamedPlaceholderToken = function getStringNamedPlaceholderToken(input) {
	        var _this2 = this;

	        return this.getPlaceholderTokenWithKey({
	            input: input,
	            regex: this.STRING_NAMED_PLACEHOLDER_REGEX,
	            parseKey: function parseKey(v) {
	                return _this2.getEscapedPlaceholderKey({ key: v.slice(2, -1), quoteChar: v.slice(-1) });
	            }
	        });
	    };

	    Tokenizer.prototype.getIndexedPlaceholderToken = function getIndexedPlaceholderToken(input) {
	        return this.getPlaceholderTokenWithKey({
	            input: input,
	            regex: this.INDEXED_PLACEHOLDER_REGEX,
	            parseKey: function parseKey(v) {
	                return v.slice(1);
	            }
	        });
	    };

	    Tokenizer.prototype.getPlaceholderTokenWithKey = function getPlaceholderTokenWithKey(_ref) {
	        var input = _ref.input,
	            regex = _ref.regex,
	            parseKey = _ref.parseKey;

	        var token = this.getTokenOnFirstMatch({ input: input, regex: regex, type: _tokenTypes2["default"].PLACEHOLDER });
	        if (token) {
	            token.key = parseKey(token.value);
	        }
	        return token;
	    };

	    Tokenizer.prototype.getEscapedPlaceholderKey = function getEscapedPlaceholderKey(_ref2) {
	        var key = _ref2.key,
	            quoteChar = _ref2.quoteChar;

	        return key.replace(new RegExp((0, _escapeRegExp2["default"])("\\") + quoteChar, "g"), quoteChar);
	    };

	    // Decimal, binary, or hex numbers


	    Tokenizer.prototype.getNumberToken = function getNumberToken(input) {
	        return this.getTokenOnFirstMatch({
	            input: input,
	            type: _tokenTypes2["default"].NUMBER,
	            regex: this.NUMBER_REGEX
	        });
	    };

	    // Punctuation and symbols


	    Tokenizer.prototype.getOperatorToken = function getOperatorToken(input) {
	        return this.getTokenOnFirstMatch({
	            input: input,
	            type: _tokenTypes2["default"].OPERATOR,
	            regex: this.OPERATOR_REGEX
	        });
	    };

	    Tokenizer.prototype.getReservedWordToken = function getReservedWordToken(input, previousToken) {
	        // A reserved word cannot be preceded by a "."
	        // this makes it so in "mytable.from", "from" is not considered a reserved word
	        if (previousToken && previousToken.value && previousToken.value === ".") {
	            return;
	        }
	        return this.getToplevelReservedToken(input) || this.getNewlineReservedToken(input) || this.getPlainReservedToken(input);
	    };

	    Tokenizer.prototype.getToplevelReservedToken = function getToplevelReservedToken(input) {
	        return this.getTokenOnFirstMatch({
	            input: input,
	            type: _tokenTypes2["default"].RESERVED_TOPLEVEL,
	            regex: this.RESERVED_TOPLEVEL_REGEX
	        });
	    };

	    Tokenizer.prototype.getNewlineReservedToken = function getNewlineReservedToken(input) {
	        return this.getTokenOnFirstMatch({
	            input: input,
	            type: _tokenTypes2["default"].RESERVED_NEWLINE,
	            regex: this.RESERVED_NEWLINE_REGEX
	        });
	    };

	    Tokenizer.prototype.getPlainReservedToken = function getPlainReservedToken(input) {
	        return this.getTokenOnFirstMatch({
	            input: input,
	            type: _tokenTypes2["default"].RESERVED,
	            regex: this.RESERVED_PLAIN_REGEX
	        });
	    };

	    Tokenizer.prototype.getWordToken = function getWordToken(input) {
	        return this.getTokenOnFirstMatch({
	            input: input,
	            type: _tokenTypes2["default"].WORD,
	            regex: this.WORD_REGEX
	        });
	    };

	    Tokenizer.prototype.getTokenOnFirstMatch = function getTokenOnFirstMatch(_ref3) {
	        var input = _ref3.input,
	            type = _ref3.type,
	            regex = _ref3.regex;

	        var matches = input.match(regex);

	        if (matches) {
	            return { type: type, value: matches[1] };
	        }
	    };

	    return Tokenizer;
	}();

	exports["default"] = Tokenizer;
	module.exports = exports["default"];
	});

	var Db2Formatter_1 = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;



	var _Formatter2 = _interopRequireDefault(Formatter_1);



	var _Tokenizer2 = _interopRequireDefault(Tokenizer_1);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var reservedWords = ["ABS", "ACTIVATE", "ALIAS", "ALL", "ALLOCATE", "ALLOW", "ALTER", "ANY", "ARE", "ARRAY", "AS", "ASC", "ASENSITIVE", "ASSOCIATE", "ASUTIME", "ASYMMETRIC", "AT", "ATOMIC", "ATTRIBUTES", "AUDIT", "AUTHORIZATION", "AUX", "AUXILIARY", "AVG", "BEFORE", "BEGIN", "BETWEEN", "BIGINT", "BINARY", "BLOB", "BOOLEAN", "BOTH", "BUFFERPOOL", "BY", "CACHE", "CALL", "CALLED", "CAPTURE", "CARDINALITY", "CASCADED", "CASE", "CAST", "CCSID", "CEIL", "CEILING", "CHAR", "CHARACTER", "CHARACTER_LENGTH", "CHAR_LENGTH", "CHECK", "CLOB", "CLONE", "CLOSE", "CLUSTER", "COALESCE", "COLLATE", "COLLECT", "COLLECTION", "COLLID", "COLUMN", "COMMENT", "COMMIT", "CONCAT", "CONDITION", "CONNECT", "CONNECTION", "CONSTRAINT", "CONTAINS", "CONTINUE", "CONVERT", "CORR", "CORRESPONDING", "COUNT", "COUNT_BIG", "COVAR_POP", "COVAR_SAMP", "CREATE", "CROSS", "CUBE", "CUME_DIST", "CURRENT", "CURRENT_DATE", "CURRENT_DEFAULT_TRANSFORM_GROUP", "CURRENT_LC_CTYPE", "CURRENT_PATH", "CURRENT_ROLE", "CURRENT_SCHEMA", "CURRENT_SERVER", "CURRENT_TIME", "CURRENT_TIMESTAMP", "CURRENT_TIMEZONE", "CURRENT_TRANSFORM_GROUP_FOR_TYPE", "CURRENT_USER", "CURSOR", "CYCLE", "DATA", "DATABASE", "DATAPARTITIONNAME", "DATAPARTITIONNUM", "DATE", "DAY", "DAYS", "DB2GENERAL", "DB2GENRL", "DB2SQL", "DBINFO", "DBPARTITIONNAME", "DBPARTITIONNUM", "DEALLOCATE", "DEC", "DECIMAL", "DECLARE", "DEFAULT", "DEFAULTS", "DEFINITION", "DELETE", "DENSERANK", "DENSE_RANK", "DEREF", "DESCRIBE", "DESCRIPTOR", "DETERMINISTIC", "DIAGNOSTICS", "DISABLE", "DISALLOW", "DISCONNECT", "DISTINCT", "DO", "DOCUMENT", "DOUBLE", "DROP", "DSSIZE", "DYNAMIC", "EACH", "EDITPROC", "ELEMENT", "ELSE", "ELSEIF", "ENABLE", "ENCODING", "ENCRYPTION", "END", "END-EXEC", "ENDING", "ERASE", "ESCAPE", "EVERY", "EXCEPTION", "EXCLUDING", "EXCLUSIVE", "EXEC", "EXECUTE", "EXISTS", "EXIT", "EXP", "EXPLAIN", "EXTENDED", "EXTERNAL", "EXTRACT", "FALSE", "FENCED", "FETCH", "FIELDPROC", "FILE", "FILTER", "FINAL", "FIRST", "FLOAT", "FLOOR", "FOR", "FOREIGN", "FREE", "FULL", "FUNCTION", "FUSION", "GENERAL", "GENERATED", "GET", "GLOBAL", "GOTO", "GRANT", "GRAPHIC", "GROUP", "GROUPING", "HANDLER", "HASH", "HASHED_VALUE", "HINT", "HOLD", "HOUR", "HOURS", "IDENTITY", "IF", "IMMEDIATE", "IN", "INCLUDING", "INCLUSIVE", "INCREMENT", "INDEX", "INDICATOR", "INDICATORS", "INF", "INFINITY", "INHERIT", "INNER", "INOUT", "INSENSITIVE", "INSERT", "INT", "INTEGER", "INTEGRITY", "INTERSECTION", "INTERVAL", "INTO", "IS", "ISOBID", "ISOLATION", "ITERATE", "JAR", "JAVA", "KEEP", "KEY", "LABEL", "LANGUAGE", "LARGE", "LATERAL", "LC_CTYPE", "LEADING", "LEAVE", "LEFT", "LIKE", "LINKTYPE", "LN", "LOCAL", "LOCALDATE", "LOCALE", "LOCALTIME", "LOCALTIMESTAMP", "LOCATOR", "LOCATORS", "LOCK", "LOCKMAX", "LOCKSIZE", "LONG", "LOOP", "LOWER", "MAINTAINED", "MATCH", "MATERIALIZED", "MAX", "MAXVALUE", "MEMBER", "MERGE", "METHOD", "MICROSECOND", "MICROSECONDS", "MIN", "MINUTE", "MINUTES", "MINVALUE", "MOD", "MODE", "MODIFIES", "MODULE", "MONTH", "MONTHS", "MULTISET", "NAN", "NATIONAL", "NATURAL", "NCHAR", "NCLOB", "NEW", "NEW_TABLE", "NEXTVAL", "NO", "NOCACHE", "NOCYCLE", "NODENAME", "NODENUMBER", "NOMAXVALUE", "NOMINVALUE", "NONE", "NOORDER", "NORMALIZE", "NORMALIZED", "NOT", "NULL", "NULLIF", "NULLS", "NUMERIC", "NUMPARTS", "OBID", "OCTET_LENGTH", "OF", "OFFSET", "OLD", "OLD_TABLE", "ON", "ONLY", "OPEN", "OPTIMIZATION", "OPTIMIZE", "OPTION", "ORDER", "OUT", "OUTER", "OVER", "OVERLAPS", "OVERLAY", "OVERRIDING", "PACKAGE", "PADDED", "PAGESIZE", "PARAMETER", "PART", "PARTITION", "PARTITIONED", "PARTITIONING", "PARTITIONS", "PASSWORD", "PATH", "PERCENTILE_CONT", "PERCENTILE_DISC", "PERCENT_RANK", "PIECESIZE", "PLAN", "POSITION", "POWER", "PRECISION", "PREPARE", "PREVVAL", "PRIMARY", "PRIQTY", "PRIVILEGES", "PROCEDURE", "PROGRAM", "PSID", "PUBLIC", "QUERY", "QUERYNO", "RANGE", "RANK", "READ", "READS", "REAL", "RECOVERY", "RECURSIVE", "REF", "REFERENCES", "REFERENCING", "REFRESH", "REGR_AVGX", "REGR_AVGY", "REGR_COUNT", "REGR_INTERCEPT", "REGR_R2", "REGR_SLOPE", "REGR_SXX", "REGR_SXY", "REGR_SYY", "RELEASE", "RENAME", "REPEAT", "RESET", "RESIGNAL", "RESTART", "RESTRICT", "RESULT", "RESULT_SET_LOCATOR", "RETURN", "RETURNS", "REVOKE", "RIGHT", "ROLE", "ROLLBACK", "ROLLUP", "ROUND_CEILING", "ROUND_DOWN", "ROUND_FLOOR", "ROUND_HALF_DOWN", "ROUND_HALF_EVEN", "ROUND_HALF_UP", "ROUND_UP", "ROUTINE", "ROW", "ROWNUMBER", "ROWS", "ROWSET", "ROW_NUMBER", "RRN", "RUN", "SAVEPOINT", "SCHEMA", "SCOPE", "SCRATCHPAD", "SCROLL", "SEARCH", "SECOND", "SECONDS", "SECQTY", "SECURITY", "SENSITIVE", "SEQUENCE", "SESSION", "SESSION_USER", "SIGNAL", "SIMILAR", "SIMPLE", "SMALLINT", "SNAN", "SOME", "SOURCE", "SPECIFIC", "SPECIFICTYPE", "SQL", "SQLEXCEPTION", "SQLID", "SQLSTATE", "SQLWARNING", "SQRT", "STACKED", "STANDARD", "START", "STARTING", "STATEMENT", "STATIC", "STATMENT", "STAY", "STDDEV_POP", "STDDEV_SAMP", "STOGROUP", "STORES", "STYLE", "SUBMULTISET", "SUBSTRING", "SUM", "SUMMARY", "SYMMETRIC", "SYNONYM", "SYSFUN", "SYSIBM", "SYSPROC", "SYSTEM", "SYSTEM_USER", "TABLE", "TABLESAMPLE", "TABLESPACE", "THEN", "TIME", "TIMESTAMP", "TIMEZONE_HOUR", "TIMEZONE_MINUTE", "TO", "TRAILING", "TRANSACTION", "TRANSLATE", "TRANSLATION", "TREAT", "TRIGGER", "TRIM", "TRUE", "TRUNCATE", "TYPE", "UESCAPE", "UNDO", "UNIQUE", "UNKNOWN", "UNNEST", "UNTIL", "UPPER", "USAGE", "USER", "USING", "VALIDPROC", "VALUE", "VARCHAR", "VARIABLE", "VARIANT", "VARYING", "VAR_POP", "VAR_SAMP", "VCAT", "VERSION", "VIEW", "VOLATILE", "VOLUMES", "WHEN", "WHENEVER", "WHILE", "WIDTH_BUCKET", "WINDOW", "WITH", "WITHIN", "WITHOUT", "WLM", "WRITE", "XMLELEMENT", "XMLEXISTS", "XMLNAMESPACES", "YEAR", "YEARS"];

	var reservedToplevelWords = ["ADD", "AFTER", "ALTER COLUMN", "ALTER TABLE", "DELETE FROM", "EXCEPT", "FETCH FIRST", "FROM", "GROUP BY", "GO", "HAVING", "INSERT INTO", "INTERSECT", "LIMIT", "ORDER BY", "SELECT", "SET CURRENT SCHEMA", "SET SCHEMA", "SET", "UNION ALL", "UPDATE", "VALUES", "WHERE"];

	var reservedNewlineWords = ["AND", "CROSS JOIN", "INNER JOIN", "JOIN", "LEFT JOIN", "LEFT OUTER JOIN", "OR", "OUTER JOIN", "RIGHT JOIN", "RIGHT OUTER JOIN"];

	var tokenizer = void 0;

	var Db2Formatter = function () {
	    /**
	     * @param {Object} cfg Different set of configurations
	     */
	    function Db2Formatter(cfg) {
	        _classCallCheck(this, Db2Formatter);

	        this.cfg = cfg;
	    }

	    /**
	     * Formats DB2 query to make it easier to read
	     *
	     * @param {String} query The DB2 query string
	     * @return {String} formatted string
	     */


	    Db2Formatter.prototype.format = function format(query) {
	        if (!tokenizer) {
	            tokenizer = new _Tokenizer2["default"]({
	                reservedWords: reservedWords,
	                reservedToplevelWords: reservedToplevelWords,
	                reservedNewlineWords: reservedNewlineWords,
	                stringTypes: ["\"\"", "''", "``", "[]"],
	                openParens: ["("],
	                closeParens: [")"],
	                indexedPlaceholderTypes: ["?"],
	                namedPlaceholderTypes: [":"],
	                lineCommentTypes: ["--"],
	                specialWordChars: ["#", "@"]
	            });
	        }
	        return new _Formatter2["default"](this.cfg, tokenizer).format(query);
	    };

	    return Db2Formatter;
	}();

	exports["default"] = Db2Formatter;
	module.exports = exports["default"];
	});

	var N1qlFormatter_1 = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;



	var _Formatter2 = _interopRequireDefault(Formatter_1);



	var _Tokenizer2 = _interopRequireDefault(Tokenizer_1);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var reservedWords = ["ALL", "ALTER", "ANALYZE", "AND", "ANY", "ARRAY", "AS", "ASC", "BEGIN", "BETWEEN", "BINARY", "BOOLEAN", "BREAK", "BUCKET", "BUILD", "BY", "CALL", "CASE", "CAST", "CLUSTER", "COLLATE", "COLLECTION", "COMMIT", "CONNECT", "CONTINUE", "CORRELATE", "COVER", "CREATE", "DATABASE", "DATASET", "DATASTORE", "DECLARE", "DECREMENT", "DELETE", "DERIVED", "DESC", "DESCRIBE", "DISTINCT", "DO", "DROP", "EACH", "ELEMENT", "ELSE", "END", "EVERY", "EXCEPT", "EXCLUDE", "EXECUTE", "EXISTS", "EXPLAIN", "FALSE", "FETCH", "FIRST", "FLATTEN", "FOR", "FORCE", "FROM", "FUNCTION", "GRANT", "GROUP", "GSI", "HAVING", "IF", "IGNORE", "ILIKE", "IN", "INCLUDE", "INCREMENT", "INDEX", "INFER", "INLINE", "INNER", "INSERT", "INTERSECT", "INTO", "IS", "JOIN", "KEY", "KEYS", "KEYSPACE", "KNOWN", "LAST", "LEFT", "LET", "LETTING", "LIKE", "LIMIT", "LSM", "MAP", "MAPPING", "MATCHED", "MATERIALIZED", "MERGE", "MINUS", "MISSING", "NAMESPACE", "NEST", "NOT", "NULL", "NUMBER", "OBJECT", "OFFSET", "ON", "OPTION", "OR", "ORDER", "OUTER", "OVER", "PARSE", "PARTITION", "PASSWORD", "PATH", "POOL", "PREPARE", "PRIMARY", "PRIVATE", "PRIVILEGE", "PROCEDURE", "PUBLIC", "RAW", "REALM", "REDUCE", "RENAME", "RETURN", "RETURNING", "REVOKE", "RIGHT", "ROLE", "ROLLBACK", "SATISFIES", "SCHEMA", "SELECT", "SELF", "SEMI", "SET", "SHOW", "SOME", "START", "STATISTICS", "STRING", "SYSTEM", "THEN", "TO", "TRANSACTION", "TRIGGER", "TRUE", "TRUNCATE", "UNDER", "UNION", "UNIQUE", "UNKNOWN", "UNNEST", "UNSET", "UPDATE", "UPSERT", "USE", "USER", "USING", "VALIDATE", "VALUE", "VALUED", "VALUES", "VIA", "VIEW", "WHEN", "WHERE", "WHILE", "WITH", "WITHIN", "WORK", "XOR"];

	var reservedToplevelWords = ["DELETE FROM", "EXCEPT ALL", "EXCEPT", "EXPLAIN DELETE FROM", "EXPLAIN UPDATE", "EXPLAIN UPSERT", "FROM", "GROUP BY", "HAVING", "INFER", "INSERT INTO", "INTERSECT ALL", "INTERSECT", "LET", "LIMIT", "MERGE", "NEST", "ORDER BY", "PREPARE", "SELECT", "SET CURRENT SCHEMA", "SET SCHEMA", "SET", "UNION ALL", "UNION", "UNNEST", "UPDATE", "UPSERT", "USE KEYS", "VALUES", "WHERE"];

	var reservedNewlineWords = ["AND", "INNER JOIN", "JOIN", "LEFT JOIN", "LEFT OUTER JOIN", "OR", "OUTER JOIN", "RIGHT JOIN", "RIGHT OUTER JOIN", "XOR"];

	var tokenizer = void 0;

	var N1qlFormatter = function () {
	    /**
	     * @param {Object} cfg Different set of configurations
	     */
	    function N1qlFormatter(cfg) {
	        _classCallCheck(this, N1qlFormatter);

	        this.cfg = cfg;
	    }

	    /**
	     * Format the whitespace in a N1QL string to make it easier to read
	     *
	     * @param {String} query The N1QL string
	     * @return {String} formatted string
	     */


	    N1qlFormatter.prototype.format = function format(query) {
	        if (!tokenizer) {
	            tokenizer = new _Tokenizer2["default"]({
	                reservedWords: reservedWords,
	                reservedToplevelWords: reservedToplevelWords,
	                reservedNewlineWords: reservedNewlineWords,
	                stringTypes: ["\"\"", "''", "``"],
	                openParens: ["(", "[", "{"],
	                closeParens: [")", "]", "}"],
	                namedPlaceholderTypes: ["$"],
	                lineCommentTypes: ["#", "--"]
	            });
	        }
	        return new _Formatter2["default"](this.cfg, tokenizer).format(query);
	    };

	    return N1qlFormatter;
	}();

	exports["default"] = N1qlFormatter;
	module.exports = exports["default"];
	});

	var PlSqlFormatter_1 = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;



	var _Formatter2 = _interopRequireDefault(Formatter_1);



	var _Tokenizer2 = _interopRequireDefault(Tokenizer_1);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var reservedWords = ["A", "ACCESSIBLE", "AGENT", "AGGREGATE", "ALL", "ALTER", "ANY", "ARRAY", "AS", "ASC", "AT", "ATTRIBUTE", "AUTHID", "AVG", "BETWEEN", "BFILE_BASE", "BINARY_INTEGER", "BINARY", "BLOB_BASE", "BLOCK", "BODY", "BOOLEAN", "BOTH", "BOUND", "BULK", "BY", "BYTE", "C", "CALL", "CALLING", "CASCADE", "CASE", "CHAR_BASE", "CHAR", "CHARACTER", "CHARSET", "CHARSETFORM", "CHARSETID", "CHECK", "CLOB_BASE", "CLONE", "CLOSE", "CLUSTER", "CLUSTERS", "COALESCE", "COLAUTH", "COLLECT", "COLUMNS", "COMMENT", "COMMIT", "COMMITTED", "COMPILED", "COMPRESS", "CONNECT", "CONSTANT", "CONSTRUCTOR", "CONTEXT", "CONTINUE", "CONVERT", "COUNT", "CRASH", "CREATE", "CREDENTIAL", "CURRENT", "CURRVAL", "CURSOR", "CUSTOMDATUM", "DANGLING", "DATA", "DATE_BASE", "DATE", "DAY", "DECIMAL", "DEFAULT", "DEFINE", "DELETE", "DESC", "DETERMINISTIC", "DIRECTORY", "DISTINCT", "DO", "DOUBLE", "DROP", "DURATION", "ELEMENT", "ELSIF", "EMPTY", "ESCAPE", "EXCEPTIONS", "EXCLUSIVE", "EXECUTE", "EXISTS", "EXIT", "EXTENDS", "EXTERNAL", "EXTRACT", "FALSE", "FETCH", "FINAL", "FIRST", "FIXED", "FLOAT", "FOR", "FORALL", "FORCE", "FROM", "FUNCTION", "GENERAL", "GOTO", "GRANT", "GROUP", "HASH", "HEAP", "HIDDEN", "HOUR", "IDENTIFIED", "IF", "IMMEDIATE", "IN", "INCLUDING", "INDEX", "INDEXES", "INDICATOR", "INDICES", "INFINITE", "INSTANTIABLE", "INT", "INTEGER", "INTERFACE", "INTERVAL", "INTO", "INVALIDATE", "IS", "ISOLATION", "JAVA", "LANGUAGE", "LARGE", "LEADING", "LENGTH", "LEVEL", "LIBRARY", "LIKE", "LIKE2", "LIKE4", "LIKEC", "LIMITED", "LOCAL", "LOCK", "LONG", "MAP", "MAX", "MAXLEN", "MEMBER", "MERGE", "MIN", "MINUS", "MINUTE", "MLSLABEL", "MOD", "MODE", "MONTH", "MULTISET", "NAME", "NAN", "NATIONAL", "NATIVE", "NATURAL", "NATURALN", "NCHAR", "NEW", "NEXTVAL", "NOCOMPRESS", "NOCOPY", "NOT", "NOWAIT", "NULL", "NULLIF", "NUMBER_BASE", "NUMBER", "OBJECT", "OCICOLL", "OCIDATE", "OCIDATETIME", "OCIDURATION", "OCIINTERVAL", "OCILOBLOCATOR", "OCINUMBER", "OCIRAW", "OCIREF", "OCIREFCURSOR", "OCIROWID", "OCISTRING", "OCITYPE", "OF", "OLD", "ON", "ONLY", "OPAQUE", "OPEN", "OPERATOR", "OPTION", "ORACLE", "ORADATA", "ORDER", "ORGANIZATION", "ORLANY", "ORLVARY", "OTHERS", "OUT", "OVERLAPS", "OVERRIDING", "PACKAGE", "PARALLEL_ENABLE", "PARAMETER", "PARAMETERS", "PARENT", "PARTITION", "PASCAL", "PCTFREE", "PIPE", "PIPELINED", "PLS_INTEGER", "PLUGGABLE", "POSITIVE", "POSITIVEN", "PRAGMA", "PRECISION", "PRIOR", "PRIVATE", "PROCEDURE", "PUBLIC", "RAISE", "RANGE", "RAW", "READ", "REAL", "RECORD", "REF", "REFERENCE", "RELEASE", "RELIES_ON", "REM", "REMAINDER", "RENAME", "RESOURCE", "RESULT_CACHE", "RESULT", "RETURN", "RETURNING", "REVERSE", "REVOKE", "ROLLBACK", "ROW", "ROWID", "ROWNUM", "ROWTYPE", "SAMPLE", "SAVE", "SAVEPOINT", "SB1", "SB2", "SB4", "SECOND", "SEGMENT", "SELF", "SEPARATE", "SEQUENCE", "SERIALIZABLE", "SHARE", "SHORT", "SIZE_T", "SIZE", "SMALLINT", "SOME", "SPACE", "SPARSE", "SQL", "SQLCODE", "SQLDATA", "SQLERRM", "SQLNAME", "SQLSTATE", "STANDARD", "START", "STATIC", "STDDEV", "STORED", "STRING", "STRUCT", "STYLE", "SUBMULTISET", "SUBPARTITION", "SUBSTITUTABLE", "SUBTYPE", "SUCCESSFUL", "SUM", "SYNONYM", "SYSDATE", "TABAUTH", "TABLE", "TDO", "THE", "THEN", "TIME", "TIMESTAMP", "TIMEZONE_ABBR", "TIMEZONE_HOUR", "TIMEZONE_MINUTE", "TIMEZONE_REGION", "TO", "TRAILING", "TRANSACTION", "TRANSACTIONAL", "TRIGGER", "TRUE", "TRUSTED", "TYPE", "UB1", "UB2", "UB4", "UID", "UNDER", "UNIQUE", "UNPLUG", "UNSIGNED", "UNTRUSTED", "USE", "USER", "USING", "VALIDATE", "VALIST", "VALUE", "VARCHAR", "VARCHAR2", "VARIABLE", "VARIANCE", "VARRAY", "VARYING", "VIEW", "VIEWS", "VOID", "WHENEVER", "WHILE", "WITH", "WORK", "WRAPPED", "WRITE", "YEAR", "ZONE"];

	var reservedToplevelWords = ["ADD", "ALTER COLUMN", "ALTER TABLE", "BEGIN", "CONNECT BY", "DECLARE", "DELETE FROM", "DELETE", "END", "EXCEPT", "EXCEPTION", "FETCH FIRST", "FROM", "GROUP BY", "HAVING", "INSERT INTO", "INSERT", "INTERSECT", "LIMIT", "LOOP", "MODIFY", "ORDER BY", "SELECT", "SET CURRENT SCHEMA", "SET SCHEMA", "SET", "START WITH", "UNION ALL", "UNION", "UPDATE", "VALUES", "WHERE"];

	var reservedNewlineWords = ["AND", "CROSS APPLY", "CROSS JOIN", "ELSE", "END", "INNER JOIN", "JOIN", "LEFT JOIN", "LEFT OUTER JOIN", "OR", "OUTER APPLY", "OUTER JOIN", "RIGHT JOIN", "RIGHT OUTER JOIN", "WHEN", "XOR"];

	var tokenizer = void 0;

	var PlSqlFormatter = function () {
	    /**
	     * @param {Object} cfg Different set of configurations
	     */
	    function PlSqlFormatter(cfg) {
	        _classCallCheck(this, PlSqlFormatter);

	        this.cfg = cfg;
	    }

	    /**
	     * Format the whitespace in a PL/SQL string to make it easier to read
	     *
	     * @param {String} query The PL/SQL string
	     * @return {String} formatted string
	     */


	    PlSqlFormatter.prototype.format = function format(query) {
	        if (!tokenizer) {
	            tokenizer = new _Tokenizer2["default"]({
	                reservedWords: reservedWords,
	                reservedToplevelWords: reservedToplevelWords,
	                reservedNewlineWords: reservedNewlineWords,
	                stringTypes: ["\"\"", "N''", "''", "``"],
	                openParens: ["(", "CASE"],
	                closeParens: [")", "END"],
	                indexedPlaceholderTypes: ["?"],
	                namedPlaceholderTypes: [":"],
	                lineCommentTypes: ["--"],
	                specialWordChars: ["_", "$", "#", ".", "@"]
	            });
	        }
	        return new _Formatter2["default"](this.cfg, tokenizer).format(query);
	    };

	    return PlSqlFormatter;
	}();

	exports["default"] = PlSqlFormatter;
	module.exports = exports["default"];
	});

	var StandardSqlFormatter_1 = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;



	var _Formatter2 = _interopRequireDefault(Formatter_1);



	var _Tokenizer2 = _interopRequireDefault(Tokenizer_1);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var reservedWords = ["ACCESSIBLE", "ACTION", "AGAINST", "AGGREGATE", "ALGORITHM", "ALL", "ALTER", "ANALYSE", "ANALYZE", "AS", "ASC", "AUTOCOMMIT", "AUTO_INCREMENT", "BACKUP", "BEGIN", "BETWEEN", "BINLOG", "BOTH", "CASCADE", "CASE", "CHANGE", "CHANGED", "CHARACTER SET", "CHARSET", "CHECK", "CHECKSUM", "COLLATE", "COLLATION", "COLUMN", "COLUMNS", "COMMENT", "COMMIT", "COMMITTED", "COMPRESSED", "CONCURRENT", "CONSTRAINT", "CONTAINS", "CONVERT", "CREATE", "CROSS", "CURRENT_TIMESTAMP", "DATABASE", "DATABASES", "DAY", "DAY_HOUR", "DAY_MINUTE", "DAY_SECOND", "DEFAULT", "DEFINER", "DELAYED", "DELETE", "DESC", "DESCRIBE", "DETERMINISTIC", "DISTINCT", "DISTINCTROW", "DIV", "DO", "DROP", "DUMPFILE", "DUPLICATE", "DYNAMIC", "ELSE", "ENCLOSED", "END", "ENGINE", "ENGINES", "ENGINE_TYPE", "ESCAPE", "ESCAPED", "EVENTS", "EXEC", "EXECUTE", "EXISTS", "EXPLAIN", "EXTENDED", "FAST", "FETCH", "FIELDS", "FILE", "FIRST", "FIXED", "FLUSH", "FOR", "FORCE", "FOREIGN", "FULL", "FULLTEXT", "FUNCTION", "GLOBAL", "GRANT", "GRANTS", "GROUP_CONCAT", "HEAP", "HIGH_PRIORITY", "HOSTS", "HOUR", "HOUR_MINUTE", "HOUR_SECOND", "IDENTIFIED", "IF", "IFNULL", "IGNORE", "IN", "INDEX", "INDEXES", "INFILE", "INSERT", "INSERT_ID", "INSERT_METHOD", "INTERVAL", "INTO", "INVOKER", "IS", "ISOLATION", "KEY", "KEYS", "KILL", "LAST_INSERT_ID", "LEADING", "LEVEL", "LIKE", "LINEAR", "LINES", "LOAD", "LOCAL", "LOCK", "LOCKS", "LOGS", "LOW_PRIORITY", "MARIA", "MASTER", "MASTER_CONNECT_RETRY", "MASTER_HOST", "MASTER_LOG_FILE", "MATCH", "MAX_CONNECTIONS_PER_HOUR", "MAX_QUERIES_PER_HOUR", "MAX_ROWS", "MAX_UPDATES_PER_HOUR", "MAX_USER_CONNECTIONS", "MEDIUM", "MERGE", "MINUTE", "MINUTE_SECOND", "MIN_ROWS", "MODE", "MODIFY", "MONTH", "MRG_MYISAM", "MYISAM", "NAMES", "NATURAL", "NOT", "NOW()", "NULL", "OFFSET", "ON DELETE", "ON UPDATE", "ON", "ONLY", "OPEN", "OPTIMIZE", "OPTION", "OPTIONALLY", "OUTFILE", "PACK_KEYS", "PAGE", "PARTIAL", "PARTITION", "PARTITIONS", "PASSWORD", "PRIMARY", "PRIVILEGES", "PROCEDURE", "PROCESS", "PROCESSLIST", "PURGE", "QUICK", "RAID0", "RAID_CHUNKS", "RAID_CHUNKSIZE", "RAID_TYPE", "RANGE", "READ", "READ_ONLY", "READ_WRITE", "REFERENCES", "REGEXP", "RELOAD", "RENAME", "REPAIR", "REPEATABLE", "REPLACE", "REPLICATION", "RESET", "RESTORE", "RESTRICT", "RETURN", "RETURNS", "REVOKE", "RLIKE", "ROLLBACK", "ROW", "ROWS", "ROW_FORMAT", "SECOND", "SECURITY", "SEPARATOR", "SERIALIZABLE", "SESSION", "SHARE", "SHOW", "SHUTDOWN", "SLAVE", "SONAME", "SOUNDS", "SQL", "SQL_AUTO_IS_NULL", "SQL_BIG_RESULT", "SQL_BIG_SELECTS", "SQL_BIG_TABLES", "SQL_BUFFER_RESULT", "SQL_CACHE", "SQL_CALC_FOUND_ROWS", "SQL_LOG_BIN", "SQL_LOG_OFF", "SQL_LOG_UPDATE", "SQL_LOW_PRIORITY_UPDATES", "SQL_MAX_JOIN_SIZE", "SQL_NO_CACHE", "SQL_QUOTE_SHOW_CREATE", "SQL_SAFE_UPDATES", "SQL_SELECT_LIMIT", "SQL_SLAVE_SKIP_COUNTER", "SQL_SMALL_RESULT", "SQL_WARNINGS", "START", "STARTING", "STATUS", "STOP", "STORAGE", "STRAIGHT_JOIN", "STRING", "STRIPED", "SUPER", "TABLE", "TABLES", "TEMPORARY", "TERMINATED", "THEN", "TO", "TRAILING", "TRANSACTIONAL", "TRUE", "TRUNCATE", "TYPE", "TYPES", "UNCOMMITTED", "UNIQUE", "UNLOCK", "UNSIGNED", "USAGE", "USE", "USING", "VARIABLES", "VIEW", "WHEN", "WITH", "WORK", "WRITE", "YEAR_MONTH"];

	var reservedToplevelWords = ["ADD", "AFTER", "ALTER COLUMN", "ALTER TABLE", "DELETE FROM", "EXCEPT", "FETCH FIRST", "FROM", "GROUP BY", "GO", "HAVING", "INSERT INTO", "INSERT", "INTERSECT", "LIMIT", "MODIFY", "ORDER BY", "SELECT", "SET CURRENT SCHEMA", "SET SCHEMA", "SET", "UNION ALL", "UNION", "UPDATE", "VALUES", "WHERE"];

	var reservedNewlineWords = ["AND", "CROSS APPLY", "CROSS JOIN", "ELSE", "INNER JOIN", "JOIN", "LEFT JOIN", "LEFT OUTER JOIN", "OR", "OUTER APPLY", "OUTER JOIN", "RIGHT JOIN", "RIGHT OUTER JOIN", "WHEN", "XOR"];

	var tokenizer = void 0;

	var StandardSqlFormatter = function () {
	    /**
	     * @param {Object} cfg Different set of configurations
	     */
	    function StandardSqlFormatter(cfg) {
	        _classCallCheck(this, StandardSqlFormatter);

	        this.cfg = cfg;
	    }

	    /**
	     * Format the whitespace in a Standard SQL string to make it easier to read
	     *
	     * @param {String} query The Standard SQL string
	     * @return {String} formatted string
	     */


	    StandardSqlFormatter.prototype.format = function format(query) {
	        if (!tokenizer) {
	            tokenizer = new _Tokenizer2["default"]({
	                reservedWords: reservedWords,
	                reservedToplevelWords: reservedToplevelWords,
	                reservedNewlineWords: reservedNewlineWords,
	                stringTypes: ["\"\"", "N''", "''", "``", "[]"],
	                openParens: ["(", "CASE"],
	                closeParens: [")", "END"],
	                indexedPlaceholderTypes: ["?"],
	                namedPlaceholderTypes: ["@", ":"],
	                lineCommentTypes: ["#", "--"]
	            });
	        }
	        return new _Formatter2["default"](this.cfg, tokenizer).format(query);
	    };

	    return StandardSqlFormatter;
	}();

	exports["default"] = StandardSqlFormatter;
	module.exports = exports["default"];
	});

	var sqlFormatter = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;



	var _Db2Formatter2 = _interopRequireDefault(Db2Formatter_1);



	var _N1qlFormatter2 = _interopRequireDefault(N1qlFormatter_1);



	var _PlSqlFormatter2 = _interopRequireDefault(PlSqlFormatter_1);



	var _StandardSqlFormatter2 = _interopRequireDefault(StandardSqlFormatter_1);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	exports["default"] = {
	    /**
	     * Format whitespaces in a query to make it easier to read.
	     *
	     * @param {String} query
	     * @param {Object} cfg
	     *  @param {String} cfg.language Query language, default is Standard SQL
	     *  @param {String} cfg.indent Characters used for indentation, default is "  " (2 spaces)
	     *  @param {Object} cfg.params Collection of params for placeholder replacement
	     * @return {String}
	     */
	    format: function format(query, cfg) {
	        cfg = cfg || {};

	        switch (cfg.language) {
	            case "db2":
	                return new _Db2Formatter2["default"](cfg).format(query);
	            case "n1ql":
	                return new _N1qlFormatter2["default"](cfg).format(query);
	            case "pl/sql":
	                return new _PlSqlFormatter2["default"](cfg).format(query);
	            case "sql":
	            case undefined:
	                return new _StandardSqlFormatter2["default"](cfg).format(query);
	            default:
	                throw Error("Unsupported SQL dialect: " + cfg.language);
	        }
	    }
	};
	module.exports = exports["default"];
	});

	var sqlFormatter$1 = /*@__PURE__*/getDefaultExportFromCjs(sqlFormatter);

	const NodeType = {
	  Event: 'event',
	  Sql: 'sql',
	  Static: 'static',
	  Nonstatic: 'non-static',
	};

	const formatParameter = (id) => formatIdentifier(id.match(/[^.|:]+$/)[0] || id);
	const formatIdentifier = (id) => tokenizeIdentifier(id).map((t) => capitalizeString(t)).join(' ');
	const hasLink = (map, id) => has.call(map, id);

	function resolveType(strType) {
	  // If you're adding any additional types to this, please consider migrating
	  // this to a map lookup

	  switch (strType) {
	    case 'boolean':
	    case 'TrueClass':
	    case 'FalseClass':
	    case 'java.lang.Boolean': return 'bool';

	    case 'status':
	    case 'byte':
	    case 'short':
	    case 'int':
	    case 'long':
	    case 'Number':
	    case 'Integer':
	    case 'java.lang.Byte':
	    case 'java.lang.Short':
	    case 'java.lang.Integer':
	    case 'java.lang.Long': return 'int';

	    case 'float':
	    case 'double':
	    case 'BigDecimal':
	    case 'Float':
	    case 'java.lang.Float':
	    case 'java.lang.Double': return 'float';

	    case 'mime_type':
	    case 'char':
	    case 'String':
	    case 'java.lang.Char':
	    case 'java.lang.String': return 'string';

	    default: return 'object';
	  }
	}

	function getNodeType(e) {
	  if (has.call(e.input, 'http_server_request')) {
	    return NodeType.Event;
	  }

	  if (has.call(e.input, 'sql_query')) {
	    return NodeType.Sql;
	  }

	  return e.input.static ? NodeType.Static : NodeType.Nonstatic;
	}

	function buildCurveCommands(x1, y1, x2, y2) {
	  const [x, y] = [x1 - x2, y1 - y2];
	  const pathLength = Math.sqrt(x * x + y * y);
	  const curveLength = Math.min(pathLength * 0.5, Math.abs(x));

	  return `M${x1},${y1} C${x1 + curveLength},${y1} ${x2 - curveLength},${y2}, ${x2},${y2}`;
	}

	function getNodeElementPosition(nodeId, selector) {
	  const elem = document.querySelector(`.node[data-node-id='${nodeId}'] ${selector}`);
	  if (!elem) return null;

	  const {
	    offsetLeft,
	    offsetTop,
	    offsetHeight,
	    offsetWidth,
	  } = elem;

	  return {
	    left: offsetLeft,
	    right: offsetLeft + offsetWidth,
	    x: offsetLeft + offsetWidth / 2,
	    y: offsetTop + offsetHeight / 2,
	  };
	}

	function getConnectionPosition(nodeId, type) {
	  return getNodeElementPosition(nodeId, `.connector[data-connection-type="${type}"]`);
	}

	function getPortPosition(nodeId, portId) {
	  return getNodeElementPosition(nodeId, `.item[data-port-id="${portId}"]`);
	}

	function recordScopedObjects(scopeMap, node) {
	  if (!node || !node.behavior) {
	    return;
	  }

	  const outputs = node.behavior.out;
	  outputs.forEach((o) => {
	    if (!o.value || !o.value.object_id) {
	      return;
	    }

	    const objectId = o.value.object_id;
	    if (scopeMap[objectId]) {
	      // do not overwrite existing values
	      return;
	    }

	    scopeMap[objectId] = {
	      nodeId: node.behavior.id,
	      outputId: objectId,
	    };
	  });
	}

	function eventToBehavior(e) {
	  const { input, displayName } = e;

	  const behavior = {
	    id: input.id,
	    event_id: input.id,
	    type: getNodeType(e),
	    name: displayName,
	    in: [],
	    out: [],
	    exceptions: [],
	    x: 0,
	    y: 0,
	  };

	  // Backward cyclic references shall not be enumerable
	  Object.defineProperty(behavior, 'data', {
	    enumerable: false,
	    writable: true,
	  });

	  behavior.data = e;

	  // add a reverse lookup as well
	  e.behavior = behavior;

	  if (behavior.type === NodeType.Sql) {
	    behavior.value = sqlFormatter$1.format(e.input.sql_query.sql);
	  }

	  if (behavior.type === NodeType.Nonstatic) {
	    // display 'self' as an input
	    behavior.in.push({
	      name: formatParameter(input.defined_class),
	      type: resolveType(input.defined_class),
	      value: input.receiver,
	    });
	  }

	  if (has.call(input, 'parameters') && Array.isArray(input.parameters)) {
	    input.parameters.forEach((p) => {
	      behavior.in.push({
	        name: formatIdentifier(p.name),
	        type: resolveType(p.class),
	        value: p,
	      });
	    });
	  }

	  const returnValue = e.output.return_value;
	  if (returnValue && returnValue.value) {
	    const type = resolveType(returnValue.class);
	    let id = type;
	    if (type === 'object') {
	      id = returnValue.class;
	    }

	    behavior.out.push({
	      name: formatParameter(id),
	      type,
	      value: returnValue,
	    });
	  }

	  const { exceptions } = e.output;
	  if (exceptions) {
	    behavior.exceptions = exceptions;
	  }

	  if (has.call(input, 'message')) {
	    input.message.forEach((msg) => {
	      behavior.in.push({
	        name: formatIdentifier(msg.name),
	        type: resolveType(msg.class),
	        value: msg,
	      });
	    });

	    const output = e.output.http_server_response || {};
	    Object.keys(output).forEach((key) => {
	      behavior.out.push({
	        name: formatIdentifier(key),
	        type: resolveType(key),
	        value: {
	          value: output[key],
	        },
	      });
	    });
	  }

	  return behavior;
	}

	function getScopedObjects(behaviorNode) {
	  // objects in scope for this node include:
	  // - the immediate parent
	  // - the immediate parent's siblings with a lower index in the grandparent's children array
	  // - all ancestors
	  const objectsInScope = {};

	  const parent = behaviorNode.data.caller;
	  if (!parent) {
	    return objectsInScope;
	  }
	  recordScopedObjects(objectsInScope, parent);

	  const grandParent = parent.caller;
	  if (!grandParent) {
	    return objectsInScope;
	  }

	  if (!grandParent.caller) {
	    // do not continue to traverse a root node, these siblings _are not_ in scope
	    return objectsInScope;
	  }

	  const parentIndex = grandParent.children.findIndex((e) => e === parent);
	  if (parentIndex > 0) {
	    // iterate in reverse order (right to left) in order to guarantee the most recent output
	    // is used in case of an object id collision. i.e., if two methods return the same object,
	    // we want our 'scoped object' to reflect the latest output.
	    for (let i = parentIndex - 1; i >= 0; i -= 1) {
	      const parentSibling = grandParent.children[i];
	      recordScopedObjects(objectsInScope, parentSibling);
	    }
	  }

	  const ancestors = parent.ancestors();
	  ancestors.forEach((ancestor) => recordScopedObjects(objectsInScope, ancestor));

	  return objectsInScope;
	}

	function transformEvents(rootEvent) {
	  const eventBehaviors = [];
	  const nodeConnections = [];
	  const portConnections = [];

	  // transform raw events to behavior nodes
	  rootEvent.preOrderForEach((e) => {
	    if (!e.input.id) {
	      return;
	    }

	    const behavior = eventToBehavior(e);
	    eventBehaviors.push(behavior);
	  });

	  // link nodes
	  eventBehaviors.forEach((behavior) => {
	    const objectsInScope = getScopedObjects(behavior);
	    behavior.in.forEach((i) => {
	      if (!i.value || !i.value.object_id) {
	        return;
	      }

	      const objectId = i.value.object_id;
	      const outputInfo = objectsInScope[objectId];
	      if (!outputInfo) {
	        return;
	      }

	      portConnections.push({
	        type: i.type,
	        input: {
	          nodeId: behavior.id,
	          portId: objectId,
	        },
	        output: {
	          nodeId: outputInfo.nodeId,
	          portId: outputInfo.outputId,
	        },
	      });
	    });

	    const { caller } = behavior.data;
	    if (!caller || !caller.behavior) {
	      return;
	    }

	    nodeConnections.push({
	      source: caller.behavior.id,
	      target: behavior.id,
	    });
	  });

	  return [nodeConnections, portConnections];
	}

	function displayValue(flowView, port, data, placement) {
	  flowView.valuePopper
	    .text((data && data.value) ? data.value : 'null')
	    .attr('data-show', '')
	    .attr('data-placement', placement)
	    .append('div')
	    .attr('id', 'arrow');

	  const popperElement = flowView.valuePopper.node();
	  const { offsetWidth, offsetHeight } = popperElement;
	  let x = 0;
	  if (placement === 'left') {
	    x = port.offsetLeft - offsetWidth;
	  } else { // right
	    x = port.offsetLeft + port.offsetWidth;
	  }

	  const y = port.offsetTop + (port.offsetHeight - offsetHeight) * 0.5;

	  flowView.valuePopper.style('transform', `translate3d(${x}px, ${y}px, 0px)`);
	  flowView.emit('popper', popperElement);
	}

	class FlowView extends Models.EventSource {
	  constructor(container, options = {}) {
	    super();

	    this.container = new Container(container, options);

	    this.element = document.createElement('div');
	    this.element.className = 'appmap__flow-view';
	    this.container.appendChild(this.element);

	    this.svg = d3.select(this.element)
	      .append('svg')
	      .attr('width', window.innerWidth)
	      .attr('height', window.innerHeight);

	    this.nodeGroup = d3.select(this.element)
	      .append('ul')
	      .attr('id', 'nodes');

	    this.linkGroup = this.svg
	      .append('g')
	      .attr('id', 'links');

	    this.valuePopper = d3.select(this.element)
	      .append('div')
	      .attr('class', 'appmap__flow-view-popper');

	    document.addEventListener('click', () => this.hidePopper());

	    this.on('popper', (element) => lazyPanToElement(this.container.containerController, element, 10));
	  }

	  setCallTree(callTree) {
	    this.callTree = callTree;

	    this.callTree.on('selectedEvent', (event) => {
	      panToNode(this.container.containerController, event.element);
	      this.highlight(event ? event.id : null);
	    });

	    this.callTree.on('rootEvent', () => {
	      this.render();
	    });
	  }

	  render() {
	    const { rootEvent } = this.callTree;
	    const [nodeConnections, portConnections] = transformEvents(rootEvent);

	    // Maps for forward and reverse lookups of node links
	    const outboundConnections = nodeConnections.reduce((map, link) => {
	      map[link.source] = link.target;
	      return map;
	    }, {});

	    const inboundConnections = nodeConnections.reduce((map, link) => {
	      map[link.target] = link.source;
	      return map;
	    }, {});

	    const mapNode = (layer) => {
	      const node = layer
	        .filter((d) => d.data.behavior)
	        .append('div')
	        .datum((d) => d.data.behavior)
	        .classed('node', true)
	        .classed('exception', (d) => d.exceptions.length > 0)
	        .attr('data-node-id', (d) => d.id)
	        .attr('data-event-id', (d) => d.event_id)
	        .on('click', (d) => this.callTree.selectedEvent = d.data)
	        .on('dblclick', (d) => this.emit('dblclick', d.data))
	        .on('contextmenu', (d) => this.callTree.selectedEvent = d.data);

	      const header = node
	        .append('div')
	        .attr('data-type', (d) => d.type)
	        .classed('header', true)
	        .attr('draggable', true);

	      header
	        .append('p')
	        .html((e) => e.name)
	        .attr('draggable', true);

	      const ioTable = node
	        .append('div')
	        .classed('io', true);

	      const inputs = ioTable
	        .append('div')
	        .classed('column left', true);

	      inputs
	        .append('div')
	        .attr('data-connection-type', 'input')
	        .classed('connector', true)
	        .classed('in-use', (d) => hasLink(inboundConnections, d.id));

	      inputs
	        .selectAll(null)
	        .data((d) => d.in.map((x) => ({ ...x, id: d.id })))
	        .enter()
	        .append('div')
	        .classed('item', true)
	        .classed('has-data', (d) => d && d.value && d.value.value)
	        .attr('data-type', (d) => d.type)
	        .attr('data-port-type', 'input')
	        .attr('data-port-id', (d) => d && d.value && d.value.object_id)
	        .text((d) => d.name)
	        .on('click', (d, i, elements) => {
	          this.callTree.selectedEvent = rootEvent.find((e) => e.id === d.id);
	          displayValue(this, elements[i], d.value, 'left');
	          d3.event.stopPropagation();
	        });

	      const outputs = ioTable
	        .append('div')
	        .classed('column right', true);

	      outputs
	        .append('div')
	        .attr('data-connection-type', 'output')
	        .classed('connector', true)
	        .classed('in-use', (d) => hasLink(outboundConnections, d.id));

	      outputs
	        .selectAll(null)
	        .data((d) => d.out.map((x) => ({ ...x, id: d.id })))
	        .enter()
	        .append('div')
	        .classed('item', true)
	        .classed('has-data', (d) => d && d.value && d.value.value)
	        .attr('data-type', (d) => d.type)
	        .attr('data-port-type', 'output')
	        .attr('data-port-id', (d) => d && d.value && d.value.object_id)
	        .text((d) => d.name)
	        .on('click', (d, i, elements) => {
	          this.callTree.selectedEvent = rootEvent.find((e) => e.id === d.id);
	          displayValue(this, elements[i], d.value, 'right');
	          d3.event.stopPropagation();
	        });

	      node
	        .filter((d) => d.type === 'sql')
	        .append('div')
	        .classed('sql', true)
	        .text((d) => d.value);
	    };

	    function bind(nodes) {
	      if (nodes.empty()) return;

	      nodes
	        .append('li')
	        .call(mapNode)
	        .append('ul')
	        .selectAll(':scope > li')
	        .data((d) => d.children || [], (d) => d.data.behavior.id)
	        .join(bind);
	    }

	    // Clear contents first.
	    // Changing root (even within the same tree)
	    // would require rebuilding the tree anyway
	    // (or convoluted grafting), and the connectors have
	    // to be moved too.
	    this.nodeGroup.text(null);
	    this.linkGroup.text(null);

	    this.nodeGroup.datum(d3.hierarchy(rootEvent)).call(bind);
	    this.nodeGroup.selectAll('.node').each((behavior, i, elements) => behavior.data.element = elements[i]);

	    this.linkGroup
	      .selectAll('.node-connection')
	      .data(nodeConnections)
	      .enter()
	      .append('path')
	      .classed('connection', true)
	      .classed('node-connection', true)
	      .attr('d', (d) => {
	        const output = getConnectionPosition(d.source, 'output');
	        const input = getConnectionPosition(d.target, 'input');
	        if (!(output && input)) {
	          return null;
	        }
	        return buildCurveCommands(output.right, output.y, input.left, input.y);
	      });

	    this.linkGroup
	      .selectAll('.port-connection')
	      .data(portConnections)
	      .enter()
	      .append('path')
	      .attr('class', (d) => `type-${d.type}`)
	      .classed('connection', true)
	      .classed('port-connection', true)
	      .attr('d', (d) => {
	        const output = getPortPosition(d.output.nodeId, d.output.portId);
	        const input = getPortPosition(d.input.nodeId, d.input.portId);
	        if (!(output && input)) {
	          return null;
	        }
	        return buildCurveCommands(output.right, output.y, input.left, input.y);
	      });
	  }

	  highlight(eventId) {
	    this.hidePopper();
	    this.nodeGroup
	      .selectAll('.node')
	      .classed('highlight', false)
	      .filter((d) => d.id === eventId)
	      .classed('highlight', true);
	  }

	  hidePopper() {
	    this.valuePopper.attr('data-show', null);
	  }
	}

	var d3Flamegraph = createCommonjsModule(function (module, exports) {
	(function webpackUniversalModuleDefinition(root, factory) {
		module.exports = factory();
	})(window, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};
	/******/
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	/******/
	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId]) {
	/******/ 			return installedModules[moduleId].exports;
	/******/ 		}
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			i: moduleId,
	/******/ 			l: false,
	/******/ 			exports: {}
	/******/ 		};
	/******/
	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
	/******/
	/******/ 		// Flag the module as loaded
	/******/ 		module.l = true;
	/******/
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	/******/
	/******/
	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;
	/******/
	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;
	/******/
	/******/ 	// define getter function for harmony exports
	/******/ 	__webpack_require__.d = function(exports, name, getter) {
	/******/ 		if(!__webpack_require__.o(exports, name)) {
	/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
	/******/ 		}
	/******/ 	};
	/******/
	/******/ 	// define __esModule on exports
	/******/ 	__webpack_require__.r = function(exports) {
	/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
	/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
	/******/ 		}
	/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
	/******/ 	};
	/******/
	/******/ 	// create a fake namespace object
	/******/ 	// mode & 1: value is a module id, require it
	/******/ 	// mode & 2: merge all properties of value into the ns
	/******/ 	// mode & 4: return value when already ns object
	/******/ 	// mode & 8|1: behave like require
	/******/ 	__webpack_require__.t = function(value, mode) {
	/******/ 		if(mode & 1) value = __webpack_require__(value);
	/******/ 		if(mode & 8) return value;
	/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
	/******/ 		var ns = Object.create(null);
	/******/ 		__webpack_require__.r(ns);
	/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
	/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
	/******/ 		return ns;
	/******/ 	};
	/******/
	/******/ 	// getDefaultExport function for compatibility with non-harmony modules
	/******/ 	__webpack_require__.n = function(module) {
	/******/ 		var getter = module && module.__esModule ?
	/******/ 			function getDefault() { return module['default']; } :
	/******/ 			function getModuleExports() { return module; };
	/******/ 		__webpack_require__.d(getter, 'a', getter);
	/******/ 		return getter;
	/******/ 	};
	/******/
	/******/ 	// Object.prototype.hasOwnProperty.call
	/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
	/******/
	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";
	/******/
	/******/
	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(__webpack_require__.s = 7);
	/******/ })
	/************************************************************************/
	/******/ ({

	/***/ 7:
	/***/ (function(module, __webpack_exports__, __webpack_require__) {
	// ESM COMPAT FLAG
	__webpack_require__.r(__webpack_exports__);

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selector.js
	function none() {}

	/* harmony default export */ var src_selector = (function(selector) {
	  return selector == null ? none : function() {
	    return this.querySelector(selector);
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/select.js



	/* harmony default export */ var selection_select = (function(select) {
	  if (typeof select !== "function") select = src_selector(select);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
	      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
	        if ("__data__" in node) subnode.__data__ = node.__data__;
	        subgroup[i] = subnode;
	      }
	    }
	  }

	  return new Selection(subgroups, this._parents);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selectorAll.js
	function selectorAll_empty() {
	  return [];
	}

	/* harmony default export */ var selectorAll = (function(selector) {
	  return selector == null ? selectorAll_empty : function() {
	    return this.querySelectorAll(selector);
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/selectAll.js



	/* harmony default export */ var selectAll = (function(select) {
	  if (typeof select !== "function") select = selectorAll(select);

	  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        subgroups.push(select.call(node, node.__data__, i, group));
	        parents.push(node);
	      }
	    }
	  }

	  return new Selection(subgroups, parents);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/matcher.js
	/* harmony default export */ var matcher = (function(selector) {
	  return function() {
	    return this.matches(selector);
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/filter.js



	/* harmony default export */ var filter = (function(match) {
	  if (typeof match !== "function") match = matcher(match);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
	      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
	        subgroup.push(node);
	      }
	    }
	  }

	  return new Selection(subgroups, this._parents);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/sparse.js
	/* harmony default export */ var sparse = (function(update) {
	  return new Array(update.length);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/enter.js



	/* harmony default export */ var selection_enter = (function() {
	  return new Selection(this._enter || this._groups.map(sparse), this._parents);
	});

	function EnterNode(parent, datum) {
	  this.ownerDocument = parent.ownerDocument;
	  this.namespaceURI = parent.namespaceURI;
	  this._next = null;
	  this._parent = parent;
	  this.__data__ = datum;
	}

	EnterNode.prototype = {
	  constructor: EnterNode,
	  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
	  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
	  querySelector: function(selector) { return this._parent.querySelector(selector); },
	  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
	};

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/constant.js
	/* harmony default export */ var constant = (function(x) {
	  return function() {
	    return x;
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/data.js




	var keyPrefix = "$"; // Protect against keys like “__proto__”.

	function bindIndex(parent, group, enter, update, exit, data) {
	  var i = 0,
	      node,
	      groupLength = group.length,
	      dataLength = data.length;

	  // Put any non-null nodes that fit into update.
	  // Put any null nodes into enter.
	  // Put any remaining data into enter.
	  for (; i < dataLength; ++i) {
	    if (node = group[i]) {
	      node.__data__ = data[i];
	      update[i] = node;
	    } else {
	      enter[i] = new EnterNode(parent, data[i]);
	    }
	  }

	  // Put any non-null nodes that don’t fit into exit.
	  for (; i < groupLength; ++i) {
	    if (node = group[i]) {
	      exit[i] = node;
	    }
	  }
	}

	function bindKey(parent, group, enter, update, exit, data, key) {
	  var i,
	      node,
	      nodeByKeyValue = {},
	      groupLength = group.length,
	      dataLength = data.length,
	      keyValues = new Array(groupLength),
	      keyValue;

	  // Compute the key for each node.
	  // If multiple nodes have the same key, the duplicates are added to exit.
	  for (i = 0; i < groupLength; ++i) {
	    if (node = group[i]) {
	      keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
	      if (keyValue in nodeByKeyValue) {
	        exit[i] = node;
	      } else {
	        nodeByKeyValue[keyValue] = node;
	      }
	    }
	  }

	  // Compute the key for each datum.
	  // If there a node associated with this key, join and add it to update.
	  // If there is not (or the key is a duplicate), add it to enter.
	  for (i = 0; i < dataLength; ++i) {
	    keyValue = keyPrefix + key.call(parent, data[i], i, data);
	    if (node = nodeByKeyValue[keyValue]) {
	      update[i] = node;
	      node.__data__ = data[i];
	      nodeByKeyValue[keyValue] = null;
	    } else {
	      enter[i] = new EnterNode(parent, data[i]);
	    }
	  }

	  // Add any remaining nodes that were not bound to data to exit.
	  for (i = 0; i < groupLength; ++i) {
	    if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
	      exit[i] = node;
	    }
	  }
	}

	/* harmony default export */ var selection_data = (function(value, key) {
	  if (!value) {
	    data = new Array(this.size()), j = -1;
	    this.each(function(d) { data[++j] = d; });
	    return data;
	  }

	  var bind = key ? bindKey : bindIndex,
	      parents = this._parents,
	      groups = this._groups;

	  if (typeof value !== "function") value = constant(value);

	  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
	    var parent = parents[j],
	        group = groups[j],
	        groupLength = group.length,
	        data = value.call(parent, parent && parent.__data__, j, parents),
	        dataLength = data.length,
	        enterGroup = enter[j] = new Array(dataLength),
	        updateGroup = update[j] = new Array(dataLength),
	        exitGroup = exit[j] = new Array(groupLength);

	    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

	    // Now connect the enter nodes to their following update node, such that
	    // appendChild can insert the materialized enter node before this node,
	    // rather than at the end of the parent node.
	    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
	      if (previous = enterGroup[i0]) {
	        if (i0 >= i1) i1 = i0 + 1;
	        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
	        previous._next = next || null;
	      }
	    }
	  }

	  update = new Selection(update, parents);
	  update._enter = enter;
	  update._exit = exit;
	  return update;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/exit.js



	/* harmony default export */ var selection_exit = (function() {
	  return new Selection(this._exit || this._groups.map(sparse), this._parents);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/join.js
	/* harmony default export */ var join = (function(onenter, onupdate, onexit) {
	  var enter = this.enter(), update = this, exit = this.exit();
	  enter = typeof onenter === "function" ? onenter(enter) : enter.append(onenter + "");
	  if (onupdate != null) update = onupdate(update);
	  if (onexit == null) exit.remove(); else onexit(exit);
	  return enter && update ? enter.merge(update).order() : update;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/merge.js


	/* harmony default export */ var selection_merge = (function(selection) {

	  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
	    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
	      if (node = group0[i] || group1[i]) {
	        merge[i] = node;
	      }
	    }
	  }

	  for (; j < m0; ++j) {
	    merges[j] = groups0[j];
	  }

	  return new Selection(merges, this._parents);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/order.js
	/* harmony default export */ var order = (function() {

	  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
	    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
	      if (node = group[i]) {
	        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
	        next = node;
	      }
	    }
	  }

	  return this;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/sort.js


	/* harmony default export */ var selection_sort = (function(compare) {
	  if (!compare) compare = ascending;

	  function compareNode(a, b) {
	    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
	  }

	  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        sortgroup[i] = node;
	      }
	    }
	    sortgroup.sort(compareNode);
	  }

	  return new Selection(sortgroups, this._parents).order();
	});

	function ascending(a, b) {
	  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
	}

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/call.js
	/* harmony default export */ var call = (function() {
	  var callback = arguments[0];
	  arguments[0] = this;
	  callback.apply(null, arguments);
	  return this;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/nodes.js
	/* harmony default export */ var nodes = (function() {
	  var nodes = new Array(this.size()), i = -1;
	  this.each(function() { nodes[++i] = this; });
	  return nodes;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/node.js
	/* harmony default export */ var selection_node = (function() {

	  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
	    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
	      var node = group[i];
	      if (node) return node;
	    }
	  }

	  return null;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/size.js
	/* harmony default export */ var selection_size = (function() {
	  var size = 0;
	  this.each(function() { ++size; });
	  return size;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/empty.js
	/* harmony default export */ var selection_empty = (function() {
	  return !this.node();
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/each.js
	/* harmony default export */ var each = (function(callback) {

	  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
	    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
	      if (node = group[i]) callback.call(node, node.__data__, i, group);
	    }
	  }

	  return this;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/namespaces.js
	var xhtml = "http://www.w3.org/1999/xhtml";

	/* harmony default export */ var namespaces = ({
	  svg: "http://www.w3.org/2000/svg",
	  xhtml: xhtml,
	  xlink: "http://www.w3.org/1999/xlink",
	  xml: "http://www.w3.org/XML/1998/namespace",
	  xmlns: "http://www.w3.org/2000/xmlns/"
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/namespace.js


	/* harmony default export */ var namespace = (function(name) {
	  var prefix = name += "", i = prefix.indexOf(":");
	  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
	  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/attr.js


	function attrRemove(name) {
	  return function() {
	    this.removeAttribute(name);
	  };
	}

	function attrRemoveNS(fullname) {
	  return function() {
	    this.removeAttributeNS(fullname.space, fullname.local);
	  };
	}

	function attrConstant(name, value) {
	  return function() {
	    this.setAttribute(name, value);
	  };
	}

	function attrConstantNS(fullname, value) {
	  return function() {
	    this.setAttributeNS(fullname.space, fullname.local, value);
	  };
	}

	function attrFunction(name, value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) this.removeAttribute(name);
	    else this.setAttribute(name, v);
	  };
	}

	function attrFunctionNS(fullname, value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
	    else this.setAttributeNS(fullname.space, fullname.local, v);
	  };
	}

	/* harmony default export */ var attr = (function(name, value) {
	  var fullname = namespace(name);

	  if (arguments.length < 2) {
	    var node = this.node();
	    return fullname.local
	        ? node.getAttributeNS(fullname.space, fullname.local)
	        : node.getAttribute(fullname);
	  }

	  return this.each((value == null
	      ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
	      ? (fullname.local ? attrFunctionNS : attrFunction)
	      : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/window.js
	/* harmony default export */ var src_window = (function(node) {
	  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
	      || (node.document && node) // node is a Window
	      || node.defaultView; // node is a Document
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/style.js


	function styleRemove(name) {
	  return function() {
	    this.style.removeProperty(name);
	  };
	}

	function styleConstant(name, value, priority) {
	  return function() {
	    this.style.setProperty(name, value, priority);
	  };
	}

	function styleFunction(name, value, priority) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) this.style.removeProperty(name);
	    else this.style.setProperty(name, v, priority);
	  };
	}

	/* harmony default export */ var style = (function(name, value, priority) {
	  return arguments.length > 1
	      ? this.each((value == null
	            ? styleRemove : typeof value === "function"
	            ? styleFunction
	            : styleConstant)(name, value, priority == null ? "" : priority))
	      : styleValue(this.node(), name);
	});

	function styleValue(node, name) {
	  return node.style.getPropertyValue(name)
	      || src_window(node).getComputedStyle(node, null).getPropertyValue(name);
	}

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/property.js
	function propertyRemove(name) {
	  return function() {
	    delete this[name];
	  };
	}

	function propertyConstant(name, value) {
	  return function() {
	    this[name] = value;
	  };
	}

	function propertyFunction(name, value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) delete this[name];
	    else this[name] = v;
	  };
	}

	/* harmony default export */ var property = (function(name, value) {
	  return arguments.length > 1
	      ? this.each((value == null
	          ? propertyRemove : typeof value === "function"
	          ? propertyFunction
	          : propertyConstant)(name, value))
	      : this.node()[name];
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/classed.js
	function classArray(string) {
	  return string.trim().split(/^|\s+/);
	}

	function classList(node) {
	  return node.classList || new ClassList(node);
	}

	function ClassList(node) {
	  this._node = node;
	  this._names = classArray(node.getAttribute("class") || "");
	}

	ClassList.prototype = {
	  add: function(name) {
	    var i = this._names.indexOf(name);
	    if (i < 0) {
	      this._names.push(name);
	      this._node.setAttribute("class", this._names.join(" "));
	    }
	  },
	  remove: function(name) {
	    var i = this._names.indexOf(name);
	    if (i >= 0) {
	      this._names.splice(i, 1);
	      this._node.setAttribute("class", this._names.join(" "));
	    }
	  },
	  contains: function(name) {
	    return this._names.indexOf(name) >= 0;
	  }
	};

	function classedAdd(node, names) {
	  var list = classList(node), i = -1, n = names.length;
	  while (++i < n) list.add(names[i]);
	}

	function classedRemove(node, names) {
	  var list = classList(node), i = -1, n = names.length;
	  while (++i < n) list.remove(names[i]);
	}

	function classedTrue(names) {
	  return function() {
	    classedAdd(this, names);
	  };
	}

	function classedFalse(names) {
	  return function() {
	    classedRemove(this, names);
	  };
	}

	function classedFunction(names, value) {
	  return function() {
	    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
	  };
	}

	/* harmony default export */ var classed = (function(name, value) {
	  var names = classArray(name + "");

	  if (arguments.length < 2) {
	    var list = classList(this.node()), i = -1, n = names.length;
	    while (++i < n) if (!list.contains(names[i])) return false;
	    return true;
	  }

	  return this.each((typeof value === "function"
	      ? classedFunction : value
	      ? classedTrue
	      : classedFalse)(names, value));
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/text.js
	function textRemove() {
	  this.textContent = "";
	}

	function textConstant(value) {
	  return function() {
	    this.textContent = value;
	  };
	}

	function textFunction(value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    this.textContent = v == null ? "" : v;
	  };
	}

	/* harmony default export */ var selection_text = (function(value) {
	  return arguments.length
	      ? this.each(value == null
	          ? textRemove : (typeof value === "function"
	          ? textFunction
	          : textConstant)(value))
	      : this.node().textContent;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/html.js
	function htmlRemove() {
	  this.innerHTML = "";
	}

	function htmlConstant(value) {
	  return function() {
	    this.innerHTML = value;
	  };
	}

	function htmlFunction(value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    this.innerHTML = v == null ? "" : v;
	  };
	}

	/* harmony default export */ var html = (function(value) {
	  return arguments.length
	      ? this.each(value == null
	          ? htmlRemove : (typeof value === "function"
	          ? htmlFunction
	          : htmlConstant)(value))
	      : this.node().innerHTML;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/raise.js
	function raise() {
	  if (this.nextSibling) this.parentNode.appendChild(this);
	}

	/* harmony default export */ var selection_raise = (function() {
	  return this.each(raise);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/lower.js
	function lower() {
	  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
	}

	/* harmony default export */ var selection_lower = (function() {
	  return this.each(lower);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/creator.js



	function creatorInherit(name) {
	  return function() {
	    var document = this.ownerDocument,
	        uri = this.namespaceURI;
	    return uri === xhtml && document.documentElement.namespaceURI === xhtml
	        ? document.createElement(name)
	        : document.createElementNS(uri, name);
	  };
	}

	function creatorFixed(fullname) {
	  return function() {
	    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
	  };
	}

	/* harmony default export */ var creator = (function(name) {
	  var fullname = namespace(name);
	  return (fullname.local
	      ? creatorFixed
	      : creatorInherit)(fullname);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/append.js


	/* harmony default export */ var append = (function(name) {
	  var create = typeof name === "function" ? name : creator(name);
	  return this.select(function() {
	    return this.appendChild(create.apply(this, arguments));
	  });
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/insert.js



	function constantNull() {
	  return null;
	}

	/* harmony default export */ var insert = (function(name, before) {
	  var create = typeof name === "function" ? name : creator(name),
	      select = before == null ? constantNull : typeof before === "function" ? before : src_selector(before);
	  return this.select(function() {
	    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
	  });
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/remove.js
	function remove_remove() {
	  var parent = this.parentNode;
	  if (parent) parent.removeChild(this);
	}

	/* harmony default export */ var selection_remove = (function() {
	  return this.each(remove_remove);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/clone.js
	function selection_cloneShallow() {
	  var clone = this.cloneNode(false), parent = this.parentNode;
	  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
	}

	function selection_cloneDeep() {
	  var clone = this.cloneNode(true), parent = this.parentNode;
	  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
	}

	/* harmony default export */ var clone = (function(deep) {
	  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/datum.js
	/* harmony default export */ var datum = (function(value) {
	  return arguments.length
	      ? this.property("__data__", value)
	      : this.node().__data__;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/on.js
	var filterEvents = {};

	if (typeof document !== "undefined") {
	  var on_element = document.documentElement;
	  if (!("onmouseenter" in on_element)) {
	    filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
	  }
	}

	function filterContextListener(listener, index, group) {
	  listener = contextListener(listener, index, group);
	  return function(event) {
	    var related = event.relatedTarget;
	    if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
	      listener.call(this, event);
	    }
	  };
	}

	function contextListener(listener, index, group) {
	  return function(event1) {
	    try {
	      listener.call(this, this.__data__, index, group);
	    } finally {
	    }
	  };
	}

	function parseTypenames(typenames) {
	  return typenames.trim().split(/^|\s+/).map(function(t) {
	    var name = "", i = t.indexOf(".");
	    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
	    return {type: t, name: name};
	  });
	}

	function onRemove(typename) {
	  return function() {
	    var on = this.__on;
	    if (!on) return;
	    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
	      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
	        this.removeEventListener(o.type, o.listener, o.capture);
	      } else {
	        on[++i] = o;
	      }
	    }
	    if (++i) on.length = i;
	    else delete this.__on;
	  };
	}

	function onAdd(typename, value, capture) {
	  var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
	  return function(d, i, group) {
	    var on = this.__on, o, listener = wrap(value, i, group);
	    if (on) for (var j = 0, m = on.length; j < m; ++j) {
	      if ((o = on[j]).type === typename.type && o.name === typename.name) {
	        this.removeEventListener(o.type, o.listener, o.capture);
	        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
	        o.value = value;
	        return;
	      }
	    }
	    this.addEventListener(typename.type, listener, capture);
	    o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
	    if (!on) this.__on = [o];
	    else on.push(o);
	  };
	}

	/* harmony default export */ var selection_on = (function(typename, value, capture) {
	  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

	  if (arguments.length < 2) {
	    var on = this.node().__on;
	    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
	      for (i = 0, o = on[j]; i < n; ++i) {
	        if ((t = typenames[i]).type === o.type && t.name === o.name) {
	          return o.value;
	        }
	      }
	    }
	    return;
	  }

	  on = value ? onAdd : onRemove;
	  if (capture == null) capture = false;
	  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
	  return this;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/dispatch.js


	function dispatchEvent(node, type, params) {
	  var window = src_window(node),
	      event = window.CustomEvent;

	  if (typeof event === "function") {
	    event = new event(type, params);
	  } else {
	    event = window.document.createEvent("Event");
	    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
	    else event.initEvent(type, false, false);
	  }

	  node.dispatchEvent(event);
	}

	function dispatchConstant(type, params) {
	  return function() {
	    return dispatchEvent(this, type, params);
	  };
	}

	function dispatchFunction(type, params) {
	  return function() {
	    return dispatchEvent(this, type, params.apply(this, arguments));
	  };
	}

	/* harmony default export */ var dispatch = (function(type, params) {
	  return this.each((typeof params === "function"
	      ? dispatchFunction
	      : dispatchConstant)(type, params));
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/index.js
































	var selection_root = [null];

	function Selection(groups, parents) {
	  this._groups = groups;
	  this._parents = parents;
	}

	function selection_selection() {
	  return new Selection([[document.documentElement]], selection_root);
	}

	Selection.prototype = selection_selection.prototype = {
	  constructor: Selection,
	  select: selection_select,
	  selectAll: selectAll,
	  filter: filter,
	  data: selection_data,
	  enter: selection_enter,
	  exit: selection_exit,
	  join: join,
	  merge: selection_merge,
	  order: order,
	  sort: selection_sort,
	  call: call,
	  nodes: nodes,
	  node: selection_node,
	  size: selection_size,
	  empty: selection_empty,
	  each: each,
	  attr: attr,
	  style: style,
	  property: property,
	  classed: classed,
	  text: selection_text,
	  html: html,
	  raise: selection_raise,
	  lower: selection_lower,
	  append: append,
	  insert: insert,
	  remove: selection_remove,
	  clone: clone,
	  datum: datum,
	  on: selection_on,
	  dispatch: dispatch
	};

	/* harmony default export */ var src_selection = (selection_selection);

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/select.js


	/* harmony default export */ var src_select = (function(selector) {
	  return typeof selector === "string"
	      ? new Selection([[document.querySelector(selector)]], [document.documentElement])
	      : new Selection([[selector]], selection_root);
	});

	// CONCATENATED MODULE: ../node_modules/d3-format/src/formatDecimal.js
	// Computes the decimal coefficient and exponent of the specified number x with
	// significant digits p, where x is positive and p is in [1, 21] or undefined.
	// For example, formatDecimal(1.23) returns ["123", 0].
	/* harmony default export */ var formatDecimal = (function(x, p) {
	  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
	  var i, coefficient = x.slice(0, i);

	  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
	  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
	  return [
	    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
	    +x.slice(i + 1)
	  ];
	});

	// CONCATENATED MODULE: ../node_modules/d3-format/src/exponent.js


	/* harmony default export */ var src_exponent = (function(x) {
	  return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
	});

	// CONCATENATED MODULE: ../node_modules/d3-format/src/formatGroup.js
	/* harmony default export */ var formatGroup = (function(grouping, thousands) {
	  return function(value, width) {
	    var i = value.length,
	        t = [],
	        j = 0,
	        g = grouping[0],
	        length = 0;

	    while (i > 0 && g > 0) {
	      if (length + g + 1 > width) g = Math.max(1, width - length);
	      t.push(value.substring(i -= g, i + g));
	      if ((length += g + 1) > width) break;
	      g = grouping[j = (j + 1) % grouping.length];
	    }

	    return t.reverse().join(thousands);
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-format/src/formatNumerals.js
	/* harmony default export */ var formatNumerals = (function(numerals) {
	  return function(value) {
	    return value.replace(/[0-9]/g, function(i) {
	      return numerals[+i];
	    });
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-format/src/formatSpecifier.js
	// [[fill]align][sign][symbol][0][width][,][.precision][~][type]
	var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

	function formatSpecifier(specifier) {
	  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
	  var match;
	  return new FormatSpecifier({
	    fill: match[1],
	    align: match[2],
	    sign: match[3],
	    symbol: match[4],
	    zero: match[5],
	    width: match[6],
	    comma: match[7],
	    precision: match[8] && match[8].slice(1),
	    trim: match[9],
	    type: match[10]
	  });
	}

	formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

	function FormatSpecifier(specifier) {
	  this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
	  this.align = specifier.align === undefined ? ">" : specifier.align + "";
	  this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
	  this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
	  this.zero = !!specifier.zero;
	  this.width = specifier.width === undefined ? undefined : +specifier.width;
	  this.comma = !!specifier.comma;
	  this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
	  this.trim = !!specifier.trim;
	  this.type = specifier.type === undefined ? "" : specifier.type + "";
	}

	FormatSpecifier.prototype.toString = function() {
	  return this.fill
	      + this.align
	      + this.sign
	      + this.symbol
	      + (this.zero ? "0" : "")
	      + (this.width === undefined ? "" : Math.max(1, this.width | 0))
	      + (this.comma ? "," : "")
	      + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
	      + (this.trim ? "~" : "")
	      + this.type;
	};

	// CONCATENATED MODULE: ../node_modules/d3-format/src/formatTrim.js
	// Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
	/* harmony default export */ var formatTrim = (function(s) {
	  out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
	    switch (s[i]) {
	      case ".": i0 = i1 = i; break;
	      case "0": if (i0 === 0) i0 = i; i1 = i; break;
	      default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
	    }
	  }
	  return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
	});

	// CONCATENATED MODULE: ../node_modules/d3-format/src/formatPrefixAuto.js


	var prefixExponent;

	/* harmony default export */ var formatPrefixAuto = (function(x, p) {
	  var d = formatDecimal(x, p);
	  if (!d) return x + "";
	  var coefficient = d[0],
	      exponent = d[1],
	      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
	      n = coefficient.length;
	  return i === n ? coefficient
	      : i > n ? coefficient + new Array(i - n + 1).join("0")
	      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
	      : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
	});

	// CONCATENATED MODULE: ../node_modules/d3-format/src/formatRounded.js


	/* harmony default export */ var formatRounded = (function(x, p) {
	  var d = formatDecimal(x, p);
	  if (!d) return x + "";
	  var coefficient = d[0],
	      exponent = d[1];
	  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
	      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
	      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
	});

	// CONCATENATED MODULE: ../node_modules/d3-format/src/formatTypes.js



	/* harmony default export */ var formatTypes = ({
	  "%": function(x, p) { return (x * 100).toFixed(p); },
	  "b": function(x) { return Math.round(x).toString(2); },
	  "c": function(x) { return x + ""; },
	  "d": function(x) { return Math.round(x).toString(10); },
	  "e": function(x, p) { return x.toExponential(p); },
	  "f": function(x, p) { return x.toFixed(p); },
	  "g": function(x, p) { return x.toPrecision(p); },
	  "o": function(x) { return Math.round(x).toString(8); },
	  "p": function(x, p) { return formatRounded(x * 100, p); },
	  "r": formatRounded,
	  "s": formatPrefixAuto,
	  "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
	  "x": function(x) { return Math.round(x).toString(16); }
	});

	// CONCATENATED MODULE: ../node_modules/d3-format/src/identity.js
	/* harmony default export */ var identity = (function(x) {
	  return x;
	});

	// CONCATENATED MODULE: ../node_modules/d3-format/src/locale.js









	var map = Array.prototype.map,
	    prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

	/* harmony default export */ var src_locale = (function(locale) {
	  var group = locale.grouping === undefined || locale.thousands === undefined ? identity : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
	      currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
	      currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
	      decimal = locale.decimal === undefined ? "." : locale.decimal + "",
	      numerals = locale.numerals === undefined ? identity : formatNumerals(map.call(locale.numerals, String)),
	      percent = locale.percent === undefined ? "%" : locale.percent + "",
	      minus = locale.minus === undefined ? "-" : locale.minus + "",
	      nan = locale.nan === undefined ? "NaN" : locale.nan + "";

	  function newFormat(specifier) {
	    specifier = formatSpecifier(specifier);

	    var fill = specifier.fill,
	        align = specifier.align,
	        sign = specifier.sign,
	        symbol = specifier.symbol,
	        zero = specifier.zero,
	        width = specifier.width,
	        comma = specifier.comma,
	        precision = specifier.precision,
	        trim = specifier.trim,
	        type = specifier.type;

	    // The "n" type is an alias for ",g".
	    if (type === "n") comma = true, type = "g";

	    // The "" type, and any invalid type, is an alias for ".12~g".
	    else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

	    // If zero fill is specified, padding goes after sign and before digits.
	    if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

	    // Compute the prefix and suffix.
	    // For SI-prefix, the suffix is lazily computed.
	    var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
	        suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

	    // What format function should we use?
	    // Is this an integer type?
	    // Can this type generate exponential notation?
	    var formatType = formatTypes[type],
	        maybeSuffix = /[defgprs%]/.test(type);

	    // Set the default precision if not specified,
	    // or clamp the specified precision to the supported range.
	    // For significant precision, it must be in [1, 21].
	    // For fixed precision, it must be in [0, 20].
	    precision = precision === undefined ? 6
	        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
	        : Math.max(0, Math.min(20, precision));

	    function format(value) {
	      var valuePrefix = prefix,
	          valueSuffix = suffix,
	          i, n, c;

	      if (type === "c") {
	        valueSuffix = formatType(value) + valueSuffix;
	        value = "";
	      } else {
	        value = +value;

	        // Perform the initial formatting.
	        var valueNegative = value < 0;
	        value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

	        // Trim insignificant zeros.
	        if (trim) value = formatTrim(value);

	        // If a negative value rounds to zero during formatting, treat as positive.
	        if (valueNegative && +value === 0) valueNegative = false;

	        // Compute the prefix and suffix.
	        valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;

	        valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

	        // Break the formatted value into the integer “value” part that can be
	        // grouped, and fractional or exponential “suffix” part that is not.
	        if (maybeSuffix) {
	          i = -1, n = value.length;
	          while (++i < n) {
	            if (c = value.charCodeAt(i), 48 > c || c > 57) {
	              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
	              value = value.slice(0, i);
	              break;
	            }
	          }
	        }
	      }

	      // If the fill character is not "0", grouping is applied before padding.
	      if (comma && !zero) value = group(value, Infinity);

	      // Compute the padding.
	      var length = valuePrefix.length + value.length + valueSuffix.length,
	          padding = length < width ? new Array(width - length + 1).join(fill) : "";

	      // If the fill character is "0", grouping is applied after padding.
	      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

	      // Reconstruct the final output based on the desired alignment.
	      switch (align) {
	        case "<": value = valuePrefix + value + valueSuffix + padding; break;
	        case "=": value = valuePrefix + padding + value + valueSuffix; break;
	        case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
	        default: value = padding + valuePrefix + value + valueSuffix; break;
	      }

	      return numerals(value);
	    }

	    format.toString = function() {
	      return specifier + "";
	    };

	    return format;
	  }

	  function formatPrefix(specifier, value) {
	    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
	        e = Math.max(-8, Math.min(8, Math.floor(src_exponent(value) / 3))) * 3,
	        k = Math.pow(10, -e),
	        prefix = prefixes[8 + e / 3];
	    return function(value) {
	      return f(k * value) + prefix;
	    };
	  }

	  return {
	    format: newFormat,
	    formatPrefix: formatPrefix
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-format/src/defaultLocale.js


	var defaultLocale_locale;
	var defaultLocale_format;
	var defaultLocale_formatPrefix;

	defaultLocale({
	  decimal: ".",
	  thousands: ",",
	  grouping: [3],
	  currency: ["$", ""],
	  minus: "-"
	});

	function defaultLocale(definition) {
	  defaultLocale_locale = src_locale(definition);
	  defaultLocale_format = defaultLocale_locale.format;
	  defaultLocale_formatPrefix = defaultLocale_locale.formatPrefix;
	  return defaultLocale_locale;
	}

	// CONCATENATED MODULE: ../node_modules/d3-array/src/ascending.js
	/* harmony default export */ var src_ascending = (function(a, b) {
	  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/treemap/round.js
	/* harmony default export */ var treemap_round = (function(node) {
	  node.x0 = Math.round(node.x0);
	  node.y0 = Math.round(node.y0);
	  node.x1 = Math.round(node.x1);
	  node.y1 = Math.round(node.y1);
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/treemap/dice.js
	/* harmony default export */ var dice = (function(parent, x0, y0, x1, y1) {
	  var nodes = parent.children,
	      node,
	      i = -1,
	      n = nodes.length,
	      k = parent.value && (x1 - x0) / parent.value;

	  while (++i < n) {
	    node = nodes[i], node.y0 = y0, node.y1 = y1;
	    node.x0 = x0, node.x1 = x0 += node.value * k;
	  }
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/partition.js



	/* harmony default export */ var src_partition = (function() {
	  var dx = 1,
	      dy = 1,
	      padding = 0,
	      round = false;

	  function partition(root) {
	    var n = root.height + 1;
	    root.x0 =
	    root.y0 = padding;
	    root.x1 = dx;
	    root.y1 = dy / n;
	    root.eachBefore(positionNode(dy, n));
	    if (round) root.eachBefore(treemap_round);
	    return root;
	  }

	  function positionNode(dy, n) {
	    return function(node) {
	      if (node.children) {
	        dice(node, node.x0, dy * (node.depth + 1) / n, node.x1, dy * (node.depth + 2) / n);
	      }
	      var x0 = node.x0,
	          y0 = node.y0,
	          x1 = node.x1 - padding,
	          y1 = node.y1 - padding;
	      if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
	      if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
	      node.x0 = x0;
	      node.y0 = y0;
	      node.x1 = x1;
	      node.y1 = y1;
	    };
	  }

	  partition.round = function(x) {
	    return arguments.length ? (round = !!x, partition) : round;
	  };

	  partition.size = function(x) {
	    return arguments.length ? (dx = +x[0], dy = +x[1], partition) : [dx, dy];
	  };

	  partition.padding = function(x) {
	    return arguments.length ? (padding = +x, partition) : padding;
	  };

	  return partition;
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/count.js
	function count_count(node) {
	  var sum = 0,
	      children = node.children,
	      i = children && children.length;
	  if (!i) sum = 1;
	  else while (--i >= 0) sum += children[i].value;
	  node.value = sum;
	}

	/* harmony default export */ var hierarchy_count = (function() {
	  return this.eachAfter(count_count);
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/each.js
	/* harmony default export */ var hierarchy_each = (function(callback) {
	  var node = this, current, next = [node], children, i, n;
	  do {
	    current = next.reverse(), next = [];
	    while (node = current.pop()) {
	      callback(node), children = node.children;
	      if (children) for (i = 0, n = children.length; i < n; ++i) {
	        next.push(children[i]);
	      }
	    }
	  } while (next.length);
	  return this;
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/eachBefore.js
	/* harmony default export */ var eachBefore = (function(callback) {
	  var node = this, nodes = [node], children, i;
	  while (node = nodes.pop()) {
	    callback(node), children = node.children;
	    if (children) for (i = children.length - 1; i >= 0; --i) {
	      nodes.push(children[i]);
	    }
	  }
	  return this;
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/eachAfter.js
	/* harmony default export */ var eachAfter = (function(callback) {
	  var node = this, nodes = [node], next = [], children, i, n;
	  while (node = nodes.pop()) {
	    next.push(node), children = node.children;
	    if (children) for (i = 0, n = children.length; i < n; ++i) {
	      nodes.push(children[i]);
	    }
	  }
	  while (node = next.pop()) {
	    callback(node);
	  }
	  return this;
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/sum.js
	/* harmony default export */ var sum = (function(value) {
	  return this.eachAfter(function(node) {
	    var sum = +value(node.data) || 0,
	        children = node.children,
	        i = children && children.length;
	    while (--i >= 0) sum += children[i].value;
	    node.value = sum;
	  });
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/sort.js
	/* harmony default export */ var hierarchy_sort = (function(compare) {
	  return this.eachBefore(function(node) {
	    if (node.children) {
	      node.children.sort(compare);
	    }
	  });
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/path.js
	/* harmony default export */ var path = (function(end) {
	  var start = this,
	      ancestor = leastCommonAncestor(start, end),
	      nodes = [start];
	  while (start !== ancestor) {
	    start = start.parent;
	    nodes.push(start);
	  }
	  var k = nodes.length;
	  while (end !== ancestor) {
	    nodes.splice(k, 0, end);
	    end = end.parent;
	  }
	  return nodes;
	});

	function leastCommonAncestor(a, b) {
	  if (a === b) return a;
	  var aNodes = a.ancestors(),
	      bNodes = b.ancestors(),
	      c = null;
	  a = aNodes.pop();
	  b = bNodes.pop();
	  while (a === b) {
	    c = a;
	    a = aNodes.pop();
	    b = bNodes.pop();
	  }
	  return c;
	}

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/ancestors.js
	/* harmony default export */ var ancestors = (function() {
	  var node = this, nodes = [node];
	  while (node = node.parent) {
	    nodes.push(node);
	  }
	  return nodes;
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/descendants.js
	/* harmony default export */ var hierarchy_descendants = (function() {
	  var nodes = [];
	  this.each(function(node) {
	    nodes.push(node);
	  });
	  return nodes;
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/leaves.js
	/* harmony default export */ var leaves = (function() {
	  var leaves = [];
	  this.eachBefore(function(node) {
	    if (!node.children) {
	      leaves.push(node);
	    }
	  });
	  return leaves;
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/links.js
	/* harmony default export */ var links = (function() {
	  var root = this, links = [];
	  root.each(function(node) {
	    if (node !== root) { // Don’t include the root’s parent, if any.
	      links.push({source: node.parent, target: node});
	    }
	  });
	  return links;
	});

	// CONCATENATED MODULE: ../node_modules/d3-hierarchy/src/hierarchy/index.js












	function hierarchy(data, children) {
	  var root = new Node(data),
	      valued = +data.value && (root.value = data.value),
	      node,
	      nodes = [root],
	      child,
	      childs,
	      i,
	      n;

	  if (children == null) children = defaultChildren;

	  while (node = nodes.pop()) {
	    if (valued) node.value = +node.data.value;
	    if ((childs = children(node.data)) && (n = childs.length)) {
	      node.children = new Array(n);
	      for (i = n - 1; i >= 0; --i) {
	        nodes.push(child = node.children[i] = new Node(childs[i]));
	        child.parent = node;
	        child.depth = node.depth + 1;
	      }
	    }
	  }

	  return root.eachBefore(computeHeight);
	}

	function node_copy() {
	  return hierarchy(this).eachBefore(copyData);
	}

	function defaultChildren(d) {
	  return d.children;
	}

	function copyData(node) {
	  node.data = node.data.data;
	}

	function computeHeight(node) {
	  var height = 0;
	  do node.height = height;
	  while ((node = node.parent) && (node.height < ++height));
	}

	function Node(data) {
	  this.data = data;
	  this.depth =
	  this.height = 0;
	  this.parent = null;
	}

	Node.prototype = hierarchy.prototype = {
	  constructor: Node,
	  count: hierarchy_count,
	  each: hierarchy_each,
	  eachAfter: eachAfter,
	  eachBefore: eachBefore,
	  sum: sum,
	  sort: hierarchy_sort,
	  path: path,
	  ancestors: ancestors,
	  descendants: hierarchy_descendants,
	  leaves: leaves,
	  links: links,
	  copy: node_copy
	};

	// CONCATENATED MODULE: ../node_modules/d3-array/src/ticks.js
	var e10 = Math.sqrt(50),
	    e5 = Math.sqrt(10),
	    e2 = Math.sqrt(2);

	/* harmony default export */ var ticks = (function(start, stop, count) {
	  var reverse,
	      i = -1,
	      n,
	      ticks,
	      step;

	  stop = +stop, start = +start, count = +count;
	  if (start === stop && count > 0) return [start];
	  if (reverse = stop < start) n = start, start = stop, stop = n;
	  if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

	  if (step > 0) {
	    start = Math.ceil(start / step);
	    stop = Math.floor(stop / step);
	    ticks = new Array(n = Math.ceil(stop - start + 1));
	    while (++i < n) ticks[i] = (start + i) * step;
	  } else {
	    start = Math.floor(start * step);
	    stop = Math.ceil(stop * step);
	    ticks = new Array(n = Math.ceil(start - stop + 1));
	    while (++i < n) ticks[i] = (start - i) / step;
	  }

	  if (reverse) ticks.reverse();

	  return ticks;
	});

	function tickIncrement(start, stop, count) {
	  var step = (stop - start) / Math.max(0, count),
	      power = Math.floor(Math.log(step) / Math.LN10),
	      error = step / Math.pow(10, power);
	  return power >= 0
	      ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
	      : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
	}

	function tickStep(start, stop, count) {
	  var step0 = Math.abs(stop - start) / Math.max(0, count),
	      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
	      error = step0 / step1;
	  if (error >= e10) step1 *= 10;
	  else if (error >= e5) step1 *= 5;
	  else if (error >= e2) step1 *= 2;
	  return stop < start ? -step1 : step1;
	}

	// CONCATENATED MODULE: ../node_modules/d3-array/src/bisector.js


	/* harmony default export */ var bisector = (function(compare) {
	  if (compare.length === 1) compare = ascendingComparator(compare);
	  return {
	    left: function(a, x, lo, hi) {
	      if (lo == null) lo = 0;
	      if (hi == null) hi = a.length;
	      while (lo < hi) {
	        var mid = lo + hi >>> 1;
	        if (compare(a[mid], x) < 0) lo = mid + 1;
	        else hi = mid;
	      }
	      return lo;
	    },
	    right: function(a, x, lo, hi) {
	      if (lo == null) lo = 0;
	      if (hi == null) hi = a.length;
	      while (lo < hi) {
	        var mid = lo + hi >>> 1;
	        if (compare(a[mid], x) > 0) hi = mid;
	        else lo = mid + 1;
	      }
	      return lo;
	    }
	  };
	});

	function ascendingComparator(f) {
	  return function(d, x) {
	    return src_ascending(f(d), x);
	  };
	}

	// CONCATENATED MODULE: ../node_modules/d3-array/src/bisect.js



	var ascendingBisect = bisector(src_ascending);
	var bisectRight = ascendingBisect.right;
	/* harmony default export */ var bisect = (bisectRight);

	// CONCATENATED MODULE: ../node_modules/d3-color/src/define.js
	/* harmony default export */ var define = (function(constructor, factory, prototype) {
	  constructor.prototype = factory.prototype = prototype;
	  prototype.constructor = constructor;
	});

	function extend(parent, definition) {
	  var prototype = Object.create(parent.prototype);
	  for (var key in definition) prototype[key] = definition[key];
	  return prototype;
	}

	// CONCATENATED MODULE: ../node_modules/d3-color/src/color.js


	function Color() {}

	var darker = 0.7;
	var brighter = 1 / darker;

	var reI = "\\s*([+-]?\\d+)\\s*",
	    reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
	    reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
	    reHex = /^#([0-9a-f]{3,8})$/,
	    reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
	    reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
	    reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
	    reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
	    reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
	    reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

	var named = {
	  aliceblue: 0xf0f8ff,
	  antiquewhite: 0xfaebd7,
	  aqua: 0x00ffff,
	  aquamarine: 0x7fffd4,
	  azure: 0xf0ffff,
	  beige: 0xf5f5dc,
	  bisque: 0xffe4c4,
	  black: 0x000000,
	  blanchedalmond: 0xffebcd,
	  blue: 0x0000ff,
	  blueviolet: 0x8a2be2,
	  brown: 0xa52a2a,
	  burlywood: 0xdeb887,
	  cadetblue: 0x5f9ea0,
	  chartreuse: 0x7fff00,
	  chocolate: 0xd2691e,
	  coral: 0xff7f50,
	  cornflowerblue: 0x6495ed,
	  cornsilk: 0xfff8dc,
	  crimson: 0xdc143c,
	  cyan: 0x00ffff,
	  darkblue: 0x00008b,
	  darkcyan: 0x008b8b,
	  darkgoldenrod: 0xb8860b,
	  darkgray: 0xa9a9a9,
	  darkgreen: 0x006400,
	  darkgrey: 0xa9a9a9,
	  darkkhaki: 0xbdb76b,
	  darkmagenta: 0x8b008b,
	  darkolivegreen: 0x556b2f,
	  darkorange: 0xff8c00,
	  darkorchid: 0x9932cc,
	  darkred: 0x8b0000,
	  darksalmon: 0xe9967a,
	  darkseagreen: 0x8fbc8f,
	  darkslateblue: 0x483d8b,
	  darkslategray: 0x2f4f4f,
	  darkslategrey: 0x2f4f4f,
	  darkturquoise: 0x00ced1,
	  darkviolet: 0x9400d3,
	  deeppink: 0xff1493,
	  deepskyblue: 0x00bfff,
	  dimgray: 0x696969,
	  dimgrey: 0x696969,
	  dodgerblue: 0x1e90ff,
	  firebrick: 0xb22222,
	  floralwhite: 0xfffaf0,
	  forestgreen: 0x228b22,
	  fuchsia: 0xff00ff,
	  gainsboro: 0xdcdcdc,
	  ghostwhite: 0xf8f8ff,
	  gold: 0xffd700,
	  goldenrod: 0xdaa520,
	  gray: 0x808080,
	  green: 0x008000,
	  greenyellow: 0xadff2f,
	  grey: 0x808080,
	  honeydew: 0xf0fff0,
	  hotpink: 0xff69b4,
	  indianred: 0xcd5c5c,
	  indigo: 0x4b0082,
	  ivory: 0xfffff0,
	  khaki: 0xf0e68c,
	  lavender: 0xe6e6fa,
	  lavenderblush: 0xfff0f5,
	  lawngreen: 0x7cfc00,
	  lemonchiffon: 0xfffacd,
	  lightblue: 0xadd8e6,
	  lightcoral: 0xf08080,
	  lightcyan: 0xe0ffff,
	  lightgoldenrodyellow: 0xfafad2,
	  lightgray: 0xd3d3d3,
	  lightgreen: 0x90ee90,
	  lightgrey: 0xd3d3d3,
	  lightpink: 0xffb6c1,
	  lightsalmon: 0xffa07a,
	  lightseagreen: 0x20b2aa,
	  lightskyblue: 0x87cefa,
	  lightslategray: 0x778899,
	  lightslategrey: 0x778899,
	  lightsteelblue: 0xb0c4de,
	  lightyellow: 0xffffe0,
	  lime: 0x00ff00,
	  limegreen: 0x32cd32,
	  linen: 0xfaf0e6,
	  magenta: 0xff00ff,
	  maroon: 0x800000,
	  mediumaquamarine: 0x66cdaa,
	  mediumblue: 0x0000cd,
	  mediumorchid: 0xba55d3,
	  mediumpurple: 0x9370db,
	  mediumseagreen: 0x3cb371,
	  mediumslateblue: 0x7b68ee,
	  mediumspringgreen: 0x00fa9a,
	  mediumturquoise: 0x48d1cc,
	  mediumvioletred: 0xc71585,
	  midnightblue: 0x191970,
	  mintcream: 0xf5fffa,
	  mistyrose: 0xffe4e1,
	  moccasin: 0xffe4b5,
	  navajowhite: 0xffdead,
	  navy: 0x000080,
	  oldlace: 0xfdf5e6,
	  olive: 0x808000,
	  olivedrab: 0x6b8e23,
	  orange: 0xffa500,
	  orangered: 0xff4500,
	  orchid: 0xda70d6,
	  palegoldenrod: 0xeee8aa,
	  palegreen: 0x98fb98,
	  paleturquoise: 0xafeeee,
	  palevioletred: 0xdb7093,
	  papayawhip: 0xffefd5,
	  peachpuff: 0xffdab9,
	  peru: 0xcd853f,
	  pink: 0xffc0cb,
	  plum: 0xdda0dd,
	  powderblue: 0xb0e0e6,
	  purple: 0x800080,
	  rebeccapurple: 0x663399,
	  red: 0xff0000,
	  rosybrown: 0xbc8f8f,
	  royalblue: 0x4169e1,
	  saddlebrown: 0x8b4513,
	  salmon: 0xfa8072,
	  sandybrown: 0xf4a460,
	  seagreen: 0x2e8b57,
	  seashell: 0xfff5ee,
	  sienna: 0xa0522d,
	  silver: 0xc0c0c0,
	  skyblue: 0x87ceeb,
	  slateblue: 0x6a5acd,
	  slategray: 0x708090,
	  slategrey: 0x708090,
	  snow: 0xfffafa,
	  springgreen: 0x00ff7f,
	  steelblue: 0x4682b4,
	  tan: 0xd2b48c,
	  teal: 0x008080,
	  thistle: 0xd8bfd8,
	  tomato: 0xff6347,
	  turquoise: 0x40e0d0,
	  violet: 0xee82ee,
	  wheat: 0xf5deb3,
	  white: 0xffffff,
	  whitesmoke: 0xf5f5f5,
	  yellow: 0xffff00,
	  yellowgreen: 0x9acd32
	};

	define(Color, color_color, {
	  copy: function(channels) {
	    return Object.assign(new this.constructor, this, channels);
	  },
	  displayable: function() {
	    return this.rgb().displayable();
	  },
	  hex: color_formatHex, // Deprecated! Use color.formatHex.
	  formatHex: color_formatHex,
	  formatHsl: color_formatHsl,
	  formatRgb: color_formatRgb,
	  toString: color_formatRgb
	});

	function color_formatHex() {
	  return this.rgb().formatHex();
	}

	function color_formatHsl() {
	  return hslConvert(this).formatHsl();
	}

	function color_formatRgb() {
	  return this.rgb().formatRgb();
	}

	function color_color(format) {
	  var m, l;
	  format = (format + "").trim().toLowerCase();
	  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
	      : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
	      : l === 8 ? new Rgb(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
	      : l === 4 ? new Rgb((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
	      : null) // invalid hex
	      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
	      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
	      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
	      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
	      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
	      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
	      : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
	      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
	      : null;
	}

	function rgbn(n) {
	  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
	}

	function rgba(r, g, b, a) {
	  if (a <= 0) r = g = b = NaN;
	  return new Rgb(r, g, b, a);
	}

	function rgbConvert(o) {
	  if (!(o instanceof Color)) o = color_color(o);
	  if (!o) return new Rgb;
	  o = o.rgb();
	  return new Rgb(o.r, o.g, o.b, o.opacity);
	}

	function color_rgb(r, g, b, opacity) {
	  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
	}

	function Rgb(r, g, b, opacity) {
	  this.r = +r;
	  this.g = +g;
	  this.b = +b;
	  this.opacity = +opacity;
	}

	define(Rgb, color_rgb, extend(Color, {
	  brighter: function(k) {
	    k = k == null ? brighter : Math.pow(brighter, k);
	    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
	  },
	  darker: function(k) {
	    k = k == null ? darker : Math.pow(darker, k);
	    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
	  },
	  rgb: function() {
	    return this;
	  },
	  displayable: function() {
	    return (-0.5 <= this.r && this.r < 255.5)
	        && (-0.5 <= this.g && this.g < 255.5)
	        && (-0.5 <= this.b && this.b < 255.5)
	        && (0 <= this.opacity && this.opacity <= 1);
	  },
	  hex: rgb_formatHex, // Deprecated! Use color.formatHex.
	  formatHex: rgb_formatHex,
	  formatRgb: rgb_formatRgb,
	  toString: rgb_formatRgb
	}));

	function rgb_formatHex() {
	  return "#" + hex(this.r) + hex(this.g) + hex(this.b);
	}

	function rgb_formatRgb() {
	  var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
	  return (a === 1 ? "rgb(" : "rgba(")
	      + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
	      + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
	      + Math.max(0, Math.min(255, Math.round(this.b) || 0))
	      + (a === 1 ? ")" : ", " + a + ")");
	}

	function hex(value) {
	  value = Math.max(0, Math.min(255, Math.round(value) || 0));
	  return (value < 16 ? "0" : "") + value.toString(16);
	}

	function hsla(h, s, l, a) {
	  if (a <= 0) h = s = l = NaN;
	  else if (l <= 0 || l >= 1) h = s = NaN;
	  else if (s <= 0) h = NaN;
	  return new Hsl(h, s, l, a);
	}

	function hslConvert(o) {
	  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
	  if (!(o instanceof Color)) o = color_color(o);
	  if (!o) return new Hsl;
	  if (o instanceof Hsl) return o;
	  o = o.rgb();
	  var r = o.r / 255,
	      g = o.g / 255,
	      b = o.b / 255,
	      min = Math.min(r, g, b),
	      max = Math.max(r, g, b),
	      h = NaN,
	      s = max - min,
	      l = (max + min) / 2;
	  if (s) {
	    if (r === max) h = (g - b) / s + (g < b) * 6;
	    else if (g === max) h = (b - r) / s + 2;
	    else h = (r - g) / s + 4;
	    s /= l < 0.5 ? max + min : 2 - max - min;
	    h *= 60;
	  } else {
	    s = l > 0 && l < 1 ? 0 : h;
	  }
	  return new Hsl(h, s, l, o.opacity);
	}

	function hsl(h, s, l, opacity) {
	  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
	}

	function Hsl(h, s, l, opacity) {
	  this.h = +h;
	  this.s = +s;
	  this.l = +l;
	  this.opacity = +opacity;
	}

	define(Hsl, hsl, extend(Color, {
	  brighter: function(k) {
	    k = k == null ? brighter : Math.pow(brighter, k);
	    return new Hsl(this.h, this.s, this.l * k, this.opacity);
	  },
	  darker: function(k) {
	    k = k == null ? darker : Math.pow(darker, k);
	    return new Hsl(this.h, this.s, this.l * k, this.opacity);
	  },
	  rgb: function() {
	    var h = this.h % 360 + (this.h < 0) * 360,
	        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
	        l = this.l,
	        m2 = l + (l < 0.5 ? l : 1 - l) * s,
	        m1 = 2 * l - m2;
	    return new Rgb(
	      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
	      hsl2rgb(h, m1, m2),
	      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
	      this.opacity
	    );
	  },
	  displayable: function() {
	    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
	        && (0 <= this.l && this.l <= 1)
	        && (0 <= this.opacity && this.opacity <= 1);
	  },
	  formatHsl: function() {
	    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
	    return (a === 1 ? "hsl(" : "hsla(")
	        + (this.h || 0) + ", "
	        + (this.s || 0) * 100 + "%, "
	        + (this.l || 0) * 100 + "%"
	        + (a === 1 ? ")" : ", " + a + ")");
	  }
	}));

	/* From FvD 13.37, CSS Color Module Level 3 */
	function hsl2rgb(h, m1, m2) {
	  return (h < 60 ? m1 + (m2 - m1) * h / 60
	      : h < 180 ? m2
	      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
	      : m1) * 255;
	}

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/constant.js
	/* harmony default export */ var src_constant = (function(x) {
	  return function() {
	    return x;
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/color.js


	function linear(a, d) {
	  return function(t) {
	    return a + t * d;
	  };
	}

	function exponential(a, b, y) {
	  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
	    return Math.pow(a + t * b, y);
	  };
	}

	function gamma(y) {
	  return (y = +y) === 1 ? nogamma : function(a, b) {
	    return b - a ? exponential(a, b, y) : src_constant(isNaN(a) ? b : a);
	  };
	}

	function nogamma(a, b) {
	  var d = b - a;
	  return d ? linear(a, d) : src_constant(isNaN(a) ? b : a);
	}

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/rgb.js





	/* harmony default export */ var src_rgb = ((function rgbGamma(y) {
	  var color = gamma(y);

	  function rgb(start, end) {
	    var r = color((start = color_rgb(start)).r, (end = color_rgb(end)).r),
	        g = color(start.g, end.g),
	        b = color(start.b, end.b),
	        opacity = nogamma(start.opacity, end.opacity);
	    return function(t) {
	      start.r = r(t);
	      start.g = g(t);
	      start.b = b(t);
	      start.opacity = opacity(t);
	      return start + "";
	    };
	  }

	  rgb.gamma = rgbGamma;

	  return rgb;
	})(1));

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/numberArray.js
	/* harmony default export */ var numberArray = (function(a, b) {
	  if (!b) b = [];
	  var n = a ? Math.min(b.length, a.length) : 0,
	      c = b.slice(),
	      i;
	  return function(t) {
	    for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
	    return c;
	  };
	});

	function isNumberArray(x) {
	  return ArrayBuffer.isView(x) && !(x instanceof DataView);
	}

	function genericArray(a, b) {
	  var nb = b ? b.length : 0,
	      na = a ? Math.min(nb, a.length) : 0,
	      x = new Array(na),
	      c = new Array(nb),
	      i;

	  for (i = 0; i < na; ++i) x[i] = src_value(a[i], b[i]);
	  for (; i < nb; ++i) c[i] = b[i];

	  return function(t) {
	    for (i = 0; i < na; ++i) c[i] = x[i](t);
	    return c;
	  };
	}

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/date.js
	/* harmony default export */ var date = (function(a, b) {
	  var d = new Date;
	  return a = +a, b = +b, function(t) {
	    return d.setTime(a * (1 - t) + b * t), d;
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/number.js
	/* harmony default export */ var number = (function(a, b) {
	  return a = +a, b = +b, function(t) {
	    return a * (1 - t) + b * t;
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/object.js


	/* harmony default export */ var object = (function(a, b) {
	  var i = {},
	      c = {},
	      k;

	  if (a === null || typeof a !== "object") a = {};
	  if (b === null || typeof b !== "object") b = {};

	  for (k in b) {
	    if (k in a) {
	      i[k] = src_value(a[k], b[k]);
	    } else {
	      c[k] = b[k];
	    }
	  }

	  return function(t) {
	    for (k in i) c[k] = i[k](t);
	    return c;
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/string.js


	var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
	    reB = new RegExp(reA.source, "g");

	function string_zero(b) {
	  return function() {
	    return b;
	  };
	}

	function one(b) {
	  return function(t) {
	    return b(t) + "";
	  };
	}

	/* harmony default export */ var string = (function(a, b) {
	  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
	      am, // current match in a
	      bm, // current match in b
	      bs, // string preceding current number in b, if any
	      i = -1, // index in s
	      s = [], // string constants and placeholders
	      q = []; // number interpolators

	  // Coerce inputs to strings.
	  a = a + "", b = b + "";

	  // Interpolate pairs of numbers in a & b.
	  while ((am = reA.exec(a))
	      && (bm = reB.exec(b))) {
	    if ((bs = bm.index) > bi) { // a string precedes the next number in b
	      bs = b.slice(bi, bs);
	      if (s[i]) s[i] += bs; // coalesce with previous string
	      else s[++i] = bs;
	    }
	    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
	      if (s[i]) s[i] += bm; // coalesce with previous string
	      else s[++i] = bm;
	    } else { // interpolate non-matching numbers
	      s[++i] = null;
	      q.push({i: i, x: number(am, bm)});
	    }
	    bi = reB.lastIndex;
	  }

	  // Add remains of b.
	  if (bi < b.length) {
	    bs = b.slice(bi);
	    if (s[i]) s[i] += bs; // coalesce with previous string
	    else s[++i] = bs;
	  }

	  // Special optimization for only a single match.
	  // Otherwise, interpolate each of the numbers and rejoin the string.
	  return s.length < 2 ? (q[0]
	      ? one(q[0].x)
	      : string_zero(b))
	      : (b = q.length, function(t) {
	          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
	          return s.join("");
	        });
	});

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/value.js










	/* harmony default export */ var src_value = (function(a, b) {
	  var t = typeof b, c;
	  return b == null || t === "boolean" ? src_constant(b)
	      : (t === "number" ? number
	      : t === "string" ? ((c = color_color(b)) ? (b = c, src_rgb) : string)
	      : b instanceof color_color ? src_rgb
	      : b instanceof Date ? date
	      : isNumberArray(b) ? numberArray
	      : Array.isArray(b) ? genericArray
	      : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
	      : number)(a, b);
	});

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/round.js
	/* harmony default export */ var src_round = (function(a, b) {
	  return a = +a, b = +b, function(t) {
	    return Math.round(a * (1 - t) + b * t);
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-scale/src/constant.js
	/* harmony default export */ var d3_scale_src_constant = (function(x) {
	  return function() {
	    return x;
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-scale/src/number.js
	/* harmony default export */ var src_number = (function(x) {
	  return +x;
	});

	// CONCATENATED MODULE: ../node_modules/d3-scale/src/continuous.js





	var unit = [0, 1];

	function continuous_identity(x) {
	  return x;
	}

	function normalize(a, b) {
	  return (b -= (a = +a))
	      ? function(x) { return (x - a) / b; }
	      : d3_scale_src_constant(isNaN(b) ? NaN : 0.5);
	}

	function clamper(a, b) {
	  var t;
	  if (a > b) t = a, a = b, b = t;
	  return function(x) { return Math.max(a, Math.min(b, x)); };
	}

	// normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
	// interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
	function bimap(domain, range, interpolate) {
	  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
	  if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
	  else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
	  return function(x) { return r0(d0(x)); };
	}

	function polymap(domain, range, interpolate) {
	  var j = Math.min(domain.length, range.length) - 1,
	      d = new Array(j),
	      r = new Array(j),
	      i = -1;

	  // Reverse descending domains.
	  if (domain[j] < domain[0]) {
	    domain = domain.slice().reverse();
	    range = range.slice().reverse();
	  }

	  while (++i < j) {
	    d[i] = normalize(domain[i], domain[i + 1]);
	    r[i] = interpolate(range[i], range[i + 1]);
	  }

	  return function(x) {
	    var i = bisect(domain, x, 1, j) - 1;
	    return r[i](d[i](x));
	  };
	}

	function copy(source, target) {
	  return target
	      .domain(source.domain())
	      .range(source.range())
	      .interpolate(source.interpolate())
	      .clamp(source.clamp())
	      .unknown(source.unknown());
	}

	function transformer() {
	  var domain = unit,
	      range = unit,
	      interpolate = src_value,
	      transform,
	      untransform,
	      unknown,
	      clamp = continuous_identity,
	      piecewise,
	      output,
	      input;

	  function rescale() {
	    var n = Math.min(domain.length, range.length);
	    if (clamp !== continuous_identity) clamp = clamper(domain[0], domain[n - 1]);
	    piecewise = n > 2 ? polymap : bimap;
	    output = input = null;
	    return scale;
	  }

	  function scale(x) {
	    return isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
	  }

	  scale.invert = function(y) {
	    return clamp(untransform((input || (input = piecewise(range, domain.map(transform), number)))(y)));
	  };

	  scale.domain = function(_) {
	    return arguments.length ? (domain = Array.from(_, src_number), rescale()) : domain.slice();
	  };

	  scale.range = function(_) {
	    return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
	  };

	  scale.rangeRound = function(_) {
	    return range = Array.from(_), interpolate = src_round, rescale();
	  };

	  scale.clamp = function(_) {
	    return arguments.length ? (clamp = _ ? true : continuous_identity, rescale()) : clamp !== continuous_identity;
	  };

	  scale.interpolate = function(_) {
	    return arguments.length ? (interpolate = _, rescale()) : interpolate;
	  };

	  scale.unknown = function(_) {
	    return arguments.length ? (unknown = _, scale) : unknown;
	  };

	  return function(t, u) {
	    transform = t, untransform = u;
	    return rescale();
	  };
	}

	function continuous() {
	  return transformer()(continuous_identity, continuous_identity);
	}

	// CONCATENATED MODULE: ../node_modules/d3-scale/src/init.js
	function initRange(domain, range) {
	  switch (arguments.length) {
	    case 0: break;
	    case 1: this.range(domain); break;
	    default: this.range(range).domain(domain); break;
	  }
	  return this;
	}

	// CONCATENATED MODULE: ../node_modules/d3-format/src/precisionPrefix.js


	/* harmony default export */ var precisionPrefix = (function(step, value) {
	  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(src_exponent(value) / 3))) * 3 - src_exponent(Math.abs(step)));
	});

	// CONCATENATED MODULE: ../node_modules/d3-format/src/precisionRound.js


	/* harmony default export */ var precisionRound = (function(step, max) {
	  step = Math.abs(step), max = Math.abs(max) - step;
	  return Math.max(0, src_exponent(max) - src_exponent(step)) + 1;
	});

	// CONCATENATED MODULE: ../node_modules/d3-format/src/precisionFixed.js


	/* harmony default export */ var precisionFixed = (function(step) {
	  return Math.max(0, -src_exponent(Math.abs(step)));
	});

	// CONCATENATED MODULE: ../node_modules/d3-scale/src/tickFormat.js



	/* harmony default export */ var tickFormat = (function(start, stop, count, specifier) {
	  var step = tickStep(start, stop, count),
	      precision;
	  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
	  switch (specifier.type) {
	    case "s": {
	      var value = Math.max(Math.abs(start), Math.abs(stop));
	      if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
	      return defaultLocale_formatPrefix(specifier, value);
	    }
	    case "":
	    case "e":
	    case "g":
	    case "p":
	    case "r": {
	      if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
	      break;
	    }
	    case "f":
	    case "%": {
	      if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
	      break;
	    }
	  }
	  return defaultLocale_format(specifier);
	});

	// CONCATENATED MODULE: ../node_modules/d3-scale/src/linear.js





	function linearish(scale) {
	  var domain = scale.domain;

	  scale.ticks = function(count) {
	    var d = domain();
	    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
	  };

	  scale.tickFormat = function(count, specifier) {
	    var d = domain();
	    return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
	  };

	  scale.nice = function(count) {
	    if (count == null) count = 10;

	    var d = domain(),
	        i0 = 0,
	        i1 = d.length - 1,
	        start = d[i0],
	        stop = d[i1],
	        step;

	    if (stop < start) {
	      step = start, start = stop, stop = step;
	      step = i0, i0 = i1, i1 = step;
	    }

	    step = tickIncrement(start, stop, count);

	    if (step > 0) {
	      start = Math.floor(start / step) * step;
	      stop = Math.ceil(stop / step) * step;
	      step = tickIncrement(start, stop, count);
	    } else if (step < 0) {
	      start = Math.ceil(start * step) / step;
	      stop = Math.floor(stop * step) / step;
	      step = tickIncrement(start, stop, count);
	    }

	    if (step > 0) {
	      d[i0] = Math.floor(start / step) * step;
	      d[i1] = Math.ceil(stop / step) * step;
	      domain(d);
	    } else if (step < 0) {
	      d[i0] = Math.ceil(start * step) / step;
	      d[i1] = Math.floor(stop * step) / step;
	      domain(d);
	    }

	    return scale;
	  };

	  return scale;
	}

	function linear_linear() {
	  var scale = continuous();

	  scale.copy = function() {
	    return copy(scale, linear_linear());
	  };

	  initRange.apply(scale, arguments);

	  return linearish(scale);
	}

	function cubicInOut(t) {
	  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
	}

	// CONCATENATED MODULE: ../node_modules/d3-dispatch/src/dispatch.js
	var noop = {value: function() {}};

	function dispatch_dispatch() {
	  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
	    if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
	    _[t] = [];
	  }
	  return new Dispatch(_);
	}

	function Dispatch(_) {
	  this._ = _;
	}

	function dispatch_parseTypenames(typenames, types) {
	  return typenames.trim().split(/^|\s+/).map(function(t) {
	    var name = "", i = t.indexOf(".");
	    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
	    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
	    return {type: t, name: name};
	  });
	}

	Dispatch.prototype = dispatch_dispatch.prototype = {
	  constructor: Dispatch,
	  on: function(typename, callback) {
	    var _ = this._,
	        T = dispatch_parseTypenames(typename + "", _),
	        t,
	        i = -1,
	        n = T.length;

	    // If no callback was specified, return the callback of the given type and name.
	    if (arguments.length < 2) {
	      while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
	      return;
	    }

	    // If a type was specified, set the callback for the given type and name.
	    // Otherwise, if a null callback was specified, remove callbacks of the given name.
	    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
	    while (++i < n) {
	      if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
	      else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
	    }

	    return this;
	  },
	  copy: function() {
	    var copy = {}, _ = this._;
	    for (var t in _) copy[t] = _[t].slice();
	    return new Dispatch(copy);
	  },
	  call: function(type, that) {
	    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
	    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
	    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
	  },
	  apply: function(type, that, args) {
	    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
	    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
	  }
	};

	function get(type, name) {
	  for (var i = 0, n = type.length, c; i < n; ++i) {
	    if ((c = type[i]).name === name) {
	      return c.value;
	    }
	  }
	}

	function set(type, name, callback) {
	  for (var i = 0, n = type.length; i < n; ++i) {
	    if (type[i].name === name) {
	      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
	      break;
	    }
	  }
	  if (callback != null) type.push({name: name, value: callback});
	  return type;
	}

	/* harmony default export */ var src_dispatch = (dispatch_dispatch);

	// CONCATENATED MODULE: ../node_modules/d3-timer/src/timer.js
	var timer_frame = 0, // is an animation frame pending?
	    timeout = 0, // is a timeout pending?
	    interval = 0, // are any timers active?
	    pokeDelay = 1000, // how frequently we check for clock skew
	    taskHead,
	    taskTail,
	    clockLast = 0,
	    clockNow = 0,
	    clockSkew = 0,
	    clock = typeof performance === "object" && performance.now ? performance : Date,
	    setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

	function now() {
	  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
	}

	function clearNow() {
	  clockNow = 0;
	}

	function Timer() {
	  this._call =
	  this._time =
	  this._next = null;
	}

	Timer.prototype = timer.prototype = {
	  constructor: Timer,
	  restart: function(callback, delay, time) {
	    if (typeof callback !== "function") throw new TypeError("callback is not a function");
	    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
	    if (!this._next && taskTail !== this) {
	      if (taskTail) taskTail._next = this;
	      else taskHead = this;
	      taskTail = this;
	    }
	    this._call = callback;
	    this._time = time;
	    sleep();
	  },
	  stop: function() {
	    if (this._call) {
	      this._call = null;
	      this._time = Infinity;
	      sleep();
	    }
	  }
	};

	function timer(callback, delay, time) {
	  var t = new Timer;
	  t.restart(callback, delay, time);
	  return t;
	}

	function timerFlush() {
	  now(); // Get the current time, if not already set.
	  ++timer_frame; // Pretend we’ve set an alarm, if we haven’t already.
	  var t = taskHead, e;
	  while (t) {
	    if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
	    t = t._next;
	  }
	  --timer_frame;
	}

	function wake() {
	  clockNow = (clockLast = clock.now()) + clockSkew;
	  timer_frame = timeout = 0;
	  try {
	    timerFlush();
	  } finally {
	    timer_frame = 0;
	    nap();
	    clockNow = 0;
	  }
	}

	function poke() {
	  var now = clock.now(), delay = now - clockLast;
	  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
	}

	function nap() {
	  var t0, t1 = taskHead, t2, time = Infinity;
	  while (t1) {
	    if (t1._call) {
	      if (time > t1._time) time = t1._time;
	      t0 = t1, t1 = t1._next;
	    } else {
	      t2 = t1._next, t1._next = null;
	      t1 = t0 ? t0._next = t2 : taskHead = t2;
	    }
	  }
	  taskTail = t0;
	  sleep(time);
	}

	function sleep(time) {
	  if (timer_frame) return; // Soonest alarm already set, or will be.
	  if (timeout) timeout = clearTimeout(timeout);
	  var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
	  if (delay > 24) {
	    if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
	    if (interval) interval = clearInterval(interval);
	  } else {
	    if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
	    timer_frame = 1, setFrame(wake);
	  }
	}

	// CONCATENATED MODULE: ../node_modules/d3-timer/src/timeout.js


	/* harmony default export */ var src_timeout = (function(callback, delay, time) {
	  var t = new Timer;
	  delay = delay == null ? 0 : +delay;
	  t.restart(function(elapsed) {
	    t.stop();
	    callback(elapsed + delay);
	  }, delay, time);
	  return t;
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/schedule.js



	var emptyOn = src_dispatch("start", "end", "cancel", "interrupt");
	var emptyTween = [];

	var CREATED = 0;
	var SCHEDULED = 1;
	var STARTING = 2;
	var STARTED = 3;
	var RUNNING = 4;
	var ENDING = 5;
	var ENDED = 6;

	/* harmony default export */ var transition_schedule = (function(node, name, id, index, group, timing) {
	  var schedules = node.__transition;
	  if (!schedules) node.__transition = {};
	  else if (id in schedules) return;
	  schedule_create(node, id, {
	    name: name,
	    index: index, // For context during callback.
	    group: group, // For context during callback.
	    on: emptyOn,
	    tween: emptyTween,
	    time: timing.time,
	    delay: timing.delay,
	    duration: timing.duration,
	    ease: timing.ease,
	    timer: null,
	    state: CREATED
	  });
	});

	function init(node, id) {
	  var schedule = schedule_get(node, id);
	  if (schedule.state > CREATED) throw new Error("too late; already scheduled");
	  return schedule;
	}

	function schedule_set(node, id) {
	  var schedule = schedule_get(node, id);
	  if (schedule.state > STARTED) throw new Error("too late; already running");
	  return schedule;
	}

	function schedule_get(node, id) {
	  var schedule = node.__transition;
	  if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
	  return schedule;
	}

	function schedule_create(node, id, self) {
	  var schedules = node.__transition,
	      tween;

	  // Initialize the self timer when the transition is created.
	  // Note the actual delay is not known until the first callback!
	  schedules[id] = self;
	  self.timer = timer(schedule, 0, self.time);

	  function schedule(elapsed) {
	    self.state = SCHEDULED;
	    self.timer.restart(start, self.delay, self.time);

	    // If the elapsed delay is less than our first sleep, start immediately.
	    if (self.delay <= elapsed) start(elapsed - self.delay);
	  }

	  function start(elapsed) {
	    var i, j, n, o;

	    // If the state is not SCHEDULED, then we previously errored on start.
	    if (self.state !== SCHEDULED) return stop();

	    for (i in schedules) {
	      o = schedules[i];
	      if (o.name !== self.name) continue;

	      // While this element already has a starting transition during this frame,
	      // defer starting an interrupting transition until that transition has a
	      // chance to tick (and possibly end); see d3/d3-transition#54!
	      if (o.state === STARTED) return src_timeout(start);

	      // Interrupt the active transition, if any.
	      if (o.state === RUNNING) {
	        o.state = ENDED;
	        o.timer.stop();
	        o.on.call("interrupt", node, node.__data__, o.index, o.group);
	        delete schedules[i];
	      }

	      // Cancel any pre-empted transitions.
	      else if (+i < id) {
	        o.state = ENDED;
	        o.timer.stop();
	        o.on.call("cancel", node, node.__data__, o.index, o.group);
	        delete schedules[i];
	      }
	    }

	    // Defer the first tick to end of the current frame; see d3/d3#1576.
	    // Note the transition may be canceled after start and before the first tick!
	    // Note this must be scheduled before the start event; see d3/d3-transition#16!
	    // Assuming this is successful, subsequent callbacks go straight to tick.
	    src_timeout(function() {
	      if (self.state === STARTED) {
	        self.state = RUNNING;
	        self.timer.restart(tick, self.delay, self.time);
	        tick(elapsed);
	      }
	    });

	    // Dispatch the start event.
	    // Note this must be done before the tween are initialized.
	    self.state = STARTING;
	    self.on.call("start", node, node.__data__, self.index, self.group);
	    if (self.state !== STARTING) return; // interrupted
	    self.state = STARTED;

	    // Initialize the tween, deleting null tween.
	    tween = new Array(n = self.tween.length);
	    for (i = 0, j = -1; i < n; ++i) {
	      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
	        tween[++j] = o;
	      }
	    }
	    tween.length = j + 1;
	  }

	  function tick(elapsed) {
	    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
	        i = -1,
	        n = tween.length;

	    while (++i < n) {
	      tween[i].call(node, t);
	    }

	    // Dispatch the end event.
	    if (self.state === ENDING) {
	      self.on.call("end", node, node.__data__, self.index, self.group);
	      stop();
	    }
	  }

	  function stop() {
	    self.state = ENDED;
	    self.timer.stop();
	    delete schedules[id];
	    for (var i in schedules) return; // eslint-disable-line no-unused-vars
	    delete node.__transition;
	  }
	}

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/interrupt.js


	/* harmony default export */ var interrupt = (function(node, name) {
	  var schedules = node.__transition,
	      schedule,
	      active,
	      empty = true,
	      i;

	  if (!schedules) return;

	  name = name == null ? null : name + "";

	  for (i in schedules) {
	    if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
	    active = schedule.state > STARTING && schedule.state < ENDING;
	    schedule.state = ENDED;
	    schedule.timer.stop();
	    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
	    delete schedules[i];
	  }

	  if (empty) delete node.__transition;
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/selection/interrupt.js


	/* harmony default export */ var selection_interrupt = (function(name) {
	  return this.each(function() {
	    interrupt(this, name);
	  });
	});

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/transform/decompose.js
	var degrees = 180 / Math.PI;

	var decompose_identity = {
	  translateX: 0,
	  translateY: 0,
	  rotate: 0,
	  skewX: 0,
	  scaleX: 1,
	  scaleY: 1
	};

	/* harmony default export */ var decompose = (function(a, b, c, d, e, f) {
	  var scaleX, scaleY, skewX;
	  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
	  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
	  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
	  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
	  return {
	    translateX: e,
	    translateY: f,
	    rotate: Math.atan2(b, a) * degrees,
	    skewX: Math.atan(skewX) * degrees,
	    scaleX: scaleX,
	    scaleY: scaleY
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/transform/parse.js


	var cssNode,
	    cssRoot,
	    cssView,
	    svgNode;

	function parseCss(value) {
	  if (value === "none") return decompose_identity;
	  if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
	  cssNode.style.transform = value;
	  value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
	  cssRoot.removeChild(cssNode);
	  value = value.slice(7, -1).split(",");
	  return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
	}

	function parseSvg(value) {
	  if (value == null) return decompose_identity;
	  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
	  svgNode.setAttribute("transform", value);
	  if (!(value = svgNode.transform.baseVal.consolidate())) return decompose_identity;
	  value = value.matrix;
	  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
	}

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/transform/index.js



	function interpolateTransform(parse, pxComma, pxParen, degParen) {

	  function pop(s) {
	    return s.length ? s.pop() + " " : "";
	  }

	  function translate(xa, ya, xb, yb, s, q) {
	    if (xa !== xb || ya !== yb) {
	      var i = s.push("translate(", null, pxComma, null, pxParen);
	      q.push({i: i - 4, x: number(xa, xb)}, {i: i - 2, x: number(ya, yb)});
	    } else if (xb || yb) {
	      s.push("translate(" + xb + pxComma + yb + pxParen);
	    }
	  }

	  function rotate(a, b, s, q) {
	    if (a !== b) {
	      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
	      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: number(a, b)});
	    } else if (b) {
	      s.push(pop(s) + "rotate(" + b + degParen);
	    }
	  }

	  function skewX(a, b, s, q) {
	    if (a !== b) {
	      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: number(a, b)});
	    } else if (b) {
	      s.push(pop(s) + "skewX(" + b + degParen);
	    }
	  }

	  function scale(xa, ya, xb, yb, s, q) {
	    if (xa !== xb || ya !== yb) {
	      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
	      q.push({i: i - 4, x: number(xa, xb)}, {i: i - 2, x: number(ya, yb)});
	    } else if (xb !== 1 || yb !== 1) {
	      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
	    }
	  }

	  return function(a, b) {
	    var s = [], // string constants and placeholders
	        q = []; // number interpolators
	    a = parse(a), b = parse(b);
	    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
	    rotate(a.rotate, b.rotate, s, q);
	    skewX(a.skewX, b.skewX, s, q);
	    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
	    a = b = null; // gc
	    return function(t) {
	      var i = -1, n = q.length, o;
	      while (++i < n) s[(o = q[i]).i] = o.x(t);
	      return s.join("");
	    };
	  };
	}

	var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
	var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/tween.js


	function tweenRemove(id, name) {
	  var tween0, tween1;
	  return function() {
	    var schedule = schedule_set(this, id),
	        tween = schedule.tween;

	    // If this node shared tween with the previous node,
	    // just assign the updated shared tween and we’re done!
	    // Otherwise, copy-on-write.
	    if (tween !== tween0) {
	      tween1 = tween0 = tween;
	      for (var i = 0, n = tween1.length; i < n; ++i) {
	        if (tween1[i].name === name) {
	          tween1 = tween1.slice();
	          tween1.splice(i, 1);
	          break;
	        }
	      }
	    }

	    schedule.tween = tween1;
	  };
	}

	function tweenFunction(id, name, value) {
	  var tween0, tween1;
	  if (typeof value !== "function") throw new Error;
	  return function() {
	    var schedule = schedule_set(this, id),
	        tween = schedule.tween;

	    // If this node shared tween with the previous node,
	    // just assign the updated shared tween and we’re done!
	    // Otherwise, copy-on-write.
	    if (tween !== tween0) {
	      tween1 = (tween0 = tween).slice();
	      for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
	        if (tween1[i].name === name) {
	          tween1[i] = t;
	          break;
	        }
	      }
	      if (i === n) tween1.push(t);
	    }

	    schedule.tween = tween1;
	  };
	}

	/* harmony default export */ var transition_tween = (function(name, value) {
	  var id = this._id;

	  name += "";

	  if (arguments.length < 2) {
	    var tween = schedule_get(this.node(), id).tween;
	    for (var i = 0, n = tween.length, t; i < n; ++i) {
	      if ((t = tween[i]).name === name) {
	        return t.value;
	      }
	    }
	    return null;
	  }

	  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
	});

	function tweenValue(transition, name, value) {
	  var id = transition._id;

	  transition.each(function() {
	    var schedule = schedule_set(this, id);
	    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
	  });

	  return function(node) {
	    return schedule_get(node, id).value[name];
	  };
	}

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/interpolate.js



	/* harmony default export */ var transition_interpolate = (function(a, b) {
	  var c;
	  return (typeof b === "number" ? number
	      : b instanceof color_color ? src_rgb
	      : (c = color_color(b)) ? (b = c, src_rgb)
	      : string)(a, b);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/attr.js





	function attr_attrRemove(name) {
	  return function() {
	    this.removeAttribute(name);
	  };
	}

	function attr_attrRemoveNS(fullname) {
	  return function() {
	    this.removeAttributeNS(fullname.space, fullname.local);
	  };
	}

	function attr_attrConstant(name, interpolate, value1) {
	  var string00,
	      string1 = value1 + "",
	      interpolate0;
	  return function() {
	    var string0 = this.getAttribute(name);
	    return string0 === string1 ? null
	        : string0 === string00 ? interpolate0
	        : interpolate0 = interpolate(string00 = string0, value1);
	  };
	}

	function attr_attrConstantNS(fullname, interpolate, value1) {
	  var string00,
	      string1 = value1 + "",
	      interpolate0;
	  return function() {
	    var string0 = this.getAttributeNS(fullname.space, fullname.local);
	    return string0 === string1 ? null
	        : string0 === string00 ? interpolate0
	        : interpolate0 = interpolate(string00 = string0, value1);
	  };
	}

	function attr_attrFunction(name, interpolate, value) {
	  var string00,
	      string10,
	      interpolate0;
	  return function() {
	    var string0, value1 = value(this), string1;
	    if (value1 == null) return void this.removeAttribute(name);
	    string0 = this.getAttribute(name);
	    string1 = value1 + "";
	    return string0 === string1 ? null
	        : string0 === string00 && string1 === string10 ? interpolate0
	        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
	  };
	}

	function attr_attrFunctionNS(fullname, interpolate, value) {
	  var string00,
	      string10,
	      interpolate0;
	  return function() {
	    var string0, value1 = value(this), string1;
	    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
	    string0 = this.getAttributeNS(fullname.space, fullname.local);
	    string1 = value1 + "";
	    return string0 === string1 ? null
	        : string0 === string00 && string1 === string10 ? interpolate0
	        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
	  };
	}

	/* harmony default export */ var transition_attr = (function(name, value) {
	  var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : transition_interpolate;
	  return this.attrTween(name, typeof value === "function"
	      ? (fullname.local ? attr_attrFunctionNS : attr_attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
	      : value == null ? (fullname.local ? attr_attrRemoveNS : attr_attrRemove)(fullname)
	      : (fullname.local ? attr_attrConstantNS : attr_attrConstant)(fullname, i, value));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/attrTween.js


	function attrInterpolate(name, i) {
	  return function(t) {
	    this.setAttribute(name, i.call(this, t));
	  };
	}

	function attrInterpolateNS(fullname, i) {
	  return function(t) {
	    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
	  };
	}

	function attrTweenNS(fullname, value) {
	  var t0, i0;
	  function tween() {
	    var i = value.apply(this, arguments);
	    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
	    return t0;
	  }
	  tween._value = value;
	  return tween;
	}

	function attrTween(name, value) {
	  var t0, i0;
	  function tween() {
	    var i = value.apply(this, arguments);
	    if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
	    return t0;
	  }
	  tween._value = value;
	  return tween;
	}

	/* harmony default export */ var transition_attrTween = (function(name, value) {
	  var key = "attr." + name;
	  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
	  if (value == null) return this.tween(key, null);
	  if (typeof value !== "function") throw new Error;
	  var fullname = namespace(name);
	  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/delay.js


	function delayFunction(id, value) {
	  return function() {
	    init(this, id).delay = +value.apply(this, arguments);
	  };
	}

	function delayConstant(id, value) {
	  return value = +value, function() {
	    init(this, id).delay = value;
	  };
	}

	/* harmony default export */ var transition_delay = (function(value) {
	  var id = this._id;

	  return arguments.length
	      ? this.each((typeof value === "function"
	          ? delayFunction
	          : delayConstant)(id, value))
	      : schedule_get(this.node(), id).delay;
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/duration.js


	function durationFunction(id, value) {
	  return function() {
	    schedule_set(this, id).duration = +value.apply(this, arguments);
	  };
	}

	function durationConstant(id, value) {
	  return value = +value, function() {
	    schedule_set(this, id).duration = value;
	  };
	}

	/* harmony default export */ var duration = (function(value) {
	  var id = this._id;

	  return arguments.length
	      ? this.each((typeof value === "function"
	          ? durationFunction
	          : durationConstant)(id, value))
	      : schedule_get(this.node(), id).duration;
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/ease.js


	function easeConstant(id, value) {
	  if (typeof value !== "function") throw new Error;
	  return function() {
	    schedule_set(this, id).ease = value;
	  };
	}

	/* harmony default export */ var ease = (function(value) {
	  var id = this._id;

	  return arguments.length
	      ? this.each(easeConstant(id, value))
	      : schedule_get(this.node(), id).ease;
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/filter.js



	/* harmony default export */ var transition_filter = (function(match) {
	  if (typeof match !== "function") match = matcher(match);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
	      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
	        subgroup.push(node);
	      }
	    }
	  }

	  return new Transition(subgroups, this._parents, this._name, this._id);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/merge.js


	/* harmony default export */ var transition_merge = (function(transition) {
	  if (transition._id !== this._id) throw new Error;

	  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
	    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
	      if (node = group0[i] || group1[i]) {
	        merge[i] = node;
	      }
	    }
	  }

	  for (; j < m0; ++j) {
	    merges[j] = groups0[j];
	  }

	  return new Transition(merges, this._parents, this._name, this._id);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/on.js


	function on_start(name) {
	  return (name + "").trim().split(/^|\s+/).every(function(t) {
	    var i = t.indexOf(".");
	    if (i >= 0) t = t.slice(0, i);
	    return !t || t === "start";
	  });
	}

	function onFunction(id, name, listener) {
	  var on0, on1, sit = on_start(name) ? init : schedule_set;
	  return function() {
	    var schedule = sit(this, id),
	        on = schedule.on;

	    // If this node shared a dispatch with the previous node,
	    // just assign the updated shared dispatch and we’re done!
	    // Otherwise, copy-on-write.
	    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

	    schedule.on = on1;
	  };
	}

	/* harmony default export */ var transition_on = (function(name, listener) {
	  var id = this._id;

	  return arguments.length < 2
	      ? schedule_get(this.node(), id).on.on(name)
	      : this.each(onFunction(id, name, listener));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/remove.js
	function removeFunction(id) {
	  return function() {
	    var parent = this.parentNode;
	    for (var i in this.__transition) if (+i !== id) return;
	    if (parent) parent.removeChild(this);
	  };
	}

	/* harmony default export */ var transition_remove = (function() {
	  return this.on("end.remove", removeFunction(this._id));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/select.js




	/* harmony default export */ var transition_select = (function(select) {
	  var name = this._name,
	      id = this._id;

	  if (typeof select !== "function") select = src_selector(select);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
	      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
	        if ("__data__" in node) subnode.__data__ = node.__data__;
	        subgroup[i] = subnode;
	        transition_schedule(subgroup[i], name, id, i, subgroup, schedule_get(node, id));
	      }
	    }
	  }

	  return new Transition(subgroups, this._parents, name, id);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/selectAll.js




	/* harmony default export */ var transition_selectAll = (function(select) {
	  var name = this._name,
	      id = this._id;

	  if (typeof select !== "function") select = selectorAll(select);

	  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        for (var children = select.call(node, node.__data__, i, group), child, inherit = schedule_get(node, id), k = 0, l = children.length; k < l; ++k) {
	          if (child = children[k]) {
	            transition_schedule(child, name, id, k, children, inherit);
	          }
	        }
	        subgroups.push(children);
	        parents.push(node);
	      }
	    }
	  }

	  return new Transition(subgroups, parents, name, id);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/selection.js


	var selection_Selection = src_selection.prototype.constructor;

	/* harmony default export */ var transition_selection = (function() {
	  return new selection_Selection(this._groups, this._parents);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/style.js






	function styleNull(name, interpolate) {
	  var string00,
	      string10,
	      interpolate0;
	  return function() {
	    var string0 = styleValue(this, name),
	        string1 = (this.style.removeProperty(name), styleValue(this, name));
	    return string0 === string1 ? null
	        : string0 === string00 && string1 === string10 ? interpolate0
	        : interpolate0 = interpolate(string00 = string0, string10 = string1);
	  };
	}

	function style_styleRemove(name) {
	  return function() {
	    this.style.removeProperty(name);
	  };
	}

	function style_styleConstant(name, interpolate, value1) {
	  var string00,
	      string1 = value1 + "",
	      interpolate0;
	  return function() {
	    var string0 = styleValue(this, name);
	    return string0 === string1 ? null
	        : string0 === string00 ? interpolate0
	        : interpolate0 = interpolate(string00 = string0, value1);
	  };
	}

	function style_styleFunction(name, interpolate, value) {
	  var string00,
	      string10,
	      interpolate0;
	  return function() {
	    var string0 = styleValue(this, name),
	        value1 = value(this),
	        string1 = value1 + "";
	    if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
	    return string0 === string1 ? null
	        : string0 === string00 && string1 === string10 ? interpolate0
	        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
	  };
	}

	function styleMaybeRemove(id, name) {
	  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
	  return function() {
	    var schedule = schedule_set(this, id),
	        on = schedule.on,
	        listener = schedule.value[key] == null ? remove || (remove = style_styleRemove(name)) : undefined;

	    // If this node shared a dispatch with the previous node,
	    // just assign the updated shared dispatch and we’re done!
	    // Otherwise, copy-on-write.
	    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

	    schedule.on = on1;
	  };
	}

	/* harmony default export */ var transition_style = (function(name, value, priority) {
	  var i = (name += "") === "transform" ? interpolateTransformCss : transition_interpolate;
	  return value == null ? this
	      .styleTween(name, styleNull(name, i))
	      .on("end.style." + name, style_styleRemove(name))
	    : typeof value === "function" ? this
	      .styleTween(name, style_styleFunction(name, i, tweenValue(this, "style." + name, value)))
	      .each(styleMaybeRemove(this._id, name))
	    : this
	      .styleTween(name, style_styleConstant(name, i, value), priority)
	      .on("end.style." + name, null);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/styleTween.js
	function styleInterpolate(name, i, priority) {
	  return function(t) {
	    this.style.setProperty(name, i.call(this, t), priority);
	  };
	}

	function styleTween(name, value, priority) {
	  var t, i0;
	  function tween() {
	    var i = value.apply(this, arguments);
	    if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
	    return t;
	  }
	  tween._value = value;
	  return tween;
	}

	/* harmony default export */ var transition_styleTween = (function(name, value, priority) {
	  var key = "style." + (name += "");
	  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
	  if (value == null) return this.tween(key, null);
	  if (typeof value !== "function") throw new Error;
	  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/text.js


	function text_textConstant(value) {
	  return function() {
	    this.textContent = value;
	  };
	}

	function text_textFunction(value) {
	  return function() {
	    var value1 = value(this);
	    this.textContent = value1 == null ? "" : value1;
	  };
	}

	/* harmony default export */ var transition_text = (function(value) {
	  return this.tween("text", typeof value === "function"
	      ? text_textFunction(tweenValue(this, "text", value))
	      : text_textConstant(value == null ? "" : value + ""));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/textTween.js
	function textInterpolate(i) {
	  return function(t) {
	    this.textContent = i.call(this, t);
	  };
	}

	function textTween(value) {
	  var t0, i0;
	  function tween() {
	    var i = value.apply(this, arguments);
	    if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
	    return t0;
	  }
	  tween._value = value;
	  return tween;
	}

	/* harmony default export */ var transition_textTween = (function(value) {
	  var key = "text";
	  if (arguments.length < 1) return (key = this.tween(key)) && key._value;
	  if (value == null) return this.tween(key, null);
	  if (typeof value !== "function") throw new Error;
	  return this.tween(key, textTween(value));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/transition.js



	/* harmony default export */ var transition_transition = (function() {
	  var name = this._name,
	      id0 = this._id,
	      id1 = newId();

	  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        var inherit = schedule_get(node, id0);
	        transition_schedule(node, name, id1, i, group, {
	          time: inherit.time + inherit.delay + inherit.duration,
	          delay: 0,
	          duration: inherit.duration,
	          ease: inherit.ease
	        });
	      }
	    }
	  }

	  return new Transition(groups, this._parents, name, id1);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/end.js


	/* harmony default export */ var transition_end = (function() {
	  var on0, on1, that = this, id = that._id, size = that.size();
	  return new Promise(function(resolve, reject) {
	    var cancel = {value: reject},
	        end = {value: function() { if (--size === 0) resolve(); }};

	    that.each(function() {
	      var schedule = schedule_set(this, id),
	          on = schedule.on;

	      // If this node shared a dispatch with the previous node,
	      // just assign the updated shared dispatch and we’re done!
	      // Otherwise, copy-on-write.
	      if (on !== on0) {
	        on1 = (on0 = on).copy();
	        on1._.cancel.push(cancel);
	        on1._.interrupt.push(cancel);
	        on1._.end.push(end);
	      }

	      schedule.on = on1;
	    });
	  });
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/index.js





















	var transition_id = 0;

	function Transition(groups, parents, name, id) {
	  this._groups = groups;
	  this._parents = parents;
	  this._name = name;
	  this._id = id;
	}

	function newId() {
	  return ++transition_id;
	}

	var selection_prototype = src_selection.prototype;

	Transition.prototype = {
	  constructor: Transition,
	  select: transition_select,
	  selectAll: transition_selectAll,
	  filter: transition_filter,
	  merge: transition_merge,
	  selection: transition_selection,
	  transition: transition_transition,
	  call: selection_prototype.call,
	  nodes: selection_prototype.nodes,
	  node: selection_prototype.node,
	  size: selection_prototype.size,
	  empty: selection_prototype.empty,
	  each: selection_prototype.each,
	  on: transition_on,
	  attr: transition_attr,
	  attrTween: transition_attrTween,
	  style: transition_style,
	  styleTween: transition_styleTween,
	  text: transition_text,
	  textTween: transition_textTween,
	  remove: transition_remove,
	  tween: transition_tween,
	  delay: transition_delay,
	  duration: duration,
	  ease: ease,
	  end: transition_end
	};

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/selection/transition.js





	var defaultTiming = {
	  time: null, // Set on use.
	  delay: 0,
	  duration: 250,
	  ease: cubicInOut
	};

	function transition_inherit(node, id) {
	  var timing;
	  while (!(timing = node.__transition) || !(timing = timing[id])) {
	    if (!(node = node.parentNode)) {
	      return defaultTiming.time = now(), defaultTiming;
	    }
	  }
	  return timing;
	}

	/* harmony default export */ var selection_transition = (function(name) {
	  var id,
	      timing;

	  if (name instanceof Transition) {
	    id = name._id, name = name._name;
	  } else {
	    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
	  }

	  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        transition_schedule(node, name, id, i, group, timing || transition_inherit(node, id));
	      }
	    }
	  }

	  return new Transition(groups, this._parents, name, id);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/selection/index.js




	src_selection.prototype.interrupt = selection_interrupt;
	src_selection.prototype.transition = selection_transition;

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/index.js





	// CONCATENATED MODULE: ./flamegraph.js








	/* harmony default export */ var flamegraph = __webpack_exports__["default"] = (function () {
	    var w = 960; // graph width
	    var h = null; // graph height
	    var c = 18; // cell height
	    var selection = null; // selection
	    var tooltip = null; // tooltip
	    var title = ''; // graph title
	    var transitionDuration = 750;
	    var transitionEase = cubicInOut; // tooltip offset
	    var sort = false;
	    var inverted = false; // invert the graph direction
	    var clickHandler = null;
	    var minFrameSize = 0;
	    var detailsElement = null;
	    var selfValue = false;
	    var differential = false;
	    var elided = false;
	    var searchSum = 0;
	    var totalValue = 0;
	    var maxDelta = 0;
	    var resetHeightOnZoom = false;
	    var scrollOnZoom = false;
	    var minHeight = null;

	    var getName = function (d) {
	        return d.data.n || d.data.name
	    };

	    var getValue = function (d) {
	        if ('v' in d) {
	            return d.v
	        } else {
	            return d.value
	        }
	    };

	    var getChildren = function (d) {
	        return d.c || d.children
	    };

	    var getLibtype = function (d) {
	        return d.data.l || d.data.libtype
	    };

	    var getDelta = function (d) {
	        if ('d' in d.data) {
	            return d.data.d
	        } else {
	            return d.data.delta
	        }
	    };

	    var searchHandler = function () {
	        if (detailsElement) { setSearchDetails(); }
	    };
	    var originalSearchHandler = searchHandler;

	    let searchMatch = (d, term) => {
	        if (!term) {
	            return false
	        }
	        const re = new RegExp(term);
	        const label = getName(d);
	        return typeof label !== 'undefined' && label && label.match(re)
	    };
	    const originalSearchMatch = searchMatch;

	    var detailsHandler = function (d) {
	        if (detailsElement) {
	            if (d) {
	                detailsElement.innerHTML = d;
	            } else {
	                if (searchSum) {
	                    setSearchDetails();
	                } else {
	                    detailsElement.innerHTML = '';
	                }
	            }
	        }
	    };
	    var originalDetailsHandler = detailsHandler;

	    var labelHandler = function (d) {
	        return getName(d) + ' (' + defaultLocale_format('.3f')(100 * (d.x1 - d.x0), 3) + '%, ' + getValue(d) + ' samples)'
	    };

	    var svg;

	    function setSearchDetails () {
	        detailsElement.innerHTML = searchSum + ' of ' + totalValue + ' samples ( ' + defaultLocale_format('.3f')(100 * (searchSum / totalValue), 3) + '%)';
	    }

	    var colorMapper = function (d) {
	        return d.highlight ? '#E600E6' : colorHash(getName(d), getLibtype(d), getDelta(d))
	    };
	    var originalColorMapper = colorMapper;

	    function generateHash (name) {
	    // Return a vector (0.0->1.0) that is a hash of the input string.
	    // The hash is computed to favor early characters over later ones, so
	    // that strings with similar starts have similar vectors. Only the first
	    // 6 characters are considered.
	        const MAX_CHAR = 6;

	        var hash = 0;
	        var maxHash = 0;
	        var weight = 1;
	        var mod = 10;

	        if (name) {
	            for (var i = 0; i < name.length; i++) {
	                if (i > MAX_CHAR) { break }
	                hash += weight * (name.charCodeAt(i) % mod);
	                maxHash += weight * (mod - 1);
	                weight *= 0.70;
	            }
	            if (maxHash > 0) { hash = hash / maxHash; }
	        }
	        return hash
	    }

	    function colorHash (name, libtype, delta) {
	    // Return a color for the given name and library type. The library type
	    // selects the hue, and the name is hashed to a color in that hue.

	        var r;
	        var g;
	        var b;

	        if (differential) {
	            r = 220;
	            g = 220;
	            b = 220;

	            if (!delta) {
	                delta = 0;
	            }

	            if (delta > 0) {
	                b = Math.round(210 * (maxDelta - delta) / maxDelta);
	                g = b;
	            } else if (delta < 0) {
	                r = Math.round(210 * (maxDelta + delta) / maxDelta);
	                g = r;
	            }
	        } else {
	            // default when libtype is not in use
	            var hue = elided ? 'cold' : 'warm';

	            if (!elided && !(typeof libtype === 'undefined' || libtype === '')) {
	                // Select hue. Order is important.
	                hue = 'red';
	                if (typeof name !== 'undefined' && name && name.match(/::/)) {
	                    hue = 'yellow';
	                }
	                if (libtype === 'kernel') {
	                    hue = 'orange';
	                } else if (libtype === 'jit') {
	                    hue = 'green';
	                } else if (libtype === 'inlined') {
	                    hue = 'aqua';
	                }
	            }

	            // calculate hash
	            var vector = 0;
	            if (name) {
	                var nameArr = name.split('`');
	                if (nameArr.length > 1) {
	                    name = nameArr[nameArr.length - 1]; // drop module name if present
	                }
	                name = name.split('(')[0]; // drop extra info
	                vector = generateHash(name);
	            }

	            // calculate color
	            if (hue === 'red') {
	                r = 200 + Math.round(55 * vector);
	                g = 50 + Math.round(80 * vector);
	                b = g;
	            } else if (hue === 'orange') {
	                r = 190 + Math.round(65 * vector);
	                g = 90 + Math.round(65 * vector);
	                b = 0;
	            } else if (hue === 'yellow') {
	                r = 175 + Math.round(55 * vector);
	                g = r;
	                b = 50 + Math.round(20 * vector);
	            } else if (hue === 'green') {
	                r = 50 + Math.round(60 * vector);
	                g = 200 + Math.round(55 * vector);
	                b = r;
	            } else if (hue === 'aqua') {
	                r = 50 + Math.round(60 * vector);
	                g = 165 + Math.round(55 * vector);
	                b = g;
	            } else if (hue === 'cold') {
	                r = 0 + Math.round(55 * (1 - vector));
	                g = 0 + Math.round(230 * (1 - vector));
	                b = 200 + Math.round(55 * vector);
	            } else {
	                // original warm palette
	                r = 200 + Math.round(55 * vector);
	                g = 0 + Math.round(230 * (1 - vector));
	                b = 0 + Math.round(55 * (1 - vector));
	            }
	        }

	        return 'rgb(' + r + ',' + g + ',' + b + ')'
	    }

	    function show (d) {
	        d.data.fade = false;
	        d.data.hide = false;
	        if (d.children) {
	            d.children.forEach(show);
	        }
	    }

	    function hideSiblings (node) {
	        let child = node;
	        let parent = child.parent;
	        let children, i, sibling;
	        while (parent) {
	            children = parent.children;
	            i = children.length;
	            while (i--) {
	                sibling = children[i];
	                if (sibling !== child) {
	                    sibling.data.hide = true;
	                }
	            }
	            child = parent;
	            parent = child.parent;
	        }
	    }

	    function fadeAncestors (d) {
	        if (d.parent) {
	            d.parent.data.fade = true;
	            fadeAncestors(d.parent);
	        }
	    }

	    function zoom (d) {
	        if (tooltip) tooltip.hide();
	        hideSiblings(d);
	        show(d);
	        fadeAncestors(d);
	        update();
	        if (scrollOnZoom) {
	            const chartOffset = svg._groups[0][0].parentNode.offsetTop;
	            const maxFrames = (window.innerHeight - chartOffset) / c;
	            const frameOffset = (d.height - maxFrames + 10) * c;
	            window.scrollTo({
	                top: chartOffset + frameOffset,
	                left: 0,
	                behavior: 'smooth'
	            });
	        }
	        if (typeof clickHandler === 'function') {
	            clickHandler(d);
	        }
	    }

	    function searchTree (d, term) {
	        var results = [];
	        var sum = 0;

	        function searchInner (d, foundParent) {
	            var found = false;

	            if (searchMatch(d, term)) {
	                d.highlight = true;
	                found = true;
	                if (!foundParent) {
	                    sum += getValue(d);
	                }
	                results.push(d);
	            } else {
	                d.highlight = false;
	            }

	            if (getChildren(d)) {
	                getChildren(d).forEach(function (child) {
	                    searchInner(child, (foundParent || found));
	                });
	            }
	        }

	        searchInner(d, false);
	        searchSum = sum;
	        searchHandler(results, sum, totalValue);
	    }

	    function findTree (d, id) {
	        if (d.id === id) {
	            return d
	        } else {
	            var children = getChildren(d);
	            if (children) {
	                for (var i = 0; i < children.length; i++) {
	                    var found = findTree(children[i], id);
	                    if (found) {
	                        return found
	                    }
	                }
	            }
	        }
	    }

	    function clear (d) {
	        d.highlight = false;
	        if (getChildren(d)) {
	            getChildren(d).forEach(function (child) {
	                clear(child);
	            });
	        }
	    }

	    function doSort (a, b) {
	        if (typeof sort === 'function') {
	            return sort(a, b)
	        } else if (sort) {
	            return src_ascending(getName(a), getName(b))
	        }
	    }

	    var p = src_partition();

	    function filterNodes (root) {
	        var nodeList = root.descendants();
	        if (minFrameSize > 0) {
	            var kx = w / (root.x1 - root.x0);
	            nodeList = nodeList.filter(function (el) {
	                return ((el.x1 - el.x0) * kx) > minFrameSize
	            });
	        }
	        return nodeList
	    }

	    function update () {
	        selection.each(function (root) {
	            var x = linear_linear().range([0, w]);
	            var y = linear_linear().range([0, c]);

	            reappraiseNode(root);

	            totalValue = root.value;

	            if (sort) root.sort(doSort);

	            p(root);

	            var kx = w / (root.x1 - root.x0);
	            function width (d) { return (d.x1 - d.x0) * kx }

	            var descendants = filterNodes(root);
	            var g = src_select(this).select('svg').selectAll('g').data(descendants, function (d) { return d.id });

	            // if height is not set: set height on first update, after nodes were filtered by minFrameSize
	            if (!h || resetHeightOnZoom) {
	                var maxDepth = Math.max.apply(null, descendants.map(function (n) { return n.depth }));

	                h = (maxDepth + 3) * c;
	                if (h < minHeight) h = minHeight;

	                src_select(this).select('svg').attr('height', h);
	            }

	            g.transition()
	                .duration(transitionDuration)
	                .ease(transitionEase)
	                .attr('transform', function (d) { return 'translate(' + x(d.x0) + ',' + (inverted ? y(d.depth) : (h - y(d.depth) - c)) + ')' });

	            g.select('rect')
	                .transition()
	                .duration(transitionDuration)
	                .ease(transitionEase)
	                .attr('width', width);

	            var node = g.enter()
	                .append('svg:g')
	                .attr('transform', function (d) { return 'translate(' + x(d.x0) + ',' + (inverted ? y(d.depth) : (h - y(d.depth) - c)) + ')' });

	            node.append('svg:rect')
	                .transition()
	                .delay(transitionDuration / 2)
	                .attr('width', width);

	            if (!tooltip) { node.append('svg:title'); }

	            node.append('foreignObject')
	                .append('xhtml:div');

	            // Now we have to re-select to see the new elements (why?).
	            g = src_select(this).select('svg').selectAll('g').data(descendants, function (d) { return d.id });

	            g.attr('width', width)
	                .attr('height', function (d) { return c })
	                .attr('name', function (d) { return getName(d) })
	                .attr('class', function (d) { return d.data.fade ? 'frame fade' : 'frame' });

	            g.select('rect')
	                .attr('height', function (d) { return c })
	                .attr('fill', function (d) { return colorMapper(d) });

	            if (!tooltip) {
	                g.select('title')
	                    .text(labelHandler);
	            }

	            g.select('foreignObject')
	                .attr('width', width)
	                .attr('height', function (d) { return c })
	                .select('div')
	                .attr('class', 'd3-flame-graph-label')
	                .style('display', function (d) { return (width(d) < 35) ? 'none' : 'block' })
	                .transition()
	                .delay(transitionDuration)
	                .text(getName);

	            g.on('click', zoom);

	            g.exit()
	                .remove();

	            g.on('mouseover', function (d) {
	                if (tooltip) tooltip.show(d, this);
	                detailsHandler(labelHandler(d));
	            }).on('mouseout', function () {
	                if (tooltip) tooltip.hide();
	                detailsHandler(null);
	            });
	        });
	    }

	    function merge (data, samples) {
	        samples.forEach(function (sample) {
	            var node = data.find(function (element) {
	                return (element.name === sample.name)
	            });

	            if (node) {
	                if (node.original) {
	                    node.original += sample.value;
	                } else {
	                    node.value += sample.value;
	                }
	                if (sample.children) {
	                    if (!node.children) {
	                        node.children = [];
	                    }
	                    merge(node.children, sample.children);
	                }
	            } else {
	                data.push(sample);
	            }
	        });
	    }

	    function forEachNode (node, f) {
	        f(node);
	        let children = node.children;
	        if (children) {
	            const stack = [children];
	            let count, child, grandChildren;
	            while (stack.length) {
	                children = stack.pop();
	                count = children.length;
	                while (count--) {
	                    child = children[count];
	                    f(child);
	                    grandChildren = child.children;
	                    if (grandChildren) {
	                        stack.push(grandChildren);
	                    }
	                }
	            }
	        }
	    }

	    function adoptNode (node) {
	        maxDelta = 0;
	        let id = 0;
	        let delta = 0;
	        const wantDelta = differential;
	        forEachNode(node, function (n) {
	            n.id = id++;
	            if (wantDelta) {
	                delta = Math.abs(getDelta(n));
	                if (maxDelta < delta) {
	                    maxDelta = delta;
	                }
	            }
	        });
	    }

	    function reappraiseNode (root) {
	        let node, children, grandChildren, childrenValue, i, j, child, childValue;
	        const stack = [];
	        const included = [];
	        const excluded = [];
	        const compoundValue = !selfValue;
	        let item = root.data;
	        if (item.hide) {
	            root.value = 0;
	            children = root.children;
	            if (children) {
	                excluded.push(children);
	            }
	        } else {
	            root.value = item.fade ? 0 : getValue(item);
	            stack.push(root);
	        }
	        // First DFS pass:
	        // 1. Update node.value with node's self value
	        // 2. Populate excluded list with children under hidden nodes
	        // 3. Populate included list with children under visible nodes
	        while ((node = stack.pop())) {
	            children = node.children;
	            if (children && (i = children.length)) {
	                childrenValue = 0;
	                while (i--) {
	                    child = children[i];
	                    item = child.data;
	                    if (item.hide) {
	                        child.value = 0;
	                        grandChildren = child.children;
	                        if (grandChildren) {
	                            excluded.push(grandChildren);
	                        }
	                        continue
	                    }
	                    if (item.fade) {
	                        child.value = 0;
	                    } else {
	                        childValue = getValue(item);
	                        child.value = childValue;
	                        childrenValue += childValue;
	                    }
	                    stack.push(child);
	                }
	                // Here second part of `&&` is actually checking for `node.data.fade`. However,
	                // checking for node.value is faster and presents more oportunities for JS optimizer.
	                if (compoundValue && node.value) {
	                    node.value -= childrenValue;
	                }
	                included.push(children);
	            }
	        }
	        // Postorder traversal to compute compound value of each visible node.
	        i = included.length;
	        while (i--) {
	            children = included[i];
	            childrenValue = 0;
	            j = children.length;
	            while (j--) {
	                childrenValue += children[j].value;
	            }
	            children[0].parent.value += childrenValue;
	        }
	        // Continue DFS to set value of all hidden nodes to 0.
	        while (excluded.length) {
	            children = excluded.pop();
	            j = children.length;
	            while (j--) {
	                child = children[j];
	                child.value = 0;
	                grandChildren = child.children;
	                if (grandChildren) {
	                    excluded.push(grandChildren);
	                }
	            }
	        }
	    }

	    function chart (s) {
	        const root = hierarchy(s.datum(), getChildren);

	        adoptNode(root);

	        selection = s.datum(root);

	        if (!arguments.length) return chart

	        selection.each(function (data) {
	            if (!svg) {
	                svg = src_select(this)
	                    .append('svg:svg')
	                    .attr('width', w)
	                    .attr('class', 'partition d3-flame-graph');

	                if (h) {
	                    if (h < minHeight) h = minHeight;
	                    svg.attr('height', h);
	                }

	                svg.append('svg:text')
	                    .attr('class', 'title')
	                    .attr('text-anchor', 'middle')
	                    .attr('y', '25')
	                    .attr('x', w / 2)
	                    .attr('fill', '#808080')
	                    .text(title);

	                if (tooltip) svg.call(tooltip);
	            }
	        });

	        // first draw
	        update();
	    }

	    chart.height = function (_) {
	        if (!arguments.length) { return h }
	        h = _;
	        return chart
	    };

	    chart.minHeight = function (_) {
	        if (!arguments.length) { return minHeight }
	        minHeight = _;
	        return chart
	    };

	    chart.width = function (_) {
	        if (!arguments.length) { return w }
	        w = _;
	        return chart
	    };

	    chart.cellHeight = function (_) {
	        if (!arguments.length) { return c }
	        c = _;
	        return chart
	    };

	    chart.tooltip = function (_) {
	        if (!arguments.length) { return tooltip }
	        if (typeof _ === 'function') {
	            tooltip = _;
	        }
	        return chart
	    };

	    chart.title = function (_) {
	        if (!arguments.length) { return title }
	        title = _;
	        return chart
	    };

	    chart.transitionDuration = function (_) {
	        if (!arguments.length) { return transitionDuration }
	        transitionDuration = _;
	        return chart
	    };

	    chart.transitionEase = function (_) {
	        if (!arguments.length) { return transitionEase }
	        transitionEase = _;
	        return chart
	    };

	    chart.sort = function (_) {
	        if (!arguments.length) { return sort }
	        sort = _;
	        return chart
	    };

	    chart.inverted = function (_) {
	        if (!arguments.length) { return inverted }
	        inverted = _;
	        return chart
	    };

	    chart.differential = function (_) {
	        if (!arguments.length) { return differential }
	        differential = _;
	        return chart
	    };

	    chart.elided = function (_) {
	        if (!arguments.length) { return elided }
	        elided = _;
	        return chart
	    };

	    chart.setLabelHandler = function (_) {
	        if (!arguments.length) { return labelHandler }
	        labelHandler = _;
	        return chart
	    };
	    // Kept for backwards compatibility.
	    chart.label = chart.setLabelHandler;

	    chart.search = function (term) {
	        selection.each(function (data) {
	            searchTree(data, term);
	            update();
	        });
	    };

	    chart.findById = function (id) {
	        if (typeof (id) === 'undefined' || id === null) {
	            return null
	        }
	        let found = null;
	        selection.each(function (data) {
	            if (found === null) {
	                found = findTree(data, id);
	            }
	        });
	        return found
	    };

	    chart.clear = function () {
	        searchSum = 0;
	        detailsHandler(null);
	        selection.each(function (data) {
	            clear(data);
	            update();
	        });
	    };

	    chart.zoomTo = function (d) {
	        zoom(d);
	    };

	    chart.resetZoom = function () {
	        selection.each(function (data) {
	            zoom(data); // zoom to root
	        });
	    };

	    chart.onClick = function (_) {
	        if (!arguments.length) {
	            return clickHandler
	        }
	        clickHandler = _;
	        return chart
	    };

	    chart.merge = function (samples) {
	        if (!selection) { return chart }
	        var newRoot; // Need to re-create hierarchy after data changes.
	        selection.each(function (root) {
	            merge([root.data], [samples]);
	            newRoot = hierarchy(root.data, getChildren);
	            adoptNode(newRoot);
	        });
	        selection = selection.datum(newRoot);
	        update();
	        return chart
	    };

	    chart.update = function (samples) {
	        if (!selection) { return chart }
	        var newRoot; // Need to re-create hierarchy after data changes.
	        selection.each(function (root) {
	            root.data = samples;
	            newRoot = hierarchy(root.data, getChildren);
	            adoptNode(newRoot);
	        });
	        selection = selection.datum(newRoot);
	        update();
	        return chart
	    };

	    chart.destroy = function () {
	        if (!selection) { return chart }
	        if (tooltip) tooltip.hide();
	        selection.selectAll('svg').remove();
	        return chart
	    };

	    chart.setColorMapper = function (_) {
	        if (!arguments.length) {
	            colorMapper = originalColorMapper;
	            return chart
	        }
	        colorMapper = (d) => {
	            const originalColor = originalColorMapper(d);
	            return _(d, originalColor)
	        };
	        return chart
	    };
	    // Kept for backwards compatibility.
	    chart.color = chart.setColorMapper;

	    chart.minFrameSize = function (_) {
	        if (!arguments.length) { return minFrameSize }
	        minFrameSize = _;
	        return chart
	    };

	    chart.setDetailsElement = function (_) {
	        if (!arguments.length) { return detailsElement }
	        detailsElement = _;
	        return chart
	    };
	    // Kept for backwards compatibility.
	    chart.details = chart.setDetailsElement;

	    chart.selfValue = function (_) {
	        if (!arguments.length) { return selfValue }
	        selfValue = _;
	        return chart
	    };

	    chart.resetHeightOnZoom = function (_) {
	        if (!arguments.length) { return resetHeightOnZoom }
	        resetHeightOnZoom = _;
	        return chart
	    };

	    chart.scrollOnZoom = function (_) {
	        if (!arguments.length) { return scrollOnZoom }
	        scrollOnZoom = _;
	        return chart
	    };

	    chart.getName = function (_) {
	        if (!arguments.length) { return getName }
	        getName = _;
	        return chart
	    };

	    chart.getValue = function (_) {
	        if (!arguments.length) { return getValue }
	        getValue = _;
	        return chart
	    };

	    chart.getChildren = function (_) {
	        if (!arguments.length) { return getChildren }
	        getChildren = _;
	        return chart
	    };

	    chart.getLibtype = function (_) {
	        if (!arguments.length) { return getLibtype }
	        getLibtype = _;
	        return chart
	    };

	    chart.getDelta = function (_) {
	        if (!arguments.length) { return getDelta }
	        getDelta = _;
	        return chart
	    };

	    chart.setSearchHandler = function (_) {
	        if (!arguments.length) {
	            searchHandler = originalSearchHandler;
	            return chart
	        }
	        searchHandler = _;
	        return chart
	    };

	    chart.setDetailsHandler = function (_) {
	        if (!arguments.length) {
	            detailsHandler = originalDetailsHandler;
	            return chart
	        }
	        detailsHandler = _;
	        return chart
	    };

	    chart.setSearchMatch = function (_) {
	        if (!arguments.length) {
	            searchMatch = originalSearchMatch;
	            return chart
	        }
	        searchMatch = _;
	        return chart
	    };

	    return chart
	});


	/***/ })

	/******/ })["default"];
	});
	});

	var flamegraph = /*@__PURE__*/getDefaultExportFromCjs(d3Flamegraph);

	var d3FlamegraphColorMapper = createCommonjsModule(function (module, exports) {
	(function webpackUniversalModuleDefinition(root, factory) {
		module.exports = factory();
	})(window, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};
	/******/
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	/******/
	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId]) {
	/******/ 			return installedModules[moduleId].exports;
	/******/ 		}
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			i: moduleId,
	/******/ 			l: false,
	/******/ 			exports: {}
	/******/ 		};
	/******/
	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
	/******/
	/******/ 		// Flag the module as loaded
	/******/ 		module.l = true;
	/******/
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	/******/
	/******/
	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;
	/******/
	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;
	/******/
	/******/ 	// define getter function for harmony exports
	/******/ 	__webpack_require__.d = function(exports, name, getter) {
	/******/ 		if(!__webpack_require__.o(exports, name)) {
	/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
	/******/ 		}
	/******/ 	};
	/******/
	/******/ 	// define __esModule on exports
	/******/ 	__webpack_require__.r = function(exports) {
	/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
	/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
	/******/ 		}
	/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
	/******/ 	};
	/******/
	/******/ 	// create a fake namespace object
	/******/ 	// mode & 1: value is a module id, require it
	/******/ 	// mode & 2: merge all properties of value into the ns
	/******/ 	// mode & 4: return value when already ns object
	/******/ 	// mode & 8|1: behave like require
	/******/ 	__webpack_require__.t = function(value, mode) {
	/******/ 		if(mode & 1) value = __webpack_require__(value);
	/******/ 		if(mode & 8) return value;
	/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
	/******/ 		var ns = Object.create(null);
	/******/ 		__webpack_require__.r(ns);
	/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
	/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
	/******/ 		return ns;
	/******/ 	};
	/******/
	/******/ 	// getDefaultExport function for compatibility with non-harmony modules
	/******/ 	__webpack_require__.n = function(module) {
	/******/ 		var getter = module && module.__esModule ?
	/******/ 			function getDefault() { return module['default']; } :
	/******/ 			function getModuleExports() { return module; };
	/******/ 		__webpack_require__.d(getter, 'a', getter);
	/******/ 		return getter;
	/******/ 	};
	/******/
	/******/ 	// Object.prototype.hasOwnProperty.call
	/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
	/******/
	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";
	/******/
	/******/
	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(__webpack_require__.s = 6);
	/******/ })
	/************************************************************************/
	/******/ ({

	/***/ 6:
	/***/ (function(module, __webpack_exports__, __webpack_require__) {
	__webpack_require__.r(__webpack_exports__);
	/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "allocationColorMapper", function() { return allocationColorMapper; });
	/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "offCpuColorMapper", function() { return offCpuColorMapper; });
	/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "nodeJsColorMapper", function() { return nodeJsColorMapper; });
	function pickHex (color1, color2, weight) {
	    const w1 = weight;
	    const w2 = 1 - w1;
	    const rgb = [Math.round(color1[0] * w1 + color2[0] * w2),
	        Math.round(color1[1] * w1 + color2[1] * w2),
	        Math.round(color1[2] * w1 + color2[2] * w2)];
	    return rgb
	}

	function generateHash (name) {
	    // Return a vector (0.0->1.0) that is a hash of the input string.
	    // The hash is computed to favor early characters over later ones, so
	    // that strings with similar starts have similar vectors. Only the first
	    // 6 characters are considered.
	    const MAX_CHAR = 6;

	    var hash = 0;
	    var maxHash = 0;
	    var weight = 1;
	    var mod = 10;

	    if (name) {
	        for (var i = 0; i < name.length; i++) {
	            if (i > MAX_CHAR) { break }
	            hash += weight * (name.charCodeAt(i) % mod);
	            maxHash += weight * (mod - 1);
	            weight *= 0.70;
	        }
	        if (maxHash > 0) { hash = hash / maxHash; }
	    }
	    return hash
	}

	function allocationColorMapper (d) {
	    if (d.highlight) return 'rgb(230, 0, 230)'

	    const self = d.data.value;
	    const total = d.value;
	    const color = pickHex([0, 255, 40], [196, 245, 233], self / total);

	    return `rgb(${color.join()})`
	}

	function offCpuColorMapper (d) {
	    if (d.highlight) return '#E600E6'

	    let name = d.data.n || d.data.name;
	    let vector = 0;
	    const nameArr = name.split('`');

	    if (nameArr.length > 1) {
	        name = nameArr[nameArr.length - 1]; // drop module name if present
	    }
	    name = name.split('(')[0]; // drop extra info
	    vector = generateHash(name);

	    const r = 0 + Math.round(55 * (1 - vector));
	    const g = 0 + Math.round(230 * (1 - vector));
	    const b = 200 + Math.round(55 * vector);

	    return 'rgb(' + r + ',' + g + ',' + b + ')'
	}

	function nodeJsColorMapper (d, originalColor) {
	    let color = originalColor;

	    const { v8_jit: v8JIT, javascript, optimized } = d.data.extras || {};
	    // Non-JS JIT frames (V8 builtins) are greyed out.
	    if (v8JIT && !javascript) {
	        color = '#dadada';
	    }
	    // JavaScript frames are colored based on optimization level
	    if (javascript) {
	        let opt = (optimized || 0) / d.value;
	        let r = 255;
	        let g = 0;
	        let b = 0;
	        if (opt < 0.4) {
	            opt = opt * 2.5;
	            r = 240 - opt * 200;
	        } else if (opt < 0.9) {
	            opt = (opt - 0.4) * 2;
	            r = 0;
	            b = 200 - (200 * opt);
	            g = 100 * opt;
	        } else {
	            opt = (opt - 0.9) * 10;
	            r = 0;
	            b = 0;
	            g = 100 + (150 * opt);
	        }
	        color = `rgb(${r} , ${g}, ${b})`;
	    }
	    return color
	}


	/***/ })

	/******/ });
	});
	});

	var d3FlamegraphTooltip = createCommonjsModule(function (module, exports) {
	(function webpackUniversalModuleDefinition(root, factory) {
		module.exports = factory();
	})(window, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};
	/******/
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	/******/
	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId]) {
	/******/ 			return installedModules[moduleId].exports;
	/******/ 		}
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			i: moduleId,
	/******/ 			l: false,
	/******/ 			exports: {}
	/******/ 		};
	/******/
	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
	/******/
	/******/ 		// Flag the module as loaded
	/******/ 		module.l = true;
	/******/
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	/******/
	/******/
	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;
	/******/
	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;
	/******/
	/******/ 	// define getter function for harmony exports
	/******/ 	__webpack_require__.d = function(exports, name, getter) {
	/******/ 		if(!__webpack_require__.o(exports, name)) {
	/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
	/******/ 		}
	/******/ 	};
	/******/
	/******/ 	// define __esModule on exports
	/******/ 	__webpack_require__.r = function(exports) {
	/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
	/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
	/******/ 		}
	/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
	/******/ 	};
	/******/
	/******/ 	// create a fake namespace object
	/******/ 	// mode & 1: value is a module id, require it
	/******/ 	// mode & 2: merge all properties of value into the ns
	/******/ 	// mode & 4: return value when already ns object
	/******/ 	// mode & 8|1: behave like require
	/******/ 	__webpack_require__.t = function(value, mode) {
	/******/ 		if(mode & 1) value = __webpack_require__(value);
	/******/ 		if(mode & 8) return value;
	/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
	/******/ 		var ns = Object.create(null);
	/******/ 		__webpack_require__.r(ns);
	/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
	/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
	/******/ 		return ns;
	/******/ 	};
	/******/
	/******/ 	// getDefaultExport function for compatibility with non-harmony modules
	/******/ 	__webpack_require__.n = function(module) {
	/******/ 		var getter = module && module.__esModule ?
	/******/ 			function getDefault() { return module['default']; } :
	/******/ 			function getModuleExports() { return module; };
	/******/ 		__webpack_require__.d(getter, 'a', getter);
	/******/ 		return getter;
	/******/ 	};
	/******/
	/******/ 	// Object.prototype.hasOwnProperty.call
	/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
	/******/
	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";
	/******/
	/******/
	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(__webpack_require__.s = 7);
	/******/ })
	/************************************************************************/
	/******/ ({

	/***/ 7:
	/***/ (function(module, __webpack_exports__, __webpack_require__) {
	// ESM COMPAT FLAG
	__webpack_require__.r(__webpack_exports__);

	// EXPORTS
	__webpack_require__.d(__webpack_exports__, "defaultFlamegraphTooltip", function() { return /* binding */ defaultFlamegraphTooltip; });

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selector.js
	function none() {}

	/* harmony default export */ var src_selector = (function(selector) {
	  return selector == null ? none : function() {
	    return this.querySelector(selector);
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/select.js



	/* harmony default export */ var selection_select = (function(select) {
	  if (typeof select !== "function") select = src_selector(select);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
	      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
	        if ("__data__" in node) subnode.__data__ = node.__data__;
	        subgroup[i] = subnode;
	      }
	    }
	  }

	  return new Selection(subgroups, this._parents);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selectorAll.js
	function selectorAll_empty() {
	  return [];
	}

	/* harmony default export */ var selectorAll = (function(selector) {
	  return selector == null ? selectorAll_empty : function() {
	    return this.querySelectorAll(selector);
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/selectAll.js



	/* harmony default export */ var selectAll = (function(select) {
	  if (typeof select !== "function") select = selectorAll(select);

	  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        subgroups.push(select.call(node, node.__data__, i, group));
	        parents.push(node);
	      }
	    }
	  }

	  return new Selection(subgroups, parents);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/matcher.js
	/* harmony default export */ var matcher = (function(selector) {
	  return function() {
	    return this.matches(selector);
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/filter.js



	/* harmony default export */ var filter = (function(match) {
	  if (typeof match !== "function") match = matcher(match);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
	      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
	        subgroup.push(node);
	      }
	    }
	  }

	  return new Selection(subgroups, this._parents);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/sparse.js
	/* harmony default export */ var sparse = (function(update) {
	  return new Array(update.length);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/enter.js



	/* harmony default export */ var selection_enter = (function() {
	  return new Selection(this._enter || this._groups.map(sparse), this._parents);
	});

	function EnterNode(parent, datum) {
	  this.ownerDocument = parent.ownerDocument;
	  this.namespaceURI = parent.namespaceURI;
	  this._next = null;
	  this._parent = parent;
	  this.__data__ = datum;
	}

	EnterNode.prototype = {
	  constructor: EnterNode,
	  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
	  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
	  querySelector: function(selector) { return this._parent.querySelector(selector); },
	  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
	};

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/constant.js
	/* harmony default export */ var constant = (function(x) {
	  return function() {
	    return x;
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/data.js




	var keyPrefix = "$"; // Protect against keys like “__proto__”.

	function bindIndex(parent, group, enter, update, exit, data) {
	  var i = 0,
	      node,
	      groupLength = group.length,
	      dataLength = data.length;

	  // Put any non-null nodes that fit into update.
	  // Put any null nodes into enter.
	  // Put any remaining data into enter.
	  for (; i < dataLength; ++i) {
	    if (node = group[i]) {
	      node.__data__ = data[i];
	      update[i] = node;
	    } else {
	      enter[i] = new EnterNode(parent, data[i]);
	    }
	  }

	  // Put any non-null nodes that don’t fit into exit.
	  for (; i < groupLength; ++i) {
	    if (node = group[i]) {
	      exit[i] = node;
	    }
	  }
	}

	function bindKey(parent, group, enter, update, exit, data, key) {
	  var i,
	      node,
	      nodeByKeyValue = {},
	      groupLength = group.length,
	      dataLength = data.length,
	      keyValues = new Array(groupLength),
	      keyValue;

	  // Compute the key for each node.
	  // If multiple nodes have the same key, the duplicates are added to exit.
	  for (i = 0; i < groupLength; ++i) {
	    if (node = group[i]) {
	      keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
	      if (keyValue in nodeByKeyValue) {
	        exit[i] = node;
	      } else {
	        nodeByKeyValue[keyValue] = node;
	      }
	    }
	  }

	  // Compute the key for each datum.
	  // If there a node associated with this key, join and add it to update.
	  // If there is not (or the key is a duplicate), add it to enter.
	  for (i = 0; i < dataLength; ++i) {
	    keyValue = keyPrefix + key.call(parent, data[i], i, data);
	    if (node = nodeByKeyValue[keyValue]) {
	      update[i] = node;
	      node.__data__ = data[i];
	      nodeByKeyValue[keyValue] = null;
	    } else {
	      enter[i] = new EnterNode(parent, data[i]);
	    }
	  }

	  // Add any remaining nodes that were not bound to data to exit.
	  for (i = 0; i < groupLength; ++i) {
	    if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
	      exit[i] = node;
	    }
	  }
	}

	/* harmony default export */ var selection_data = (function(value, key) {
	  if (!value) {
	    data = new Array(this.size()), j = -1;
	    this.each(function(d) { data[++j] = d; });
	    return data;
	  }

	  var bind = key ? bindKey : bindIndex,
	      parents = this._parents,
	      groups = this._groups;

	  if (typeof value !== "function") value = constant(value);

	  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
	    var parent = parents[j],
	        group = groups[j],
	        groupLength = group.length,
	        data = value.call(parent, parent && parent.__data__, j, parents),
	        dataLength = data.length,
	        enterGroup = enter[j] = new Array(dataLength),
	        updateGroup = update[j] = new Array(dataLength),
	        exitGroup = exit[j] = new Array(groupLength);

	    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

	    // Now connect the enter nodes to their following update node, such that
	    // appendChild can insert the materialized enter node before this node,
	    // rather than at the end of the parent node.
	    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
	      if (previous = enterGroup[i0]) {
	        if (i0 >= i1) i1 = i0 + 1;
	        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
	        previous._next = next || null;
	      }
	    }
	  }

	  update = new Selection(update, parents);
	  update._enter = enter;
	  update._exit = exit;
	  return update;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/exit.js



	/* harmony default export */ var selection_exit = (function() {
	  return new Selection(this._exit || this._groups.map(sparse), this._parents);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/join.js
	/* harmony default export */ var join = (function(onenter, onupdate, onexit) {
	  var enter = this.enter(), update = this, exit = this.exit();
	  enter = typeof onenter === "function" ? onenter(enter) : enter.append(onenter + "");
	  if (onupdate != null) update = onupdate(update);
	  if (onexit == null) exit.remove(); else onexit(exit);
	  return enter && update ? enter.merge(update).order() : update;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/merge.js


	/* harmony default export */ var selection_merge = (function(selection) {

	  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
	    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
	      if (node = group0[i] || group1[i]) {
	        merge[i] = node;
	      }
	    }
	  }

	  for (; j < m0; ++j) {
	    merges[j] = groups0[j];
	  }

	  return new Selection(merges, this._parents);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/order.js
	/* harmony default export */ var order = (function() {

	  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
	    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
	      if (node = group[i]) {
	        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
	        next = node;
	      }
	    }
	  }

	  return this;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/sort.js


	/* harmony default export */ var sort = (function(compare) {
	  if (!compare) compare = ascending;

	  function compareNode(a, b) {
	    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
	  }

	  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        sortgroup[i] = node;
	      }
	    }
	    sortgroup.sort(compareNode);
	  }

	  return new Selection(sortgroups, this._parents).order();
	});

	function ascending(a, b) {
	  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
	}

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/call.js
	/* harmony default export */ var call = (function() {
	  var callback = arguments[0];
	  arguments[0] = this;
	  callback.apply(null, arguments);
	  return this;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/nodes.js
	/* harmony default export */ var nodes = (function() {
	  var nodes = new Array(this.size()), i = -1;
	  this.each(function() { nodes[++i] = this; });
	  return nodes;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/node.js
	/* harmony default export */ var selection_node = (function() {

	  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
	    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
	      var node = group[i];
	      if (node) return node;
	    }
	  }

	  return null;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/size.js
	/* harmony default export */ var selection_size = (function() {
	  var size = 0;
	  this.each(function() { ++size; });
	  return size;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/empty.js
	/* harmony default export */ var selection_empty = (function() {
	  return !this.node();
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/each.js
	/* harmony default export */ var each = (function(callback) {

	  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
	    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
	      if (node = group[i]) callback.call(node, node.__data__, i, group);
	    }
	  }

	  return this;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/namespaces.js
	var xhtml = "http://www.w3.org/1999/xhtml";

	/* harmony default export */ var namespaces = ({
	  svg: "http://www.w3.org/2000/svg",
	  xhtml: xhtml,
	  xlink: "http://www.w3.org/1999/xlink",
	  xml: "http://www.w3.org/XML/1998/namespace",
	  xmlns: "http://www.w3.org/2000/xmlns/"
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/namespace.js


	/* harmony default export */ var namespace = (function(name) {
	  var prefix = name += "", i = prefix.indexOf(":");
	  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
	  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/attr.js


	function attrRemove(name) {
	  return function() {
	    this.removeAttribute(name);
	  };
	}

	function attrRemoveNS(fullname) {
	  return function() {
	    this.removeAttributeNS(fullname.space, fullname.local);
	  };
	}

	function attrConstant(name, value) {
	  return function() {
	    this.setAttribute(name, value);
	  };
	}

	function attrConstantNS(fullname, value) {
	  return function() {
	    this.setAttributeNS(fullname.space, fullname.local, value);
	  };
	}

	function attrFunction(name, value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) this.removeAttribute(name);
	    else this.setAttribute(name, v);
	  };
	}

	function attrFunctionNS(fullname, value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
	    else this.setAttributeNS(fullname.space, fullname.local, v);
	  };
	}

	/* harmony default export */ var attr = (function(name, value) {
	  var fullname = namespace(name);

	  if (arguments.length < 2) {
	    var node = this.node();
	    return fullname.local
	        ? node.getAttributeNS(fullname.space, fullname.local)
	        : node.getAttribute(fullname);
	  }

	  return this.each((value == null
	      ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
	      ? (fullname.local ? attrFunctionNS : attrFunction)
	      : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/window.js
	/* harmony default export */ var src_window = (function(node) {
	  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
	      || (node.document && node) // node is a Window
	      || node.defaultView; // node is a Document
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/style.js


	function styleRemove(name) {
	  return function() {
	    this.style.removeProperty(name);
	  };
	}

	function styleConstant(name, value, priority) {
	  return function() {
	    this.style.setProperty(name, value, priority);
	  };
	}

	function styleFunction(name, value, priority) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) this.style.removeProperty(name);
	    else this.style.setProperty(name, v, priority);
	  };
	}

	/* harmony default export */ var style = (function(name, value, priority) {
	  return arguments.length > 1
	      ? this.each((value == null
	            ? styleRemove : typeof value === "function"
	            ? styleFunction
	            : styleConstant)(name, value, priority == null ? "" : priority))
	      : styleValue(this.node(), name);
	});

	function styleValue(node, name) {
	  return node.style.getPropertyValue(name)
	      || src_window(node).getComputedStyle(node, null).getPropertyValue(name);
	}

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/property.js
	function propertyRemove(name) {
	  return function() {
	    delete this[name];
	  };
	}

	function propertyConstant(name, value) {
	  return function() {
	    this[name] = value;
	  };
	}

	function propertyFunction(name, value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) delete this[name];
	    else this[name] = v;
	  };
	}

	/* harmony default export */ var property = (function(name, value) {
	  return arguments.length > 1
	      ? this.each((value == null
	          ? propertyRemove : typeof value === "function"
	          ? propertyFunction
	          : propertyConstant)(name, value))
	      : this.node()[name];
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/classed.js
	function classArray(string) {
	  return string.trim().split(/^|\s+/);
	}

	function classList(node) {
	  return node.classList || new ClassList(node);
	}

	function ClassList(node) {
	  this._node = node;
	  this._names = classArray(node.getAttribute("class") || "");
	}

	ClassList.prototype = {
	  add: function(name) {
	    var i = this._names.indexOf(name);
	    if (i < 0) {
	      this._names.push(name);
	      this._node.setAttribute("class", this._names.join(" "));
	    }
	  },
	  remove: function(name) {
	    var i = this._names.indexOf(name);
	    if (i >= 0) {
	      this._names.splice(i, 1);
	      this._node.setAttribute("class", this._names.join(" "));
	    }
	  },
	  contains: function(name) {
	    return this._names.indexOf(name) >= 0;
	  }
	};

	function classedAdd(node, names) {
	  var list = classList(node), i = -1, n = names.length;
	  while (++i < n) list.add(names[i]);
	}

	function classedRemove(node, names) {
	  var list = classList(node), i = -1, n = names.length;
	  while (++i < n) list.remove(names[i]);
	}

	function classedTrue(names) {
	  return function() {
	    classedAdd(this, names);
	  };
	}

	function classedFalse(names) {
	  return function() {
	    classedRemove(this, names);
	  };
	}

	function classedFunction(names, value) {
	  return function() {
	    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
	  };
	}

	/* harmony default export */ var classed = (function(name, value) {
	  var names = classArray(name + "");

	  if (arguments.length < 2) {
	    var list = classList(this.node()), i = -1, n = names.length;
	    while (++i < n) if (!list.contains(names[i])) return false;
	    return true;
	  }

	  return this.each((typeof value === "function"
	      ? classedFunction : value
	      ? classedTrue
	      : classedFalse)(names, value));
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/text.js
	function textRemove() {
	  this.textContent = "";
	}

	function textConstant(value) {
	  return function() {
	    this.textContent = value;
	  };
	}

	function textFunction(value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    this.textContent = v == null ? "" : v;
	  };
	}

	/* harmony default export */ var selection_text = (function(value) {
	  return arguments.length
	      ? this.each(value == null
	          ? textRemove : (typeof value === "function"
	          ? textFunction
	          : textConstant)(value))
	      : this.node().textContent;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/html.js
	function htmlRemove() {
	  this.innerHTML = "";
	}

	function htmlConstant(value) {
	  return function() {
	    this.innerHTML = value;
	  };
	}

	function htmlFunction(value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    this.innerHTML = v == null ? "" : v;
	  };
	}

	/* harmony default export */ var selection_html = (function(value) {
	  return arguments.length
	      ? this.each(value == null
	          ? htmlRemove : (typeof value === "function"
	          ? htmlFunction
	          : htmlConstant)(value))
	      : this.node().innerHTML;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/raise.js
	function raise() {
	  if (this.nextSibling) this.parentNode.appendChild(this);
	}

	/* harmony default export */ var selection_raise = (function() {
	  return this.each(raise);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/lower.js
	function lower() {
	  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
	}

	/* harmony default export */ var selection_lower = (function() {
	  return this.each(lower);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/creator.js



	function creatorInherit(name) {
	  return function() {
	    var document = this.ownerDocument,
	        uri = this.namespaceURI;
	    return uri === xhtml && document.documentElement.namespaceURI === xhtml
	        ? document.createElement(name)
	        : document.createElementNS(uri, name);
	  };
	}

	function creatorFixed(fullname) {
	  return function() {
	    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
	  };
	}

	/* harmony default export */ var creator = (function(name) {
	  var fullname = namespace(name);
	  return (fullname.local
	      ? creatorFixed
	      : creatorInherit)(fullname);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/append.js


	/* harmony default export */ var append = (function(name) {
	  var create = typeof name === "function" ? name : creator(name);
	  return this.select(function() {
	    return this.appendChild(create.apply(this, arguments));
	  });
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/insert.js



	function constantNull() {
	  return null;
	}

	/* harmony default export */ var insert = (function(name, before) {
	  var create = typeof name === "function" ? name : creator(name),
	      select = before == null ? constantNull : typeof before === "function" ? before : src_selector(before);
	  return this.select(function() {
	    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
	  });
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/remove.js
	function remove_remove() {
	  var parent = this.parentNode;
	  if (parent) parent.removeChild(this);
	}

	/* harmony default export */ var selection_remove = (function() {
	  return this.each(remove_remove);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/clone.js
	function selection_cloneShallow() {
	  var clone = this.cloneNode(false), parent = this.parentNode;
	  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
	}

	function selection_cloneDeep() {
	  var clone = this.cloneNode(true), parent = this.parentNode;
	  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
	}

	/* harmony default export */ var clone = (function(deep) {
	  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/datum.js
	/* harmony default export */ var datum = (function(value) {
	  return arguments.length
	      ? this.property("__data__", value)
	      : this.node().__data__;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/on.js
	var filterEvents = {};

	if (typeof document !== "undefined") {
	  var on_element = document.documentElement;
	  if (!("onmouseenter" in on_element)) {
	    filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
	  }
	}

	function filterContextListener(listener, index, group) {
	  listener = contextListener(listener, index, group);
	  return function(event) {
	    var related = event.relatedTarget;
	    if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
	      listener.call(this, event);
	    }
	  };
	}

	function contextListener(listener, index, group) {
	  return function(event1) {
	    try {
	      listener.call(this, this.__data__, index, group);
	    } finally {
	    }
	  };
	}

	function parseTypenames(typenames) {
	  return typenames.trim().split(/^|\s+/).map(function(t) {
	    var name = "", i = t.indexOf(".");
	    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
	    return {type: t, name: name};
	  });
	}

	function onRemove(typename) {
	  return function() {
	    var on = this.__on;
	    if (!on) return;
	    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
	      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
	        this.removeEventListener(o.type, o.listener, o.capture);
	      } else {
	        on[++i] = o;
	      }
	    }
	    if (++i) on.length = i;
	    else delete this.__on;
	  };
	}

	function onAdd(typename, value, capture) {
	  var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
	  return function(d, i, group) {
	    var on = this.__on, o, listener = wrap(value, i, group);
	    if (on) for (var j = 0, m = on.length; j < m; ++j) {
	      if ((o = on[j]).type === typename.type && o.name === typename.name) {
	        this.removeEventListener(o.type, o.listener, o.capture);
	        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
	        o.value = value;
	        return;
	      }
	    }
	    this.addEventListener(typename.type, listener, capture);
	    o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
	    if (!on) this.__on = [o];
	    else on.push(o);
	  };
	}

	/* harmony default export */ var selection_on = (function(typename, value, capture) {
	  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

	  if (arguments.length < 2) {
	    var on = this.node().__on;
	    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
	      for (i = 0, o = on[j]; i < n; ++i) {
	        if ((t = typenames[i]).type === o.type && t.name === o.name) {
	          return o.value;
	        }
	      }
	    }
	    return;
	  }

	  on = value ? onAdd : onRemove;
	  if (capture == null) capture = false;
	  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
	  return this;
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/dispatch.js


	function dispatchEvent(node, type, params) {
	  var window = src_window(node),
	      event = window.CustomEvent;

	  if (typeof event === "function") {
	    event = new event(type, params);
	  } else {
	    event = window.document.createEvent("Event");
	    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
	    else event.initEvent(type, false, false);
	  }

	  node.dispatchEvent(event);
	}

	function dispatchConstant(type, params) {
	  return function() {
	    return dispatchEvent(this, type, params);
	  };
	}

	function dispatchFunction(type, params) {
	  return function() {
	    return dispatchEvent(this, type, params.apply(this, arguments));
	  };
	}

	/* harmony default export */ var dispatch = (function(type, params) {
	  return this.each((typeof params === "function"
	      ? dispatchFunction
	      : dispatchConstant)(type, params));
	});

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/selection/index.js
































	var root = [null];

	function Selection(groups, parents) {
	  this._groups = groups;
	  this._parents = parents;
	}

	function selection_selection() {
	  return new Selection([[document.documentElement]], root);
	}

	Selection.prototype = selection_selection.prototype = {
	  constructor: Selection,
	  select: selection_select,
	  selectAll: selectAll,
	  filter: filter,
	  data: selection_data,
	  enter: selection_enter,
	  exit: selection_exit,
	  join: join,
	  merge: selection_merge,
	  order: order,
	  sort: sort,
	  call: call,
	  nodes: nodes,
	  node: selection_node,
	  size: selection_size,
	  empty: selection_empty,
	  each: each,
	  attr: attr,
	  style: style,
	  property: property,
	  classed: classed,
	  text: selection_text,
	  html: selection_html,
	  raise: selection_raise,
	  lower: selection_lower,
	  append: append,
	  insert: insert,
	  remove: selection_remove,
	  clone: clone,
	  datum: datum,
	  on: selection_on,
	  dispatch: dispatch
	};

	/* harmony default export */ var src_selection = (selection_selection);

	// CONCATENATED MODULE: ../node_modules/d3-selection/src/select.js


	/* harmony default export */ var src_select = (function(selector) {
	  return typeof selector === "string"
	      ? new Selection([[document.querySelector(selector)]], [document.documentElement])
	      : new Selection([[selector]], root);
	});

	// CONCATENATED MODULE: ../node_modules/d3-dispatch/src/dispatch.js
	var noop = {value: function() {}};

	function dispatch_dispatch() {
	  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
	    if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
	    _[t] = [];
	  }
	  return new Dispatch(_);
	}

	function Dispatch(_) {
	  this._ = _;
	}

	function dispatch_parseTypenames(typenames, types) {
	  return typenames.trim().split(/^|\s+/).map(function(t) {
	    var name = "", i = t.indexOf(".");
	    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
	    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
	    return {type: t, name: name};
	  });
	}

	Dispatch.prototype = dispatch_dispatch.prototype = {
	  constructor: Dispatch,
	  on: function(typename, callback) {
	    var _ = this._,
	        T = dispatch_parseTypenames(typename + "", _),
	        t,
	        i = -1,
	        n = T.length;

	    // If no callback was specified, return the callback of the given type and name.
	    if (arguments.length < 2) {
	      while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
	      return;
	    }

	    // If a type was specified, set the callback for the given type and name.
	    // Otherwise, if a null callback was specified, remove callbacks of the given name.
	    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
	    while (++i < n) {
	      if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
	      else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
	    }

	    return this;
	  },
	  copy: function() {
	    var copy = {}, _ = this._;
	    for (var t in _) copy[t] = _[t].slice();
	    return new Dispatch(copy);
	  },
	  call: function(type, that) {
	    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
	    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
	    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
	  },
	  apply: function(type, that, args) {
	    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
	    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
	  }
	};

	function get(type, name) {
	  for (var i = 0, n = type.length, c; i < n; ++i) {
	    if ((c = type[i]).name === name) {
	      return c.value;
	    }
	  }
	}

	function set(type, name, callback) {
	  for (var i = 0, n = type.length; i < n; ++i) {
	    if (type[i].name === name) {
	      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
	      break;
	    }
	  }
	  if (callback != null) type.push({name: name, value: callback});
	  return type;
	}

	/* harmony default export */ var src_dispatch = (dispatch_dispatch);

	// CONCATENATED MODULE: ../node_modules/d3-timer/src/timer.js
	var timer_frame = 0, // is an animation frame pending?
	    timeout = 0, // is a timeout pending?
	    interval = 0, // are any timers active?
	    pokeDelay = 1000, // how frequently we check for clock skew
	    taskHead,
	    taskTail,
	    clockLast = 0,
	    clockNow = 0,
	    clockSkew = 0,
	    clock = typeof performance === "object" && performance.now ? performance : Date,
	    setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

	function now() {
	  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
	}

	function clearNow() {
	  clockNow = 0;
	}

	function Timer() {
	  this._call =
	  this._time =
	  this._next = null;
	}

	Timer.prototype = timer.prototype = {
	  constructor: Timer,
	  restart: function(callback, delay, time) {
	    if (typeof callback !== "function") throw new TypeError("callback is not a function");
	    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
	    if (!this._next && taskTail !== this) {
	      if (taskTail) taskTail._next = this;
	      else taskHead = this;
	      taskTail = this;
	    }
	    this._call = callback;
	    this._time = time;
	    sleep();
	  },
	  stop: function() {
	    if (this._call) {
	      this._call = null;
	      this._time = Infinity;
	      sleep();
	    }
	  }
	};

	function timer(callback, delay, time) {
	  var t = new Timer;
	  t.restart(callback, delay, time);
	  return t;
	}

	function timerFlush() {
	  now(); // Get the current time, if not already set.
	  ++timer_frame; // Pretend we’ve set an alarm, if we haven’t already.
	  var t = taskHead, e;
	  while (t) {
	    if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
	    t = t._next;
	  }
	  --timer_frame;
	}

	function wake() {
	  clockNow = (clockLast = clock.now()) + clockSkew;
	  timer_frame = timeout = 0;
	  try {
	    timerFlush();
	  } finally {
	    timer_frame = 0;
	    nap();
	    clockNow = 0;
	  }
	}

	function poke() {
	  var now = clock.now(), delay = now - clockLast;
	  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
	}

	function nap() {
	  var t0, t1 = taskHead, t2, time = Infinity;
	  while (t1) {
	    if (t1._call) {
	      if (time > t1._time) time = t1._time;
	      t0 = t1, t1 = t1._next;
	    } else {
	      t2 = t1._next, t1._next = null;
	      t1 = t0 ? t0._next = t2 : taskHead = t2;
	    }
	  }
	  taskTail = t0;
	  sleep(time);
	}

	function sleep(time) {
	  if (timer_frame) return; // Soonest alarm already set, or will be.
	  if (timeout) timeout = clearTimeout(timeout);
	  var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
	  if (delay > 24) {
	    if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
	    if (interval) interval = clearInterval(interval);
	  } else {
	    if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
	    timer_frame = 1, setFrame(wake);
	  }
	}

	// CONCATENATED MODULE: ../node_modules/d3-timer/src/timeout.js


	/* harmony default export */ var src_timeout = (function(callback, delay, time) {
	  var t = new Timer;
	  delay = delay == null ? 0 : +delay;
	  t.restart(function(elapsed) {
	    t.stop();
	    callback(elapsed + delay);
	  }, delay, time);
	  return t;
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/schedule.js



	var emptyOn = src_dispatch("start", "end", "cancel", "interrupt");
	var emptyTween = [];

	var CREATED = 0;
	var SCHEDULED = 1;
	var STARTING = 2;
	var STARTED = 3;
	var RUNNING = 4;
	var ENDING = 5;
	var ENDED = 6;

	/* harmony default export */ var transition_schedule = (function(node, name, id, index, group, timing) {
	  var schedules = node.__transition;
	  if (!schedules) node.__transition = {};
	  else if (id in schedules) return;
	  schedule_create(node, id, {
	    name: name,
	    index: index, // For context during callback.
	    group: group, // For context during callback.
	    on: emptyOn,
	    tween: emptyTween,
	    time: timing.time,
	    delay: timing.delay,
	    duration: timing.duration,
	    ease: timing.ease,
	    timer: null,
	    state: CREATED
	  });
	});

	function init(node, id) {
	  var schedule = schedule_get(node, id);
	  if (schedule.state > CREATED) throw new Error("too late; already scheduled");
	  return schedule;
	}

	function schedule_set(node, id) {
	  var schedule = schedule_get(node, id);
	  if (schedule.state > STARTED) throw new Error("too late; already running");
	  return schedule;
	}

	function schedule_get(node, id) {
	  var schedule = node.__transition;
	  if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
	  return schedule;
	}

	function schedule_create(node, id, self) {
	  var schedules = node.__transition,
	      tween;

	  // Initialize the self timer when the transition is created.
	  // Note the actual delay is not known until the first callback!
	  schedules[id] = self;
	  self.timer = timer(schedule, 0, self.time);

	  function schedule(elapsed) {
	    self.state = SCHEDULED;
	    self.timer.restart(start, self.delay, self.time);

	    // If the elapsed delay is less than our first sleep, start immediately.
	    if (self.delay <= elapsed) start(elapsed - self.delay);
	  }

	  function start(elapsed) {
	    var i, j, n, o;

	    // If the state is not SCHEDULED, then we previously errored on start.
	    if (self.state !== SCHEDULED) return stop();

	    for (i in schedules) {
	      o = schedules[i];
	      if (o.name !== self.name) continue;

	      // While this element already has a starting transition during this frame,
	      // defer starting an interrupting transition until that transition has a
	      // chance to tick (and possibly end); see d3/d3-transition#54!
	      if (o.state === STARTED) return src_timeout(start);

	      // Interrupt the active transition, if any.
	      if (o.state === RUNNING) {
	        o.state = ENDED;
	        o.timer.stop();
	        o.on.call("interrupt", node, node.__data__, o.index, o.group);
	        delete schedules[i];
	      }

	      // Cancel any pre-empted transitions.
	      else if (+i < id) {
	        o.state = ENDED;
	        o.timer.stop();
	        o.on.call("cancel", node, node.__data__, o.index, o.group);
	        delete schedules[i];
	      }
	    }

	    // Defer the first tick to end of the current frame; see d3/d3#1576.
	    // Note the transition may be canceled after start and before the first tick!
	    // Note this must be scheduled before the start event; see d3/d3-transition#16!
	    // Assuming this is successful, subsequent callbacks go straight to tick.
	    src_timeout(function() {
	      if (self.state === STARTED) {
	        self.state = RUNNING;
	        self.timer.restart(tick, self.delay, self.time);
	        tick(elapsed);
	      }
	    });

	    // Dispatch the start event.
	    // Note this must be done before the tween are initialized.
	    self.state = STARTING;
	    self.on.call("start", node, node.__data__, self.index, self.group);
	    if (self.state !== STARTING) return; // interrupted
	    self.state = STARTED;

	    // Initialize the tween, deleting null tween.
	    tween = new Array(n = self.tween.length);
	    for (i = 0, j = -1; i < n; ++i) {
	      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
	        tween[++j] = o;
	      }
	    }
	    tween.length = j + 1;
	  }

	  function tick(elapsed) {
	    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
	        i = -1,
	        n = tween.length;

	    while (++i < n) {
	      tween[i].call(node, t);
	    }

	    // Dispatch the end event.
	    if (self.state === ENDING) {
	      self.on.call("end", node, node.__data__, self.index, self.group);
	      stop();
	    }
	  }

	  function stop() {
	    self.state = ENDED;
	    self.timer.stop();
	    delete schedules[id];
	    for (var i in schedules) return; // eslint-disable-line no-unused-vars
	    delete node.__transition;
	  }
	}

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/interrupt.js


	/* harmony default export */ var interrupt = (function(node, name) {
	  var schedules = node.__transition,
	      schedule,
	      active,
	      empty = true,
	      i;

	  if (!schedules) return;

	  name = name == null ? null : name + "";

	  for (i in schedules) {
	    if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
	    active = schedule.state > STARTING && schedule.state < ENDING;
	    schedule.state = ENDED;
	    schedule.timer.stop();
	    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
	    delete schedules[i];
	  }

	  if (empty) delete node.__transition;
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/selection/interrupt.js


	/* harmony default export */ var selection_interrupt = (function(name) {
	  return this.each(function() {
	    interrupt(this, name);
	  });
	});

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/number.js
	/* harmony default export */ var number = (function(a, b) {
	  return a = +a, b = +b, function(t) {
	    return a * (1 - t) + b * t;
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/transform/decompose.js
	var degrees = 180 / Math.PI;

	var identity = {
	  translateX: 0,
	  translateY: 0,
	  rotate: 0,
	  skewX: 0,
	  scaleX: 1,
	  scaleY: 1
	};

	/* harmony default export */ var decompose = (function(a, b, c, d, e, f) {
	  var scaleX, scaleY, skewX;
	  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
	  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
	  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
	  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
	  return {
	    translateX: e,
	    translateY: f,
	    rotate: Math.atan2(b, a) * degrees,
	    skewX: Math.atan(skewX) * degrees,
	    scaleX: scaleX,
	    scaleY: scaleY
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/transform/parse.js


	var cssNode,
	    cssRoot,
	    cssView,
	    svgNode;

	function parseCss(value) {
	  if (value === "none") return identity;
	  if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
	  cssNode.style.transform = value;
	  value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
	  cssRoot.removeChild(cssNode);
	  value = value.slice(7, -1).split(",");
	  return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
	}

	function parseSvg(value) {
	  if (value == null) return identity;
	  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
	  svgNode.setAttribute("transform", value);
	  if (!(value = svgNode.transform.baseVal.consolidate())) return identity;
	  value = value.matrix;
	  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
	}

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/transform/index.js



	function interpolateTransform(parse, pxComma, pxParen, degParen) {

	  function pop(s) {
	    return s.length ? s.pop() + " " : "";
	  }

	  function translate(xa, ya, xb, yb, s, q) {
	    if (xa !== xb || ya !== yb) {
	      var i = s.push("translate(", null, pxComma, null, pxParen);
	      q.push({i: i - 4, x: number(xa, xb)}, {i: i - 2, x: number(ya, yb)});
	    } else if (xb || yb) {
	      s.push("translate(" + xb + pxComma + yb + pxParen);
	    }
	  }

	  function rotate(a, b, s, q) {
	    if (a !== b) {
	      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
	      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: number(a, b)});
	    } else if (b) {
	      s.push(pop(s) + "rotate(" + b + degParen);
	    }
	  }

	  function skewX(a, b, s, q) {
	    if (a !== b) {
	      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: number(a, b)});
	    } else if (b) {
	      s.push(pop(s) + "skewX(" + b + degParen);
	    }
	  }

	  function scale(xa, ya, xb, yb, s, q) {
	    if (xa !== xb || ya !== yb) {
	      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
	      q.push({i: i - 4, x: number(xa, xb)}, {i: i - 2, x: number(ya, yb)});
	    } else if (xb !== 1 || yb !== 1) {
	      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
	    }
	  }

	  return function(a, b) {
	    var s = [], // string constants and placeholders
	        q = []; // number interpolators
	    a = parse(a), b = parse(b);
	    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
	    rotate(a.rotate, b.rotate, s, q);
	    skewX(a.skewX, b.skewX, s, q);
	    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
	    a = b = null; // gc
	    return function(t) {
	      var i = -1, n = q.length, o;
	      while (++i < n) s[(o = q[i]).i] = o.x(t);
	      return s.join("");
	    };
	  };
	}

	var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
	var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/tween.js


	function tweenRemove(id, name) {
	  var tween0, tween1;
	  return function() {
	    var schedule = schedule_set(this, id),
	        tween = schedule.tween;

	    // If this node shared tween with the previous node,
	    // just assign the updated shared tween and we’re done!
	    // Otherwise, copy-on-write.
	    if (tween !== tween0) {
	      tween1 = tween0 = tween;
	      for (var i = 0, n = tween1.length; i < n; ++i) {
	        if (tween1[i].name === name) {
	          tween1 = tween1.slice();
	          tween1.splice(i, 1);
	          break;
	        }
	      }
	    }

	    schedule.tween = tween1;
	  };
	}

	function tweenFunction(id, name, value) {
	  var tween0, tween1;
	  if (typeof value !== "function") throw new Error;
	  return function() {
	    var schedule = schedule_set(this, id),
	        tween = schedule.tween;

	    // If this node shared tween with the previous node,
	    // just assign the updated shared tween and we’re done!
	    // Otherwise, copy-on-write.
	    if (tween !== tween0) {
	      tween1 = (tween0 = tween).slice();
	      for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
	        if (tween1[i].name === name) {
	          tween1[i] = t;
	          break;
	        }
	      }
	      if (i === n) tween1.push(t);
	    }

	    schedule.tween = tween1;
	  };
	}

	/* harmony default export */ var transition_tween = (function(name, value) {
	  var id = this._id;

	  name += "";

	  if (arguments.length < 2) {
	    var tween = schedule_get(this.node(), id).tween;
	    for (var i = 0, n = tween.length, t; i < n; ++i) {
	      if ((t = tween[i]).name === name) {
	        return t.value;
	      }
	    }
	    return null;
	  }

	  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
	});

	function tweenValue(transition, name, value) {
	  var id = transition._id;

	  transition.each(function() {
	    var schedule = schedule_set(this, id);
	    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
	  });

	  return function(node) {
	    return schedule_get(node, id).value[name];
	  };
	}

	// CONCATENATED MODULE: ../node_modules/d3-color/src/define.js
	/* harmony default export */ var define = (function(constructor, factory, prototype) {
	  constructor.prototype = factory.prototype = prototype;
	  prototype.constructor = constructor;
	});

	function extend(parent, definition) {
	  var prototype = Object.create(parent.prototype);
	  for (var key in definition) prototype[key] = definition[key];
	  return prototype;
	}

	// CONCATENATED MODULE: ../node_modules/d3-color/src/color.js


	function Color() {}

	var darker = 0.7;
	var brighter = 1 / darker;

	var reI = "\\s*([+-]?\\d+)\\s*",
	    reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
	    reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
	    reHex = /^#([0-9a-f]{3,8})$/,
	    reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
	    reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
	    reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
	    reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
	    reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
	    reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

	var named = {
	  aliceblue: 0xf0f8ff,
	  antiquewhite: 0xfaebd7,
	  aqua: 0x00ffff,
	  aquamarine: 0x7fffd4,
	  azure: 0xf0ffff,
	  beige: 0xf5f5dc,
	  bisque: 0xffe4c4,
	  black: 0x000000,
	  blanchedalmond: 0xffebcd,
	  blue: 0x0000ff,
	  blueviolet: 0x8a2be2,
	  brown: 0xa52a2a,
	  burlywood: 0xdeb887,
	  cadetblue: 0x5f9ea0,
	  chartreuse: 0x7fff00,
	  chocolate: 0xd2691e,
	  coral: 0xff7f50,
	  cornflowerblue: 0x6495ed,
	  cornsilk: 0xfff8dc,
	  crimson: 0xdc143c,
	  cyan: 0x00ffff,
	  darkblue: 0x00008b,
	  darkcyan: 0x008b8b,
	  darkgoldenrod: 0xb8860b,
	  darkgray: 0xa9a9a9,
	  darkgreen: 0x006400,
	  darkgrey: 0xa9a9a9,
	  darkkhaki: 0xbdb76b,
	  darkmagenta: 0x8b008b,
	  darkolivegreen: 0x556b2f,
	  darkorange: 0xff8c00,
	  darkorchid: 0x9932cc,
	  darkred: 0x8b0000,
	  darksalmon: 0xe9967a,
	  darkseagreen: 0x8fbc8f,
	  darkslateblue: 0x483d8b,
	  darkslategray: 0x2f4f4f,
	  darkslategrey: 0x2f4f4f,
	  darkturquoise: 0x00ced1,
	  darkviolet: 0x9400d3,
	  deeppink: 0xff1493,
	  deepskyblue: 0x00bfff,
	  dimgray: 0x696969,
	  dimgrey: 0x696969,
	  dodgerblue: 0x1e90ff,
	  firebrick: 0xb22222,
	  floralwhite: 0xfffaf0,
	  forestgreen: 0x228b22,
	  fuchsia: 0xff00ff,
	  gainsboro: 0xdcdcdc,
	  ghostwhite: 0xf8f8ff,
	  gold: 0xffd700,
	  goldenrod: 0xdaa520,
	  gray: 0x808080,
	  green: 0x008000,
	  greenyellow: 0xadff2f,
	  grey: 0x808080,
	  honeydew: 0xf0fff0,
	  hotpink: 0xff69b4,
	  indianred: 0xcd5c5c,
	  indigo: 0x4b0082,
	  ivory: 0xfffff0,
	  khaki: 0xf0e68c,
	  lavender: 0xe6e6fa,
	  lavenderblush: 0xfff0f5,
	  lawngreen: 0x7cfc00,
	  lemonchiffon: 0xfffacd,
	  lightblue: 0xadd8e6,
	  lightcoral: 0xf08080,
	  lightcyan: 0xe0ffff,
	  lightgoldenrodyellow: 0xfafad2,
	  lightgray: 0xd3d3d3,
	  lightgreen: 0x90ee90,
	  lightgrey: 0xd3d3d3,
	  lightpink: 0xffb6c1,
	  lightsalmon: 0xffa07a,
	  lightseagreen: 0x20b2aa,
	  lightskyblue: 0x87cefa,
	  lightslategray: 0x778899,
	  lightslategrey: 0x778899,
	  lightsteelblue: 0xb0c4de,
	  lightyellow: 0xffffe0,
	  lime: 0x00ff00,
	  limegreen: 0x32cd32,
	  linen: 0xfaf0e6,
	  magenta: 0xff00ff,
	  maroon: 0x800000,
	  mediumaquamarine: 0x66cdaa,
	  mediumblue: 0x0000cd,
	  mediumorchid: 0xba55d3,
	  mediumpurple: 0x9370db,
	  mediumseagreen: 0x3cb371,
	  mediumslateblue: 0x7b68ee,
	  mediumspringgreen: 0x00fa9a,
	  mediumturquoise: 0x48d1cc,
	  mediumvioletred: 0xc71585,
	  midnightblue: 0x191970,
	  mintcream: 0xf5fffa,
	  mistyrose: 0xffe4e1,
	  moccasin: 0xffe4b5,
	  navajowhite: 0xffdead,
	  navy: 0x000080,
	  oldlace: 0xfdf5e6,
	  olive: 0x808000,
	  olivedrab: 0x6b8e23,
	  orange: 0xffa500,
	  orangered: 0xff4500,
	  orchid: 0xda70d6,
	  palegoldenrod: 0xeee8aa,
	  palegreen: 0x98fb98,
	  paleturquoise: 0xafeeee,
	  palevioletred: 0xdb7093,
	  papayawhip: 0xffefd5,
	  peachpuff: 0xffdab9,
	  peru: 0xcd853f,
	  pink: 0xffc0cb,
	  plum: 0xdda0dd,
	  powderblue: 0xb0e0e6,
	  purple: 0x800080,
	  rebeccapurple: 0x663399,
	  red: 0xff0000,
	  rosybrown: 0xbc8f8f,
	  royalblue: 0x4169e1,
	  saddlebrown: 0x8b4513,
	  salmon: 0xfa8072,
	  sandybrown: 0xf4a460,
	  seagreen: 0x2e8b57,
	  seashell: 0xfff5ee,
	  sienna: 0xa0522d,
	  silver: 0xc0c0c0,
	  skyblue: 0x87ceeb,
	  slateblue: 0x6a5acd,
	  slategray: 0x708090,
	  slategrey: 0x708090,
	  snow: 0xfffafa,
	  springgreen: 0x00ff7f,
	  steelblue: 0x4682b4,
	  tan: 0xd2b48c,
	  teal: 0x008080,
	  thistle: 0xd8bfd8,
	  tomato: 0xff6347,
	  turquoise: 0x40e0d0,
	  violet: 0xee82ee,
	  wheat: 0xf5deb3,
	  white: 0xffffff,
	  whitesmoke: 0xf5f5f5,
	  yellow: 0xffff00,
	  yellowgreen: 0x9acd32
	};

	define(Color, color_color, {
	  copy: function(channels) {
	    return Object.assign(new this.constructor, this, channels);
	  },
	  displayable: function() {
	    return this.rgb().displayable();
	  },
	  hex: color_formatHex, // Deprecated! Use color.formatHex.
	  formatHex: color_formatHex,
	  formatHsl: color_formatHsl,
	  formatRgb: color_formatRgb,
	  toString: color_formatRgb
	});

	function color_formatHex() {
	  return this.rgb().formatHex();
	}

	function color_formatHsl() {
	  return hslConvert(this).formatHsl();
	}

	function color_formatRgb() {
	  return this.rgb().formatRgb();
	}

	function color_color(format) {
	  var m, l;
	  format = (format + "").trim().toLowerCase();
	  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
	      : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
	      : l === 8 ? new Rgb(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
	      : l === 4 ? new Rgb((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
	      : null) // invalid hex
	      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
	      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
	      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
	      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
	      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
	      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
	      : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
	      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
	      : null;
	}

	function rgbn(n) {
	  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
	}

	function rgba(r, g, b, a) {
	  if (a <= 0) r = g = b = NaN;
	  return new Rgb(r, g, b, a);
	}

	function rgbConvert(o) {
	  if (!(o instanceof Color)) o = color_color(o);
	  if (!o) return new Rgb;
	  o = o.rgb();
	  return new Rgb(o.r, o.g, o.b, o.opacity);
	}

	function color_rgb(r, g, b, opacity) {
	  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
	}

	function Rgb(r, g, b, opacity) {
	  this.r = +r;
	  this.g = +g;
	  this.b = +b;
	  this.opacity = +opacity;
	}

	define(Rgb, color_rgb, extend(Color, {
	  brighter: function(k) {
	    k = k == null ? brighter : Math.pow(brighter, k);
	    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
	  },
	  darker: function(k) {
	    k = k == null ? darker : Math.pow(darker, k);
	    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
	  },
	  rgb: function() {
	    return this;
	  },
	  displayable: function() {
	    return (-0.5 <= this.r && this.r < 255.5)
	        && (-0.5 <= this.g && this.g < 255.5)
	        && (-0.5 <= this.b && this.b < 255.5)
	        && (0 <= this.opacity && this.opacity <= 1);
	  },
	  hex: rgb_formatHex, // Deprecated! Use color.formatHex.
	  formatHex: rgb_formatHex,
	  formatRgb: rgb_formatRgb,
	  toString: rgb_formatRgb
	}));

	function rgb_formatHex() {
	  return "#" + hex(this.r) + hex(this.g) + hex(this.b);
	}

	function rgb_formatRgb() {
	  var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
	  return (a === 1 ? "rgb(" : "rgba(")
	      + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
	      + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
	      + Math.max(0, Math.min(255, Math.round(this.b) || 0))
	      + (a === 1 ? ")" : ", " + a + ")");
	}

	function hex(value) {
	  value = Math.max(0, Math.min(255, Math.round(value) || 0));
	  return (value < 16 ? "0" : "") + value.toString(16);
	}

	function hsla(h, s, l, a) {
	  if (a <= 0) h = s = l = NaN;
	  else if (l <= 0 || l >= 1) h = s = NaN;
	  else if (s <= 0) h = NaN;
	  return new Hsl(h, s, l, a);
	}

	function hslConvert(o) {
	  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
	  if (!(o instanceof Color)) o = color_color(o);
	  if (!o) return new Hsl;
	  if (o instanceof Hsl) return o;
	  o = o.rgb();
	  var r = o.r / 255,
	      g = o.g / 255,
	      b = o.b / 255,
	      min = Math.min(r, g, b),
	      max = Math.max(r, g, b),
	      h = NaN,
	      s = max - min,
	      l = (max + min) / 2;
	  if (s) {
	    if (r === max) h = (g - b) / s + (g < b) * 6;
	    else if (g === max) h = (b - r) / s + 2;
	    else h = (r - g) / s + 4;
	    s /= l < 0.5 ? max + min : 2 - max - min;
	    h *= 60;
	  } else {
	    s = l > 0 && l < 1 ? 0 : h;
	  }
	  return new Hsl(h, s, l, o.opacity);
	}

	function hsl(h, s, l, opacity) {
	  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
	}

	function Hsl(h, s, l, opacity) {
	  this.h = +h;
	  this.s = +s;
	  this.l = +l;
	  this.opacity = +opacity;
	}

	define(Hsl, hsl, extend(Color, {
	  brighter: function(k) {
	    k = k == null ? brighter : Math.pow(brighter, k);
	    return new Hsl(this.h, this.s, this.l * k, this.opacity);
	  },
	  darker: function(k) {
	    k = k == null ? darker : Math.pow(darker, k);
	    return new Hsl(this.h, this.s, this.l * k, this.opacity);
	  },
	  rgb: function() {
	    var h = this.h % 360 + (this.h < 0) * 360,
	        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
	        l = this.l,
	        m2 = l + (l < 0.5 ? l : 1 - l) * s,
	        m1 = 2 * l - m2;
	    return new Rgb(
	      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
	      hsl2rgb(h, m1, m2),
	      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
	      this.opacity
	    );
	  },
	  displayable: function() {
	    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
	        && (0 <= this.l && this.l <= 1)
	        && (0 <= this.opacity && this.opacity <= 1);
	  },
	  formatHsl: function() {
	    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
	    return (a === 1 ? "hsl(" : "hsla(")
	        + (this.h || 0) + ", "
	        + (this.s || 0) * 100 + "%, "
	        + (this.l || 0) * 100 + "%"
	        + (a === 1 ? ")" : ", " + a + ")");
	  }
	}));

	/* From FvD 13.37, CSS Color Module Level 3 */
	function hsl2rgb(h, m1, m2) {
	  return (h < 60 ? m1 + (m2 - m1) * h / 60
	      : h < 180 ? m2
	      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
	      : m1) * 255;
	}

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/constant.js
	/* harmony default export */ var src_constant = (function(x) {
	  return function() {
	    return x;
	  };
	});

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/color.js


	function linear(a, d) {
	  return function(t) {
	    return a + t * d;
	  };
	}

	function exponential(a, b, y) {
	  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
	    return Math.pow(a + t * b, y);
	  };
	}

	function gamma(y) {
	  return (y = +y) === 1 ? nogamma : function(a, b) {
	    return b - a ? exponential(a, b, y) : src_constant(isNaN(a) ? b : a);
	  };
	}

	function nogamma(a, b) {
	  var d = b - a;
	  return d ? linear(a, d) : src_constant(isNaN(a) ? b : a);
	}

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/rgb.js





	/* harmony default export */ var src_rgb = ((function rgbGamma(y) {
	  var color = gamma(y);

	  function rgb(start, end) {
	    var r = color((start = color_rgb(start)).r, (end = color_rgb(end)).r),
	        g = color(start.g, end.g),
	        b = color(start.b, end.b),
	        opacity = nogamma(start.opacity, end.opacity);
	    return function(t) {
	      start.r = r(t);
	      start.g = g(t);
	      start.b = b(t);
	      start.opacity = opacity(t);
	      return start + "";
	    };
	  }

	  rgb.gamma = rgbGamma;

	  return rgb;
	})(1));

	// CONCATENATED MODULE: ../node_modules/d3-interpolate/src/string.js


	var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
	    reB = new RegExp(reA.source, "g");

	function zero(b) {
	  return function() {
	    return b;
	  };
	}

	function one(b) {
	  return function(t) {
	    return b(t) + "";
	  };
	}

	/* harmony default export */ var string = (function(a, b) {
	  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
	      am, // current match in a
	      bm, // current match in b
	      bs, // string preceding current number in b, if any
	      i = -1, // index in s
	      s = [], // string constants and placeholders
	      q = []; // number interpolators

	  // Coerce inputs to strings.
	  a = a + "", b = b + "";

	  // Interpolate pairs of numbers in a & b.
	  while ((am = reA.exec(a))
	      && (bm = reB.exec(b))) {
	    if ((bs = bm.index) > bi) { // a string precedes the next number in b
	      bs = b.slice(bi, bs);
	      if (s[i]) s[i] += bs; // coalesce with previous string
	      else s[++i] = bs;
	    }
	    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
	      if (s[i]) s[i] += bm; // coalesce with previous string
	      else s[++i] = bm;
	    } else { // interpolate non-matching numbers
	      s[++i] = null;
	      q.push({i: i, x: number(am, bm)});
	    }
	    bi = reB.lastIndex;
	  }

	  // Add remains of b.
	  if (bi < b.length) {
	    bs = b.slice(bi);
	    if (s[i]) s[i] += bs; // coalesce with previous string
	    else s[++i] = bs;
	  }

	  // Special optimization for only a single match.
	  // Otherwise, interpolate each of the numbers and rejoin the string.
	  return s.length < 2 ? (q[0]
	      ? one(q[0].x)
	      : zero(b))
	      : (b = q.length, function(t) {
	          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
	          return s.join("");
	        });
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/interpolate.js



	/* harmony default export */ var transition_interpolate = (function(a, b) {
	  var c;
	  return (typeof b === "number" ? number
	      : b instanceof color_color ? src_rgb
	      : (c = color_color(b)) ? (b = c, src_rgb)
	      : string)(a, b);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/attr.js





	function attr_attrRemove(name) {
	  return function() {
	    this.removeAttribute(name);
	  };
	}

	function attr_attrRemoveNS(fullname) {
	  return function() {
	    this.removeAttributeNS(fullname.space, fullname.local);
	  };
	}

	function attr_attrConstant(name, interpolate, value1) {
	  var string00,
	      string1 = value1 + "",
	      interpolate0;
	  return function() {
	    var string0 = this.getAttribute(name);
	    return string0 === string1 ? null
	        : string0 === string00 ? interpolate0
	        : interpolate0 = interpolate(string00 = string0, value1);
	  };
	}

	function attr_attrConstantNS(fullname, interpolate, value1) {
	  var string00,
	      string1 = value1 + "",
	      interpolate0;
	  return function() {
	    var string0 = this.getAttributeNS(fullname.space, fullname.local);
	    return string0 === string1 ? null
	        : string0 === string00 ? interpolate0
	        : interpolate0 = interpolate(string00 = string0, value1);
	  };
	}

	function attr_attrFunction(name, interpolate, value) {
	  var string00,
	      string10,
	      interpolate0;
	  return function() {
	    var string0, value1 = value(this), string1;
	    if (value1 == null) return void this.removeAttribute(name);
	    string0 = this.getAttribute(name);
	    string1 = value1 + "";
	    return string0 === string1 ? null
	        : string0 === string00 && string1 === string10 ? interpolate0
	        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
	  };
	}

	function attr_attrFunctionNS(fullname, interpolate, value) {
	  var string00,
	      string10,
	      interpolate0;
	  return function() {
	    var string0, value1 = value(this), string1;
	    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
	    string0 = this.getAttributeNS(fullname.space, fullname.local);
	    string1 = value1 + "";
	    return string0 === string1 ? null
	        : string0 === string00 && string1 === string10 ? interpolate0
	        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
	  };
	}

	/* harmony default export */ var transition_attr = (function(name, value) {
	  var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : transition_interpolate;
	  return this.attrTween(name, typeof value === "function"
	      ? (fullname.local ? attr_attrFunctionNS : attr_attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
	      : value == null ? (fullname.local ? attr_attrRemoveNS : attr_attrRemove)(fullname)
	      : (fullname.local ? attr_attrConstantNS : attr_attrConstant)(fullname, i, value));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/attrTween.js


	function attrInterpolate(name, i) {
	  return function(t) {
	    this.setAttribute(name, i.call(this, t));
	  };
	}

	function attrInterpolateNS(fullname, i) {
	  return function(t) {
	    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
	  };
	}

	function attrTweenNS(fullname, value) {
	  var t0, i0;
	  function tween() {
	    var i = value.apply(this, arguments);
	    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
	    return t0;
	  }
	  tween._value = value;
	  return tween;
	}

	function attrTween(name, value) {
	  var t0, i0;
	  function tween() {
	    var i = value.apply(this, arguments);
	    if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
	    return t0;
	  }
	  tween._value = value;
	  return tween;
	}

	/* harmony default export */ var transition_attrTween = (function(name, value) {
	  var key = "attr." + name;
	  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
	  if (value == null) return this.tween(key, null);
	  if (typeof value !== "function") throw new Error;
	  var fullname = namespace(name);
	  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/delay.js


	function delayFunction(id, value) {
	  return function() {
	    init(this, id).delay = +value.apply(this, arguments);
	  };
	}

	function delayConstant(id, value) {
	  return value = +value, function() {
	    init(this, id).delay = value;
	  };
	}

	/* harmony default export */ var transition_delay = (function(value) {
	  var id = this._id;

	  return arguments.length
	      ? this.each((typeof value === "function"
	          ? delayFunction
	          : delayConstant)(id, value))
	      : schedule_get(this.node(), id).delay;
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/duration.js


	function durationFunction(id, value) {
	  return function() {
	    schedule_set(this, id).duration = +value.apply(this, arguments);
	  };
	}

	function durationConstant(id, value) {
	  return value = +value, function() {
	    schedule_set(this, id).duration = value;
	  };
	}

	/* harmony default export */ var duration = (function(value) {
	  var id = this._id;

	  return arguments.length
	      ? this.each((typeof value === "function"
	          ? durationFunction
	          : durationConstant)(id, value))
	      : schedule_get(this.node(), id).duration;
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/ease.js


	function easeConstant(id, value) {
	  if (typeof value !== "function") throw new Error;
	  return function() {
	    schedule_set(this, id).ease = value;
	  };
	}

	/* harmony default export */ var ease = (function(value) {
	  var id = this._id;

	  return arguments.length
	      ? this.each(easeConstant(id, value))
	      : schedule_get(this.node(), id).ease;
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/filter.js



	/* harmony default export */ var transition_filter = (function(match) {
	  if (typeof match !== "function") match = matcher(match);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
	      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
	        subgroup.push(node);
	      }
	    }
	  }

	  return new Transition(subgroups, this._parents, this._name, this._id);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/merge.js


	/* harmony default export */ var transition_merge = (function(transition) {
	  if (transition._id !== this._id) throw new Error;

	  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
	    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
	      if (node = group0[i] || group1[i]) {
	        merge[i] = node;
	      }
	    }
	  }

	  for (; j < m0; ++j) {
	    merges[j] = groups0[j];
	  }

	  return new Transition(merges, this._parents, this._name, this._id);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/on.js


	function on_start(name) {
	  return (name + "").trim().split(/^|\s+/).every(function(t) {
	    var i = t.indexOf(".");
	    if (i >= 0) t = t.slice(0, i);
	    return !t || t === "start";
	  });
	}

	function onFunction(id, name, listener) {
	  var on0, on1, sit = on_start(name) ? init : schedule_set;
	  return function() {
	    var schedule = sit(this, id),
	        on = schedule.on;

	    // If this node shared a dispatch with the previous node,
	    // just assign the updated shared dispatch and we’re done!
	    // Otherwise, copy-on-write.
	    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

	    schedule.on = on1;
	  };
	}

	/* harmony default export */ var transition_on = (function(name, listener) {
	  var id = this._id;

	  return arguments.length < 2
	      ? schedule_get(this.node(), id).on.on(name)
	      : this.each(onFunction(id, name, listener));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/remove.js
	function removeFunction(id) {
	  return function() {
	    var parent = this.parentNode;
	    for (var i in this.__transition) if (+i !== id) return;
	    if (parent) parent.removeChild(this);
	  };
	}

	/* harmony default export */ var transition_remove = (function() {
	  return this.on("end.remove", removeFunction(this._id));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/select.js




	/* harmony default export */ var transition_select = (function(select) {
	  var name = this._name,
	      id = this._id;

	  if (typeof select !== "function") select = src_selector(select);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
	      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
	        if ("__data__" in node) subnode.__data__ = node.__data__;
	        subgroup[i] = subnode;
	        transition_schedule(subgroup[i], name, id, i, subgroup, schedule_get(node, id));
	      }
	    }
	  }

	  return new Transition(subgroups, this._parents, name, id);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/selectAll.js




	/* harmony default export */ var transition_selectAll = (function(select) {
	  var name = this._name,
	      id = this._id;

	  if (typeof select !== "function") select = selectorAll(select);

	  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        for (var children = select.call(node, node.__data__, i, group), child, inherit = schedule_get(node, id), k = 0, l = children.length; k < l; ++k) {
	          if (child = children[k]) {
	            transition_schedule(child, name, id, k, children, inherit);
	          }
	        }
	        subgroups.push(children);
	        parents.push(node);
	      }
	    }
	  }

	  return new Transition(subgroups, parents, name, id);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/selection.js


	var selection_Selection = src_selection.prototype.constructor;

	/* harmony default export */ var transition_selection = (function() {
	  return new selection_Selection(this._groups, this._parents);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/style.js






	function styleNull(name, interpolate) {
	  var string00,
	      string10,
	      interpolate0;
	  return function() {
	    var string0 = styleValue(this, name),
	        string1 = (this.style.removeProperty(name), styleValue(this, name));
	    return string0 === string1 ? null
	        : string0 === string00 && string1 === string10 ? interpolate0
	        : interpolate0 = interpolate(string00 = string0, string10 = string1);
	  };
	}

	function style_styleRemove(name) {
	  return function() {
	    this.style.removeProperty(name);
	  };
	}

	function style_styleConstant(name, interpolate, value1) {
	  var string00,
	      string1 = value1 + "",
	      interpolate0;
	  return function() {
	    var string0 = styleValue(this, name);
	    return string0 === string1 ? null
	        : string0 === string00 ? interpolate0
	        : interpolate0 = interpolate(string00 = string0, value1);
	  };
	}

	function style_styleFunction(name, interpolate, value) {
	  var string00,
	      string10,
	      interpolate0;
	  return function() {
	    var string0 = styleValue(this, name),
	        value1 = value(this),
	        string1 = value1 + "";
	    if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
	    return string0 === string1 ? null
	        : string0 === string00 && string1 === string10 ? interpolate0
	        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
	  };
	}

	function styleMaybeRemove(id, name) {
	  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
	  return function() {
	    var schedule = schedule_set(this, id),
	        on = schedule.on,
	        listener = schedule.value[key] == null ? remove || (remove = style_styleRemove(name)) : undefined;

	    // If this node shared a dispatch with the previous node,
	    // just assign the updated shared dispatch and we’re done!
	    // Otherwise, copy-on-write.
	    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

	    schedule.on = on1;
	  };
	}

	/* harmony default export */ var transition_style = (function(name, value, priority) {
	  var i = (name += "") === "transform" ? interpolateTransformCss : transition_interpolate;
	  return value == null ? this
	      .styleTween(name, styleNull(name, i))
	      .on("end.style." + name, style_styleRemove(name))
	    : typeof value === "function" ? this
	      .styleTween(name, style_styleFunction(name, i, tweenValue(this, "style." + name, value)))
	      .each(styleMaybeRemove(this._id, name))
	    : this
	      .styleTween(name, style_styleConstant(name, i, value), priority)
	      .on("end.style." + name, null);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/styleTween.js
	function styleInterpolate(name, i, priority) {
	  return function(t) {
	    this.style.setProperty(name, i.call(this, t), priority);
	  };
	}

	function styleTween(name, value, priority) {
	  var t, i0;
	  function tween() {
	    var i = value.apply(this, arguments);
	    if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
	    return t;
	  }
	  tween._value = value;
	  return tween;
	}

	/* harmony default export */ var transition_styleTween = (function(name, value, priority) {
	  var key = "style." + (name += "");
	  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
	  if (value == null) return this.tween(key, null);
	  if (typeof value !== "function") throw new Error;
	  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/text.js


	function text_textConstant(value) {
	  return function() {
	    this.textContent = value;
	  };
	}

	function text_textFunction(value) {
	  return function() {
	    var value1 = value(this);
	    this.textContent = value1 == null ? "" : value1;
	  };
	}

	/* harmony default export */ var transition_text = (function(value) {
	  return this.tween("text", typeof value === "function"
	      ? text_textFunction(tweenValue(this, "text", value))
	      : text_textConstant(value == null ? "" : value + ""));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/textTween.js
	function textInterpolate(i) {
	  return function(t) {
	    this.textContent = i.call(this, t);
	  };
	}

	function textTween(value) {
	  var t0, i0;
	  function tween() {
	    var i = value.apply(this, arguments);
	    if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
	    return t0;
	  }
	  tween._value = value;
	  return tween;
	}

	/* harmony default export */ var transition_textTween = (function(value) {
	  var key = "text";
	  if (arguments.length < 1) return (key = this.tween(key)) && key._value;
	  if (value == null) return this.tween(key, null);
	  if (typeof value !== "function") throw new Error;
	  return this.tween(key, textTween(value));
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/transition.js



	/* harmony default export */ var transition_transition = (function() {
	  var name = this._name,
	      id0 = this._id,
	      id1 = newId();

	  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        var inherit = schedule_get(node, id0);
	        transition_schedule(node, name, id1, i, group, {
	          time: inherit.time + inherit.delay + inherit.duration,
	          delay: 0,
	          duration: inherit.duration,
	          ease: inherit.ease
	        });
	      }
	    }
	  }

	  return new Transition(groups, this._parents, name, id1);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/end.js


	/* harmony default export */ var transition_end = (function() {
	  var on0, on1, that = this, id = that._id, size = that.size();
	  return new Promise(function(resolve, reject) {
	    var cancel = {value: reject},
	        end = {value: function() { if (--size === 0) resolve(); }};

	    that.each(function() {
	      var schedule = schedule_set(this, id),
	          on = schedule.on;

	      // If this node shared a dispatch with the previous node,
	      // just assign the updated shared dispatch and we’re done!
	      // Otherwise, copy-on-write.
	      if (on !== on0) {
	        on1 = (on0 = on).copy();
	        on1._.cancel.push(cancel);
	        on1._.interrupt.push(cancel);
	        on1._.end.push(end);
	      }

	      schedule.on = on1;
	    });
	  });
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/transition/index.js





















	var transition_id = 0;

	function Transition(groups, parents, name, id) {
	  this._groups = groups;
	  this._parents = parents;
	  this._name = name;
	  this._id = id;
	}

	function newId() {
	  return ++transition_id;
	}

	var selection_prototype = src_selection.prototype;

	Transition.prototype = {
	  constructor: Transition,
	  select: transition_select,
	  selectAll: transition_selectAll,
	  filter: transition_filter,
	  merge: transition_merge,
	  selection: transition_selection,
	  transition: transition_transition,
	  call: selection_prototype.call,
	  nodes: selection_prototype.nodes,
	  node: selection_prototype.node,
	  size: selection_prototype.size,
	  empty: selection_prototype.empty,
	  each: selection_prototype.each,
	  on: transition_on,
	  attr: transition_attr,
	  attrTween: transition_attrTween,
	  style: transition_style,
	  styleTween: transition_styleTween,
	  text: transition_text,
	  textTween: transition_textTween,
	  remove: transition_remove,
	  tween: transition_tween,
	  delay: transition_delay,
	  duration: duration,
	  ease: ease,
	  end: transition_end
	};

	function cubicInOut(t) {
	  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
	}

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/selection/transition.js





	var defaultTiming = {
	  time: null, // Set on use.
	  delay: 0,
	  duration: 250,
	  ease: cubicInOut
	};

	function transition_inherit(node, id) {
	  var timing;
	  while (!(timing = node.__transition) || !(timing = timing[id])) {
	    if (!(node = node.parentNode)) {
	      return defaultTiming.time = now(), defaultTiming;
	    }
	  }
	  return timing;
	}

	/* harmony default export */ var selection_transition = (function(name) {
	  var id,
	      timing;

	  if (name instanceof Transition) {
	    id = name._id, name = name._name;
	  } else {
	    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
	  }

	  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        transition_schedule(node, name, id, i, group, timing || transition_inherit(node, id));
	      }
	    }
	  }

	  return new Transition(groups, this._parents, name, id);
	});

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/selection/index.js




	src_selection.prototype.interrupt = selection_interrupt;
	src_selection.prototype.transition = selection_transition;

	// CONCATENATED MODULE: ../node_modules/d3-transition/src/index.js





	// CONCATENATED MODULE: ./tooltip.js
	/* global event */






	function defaultLabel (d) {
	    return d.data.name
	}

	function defaultFlamegraphTooltip () {
	    var rootElement = src_select('body');
	    var tooltip = null;
	    var html = defaultLabel;

	    function tip () {
	        tooltip = rootElement
	            .append('div')
	            .style('display', 'none')
	            .style('position', 'absolute')
	            .style('opacity', 0)
	            .style('pointer-events', 'none')
	            .attr('class', 'd3-flame-graph-tip');
	    }

	    tip.show = function (d) {
	        tooltip
	            .style('display', 'block')
	            .transition()
	            .duration(200)
	            .style('opacity', 1)
	            .style('pointer-events', 'all');

	        tooltip
	            .html(html(d))
	            .style('left', event.pageX + 5 + 'px')
	            .style('top', event.pageY + 5 + 'px');

	        return tip
	    };

	    tip.hide = function () {
	        tooltip
	            .style('display', 'none')
	            .transition()
	            .duration(200)
	            .style('opacity', 0)
	            .style('pointer-events', 'none');

	        return tip
	    };

	    tip.html = function (_) {
	        if (!arguments.length) return html
	        html = _;
	        return tip
	    };

	    return tip
	}


	/***/ })

	/******/ });
	});
	});

	// really just a magic number
	const FONT_SIZE = 9;
	const has$3 = Object.prototype.hasOwnProperty;

	function positionFromTransform(e) {
	  const transformMatrix = e.node().transform.baseVal.getItem(0).matrix;
	  return { x: transformMatrix.e, y: transformMatrix.f };
	}

	function buildName(d) {
	  const { input } = d;

	  const label = Models.getLabel(input);
	  if (label) {
	    return label;
	  }

	  if (d.isRoot()) {
	    return 'Main.main';
	  }

	  const classTokens = (input.defined_class || '<unknown>')
	    .split(/_|\/|\$|\(.*\)/)
	    .filter((x) => x);

	  const event = {
	    defined_class: classTokens.pop(),
	    method_id: input.method_id,
	    static: input.static,
	  };

	  return fullyQualifiedFunctionName(event);
	}

	function getPoints(viewSelector, node) {
	  const transformMatrix = node.node().transform.baseVal.getItem(0).matrix;
	  const width = node.attr('width');
	  const height = node.attr('height');
	  const nodeX = transformMatrix.e;
	  const nodeY = transformMatrix.f;
	  const { clientWidth, clientHeight } = viewSelector.node();
	  const { data } = node.data()[0];

	  let xOffset = data.value * FONT_SIZE * 0.5;
	  if (xOffset * 2 > clientWidth) {
	    xOffset = data.label.length * FONT_SIZE * 0.5;
	  }

	  const x = nodeX + xOffset - clientWidth * 0.5;
	  const y = nodeY - clientHeight * 0.5;
	  const labelLength = data.label.length;

	  return {
	    node: {
	      top: nodeY,
	      left: nodeX,
	      right: nodeX + width,
	      bottom: nodeY + height,
	      center: { x, y },
	    },
	    label: {
	      top: nodeY,
	      left: nodeX,
	      right: nodeX + labelLength * FONT_SIZE,
	      bottom: nodeY + FONT_SIZE,
	      center: {
	        x: nodeX + labelLength * FONT_SIZE * 0.5,
	        y: nodeY + FONT_SIZE * 0.5,
	      },
	    },
	  };
	}

	const COMPONENT_OPTIONS$1 = {
	  zoom: false,
	};

	class Timeline extends Models.EventSource {
	  constructor(container, options = {}) {
	    super();

	    const timelineOptions = cjs(COMPONENT_OPTIONS$1, options);

	    this.container = new Container(container, timelineOptions);

	    this.container.style.display = 'block';

	    this.timelineGroup = d3.select(this.container)
	      .append('div')
	      .classed('appmap__timeline', true);

	    this.timelineSelection = this.timelineGroup
	      .append('svg')
	      .classed('appmap__timiline-graph', true);
	  }

	  setCallTree(callTree) {
	    this.callTree = callTree;

	    this.callTree.on('selectedEvent', (event) => {
	      this.highlight(event, this.callTree.rootEvent);
	    });

	    this.callTree.on('rootEvent', () => {
	      this.render();
	    });
	  }

	  render() {
	    const { rootEvent } = this.callTree;

	    rootEvent.postOrderForEach((d) => {
	      d.label = buildName(d);
	      d.value = d.label.length;
	      d.valueChildren = d.children.reduce((total, child) => {
	        const valueChildren = child.valueChildren || 0;
	        if (child.value > valueChildren) {
	          return total + child.value;
	        }
	        return total + valueChildren;
	      }, 0);
	    });

	    // grow children to fit their parents
	    rootEvent.preOrderForEach((d) => {
	      d.value = Math.max(d.value, d.valueChildren);

	      const parent = d.caller;
	      if (d !== rootEvent && parent && parent.value > parent.valueChildren) {
	        d.value *= parent.value / parent.valueChildren;
	      }
	    });

	    const display = flamegraph()
	      .width(rootEvent.value * FONT_SIZE)
	      .cellHeight(22)
	      .minFrameSize(3)
	      .tooltip(false)
	      .getName((d) => d.data.label)
	      .setColorMapper((d) => {
	        if (d.highlight) {
	          return '#4175ea';
	        }

	        if (has$3.call(d.data.input, 'http_server_request')) {
	          return '#471553'; // 'rgba(63, 89, 193, 1)';
	        }

	        if (has$3.call(d.data.input, 'sql_query')) {
	          return 'rgba(17, 61, 128, 1)'; // sql data
	        }

	        return 'rgb(59, 72, 107)'; // static & non-static data
	      });

	    this.timelineSelection.html('');
	    this.timelineSelection.datum(rootEvent).call(display);

	    this.timelineSelection
	      .attr('height', display.height())
	      .attr('width', display.width());

	    this.timelineSelection
	      .selectAll('.frame')
	      .on('click', (d) => this.callTree.selectedEvent = d.data);

	    return this;
	  }

	  select(event) {
	    const events = this.timelineSelection.selectAll('g.frame');

	    events
	      .selectAll('rect')
	      .style('opacity', '0.4');

	    events
	      .selectAll('div.d3-flame-graph-label')
	      .style('color', '#404040');

	    const selectedIds = events
	      .filter((d) => d.data === event)
	      .datum()
	      .descendants()
	      .map((child) => child.data.id);

	    const selectedEvents = events.filter((d) => selectedIds.includes(d.data.id));

	    selectedEvents
	      .selectAll('rect')
	      .style('opacity', null);

	    selectedEvents
	      .selectAll('div.d3-flame-graph-label')
	      .style('color', null);
	  }

	  highlight(event, rootEvent, smoothScroll = true) {
	    this.timelineSelection.select('polyline').remove();

	    if (this.highlighted) {
	      this.highlighted.remove();
	    }

	    if (!event) {
	      return;
	    }

	    let callStack = [event, ...event.ancestors()].reverse();
	    const rootIndex = callStack.indexOf(rootEvent);
	    callStack = callStack.slice(rootIndex);

	    const line = this.timelineSelection
	      .append('polyline')
	      .classed('highlight', true);

	    // Aggregate vertices by separating lines on the left and right of a particular event.
	    // The first vertex is the bottom left of the root node and winds clockwise to the
	    // bottom right of the same root node.
	    const left = [];
	    const right = [];
	    callStack.forEach((e) => {
	      const element = this.timelineSelection
	        .selectAll('g.frame')
	        .filter((d) => d && d.data === e);
	      const { x, y } = positionFromTransform(element);
	      const width = Number(element.attr('width'));
	      const height = Number(element.attr('height'));

	      left.push(
	        x,
	        y + height,
	        x,
	        y,
	      );

	      right.unshift(
	        x + width,
	        y,
	        x + width,
	        y + height,
	      );
	    });

	    line.attr('points', `${left.join(' ')} ${right.join(' ')}`);

	    const currentElement = this.timelineSelection
	      .selectAll('g')
	      .filter((d) => d && d.data === event);

	    // put a colored highlight on the selected event
	    this.highlighted = currentElement
	      .insert('rect', ':last-child')
	      .attr('class', 'highlight')
	      .attr('width', function() {
	        return d3.select(this.parentElement).attr('width');
	      })
	      .attr('height', function() {
	        return d3.select(this.parentElement).attr('height');
	      });

	    if (currentElement.node()) {
	      const { node, label } = getPoints(this.timelineGroup, currentElement);
	      const timelineElement = this.timelineGroup.node();
	      const { scrollLeft, clientWidth } = timelineElement;
	      const deadZoneSize = 0.1;
	      const deadZoneLeft = scrollLeft + deadZoneSize;
	      const deadZoneRight = scrollLeft + clientWidth - deadZoneSize;

	      if (node.left < deadZoneLeft || label.right > deadZoneRight) {
	        const scrollOptions = { left: node.center.x };
	        if ( smoothScroll ) {
	          scrollOptions.behavior = 'smooth';
	        }
	        timelineElement.scrollTo(scrollOptions);
	      }
	    }
	  }

	  nearestNeighbor(event, direction) {
	    const node = this.timelineSelection
	      .selectAll('g')
	      .filter((d) => d && d.data && d.data.id === event.id)
	      .datum();

	    const neighbors = this.timelineSelection
	      .selectAll('g')
	      .filter((d) => d
	        && d.data
	        && d.depth === node.depth
	        && (direction < 0 ? node.x0 > d.x0 : node.x0 < d.x0))
	      .data();

	    let neighbor;
	    let bestDistance;
	    neighbors.forEach((d) => {
	      const distance = Math.abs(d.x0 - node.x0);
	      if (!neighbor || (distance && distance < bestDistance)) {
	        neighbor = d;
	        bestDistance = distance;
	      }
	    });

	    return neighbor ? neighbor.data : null;
	  }
	}

	exports.ComponentDiagram = ComponentDiagram;
	exports.FlowView = FlowView;
	exports.Models = Models;
	exports.Timeline = Timeline;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=diagrams-old.js.map
