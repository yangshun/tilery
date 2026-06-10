import { describe, expect, it } from 'vite-plus/test';
import { extractSourceRegion, extractSourceRegions } from './source-region';

describe('source region extraction', () => {
  it('extracts plain comment regions', () => {
    const source = `
const layout = {};

// source-region tilery
  <Tilery
    initialLayout={layout}
    renderTabHeader={renderHeader}
  />
// end-source-region tilery
`;

    expect(extractSourceRegion(source, 'tilery')).toBe(
      [
        '<Tilery',
        '  initialLayout={layout}',
        '  renderTabHeader={renderHeader}',
        '/>',
      ].join('\n'),
    );
  });

  it('extracts JSX comment regions', () => {
    const source = `
return (
  <ExampleSection>
    {/* source-region tilery */}
    <Tilery
      initialLayout={layout}
      renderTabContent={renderContent}
    />
    {/* end-source-region tilery */}
  </ExampleSection>
);
`;

    expect(extractSourceRegion(source, 'tilery')).toBe(
      [
        '<Tilery',
        '  initialLayout={layout}',
        '  renderTabContent={renderContent}',
        '/>',
      ].join('\n'),
    );
  });

  it('concatenates multiple regions in order', () => {
    const source = `
// source-region layout
const layout = { type: 'panel' };
// end-source-region layout

return (
  <>
    {/* source-region tilery */}
    <Tilery initialLayout={layout} />
    {/* end-source-region tilery */}
  </>
);
`;

    expect(extractSourceRegions(source, ['layout', 'tilery'])).toBe(
      [
        "const layout = { type: 'panel' };",
        '<Tilery initialLayout={layout} />',
      ].join('\n\n'),
    );
  });

  it('returns null when a region is missing', () => {
    expect(extractSourceRegion('// source-region found', 'missing')).toBeNull();
    expect(
      extractSourceRegions('// source-region found', ['found', 'missing']),
    ).toBeNull();
  });
});
