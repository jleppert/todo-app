# PipeAid GIS - Map System

The map system provides a full-stack GIS file upload, conversion, and visualization pipeline. Users can upload shapefiles and file geodatabases, which are converted to GeoJSON, stored in Azure Blob Storage, and rendered on an interactive MapLibre GL map.

## Architecture

```
Upload (.zip / .gdb.zip)
  │
  ▼
Express + Multer (multipart upload)
  │
  ├── GDAL (gdal-async) → Convert to GeoJSON (WGS84)
  ├── Azure Blob Storage → Store original file
  └── SQLite (Prisma)   → Store GeoJSON + metadata
  │
  ▼
React + Redux → MapLibre GL JS (render on map)
```

## Supported Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| Shapefile | `.zip` | Zipped archive containing `.shp`, `.dbf`, `.prj`, `.shx`, etc. |
| File Geodatabase | `.gdb.zip` | Zipped ESRI File Geodatabase directory |

All uploads are automatically reprojected to WGS84 (EPSG:4326) for map display.

## API Endpoints

### `POST /api/geo/upload`

Upload and convert a GIS file. Accepts multipart form data.

**Form Fields:**
- `file` (required) — The `.zip` or `.gdb.zip` file (max 2GB)
- `name` (optional) — Custom layer name (defaults to filename)

**Response:** `201 Created`
```json
{
  "data": [
    {
      "id": 1,
      "name": "Layer Name",
      "fileName": "original.zip",
      "fileType": "shapefile",
      "blobUrl": "https://....blob.core.windows.net/...",
      "featureCount": 1234,
      "geojson": { "type": "FeatureCollection", "features": [...] },
      "createdAt": "2026-02-20T...",
      "updatedAt": "2026-02-20T..."
    }
  ]
}
```

Geodatabases with multiple spatial layers return multiple entries in the `data` array, each named `"{name} - {layerName}"`.

### `GET /api/geo/layers`

List all layers without GeoJSON (for performance).

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "name": "Layer Name",
      "fileName": "original.zip",
      "fileType": "shapefile",
      "blobUrl": "https://...",
      "featureCount": 1234,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### `GET /api/geo/layers/:id`

Get a single layer with full GeoJSON.

### `DELETE /api/geo/layers/:id`

Delete a layer from the database and its original file from Azure Blob Storage.

### `PUT /api/geo/layers/:id`

Replace a layer with a new file upload. Same form fields as `POST /api/geo/upload`.

## Database Schema

```prisma
model GeoLayer {
  id           Int      @id @default(autoincrement())
  name         String
  fileName     String   @map("file_name")
  fileType     String   @map("file_type")   // "shapefile" | "geodatabase"
  blobUrl      String   @map("blob_url")
  geojson      String                        // GeoJSON FeatureCollection as JSON string
  featureCount Int      @map("feature_count")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("geo_layers")
}
```

## Backend Services

### `src/backend/services/geoConverter.ts`

Uses `gdal-async` (Node.js bindings for GDAL) to:
- Open shapefiles and file geodatabases
- Iterate over spatial layers (skips non-spatial/attribute-only tables)
- Reproject coordinates to WGS84 (EPSG:4326)
- Convert each feature to GeoJSON
- Skip features with unsupported geometry types (e.g., curved geometries)
- Structured logging per layer (`[geoConverter]`)

### `src/backend/services/azureStorage.ts`

Azure Blob Storage client using `@azure/storage-blob`:
- `uploadBlob(blobName, buffer)` — Upload file to the configured container
- `deleteBlob(blobName)` — Delete a blob by name

### `src/backend/routes/geo.ts`

Express router with `multer` middleware for multipart uploads. Handles:
- Zip extraction (AdmZip)
- Nested `.gdb` directory detection (handles double-nested archives)
- GDAL conversion
- Azure upload
- Database persistence
- Structured logging (`[geo:upload]`, `[geo:replace]`, `[geo:delete]`)

Upload limit: 2GB. MulterError is handled with a proper 400 JSON response.

## Frontend Components

### `src/frontend/components/map/MapPage.tsx`

Main view — full-viewport map with a collapsible layer panel. The page title updates to "PipeAid GIS" by default, or "{Layer Name} - PipeAid GIS" when a layer is focused.

- Dispatches `fetchLayers()` on mount
- Contains `<VisibleLayers>` component inside `<Map>` that:
  - Fetches GeoJSON for visible layers on demand
  - Auto-fits map bounds when a new layer becomes visible
  - Responds to `focusLayerId` to fly to a layer when clicked in the panel

### `src/frontend/components/map/UploadPanel.tsx`

Collapsible sidebar with:
- **Search** — Algolia Autocomplete (`@algolia/autocomplete-js`) typeahead input that filters the layer tree in real-time by name, file type, or file name
- **Drag-and-drop upload zone** — Accepts `.zip` (shapefile) or `.gdb.zip` (geodatabase) files
- **Hierarchical layer tree** — Layers are grouped into collapsible folders based on the ` - ` delimiter in their names (e.g., "Sewer Export - ssManhole" appears as "ssManhole" inside a "Sewer Export" folder). Standalone layers (no delimiter) appear at the root level.
- **Layer controls** — Each layer has:
  - Visibility toggle (checkbox)
  - Click-to-focus (fits map to layer bounds)
  - File type badge (SHP / GDB)
  - Feature count
  - Replace and Delete buttons
- **Error display** with dismiss
- Folders auto-expand when search is active

### `src/frontend/components/map/GeoJSONLayer.tsx`

MapLibre layer component using the `useMap()` hook. Renders GeoJSON on the map with:

**Rendering layers:**
- **Polygons** — Semi-transparent fill + outline
- **LineStrings** — Styled lines with invisible 16px-wide hit-target layer for easier clicking
- **Points** — Circles (6px radius) with white stroke

Each layer gets a unique color from a 10-color palette.

**Feature interaction:**
- **Click popup** — Clicking any feature (point, line, or polygon) opens a popup showing all non-null properties as a key-value table. Keys are humanized (underscores to spaces, camelCase split). Numbers are locale-formatted.
- **Selection highlight** — Uses MapLibre's `feature-state` system (`generateId: true` on source, `setFeatureState` on click). Highlight layers filter on `['boolean', ['feature-state', 'selected'], false]` to render only the selected feature:
  - Points: yellow solid circle (+3px) with blurred glow ring (+10px, 30% opacity)
  - Lines: yellow solid line (+3px) with blurred glow (+10px, 30% opacity)
  - Polygons: yellow semi-transparent fill (40% opacity)
- Closing the popup clears the selection highlight

### `src/frontend/store/geoSlice.ts`

Redux Toolkit slice managing:
- `layers` — Layer metadata list
- `layerGeoJSON` — Map of `id -> FeatureCollection` (loaded on demand)
- `visibleLayerIds` — Which layers are rendered on the map
- `focusLayerId` — Triggers fitBounds when set
- `uploading` / `loading` / `error` states

Async thunks: `fetchLayers`, `fetchLayerGeoJSON`, `uploadLayer`, `deleteLayer`, `replaceLayer`

Actions: `toggleLayerVisibility`, `focusLayer`, `clearFocusLayer`, `clearGeoError`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AZURE_STORAGE_ACCOUNT_NAME` | Azure Storage account name |
| `AZURE_STORAGE_ACCOUNT_KEY` | Azure Storage account key |
| `AZURE_STORAGE_CONTAINER_NAME` | Blob container name (e.g., `geo-source-data`) |

## File Structure

```
src/
├── backend/
│   ├── routes/
│   │   └── geo.ts                 # GIS upload/CRUD endpoints
│   └── services/
│       ├── azureStorage.ts        # Azure Blob Storage client
│       └── geoConverter.ts        # GDAL -> GeoJSON conversion
├── frontend/
│   ├── components/
│   │   └── map/
│   │       ├── MapPage.tsx        # Main map view
│   │       ├── UploadPanel.tsx    # Layer search, tree, upload sidebar
│   │       └── GeoJSONLayer.tsx   # MapLibre GeoJSON renderer + popups + highlight
│   ├── store/
│   │   └── geoSlice.ts           # Redux state for GIS layers
│   └── types/
│       └── index.ts              # GeoLayer, GeoLayerWithGeoJSON types
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `gdal-async` | GDAL bindings for shapefile/geodatabase conversion |
| `@azure/storage-blob` | Azure Blob Storage SDK |
| `multer` | Express multipart file upload middleware |
| `adm-zip` | Zip extraction for uploaded archives |
| `maplibre-gl` | Map rendering (WebGL) |
| `@algolia/autocomplete-js` | Typeahead search for layer filtering |
