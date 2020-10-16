import CallStack from './callStack';
import CallNode from './callNode';

function branch(callStack, parent) {
  const evt = callStack.pop();
  if (!evt) {
    return null;
  }

  if (evt.event === 'call') {
    const node = new CallNode(evt, null, parent, callStack.functionLabels(evt));
    parent.addChild(node);

    let child = null;
    for (;;) {
      child = branch(callStack, node);
      if (!child) {
        break;
      }
    }
    return node;
  }

  if (evt.event === 'return') {
    parent.output = evt;
  }

  return null;
}

function noLabels() {
  return [];
}

export default function buildCallTree(data, functionLabels = noLabels) {
  const rootNode = new CallNode();
  const callStack = new CallStack(data, functionLabels);
  while (callStack.peek()) {
    branch(callStack, rootNode);
  }
  return rootNode;
}
