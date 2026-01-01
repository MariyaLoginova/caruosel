export type BulkItem = { title: string; description?: string };

export function parseBulk(input: string): BulkItem[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [titleRaw, ...rest] = line.split('/');
      const title = titleRaw.trim();
      const description = rest.join('/').trim();
      return {
        title,
        description: description.length ? description : undefined
      };
    })
    .filter((item) => item.title.length > 0);
}
