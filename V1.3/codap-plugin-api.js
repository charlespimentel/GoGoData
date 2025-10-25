'use strict';

// suporte tanto para browser (window.iframePhone) quanto para ambiente CommonJS
var iframePhone = (typeof window !== 'undefined' && window.iframePhone)
    ? window.iframePhone
    : (typeof require === 'function' ? require('iframe-phone') : null);

// ==========================================================================
//
//  Author:   jsandoe
//
//  Copyright (c) 2016 by The Concord Consortium, Inc. All rights reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
// ==========================================================================
/**
 * This class is intended to provide an abstraction layer for managing
 * a CODAP Data Interactive's connection with CODAP. It is not required. It is
 * certainly possible for a data interactive, for example, to use only the
 * iFramePhone library, which manages the connection at a lower level.
 *
 * This object provides the following services:
 *   1. Initiates the iFramePhone interaction with CODAP.
 *   2. Provides information on the status of the connection.
 *   3. Provides a sendRequest method. It accepts a callback or returns a Promise
 *      for handling the results from CODAP.
 *   4. Provides a subscriber interface to receive selected notifications from
 *      CODAP.
 *   5. Provides automatic handling of Data Interactive State. Prior to saving
 *      a document CODAP requests state from the Data Interactive, where state
 *      is an arbitrary serializable object containing whatever the data
 *      interactive needs to retain. It returns this state when the document
 *      is reopened.
 *   6. Provides a utility to parse a resource selector into its component parts.
 *
 * @type {Object}
 *
 */
/**
 * The CODAP Connection
 * @param {iframePhone.IframePhoneRpcEndpoint}
 */
let connection = null;
let connectionState = "preinit";
const stats = {
    countDiReq: 0,
    countDiRplSuccess: 0,
    countDiRplFail: 0,
    countDiRplTimeout: 0,
    countCodapReq: 0,
    countCodapUnhandledReq: 0,
    countCodapRplSuccess: 0,
    countCodapRplFail: 0,
    timeDiFirstReq: null,
    timeDiLastReq: null,
    timeCodapFirstReq: null,
    timeCodapLastReq: null
};
let config = null;
let interactiveState = {};
/**
 * A list of subscribers to messages from CODAP
 * @param {[{actionSpec: {RegExp}, resourceSpec: {RegExp}, handler: {function}}]}
 */
const notificationSubscribers = [];
function matchResource(resourceName, resourceSpec) {
    return resourceSpec === "*" || resourceName === resourceSpec;
}
function notificationHandler(request, callback) {
    const action = request.action;
    const resource = request.resource;
    let requestValues = request.values;
    let returnMessage = { success: true };
    connectionState = "active";
    stats.countCodapReq += 1;
    stats.timeCodapLastReq = new Date();
    if (!stats.timeCodapFirstReq) {
        stats.timeCodapFirstReq = stats.timeCodapLastReq;
    }
    if (action === "notify" && !Array.isArray(requestValues)) {
        requestValues = [requestValues];
    }
    let handled = false;
    let success = true;
    if ((action === "get") || (action === "update")) {
        // get assumes only one subscriber because it expects only one response.
        notificationSubscribers.some(function (subscription) {
            let result = false;
            try {
                if ((subscription.actionSpec === action) &&
                    matchResource(resource, subscription.resourceSpec)) {
                    const rtn = subscription.handler(request);
                    if (rtn === null || rtn === void 0 ? void 0 : rtn.success) {
                        stats.countCodapRplSuccess++;
                    }
                    else {
                        stats.countCodapRplFail++;
                    }
                    returnMessage = rtn;
                    result = true;
                }
            }
            catch (ex) {
                // console.log('DI Plugin notification handler exception: ' + ex);
                result = true;
            }
            return result;
        });
        if (!handled) {
            stats.countCodapUnhandledReq++;
        }
    }
    else if (action === "notify") {
        requestValues.forEach(function (value) {
            notificationSubscribers.forEach(function (subscription) {
                // pass this notification to matching subscriptions
                handled = false;
                if ((subscription.actionSpec === action) && matchResource(resource, subscription.resourceSpec) && (!subscription.operation ||
                    (subscription.operation === value.operation) && subscription.handler)) {
                    const rtn = subscription.handler({ action, resource, values: value });
                    if (rtn === null || rtn === void 0 ? void 0 : rtn.success) {
                        stats.countCodapRplSuccess++;
                    }
                    else {
                        stats.countCodapRplFail++;
                    }
                    success = (success && (rtn ? rtn.success : false));
                    handled = true;
                }
            });
            if (!handled) {
                stats.countCodapUnhandledReq++;
            }
        });
    }
    else ;
    return callback(returnMessage);
}
const codapInterface = {
    /**
     * Connection statistics
     */
    stats,
    /**
     * Initialize connection.
     *
     * Start connection. Request interactiveFrame to get prior state, if any.
     * Update interactive frame to set name and dimensions and other configuration
     * information.
     *
     * @param iConfig {object} Configuration. Optional properties: title {string},
     *                        version {string}, dimensions {object}
     *
     * @param iCallback {function(interactiveState)}
     * @return {Promise} Promise of interactiveState;
     */
    init(iConfig, iCallback) {
        const this_ = this;
        return new Promise(function (resolve, reject) {
            function getFrameRespHandler(resp) {
                const success = resp && resp[1] && resp[1].success;
                const receivedFrame = success && resp[1].values;
                const savedState = receivedFrame && receivedFrame.savedState;
                this_.updateInteractiveState(savedState);
                if (success) {
                    // deprecated way of conveying state
                    if (iConfig.stateHandler) {
                        iConfig.stateHandler(savedState);
                    }
                    resolve(savedState);
                }
                else {
                    if (!resp) {
                        reject("Connection request to CODAP timed out.");
                    }
                    else {
                        reject((resp[1] && resp[1].values && resp[1].values.error) ||
                            "unknown failure");
                    }
                }
                if (iCallback) {
                    iCallback(savedState);
                }
            }
            const getFrameReq = { action: "get", resource: "interactiveFrame" };
            const newFrame = {
                name: iConfig.name,
                title: iConfig.title,
                version: iConfig.version,
                dimensions: iConfig.dimensions,
                preventBringToFront: iConfig.preventBringToFront,
                preventDataContextReorg: iConfig.preventDataContextReorg
            };
            const updateFrameReq = {
                action: "update",
                resource: "interactiveFrame",
                values: newFrame
            };
            config = iConfig;
            // initialize connection
            connection = new iframePhone.IframePhoneRpcEndpoint(notificationHandler, "data-interactive", window.parent);
            if (!config.customInteractiveStateHandler) {
                this_.on("get", "interactiveState", function () {
                    return ({ success: true, values: this_.getInteractiveState() });
                }.bind(this_));
            }
            // console.log('sending interactiveState: ' + JSON.stringify(this_.getInteractiveState));
            // update, then get the interactiveFrame.
            return this_.sendRequest([updateFrameReq, getFrameReq])
                .then(getFrameRespHandler, reject);
        }.bind(this));
    },
    /**
     * Current known state of the connection
     * @param {'preinit' || 'init' || 'active' || 'inactive' || 'closed'}
     */
    getConnectionState() { return connectionState; },
    getStats() {
        return stats;
    },
    getConfig() {
        return config;
    },
    /**
     * Returns the interactive state.
     *
     * @returns {object}
     */
    getInteractiveState() {
        return interactiveState;
    },
    /**
     * Updates the interactive state.
     * @param iInteractiveState {Object}
     */
    updateInteractiveState(iInteractiveState) {
        if (!iInteractiveState) {
            return;
        }
        interactiveState = Object.assign(interactiveState, iInteractiveState);
    },
    destroy() {
        // todo : more to do?
        connection = null;
    },
    /**
     * Sends a request to CODAP. The format of the message is as defined in
     * {@link https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-API}.
     *
     * @param message {String}
     * @param callback {function(response, request)} Optional callback to handle
     *    the CODAP response. Note both the response and the initial request will
     *    sent.
     *
     * @return {Promise} The promise of the response from CODAP.
     */
    sendRequest(message, callback) {
        return new Promise(function (resolve, reject) {
            function handleResponse(request, response, cb) {
                if (response === undefined) {
                    // console.warn('handleResponse: CODAP request timed out');
                    reject("handleResponse: CODAP request timed out: " + JSON.stringify(request));
                    stats.countDiRplTimeout++;
                }
                else {
                    connectionState = "active";
                    if (response.success) {
                        stats.countDiRplSuccess++;
                    }
                    else {
                        stats.countDiRplFail++;
                    }
                    resolve(response);
                }
                if (cb) {
                    cb(response, request);
                }
            }
            switch (connectionState) {
                case "closed": // log the message and ignore
                    // console.warn('sendRequest on closed CODAP connection: ' + JSON.stringify(message));
                    reject("sendRequest on closed CODAP connection: " + JSON.stringify(message));
                    break;
                case "preinit": // warn, but issue request.
                // console.log('sendRequest on not yet initialized CODAP connection: ' +
                // JSON.stringify(message));
                /* falls through */
                default:
                    if (connection) {
                        stats.countDiReq++;
                        stats.timeDiLastReq = new Date();
                        if (!stats.timeDiFirstReq) {
                            stats.timeCodapFirstReq = stats.timeDiLastReq;
                        }
                        connection.call(message, function (response) {
                            handleResponse(message, response, callback);
                        });
                    }
            }
        });
    },
    /**
     * Registers a handler to respond to CODAP-initiated requests and
     * notifications. See {@link https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-API#codap-initiated-actions}
     *
     * @param actionSpec {'get' || 'notify'} (optional) Action to handle. Defaults to 'notify'.
     * @param resourceSpec {String} A resource string.
     * @param operation {String} (optional) name of operation, e.g. 'create', 'delete',
     *   'move', 'resize', .... If not specified, all operations will be reported.
     * @param handler {Function} A handler to receive the notifications.
     */
    on(actionSpec, resourceSpec, operation, handler) {
        let as = "notify", rs, os, hn;
        const args = Array.prototype.slice.call(arguments);
        if (["get", "update", "notify"].indexOf(args[0]) >= 0) {
            as = args.shift();
        }
        rs = args.shift();
        if (typeof args[0] !== "function") {
            os = args.shift();
        }
        hn = args.shift();
        const subscriber = {
            actionSpec: as,
            resourceSpec: rs,
            operation: os,
            handler: hn
        };
        notificationSubscribers.push(subscriber);
    },
    /**
     * Parses a resource selector returning a hash of named resource names to
     * resource values. The last clause is identified as the resource type.
     * E.g. converts 'dataContext[abc].collection[def].case'
     * to {dataContext: 'abc', collection: 'def', type: 'case'}
     *
     * @param {String} iResource
     * @return {Object}
     */
    parseResourceSelector(iResource) {
        const selectorRE = /([A-Za-z0-9_-]+)\[([^\]]+)]/;
        const result = {};
        const selectors = iResource.split(".");
        selectors.forEach(function (selector) {
            let resourceType, resourceName;
            const match = selectorRE.exec(selector);
            if (selectorRE.test(selector) && match) {
                resourceType = match[1];
                resourceName = match[2];
                result[resourceType] = resourceName;
                result.type = resourceType;
            }
            else {
                result.type = selector;
            }
        });
        return result;
    }
};

////////////// internal helper functions //////////////
const ctxStr = (contextName) => `dataContext[${contextName}]`;
const collStr = (collectionName) => `collection[${collectionName}]`;
const createMessage = (action, resource, values) => {
    return {
        action,
        resource,
        values
    };
};
const sendMessage = async (action, resource, values) => {
    const message = createMessage(action, resource, values);
    return await codapInterface.sendRequest(message);
};
////////////// public API //////////////
const initializePlugin = async (options) => {
    const { pluginName, version, dimensions } = options;
    const interfaceConfig = {
        name: pluginName,
        version,
        dimensions
    };
    return await codapInterface.init(interfaceConfig);
};
////////////// component functions //////////////
const createTable = async (dataContext, datasetName) => {
    const values = {
        type: "caseTable",
        dataContext
    };
    if (datasetName) {
        values.name = datasetName;
    }
    return sendMessage("create", "component", values);
};
// Selects this component. In CODAP this will bring this component to the front.
const selectSelf = () => {
    const selectComponent = async function (id) {
        return codapInterface.sendRequest({
            action: "notify",
            resource: `component[${id}]`,
            values: { request: "select" }
        }, (result) => {
            if (!result.success) {
                // eslint-disable-next-line no-console
                console.log("selectSelf failed");
            }
        });
    };
    codapInterface.sendRequest({ action: "get", resource: "interactiveFrame" }, (result) => {
        if (result.success) {
            return selectComponent(result.values.id);
        }
    });
};
const addComponentListener = (callback) => {
    codapInterface.on("notify", "component", callback);
};
////////////// data context functions //////////////
const getListOfDataContexts = () => {
    return sendMessage("get", "dataContextList");
};
const getDataContext = (dataContextName) => {
    return sendMessage("get", ctxStr(dataContextName));
};
const createDataContext = (dataContextName) => {
    return sendMessage("create", "dataContext", { name: dataContextName });
};
const createDataContextFromURL = (url) => {
    return sendMessage("create", "dataContextFromURL", { "URL": url });
};
const addDataContextsListListener = (callback) => {
    codapInterface.on("notify", "documentChangeNotice", callback);
};
const addDataContextChangeListener = (dataContextName, callback) => {
    codapInterface.on("notify", `dataContextChangeNotice[${dataContextName}]`, callback);
};
////////////// collection functions //////////////
const getCollectionList = (dataContextName) => {
    return sendMessage("get", `${ctxStr(dataContextName)}.collectionList`);
};
const getCollection = (dataContextName, collectionName) => {
    return sendMessage("get", `${ctxStr(dataContextName)}.${collStr(collectionName)}`);
};
const createParentCollection = (dataContextName, collectionName, attrs) => {
    const resource = `${ctxStr(dataContextName)}.collection`;
    const values = {
        "name": collectionName,
        "title": collectionName,
        "parent": "_root_"
    };
    if (attrs) {
        values.attrs = attrs;
    }
    return sendMessage("create", resource, values);
};
const createChildCollection = (dataContextName, collectionName, parentCollectionName, attrs) => {
    const resource = `${ctxStr(dataContextName)}.collection`;
    const values = {
        "name": collectionName,
        "title": collectionName,
        "parent": parentCollectionName
    };
    if (attrs) {
        values.attrs = attrs;
    }
    return sendMessage("create", resource, values);
};
const createNewCollection = (dataContextName, collectionName, attrs) => {
    const resource = `${ctxStr(dataContextName)}.collection`;
    const values = {
        "name": collectionName,
        "title": collectionName,
    };
    if (attrs) {
        values.attrs = attrs;
    }
    return sendMessage("create", resource, values);
};
const ensureUniqueCollectionName = async (dataContextName, collectionName, index) => {
    index = index || 0;
    const uniqueName = `${collectionName}${index !== 0 ? index : ""}`;
    const getCollMessage = {
        "action": "get",
        "resource": `${ctxStr(dataContextName)}.collection[${uniqueName}]`
    };
    const result = await new Promise((resolve) => {
        codapInterface.sendRequest(getCollMessage, (res) => {
            resolve(res);
        });
    });
    if (result.success) {
        // guard against runaway loops
        if (index >= 100) {
            return undefined;
        }
        return ensureUniqueCollectionName(dataContextName, collectionName, index + 1);
    }
    else {
        return uniqueName;
    }
};
////////////// attribute functions //////////////
const getAttribute = (dataContextName, collectionName, attributeName) => {
    const resource = `${ctxStr(dataContextName)}.${collStr(collectionName)}.attribute[${attributeName}]`;
    return sendMessage("get", resource);
};
const getAttributeList = (dataContextName, collectionName) => {
    const resource = `${ctxStr(dataContextName)}.${collStr(collectionName)}.attributeList`;
    return sendMessage("get", resource);
};
const createNewAttribute = (dataContextName, collectionName, attributeName) => {
    const resource = `${ctxStr(dataContextName)}.${collStr(collectionName)}.attribute`;
    const values = {
        "name": attributeName,
        "title": attributeName,
    };
    return sendMessage("create", resource, values);
};
const updateAttribute = (dataContextName, collectionName, attributeName, attribute, values) => {
    const resource = `${ctxStr(dataContextName)}.${collStr(collectionName)}.attribute[${attributeName}]`;
    return sendMessage("update", resource, values);
};
const updateAttributePosition = (dataContextName, collectionName, attrName, newPosition) => {
    const resource = `${ctxStr(dataContextName)}.${collStr(collectionName)}.attributeLocation[${attrName}]`;
    return sendMessage("update", resource, {
        "collection": collectionName,
        "position": newPosition
    });
};
const createCollectionFromAttribute = (dataContextName, oldCollectionName, attr, parent) => {
    // check if a collection for the attribute already exists
    const getCollectionMessage = createMessage("get", `${ctxStr(dataContextName)}.${collStr(attr.name)}`);
    return codapInterface.sendRequest(getCollectionMessage, async (result) => {
        // since you can't "re-parent" collections we need to create a temp top level collection, move the attribute,
        // and then check if CODAP deleted the old collection as it became empty and if so rename the new collection
        const moveCollection = result.success && (result.values.attrs.length === 1 || attr.name === oldCollectionName);
        const newCollectionName = moveCollection ? await ensureUniqueCollectionName(dataContextName, attr.name, 0) : attr.name;
        if (newCollectionName === undefined) {
            return;
        }
        const _parent = parent === "root" ? "_root_" : parent;
        const createCollectionRequest = createMessage("create", `${ctxStr(dataContextName)}.collection`, {
            "name": newCollectionName,
            "title": newCollectionName,
            parent: _parent,
        });
        return codapInterface.sendRequest(createCollectionRequest, (createCollResult) => {
            if (createCollResult.success) {
                const moveAttributeRequest = createMessage("update", `${ctxStr(dataContextName)}.${collStr(oldCollectionName)}.attributeLocation[${attr.name}]`, {
                    "collection": newCollectionName,
                    "position": 0
                });
                return codapInterface.sendRequest(moveAttributeRequest);
            }
        });
    });
};
////////////// case functions //////////////
const getCaseCount = (dataContextName, collectionName) => {
    const resource = `${ctxStr(dataContextName)}.${collStr(collectionName)}.caseCount`;
    return sendMessage("get", resource);
};
const getCaseByIndex = (dataContextName, collectionName, index) => {
    const resource = `${ctxStr(dataContextName)}.${collStr(collectionName)}.caseByIndex[${index}]`;
    return sendMessage("get", resource);
};
const getCaseByID = (dataContextName, caseID) => {
    const resource = `${ctxStr(dataContextName)}.caseByID[${caseID}]`;
    return sendMessage("get", resource);
};
const getCaseBySearch = (dataContextName, collectionName, search) => {
    const resource = `${ctxStr(dataContextName)}.${collStr(collectionName)}.caseSearch[${search}]`;
    return sendMessage("get", resource);
};
const getCaseByFormulaSearch = (dataContextName, collectionName, search) => {
    const resource = `${ctxStr(dataContextName)}.${collStr(collectionName)}.caseFormulaSearch[${search}]`;
    return sendMessage("get", resource);
};
const createSingleOrParentCase = (dataContextName, collectionName, values) => {
    const resource = `${ctxStr(dataContextName)}.${collStr(collectionName)}.case`;
    return sendMessage("create", resource, values);
};
const createChildCase = (dataContextName, collectionName, parentCaseID, values) => {
    const resource = `${ctxStr(dataContextName)}.${collStr(collectionName)}.case`;
    const valuesWithParent = [
        {
            parent: parentCaseID,
            values
        }
    ];
    return sendMessage("create", resource, valuesWithParent);
};
const updateCaseById = (dataContextName, caseID, values) => {
    const resource = `${ctxStr(dataContextName)}.caseByID[${caseID}]`;
    const updateValues = {
        values
    };
    return sendMessage("update", resource, updateValues);
};
const updateCases = (dataContextName, collectionName, values) => {
    const resource = `${ctxStr(dataContextName)}.${collStr(collectionName)}.case`;
    return sendMessage("update", resource, values);
};
const getSelectionList = (dataContextName) => {
    return sendMessage("get", `${ctxStr(dataContextName)}.selectionList`);
};
const selectCases = (dataContextName, caseIds) => {
    return sendMessage("create", `${ctxStr(dataContextName)}.selectionList`, caseIds);
};
const addCasesToSelection = (dataContextName, caseIds) => {
    return sendMessage("update", `${ctxStr(dataContextName)}.selectionList`, caseIds);
};
////////////// item functions //////////////
const getItemCount = (dataContextName) => {
    return sendMessage("get", `${ctxStr(dataContextName)}.itemCount`);
};
const getAllItems = (dataContextName) => {
    return sendMessage("get", `${ctxStr(dataContextName)}.itemSearch[*]`);
};
const getItemByID = (dataContextName, itemID) => {
    return sendMessage("get", `${ctxStr(dataContextName)}.itemByID[${itemID}]`);
};
const getItemByIndex = (dataContextName, index) => {
    return sendMessage("get", `${ctxStr(dataContextName)}.item[${index}]`);
};
const getItemByCaseID = (dataContextName, caseID) => {
    return sendMessage("get", `${ctxStr(dataContextName)}.itemByCaseID[${caseID}]`);
};
const getItemBySearch = (dataContextName, search) => {
    return sendMessage("get", `${ctxStr(dataContextName)}.itemSearch[${search}]`);
};
const createItems = (dataContextName, items) => {
    return sendMessage("create", `${ctxStr(dataContextName)}.item`, items);
};
const updateItemByID = (dataContextName, itemID, values) => {
    return sendMessage("update", `${ctxStr(dataContextName)}.itemByID[${itemID}]`, values);
};
const updateItemByIndex = (dataContextName, index, values) => {
    return sendMessage("update", `${ctxStr(dataContextName)}.item[${index}]`, values);
};
const updateItemByCaseID = (dataContextName, caseID, values) => {
    return sendMessage("update", `${ctxStr(dataContextName)}.itemByCaseID[${caseID}]`, values);
};

// ----------------------
// Browser compatibility: expõe codapInterface globalmente
// (se estiver rodando diretamente em browser sem sistema de módulos)
if (typeof window !== 'undefined') {
  window.codapInterface = codapInterface;
  // expõe initializePlugin se quiser usar
  window.initializePlugin = initializePlugin;
  // (se quiser expor helpers adicionais, adicione aqui)
}

/*
exports.addCasesToSelection = addCasesToSelection;
exports.addComponentListener = addComponentListener;
exports.addDataContextChangeListener = addDataContextChangeListener;
exports.addDataContextsListListener = addDataContextsListListener;
exports.codapInterface = codapInterface;
exports.createChildCase = createChildCase;
exports.createChildCollection = createChildCollection;
exports.createCollectionFromAttribute = createCollectionFromAttribute;
exports.createDataContext = createDataContext;
exports.createDataContextFromURL = createDataContextFromURL;
exports.createItems = createItems;
exports.createNewAttribute = createNewAttribute;
exports.createNewCollection = createNewCollection;
exports.createParentCollection = createParentCollection;
exports.createSingleOrParentCase = createSingleOrParentCase;
exports.createTable = createTable;
exports.ensureUniqueCollectionName = ensureUniqueCollectionName;
exports.getAllItems = getAllItems;
exports.getAttribute = getAttribute;
exports.getAttributeList = getAttributeList;
exports.getCaseByFormulaSearch = getCaseByFormulaSearch;
exports.getCaseByID = getCaseByID;
exports.getCaseByIndex = getCaseByIndex;
exports.getCaseBySearch = getCaseBySearch;
exports.getCaseCount = getCaseCount;
exports.getCollection = getCollection;
exports.getCollectionList = getCollectionList;
exports.getDataContext = getDataContext;
exports.getItemByCaseID = getItemByCaseID;
exports.getItemByID = getItemByID;
exports.getItemByIndex = getItemByIndex;
exports.getItemBySearch = getItemBySearch;
exports.getItemCount = getItemCount;
exports.getListOfDataContexts = getListOfDataContexts;
exports.getSelectionList = getSelectionList;
exports.initializePlugin = initializePlugin;
exports.selectCases = selectCases;
exports.selectSelf = selectSelf;
exports.sendMessage = sendMessage;
exports.updateAttribute = updateAttribute;
exports.updateAttributePosition = updateAttributePosition;
exports.updateCaseById = updateCaseById;
exports.updateCases = updateCases;
exports.updateItemByCaseID = updateItemByCaseID;
exports.updateItemByID = updateItemByID;
exports.updateItemByIndex = updateItemByIndex;
# sourceMappingURL=codap-plugin-api.js.map*/