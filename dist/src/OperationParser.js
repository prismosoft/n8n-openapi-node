"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultOperationParser = void 0;
const lodash = __importStar(require("lodash"));
/**
 * Default behaviour for OpenAPI to n8n operation parser
 * It will use operationId as name, value and action and summary as description
 * Skip deprecated operations
 */
class DefaultOperationParser {
    shouldSkip(operation, context) {
        return !!operation.deprecated;
    }
    name(operation, context) {
        if (operation.operationId) {
            return lodash.startCase(operation.operationId);
        }
        return context.method.toUpperCase() + " " + context.pattern;
    }
    value(operation, context) {
        let name = this.name(operation, context);
        // replace all non-alphanumeric characters with '-'
        return name.replace(/[^a-zA-Z0-9 ]/g, '-');
    }
    action(operation, context) {
        return operation.summary || this.name(operation, context);
    }
    description(operation, context) {
        return operation.description || operation.summary || '';
    }
}
exports.DefaultOperationParser = DefaultOperationParser;
//# sourceMappingURL=OperationParser.js.map