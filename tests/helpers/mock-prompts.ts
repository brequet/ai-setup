import { vi } from 'vitest';

export function mockConfirm(returnValue: boolean) {
  vi.doMock('@inquirer/prompts', () => ({
    confirm: vi.fn().mockResolvedValue(returnValue),
    select: vi.fn(),
    checkbox: vi.fn(),
    input: vi.fn(),
  }));
}

export function mockSelect(returnValue: string) {
  vi.doMock('@inquirer/prompts', () => ({
    confirm: vi.fn(),
    select: vi.fn().mockResolvedValue(returnValue),
    checkbox: vi.fn(),
    input: vi.fn(),
  }));
}

export function resetMocks() {
  vi.resetAllMocks();
  vi.unmock('@inquirer/prompts');
}
