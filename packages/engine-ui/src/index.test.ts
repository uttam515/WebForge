import { describe, it, expect } from 'vitest';
import type { BlockDefinition } from './index.js';

describe('@webforge/engine-ui', () => {
  it('should accept block structure definition', () => {
    const block: BlockDefinition = {
      type: 'container',
      props: { layout: 'flex' },
      children: [{ type: 'button', props: { label: 'Click me' } }],
    };
    expect(block.type).toBe('container');
    expect(block.children?.length).toBe(1);
  });
});
