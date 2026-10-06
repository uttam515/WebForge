import { describe, it, expect } from 'vitest';
import type { QuestionDefinition } from './index.js';

describe('@webforge/questionnaire', () => {
  it('should accept question definition structure', () => {
    const question: QuestionDefinition = {
      id: 'appName',
      label: 'What is your application name?',
      type: 'text',
      required: true,
    };
    expect(question.id).toBe('appName');
    expect(question.type).toBe('text');
  });
});
