# Installation

Install package `@appland/diagrams` from NPM registry.

```
npm install @appland/diagrams
```

# Usage

Table of contents:
- [Component diagram](#component-diagram)
- [Flow view](#flow-view)
- [Timeline](#timeline)

## Component diagram

Pass a CSS selector or HTMLElement object as first parameter and options as second parameter to `Appmap.ComponentDiagram`:

```
const componentDiagramModel = { ... };

const diagram = new Appmap.ComponentDiagram('#component-diagram', {
  theme: 'light',
  zoom: {
    controls: true
  }
});

diagram.render(componentDiagramModel);
```

If you want to create your custom context menu for diagram nodes, pass `contextMenu` option with builder function:

<pre>
const diagram = new Appmap.ComponentDiagram('#component-diagram', {
  <b>contextMenu: function(componentDiagram){
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
        .text('Reset view')
        .on('execute', () => {
          componentDiagram.render(componentDiagram.initialModel);
        }),
    ];
  },</b>
  theme: 'light',
  zoom: {
    controls: true
  }
});
</pre>

Builder function must accepts one argument with `ComponentDiagram` instance and must return an array of menu item's builder functions.

### Available methods
- `.render(model)` - renders diagram model
- `.highlight(nodeId | [node1, node2, ...])` - highlights node(s) with provided `nodeId` and inbound/outbound arrows
- `.clearHighlights()` - clears node highlightning
- `.focus(nodeId)` - shows arrows relative to node with `nodeId` and hides others
- `.clearFocus()` - shows all graph arrows, disables node focusing
- `.scrollTo(nodeId | [node1, node2, ...])` - scroll the graph to node or set of nodes
- `.expand(nodeId)` - expands node with `nodeId` and shows it's children with relations
- `.collapse(nodeId)` - collapses node with `nodeId` into package
- `.makeRoot(nodeId)` - sets node with `nodeId` as diagram root
- `.sourceLocation(nodeId)` - returns URL to file in repository which contains node with `nodeId`
- `.hasPackage(packageId)` - checks package isset in the diagram model

### Available events
- `postrender` - this event is fired when diagram has been rendered on the page
```
diagram.on('postrender', (nodeId) => {
  console.log(`diagram has been rendered`);
});
```
- `highlight` - returns array with highlighted nodes IDs, when no one node is highlighted - returns `null`
> **Note:** If only one node was highlighted - you'll get an array with only one element
```
diagram.on('highlight', (nodeIds) => {
  if (nodeIds) {
    console.log(`nodes ${nodeIds.join(',')} were highlighted`);
  } else {
    console.log(`nothing is highlighted`);
  }
});
```
- `focus` - returns focused node ID, when focus was cleared - returns `null`
```
diagram.on('focus', (nodeId) => {
  if (nodeId) {
    console.log(`node ${nodeId} was focused`);
  } else {
    console.log(`focus was cleared`);
  }
});
```
- `scrollTo` - returns array with nodes IDs whose were centered by `.scrollTo` method
> **Note:** If graph was scrolled to only one node - you'll get an array with only one element
```
diagram.on('scrollTo', (nodeIds) => {
  console.log(`graph was scrolled to nodes ${nodeIds.join(',')}`);
});
```
- `expand` - returns expanded node ID
```
diagram.on('expand', (nodeId) => {
  console.log(`node ${nodeId} was expanded`);
});
```
- `collapse` - returns collapsed node ID
```
diagram.on('collapse', (nodeId) => {
  console.log(`node ${nodeId} was collapsed`);
});
```
- `edge` - returns node IDs when edge between those nodes was clicked
```
diagram.on('edge', (nodes) => {
  console.log(`edge between ${nodes[0]} and ${nodes[1]} was clicked`);
});
```

## Flow view

Use this function to aggregate events from `scenarioData` object to `callTree` variable:
```
const scenarioData = { ... };

function aggregateEvents(events, classMap) {
  const eventInfo = new Appmap.Models.EventInfo(classMap);
  const callTree = new Appmap.Models.CallTree(events);

  callTree.rootNode.forEach((e) => {
    e.displayName = eventInfo.getName(e.input);
    e.labels = eventInfo.getLabels(e.input);
  });

  return callTree;
}

const callTree = aggregateEvents(scenarioData.data.events, scenarioData.data.classMap);
```

Initialize `FlowView` component and set the call tree:
```
const flowView = new Appmap.FlowView('#flow-view', {
  theme: 'light',
  zoom: {
    controls: true
  }
});

flowView.setCallTree(callTree);
flowView.render();
```

## Timeline

> **Hint:** Use the same `callTree` variable from [Flow view docs](#flow-view) to create a connection between Flow view and Timeline diagrams.
```
const timeline = new Appmap.Timeline('#timeline', {
  theme: 'light',
});

timeline.setCallTree(callTree);
timeline.render();
```

# Options

You can customize your diagram by passing options object as second parameter to any diagram constructor.

Available options are:

- `pan` (object): settings for panning
  - `momentum` (bool): enables momentum on panning. Default is `true`.
  - `boundary` (object): boundary settings
    - `contain` (string | null): selector for contained element. Default is `null`.
    - `overlap` (int): overlap size. Default is `300`.
  - `tweenTime` (int): tween animation time. Default is `250`.
- `theme` ("light" | "dark"): diagram color scheme. Default is `"light"`.
- `zoom` (object | false): zoom settings, if `false` - zoom is completely disabled. Default is `object`.
  - `controls` (bool): display zoom controls (+ / - buttons). Default is `false`.
  - `step` (float): zoom step when clicking a button in the interface. Default is `0.1`.
  - `minRatio` (float): minimum zoom scale. Default is `0.1`.
  - `maxRatio` (float): maximum zoom scale. Default is `1.0`.
  - `requireActive` (bool): whether or not the user must interact with the element before zooming. Default is `false`.

# Examples

Clone this repo, install dependencies and serve the code:

```
$  git clone https://github.com/applandinc/diagrams-js.git && cd diagrams-js
$  npm install
$  npm run serve
...

http://localhost:10001 -> $HOME/diagrams-js/dist
http://localhost:10001 -> $HOME/diagrams-js/examples
```

Open the examples page:

```
$ open http://localhost:10001/
```
