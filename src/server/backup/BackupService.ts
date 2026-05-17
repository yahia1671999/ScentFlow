import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, "../../..");
const DB_PATH = path.join(ROOT_DIR, "data.db");
const BACKUP_DIR = path.join(ROOT_DIR, "backups");

/**
 * Service for managing database backups and restores.
 */
export class BackupService {
  constructor() {
    this.ensureBackupDir();
  }

  private ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  /**
   * Returns information about the current database.
   */
  getDatabaseInfo() {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error("Database file not found");
    }

    const stats = fs.statSync(DB_PATH);
    return {
      databasePath: DB_PATH,
      databaseSize: stats.size, // in bytes
      lastModified: stats.mtime,
      backupFolderPath: BACKUP_DIR,
    };
  }

  /**
   * Creates a backup of the current database.
   */
  async createBackup() {
    this.ensureBackupDir();

    const timestamp = new Date().toISOString()
      .replace(/[:T]/g, "-")
      .slice(0, 16); // YYYY-MM-DD-HH-mm
    
    const backupFileName = `scentflow-backup-${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    try {
      // better-sqlite3 provides a backup method, but simple file copy also works for file-based sqlite
      // However, better-sqlite3's .backup() is safer as it handles concurrent access.
      await db.backup(backupPath);
      
      return {
        success: true,
        message: "Backup created successfully",
        backupPath: backupPath,
        fileName: backupFileName,
      };
    } catch (error: any) {
      console.error("Backup failed:", error);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  /**
   * Restores the database from a backup file.
   * WARNING: This replaces the current data.db.
   */
  async restoreFromBackup(backupPath: string) {
    if (!fs.existsSync(backupPath)) {
      // Check if it's just a filename in the backup dir
      const absolutePath = path.isAbsolute(backupPath) 
        ? backupPath 
        : path.join(BACKUP_DIR, backupPath);
      
      if (!fs.existsSync(absolutePath)) {
        throw new Error("Backup file not found");
      }
      backupPath = absolutePath;
    }

    try {
      // 1. Close current DB connection
      db.close();

      // 2. Perform the copy
      fs.copyFileSync(backupPath, DB_PATH);

      // Note: After restoring, the app will likely need a restart because the DB connection is closed.
      // In this environment, the process might stop or we might need to rely on the dev server restart.
      
      return {
        success: true,
        message: "Database restored successfully. Application might need a restart.",
      };
    } catch (error: any) {
      console.error("Restore failed:", error);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * Lists all available backups.
   */
  listBackups() {
    this.ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR);
    return files
      .filter(f => f.endsWith(".db"))
      .map(f => {
        const fullPath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(fullPath);
        return {
          fileName: f,
          path: fullPath,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const backupService = new BackupService();
