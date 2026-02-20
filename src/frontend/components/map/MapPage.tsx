import React, { useEffect, useRef } from 'react';
import { Map, MapControls, useMap } from '@/components/ui/map';
import { UploadPanel } from './UploadPanel';
import { GeoJSONLayer } from './GeoJSONLayer';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { fetchLayers, fetchLayerGeoJSON, clearFocusLayer } from '@/store/geoSlice';
import type MapLibreGL from 'maplibre-gl';

// Layer colors to cycle through
const LAYER_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

function VisibleLayers() {
  const { map, isLoaded } = useMap();
  const dispatch = useAppDispatch();
  const { visibleLayerIds, layerGeoJSON, focusLayerId } = useAppSelector(
    (state) => state.geo
  );
  const fittedRef = useRef<Set<number>>(new Set());

  // Fetch GeoJSON for visible layers that haven't been loaded yet
  useEffect(() => {
    for (const id of visibleLayerIds) {
      if (!layerGeoJSON[id]) {
        dispatch(fetchLayerGeoJSON(id));
      }
    }
  }, [visibleLayerIds, layerGeoJSON, dispatch]);

  // Auto-fit bounds when a new layer becomes visible
  useEffect(() => {
    if (!isLoaded || !map) return;

    for (const id of visibleLayerIds) {
      const geojson = layerGeoJSON[id];
      if (geojson && !fittedRef.current.has(id) && geojson.features.length > 0) {
        fittedRef.current.add(id);
        fitBounds(map, geojson);
      }
    }
  }, [isLoaded, map, visibleLayerIds, layerGeoJSON]);

  // Handle focusLayer — fitBounds when a layer is clicked in the panel
  useEffect(() => {
    if (!isLoaded || !map || focusLayerId === null) return;

    const geojson = layerGeoJSON[focusLayerId];
    if (geojson && geojson.features.length > 0) {
      fitBounds(map, geojson);
      dispatch(clearFocusLayer());
    }
  }, [isLoaded, map, focusLayerId, layerGeoJSON, dispatch]);

  return (
    <>
      {visibleLayerIds.map((id, index) => {
        const geojson = layerGeoJSON[id];
        if (!geojson) return null;
        return (
          <GeoJSONLayer
            key={id}
            id={String(id)}
            data={geojson}
            color={LAYER_COLORS[index % LAYER_COLORS.length]}
          />
        );
      })}
    </>
  );
}

function fitBounds(map: MapLibreGL.Map, geojson: GeoJSON.FeatureCollection) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

  function processCoords(coords: number[]) {
    if (coords[0] < minLng) minLng = coords[0];
    if (coords[0] > maxLng) maxLng = coords[0];
    if (coords[1] < minLat) minLat = coords[1];
    if (coords[1] > maxLat) maxLat = coords[1];
  }

  function walkCoords(c: unknown): void {
    if (Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number') {
      processCoords(c as number[]);
    } else if (Array.isArray(c)) {
      for (const item of c) walkCoords(item);
    }
  }

  for (const feature of geojson.features) {
    if (feature.geometry && 'coordinates' in feature.geometry) {
      walkCoords(feature.geometry.coordinates);
    }
  }

  if (minLng !== Infinity) {
    map.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 50, maxZoom: 16, duration: 1000 }
    );
  }
}

export const MapPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { layers, focusLayerId } = useAppSelector((state) => state.geo);

  useEffect(() => {
    dispatch(fetchLayers());
  }, [dispatch]);

  // Update page title with contextual layer info
  useEffect(() => {
    const focusedLayer = focusLayerId !== null
      ? layers.find((l) => l.id === focusLayerId)
      : null;

    document.title = focusedLayer
      ? `${focusedLayer.name} - PipeAid GIS`
      : 'PipeAid GIS';

    return () => { document.title = 'PipeAid GIS'; };
  }, [focusLayerId, layers]);

  return (
    <div className="h-screen flex" data-testid="map-page">
      <UploadPanel />
      <div className="flex-1" data-testid="map-container">
        <Map center={[-98.58, 39.83]} zoom={3}>
          <MapControls showZoom showCompass showFullscreen />
          <VisibleLayers />
        </Map>
      </div>
    </div>
  );
};
