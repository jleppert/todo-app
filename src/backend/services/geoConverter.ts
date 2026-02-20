import gdal from 'gdal-async';

export interface ConvertedLayer {
  layerName: string;
  geojson: GeoJSON.FeatureCollection;
  featureCount: number;
}

export async function convertToGeoJSON(
  filePath: string,
  fileType: 'shapefile' | 'geodatabase'
): Promise<ConvertedLayer[]> {
  const dataset = await gdal.openAsync(filePath);
  const results: ConvertedLayer[] = [];

  const layerCount = dataset.layers.count();
  console.log(`[geoConverter] Opened "${filePath}" — ${layerCount} layer(s) found`);

  for (let i = 0; i < layerCount; i++) {
    const layer = dataset.layers.get(i);
    const layerName = layer.name;

    // Skip non-spatial layers (attribute-only tables in geodatabases)
    const geomType = layer.geomType;
    if (geomType === undefined || geomType === null || geomType === 0) {
      console.log(`[geoConverter]   Skipping non-spatial layer "${layerName}" (geomType=${geomType})`);
      continue;
    }

    // Set up coordinate transformation to WGS84 if needed
    const sourceSrs = layer.srs;
    const targetSrs = gdal.SpatialReference.fromEPSG(4326);
    let transform: gdal.CoordinateTransformation | null = null;

    if (sourceSrs) {
      try {
        transform = new gdal.CoordinateTransformation(sourceSrs, targetSrs);
      } catch {
        // If transformation fails, assume data is already in WGS84
      }
    }

    const features: GeoJSON.Feature[] = [];
    let feature = layer.features.first();

    // Cache field names once per layer (same for all features)
    const fieldNames = feature ? feature.fields.getNames() : [];

    while (feature) {
      try {
        const geometry = feature.getGeometry();
        if (geometry) {
          if (transform) {
            geometry.transform(transform);
          }

          const geojsonGeometry = JSON.parse(geometry.toJSON()) as GeoJSON.Geometry;
          const properties: Record<string, unknown> = {};

          for (let f = 0; f < fieldNames.length; f++) {
            properties[fieldNames[f]] = feature.fields.get(f);
          }

          features.push({
            type: 'Feature',
            geometry: geojsonGeometry,
            properties,
          });
        }
      } catch {
        // Skip features with unsupported geometry types (e.g. curved geometries)
      }

      feature = layer.features.next();
    }

    // Only include layers that have at least one feature
    if (features.length > 0) {
      console.log(`[geoConverter]   Layer "${layerName}": ${features.length} features`);
      results.push({
        layerName,
        geojson: {
          type: 'FeatureCollection',
          features,
        },
        featureCount: features.length,
      });
    } else {
      console.log(`[geoConverter]   Layer "${layerName}": 0 valid features, skipping`);
    }
  }

  dataset.close();
  return results;
}
