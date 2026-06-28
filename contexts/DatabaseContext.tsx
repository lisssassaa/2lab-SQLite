// contexts/DatabaseContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';
import { Marker, MarkerImage, CreateMarkerData, CreateImageData } from '../types';
import { 
  initDatabase, 
  getAllMarkers, 
  getMarkerById, 
  createMarker, 
  deleteMarker, 
  updateMarker,
  getMarkerImages, 
  addImage, 
  deleteImage,
  getMarkerWithImages 
} from '../database/schema';
import * as Operations from '../database/operations';

// Тип контекста
interface DatabaseContextType {
  // Данные
  markers: Marker[];
  currentMarker: Marker | null;
  currentImages: MarkerImage[];
  
  // Операции
  loadMarkers: () => Promise<void>;
  loadMarkerDetails: (markerId: number) => Promise<void>;
  addMarker: (data: CreateMarkerData) => Promise<number>;
  updateMarker: (id: number, data: Partial<CreateMarkerData>) => Promise<void>;
  deleteMarker: (id: number) => Promise<void>;
  addImage: (markerId: number, uri: string) => Promise<void>;
  deleteImage: (imageId: number) => Promise<void>;
  
  // Статусы
  isLoading: boolean;
  error: Error | null;
  
  // Утилиты
  clearError: () => void;
  resetCurrentMarker: () => void;
}

// Создание контекста
const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

// Провайдер контекста
export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [currentMarker, setCurrentMarker] = useState<Marker | null>(null);
  const [currentImages, setCurrentImages] = useState<MarkerImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Инициализация базы данных
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsLoading(true);
        const database = await initDatabase();
        setDb(database);
        
        // Загружаем маркеры после инициализации
        await loadMarkersInternal(database);
      } catch (error) {
        console.error('Ошибка инициализации:', error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  // Внутренняя загрузка маркеров
  const loadMarkersInternal = async (database: SQLite.SQLiteDatabase) => {
    try {
      const loadedMarkers = await Operations.getAllMarkers(database);
      setMarkers(loadedMarkers);
      setError(null);
    } catch (error) {
      console.error('Ошибка загрузки маркеров:', error);
      setError(error as Error);
    }
  };

  // Загрузка всех маркеров (публичный метод)
  const loadMarkers = async () => {
    if (!db) {
      setError(new Error('База данных не инициализирована'));
      return;
    }
    setIsLoading(true);
    try {
      await loadMarkersInternal(db);
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка деталей маркера
  const loadMarkerDetails = async (markerId: number) => {
    if (!db) {
      setError(new Error('База данных не инициализирована'));
      return;
    }
    setIsLoading(true);
    try {
      const { marker, images } = await Operations.getMarkerWithImages(db, markerId);
      setCurrentMarker(marker);
      setCurrentImages(images);
      setError(null);
    } catch (error) {
      console.error('Ошибка загрузки деталей маркера:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Добавление маркера
  const addMarker = async (data: CreateMarkerData): Promise<number> => {
    if (!db) {
      throw new Error('База данных не инициализирована');
    }
    setIsLoading(true);
    try {
      const id = await Operations.createMarker(db, data);
      await loadMarkersInternal(db); // Обновляем список
      setError(null);
      return id;
    } catch (error) {
      console.error('Ошибка добавления маркера:', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление маркера
  const updateMarker = async (id: number, data: Partial<CreateMarkerData>) => {
    if (!db) {
      throw new Error('База данных не инициализирована');
    }
    setIsLoading(true);
    try {
      await Operations.updateMarker(db, id, data);
      await loadMarkersInternal(db);
      
      // Обновляем текущий маркер если он загружен
      if (currentMarker && currentMarker.id === id) {
        const updated = await Operations.getMarkerById(db, id);
        setCurrentMarker(updated);
      }
      setError(null);
    } catch (error) {
      console.error('Ошибка обновления маркера:', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Удаление маркера
  const deleteMarker = async (id: number) => {
    if (!db) {
      throw new Error('База данных не инициализирована');
    }
    setIsLoading(true);
    try {
      await Operations.deleteMarker(db, id);
      await loadMarkersInternal(db);
      
      if (currentMarker && currentMarker.id === id) {
        setCurrentMarker(null);
        setCurrentImages([]);
      }
      setError(null);
    } catch (error) {
      console.error('Ошибка удаления маркера:', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Добавление изображения
  const addImage = async (markerId: number, uri: string) => {
    if (!db) {
      throw new Error('База данных не инициализирована');
    }
    setIsLoading(true);
    try {
      await Operations.addImage(db, { marker_id: markerId, uri });
      
      // Обновляем список изображений, если это текущий маркер
      if (currentMarker && currentMarker.id === markerId) {
        const images = await Operations.getMarkerImages(db, markerId);
        setCurrentImages(images);
      }
      setError(null);
    } catch (error) {
      console.error('Ошибка добавления изображения:', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Удаление изображения
  const deleteImage = async (imageId: number) => {
    if (!db) {
      throw new Error('База данных не инициализирована');
    }
    setIsLoading(true);
    try {
      await Operations.deleteImage(db, imageId);
      
      // Обновляем список изображений, если это текущий маркер
      if (currentMarker) {
        const images = await Operations.getMarkerImages(db, currentMarker.id);
        setCurrentImages(images);
      }
      setError(null);
    } catch (error) {
      console.error('Ошибка удаления изображения:', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Очистка ошибки
  const clearError = () => setError(null);

  // Сброс текущего маркера
  const resetCurrentMarker = () => {
    setCurrentMarker(null);
    setCurrentImages([]);
  };

  // Значение контекста
  const contextValue: DatabaseContextType = {
    markers,
    currentMarker,
    currentImages,
    loadMarkers,
    loadMarkerDetails,
    addMarker,
    updateMarker,
    deleteMarker,
    addImage,
    deleteImage,
    isLoading,
    error,
    clearError,
    resetCurrentMarker,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

// Хук для использования контекста
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase должен использоваться внутри DatabaseProvider');
  }
  return context;
};