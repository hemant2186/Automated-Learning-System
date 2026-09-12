const RUNTIME_VERSIONS = {
  // Pinned versions keep grading reproducible while avoiding a runtime lookup per test case.
  python: '3.10.0',
  javascript: '18.15.0',
};

async function runCode({ language, code, stdin = '' }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, version: RUNTIME_VERSIONS[language], files: [{ content: code }], stdin }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Piston returned ${response.status}`);
    const result = await response.json();
    return {
      stdout: result.run?.stdout || '',
      stderr: result.run?.stderr || '',
      exitCode: Number.isInteger(result.run?.code) ? result.run.code : 0,
    };
  } catch (error) {
    return { stdout: '', stderr: 'Execution timed out or failed', exitCode: 1 };
  } finally {
    clearTimeout(timeout);
  }
}

async function runAgainstTestCases({ language, code, testCases }) {
  const results = [];
  let passedCount = 0;
  for (const testCase of testCases) {
    const execution = await runCode({ language, code, stdin: testCase.input });
    const actualOutput = execution.stdout.trim();
    const expectedOutput = testCase.expectedOutput.trim();
    const passed = execution.exitCode === 0 && actualOutput === expectedOutput;
    if (passed) passedCount += 1;
    results.push({
      passed,
      hidden: Boolean(testCase.hidden),
      expectedOutput,
      actualOutput,
      error: execution.stderr,
    });
  }
  return { results, passedCount, totalCount: testCases.length };
}

module.exports = { runCode, runAgainstTestCases };