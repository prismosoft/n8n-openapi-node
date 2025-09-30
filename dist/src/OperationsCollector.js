"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationsCollector = exports.BaseOperationsCollector = void 0;
const lodash_1 = __importDefault(require("lodash"));
const OptionsByResourceMap_1 = require("./n8n/OptionsByResourceMap");
const SchemaToINodeProperties_1 = require("./n8n/SchemaToINodeProperties");
const utils_1 = require("./n8n/utils");
class BaseOperationsCollector {
    constructor(doc, operationParser, resourceParser, logger) {
        this.operationParser = operationParser;
        this.resourceParser = resourceParser;
        this.logger = logger;
        this.optionsByResource = new OptionsByResourceMap_1.OptionsByResourceMap();
        this._fields = [];
        this.n8nNodeProperties = new SchemaToINodeProperties_1.N8NINodeProperties(doc);
    }
    get operations() {
        var _a;
        if (this.optionsByResource.size === 0) {
            throw new Error('No operations found in OpenAPI document');
        }
        const operations = [];
        for (const [resource, options] of this.optionsByResource) {
            const operation = {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: [resource],
                    },
                },
                options: options,
                default: ((_a = options[0]) === null || _a === void 0 ? void 0 : _a.value) || '',
            };
            operations.push(operation);
        }
        return operations;
    }
    get fields() {
        return [...this._fields];
    }
    visitOperation(operation, context) {
        const bindings = {
            operation: {
                pattern: context.pattern,
                method: context.method,
                operationId: operation.operationId,
            },
        };
        this.bindings = bindings;
        try {
            this._visitOperation(operation, context);
        }
        catch (error) {
            // @ts-ignore
            const data = { ...this.bindings, error: `${error}` };
            // @ts-ignore
            this.logger.warn(data, 'Failed to parse operation');
        }
    }
    _visitOperation(operation, context) {
        if (this.operationParser.shouldSkip(operation, context)) {
            this.logger.info(this.bindings, 'Skipping operation');
            return;
        }
        const { option, fields: operationFields } = this.parseOperation(operation, context);
        const resources = operation.tags.map((tag) => this.resourceParser.value({ name: tag }));
        for (const resourceName of resources) {
            const fields = lodash_1.default.cloneDeep(operationFields);
            const operationName = option.name;
            this.addDisplayOption(fields, resourceName, operationName);
            this.optionsByResource.add(resourceName, option);
            this._fields.push(...fields);
        }
    }
    /**
     * Parse fields from operation, both parameters and request body
     */
    parseFields(operation, context) {
        const fields = [];
        // Merge path parameters with operation parameters, avoiding duplicates
        const pathParams = context.path.parameters || [];
        const operationParams = operation.parameters || [];
        const allParameters = [...pathParams];
        // Only add operation parameters that don't already exist in path parameters
        for (const opParam of operationParams) {
            // Skip reference objects for now
            if ('$ref' in opParam)
                continue;
            const exists = pathParams.some((pathParam) => {
                if ('$ref' in pathParam)
                    return false;
                return pathParam.name === opParam.name && pathParam.in === opParam.in;
            });
            if (!exists) {
                allParameters.push(opParam);
            }
        }
        const parameterFields = this.n8nNodeProperties.fromParameters(allParameters);
        fields.push(...parameterFields);
        try {
            const bodyFields = this.n8nNodeProperties.fromRequestBody(operation.requestBody);
            fields.push(...bodyFields);
        }
        catch (error) {
            const data = { ...this.bindings, error: `${error}` };
            // @ts-ignore
            this.logger.warn(data, 'Failed to parse request body');
            const msg = "There's no body available for request, kindly use HTTP Request node to send body";
            const notice = {
                displayName: `${context.method.toUpperCase()} ${context.pattern}<br/><br/>${msg}`,
                name: 'operation',
                type: 'notice',
                default: '',
            };
            fields.push(notice);
        }
        return fields;
    }
    addDisplayOption(fields, resource, operation) {
        const displayOptions = {
            show: {
                resource: [resource],
                operation: [operation],
            },
        };
        fields.forEach((field) => {
            field.displayOptions = displayOptions;
        });
    }
    parseOperation(operation, context) {
        const method = context.method;
        const uri = context.pattern;
        const parser = this.operationParser;
        const option = {
            name: parser.name(operation, context),
            value: parser.value(operation, context),
            action: parser.action(operation, context),
            description: parser.description(operation, context),
            routing: {
                request: {
                    method: method.toUpperCase(),
                    url: `=${(0, utils_1.replacePathVarsToParameter)(uri)}`,
                },
            },
        };
        const fields = this.parseFields(operation, context);
        return {
            option: option,
            fields: fields,
        };
    }
}
exports.BaseOperationsCollector = BaseOperationsCollector;
class OperationsCollector extends BaseOperationsCollector {
    parseOperation(operation, context) {
        const result = super.parseOperation(operation, context);
        const notice = {
            displayName: `${context.method.toUpperCase()} ${context.pattern}`,
            name: 'operation',
            type: 'notice',
            typeOptions: {
                theme: 'info',
            },
            default: '',
        };
        result.fields.unshift(notice);
        return result;
    }
}
exports.OperationsCollector = OperationsCollector;
//# sourceMappingURL=OperationsCollector.js.map