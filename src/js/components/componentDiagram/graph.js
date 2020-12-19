import { create } from 'd3';
import dagre from 'dagre';

function createSVGElement(tagName, className = null) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tagName);
  if (className) {
    el.setAttribute('class', className);
  }
  return el;
}

function getRect(width, height) {
  const rect = createSVGElement('rect');
  rect.setAttribute('rx', 0);
  rect.setAttribute('ry', 0);
  rect.setAttribute('x', -(width / 2));
  rect.setAttribute('y', -(height / 2));
  rect.setAttribute('width', width);
  rect.setAttribute('height', height);
  return rect;
}

function getLabel(node) {
  const textGroup = createSVGElement('g');
  textGroup.setAttribute('class', 'label')
  const text = createSVGElement('text');
  const tspan = createSVGElement('tspan');
  tspan.setAttribute('space', 'preserve');
  tspan.setAttribute('dy', '1em');
  tspan.setAttribute('x', '1');
  tspan.textContent = node.label;
  console.log(tspan);
  text.appendChild(tspan);
  textGroup.appendChild(text);
  return textGroup;
}

export default class Graph {
  constructor(element, options = {}) {
    this.element = element;

    this.outputGroup = createSVGElement('g', 'output');
    this.clustersGroup = createSVGElement('g', 'clusters');
    this.nodesGroup = createSVGElement('g', 'nodes');
    this.edgesGroup = createSVGElement('g', 'edgePaths');

    this.outputGroup.appendChild(this.clustersGroup);
    this.outputGroup.appendChild(this.nodesGroup);
    this.outputGroup.appendChild(this.edgesGroup);

    this.element.appendChild(this.outputGroup);

    this.graph = new dagre.graphlib.Graph({ compound: true }).setGraph({ rankdir: 'LR' }).setDefaultEdgeLabel(function() { return {}; });
  }

  setNode(node) {
    console.log(node)
    node.width = 100;
    node.height = 20;
    this.graph.setNode(node.id, node);
  }

  setEdge(start, end) {
    this.graph.setEdge(start, end);
  }

  render() {
    dagre.layout(this.graph);

    this.graph.nodes().forEach((id) => {
      const node = this.graph.node(id);
      const nodeGroup = createSVGElement('g', `node ${node.class}`);
      nodeGroup.setAttribute('transform', `translate(${node.x},${node.y})`);
      nodeGroup.appendChild(getRect(node.width, node.height));
      nodeGroup.appendChild(getLabel(node));
      this.nodesGroup.appendChild(nodeGroup);
    });

    this.element.setAttribute('width', this.graph.graph().width);
    this.element.setAttribute('height', this.graph.graph().height);
  }
}