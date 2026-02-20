import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { autocomplete } from '@algolia/autocomplete-js';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  uploadLayer,
  deleteLayer,
  replaceLayer,
  toggleLayerVisibility,
  focusLayer,
  clearGeoError,
} from '@/store/geoSlice';
import type { GeoLayer } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  FileUp,
  Layers,
  AlertCircle,
  FolderOpen,
  FolderClosed,
} from 'lucide-react';

// --- Tree data structure ---

interface TreeFolder {
  name: string;
  layers: GeoLayer[];
  leafNames: Map<number, string>; // layer id → display name within folder
}

interface LayerTree {
  folders: TreeFolder[];
  rootLayers: GeoLayer[];
}

function buildLayerTree(layers: GeoLayer[]): LayerTree {
  const folderMap = new Map<string, TreeFolder>();
  const rootLayers: GeoLayer[] = [];

  for (const layer of layers) {
    const sepIdx = layer.name.indexOf(' - ');
    if (sepIdx !== -1) {
      const folderName = layer.name.substring(0, sepIdx);
      const leafName = layer.name.substring(sepIdx + 3);
      let folder = folderMap.get(folderName);
      if (!folder) {
        folder = { name: folderName, layers: [], leafNames: new Map() };
        folderMap.set(folderName, folder);
      }
      folder.layers.push(layer);
      folder.leafNames.set(layer.id, leafName);
    } else {
      rootLayers.push(layer);
    }
  }

  const folders = Array.from(folderMap.values());
  return { folders, rootLayers };
}

// --- Autocomplete search ---
// Uses Algolia Autocomplete purely as a styled search input.
// The dropdown panel is hidden via CSS; we use onStateChange
// to feed the query into React state for filtering the layer list below.

interface LayerSearchProps {
  onQueryChange: (query: string) => void;
}

function LayerSearch({ onQueryChange }: LayerSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onQueryChangeRef = useRef(onQueryChange);
  onQueryChangeRef.current = onQueryChange;

  useEffect(() => {
    if (!containerRef.current) return;

    let search: { destroy: () => void } | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      search = (autocomplete as any)({
        container: containerRef.current,
        placeholder: 'Search layers...',
        detachedMediaQuery: 'none',
        onStateChange({ state }: { state: { query: string } }) {
          onQueryChangeRef.current(state.query);
        },
        getSources() {
          return [];
        },
      });
    } catch (err) {
      console.error('[LayerSearch] autocomplete init failed:', err);
    }

    return () => {
      search?.destroy();
    };
  }, []);

  return <div ref={containerRef} className="layer-search" data-testid="layer-search" />;
}

// --- Layer item (leaf node) ---

interface LayerItemProps {
  layer: GeoLayer;
  displayName: string;
  isVisible: boolean;
  uploading: boolean;
  indent: number;
  onToggleVisibility: () => void;
  onFocus: () => void;
  onReplace: () => void;
  onDelete: () => void;
}

function LayerItem({
  layer,
  displayName,
  isVisible,
  uploading,
  indent,
  onToggleVisibility,
  onFocus,
  onReplace,
  onDelete,
}: LayerItemProps) {
  return (
    <div
      className="py-1.5 pr-2"
      style={{ paddingLeft: `${indent * 16 + 8}px` }}
      data-testid={`layer-item-${layer.id}`}
    >
      <div className="flex items-start gap-1.5">
        <Checkbox
          checked={isVisible}
          onCheckedChange={onToggleVisibility}
          className="mt-0.5 size-3.5"
          aria-label={`Toggle ${layer.name} visibility`}
        />
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={onFocus}
        >
          <p className="text-xs font-medium truncate hover:text-primary transition-colors">
            {displayName}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Badge variant="secondary" className="text-[9px] px-1 py-0 leading-tight">
              {layer.fileType === 'geodatabase' ? 'GDB' : 'SHP'}
            </Badge>
            <span className="text-[9px] text-muted-foreground">
              {layer.featureCount.toLocaleString()} features
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-0.5 mt-1" style={{ paddingLeft: `${20}px` }}>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[10px]"
          onClick={onReplace}
          disabled={uploading}
        >
          <RefreshCw className="size-2.5 mr-0.5" />
          Replace
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[10px] text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-2.5 mr-0.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}

// --- Folder node ---

interface FolderNodeProps {
  folder: TreeFolder;
  visibleLayerIds: number[];
  uploading: boolean;
  defaultOpen: boolean;
  dispatch: ReturnType<typeof useAppDispatch>;
  onReplace: (id: number) => void;
}

function FolderNode({ folder, visibleLayerIds, uploading, defaultOpen, dispatch, onReplace }: FolderNodeProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div data-testid={`folder-${folder.name}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-2 py-1.5 text-left hover:bg-accent/50 transition-colors"
      >
        {open ? (
          <ChevronDown className="size-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
        )}
        {open ? (
          <FolderOpen className="size-3.5 text-muted-foreground shrink-0" />
        ) : (
          <FolderClosed className="size-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="text-xs font-semibold truncate flex-1">{folder.name}</span>
        <span className="text-[9px] text-muted-foreground shrink-0">
          {folder.layers.length}
        </span>
      </button>
      {open && (
        <div>
          {folder.layers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              displayName={folder.leafNames.get(layer.id) || layer.name}
              isVisible={visibleLayerIds.includes(layer.id)}
              uploading={uploading}
              indent={2}
              onToggleVisibility={() => dispatch(toggleLayerVisibility(layer.id))}
              onFocus={() => dispatch(focusLayer(layer.id))}
              onReplace={() => onReplace(layer.id)}
              onDelete={() => dispatch(deleteLayer(layer.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main panel ---

export function UploadPanel() {
  const dispatch = useAppDispatch();
  const { layers, visibleLayerIds, uploading, error } = useAppSelector(
    (state) => state.geo
  );
  const [collapsed, setCollapsed] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingId, setReplacingId] = useState<number | null>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        dispatch(uploadLayer({ file: files[i] }));
      }
    },
    [dispatch]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleReplace = useCallback(
    (id: number) => {
      setReplacingId(id);
      replaceInputRef.current?.click();
    },
    []
  );

  const handleReplaceFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && replacingId !== null) {
        dispatch(replaceLayer({ id: replacingId, file }));
      }
      setReplacingId(null);
      e.target.value = '';
    },
    [dispatch, replacingId]
  );

  // Filter layers based on search query
  const filteredLayers = useMemo(() => {
    if (!searchQuery) return layers;
    const q = searchQuery.toLowerCase();
    return layers.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.fileType.toLowerCase().includes(q) ||
        l.fileName.toLowerCase().includes(q)
    );
  }, [layers, searchQuery]);

  // Build tree from filtered layers
  const tree = useMemo(() => buildLayerTree(filteredLayers), [filteredLayers]);

  // When searching, auto-expand all folders
  const foldersDefaultOpen = searchQuery.length > 0;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md border bg-background px-2 py-1.5 text-sm shadow-sm hover:bg-accent transition-colors"
        data-testid="expand-panel-btn"
      >
        <Layers className="size-4" />
        <ChevronRight className="size-3" />
      </button>
    );
  }

  return (
    <div
      className="w-72 border-r bg-background flex flex-col h-full"
      data-testid="upload-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h2 className="text-sm font-semibold flex items-center gap-1.5">
          <Layers className="size-4" />
          Layers
        </h2>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded p-1 hover:bg-accent transition-colors"
          aria-label="Collapse panel"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>

      {/* Drop zone */}
      <div className="p-3">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          data-testid="drop-zone"
        >
          {uploading ? (
            <Loader2 className="size-6 text-muted-foreground animate-spin" />
          ) : (
            <FileUp className="size-6 text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="text-xs font-medium">
              {uploading ? 'Uploading...' : 'Drop files here'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              .zip (Shapefile) or .gdb.zip
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          data-testid="file-input"
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={handleReplaceFileChange}
          data-testid="replace-file-input"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-3 mb-2 flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
          <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>{error}</p>
            <button
              onClick={() => dispatch(clearGeoError())}
              className="mt-1 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <Separator />

      {/* Layer search */}
      {layers.length > 0 && (
        <div className="px-3 py-2 border-b">
          <LayerSearch onQueryChange={setSearchQuery} />
        </div>
      )}

      {/* Layer tree */}
      <div className="flex-1 overflow-y-auto" data-testid="layer-list">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No layers uploaded yet
          </div>
        ) : filteredLayers.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No layers match &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          <div className="py-1">
            {/* Folders */}
            {tree.folders.map((folder) => (
              <FolderNode
                key={folder.name}
                folder={folder}
                visibleLayerIds={visibleLayerIds}
                uploading={uploading}
                defaultOpen={foldersDefaultOpen}
                dispatch={dispatch}
                onReplace={handleReplace}
              />
            ))}
            {/* Root-level layers (no folder) */}
            {tree.rootLayers.length > 0 && tree.folders.length > 0 && (
              <div className="border-t mt-1 pt-1" />
            )}
            {tree.rootLayers.map((layer) => (
              <LayerItem
                key={layer.id}
                layer={layer}
                displayName={layer.name}
                isVisible={visibleLayerIds.includes(layer.id)}
                uploading={uploading}
                indent={1}
                onToggleVisibility={() => dispatch(toggleLayerVisibility(layer.id))}
                onFocus={() => dispatch(focusLayer(layer.id))}
                onReplace={() => handleReplace(layer.id)}
                onDelete={() => dispatch(deleteLayer(layer.id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
