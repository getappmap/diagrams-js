# Usage

Build and serve the code:

```
$  npm install
$  npm run serve
...
http://localhost:10001 -> $HOME/source/appmaporg/d3-appmap/dist
http://localhost:10001 -> $HOME/source/appmaporg/d3-appmap/examples
```

Open the examples:

```
$ open http://localhost:10001/
```

Light theme is active by default, to use dark theme pass an object with option `theme` set to `dark` as second parameter to `ComponentDiagram` constructor:

```
var diagram = new appmap.ComponentDiagram('#component-diagram', {theme: 'dark'});
```
