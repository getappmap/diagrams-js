import ComponentDiagram from '../src/js/components/componentDiagram/index.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import jsdom from 'jsdom';
import test from 'tape';
import './DOMMatrix.js';

function readJSON(name) {
  const dir = dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(`${dir}/data/${name}`));
}

const dom = new jsdom.JSDOM(`<div id="diagram" />`);
global.window = dom.window;
global.document = window.document;
global.navigator = window.navigator;
global.SVGElement = window.SVGElement;
global.location = window.location;

SVGElement.prototype.getBBox = () => ({x: 0, y: 0, width: 0, height: 0});
SVGElement.prototype.getScreenCTM = () => (new DOMMatrix());

const model = readJSON('fullModel.json');
let elem,
  componentDiagram;

const setupDiagram = function(cb) {
  return function(t) {
    elem = document.querySelector('#diagram');
    elem.innerHTML = '';
    componentDiagram = new ComponentDiagram(elem);
    componentDiagram.render(model);

    return cb(t);
  }
}

test('component diagram', (t) => {
  t.test('should be rendered', setupDiagram((t) => {
    t.equal(elem.querySelectorAll('.appmap__component-diagram').length, 1);
    t.end();
  }));

  t.test('should have 17 nodes', setupDiagram((t) => {
    t.equal(elem.querySelectorAll('.nodes g.node').length, 17);
    t.end();
  }));

  t.test('node "HTTP" should be expanded', setupDiagram((t) => {
    t.equal(elem.querySelector('.nodes .node[id="HTTP"]'), null);
    t.equal(elem.querySelectorAll('.nodes .node[id="POST /applications"]').length, 1);
    t.end();
  }));

  t.test('node "SQL" can be highlighted', setupDiagram((t) => {
    const node = elem.querySelector('.nodes .node[id="SQL"]');

    t.notEqual(node, null);

    node.dispatchEvent(new window.Event('click'));

    t.equal(node.classList.contains('highlight'), true);
    t.end();
  }));

  t.test('node "SQL" should not be highlighted by default', setupDiagram((t) => {
    const node = elem.querySelector('.nodes .node[id="SQL"]');

    t.notEqual(node, null);
    t.notEqual(node.classList.contains('highlight'), true);
    t.end();
  }));

  t.test('multiple nodes should be highlighted', setupDiagram((t) => {
    componentDiagram.highlight(['POST /applications', 'SQL']);
    const highlightedNodes = elem.querySelectorAll('.nodes .node.highlight');

    t.equal(highlightedNodes.length, 2);
    t.end();
  }));

  t.test('node "SQL" can be focused', setupDiagram((t) => {
    const node = elem.querySelector('.nodes .node[id="SQL"]');
    const nodeOpenssl = elem.querySelector('.nodes .node[id="OpenSSL::Cipher"]');

    t.notEqual(node, null);

    node.dispatchEvent(new window.Event('dblclick'));

    t.notEqual(node.classList.contains('dim'), true);
    t.equal(nodeOpenssl.classList.contains('dim'), true);

    t.test('focus should not be cleared after click on diagram', (t) => {
      elem.dispatchEvent(new window.Event('click'));

      t.equal(nodeOpenssl.classList.contains('dim'), true);
      t.end();
    });

    t.end();
  }));
});
