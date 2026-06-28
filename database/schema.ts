// database/schema.ts
import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'markers.db';
export const DATABASE_VERSION = 2;

// Создание таблиц
export const createTables = (db: SQLite.SQLiteDatabase) => {
  // Таблица маркеров
  db.execSync(`
    CREATE TABLE IF NOT EXISTS markers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Таблица изображений
  db.execSync(`
    CREATE TABLE IF NOT EXISTS marker_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marker_id INTEGER NOT NULL,
      uri TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE CASCADE
    );
  `);

  // Индексы для улучшения производительности
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_marker_images_marker_id ON marker_images(marker_id);
    CREATE INDEX IF NOT EXISTS idx_markers_created_at ON markers(created_at);
  `);
};

// Инициализация базы данных
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  try {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    
    // Создаем таблицы
    createTables(db);
    
    // Проверяем версию базы данных
    await checkDatabaseVersion(db);
    
    return db;
  } catch (error) {
    console.error('Ошибка инициализации базы данных:', error);
    throw error;
  }
};

// Проверка версии базы данных
const checkDatabaseVersion = async (db: SQLite.SQLiteDatabase) => {
  try {
    // Проверяем, существует ли таблица с версией
    const result = await db.getAllAsync(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='db_version'`
    );
    
    if (result.length === 0) {
      // Создаем таблицу версий
      await db.execAsync(`
        CREATE TABLE db_version (
          version INTEGER PRIMARY KEY,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO db_version (version) VALUES (${DATABASE_VERSION});
      `);
    } else {
      // Проверяем текущую версию
      const versionResult = await db.getFirstAsync<{ version: number }>(
        'SELECT version FROM db_version ORDER BY updated_at DESC LIMIT 1'
      );
      
      if (versionResult && versionResult.version < DATABASE_VERSION) {
        // Выполняем миграции
        await runMigrations(db, versionResult.version);
        
        // Обновляем версию
        await db.execAsync(`
          UPDATE db_version 
          SET version = ${DATABASE_VERSION}, updated_at = CURRENT_TIMESTAMP 
          WHERE version = ${versionResult.version}
        `);
      }
    }
  } catch (error) {
    console.error('Ошибка проверки версии базы данных:', error);
    throw error;
  }
};

// Миграции
const runMigrations = async (db: SQLite.SQLiteDatabase, currentVersion: number) => {
  console.log(`Запуск миграций с версии ${currentVersion} до ${DATABASE_VERSION}`);
  
  // Пример миграции: добавление поля title в markers
  if (currentVersion < 2) {
    await db.execAsync(`
      ALTER TABLE markers ADD COLUMN title TEXT DEFAULT 'Маркер';
      ALTER TABLE markers ADD COLUMN description TEXT;
    `);
    console.log('Миграция до версии 2 выполнена');
  }
};