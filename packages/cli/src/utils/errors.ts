import { EXIT_CODE_ERROR } from './constants.js';

export class CLIError extends Error {
  constructor(
    message: string,
    public exitCode: number = EXIT_CODE_ERROR,
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

export class ValidationError extends CLIError {
  constructor(message: string) {
    super(message, EXIT_CODE_ERROR);
    this.name = 'ValidationError';
  }
}

export class FileSystemError extends CLIError {
  constructor(message: string) {
    super(message, EXIT_CODE_ERROR);
    this.name = 'FileSystemError';
  }
}

export class GitError extends CLIError {
  constructor(message: string) {
    super(message, EXIT_CODE_ERROR);
    this.name = 'GitError';
  }
}
