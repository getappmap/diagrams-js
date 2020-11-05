import { EventSource } from '@mingyu8981/appmap-models';

function transformElement(item, element) {
  if (typeof item._transform === 'function') {
    return item._transform(element);
  }
  return element;
}

export default class ContextMenuItem extends EventSource {
  constructor() {
    super();
    this._text = 'Untitled item';
  }

  text(value) {
    this._text = value;
    return this;
  }

  selector(value) {
    this._selector = value;
    return this;
  }

  condition(fn) {
    this._condition = fn;
    return this;
  }

  transform(fn) {
    this._transform = fn;
    return this;
  }

  match(e) {
    const matchSelector = !this._selector || e.matches(this._selector);
    if (!matchSelector) {
      return false;
    }

    const subject = transformElement(this, e);
    if (!subject) {
      // we have a transform and it failed to resolve
      return false;
    }

    const matchCondition = !this._condition || this._condition(subject);
    return matchCondition;
  }
}