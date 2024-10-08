import { z, ZodSchema, type ZodTypeAny, ZodObject } from 'zod';
import { type JSONSchema } from './Type';

export class JSONSchemaToZod {
	/**
	 * Converts a JSON schema to a Zod schema.
	 *
	 * @param {JSONSchema} schema - The JSON schema.
	 * @returns {ZodSchema} - The Zod schema.
	 */
	public static convert(schema: JSONSchema): ZodSchema {
		return this.parseSchema(schema);
	}

	/**
	 * Parses a JSON schema and returns the corresponding Zod schema.
	 *
	 * @param {JSONSchema} schema - The JSON schema.
	 * @returns {ZodTypeAny} - The ZodTypeAny schema.
	 */
	private static parseSchema(schema: JSONSchema): ZodTypeAny {
		let zodSchema: ZodTypeAny;
		switch (schema.type) {
			case 'string':
				zodSchema = this.parseString(schema);
				break;
			case 'number':
				zodSchema = this.parseNumber(schema);
				break;
			case 'integer':
				zodSchema = this.parseNumber(schema, true);
				break;
			case 'boolean':
				zodSchema = this.parseBoolean(schema);
				break;
			case 'array':
				zodSchema = this.parseArray(schema);
				break;
			case 'object':
				zodSchema = this.parseObject(schema);
				break;
			default:
				zodSchema = this.parseCombinator(schema);
				break;
		}
		if (schema.description) {
			zodSchema = zodSchema.describe(schema.description);
		}
		if (schema.default) {
			zodSchema = zodSchema.default(schema.default);
		}
		return zodSchema;
	}

	/**
	 * Parses a JSON schema of type string and returns the corresponding Zod schema.
	 *
	 * @param {JSONSchema} schema - The JSON schema.
	 * @returns {ZodTypeAny} - The ZodTypeAny schema.
	 */
	private static parseString(schema: JSONSchema): z.ZodLiteral<string | number | boolean> | z.ZodEnum<any> | z.ZodString {
		if (schema.const) {
			return z.literal(schema.const);
		}

		if (schema.enum) {
			const values = schema.enum.map((enumValue) => String(enumValue));
			return z.enum([values[0], ...values.slice(1)]);
		}

		// Apply format-specific methods
		let zodSchema = z.string();
		switch (schema.format) {
			case 'email':
				zodSchema = zodSchema.email();
				break;
			case 'date-time':
				zodSchema = zodSchema.datetime();
				break;
			case 'uri':
				zodSchema = zodSchema.url();
				break;
			case 'uuid':
				zodSchema = zodSchema.uuid();
				break;
			case 'date':
				zodSchema = zodSchema.date();
				break;
		}
		if (schema.minLength) {
			zodSchema = zodSchema.min(schema.minLength);
		}
		if (schema.maxLength) {
			zodSchema = zodSchema.max(schema.maxLength);
		}
		return zodSchema;
	}

	/**
	 * Parses a JSON schema of type number or integer and returns the corresponding Zod schema.
	 *
	 * @param {JSONSchema} schema - The JSON schema.
	 * @returns {ZodTypeAny} - The ZodTypeAny schema.
	 */
	private static parseNumber(schema: JSONSchema, integer?: boolean): z.ZodLiteral<string | number | boolean> | z.ZodNumber {
		if (schema.const) {
			return z.literal(schema.const);
		}

		let zodSchema = z.number();
		if (integer) {
			zodSchema = zodSchema.int();
		}
		if (schema.minimum) {
			zodSchema = zodSchema.min(schema.minimum);
		}
		if (schema.maximum) {
			zodSchema = zodSchema.max(schema.maximum);
		}
		return zodSchema;
	}

	/**
	 * Parses a JSON schema of type number or integer and returns the corresponding Zod schema.
	 *
	 * @param {JSONSchema} schema - The JSON schema.
	 * @returns {ZodTypeAny} - The ZodTypeAny schema.
	 */
	private static parseBoolean(schema: JSONSchema): z.ZodLiteral<string | number | boolean> | z.ZodBoolean {
		if (schema.const) {
			return z.literal(schema.const);
		}
		return z.boolean();
	}

	/**
	 * Parses a JSON schema of type array and returns the corresponding Zod schema.
	 *
	 * @param {JSONSchema} schema - The JSON schema.
	 * @returns {ZodTypeAny} - The ZodTypeAny schema.
	 */
	private static parseArray(schema: JSONSchema): ZodTypeAny {
		if (!schema.items) {
			throw new Error('Array schema must have "items" defined');
		}

		const itemSchema = Array.isArray(schema.items)
			? z.union(schema.items.map((item) => this.parseSchema(item)) as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]])
			: this.parseSchema(schema.items);

		return z.array(itemSchema);
	}

	/**
	 * Parses a JSON schema of type object and returns the corresponding Zod schema.
	 *
	 * @param {JSONSchema} schema - The JSON schema.
	 * @returns {ZodObject<any>} - The ZodObject schema.
	 */
	private static parseObject(schema: JSONSchema): ZodObject<any> {
		const shape: Record<string, ZodTypeAny> = {};
		const required = new Set(schema.required || []);

		for (const [key, value] of Object.entries(schema.properties || {})) {
			const zodSchema = this.parseSchema(value);
			shape[key] = required.has(key) ? zodSchema : zodSchema.optional();
		}

		let zodObject: z.ZodObject<any>;

		if (schema.additionalProperties === true) {
			zodObject = z.object(shape).catchall(z.any()).strip();
		}
		else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
			zodObject = z.object(shape).catchall(this.parseSchema(schema.additionalProperties)).strip();
		}
		else {
			zodObject = z.object(shape).strict();
		}

		return zodObject;
	}

	/**
	 * Parses a JSON schema of type combinator and returns the corresponding Zod schema.
	 *
	 * @param {JSONSchema} schema - The JSON schema.
	 * @returns {ZodTypeAny} - The ZodTypeAny schema.
	 */
	private static parseCombinator(schema: JSONSchema): ZodTypeAny {
		if (schema.oneOf) {
			if (schema.oneOf.length === 1) {
				return this.parseSchema(schema.oneOf[0]);
			}
			else if (schema.oneOf.length > 1) {
				return z.union(schema.oneOf.map((subSchema) => this.parseSchema(subSchema)) as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]);
			}
		}
		if (schema.anyOf) {
			if (schema.anyOf.length === 1) {
				return this.parseSchema(schema.anyOf[0]);
			}
			else if (schema.anyOf.length > 1) {
				return z.union(schema.anyOf.map((subSchema) => this.parseSchema(subSchema)) as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]);
			}
		}
		if (schema.allOf) {
			const baseSchema = schema.allOf[0];
			const mergedSchema = schema.allOf.slice(1).reduce((acc, currentSchema) => {
				return this.mergeSchemas(acc, currentSchema);
			}, baseSchema);
			return this.parseSchema(mergedSchema);
		}
		throw new Error('Unsupported schema type');
	}

	/**
	 * Merges two JSON schemas together.
	 *
	 * @param {JSONSchema} baseSchema - The base JSON schema.
	 * @param {JSONSchema} addSchema - The JSON schema to add.
	 * @returns {JSONSchema} - The merged JSON schema
	 */
	private static mergeSchemas(baseSchema: JSONSchema, addSchema: JSONSchema): JSONSchema {
		const merged: JSONSchema = { ...baseSchema, ...addSchema };
		if (baseSchema.properties && addSchema.properties) {
			merged.properties = { ...baseSchema.properties, ...addSchema.properties };
		}
		if (baseSchema.required && addSchema.required) {
			merged.required = Array.from(new Set([...baseSchema.required, ...addSchema.required]));
		}
		return merged;
	}
}

