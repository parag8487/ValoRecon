import fs from 'fs';
import path from 'path';
import { getConfig } from '../config';
import { createLogger } from '../logger';

const logger = createLogger('stateStore');

export class StateStore {
  private baseDir: string;

  constructor(customDir?: string) {
    this.baseDir = customDir || getConfig().dataDir;
    this.ensureDirs();
    this.migrateLegacyData();
  }

  private ensureDirs() {
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
      const reportsDir = path.join(this.baseDir, 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
    } catch (err: any) {
      logger.warn('Failed to ensure state directories', err.message);
    }
  }

  private migrateLegacyData() {
    // If legacy server/data directory exists and has files not in baseDir, migrate them
    try {
      const legacyDir = path.resolve(__dirname, '../../data');
      if (fs.existsSync(legacyDir) && legacyDir !== this.baseDir) {
        const files = fs.readdirSync(legacyDir);
        for (const file of files) {
          const src = path.join(legacyDir, file);
          const dest = path.join(this.baseDir, file);
          if (!fs.existsSync(dest) && fs.statSync(src).isFile()) {
            fs.copyFileSync(src, dest);
            logger.info('Migrated legacy file', `Copied ${file} to ${this.baseDir}`);
          }
        }
      }
    } catch (err: any) {
      logger.warn('Legacy migration notice', err.message);
    }
  }

  public readJson<T>(filename: string, fallback: T): T {
    const filePath = path.join(this.baseDir, filename);
    if (!fs.existsSync(filePath)) return fallback;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) as T;
    } catch (err: any) {
      logger.warn('Failed to read json state file', `File ${filename}: ${err.message}`);
      return fallback;
    }
  }

  public writeJsonAtomic<T>(filename: string, data: T): void {
    const filePath = path.join(this.baseDir, filename);
    const tmpPath = `${filePath}.${Date.now()}.tmp`;
    try {
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmpPath, filePath);
    } catch (err: any) {
      logger.error('Failed to write atomic json', `File ${filename}: ${err.message}`);
      if (fs.existsSync(tmpPath)) {
        try { fs.unlinkSync(tmpPath); } catch {}
      }
    }
  }

  public appendJsonLine(filename: string, data: any): void {
    const filePath = path.join(this.baseDir, filename);
    try {
      fs.appendFileSync(filePath, JSON.stringify(data) + '\n', 'utf8');
    } catch (err: any) {
      logger.error('Failed to append json line', `File ${filename}: ${err.message}`);
    }
  }

  public saveReport(matchId: string, report: any): void {
    const reportsDir = path.join(this.baseDir, 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    
    const safeMatchId = matchId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const reportPath = path.join(reportsDir, `${safeMatchId}.json`);
    const tmpPath = `${reportPath}.${Date.now()}.tmp`;
    
    try {
      fs.writeFileSync(tmpPath, JSON.stringify(report, null, 2), 'utf8');
      fs.renameSync(tmpPath, reportPath);
      this.enforceReportRetention(reportsDir, 50);
    } catch (err: any) {
      logger.error('Failed to save report', err.message);
      if (fs.existsSync(tmpPath)) {
        try { fs.unlinkSync(tmpPath); } catch {}
      }
    }
  }

  public getReport(matchId: string): any | null {
    const safeMatchId = matchId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const reportPath = path.join(this.baseDir, 'reports', `${safeMatchId}.json`);
    if (!fs.existsSync(reportPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    } catch {
      return null;
    }
  }

  private enforceReportRetention(reportsDir: string, maxReports = 50): void {
    try {
      const files = fs.readdirSync(reportsDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => ({
          name: f,
          path: path.join(reportsDir, f),
          time: fs.statSync(path.join(reportsDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > maxReports) {
        const toDelete = files.slice(maxReports);
        for (const file of toDelete) {
          fs.unlinkSync(file.path);
        }
        logger.info('Cleaned up old reports', `Purged ${toDelete.length} reports beyond retention cap`);
      }
    } catch (err: any) {
      logger.warn('Report retention enforcement failed', err.message);
    }
  }
}

export const defaultStateStore = new StateStore();
