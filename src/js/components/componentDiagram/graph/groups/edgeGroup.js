import { createSVGElement } from '../util';

import Path from '../shapes/path';
import Marker from '../shapes/marker';

export default class EdgeGroup {
  constructor(points, arrowHeadSuffix = '') {
    this.points = [];

    points.forEach((p) => {
      this.points.push([p.x, p.y]);
    });

    this.element = createSVGElement('g', 'edgePath');

    const arrowId = `arrowhead${arrowHeadSuffix}`;
    const path = Path(this.points);
    const defs = createSVGElement('defs');
    const marker = Marker();

    marker.setAttribute('id', arrowId);
    path.setAttribute('marker-end', `url(#${arrowId})`);

    defs.appendChild(marker);

    this.element.appendChild(path);
    this.element.appendChild(defs);
  }
}