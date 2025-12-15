import fuzzysort from 'fuzzysort';

interface FuzzySearchOptions {
  keys: string[];
  limit: number;
  threshold?: number;
}

export function fuzzySearch<T>(
  query: string | undefined,
  items: T[],
  options: FuzzySearchOptions,
): T[] {
  if (items.length === 0) return [];
  if (!query || !query.trim()) return items.slice(0, options.limit);

  const results = fuzzysort.go(query, items, {
    keys: options.keys,
    limit: options.limit,
    threshold: options.threshold ?? -10000,
  });

  return results.map((result) => result.obj);
}
