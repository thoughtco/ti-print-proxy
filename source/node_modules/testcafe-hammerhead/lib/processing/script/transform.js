"use strict";

exports.__esModule = true;
exports.beforeTransform = beforeTransform;
exports.afterTransform = afterTransform;
exports.default = transform;

var _transformers = _interopRequireDefault(require("./transformers"));

var _jsProtocolLastExpression = _interopRequireDefault(require("./transformers/js-protocol-last-expression"));

var _staticImport = _interopRequireDefault(require("./transformers/static-import"));

var _dynamicImport = _interopRequireDefault(require("./transformers/dynamic-import"));

var _replaceNode = _interopRequireDefault(require("./transformers/replace-node"));

var _esotopeHammerhead = require("esotope-hammerhead");

var _url = require("../../utils/url");

var _stackProcessing = require("../../utils/stack-processing");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class State {
  constructor() {
    _defineProperty(this, "hasTransformedAncestor", false);

    _defineProperty(this, "newExpressionAncestor", void 0);

    _defineProperty(this, "newExpressionAncestorParent", void 0);

    _defineProperty(this, "newExpressionAncestorKey", void 0);
  }

  // NOTE: There is an issue with processing `new` expressions. `new a.src.b()` will be transformed
  // to `new __get$(a, 'src').b()`, which is wrong. The correct result is `new (__get$(a, 'src')).b()`.
  // To solve this problem, we add a 'state' entity. This entity stores the "new" expression, so that
  // we can add it to the changes when the transformation is found.
  static create(currState, node, parent, key, hasTransformedAncestor = false) {
    const isNewExpression = node.type === _esotopeHammerhead.Syntax.NewExpression;
    const isNewExpressionAncestor = isNewExpression && !currState.newExpressionAncestor;
    const newState = new State();
    newState.hasTransformedAncestor = currState.hasTransformedAncestor || hasTransformedAncestor;
    newState.newExpressionAncestor = isNewExpressionAncestor ? node : currState.newExpressionAncestor;
    newState.newExpressionAncestorParent = isNewExpressionAncestor ? parent : currState.newExpressionAncestorParent; // @ts-ignore

    newState.newExpressionAncestorKey = isNewExpressionAncestor ? key : currState.newExpressionAncestorKey;
    return newState;
  }

} // NOTE: We should avoid using native object prototype methods,
// since they can be overriden by the client code. (GH-245)


const objectToString = Object.prototype.toString;
const objectKeys = Object.keys;

function getChange(node, parent, key) {
  /*eslint-disable @typescript-eslint/no-non-null-assertion*/
  const start = node.originStart;
  const end = node.originEnd;
  const nodes = parent[key];
  const index = nodes instanceof Array ? nodes.indexOf(node) : -1;
  /*eslint-disable @typescript-eslint/no-non-null-assertion*/
  // @ts-ignore

  return {
    start,
    end,
    index,
    parent,
    key
  };
}

function transformChildNodes(node, changes, state) {
  // @ts-ignore
  const nodeKeys = objectKeys(node);

  for (const key of nodeKeys) {
    const childNode = node[key];
    const stringifiedNode = objectToString.call(childNode);

    if (stringifiedNode === '[object Array]') {
      // @ts-ignore
      const childNodes = childNode;

      for (const nthNode of childNodes) transform(nthNode, changes, state, node, key);
    } else if (stringifiedNode === '[object Object]') {
      // @ts-ignore
      transform(childNode, changes, state, node, key);
    }
  }
}

function isNodeTransformed(node) {
  return node.originStart !== void 0 && node.originEnd !== void 0;
}

function addChangeForTransformedNode(state, changes, replacement, parent, key) {
  const hasTransformedAncestor = state.hasTransformedAncestor || state.newExpressionAncestor && isNodeTransformed(state.newExpressionAncestor);
  if (hasTransformedAncestor) return;

  if (state.newExpressionAncestor) {
    (0, _replaceNode.default)(state.newExpressionAncestor, state.newExpressionAncestor, state.newExpressionAncestorParent, state.newExpressionAncestorKey);
    changes.push(getChange(state.newExpressionAncestor, state.newExpressionAncestorParent, state.newExpressionAncestorKey));
  } else changes.push(getChange(replacement, parent, key));
}

function beforeTransform(wrapLastExprWithProcessHtml = false, resolver) {
  _jsProtocolLastExpression.default.wrapLastExpr = wrapLastExprWithProcessHtml;
  _staticImport.default.resolver = resolver;

  if (this) {
    try {
      throw new Error();
    } catch (e) {
      _dynamicImport.default.baseUrl = (0, _stackProcessing.getFirstDestUrl)(e.stack);
      if (!_dynamicImport.default.baseUrl && resolver) (0, _url.parseProxyUrl)(resolver('./')).destUrl;
    }
  } else if (resolver) _dynamicImport.default.baseUrl = (0, _url.parseProxyUrl)(resolver('./')).destUrl;
}

function afterTransform() {
  _jsProtocolLastExpression.default.wrapLastExpr = false;
  _staticImport.default.resolver = void 0;
  _dynamicImport.default.baseUrl = void 0;
}
/* eslint-disable @typescript-eslint/indent */


function transform(node, changes = [], state = new State(), parent, key, reTransform) {
  /* eslint-enable @typescript-eslint/indent */
  if (!node || typeof node !== 'object') return changes;
  let nodeChanged = false;

  if (isNodeTransformed(node) && !reTransform) {
    addChangeForTransformedNode(state, changes, node, parent, key);
    nodeChanged = true;
  } else if (_transformers.default.has(node.type)) {
    const nodeTransformers = _transformers.default.get(node.type);

    for (const transformer of nodeTransformers) {
      if (!transformer.condition(node, parent)) continue;
      const replacement = transformer.run(node, parent, key);
      if (!replacement) continue;
      (0, _replaceNode.default)(node, replacement, parent, key);
      addChangeForTransformedNode(state, changes, replacement, parent, key);
      nodeChanged = true;
      if (!transformer.nodeReplacementRequireTransform) break;
      state = State.create(state, replacement, parent, key, nodeChanged);
      transform(replacement, changes, state, parent, key, true);
      return changes;
    }
  }

  state = State.create(state, node, parent, key, nodeChanged);
  transformChildNodes(node, changes, state);
  return changes;
}