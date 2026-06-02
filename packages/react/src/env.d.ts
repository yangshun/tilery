declare module '*.css' {}
declare module 'tilery/style.css' {}
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: string): string;
}
