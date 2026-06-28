// app/marker/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useDatabase } from '../../contexts/DatabaseContext';
import ImageList from '../../components/ImageList';

export default function MarkerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const markerId = parseInt(id as string);

  const {
    currentMarker,
    currentImages,
    loadMarkerDetails,
    addImage,
    deleteImage,
    updateMarker,
    isLoading,
    error,
    clearError,
    resetCurrentMarker,
  } = useDatabase();

  const [isSaving, setIsSaving] = useState(false);

  // Загрузка при фокусе
  useFocusEffect(
    React.useCallback(() => {
      if (!isNaN(markerId)) {
        loadMarkerDetails(markerId);
      }
      return () => resetCurrentMarker();
    }, [markerId])
  );

  // Обработка ошибок
  useEffect(() => {
    if (error) {
      Alert.alert('Ошибка', error.message, [
        { text: 'OK', onPress: clearError },
      ]);
    }
  }, [error]);

  // Добавление изображения
  const handleAddImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Доступ запрещен',
          'Необходимо разрешение на доступ к галерее'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsSaving(true);
        await addImage(markerId, result.assets[0].uri);
        Alert.alert('Успех', 'Изображение добавлено');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить изображение');
    } finally {
      setIsSaving(false);
    }
  };

  // Удаление изображения
  const handleDeleteImage = async (imageId: number) => {
    try {
      setIsSaving(true);
      await deleteImage(imageId);
      Alert.alert('Успех', 'Изображение удалено');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось удалить изображение');
    } finally {
      setIsSaving(false);
    }
  };

  // Редактирование маркера
  const handleEditMarker = () => {
    Alert.prompt(
      'Редактировать маркер',
      'Введите новое название',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сохранить',
          onPress: async (title) => {
            if (title && title.trim()) {
              try {
                await updateMarker(markerId, { title: title.trim() });
                Alert.alert('Успех', 'Маркер обновлен');
              } catch (error) {
                Alert.alert('Ошибка', 'Не удалось обновить маркер');
              }
            }
          },
        },
      ],
      'plain-text',
      currentMarker?.title
    );
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  if (!currentMarker) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Маркер не найден</Text>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButtonText}>← Вернуться</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Детали маркера</Text>
        <TouchableOpacity onPress={handleEditMarker}>
          <Text style={styles.editButton}>☆</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.title}>{currentMarker.title}</Text>
          <Text style={styles.coordinates}>
            ★ {currentMarker.latitude.toFixed(6)}, {currentMarker.longitude.toFixed(6)}
          </Text>
          {currentMarker.description && (
            <Text style={styles.description}>{currentMarker.description}</Text>
          )}
          <Text style={styles.createdAt}>
            Создан: {new Date(currentMarker.created_at).toLocaleString('ru-RU')}
          </Text>
        </View>

        <View style={styles.imagesSection}>
          <ImageList
            images={currentImages}
            onDeleteImage={handleDeleteImage}
            onAddImage={handleAddImage}
          />
        </View>
      </ScrollView>

      {isSaving && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Сохранение...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  backButtonText: { fontSize: 16, color: '#007AFF' },
  editButton: { fontSize: 20, color: '#007AFF' },
  content: { flex: 1 },
  infoSection: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  coordinates: { fontSize: 16, color: '#666', marginBottom: 8 },
  description: { fontSize: 16, color: '#333', marginBottom: 8 },
  createdAt: { fontSize: 14, color: '#999' },
  imagesSection: { flex: 1, marginHorizontal: 16, marginBottom: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorText: { fontSize: 18, color: '#ff3b30', marginBottom: 20 },
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