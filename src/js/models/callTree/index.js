import CallStack from './callStack';
import CallNode from './callNode';
import EventSource from '../../helpers/eventSource';

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

export default class CallTree extends EventSource {
  constructor (data, functionLabels = noLabels) {
    super();

    this.rootNode = new CallNode();
    const callStack = new CallStack(data, functionLabels);

    while (callStack.peek()) {
      branch(callStack, this.rootNode);
    }

    this.dataStore = {
      rootEvent: this.rootNode,
      selectedEvent: this.rootNode,
    };

    return this;
  }

  get rootEvent() {
    return this.dataStore.rootEvent;
  }

  set rootEvent(event) {
    this.dataStore.rootEvent = event;
    this.emit('rootEvent', event);
  }

  get selectedEvent() {
    return this.dataStore.selectedEvent;
  }

  set selectedEvent(event) {
    this.dataStore.selectedEvent = event;
    this.emit('selectedEvent', event);
  }
}
