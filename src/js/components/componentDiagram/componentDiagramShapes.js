import * as dagreD3 from 'dagre-d3';

// These shapes are from
// https://github.com/mermaid-js/mermaid/blob/develop/src/diagrams/flowchart/flowChartShapes.js

function http(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: (-2 * h) / 6, y: 0 },
    { x: w - h / 6, y: 0 },
    { x: w + (2 * h) / 6, y: -h },
    { x: h / 6, y: -h }
  ];
  const shapeSvg = parent.insert('polygon', ':first-child')
    .attr('points', points.map(function(d) { return `${d.x},${d.y}`; }).join())
    .attr('transform', `translate(${-w * 0.5}, ${h * 0.5})`)
    .attr('class', 'shape');
  node.intersect = function(point) {
    return dagreD3.intersect.polygon(node, points, point);
  };
  return shapeSvg;
}

function database(parent, bbox, node) {
  const w = bbox.width;
  const rx = w / 2;
  const ry = rx / (2.5 + w / 50);
  const h = bbox.height + ry;

  const shape =
    'M 0,' +
    ry +
    ' a ' +
    rx +
    ',' +
    ry +
    ' 0,0,0 ' +
    w +
    ' 0 a ' +
    rx +
    ',' +
    ry +
    ' 0,0,0 ' +
    -w +
    ' 0 l 0,' +
    h +
    ' a ' +
    rx +
    ',' +
    ry +
    ' 0,0,0 ' +
    w +
    ' 0 l 0,' +
    -h;

  const shapeSvg = parent
    .attr('label-offset-y', ry)
    .insert('path', ':first-child')
    .attr('d', shape)
    .attr('transform', `translate(${-w / 2}, ${-(h / 2 + ry)})`)
    .attr('class', 'shape');

  node.intersect = function(point) {
    const pos = dagreD3.intersect.rect(node, point);
    const x = pos.x - node.x;

    if (
      rx != 0 &&
      (Math.abs(x) < node.width / 2 ||
        (Math.abs(x) == node.width / 2 && Math.abs(pos.y - node.y) > node.height / 2 - ry))
    ) {
      // ellipsis equation: x*x / a*a + y*y / b*b = 1
      // solve for y to get adjustion value for pos.y
      let y = ry * ry * (1 - (x * x) / (rx * rx));
      if (y != 0) y = Math.sqrt(y);
      y = ry - y;
      if (point.y - node.y > 0) y = -y;

      pos.y += y;
    }

    return pos;
  };

  return shapeSvg;
}

function hexagon(parent, bbox, node) {
  const f = 4;
  const h = bbox.height;
  const m = h / f;
  const w = bbox.width + 2 * m;
  const points = [
    { x: m, y: 0 },
    { x: w - m, y: 0 },
    { x: w, y: -h / 2 },
    { x: w - m, y: -h },
    { x: m, y: -h },
    { x: 0, y: -h / 2 }
  ];
  const shapeSvg = parent.insert('polygon', ':first-child')
    .attr('points', points.map(function(d) { return d.x + "," + d.y; }).join())
    .attr('transform', `translate(${-w * 0.5}, ${h * 0.5})`)
    .attr('class', 'shape');
  node.intersect = function(point) {
    return dagreD3.intersect.polygon(node, points, point);
  };
  return shapeSvg;
}

const shapes = { http, database, hexagon };

function bindShapes(render) {
  Object.entries(shapes).forEach(([k, fn]) => render.shapes()[k] = fn);
}

export { shapes, bindShapes };
