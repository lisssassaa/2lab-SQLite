// types.ts
export interface Marker {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  created_at: string;
}

export interface MarkerImage {
  id: number;
  marker_id: number;
  uri: string;
  created_at: string;
}

export interface MarkerWithImages extends Marker {
  images: MarkerImage[];
}

export interface MapProps {
  markers: Marker[];
  onMarkerPress: (markerId: number) => void;
  onLongPress: (coordinate: { latitude: number; longitude: number }) => void;
}

export interface MarkerListProps {
  markers: Marker[];
  onMarkerPress: (markerId: number) => void;
  onMarkerDelete: (markerId: number) => void;
}

export interface ImageListProps {
  images: MarkerImage[];
  onDeleteImage: (imageId: number) => void;
  onAddImage: () => void;
}

export interface CreateMarkerData {
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
}

export interface CreateImageData {
  marker_id: number;
  uri: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
}