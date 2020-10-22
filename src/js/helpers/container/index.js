import * as d3 from 'd3';
import deepmerge from 'deepmerge';

import EventSource from '../eventSource';
import ContainerZoom from './zoom';

const AVAILABLE_THEMES = ['light', 'dark'];
const DEFAULT_THEME = 'light';

const defaultOptions = {
  pan: {
    momentum: true, // if true, enables momentum on panning
    boundary: {
      contain: null, // selector for contained element
      overlap: 300, // px
    },
    tweenTime: 250, // ms
  },
  theme: DEFAULT_THEME,
  zoom: {
    controls: false, // display zoom controls (+ / - buttons)
    step: 0.1, // zoom step when clicking a button in the interface
    minRatio: 0.1, // minimum zoom scale
    maxRatio: 1.0, // maximum zoom scale
    requireActive: false, // whether or not the user must interact with the element before zooming
  },
};

const clamp = (x, min, max) => Math.min(Math.max(x, min), max);

export default class Container extends EventSource {
  constructor(parentElement, options = {}) {
    super();

    this.options = deepmerge(defaultOptions, options);

    let { theme } = this.options;

    if (AVAILABLE_THEMES.indexOf(theme) === -1) {
      theme = DEFAULT_THEME;
    }

    this.element = document.createElement('div');
    this.element.className = `appmap appmap--theme-${theme}`;

    this.contentElement = document.createElement('div');
    this.contentElement.className = 'appmap__content';
    this.element.appendChild(this.contentElement);
    parentElement.appendChild(this.element);

    if (this.options.zoom.controls) {
      this.zoomController = new ContainerZoom(this, this.options.zoom)
        .on('zoom', (k) => {
          const { minRatio, maxRatio } = this.options.zoom;
          this.scaleTo((maxRatio - minRatio) * k + minRatio);
          this.active = true;
        });
    }

    this.zoom = d3
      .zoom()
      .scaleExtent([this.options.zoom.minRatio, this.options.zoom.maxRatio])
      .interpolate(d3.interpolate)
      .filter(() => {
        if (d3.event.type === 'wheel') {
          return this.active || !this.options.zoom.requireActive;
        }

        // Mutating state in a filter is not so great here. So far I've been
        // unsuccessful at binding a 'start' handler to do this. I'm all for
        // moving this mutation somewhere more appropriate if someone would
        // like to take the time to do so. -DB
        this.active = true;

        return true;
      })
      .on('zoom', () => {
        const { transform } = d3.event;

        const { offsetHeight, offsetWidth } = parentElement;

        transform.x = clamp(
          transform.x,
          (this.options.pan.boundary.overlap - this.contentElement.offsetWidth) * transform.k,
          offsetWidth - this.options.pan.boundary.overlap * transform.k,
        );

        transform.y = clamp(
          transform.y,
          (this.options.pan.boundary.overlap - this.contentElement.offsetHeight) * transform.k,
          offsetHeight - this.options.pan.boundary.overlap * transform.k,
        );

        this.contentElement.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
        this.contentElement.style.transformOrigin = '0 0';

        this.emit('move', transform);
      });

    d3.select(this.element)
      .call(this.zoom)
      .on('dblclick.zoom', null);

    return this.contentElement;
  }

  scaleTo(k) {
    d3.select(this.element)
      .transition()
      .duration(100)
      .call(this.zoom.scaleTo, k);
  }

  get transform() {
    return d3.zoomTransform(this.element);
  }

  set transform(transform) {
    d3.select(this.element)
      .call(this.zoom.transform, transform);
  }
}
