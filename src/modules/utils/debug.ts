/**
 * Debug objects only in development mode
 *
 * @param label - Label to be used in logs
 * @param object - Object to be debugged
 * @returns Proxy
 */
export function debug<O>(label: string, object: O) {
	if (process.env.NODE_ENV === 'production') return object
	else
		return new Proxy(object as Record<string, unknown>, {
			get: function (target, prop) {
				console.log(`${label} - Get`, prop)

				const value = Reflect.get(target, prop)
				if (typeof value === 'function') return value.bind(target)
				else return value
			},

			set: function (target, prop, value) {
				console.log(`${label} - Set`, prop, value)

				return Reflect.set(target, prop, value)
			},
		}) as O
}
