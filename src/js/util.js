import * as d3 from 'd3';

import Geometry from './helpers/geometry.js';

// loadFont loads a font into the current document and returns a promise
function loadFont(fontName, fontUrl) {
  const fontFace = new FontFace(fontName, `url(${fontUrl})`);
  return fontFace.load().then(font => document.fonts.add(font));
}

function makeRequest(method, url, contentType = null, body = null) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    function doReject() {
      const error = new Error(`${method} ${url} responded with an error: ${xhr.statusText}`);
      error.xhr = xhr;
      reject(error);
    }

    xhr.open(method, url);
    if (contentType) {
      xhr.setRequestHeader('Content-Type', contentType);
    }

    xhr.onload = () => {
      if (xhr.status === 404) {
        resolve(null);
      } else if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        doReject();
      }
    };

    xhr.onerror = doReject;

    xhr.send(body);
  });
}

const svgNS = 'http://www.w3.org/2000/svg';

const svgElement = (name, attributes) => {
  const e = document.createElementNS(svgNS, name);
  if (attributes) {
    const attributeKeys = Object.keys(attributes);
    attributeKeys.forEach((key) => {
      const value = attributes[key];
      e.setAttributeNS(null, key, value);
    });
  }
  return e;
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

// getElementPosition returns an absolute x, y position for the element passed in
// this method may need an IE polyfill
const getElementPosition = (element) => {
  if (!element) {
    return { x: 0, y: 0 };
  }

  const { x, y } = element.getBoundingClientRect();
  return { x, y };
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

// Trim text to the specified width.
// This uses an inefficient procedure of stripping off one character at a time,
// so hopefully most text that you pass into this function will not exceed the max width.
const trimText = (element, width) => {
  const self = d3.select(element);
  let textLength = element.getComputedTextLength();
  let text = self.text();

  while (textLength > width && text.length > 0) {
    text = text.slice(0, -1);
    self.text(`${text}…`);
    textLength = self.node().getComputedTextLength();
  }
};

// Get absolute coordinates of an svg element inside a container.
// https://stackoverflow.com/a/37927466/953770
function getRelativeXY(x, y, container, element) {
  let containerNode = container;

  // container may be a d3 selection
  if (!containerNode.createSVGPoint) containerNode = container.node();

  const p = containerNode.createSVGPoint();
  const ctm = element.getCTM();
  p.x = x;
  p.y = y;
  return p.matrixTransform(ctm);
}

// getSize returns the computed style size of an element minus padding
function getSize(element) {
  const size = {
    width: element.clientWidth,
    height: element.clientHeight,
  };

  try {
    const computedStyle = window.getComputedStyle(element);
    size.width -= (parseInt(computedStyle.paddingLeft, 10)
      + parseInt(computedStyle.paddingRight, 10));
    size.height -= (parseInt(computedStyle.paddingTop, 10)
      + parseInt(computedStyle.paddingBottom, 10));
  } catch (e) {
    // getComputedStyle not supported
    // do nothing
  }

  return size;
}

// Selects the function SVG element in the class diagram which corresponds to a
// "call" event.
function selectFunctionForCall(selection, call) {
  return selection.select(`.function[data-path="${call.path}"][data-lineno="${call.lineno}"]`);
}

// Builds the fully qualified function name of a function (static or instance) within a
// fully qualified class name.
function fullyQualifiedFunctionName(event) {
  const { defined_class, method_id } = event;
  if ( defined_class && method_id ) {
    return [defined_class, method_id].join(event.static ? '.' : '#');
  }

  return getLabel(event);
}

var uid_count = 0;

function uid(family = "O") {
  return `${family}-${++uid_count}`;
}

function applicationPageParameters() {
  const { pathname, searchParams } = new URL(window.location);
  const appId = pathname.split('/')[2];
  const mapsetId = searchParams.get('mapset');
  return { appId, mapsetId };
}

let csrfToken = '';
export async function jsonRequest(path, method, data) {
  if (!csrfToken) {
    const meta = document.querySelector('meta[name=csrf-token]');
    if (meta) {
      csrfToken = meta.content;
    }
  }

  return fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(data)
  });
}

export async function put(path, data) {
  return jsonRequest(path, 'PUT', data);
}

export function getFunctionName(definedClass, method, isStatic) {
  const tokens = [];

  if (definedClass) {
    tokens.push(definedClass);
  }
  if (typeof isStatic === 'boolean') {
    tokens.push(isStatic ? '.' : '#');
  }

  if (method) {
    tokens.push(method);
  }

  return tokens.join('');
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
}

export function getRepositoryUrl(url, path, commit='master', lineNumber=null) {
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

export function selector(value) {
  let element = null;

  if (typeof value === 'string') {
    element = document.querySelector(value);
    console.assert(element, `could not resolve selector ${value}`);
  } else if (typeof value === 'object') {
    element = value;
  } else {
    console.error(`unexpected selector type: ${value}`);
  }

  return element;
}

// Move the minimum amount to put the element into view
export function lazyPanToElement(viewport, element, padding = 0) {
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
export function panToNode(viewport, node) {
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

export {
  capitalizeString,
  color,
  fullyQualifiedFunctionName,
  getElementPosition,
  getHttpLabel,
  getLabel,
  getRelativeXY,
  getSize,
  getSqlLabel,
  has,
  loadFont,
  makeRequest,
  selectFunctionForCall,
  svgElement,
  svgNS,
  tint,
  tokenizeIdentifier,
  trimText,
  uid,
  applicationPageParameters,
};
