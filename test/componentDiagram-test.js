import cdiagram from '../src/js/components/componentDiagram/index.js';

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

test('should render a diagram', function (t) {
  const model = readJSON('fullModel.json');
  const elem = document.querySelector('#diagram');
  const diagram = new cdiagram(elem);
  diagram.render(model);
  t.end();
});
