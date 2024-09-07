export type JSONSchema = {
	type?: string;
	properties?: Record<string, JSONSchema>;
	items?: JSONSchema | JSONSchema[];
	required?: string[];
	enum?: (string | number)[];
	format?: string;
	oneOf?: JSONSchema[];
	allOf?: JSONSchema[];
	anyOf?: JSONSchema[];
	description?: string;
	default?: any; // can be anything depending on the schema
	additionalProperties?: boolean | JSONSchema;
	[key: string]: any; // For any other additional properties
};
