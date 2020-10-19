// CallStack provides stack-like behavior to an event array
class CallStack {
  constructor(data, functionLabels) {
    this.index = 0;
    this.data = [...data];
    this.maxIndex = this.data.length - 1;
    this.functionLabels = functionLabels;
  }

  peek() {
    if (this.index <= this.maxIndex) {
      return this.data[this.index];
    }
    return null;
  }

  pop() {
    const call = this.peek();
    if (call) {
      this.index += 1;
    }
    return call;
  }
}

export default CallStack;
