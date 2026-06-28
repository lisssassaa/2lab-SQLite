// components/MarkerList.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Marker, MarkerListProps } from '../types';

const MarkerList: React.FC<MarkerListProps> = ({
  markers,
  onMarkerPress,
  onMarkerDelete,
}) => {
  const handleDelete = (marker: Marker) => {
    Alert.alert(
      'Удалить маркер',
      `Вы уверены, что хотите удалить маркер "${marker.title}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => onMarkerDelete(marker.id),
        },
      ]
    );
  };

  const renderMarkerItem = ({ item }: { item: Marker }) => (
    <TouchableOpacity
      style={styles.markerItem}
      onPress={() => onMarkerPress(item.id)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.markerInfo}>
        <Text style={styles.markerTitle}>{item.title}</Text>
        <Text style={styles.markerSubtitle}>
          ★ {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </Text>
        <Text style={styles.markerDate}>
          {new Date(item.created_at).toLocaleDateString('ru-RU')}
        </Text>
      </View>
      <View style={styles.markerActions}>
        <Text style={styles.markerIcon}>★</Text>
      </View>
    </TouchableOpacity>
  );

  if (markers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Нет маркеров</Text>
        <Text style={styles.emptySubtext}>
          Нажмите и удерживайте на карте, чтобы добавить маркер
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={markers}
        renderItem={renderMarkerItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContent: { padding: 16 },
  markerItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  markerInfo: { flex: 1 },
  markerTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  markerSubtitle: { fontSize: 14, color: '#666' },
  markerDate: { fontSize: 12, color: '#999', marginTop: 4 },
  markerActions: { marginLeft: 12 },
  markerIcon: { fontSize: 24 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
});

export default MarkerList;