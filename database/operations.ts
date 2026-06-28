// database/operations.ts
import * as SQLite from 'expo-sqlite';
import { Marker, MarkerImage, CreateMarkerData, CreateImageData } from '../types';

// Получение всех маркеров
export const getAllMarkers = async (db: SQLite.SQLiteDatabase): Promise<Marker[]> => {
  try {
    const result = await db.getAllAsync<Marker>(
      'SELECT * FROM markers ORDER BY created_at DESC'
    );
    return result || [];
  } catch (error) {
    console.error('Ошибка получения маркеров:', error);
    throw error;
  }
};

// Получение маркера по ID
export const getMarkerById = async (
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<Marker | null> => {
  try {
    const result = await db.getFirstAsync<Marker>(
      'SELECT * FROM markers WHERE id = ?',
      [id]
    );
    return result || null;
  } catch (error) {
    console.error(`Ошибка получения маркера ${id}:`, error);
    throw error;
  }
};

// Создание маркера
export const createMarker = async (
  db: SQLite.SQLiteDatabase,
  data: CreateMarkerData
): Promise<number> => {
  try {
    const result = await db.runAsync(
      `INSERT INTO markers (latitude, longitude, title, description) 
       VALUES (?, ?, ?, ?)`,
      [data.latitude, data.longitude, data.title, data.description || null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Ошибка создания маркера:', error);
    throw error;
  }
};

// Удаление маркера (каскадное удаление изображений)
export const deleteMarker = async (
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> => {
  try {
    // Используем транзакцию для атомарности
    await db.execAsync('BEGIN TRANSACTION;');
    
    try {
      // Удаляем изображения
      await db.runAsync('DELETE FROM marker_images WHERE marker_id = ?', [id]);
      
      // Удаляем маркер
      await db.runAsync('DELETE FROM markers WHERE id = ?', [id]);
      
      await db.execAsync('COMMIT;');
    } catch (error) {
      await db.execAsync('ROLLBACK;');
      throw error;
    }
  } catch (error) {
    console.error(`Ошибка удаления маркера ${id}:`, error);
    throw error;
  }
};

// Обновление маркера
export const updateMarker = async (
  db: SQLite.SQLiteDatabase,
  id: number,
  data: Partial<CreateMarkerData>
): Promise<void> => {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.latitude !== undefined) {
      updates.push('latitude = ?');
      values.push(data.latitude);
    }
    if (data.longitude !== undefined) {
      updates.push('longitude = ?');
      values.push(data.longitude);
    }
    
    if (updates.length === 0) return;
    
    values.push(id);
    const query = `UPDATE markers SET ${updates.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  } catch (error) {
    console.error(`Ошибка обновления маркера ${id}:`, error);
    throw error;
  }
};

// Получение изображений маркера
export const getMarkerImages = async (
  db: SQLite.SQLiteDatabase,
  markerId: number
): Promise<MarkerImage[]> => {
  try {
    const result = await db.getAllAsync<MarkerImage>(
      'SELECT * FROM marker_images WHERE marker_id = ? ORDER BY created_at DESC',
      [markerId]
    );
    return result || [];
  } catch (error) {
    console.error(`Ошибка получения изображений для маркера ${markerId}:`, error);
    throw error;
  }
};

// Добавление изображения
export const addImage = async (
  db: SQLite.SQLiteDatabase,
  data: CreateImageData
): Promise<number> => {
  try {
    const result = await db.runAsync(
      'INSERT INTO marker_images (marker_id, uri) VALUES (?, ?)',
      [data.marker_id, data.uri]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Ошибка добавления изображения:', error);
    throw error;
  }
};

// Удаление изображения
export const deleteImage = async (
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM marker_images WHERE id = ?', [id]);
  } catch (error) {
    console.error(`Ошибка удаления изображения ${id}:`, error);
    throw error;
  }
};

// Получение маркера с изображениями
export const getMarkerWithImages = async (
  db: SQLite.SQLiteDatabase,
  markerId: number
): Promise<{ marker: Marker | null; images: MarkerImage[] }> => {
  try {
    const marker = await getMarkerById(db, markerId);
    const images = await getMarkerImages(db, markerId);
    return { marker, images };
  } catch (error) {
    console.error(`Ошибка получения маркера ${markerId} с изображениями:`, error);
    throw error;
  }
};