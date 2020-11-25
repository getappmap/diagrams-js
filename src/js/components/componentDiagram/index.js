import dagreD3 from 'dagre-d3';
import d3 from 'd3';
import deepmerge from 'deepmerge';

import { getRepositoryUrl } from '../../util.js';
import { bindShapes } from './componentDiagramShapes.js';
import Models from '../../models.js';
import Container from '../../helpers/container/index.js';

export const DEFAULT_TARGET_COUNT = 10;
const IDEAL_CHILD_COUNT = 3;

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

  // expand nodes with 1 child
  Object.entries(diagramCalls).forEach(([key, value]) => {
    if (!graphDefinition.package_classes[key]) {
      return;
    }

    const subclasses = Array.from(graphDefinition.package_classes[key]);
    if (subclasses.length !== 1) {
      return;
    }

    const newId = subclasses[0];
    diagramCalls[newId] = value;
    delete diagramCalls[key];

    Object.entries(diagramCalls).forEach(([k, v]) => {
      if (v.has(key)) {
        v.delete(key);
        v.add(newId);
      }
      diagramCalls[k] = v;
    });
  });

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
    return obj;
  }, {}));

  return { edges, nodes };
}

/// helper function to get value for data-parent-type attr
function getParentType(id, classPackage) {
  let parent = classPackage[id];
  if (parent) {
    parent = parent.toLowerCase();
    switch (parent) {
      case 'http':
      case 'sql':
        return parent;
      default:
        return 'package';
    }
  } else return 'none';
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

function activeNodes(componentDiagram, key, list, fn) {
  const relevantArray = list[key];
  if (relevantArray) {
    relevantArray.forEach((classId) => {
      if (componentDiagram.graph.node(classId)) {
        fn(classId);
        return;
      }

      const classPackage = componentDiagram.currentDiagramModel.class_package[classId];
      if (componentDiagram.graph.node(classPackage)) {
        fn(classPackage);
      }
    });
  }
}

function setNode(graph, node, parent = null) {
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

  graph.setNode(node.id, node);

  if ( parent ) {
    graph.setParent(node.id, parent.id);
  }

  return graph;
}

function setEdge(graph, v, w) {
  return graph.setEdge(v, w, { curve: d3.curveBasis });
}

const render = new dagreD3.render(); // eslint-disable-line new-cap
bindShapes(render);

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

function renderGraph(componentDiagram) {
  // Clear any old state
  componentDiagram.element.html('');

  render(componentDiagram.element, componentDiagram.graph);

  componentDiagram.graphGroup = componentDiagram.element.select('g.output');
  componentDiagram.graphGroup
    .selectAll('g.node')
    .on('click', (id) => componentDiagram.highlight(id))
    .on('dblclick', (id) => componentDiagram.focus(id));

  componentDiagram.labelGroup = componentDiagram.graphGroup
    .append('g')
    .attr('class', 'nodeLabels');

  // HACK:
  // dagre-d3 adds node labels directly within node groups and doesn't
  // provide a way to change this behavior. Eventually we'll want to drop
  // dagre-d3 and write the d3 rendering ourselves. Until then, orphan the
  // label elements and reattach them in the nodeLabels group. This is an
  // optimization. Keeping the labels in a single group allows them to be
  // animated in a more performant manner.
  componentDiagram.graphGroup
    .node()
    .querySelectorAll('g.nodes g.label')
    .forEach((e) => {
      const id = e.parentElement.getAttribute('id');
      const transform = e.parentElement.getAttribute('transform');
      const data = componentDiagram.graph.node(id);

      // TODO:
      // find a better and more consistent way to pass attributes
      // to rendered element from corresponding node

      // set parent-type data attribute
      e.parentElement.setAttribute('data-parent-type', getParentType(id, componentDiagram.currentDiagramModel.class_package));
      e.parentElement.removeChild(e);
      componentDiagram.labelGroup.node().appendChild(e);

      e.classList.add(data.class);
      e.setAttribute('id', id);
      e.setAttribute('transform', transform);

      data.labelElem = e;
    });

  const bbox = componentDiagram.graphGroup.node().getBBox();
  componentDiagram.element
    .attr('width', `${bbox.width}px`)
    .attr('height', `${bbox.height}px`)
    .attr('viewBox', `${bbox.x}, ${bbox.y}, ${bbox.width}, ${bbox.height}`);

  // set arrow url with hash (without page url and query params)
  componentDiagram.element.selectAll('.edgePath > path').nodes().forEach((edge) => {
    const markerEnd = edge.getAttribute('marker-end');
    const matchedURL = markerEnd.match(/^url\((.*)\)$/);
    if (markerEnd && matchedURL.length > 1) {
      const url = new URL(matchedURL[1]);
      edge.setAttribute('marker-end', `url(${url.hash})`);
    }
  });

  componentDiagram.emit('postrender');
}

const COMPONENT_OPTIONS = {
  contextMenu(componentDiagram) {
    return [
      (item) => item
        .text('Set as root')
        .selector('.nodes .node')
        .transform((e) => e.getAttribute('id'))
        .on('execute', (id) => componentDiagram.makeRoot(id)),
      (item) => item
        .text('Expand')
        .selector('g.node')
        .transform((e) => e.getAttribute('id'))
        .condition((id) => componentDiagram.hasPackage(id))
        .on('execute', (id) => componentDiagram.expand(id)),
      (item) => item
        .text('Collapse')
        .selector('g.node')
        .transform((e) => e.getAttribute('id'))
        .condition((id) => !componentDiagram.hasPackage(id))
        .on('execute', (id) => componentDiagram.collapse(id)),
      (item) => item
        .text('View source')
        .selector('g.node.class')
        .transform((e) => componentDiagram.sourceLocation(e.getAttribute('id')))
        .on('execute', (repoUrl) => window.open(repoUrl)),
      (item) => item
        .text('Reset view')
        .on('execute', () => {
          componentDiagram.render(componentDiagram.initialModel);
        }),
    ];
  },
};

export default class ComponentDiagram extends Models.EventSource {
  constructor(container, options = {}) {
    super();

    const componentDiagramOptions = deepmerge(COMPONENT_OPTIONS, options);

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
  }

  render(data) {
    if (!data || typeof data !== 'object') {
      return;
    }

    if (!this.initialModel) {
      this.initialModel = { ...data };
    }

    this.currentDiagramModel = hashify(data);

    this.graph = new dagreD3.graphlib.Graph({ compound: true })
      .setGraph({ rankdir: 'LR' })
      .setDefaultEdgeLabel(function() { return {}; });

    const { nodes, edges } = mixedDiagram(this.currentDiagramModel, this.targetCount);
    nodes.forEach((node) => setNode(this.graph, node));
    edges.forEach(([start, end]) => {
      if (start !== end) {
        setEdge(this.graph, start, end);
      }
    });

    renderGraph(this);
  }

  clearHighlights() {
    if (d3.event) {
      d3.event.stopPropagation();
    }

    this.graphGroup
      .selectAll('.dim, .highlight, .highlight--inbound')
      .classed('dim highlight highlight--inbound', false);

    this.emit('highlight', null);
  }

  highlight(id) {
    this.clearHighlights();

    const highligthedNode = this.graph.node(id);
    if (!highligthedNode) {
      return false;
    }
    highligthedNode.elem.classList.add('highlight');

    this.graph.nodeEdges(id).forEach((e) => {
      const element = this.graph.edge(e).elem;
      element.classList.add('highlight');

      if (id === e.w) {
        element.classList.add('highlight--inbound');
      }
    });

    // Render highlighted connections above non-highlighted connections
    d3.selectAll('.edgePath.highlight').raise();

    this.emit('highlight', id);

    return true;
  }

  focus(id) {
    const [visitedNodes, visitedEdges] = findTraversableNodesAndEdges(this.graph, id);

    this.graph.nodes().forEach((nodeId) => {
      if (visitedNodes.has(nodeId)) {
        return;
      }

      const data = this.graph.node(nodeId);
      if (data.type !== 'cluster') {
        data.elem.classList.add('dim');
        data.labelElem.classList.add('dim');
      }
    });

    this.graph.edges().forEach((edgeId) => {
      if (visitedEdges.has(edgeId)) {
        return;
      }

      this.graph.edge(edgeId).elem.classList.add('dim');
    });

    // Push the dimmed edges down below the rest so they don't cross over at any
    // point
    d3.selectAll('.edgePath.dim').lower();

    this.emit('focus', id);
  }

  expand(nodeId) {
    const subclasses = new Set(this.currentDiagramModel.package_classes[nodeId]);
    if (subclasses.size === 0) {
      return;
    }

    this.graph.removeNode(nodeId);

    const clusterNode = { id: `${nodeId}-cluster`, type: 'cluster' };

    setNode(this.graph, clusterNode);

    subclasses.forEach((cls) => {
      setNode(this.graph, { id: cls, type: 'class' }, clusterNode);

      activeNodes(this, cls, this.currentDiagramModel.class_calls, (id) => {
        if (cls !== id) {
          setEdge(this.graph, cls, id);
        }
      });

      activeNodes(this, cls, this.currentDiagramModel.class_callers, (id) => {
        if (cls !== id) {
          setEdge(this.graph, id, cls);
        }
      });
    });

    renderGraph(this);

    this.emit('expand', nodeId);
  }

  collapse(nodeId) {
    const pkg = this.currentDiagramModel.class_package[nodeId];
    if (!pkg) {
      return;
    }

    const pkgClasses = this.currentDiagramModel.package_classes[pkg];
    if (!pkgClasses) {
      return;
    }

    this.graph.removeNode(`${pkg}-cluster`);

    setNode(this.graph, { id: pkg, type: 'package' });
    pkgClasses.forEach((id) => {
      this.graph.removeNode(id);

      activeNodes(this, id, this.currentDiagramModel.class_calls, (cls) => {
        if (cls !== pkg) {
          setEdge(this.graph, pkg, cls);
        }
      });

      activeNodes(this, id, this.currentDiagramModel.class_callers, (cls) => {
        if (cls !== pkg) {
          setEdge(this.graph, cls, pkg);
        }
      });
    });

    renderGraph(this);

    this.emit('collapse', pkg);
  }

  makeRoot(nodeId) {
    const visitedNodes = new Set();
    const visitedEdges = new Set();
    const queue = [nodeId];

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
      this.graph.removeNode(node);
    });

    renderGraph(this);
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
