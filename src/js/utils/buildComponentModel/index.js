const HTTP_PACKAGE = 'HTTP';
const SQL_PACKAGE = 'SQL';

export default function buildComponents(scenarioData) {
  /* eslint-disable camelcase */
  // map of all packages which are invoked from each package
  const package_calls = {}; // Hash.new { |h, k| h[k] = Set.new }
  // for each class, a set of classes which are called
  const class_calls = {}; // Hash.new { |h, k| h[k] = Set.new }
  // for each class, a set of classes which are its callers
  const class_callers = {}; // Hash.new { |h, k| h[k] = Set.new }
  // map of all classes in each package
  const package_classes = {}; // Hash.new { |h, k| h[k] = Set.new }
  // the package of each class
  const class_package = {};
  // Packages which are invoked from HTTP_PACKAGE
  const controller_packages = new Set();
  // Packages which invoke a SQL query
  const querying_packages = new Set();
  // All packages
  const packages = new Set();
  // Path and line numbers of classes
  const class_locations = {};
  // Source control related metadata
  const source_control = {};
  /* eslint-enable camelcase */

  const locationIndex = {};
  const fqPackageName = [];
  const fqClassName = [];

  function buildLocationIndex(cls) {
    if ( cls.type === 'class' ) {
      fqClassName.push(cls.name);
    }
    if ( cls.type === 'package' ) {
      fqPackageName.push(cls.name);
    }

    if ( cls.type === 'function' ) {
      const locationKey = [cls.location || '<path>:<line>', cls.name].join('#');
      const className = fqClassName.join('::');
      const packageName = fqPackageName.join('/');
      locationIndex[locationKey] = { className, packageName };
    }

    (cls.children || []).forEach(buildLocationIndex);

    if ( cls.type === 'class' ) {
      fqClassName.pop();
    }
    if ( cls.type === 'package' ) {
      fqPackageName.pop();
    }
  }

  scenarioData.classMap.forEach(buildLocationIndex);

  console.log(locationIndex);

  const callStack = [];
  const uniqueInvocations = new Set();
  const invocationGraph = [];
  scenarioData.events.forEach((event) => {
    if ( event.event === 'return' ) {
      return callStack.pop();
    }

    const locationKey = [[event.path || '<path>', event.lineno || '<line>'].join(':'), event.method_id].join('#');
    let calleeClassDef;
    if ( event.sql_query ) {
      calleeClassDef = { className: SQL_PACKAGE, packageName: SQL_PACKAGE };
    } else if ( event.http_server_request ) {
      calleeClassDef = { className: HTTP_PACKAGE, packageName: HTTP_PACKAGE };
    } else {
      calleeClassDef = locationIndex[locationKey];
      if ( !calleeClassDef ) {
        return console.warn(`No class info found for location ${locationKey}`);
      }
    }

    if ( callStack.length > 0 ) {
      const callerClassDef = callStack[callStack.length - 1];
      const call = [callerClassDef, calleeClassDef];
      const callKey = JSON.stringify(call);
      if ( uniqueInvocations.add(callKey) ) {
        invocationGraph.push(call);
      }
    }

    callStack.push(calleeClassDef);

    return null;
  });

  invocationGraph.forEach((call) => {
    call.forEach((type) => {
      packages.add(type.packageName);
      if (!package_classes[type.packageName]) {
        package_classes[type.packageName] = new Set();
      }
      package_classes[type.packageName].add(type.className);
      class_package[type.className] = type.packageName;
    });

    const [caller, callee] = call;

    if ( caller.packageName === HTTP_PACKAGE ) {
      controller_packages.add(callee.packageName);
    }
    if ( callee.packageName === SQL_PACKAGE ) {
      querying_packages.add(caller.packageName);
    }

    if (!package_calls[caller.packageName]) {
      package_calls[caller.packageName] = new Set();
    }
    package_calls[caller.packageName].add(callee.packageName);

    if (!class_calls[caller.className]) {
      class_calls[caller.className] = new Set();
    }
    class_calls[caller.className].add(callee.className);

    if (!class_callers[callee.className]) {
      class_callers[callee.className] = new Set();
    }
    class_callers[callee.className].add(caller.className);
  });

  return {
    package_calls,
    class_calls,
    class_callers,
    package_classes,
    class_package,
    controller_packages,
    querying_packages,
    packages,
    class_locations,
    source_control,
  };
}
