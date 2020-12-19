import { bindShapes } from './componentDiagramShapes.js';

function createSVGElement(tagName) {
  return document.createElementNS('http://www.w3.org/2000/svg', tagName);
}

export default function render(elem, graph) {
  const gOutput = createSVGElement('g');
  gOutput.setAttribute('class', 'output');
  const gNodes = createSVGElement('g');
  gNodes.setAttribute('class', 'nodes');

  elem.attr('width', graph.graph().width);
  elem.attr('height', graph.graph().height);

  graph.nodes().forEach((id) => {
    const node = graph.node(id);
    console.log(node);return;
    const nodeEl = createSVGElement('g');
    nodeEl.setAttribute('id', id);
    nodeEl.setAttribute('class', 'node');
    nodeEl.setAttribute('transform', `translate(${node.x},${node.y})`);

    const rect = createSVGElement('rect');
    rect.setAttribute('width', 50);
    rect.setAttribute('height', 50);
    nodeEl.appendChild(rect);

    gNodes.appendChild(nodeEl);
  });

  elem.node().appendChild(gNodes);

  console.log(elem, graph);
}