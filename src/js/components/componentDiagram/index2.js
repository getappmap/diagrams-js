import d3 from 'd3';
import deepmerge from 'deepmerge';

import { hashify, getRepositoryUrl } from '../../util.js';
import Models from '../../models.js';
import Container from '../../helpers/container/index.js';
import Geometry from '../../helpers/geometry.js';
import Graph from './graph';

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

function getClassConnections(model, cls) {
  const result = [];

  const classCallers = model.class_callers[cls];
  if (classCallers) {
    classCallers.forEach((id) => {
      result.push({
        id,
        type: 'in',
      });
    });
  }

  const classCalls = model.class_calls[cls];
  if (classCalls) {
    classCalls.forEach((id) => {
      result.push({
        id,
        type: 'out',
      });
    });
  }

  return result;
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

function bindEvents(componentDiagram) {
  const svg = componentDiagram.element.node();

  svg.querySelectorAll('g.nodes g.node').forEach((node) => {
    node.addEventListener('click', (event) => {
      event.stopPropagation();
      componentDiagram.highlight(node.dataset.id);
    });
    node.addEventListener('dblclick', (event) => {
      event.stopPropagation();
      componentDiagram.focus(node.dataset.id);
    });
  });
}

function renderGraph(componentDiagram) {

  // Clear any old state
  componentDiagram.element.html('');
console.log(componentDiagram.graph.graph().width, componentDiagram.graph.graph().height)
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

      const packageClasses = componentDiagram.currentDiagramModel.package_classes[id];
      if (packageClasses && packageClasses.size > 1) {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('class', 'label__children-count');
        tspan.textContent = ` (${packageClasses.size})`;
        e.querySelector('text').appendChild(tspan);

        const tspanWidth = tspan.getBBox().width;

        let [transformOrig, translateX, translateY] = transform.match(/translate\(([0-9\.]+),([0-9\.]+)\)/);
        translateX = parseFloat(translateX) - tspanWidth / 2;

        e.setAttribute('transform', `translate(${translateX},${translateY})`);
      }

      data.labelElem = e;
    });

  componentDiagram.element.selectAll('.cluster').nodes().forEach((cluster) => {
    const parentNode = cluster.getAttribute('id').replace(/-cluster$/g, '');
    if (componentDiagram.hasPackage(parentNode)) {
      let clusterType = 'cluster--package';
      if (parentNode === 'HTTP') {
        clusterType = 'cluster--http';
      } else if (parentNode === 'SQL') {
        clusterType = 'cluster--database';
      }
      cluster.classList.add(clusterType);

      const packageClasses = componentDiagram.currentDiagramModel.package_classes[parentNode];
      if (packageClasses.size > 1) {
        cluster.classList.add('cluster--bordered');
      }
    }
  });

  const bbox = componentDiagram.graphGroup.node().getBBox();
  componentDiagram.element
    .attr('width', `${bbox.width}px`)
    .attr('height', `${bbox.height}px`)
    .attr('viewBox', `${bbox.x}, ${bbox.y}, ${bbox.width}, ${bbox.height}`);

  componentDiagram.element.selectAll('.edgePath > path').nodes().forEach((edge) => {
    // highlight edge on mouse click
    edge.addEventListener('click', (event) => {
      event.stopPropagation();
      componentDiagram.graphGroup
        .selectAll('.edgePath.highlight, .edgePath.highlight--inbound')
        .classed('highlight highlight--inbound', false);
      edge.parentNode.classList.add('highlight');
      componentDiagram.graphGroup.selectAll('.edgePath.highlight').raise();

      const nodesClass = edge.parentNode.getAttribute('class').split(' ').filter((cls) => /^nodes-/.test(cls))[0];
      const nodes = nodesClass.split('---');
      nodes.shift();
      componentDiagram.emit('edge', nodes);
    });

    // set arrow url with hash (without page url and query params)
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

    this.container.containerController.element.addEventListener('dblclick', () => {
      this.clearFocus();
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

    this.graph = new Graph(this.element.node());

    const { nodes, edges } = mixedDiagram(this.currentDiagramModel, this.targetCount);
    nodes.forEach((node) => this.graph.setNode(node));
    edges.forEach(([start, end]) => this.graph.setEdge(start, end));

    this.graph.render();

    bindEvents(this);

    console.log(this.graph);

    return;

    // expand nodes with 1 child
    /*Object.entries(this.currentDiagramModel.package_classes).forEach(([nodeId, children]) => {
      const nodeChildren = new Set(children);
      if (nodeChildren.size === 1) {
        this.expand(nodeId, false);
      }
    });*/
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

    if (this.graph.scrollToNodes(nodesIds)) {
      this.emit('scrollTo', nodesIds);
    }
  }

  expand(nodeId, scrollToSubclasses = true) {
    const subclasses = Array.from(new Set(this.currentDiagramModel.package_classes[nodeId]));
    if (subclasses.length === 0 || subclasses[0] === nodeId) {
      return;
    }

    const clusterId = `${nodeId}-cluster`;
    const clusterNode = { id: clusterId, type: 'cluster' };

    this.graph.setNode(clusterNode);
console.log(this.currentDiagramModel)
    subclasses.forEach((cls) => {
      //console.log(cls)
      this.graph.setNode({ id: cls, type: 'class' }, clusterId);

      getClassConnections(this.currentDiagramModel, cls).forEach((conn) => {
        if (conn.type === 'in') {
          this.graph.setEdge(conn.id, cls);
        } else if (conn.type === 'out') {
          this.graph.setEdge(cls, conn.id);
        }
      });

      /*activeNodes(this, cls, this.currentDiagramModel.class_calls, (id) => {
        if (cls !== id) {
          setEdge(this.graph, cls, id);
        }
      });

      activeNodes(this, cls, this.currentDiagramModel.class_callers, (id) => {
        if (cls !== id) {
          setEdge(this.graph, id, cls);
        }
      });*/
    });

    this.graph.expand(nodeId, clusterId);

    if (scrollToSubclasses) {
      this.scrollTo(subclasses);
    }

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

    this.scrollTo(pkg);

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
