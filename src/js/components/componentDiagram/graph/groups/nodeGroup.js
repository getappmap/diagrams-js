import LabelGroup from './labelGroup';
import Cylinder from '../shapes/cylinder';
import Parallelogram from '../shapes/parallelogram';
import Rect from '../shapes/rect';
import { createSVGElement } from '../util';

export default class NodeGroup {
  constructor(node) {
    this.node = node;
    this.element = createSVGElement('g', `node ${node.class}`);
    this.element.dataset.id = node.id;
    this.element.setAttribute('transform', `translate(${node.x},${node.y})`);

    let shape;

    switch (node.shape) {
      case 'http':
        shape = Parallelogram(node.width, node.height);
        break;
      case 'database':
        shape = Cylinder(node.width, node.height);
        break;
      default:
        shape = Rect(node.width, node.height);
        break;
    }

    this.element.appendChild(shape);

    const labelGroup = new LabelGroup(node.label);
    labelGroup.element.setAttribute('transform', `translate(-${node.labelWidth / 2},-${node.labelHeight / 2})`);
    this.element.appendChild(labelGroup.element);
  }
}