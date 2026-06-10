import { describe, expect, it } from 'vite-plus/test';
import { resolveDemoSourceCode } from './demo';

describe('Demo source resolution', () => {
  const fileSource = `
// source-region layout
const layout = { type: 'panel' };
// end-source-region layout

{/* source-region tilery */}
<Tilery initialLayout={layout} />
{/* end-source-region tilery */}
`;

  it('returns a single requested region', () => {
    expect(
      resolveDemoSourceCode({
        fileSource,
        source: 'example.tsx',
        region: 'layout',
      }),
    ).toBe("const layout = { type: 'panel' };");
  });

  it('returns multiple requested regions', () => {
    expect(
      resolveDemoSourceCode({
        fileSource,
        source: 'example.tsx',
        regions: ['layout', 'tilery'],
      }),
    ).toBe(
      [
        "const layout = { type: 'panel' };",
        '<Tilery initialLayout={layout} />',
      ].join('\n\n'),
    );
  });

  it('throws when region and regions are both supplied', () => {
    expect(() =>
      resolveDemoSourceCode({
        fileSource,
        source: 'example.tsx',
        region: 'layout',
        regions: ['tilery'],
      }),
    ).toThrow('<Demo>: use either `region` or `regions`, not both');
  });

  it('throws when a requested region is missing', () => {
    expect(() =>
      resolveDemoSourceCode({
        fileSource,
        source: 'example.tsx',
        regions: ['layout', 'missing'],
      }),
    ).toThrow('<Demo>: source-region "missing" not found in example.tsx');
  });
});
