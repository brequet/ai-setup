import tmp from 'tmp';
import path from 'node:path';
import { __setTestPaths, __clearTestPaths } from '../../src/utils/paths.js';

export interface TestEnv {
  rootDir: string;
  skillsDir: string;
  configDir: string;
  cleanup: () => void;
}

export function createTestEnv(): TestEnv {
  const dir = tmp.dirSync({ unsafeCleanup: true });

  const skillsDir = path.join(dir.name, 'skills');
  const configDir = path.join(dir.name, 'config');

  __setTestPaths({ skillsDir, configDir });

  return {
    rootDir: dir.name,
    skillsDir,
    configDir,
    cleanup: () => {
      __clearTestPaths();
      dir.removeCallback();
    },
  };
}
