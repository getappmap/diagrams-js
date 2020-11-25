# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.7]
Fixed
- Check node has subclasses before expanding

## [0.2.6]
Changed
- Component diagram: expand package which contains only one node by default

## [0.2.5]
Fixed
- Fix `marker-end` location: set local url by hash (`url(#arrowhead1)`) without page URL and query params

## [0.2.4]
Fixed
- Emit 'highlight' event of Component Diagram when node is highlighted

## [0.2.3]
Fixed
- Diagram freezes when panning with `momentum`

## [0.2.2]
Changed
- Component diagram: inbound and outbound arrows now have separate styling
- Component diagram: HTTP child nodes now have separate styling

## [0.2.1]
Fixed
- Potential null reference when highlighting a node

## [0.2.0]
Added
- Context menu component
- The component diagram now displays a frame around classes in an expanded package
- Light and dark themes for flow view and timeline

Fixed
- Component diagram sizing when viewing a small number of nodes
- Fixed visible overflow for large SQL queries in the flow view

Changed
- The default positioning of a component diagram now fills the viewport


## [0.1.6]
### Changed
- Extracted models to https://github.com/applandinc/appmap-models

## [0.1.5]
### Added
- Initial release

[0.1.6]: https://github.com/applandinc/d3-appmap/compare/tag/v0.1.5...v0.1.6
[0.1.5]: https://github.com/applandinc/d3-appmap/releases/tag/v0.1.5
