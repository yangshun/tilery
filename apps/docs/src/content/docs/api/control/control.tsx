import type { TileryController } from '@tilery/react';

function basename(path: string) {
  return path.split('/').pop() ?? path;
}

export function openFileTab(
  tilery: TileryController,
  filePath: string,
  relatedTabId: string,
  savedFilePath: string,
) {
  // source-region open-tab
  tilery.openOrActivateTab(
    {
      id: filePath,
      data: { title: basename(filePath), filePath },
    },
    { afterTab: relatedTabId },
  );

  tilery.changeTabId('untitled-1', savedFilePath)?.activate();
  // end-source-region open-tab
}
