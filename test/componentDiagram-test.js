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
const elem = document.querySelector('#diagram');
const componentDiagram = new ComponentDiagram(elem);

test('component diagram', (t) => {
  t.test('should be rendered', function (t) {
    componentDiagram.render(model);

    t.equal(elem.querySelectorAll('.appmap__component-diagram').length, 1);
    t.end();
  });

  t.test('should have 17 nodes', function (t) {
    t.equal(elem.querySelectorAll('.nodes g.node').length, 17);
    t.end();
  });

  t.test('node "HTTP" should be expanded', function (t) {
    t.equal(elem.querySelector('.nodes .node[id="HTTP"]'), null);
    t.equal(elem.querySelectorAll('.nodes .node[id="POST /applications"]').length, 1);
    t.end();
  });

  t.test('node "SQL" should be highlighted', function (t) {
    const node = elem.querySelector('.nodes .node[id="SQL"]');

    t.notEqual(node, null);

    node.dispatchEvent(new window.Event('click'));

    t.equal(node.classList.contains('highlight'), true);
    t.end();
  });
});
