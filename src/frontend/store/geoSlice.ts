import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { GeoLayer, GeoLayerWithGeoJSON } from '../types';

export interface GeoState {
  layers: GeoLayer[];
  layerGeoJSON: Record<number, GeoJSON.FeatureCollection>;
  visibleLayerIds: number[];
  focusLayerId: number | null;
  loading: boolean;
  uploading: boolean;
  error: string | null;
}

const initialState: GeoState = {
  layers: [],
  layerGeoJSON: {},
  visibleLayerIds: [],
  focusLayerId: null,
  loading: false,
  uploading: false,
  error: null,
};

export const fetchLayers = createAsyncThunk(
  'geo/fetchLayers',
  async () => {
    const res = await fetch('/api/geo/layers');
    if (!res.ok) throw new Error('Failed to fetch layers');
    const json = await res.json();
    return json.data as GeoLayer[];
  }
);

export const fetchLayerGeoJSON = createAsyncThunk(
  'geo/fetchLayerGeoJSON',
  async (id: number) => {
    const res = await fetch(`/api/geo/layers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch layer GeoJSON');
    const json = await res.json();
    return json.data as GeoLayerWithGeoJSON;
  }
);

export const uploadLayer = createAsyncThunk(
  'geo/uploadLayer',
  async ({ file, name }: { file: File; name?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);

    const res = await fetch('/api/geo/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.error?.message || 'Upload failed');
    }

    const json = await res.json();
    return json.data as GeoLayerWithGeoJSON[];
  }
);

export const deleteLayer = createAsyncThunk(
  'geo/deleteLayer',
  async (id: number) => {
    const res = await fetch(`/api/geo/layers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete layer');
    return id;
  }
);

export const replaceLayer = createAsyncThunk(
  'geo/replaceLayer',
  async ({ id, file, name }: { id: number; file: File; name?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);

    const res = await fetch(`/api/geo/layers/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.error?.message || 'Replace failed');
    }

    const json = await res.json();
    return json.data as GeoLayerWithGeoJSON;
  }
);

const geoSlice = createSlice({
  name: 'geo',
  initialState,
  reducers: {
    toggleLayerVisibility(state, action: PayloadAction<number>) {
      const id = action.payload;
      const idx = state.visibleLayerIds.indexOf(id);
      if (idx >= 0) {
        state.visibleLayerIds.splice(idx, 1);
      } else {
        state.visibleLayerIds.push(id);
      }
    },
    focusLayer(state, action: PayloadAction<number>) {
      const id = action.payload;
      state.focusLayerId = id;
      // Ensure the layer is visible
      if (!state.visibleLayerIds.includes(id)) {
        state.visibleLayerIds.push(id);
      }
    },
    clearFocusLayer(state) {
      state.focusLayerId = null;
    },
    clearGeoError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchLayers
      .addCase(fetchLayers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLayers.fulfilled, (state, action) => {
        state.loading = false;
        state.layers = action.payload;
      })
      .addCase(fetchLayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch layers';
      })
      // fetchLayerGeoJSON
      .addCase(fetchLayerGeoJSON.fulfilled, (state, action) => {
        const layer = action.payload;
        state.layerGeoJSON[layer.id] = layer.geojson;
      })
      // uploadLayer
      .addCase(uploadLayer.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadLayer.fulfilled, (state, action) => {
        state.uploading = false;
        for (const layer of action.payload) {
          state.layers.unshift(layer);
          state.layerGeoJSON[layer.id] = layer.geojson;
          state.visibleLayerIds.push(layer.id);
        }
      })
      .addCase(uploadLayer.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.error.message || 'Upload failed';
      })
      // deleteLayer
      .addCase(deleteLayer.fulfilled, (state, action) => {
        const id = action.payload;
        state.layers = state.layers.filter((l) => l.id !== id);
        delete state.layerGeoJSON[id];
        state.visibleLayerIds = state.visibleLayerIds.filter((v) => v !== id);
      })
      // replaceLayer
      .addCase(replaceLayer.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(replaceLayer.fulfilled, (state, action) => {
        state.uploading = false;
        const updated = action.payload;
        const idx = state.layers.findIndex((l) => l.id === updated.id);
        if (idx >= 0) {
          state.layers[idx] = updated;
        }
        state.layerGeoJSON[updated.id] = updated.geojson;
      })
      .addCase(replaceLayer.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.error.message || 'Replace failed';
      });
  },
});

export const { toggleLayerVisibility, focusLayer, clearFocusLayer, clearGeoError } = geoSlice.actions;
export default geoSlice.reducer;
