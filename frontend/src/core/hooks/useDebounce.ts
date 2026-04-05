import { useEffect, useState } from "react";

/**
 * Returns a debounced version of a value.
 * Useful for delaying expensive reactions (e.g. API search) until user input settles.
 */
export function useDebounce<T>(value: T, delay = 300): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [value, delay]);

	return debouncedValue;
}

export default useDebounce;
