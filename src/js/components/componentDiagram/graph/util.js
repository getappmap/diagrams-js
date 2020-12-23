export function createSVGElement(tagName, className = null) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tagName);

  if (className) {
    el.setAttribute('class', className);
  }

  return el;
}

export function findTraversableNodesAndEdges(graph, id) {
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

export function prepareNode(data) {
  const node = { ...data };
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

  return node;
}