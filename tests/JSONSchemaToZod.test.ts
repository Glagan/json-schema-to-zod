import { describe, it, expect } from 'vitest';
import { z, ZodError } from 'zod';
import { JSONSchemaToZod } from '../src/JSONSchemaToZod';
import { type JSONSchema } from '../src/Type';

describe('JSONSchemaToZod', () => {
	it('should convert a simple string schema', () => {
		const jsonSchema = { type: 'string' };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodString);
		expect(() => zodSchema.parse('test')).not.toThrow();
		expect(() => zodSchema.parse(123)).toThrow(ZodError);
	});

	it('should convert a number schema', () => {
		const jsonSchema = { type: 'number' };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodNumber);
		expect(() => zodSchema.parse(123)).not.toThrow();
		expect(() => zodSchema.parse('test')).toThrow(ZodError);
	});

	it('should convert a boolean schema', () => {
		const jsonSchema = { type: 'boolean' };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodBoolean);
		expect(() => zodSchema.parse(true)).not.toThrow();
		expect(() => zodSchema.parse(false)).not.toThrow();
		expect(() => zodSchema.parse('true')).toThrow(ZodError);
	});

	it('should convert an array schema', () => {
		const jsonSchema = { type: 'array', items: { type: 'string' } };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodArray);
		expect(() => zodSchema.parse(['test'])).not.toThrow();
		expect(() => zodSchema.parse([123])).toThrow(ZodError);
	});

	it('should convert an object schema', () => {
		const jsonSchema = {
			type: 'object',
			properties: {
				name: { type: 'string' },
				age: { type: 'number' }
			},
			required: ['name']
		};
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodObject);
		expect(() => zodSchema.parse({ name: 'John', age: 30 })).not.toThrow();
		expect(() => zodSchema.parse({ name: 'John' })).not.toThrow();
		expect(() => zodSchema.parse({ age: 30 })).toThrow(ZodError);
	});

	it('should handle enum values in string schema', () => {
		const jsonSchema = { type: 'string', enum: ['Alice', 'Bob'] };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodEnum);
		expect(() => zodSchema.parse('Alice')).not.toThrow();
		expect(() => zodSchema.parse('Charlie')).toThrow(ZodError);
	});

	it('should handle format-specific string schemas (email)', () => {
		const jsonSchema = { type: 'string', format: 'email' };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodString);
		expect(() => zodSchema.parse('test@example.com')).not.toThrow();
		expect(() => zodSchema.parse('invalid-email')).toThrow(ZodError);
	});

	it('should handle oneOf combinator', () => {
		const jsonSchema = { oneOf: [{ type: 'string' }, { type: 'number' }] };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodUnion);
		expect(() => zodSchema.parse('test')).not.toThrow();
		expect(() => zodSchema.parse(123)).not.toThrow();
		expect(() => zodSchema.parse(true)).toThrow(ZodError);
	});

	it('should handle allOf combinator', () => {
		const jsonSchema: JSONSchema = {
			allOf: [
				{ type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
				{ type: 'object', properties: { age: { type: 'number' } }, required: ['age'] }
			]
		};
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodObject);
		expect(() => zodSchema.parse({ name: 'John', age: 30 })).not.toThrow();
		expect(() => zodSchema.parse({ name: 'John' })).toThrow(ZodError);
	});

	it('should handle anyOf combinator', () => {
		const jsonSchema = { anyOf: [{ type: 'string' }, { type: 'number' }] };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodUnion);
		expect(() => zodSchema.parse('test')).not.toThrow();
		expect(() => zodSchema.parse(123)).not.toThrow();
		expect(() => zodSchema.parse(true)).toThrow(ZodError);
	});

	it('should handle description in string schema', () => {
		const jsonSchema = { type: 'string', description: 'My string schema' };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodString);
		expect(zodSchema._def.description).toEqual('My string schema');
	});

	it('should handle description in number schema', () => {
		const jsonSchema = { type: 'number', description: 'My number schema' };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodNumber);
		expect(zodSchema._def.description).toEqual('My number schema');
	});

	it('should handle description in array schema', () => {
		const jsonSchema = { type: 'array', items: { type: 'string' }, description: 'My array schema' };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodArray);
		expect(zodSchema._def.description).toEqual('My array schema');
	});

	it('should handle description in object schema', () => {
		const jsonSchema = {
			type: 'object',
			properties: {
				thing: { type: 'string', description: 'My nested description' }
			},
			description: 'My object schema'
		};
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodObject);
		expect(zodSchema._def.description).toEqual('My object schema');
		expect(zodSchema._def.shape().thing._def.description).toEqual('My nested description');
	});

	///

	it('should handle default in string schema', () => {
		const jsonSchema = { type: 'string', default: 'default' };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodDefault);
		expect(zodSchema._def.innerType).toBeInstanceOf(z.ZodString);
		expect(zodSchema.parse(undefined)).toEqual('default');
	});

	it('should handle default in number schema', () => {
		const jsonSchema = { type: 'number', default: 42 };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodDefault);
		expect(zodSchema._def.innerType).toBeInstanceOf(z.ZodNumber);
		expect(zodSchema.parse(undefined)).toEqual(42);
	});

	it('should handle default in array schema', () => {
		const jsonSchema = { type: 'array', items: { type: 'string' }, default: ['default'] };
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodDefault);
		expect(zodSchema._def.innerType).toBeInstanceOf(z.ZodArray);
		expect(zodSchema.parse(undefined)).toEqual(['default']);
	});

	it('should handle default in object schema', () => {
		const jsonSchema = {
			type: 'object',
			properties: {
				thing: { type: 'string', description: 'My nested description' }
			},
			default: { thing: 'default' }
		};
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodDefault);
		expect(zodSchema._def.innerType).toBeInstanceOf(z.ZodObject);
		expect(zodSchema.parse(undefined)).toEqual({ thing: 'default' });
	});

	///

	it('should handle additionalProperties as true', () => {
		const jsonSchema = {
			type: 'object',
			properties: { name: { type: 'string' } },
			additionalProperties: true
		};
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodObject);
		expect(() => zodSchema.parse({ name: 'John', age: 30 })).not.toThrow();
	});

	it('should handle additionalProperties as a schema', () => {
		const jsonSchema = {
			type: 'object',
			properties: { name: { type: 'string' } },
			additionalProperties: { type: 'number' }
		};
		const zodSchema = JSONSchemaToZod.convert(jsonSchema);

		expect(zodSchema).toBeInstanceOf(z.ZodObject);
		expect(() => zodSchema.parse({ name: 'John', age: 30 })).not.toThrow();
		expect(() => zodSchema.parse({ name: 'John', age: 'thirty' })).toThrow(ZodError);
	});

	it('should throw error for unsupported schema type', () => {
		const jsonSchema = { type: 'unsupportedType' };
		expect(() => JSONSchemaToZod.convert(jsonSchema)).toThrow('Unsupported schema type');
	});
});
