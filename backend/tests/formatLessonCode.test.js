import test from "node:test";
import assert from "node:assert/strict";
import { reformatContent, reformatQiskit } from "../scripts/formatLessonCode.js";

test("reformats a minimal circuit to the target format", () => {
  const input = `from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.x(0)\nqc.measure()`;
  const expected = `from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.x(0)\nqc.measure_all()`;
  assert.equal(reformatQiskit(input), expected);
});

test("keeps each statement on its own line in original order", () => {
  const input = "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure_all()";
  const expected = `from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure_all()`;
  assert.equal(reformatQiskit(input), expected);
});

test("drops comments, imports, and redundant measure lines", () => {
  const input = `# bell state
from qiskit import QuantumCircuit, execute
qc = QuantumCircuit(2)
print("hello")
qc.measure_all()`;
  const expected = `from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nprint("hello")\nqc.measure_all()`;
  assert.equal(reformatQiskit(input), expected);
});

test("returns null when no QuantumCircuit(N) is present", () => {
  assert.equal(reformatQiskit("import numpy as np\nx = 1"), null);
});

test("leaves clearly non-Qiskit blocks untouched in content", () => {
  const content = "Text\n```python\nimport numpy as np\nx = 1\n```\nMore";
  const result = reformatContent(content);
  assert.equal(result.changed, false);
  assert.equal(result.content, content);
});

test("rewrites only python/qiskit fences inside a lesson", () => {
  const content = `Intro

\`\`\`python
from qiskit import QuantumCircuit
qc = QuantumCircuit(1)
qc.x(0)
qc.measure()
\`\`\`

Outro`;
  const result = reformatContent(content);
  assert.equal(result.changed, true);
  assert.match(result.content, /from qiskit import QuantumCircuit\nqc = QuantumCircuit\(1\)\nqc\.x\(0\)\nqc\.measure_all\(\)/);
});

test("preserves fence language tag", () => {
  const content = "```qiskit\nfrom qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.x(0)\nqc.measure()\n```";
  const result = reformatContent(content);
  assert.ok(result.content.startsWith("```qiskit\n"));
});