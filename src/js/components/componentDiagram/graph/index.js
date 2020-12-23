import dagre from 'dagre';

import { createSVGElement, findTraversableNodesAndEdges, prepareNode } from './util';
import NodeGroup from './groups/nodeGroup';
import LabelGroup from './groups/labelGroup';
import EdgeGroup from './groups/edgeGroup';

const NODE_PADDING_HORIZONTAL = 15;
const NODE_PADDING_VERTICAL = 10;

export default class Graph {
  constructor(element, options = {}) {
    this.element = element;

    this.outputGroup = createSVGElement('g', 'output');
    this.edgesGroup = createSVGElement('g', 'edgePaths');
    this.clustersGroup = createSVGElement('g', 'clusters');
    this.nodesGroup = createSVGElement('g', 'nodes');

    this.outputGroup.appendChild(this.edgesGroup);
    this.outputGroup.appendChild(this.clustersGroup);
    this.outputGroup.appendChild(this.nodesGroup);

    this.element.innerHTML = '';
    this.element.appendChild(this.outputGroup);

    this.graph = new dagre.graphlib.Graph({ compound: true }).setGraph({ rankdir: 'LR' }).setDefaultEdgeLabel(function() { return {}; });
  }

  setNode(data, parentId = null) {
    const node = prepareNode(data);
    // create dummy <g class="node"> with label to detect label width
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

    this.graph.setNode(node.id, node);

    if (parentId) {
      this.graph.setParent(node.id, parentId);
    }
  }

  setEdge(start, end) {
    console.log(start, end);
    if (start !== end) {
      this.graph.setEdge(start, end);
    }
  }

  render() {
    dagre.layout(this.graph);

    this.element.setAttribute('width', this.graph.graph().width);
    this.element.setAttribute('height', this.graph.graph().height);

    this.graph.nodes().forEach((id) => {
      const node = this.graph.node(id);
      const nodeGroup = new NodeGroup(node);

      node.element = nodeGroup.element;

      this.nodesGroup.appendChild(nodeGroup.element);
    });

    this.graph.edges().forEach(({ v, w }, index) => {
      const edge = this.graph.edge(v, w);
      const edgeGroup = new EdgeGroup(edge.points, index);
      edge.element = edgeGroup.element;
      this.edgesGroup.appendChild(edgeGroup.element);
    });

    console.log(this.graph);
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
    console.log(`Graph: expand(${id})`);

    dagre.layout(this.graph);

    this.element.setAttribute('width', this.graph.graph().width);
    this.element.setAttribute('height', this.graph.graph().height);

    this.graph.nodes().forEach((id) => {
      const node = this.graph.node(id);
      console.log(id, node);
      const nodeGroup = new NodeGroup(node);

      node.element = nodeGroup.element;

      this.nodesGroup.appendChild(nodeGroup.element);
    });

    this.graph.edges().forEach(({ v, w }, index) => {
      const edge = this.graph.edge(v, w);
      const edgeGroup = new EdgeGroup(edge.points, index);
      edge.element = edgeGroup.element;
      this.edgesGroup.appendChild(edgeGroup.element);
    });
  }

  scrollToNodes(nodes) {
    return;
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

    const { containerController } = componentDiagram.container;
    const containerBox = containerController.element.getBoundingClientRect();

    if (Geometry.contains(containerBox, nodesBox)) {
      return false;
    }

    const xRatio = containerBox.width / nodesBox.width;
    const yRatio = containerBox.height / nodesBox.height;
    const scale = (xRatio > 1 && yRatio > 1) ? 1 : Math.min(xRatio, yRatio) - 0.01;

    containerController.scaleTo(scale);

    setTimeout(() => {
      const x = nodesBox.width / 2 + nodesBox.offsetLeft;
      const y = nodesBox.height / 2 + nodesBox.offsetTop;
      containerController.translateTo(x, y);
    }, 200);

    return true;
  }
}