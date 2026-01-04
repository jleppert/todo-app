// Custom Jest reporter that streams test results in real-time
class StreamReporter {
  constructor() {
    this.currentFile = null;
  }

  onTestCaseResult(test, testCaseResult) {
    // Print file header when we see the first test from a new file
    const filePath = test.path.replace(process.cwd() + '/', '');
    if (this.currentFile !== test.path) {
      this.currentFile = test.path;
      console.log(`\n\x1b[1m${filePath}\x1b[0m`);
    }

    const status = testCaseResult.status;
    const title = testCaseResult.title;
    const duration = testCaseResult.duration || 0;

    const icons = {
      passed: '\x1b[32m✓\x1b[0m',
      failed: '\x1b[31m✗\x1b[0m',
      pending: '\x1b[33m○\x1b[0m',
      skipped: '\x1b[36m⊘\x1b[0m',
    };

    const icon = icons[status] || '?';
    console.log(`  ${icon} ${title} (${duration}ms)`);
  }
}

module.exports = StreamReporter;
