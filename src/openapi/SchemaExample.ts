import {RefResolver} from "./RefResolver";
import {OpenAPIV3} from "openapi-types";

class SchemaExampleBuilder {
    private visitedRefs: Set<string> = new Set<string>();

    constructor(private resolver: RefResolver) {
    }

    build(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): any {
        let refs: string[] | undefined
        [schema, refs] = this.resolver.resolveRef(schema)

        if (refs) {
            // Prevent infinite recursion
            for (const ref of refs) {
                if (this.visitedRefs.has(ref)) {
                    return {}
                }
                this.visitedRefs.add(ref);
            }
        }
        if ('oneOf' in schema) {
            return this.build(schema.oneOf![0]);
        }
        if ('allOf' in schema) {
            const examples = schema.allOf!.map((s) => this.build(s));
            return Object.assign({}, ...examples);
        }
        if (schema.example !== undefined) {
            return schema.example;
        }
        if (schema.default !== undefined) {
            return schema.default;
        }
        if (schema.properties) {
            const obj: any = {};
            for (const key in schema.properties) {
                obj[key] = this.build(schema.properties[key]);
            }
            return obj;
        }
        if ('items' in schema && schema.items) {
            return [this.build(schema.items)];
        }
        return undefined;
    }
}

export class SchemaExample {
    private resolver: RefResolver;

    constructor(doc: any) {
        this.resolver = new RefResolver(doc);
    }

    extractExample(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): any {
        return new SchemaExampleBuilder(this.resolver).build(schema);
    }
}
