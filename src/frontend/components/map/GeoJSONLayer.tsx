import { useEffect, useId, useRef } from 'react';
import MapLibreGL from 'maplibre-gl';
import { useMap } from '@/components/ui/map';

interface GeoJSONLayerProps {
  id?: string;
  data: GeoJSON.FeatureCollection;
  color?: string;
  opacity?: number;
  lineWidth?: number;
  pointRadius?: number;
}

const HIGHLIGHT_COLOR = '#facc15';
const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Priority-ordered candidate fields for the popup title bar.
// Matched case-insensitively against property keys.
const TITLE_FIELD_CANDIDATES = [
  'facilityid', 'facility_id',
  'assetid', 'asset_id',
  'compkey', 'comp_key',
  'mh_no', 'mhno', 'manhole_no',
  'pipe_no', 'pipeno',
  'tag', 'asset_tag',
  'label',
  'name',
  'id',
  'objectid', 'object_id',
  'fid',
  'globalid', 'global_id',
];

function findTitleField(properties: Record<string, unknown>): { key: string; value: string } | null {
  const keys = Object.keys(properties);
  for (const candidate of TITLE_FIELD_CANDIDATES) {
    const match = keys.find((k) => k.toLowerCase() === candidate);
    if (match) {
      const v = properties[match];
      if (v !== null && v !== undefined && v !== '' && v !== 'None') {
        return { key: match, value: String(v) };
      }
    }
  }
  return null;
}

function buildPopupHTML(properties: Record<string, unknown>, geomType?: string): string {
  const entries = Object.entries(properties).filter(
    ([, v]) => v !== null && v !== undefined && v !== '' && v !== 'None'
  );

  if (entries.length === 0) return '<div class="geo-popup-empty">No attributes</div>';

  const title = findTitleField(properties);

  // Build title bar
  let titleHTML = '';
  if (title) {
    const label = title.key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2');
    titleHTML = `<div class="geo-popup-title">
      <span class="geo-popup-title-value">${escapeHTML(title.value)}</span>
      <span class="geo-popup-title-label">${escapeHTML(label)}${geomType ? ' \u00B7 ' + geomType : ''}</span>
    </div>`;
  } else if (geomType) {
    titleHTML = `<div class="geo-popup-title">
      <span class="geo-popup-title-value">${geomType}</span>
    </div>`;
  }

  // Build property rows, excluding the title field
  const rows = entries
    .filter(([key]) => key !== title?.key)
    .map(([key, value]) => {
      const label = key
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2');
      const val = typeof value === 'number'
        ? value.toLocaleString()
        : String(value);
      return `<tr><td class="geo-popup-key">${escapeHTML(label)}</td><td class="geo-popup-val">${escapeHTML(val)}</td></tr>`;
    })
    .join('');

  return `${titleHTML}<div class="geo-popup"><table>${rows}</table></div>`;
}

export function GeoJSONLayer({
  id: propId,
  data,
  color = '#3b82f6',
  opacity = 0.7,
  lineWidth = 2,
  pointRadius = 6,
}: GeoJSONLayerProps) {
  const { map, isLoaded } = useMap();
  const autoId = useId();
  const id = propId ?? autoId;
  const sourceId = `geojson-source-${id}`;
  const fillLayerId = `geojson-fill-${id}`;
  const lineLayerId = `geojson-line-${id}`;
  const lineHitLayerId = `geojson-line-hit-${id}`;
  const pointLayerId = `geojson-point-${id}`;
  // Highlight layers (rendered via feature-state)
  const hlFillLayerId = `geojson-hl-fill-${id}`;
  const hlLineGlowLayerId = `geojson-hl-line-glow-${id}`;
  const hlLineLayerId = `geojson-hl-line-${id}`;
  const hlPointGlowLayerId = `geojson-hl-point-glow-${id}`;
  const hlPointLayerId = `geojson-hl-point-${id}`;

  const popupRef = useRef<MapLibreGL.Popup | null>(null);
  const selectedIdRef = useRef<number | null>(null);

  // Add source and layers
  useEffect(() => {
    if (!isLoaded || !map) return;

    map.addSource(sourceId, {
      type: 'geojson',
      data: EMPTY_FC,
      generateId: true, // auto-assign numeric IDs for feature-state
    });

    // --- Main layers ---

    map.addLayer({
      id: fillLayerId,
      type: 'fill',
      source: sourceId,
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': color,
        'fill-opacity': opacity * 0.3,
      },
    });

    map.addLayer({
      id: lineHitLayerId,
      type: 'line',
      source: sourceId,
      filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
      paint: { 'line-color': 'transparent', 'line-width': 16 },
      layout: { 'line-join': 'round', 'line-cap': 'round' },
    });

    map.addLayer({
      id: lineLayerId,
      type: 'line',
      source: sourceId,
      filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
      paint: {
        'line-color': color,
        'line-width': lineWidth,
        'line-opacity': opacity,
      },
      layout: { 'line-join': 'round', 'line-cap': 'round' },
    });

    map.addLayer({
      id: pointLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-color': color,
        'circle-radius': pointRadius,
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 2,
        'circle-opacity': opacity,
      },
    });

    // --- Highlight layers using feature-state ---
    // Use paint opacity expressions (not filters) to show only selected features.
    // ['case', ['boolean', ['feature-state', 'selected'], false], <visible>, 0]

    const hlOpacity = (val: number): MapLibreGL.ExpressionSpecification =>
      ['case', ['boolean', ['feature-state', 'selected'], false], val, 0];

    // Highlight polygon fill
    map.addLayer({
      id: hlFillLayerId,
      type: 'fill',
      source: sourceId,
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': HIGHLIGHT_COLOR,
        'fill-opacity': hlOpacity(0.4),
      },
    });

    // Highlight line glow
    map.addLayer({
      id: hlLineGlowLayerId,
      type: 'line',
      source: sourceId,
      filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
      paint: {
        'line-color': HIGHLIGHT_COLOR,
        'line-width': lineWidth + 10,
        'line-opacity': hlOpacity(0.3),
        'line-blur': 4,
      },
      layout: { 'line-join': 'round', 'line-cap': 'round' },
    });

    // Highlight line solid
    map.addLayer({
      id: hlLineLayerId,
      type: 'line',
      source: sourceId,
      filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
      paint: {
        'line-color': HIGHLIGHT_COLOR,
        'line-width': lineWidth + 3,
        'line-opacity': hlOpacity(1),
      },
      layout: { 'line-join': 'round', 'line-cap': 'round' },
    });

    // Highlight point glow
    map.addLayer({
      id: hlPointGlowLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-color': HIGHLIGHT_COLOR,
        'circle-radius': pointRadius + 10,
        'circle-opacity': hlOpacity(0.3),
        'circle-blur': 0.5,
      },
    });

    // Highlight point solid
    map.addLayer({
      id: hlPointLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-color': HIGHLIGHT_COLOR,
        'circle-radius': pointRadius + 3,
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 3,
        'circle-opacity': hlOpacity(1),
        'circle-stroke-opacity': hlOpacity(1),
      },
    });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      selectedIdRef.current = null;
      const allLayers = [
        hlPointLayerId, hlPointGlowLayerId,
        hlLineLayerId, hlLineGlowLayerId, hlFillLayerId,
        pointLayerId, lineLayerId, lineHitLayerId, fillLayerId,
      ];
      try {
        for (const lid of allLayers) {
          if (map.getLayer(lid)) map.removeLayer(lid);
        }
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  // Update data
  useEffect(() => {
    if (!isLoaded || !map) return;
    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource | undefined;
    if (source) source.setData(data);
  }, [isLoaded, map, data, sourceId]);

  // Update paint properties
  useEffect(() => {
    if (!isLoaded || !map) return;

    if (map.getLayer(fillLayerId)) {
      map.setPaintProperty(fillLayerId, 'fill-color', color);
      map.setPaintProperty(fillLayerId, 'fill-opacity', opacity * 0.3);
    }
    if (map.getLayer(lineLayerId)) {
      map.setPaintProperty(lineLayerId, 'line-color', color);
      map.setPaintProperty(lineLayerId, 'line-width', lineWidth);
      map.setPaintProperty(lineLayerId, 'line-opacity', opacity);
    }
    if (map.getLayer(pointLayerId)) {
      map.setPaintProperty(pointLayerId, 'circle-color', color);
      map.setPaintProperty(pointLayerId, 'circle-radius', pointRadius);
      map.setPaintProperty(pointLayerId, 'circle-opacity', opacity);
    }
    if (map.getLayer(hlLineGlowLayerId)) {
      map.setPaintProperty(hlLineGlowLayerId, 'line-width', lineWidth + 10);
    }
    if (map.getLayer(hlLineLayerId)) {
      map.setPaintProperty(hlLineLayerId, 'line-width', lineWidth + 3);
    }
    if (map.getLayer(hlPointGlowLayerId)) {
      map.setPaintProperty(hlPointGlowLayerId, 'circle-radius', pointRadius + 10);
    }
    if (map.getLayer(hlPointLayerId)) {
      map.setPaintProperty(hlPointLayerId, 'circle-radius', pointRadius + 3);
    }
  }, [isLoaded, map, fillLayerId, lineLayerId, pointLayerId, hlLineGlowLayerId, hlLineLayerId, hlPointGlowLayerId, hlPointLayerId, color, opacity, lineWidth, pointRadius]);

  // Click handlers for popups + highlight via feature-state
  useEffect(() => {
    if (!isLoaded || !map) return;

    const interactiveLayers = [pointLayerId, lineHitLayerId, fillLayerId];

    const clearSelection = () => {
      if (selectedIdRef.current !== null) {
        try {
          map.setFeatureState(
            { source: sourceId, id: selectedIdRef.current },
            { selected: false }
          );
        } catch {
          // ignore if source was removed
        }
        selectedIdRef.current = null;
      }
    };

    const handleClick = (e: MapLibreGL.MapMouseEvent & { features?: MapLibreGL.MapGeoJSONFeature[] }) => {
      // Prevent multiple GeoJSONLayer instances from each opening a popup
      // for the same click when features from different layers overlap.
      const oe = e.originalEvent as MouseEvent & { _geoHandled?: boolean };
      if (oe._geoHandled) return;
      oe._geoHandled = true;

      const features = e.features;
      if (!features || features.length === 0) return;

      const feature = features[0];
      const featureId = feature.id as number | undefined;
      const properties = feature.properties || {};
      const geomType = feature.geometry.type;
      const html = buildPopupHTML(properties as Record<string, unknown>, geomType);

      // Compute feature bounding box + best popup anchor
      let popupLngLat: MapLibreGL.LngLat;
      let featureBounds: MapLibreGL.LngLatBounds | null = null;

      if (feature.geometry.type === 'Point') {
        const coords = (feature.geometry as GeoJSON.Point).coordinates;
        popupLngLat = new MapLibreGL.LngLat(coords[0], coords[1]);
      } else {
        // For lines/polygons: compute bounds and anchor popup at the
        // top-center so the geometry stays visible below the popup.
        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
        const walkCoords = (c: unknown): void => {
          if (Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number') {
            const [lng, lat] = c as [number, number];
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          } else if (Array.isArray(c)) {
            for (const item of c) walkCoords(item);
          }
        };
        if ('coordinates' in feature.geometry) walkCoords(feature.geometry.coordinates);

        if (minLng !== Infinity) {
          featureBounds = new MapLibreGL.LngLatBounds(
            [minLng, minLat],
            [maxLng, maxLat]
          );
          // Anchor popup at top-center of the bounding box
          popupLngLat = new MapLibreGL.LngLat(
            (minLng + maxLng) / 2,
            maxLat
          );
        } else {
          popupLngLat = e.lngLat;
        }
      }

      // Remove existing popup FIRST — its close handler fires synchronously
      // and would clear the new selection if we set it beforehand.
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }

      // Clear any remaining selection (if popup was already gone)
      clearSelection();

      // Set new selection via feature-state
      if (featureId !== undefined) {
        map.setFeatureState(
          { source: sourceId, id: featureId },
          { selected: true }
        );
        selectedIdRef.current = featureId;
      }

      const popup = new MapLibreGL.Popup({
        closeButton: true,
        maxWidth: '320px',
        anchor: feature.geometry.type === 'Point' ? undefined : 'bottom',
        offset: feature.geometry.type === 'Point' ? pointRadius + 4 : 12,
      })
        .setLngLat(popupLngLat)
        .setHTML(html)
        .addTo(map);

      popup.on('close', clearSelection);
      popupRef.current = popup;

      // Fit map to show the full feature + popup
      if (featureBounds) {
        // For lines/polygons: fit to the feature bounds with extra
        // top padding so the popup above isn't clipped.
        map.fitBounds(featureBounds, {
          padding: { top: 200, bottom: 40, left: 40, right: 40 },
          maxZoom: Math.max(map.getZoom(), 14),
          duration: 600,
        });
      } else {
        // For points: ease so the popup is comfortably visible above
        map.easeTo({
          center: popupLngLat,
          offset: [0, 80], // shift the center down so popup has room above
          duration: 400,
        });
      }
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    for (const layerId of interactiveLayers) {
      map.on('click', layerId, handleClick);
      map.on('mouseenter', layerId, handleMouseEnter);
      map.on('mouseleave', layerId, handleMouseLeave);
    }

    return () => {
      for (const layerId of interactiveLayers) {
        map.off('click', layerId, handleClick);
        map.off('mouseenter', layerId, handleMouseEnter);
        map.off('mouseleave', layerId, handleMouseLeave);
      }
    };
  }, [isLoaded, map, sourceId, pointLayerId, lineHitLayerId, fillLayerId, pointRadius]);

  return null;
}
