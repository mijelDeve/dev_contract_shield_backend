import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import simpleGit, { SimpleGit } from 'simple-git';
import { ContractRepository } from '../contracts/repositories/contract.repository';
import { TestExecution, TestReport } from '../entities/test-report.entity';

@Injectable()
export class TestsService {
  private readonly logsSubjects = new Map<string, Subject<string>>();
  private readonly testExecutions = new Map<string, TestExecution>();

  constructor(private contractRepository: ContractRepository) {}

  private log(contractIdStr: string, message: string): void {
    console.log(`[${contractIdStr}] ${message}`);
    this.sendLog(contractIdStr, message);
  }

  async validateAndRunTests(
    contractId: number,
    userId: string,
  ): Promise<{ message: string; streamUrl: string }> {
    void userId;
    const contract = await this.contractRepository.findById(contractId);
    const githubRepoUrl = contract?.github_repo_url || '';

    this.startBackgroundExecution(contractId, githubRepoUrl);

    return {
      message: 'Tests iniciados',
      streamUrl: `/logs/${contractId}/stream`,
    };
  }

  private startBackgroundExecution(
    contractId: number,
    githubRepoUrl: string,
  ): void {
    const contractIdStr = String(contractId);

    this.testExecutions.set(contractIdStr, {
      status: 'running',
      startedAt: new Date().toISOString(),
    });

    this.runTests(contractId, githubRepoUrl).catch((error) => {
      console.error(
        `Error ejecutando tests para contrato ${contractId}:`,
        error,
      );
    });
  }

  private async runTests(
    contractId: number,
    githubRepoUrl: string,
  ): Promise<void> {
    const contractIdStr = String(contractId);
    const executionId = uuidv4();
    const tempDir = path.join(
      process.cwd(),
      'temp-tests',
      `contract-${contractId}-${executionId}`,
    );
    const logsSubject = new Subject<string>();
    this.logsSubjects.set(contractIdStr, logsSubject);

    let rawOutput = '';

    try {
      console.log('Iniciando ejecución de tests...');
      this.log(contractIdStr, `📁 Creando carpeta temporal: ${tempDir}`);
      await fs.mkdirp(tempDir);
      console.log('Carpeta temporal creada:', tempDir);

      if (!githubRepoUrl) {
        throw new Error('El contrato no tiene github_repo_url configurado');
      }

      this.log(contractIdStr, `🔄 Clonando: ${githubRepoUrl}`);
      const git: SimpleGit = simpleGit();
      await git.clone(githubRepoUrl, tempDir, ['--depth', '1']);
      this.log(contractIdStr, '✅ Repositorio clonado');

      const scriptPath = path.join(tempDir, 'script.js');
      const hasScript = await fs.pathExists(scriptPath);
      if (!hasScript) {
        throw new Error('No se encontró script.js en la raíz del repositorio');
      }

      const scriptCode = await fs.readFile(scriptPath, 'utf-8');
      const testContent = this.generateNodeTestFile(scriptCode);
      const testPath = path.join(tempDir, 'script.test.js');
      await fs.writeFile(testPath, testContent, 'utf-8');
      this.log(contractIdStr, `✅ Test generado: ${testPath}`);

      this.log(contractIdStr, '🧪 Ejecutando: node --test script.test.js');
      const result = await this.executeNodeTests(tempDir, contractIdStr);
      rawOutput = result.output;

      const storedCoverage = await this.contractRepository.updateCoverage(
        contractId,
        result.coverage,
      );
      this.log(
        contractIdStr,
        `💾 Coverage guardado en contrato: ${storedCoverage}%`,
      );

      const updatedContract =
        await this.contractRepository.findById(contractId);
      this.log(
        contractIdStr,
        `🔎 Coverage leido desde DB: ${updatedContract?.coverage ?? 'null'}`,
      );

      const report: TestReport = {
        contractId,
        passed: result.passed,
        failed: result.failed,
        coverage: result.coverage,
        rawOutput,
        success: result.failed === 0,
        generatedAt: new Date().toISOString(),
      };

      this.testExecutions.set(contractIdStr, {
        status: 'completed',
        report,
      });

      this.log(
        contractIdStr,
        `🏁 Tests finalizados: ${result.passed} passed, ${result.failed} failed`,
      );
      this.log(
        contractIdStr,
        `📊 Porcentaje de exito (coverage reportado): ${result.coverage}%`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.log(contractIdStr, `❌ Error: ${errorMessage}`);

      try {
        const storedCoverage = await this.contractRepository.updateCoverage(
          contractId,
          0,
        );
        this.log(
          contractIdStr,
          `💾 Coverage guardado en contrato: ${storedCoverage}%`,
        );
      } catch (coverageError) {
        const coverageErrorMessage =
          coverageError instanceof Error
            ? coverageError.message
            : 'Error guardando coverage';
        this.log(
          contractIdStr,
          `⚠️ No se pudo guardar coverage=0: ${coverageErrorMessage}`,
        );
      }

      this.testExecutions.set(contractIdStr, {
        status: 'failed',
        report: {
          contractId,
          passed: 0,
          failed: 1,
          coverage: 0,
          rawOutput,
          success: false,
          generatedAt: new Date().toISOString(),
          error: errorMessage,
        },
      });
    } finally {
      this.log(
        contractIdStr,
        `🧹 Carpeta temporal preservada para debug: ${tempDir}`,
      );
      // await fs.remove(tempDir).catch(() => {});
      this.log(
        contractIdStr,
        `✅ Limpieza saltada - Revisar carpeta: ${tempDir}`,
      );

      setTimeout(() => {
        this.logsSubjects.delete(contractIdStr);
        logsSubject.complete();
      }, 5000);
    }
  }

  private generateNodeTestFile(scriptCode: string): string {
    const functions = this.extractExportedFunctions(scriptCode);
    const hasBasicCalculatorFns =
      functions.includes('sumar') &&
      functions.includes('restar') &&
      functions.includes('multiplicar') &&
      functions.includes('dividir');

    if (hasBasicCalculatorFns) {
      return `const test = require('node:test');
const assert = require('node:assert/strict');

const { sumar, restar, multiplicar, dividir } = require('./script.js');

test('sumar devuelve la suma correcta', () => {
  assert.equal(sumar(2, 3), 5);
});

test('restar devuelve la resta correcta', () => {
  assert.equal(restar(10, 4), 6);
});

test('multiplicar devuelve la multiplicacion correcta', () => {
  assert.equal(multiplicar(6, 7), 42);
});

test('dividir devuelve la division correcta', () => {
  assert.equal(dividir(20, 5), 4);
});

test('dividir por 0 devuelve mensaje de error', () => {
  assert.equal(dividir(20, 0), 'No se puede dividir por 0');
});
`;
    }

    if (functions.length > 0) {
      const destructured = functions.join(', ');
      const functionTests = functions
        .map(
          (fn) => `test('${fn} esta exportada como funcion', () => {
  assert.equal(typeof ${fn}, 'function');
});`,
        )
        .join('\n\n');

      return `const test = require('node:test');
const assert = require('node:assert/strict');

const { ${destructured} } = require('./script.js');

${functionTests}
`;
    }

    return `const test = require('node:test');
const assert = require('node:assert/strict');

test('script.js carga correctamente', async () => {
  const mod = await import('./script.js');
  assert.ok(mod);
});
`;
  }

  private extractExportedFunctions(scriptCode: string): string[] {
    const result = new Set<string>();

    const moduleExportsMatch = scriptCode.match(
      /module\.exports\s*=\s*\{([\s\S]*?)\}/,
    );
    if (moduleExportsMatch?.[1]) {
      const names = moduleExportsMatch[1]
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => p.split(':')[0].trim())
        .filter((p) => /^[a-zA-Z_$][\w$]*$/.test(p));
      names.forEach((n) => result.add(n));
    }

    const exportsMatches = scriptCode.matchAll(
      /exports\.([a-zA-Z_$][\w$]*)\s*=/g,
    );
    for (const m of exportsMatches) {
      if (m[1]) result.add(m[1]);
    }

    return Array.from(result);
  }

  private async executeNodeTests(
    tempDir: string,
    contractIdStr: string,
  ): Promise<{
    output: string;
    passed: number;
    failed: number;
    coverage: number;
  }> {
    return new Promise((resolve) => {
      let output = '';
      let completed = false;

      const proc = spawn('node', ['--test', 'script.test.js'], {
        cwd: tempDir,
        shell: true,
      });

      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true;
          this.log(contractIdStr, '⏱️ TIMEOUT: ejecución detenida');
          proc.kill();
          resolve({ output, passed: 0, failed: 1, coverage: 0 });
        }
      }, 120000);

      proc.stdout.on('data', (data: Buffer) => {
        const line = data.toString();
        output += line;
        this.log(contractIdStr, line.trim());
      });

      proc.stderr.on('data', (data: Buffer) => {
        const line = data.toString();
        output += line;
        this.log(contractIdStr, `[ERR] ${line.trim()}`);
      });

      proc.on('close', () => {
        if (completed) return;
        completed = true;
        clearTimeout(timeout);

        const passMatch =
          output.match(/ℹ\s*pass\s*(\d+)/i) || output.match(/\bpass\s+(\d+)/i);
        const failMatch =
          output.match(/ℹ\s*fail\s*(\d+)/i) || output.match(/\bfail\s+(\d+)/i);

        const passed = passMatch ? parseInt(passMatch[1], 10) : 0;
        const failed = failMatch ? parseInt(failMatch[1], 10) : 0;

        const total = passed + failed;
        const coverage =
          total > 0 ? Math.round((passed / total) * 10000) / 100 : 0;

        this.log(
          contractIdStr,
          `📊 Parsed: passed=${passed}, failed=${failed}, coverage=${coverage}%`,
        );

        resolve({ output, passed, failed, coverage });
      });

      proc.on('error', (err) => {
        if (completed) return;
        completed = true;
        clearTimeout(timeout);
        output += `\n${err.message}`;
        resolve({ output, passed: 0, failed: 1, coverage: 0 });
      });
    });
  }

  private sendLog(contractIdStr: string, message: string): void {
    const subject = this.logsSubjects.get(contractIdStr);
    if (subject) {
      subject.next(message);
    }
  }

  getLogsSubject(contractId: string): Subject<string> | undefined {
    return this.logsSubjects.get(contractId);
  }

  getExecution(contractId: string): TestExecution | undefined {
    return this.testExecutions.get(contractId);
  }

  async getCoverageStatus(contractId: number): Promise<{
    status: 'in_progress' | 'completed' | 'not_found';
    message: string;
    coverage: number | null;
  }> {
    const execution = this.testExecutions.get(String(contractId));

    if (execution?.status === 'running' || execution?.status === 'pending') {
      return {
        status: 'in_progress',
        message: 'La ejecución de tests aún está en proceso',
        coverage: null,
      };
    }

    const contract = await this.contractRepository.findById(contractId);
    if (!contract) {
      return {
        status: 'not_found',
        message: 'Contrato no encontrado',
        coverage: null,
      };
    }

    if (contract.coverage === null || contract.coverage === undefined) {
      return {
        status: 'in_progress',
        message: 'El coverage aún no está disponible',
        coverage: null,
      };
    }

    return {
      status: 'completed',
      message: 'Coverage disponible',
      coverage: Number(contract.coverage),
    };
  }

  getAllExecutions(): Map<string, TestExecution> {
    return this.testExecutions;
  }
}
