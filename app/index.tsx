// app/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDatabase } from '../contexts/DatabaseContext';
import Map from '../components/Map';
import MarkerList from '../components/MarkerList';

export default function HomeScreen() {
  const router = useRouter();
  const {
    markers,
    loadMarkers,
    addMarker,
    deleteMarker,
    isLoading,
    error,
    clearError,
  } = useDatabase();

  const [isCreating, setIsCreating] = useState(false);

  // Загрузка маркеров при старте
  useEffect(() => {
    loadMarkers();
  }, []);

  // Обработка ошибок
  useEffect(() => {
    if (error) {
      Alert.alert('Ошибка', error.message, [
        { text: 'OK', onPress: clearError },
      ]);
    }
  }, [error]);

  // Добавление маркера долгим нажатием
  const handleLongPress = (coordinate: { latitude: number; longitude: number }) => {
    Alert.prompt(
      'Новый маркер',
      'Введите название маркера',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Создать',
          onPress: async (title) => {
            if (title && title.trim()) {
              await createMarker(coordinate, title.trim());
            } else {
              Alert.alert('Ошибка', 'Название не может быть пустым');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const createMarker = async (
    coordinate: { latitude: number; longitude: number },
    title: string
  ) => {
    setIsCreating(true);
    try {
      await addMarker({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        title: title,
        description: '',
      });
      Alert.alert('Успех', 'Маркер создан');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать маркер');
    } finally {
      setIsCreating(false);
    }
  };

  const handleMarkerPress = (markerId: number) => {
    router.push(`/marker/${markerId}`);
  };

  const handleMarkerDelete = async (markerId: number) => {
    try {
      await deleteMarker(markerId);
      Alert.alert('Успех', 'Маркер удален');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось удалить маркер');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка данных...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <Map
          markers={markers}
          onMarkerPress={handleMarkerPress}
          onLongPress={handleLongPress}
        />
      </View>

      <View style={styles.listContainer}>
        <MarkerList
          markers={markers}
          onMarkerPress={handleMarkerPress}
          onMarkerDelete={handleMarkerDelete}
        />
      </View>

      {isCreating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Создание маркера...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  mapContainer: { height: '50%' },
  listContainer: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});