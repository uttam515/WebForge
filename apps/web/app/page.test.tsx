import { describe, it, expect } from 'vitest';
import HomePage from './page.js';

describe('HomePage', () => {
  it('should be a valid React component function', () => {
    expect(typeof HomePage).toBe('function');
  });

  it('should render JSX element with default props', () => {
    const element = HomePage();
    expect(element).toBeDefined();
    expect(element.type).toBe('main');
  });
});
