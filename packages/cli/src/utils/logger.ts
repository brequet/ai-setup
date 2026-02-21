import chalk from 'chalk';

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
};
