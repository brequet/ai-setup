import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { DIVIDER_WIDTH } from './constants.js';

let verbose = false;

export function setVerbose(enabled: boolean) {
  verbose = enabled;
}

export const logger = {
  info(message: string) {
    console.log(message);
  },

  success(message: string) {
    console.log(chalk.green('✔'), message);
  },

  error(message: string, error?: Error) {
    console.error(chalk.red('✖'), message);
    if (verbose && error?.stack) {
      console.error(chalk.gray(error.stack));
    }
  },

  warn(message: string) {
    console.warn(chalk.yellow('⚠'), message);
  },

  debug(message: string) {
    if (verbose) {
      console.log(chalk.gray('[DEBUG]'), message);
    }
  },

  blank() {
    console.log('');
  },

  section(title: string) {
    console.log(chalk.bold(title));
  },

  divider(char: string = '─', width: number = DIVIDER_WIDTH) {
    console.log(chalk.dim(char.repeat(width)));
  },

  dim(message: string) {
    console.log(chalk.dim(message));
  },

  print(message: string) {
    console.log(message);
  },

  spinner(text: string): Ora {
    return ora({ text, stream: process.stdout }).start();
  },
};
