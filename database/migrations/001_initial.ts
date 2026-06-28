import * as SQLite from 'expo-sqlite';

/**
 * Начальная миграция - создание таблиц
 */
export const up = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // Таблица маркеров
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS markers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        title TEXT NOT NULL DEFAULT 'Маркер',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Таблица изображений
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS marker_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        marker_id INTEGER NOT NULL,
        uri TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE CASCADE
      );
    `);

    // Индексы
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_marker_images_marker_id 
      ON marker_images(marker_id);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_markers_created_at 
      ON markers(created_at);
    `);

    console.log('Миграция 001 выполнена успешно');
  } catch (error) {
    console.error('Ошибка миграции 001:', error);
    throw error;
  }
};

/**
 * Откат миграции
 */
export const down = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    await db.execAsync(`DROP TABLE IF EXISTS marker_images;`);
    await db.execAsync(`DROP TABLE IF EXISTS markers;`);
    console.log('Откат миграции 001 выполнен');
  } catch (error) {
    console.error(' Ошибка отката миграции 001:', error);
    throw error;
  }
};

export default { up, down };
