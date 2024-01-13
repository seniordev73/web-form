import type { JestAssertion, SyncExpectationResult } from 'vitest';
import { expect } from 'vitest';
import type { JSONObject } from '../../../../types/JSONValue.ts';
import type { AssertIs } from '../../../../types/assertions/AssertIs.ts';
import { assertVoidExpectedArgument } from './assertVoidExpectedArgument.ts';
import { expandSimpleExpectExtensionResult } from './expandSimpleExpectExtensionResult.ts';
import type { ExpectExtensionMethod } from './shared-extension-types.ts';
import { validatedExtensionMethod } from './validatedExtensionMethod.ts';

/**
 * Produces a callable `expect` extension implementation, which matches a
 * provided `staticCondition` object. This is effectively a wrapper around
 * {@link JestAssertion.toMatchObject | `expect(...).toMatchObject(staticCondition)`},
 * generated by the custom assertion's definition, and producing the return type
 * expected by all of our custom assertion interfaces.
 */
const staticConditionExtensionMethodFactory = <Parameter>(
	staticCondition: JSONObject
): ExpectExtensionMethod<Parameter, void> => {
	return (actual) => {
		try {
			expect(actual).toMatchObject(staticCondition);

			return true;
		} catch (error) {
			if (error instanceof Error) {
				return error;
			}

			return new Error('Unknown error in assertion');
		}
	};
};

/**
 * Generalizes definition of a Vitest `expect` API extension where the assertion
 * expects a specific type for its `actual` parameter, and:
 *
 * - Implements an assertion checking some statically known condition of the
 *   `actual` argument, as represented by an object suitable for use in
 *   {@link JestAssertion.toMatchObject | `expect(...).toMatchObject(expectedStaticCondition)`}
 *
 * - Automatically perfoms runtime validation of that parameter, helping to
 *   ensure that the extensions' static types are consistent with the runtime
 *   values passed in a given test's assertions
 *
 * - Expands simplified assertion result types to the full interface expected by
 *   Vitest
 *
 * - Facilitates deriving and defining corresponding static types on the base
 *   `expect` type
 *
 * @todo Reconsider naming and language around "static"-ness. The idea here is
 * that the `expected` parameter is defined upfront by the extension, not passed
 * as a parameter at the assertion's call site.
 */
export class StaticConditionExpectExtension<
	StaticCondition extends JSONObject,
	Parameter extends StaticCondition = StaticCondition,
> {
	readonly extensionMethod: ExpectExtensionMethod<unknown, unknown, SyncExpectationResult>;

	constructor(
		readonly validateArgument: AssertIs<Parameter>,
		readonly expectedStaticCondition: StaticCondition
	) {
		const validatedMethod = validatedExtensionMethod(
			validateArgument,
			assertVoidExpectedArgument,
			staticConditionExtensionMethodFactory(expectedStaticCondition)
		);

		this.extensionMethod = expandSimpleExpectExtensionResult(validatedMethod);
	}
}
