import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import AdmZip from 'adm-zip';
import { prisma } from '../db/client.ts';
import { AppError, asyncHandler } from '../middleware/errorHandler.ts';
import { uploadBlob, deleteBlob } from '../services/azureStorage.ts';
import { convertToGeoJSON } from '../services/geoConverter.ts';

const geoRouter = Router();

// Configure multer for temp file storage
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.zip', '.shp', '.gdb'];
    // Allow files with allowed extensions or application/octet-stream (common for GIS files)
    if (allowedExts.includes(ext) || file.originalname.endsWith('.gdb.zip')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'VALIDATION_ERROR', `Unsupported file type: ${ext}. Upload .zip (shapefile) or .gdb.zip (geodatabase).`));
    }
  },
});

function detectFileType(fileName: string): 'shapefile' | 'geodatabase' {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.gdb.zip') || lower.endsWith('.gdb')) {
    return 'geodatabase';
  }
  return 'shapefile';
}

// Clean up temp files/directories
function cleanupTemp(filePath: string) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  } catch {
    // ignore cleanup errors
  }
}

// POST /api/geo/upload — Upload and convert GIS file
geoRouter.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw AppError.validation('No file uploaded', [
        { field: 'file', message: 'A file is required' },
      ]);
    }

    const uploadedFile = req.file;
    const originalName = uploadedFile.originalname;
    const fileType = detectFileType(originalName);
    const customName = (req.body.name as string)?.trim() || path.parse(originalName).name;
    const startTime = Date.now();

    console.log(`[geo:upload] Starting upload: "${customName}" (${originalName}, ${(uploadedFile.size / 1024 / 1024).toFixed(1)}MB, type=${fileType})`);

    let extractDir: string | null = null;
    let gdalInputPath: string;

    try {
      const ext = path.extname(originalName).toLowerCase();

      if (ext === '.zip' || originalName.toLowerCase().endsWith('.gdb.zip')) {
        // Extract zip to temp directory
        extractDir = path.join(os.tmpdir(), `geo-extract-${Date.now()}`);
        fs.mkdirSync(extractDir, { recursive: true });

        const zip = new AdmZip(uploadedFile.path);
        zip.extractAllTo(extractDir, true);
        console.log(`[geo:upload] Extracted archive to ${extractDir}`);

        if (fileType === 'geodatabase') {
          // Find .gdb directory inside the extracted files
          const gdbDir = findGdbDirectory(extractDir);
          if (!gdbDir) {
            throw AppError.validation('No .gdb directory found in the uploaded archive', [
              { field: 'file', message: 'Archive must contain a .gdb directory' },
            ]);
          }
          gdalInputPath = gdbDir;
          console.log(`[geo:upload] Found .gdb directory: ${gdbDir}`);
        } else {
          // Find .shp file inside the extracted files
          const shpFile = findShpFile(extractDir);
          if (!shpFile) {
            throw AppError.validation('No .shp file found in the uploaded archive', [
              { field: 'file', message: 'Archive must contain a .shp file' },
            ]);
          }
          gdalInputPath = shpFile;
          console.log(`[geo:upload] Found .shp file: ${shpFile}`);
        }
      } else {
        // Direct file upload (e.g., .shp or .gdb folder — unlikely via HTTP but supported)
        gdalInputPath = uploadedFile.path;
      }

      // Convert to GeoJSON
      console.log(`[geo:upload] Converting to GeoJSON...`);
      const convertStart = Date.now();
      const layers = await convertToGeoJSON(gdalInputPath, fileType);
      const totalFeatures = layers.reduce((sum, l) => sum + l.featureCount, 0);
      console.log(`[geo:upload] Conversion complete: ${layers.length} layers, ${totalFeatures} features (${Date.now() - convertStart}ms)`);

      if (layers.length === 0) {
        throw AppError.validation('No layers found in the uploaded file', [
          { field: 'file', message: 'File contains no readable layers' },
        ]);
      }

      // Upload original file to Azure Blob Storage
      console.log(`[geo:upload] Uploading original to Azure Blob Storage...`);
      const azureStart = Date.now();
      const fileBuffer = fs.readFileSync(uploadedFile.path);
      const blobName = `${Date.now()}-${originalName}`;
      const blobUrl = await uploadBlob(blobName, fileBuffer, 'application/octet-stream');
      console.log(`[geo:upload] Azure upload complete (${Date.now() - azureStart}ms)`);

      // Store each layer in the database
      const savedLayers = [];
      for (const layer of layers) {
        const layerName = layers.length === 1
          ? customName
          : `${customName} - ${layer.layerName}`;

        const saved = await prisma.geoLayer.create({
          data: {
            name: layerName,
            fileName: originalName,
            fileType,
            blobUrl,
            geojson: JSON.stringify(layer.geojson),
            featureCount: layer.featureCount,
          },
        });

        savedLayers.push({
          id: saved.id,
          name: saved.name,
          fileName: saved.fileName,
          fileType: saved.fileType,
          blobUrl: saved.blobUrl,
          featureCount: saved.featureCount,
          geojson: layer.geojson,
          createdAt: saved.createdAt.toISOString(),
          updatedAt: saved.updatedAt.toISOString(),
        });
      }

      console.log(`[geo:upload] Done: saved ${savedLayers.length} layers to DB (total ${Date.now() - startTime}ms)`);
      for (const l of savedLayers) {
        console.log(`[geo:upload]   ID=${l.id} "${l.name}" (${l.featureCount} features)`);
      }

      res.status(201).json({ data: savedLayers });
    } finally {
      // Clean up temp files
      cleanupTemp(uploadedFile.path);
      if (extractDir) {
        cleanupTemp(extractDir);
      }
    }
  })
);

// GET /api/geo/layers — List all layers (without geojson for performance)
geoRouter.get(
  '/layers',
  asyncHandler(async (_req: Request, res: Response) => {
    const layers = await prisma.geoLayer.findMany({
      select: {
        id: true,
        name: true,
        fileName: true,
        fileType: true,
        blobUrl: true,
        featureCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = layers.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));

    res.json({ data });
  })
);

// GET /api/geo/layers/:id — Get single layer with full GeoJSON
geoRouter.get(
  '/layers/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw AppError.validation('Invalid layer ID', [
        { field: 'id', message: 'ID must be a number' },
      ]);
    }

    const layer = await prisma.geoLayer.findUnique({ where: { id } });
    if (!layer) {
      throw AppError.notFound('Layer not found');
    }

    res.json({
      data: {
        id: layer.id,
        name: layer.name,
        fileName: layer.fileName,
        fileType: layer.fileType,
        blobUrl: layer.blobUrl,
        featureCount: layer.featureCount,
        geojson: JSON.parse(layer.geojson),
        createdAt: layer.createdAt.toISOString(),
        updatedAt: layer.updatedAt.toISOString(),
      },
    });
  })
);

// DELETE /api/geo/layers/:id — Delete layer and its blob
geoRouter.delete(
  '/layers/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw AppError.validation('Invalid layer ID', [
        { field: 'id', message: 'ID must be a number' },
      ]);
    }

    const layer = await prisma.geoLayer.findUnique({ where: { id } });
    if (!layer) {
      throw AppError.notFound('Layer not found');
    }

    // Delete blob from Azure (extract blob name from URL)
    try {
      const blobName = new URL(layer.blobUrl).pathname.split('/').pop();
      if (blobName) {
        await deleteBlob(blobName);
      }
    } catch (err) {
      console.error('Failed to delete blob from Azure:', err);
      // Continue with database deletion even if blob delete fails
    }

    await prisma.geoLayer.delete({ where: { id } });
    console.log(`[geo:delete] Deleted layer ID=${id} "${layer.name}"`);
    res.status(204).send();
  })
);

// PUT /api/geo/layers/:id — Replace a layer with a new file upload
geoRouter.put(
  '/layers/:id',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw AppError.validation('Invalid layer ID', [
        { field: 'id', message: 'ID must be a number' },
      ]);
    }

    const existing = await prisma.geoLayer.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound('Layer not found');
    }

    if (!req.file) {
      throw AppError.validation('No file uploaded', [
        { field: 'file', message: 'A file is required for replacement' },
      ]);
    }

    const uploadedFile = req.file;
    const originalName = uploadedFile.originalname;
    const fileType = detectFileType(originalName);
    const customName = (req.body.name as string)?.trim() || existing.name;
    const startTime = Date.now();

    console.log(`[geo:replace] Starting replace for ID=${id} "${existing.name}" with "${originalName}" (${(uploadedFile.size / 1024 / 1024).toFixed(1)}MB)`);

    let extractDir: string | null = null;
    let gdalInputPath: string;

    try {
      const ext = path.extname(originalName).toLowerCase();

      if (ext === '.zip' || originalName.toLowerCase().endsWith('.gdb.zip')) {
        extractDir = path.join(os.tmpdir(), `geo-extract-${Date.now()}`);
        fs.mkdirSync(extractDir, { recursive: true });

        const zip = new AdmZip(uploadedFile.path);
        zip.extractAllTo(extractDir, true);

        if (fileType === 'geodatabase') {
          const gdbDir = findGdbDirectory(extractDir);
          if (!gdbDir) {
            throw AppError.validation('No .gdb directory found in the uploaded archive', [
              { field: 'file', message: 'Archive must contain a .gdb directory' },
            ]);
          }
          gdalInputPath = gdbDir;
        } else {
          const shpFile = findShpFile(extractDir);
          if (!shpFile) {
            throw AppError.validation('No .shp file found in the uploaded archive', [
              { field: 'file', message: 'Archive must contain a .shp file' },
            ]);
          }
          gdalInputPath = shpFile;
        }
      } else {
        gdalInputPath = uploadedFile.path;
      }

      // Convert to GeoJSON (use first layer for replacement)
      console.log(`[geo:replace] Converting to GeoJSON...`);
      const convertStart = Date.now();
      const layers = await convertToGeoJSON(gdalInputPath, fileType);
      console.log(`[geo:replace] Conversion complete: ${layers.length} layers (${Date.now() - convertStart}ms)`);
      if (layers.length === 0) {
        throw AppError.validation('No layers found in the uploaded file', [
          { field: 'file', message: 'File contains no readable layers' },
        ]);
      }

      // Delete old blob
      try {
        const oldBlobName = new URL(existing.blobUrl).pathname.split('/').pop();
        if (oldBlobName) {
          await deleteBlob(oldBlobName);
        }
      } catch {
        // Continue even if old blob delete fails
      }

      // Upload new file to Azure
      console.log(`[geo:replace] Uploading to Azure...`);
      const fileBuffer = fs.readFileSync(uploadedFile.path);
      const blobName = `${Date.now()}-${originalName}`;
      const blobUrl = await uploadBlob(blobName, fileBuffer, 'application/octet-stream');

      const layer = layers[0];
      const updated = await prisma.geoLayer.update({
        where: { id },
        data: {
          name: customName,
          fileName: originalName,
          fileType,
          blobUrl,
          geojson: JSON.stringify(layer.geojson),
          featureCount: layer.featureCount,
        },
      });

      console.log(`[geo:replace] Done: ID=${updated.id} "${updated.name}" (${layer.featureCount} features, ${Date.now() - startTime}ms)`);

      res.json({
        data: {
          id: updated.id,
          name: updated.name,
          fileName: updated.fileName,
          fileType: updated.fileType,
          blobUrl: updated.blobUrl,
          featureCount: updated.featureCount,
          geojson: layer.geojson,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    } finally {
      cleanupTemp(uploadedFile.path);
      if (extractDir) {
        cleanupTemp(extractDir);
      }
    }
  })
);

// Helper: recursively find a .gdb directory that contains actual data files
function findGdbDirectory(dir: string): string | null {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name.toLowerCase().endsWith('.gdb')) {
      // Check if this .gdb contains another .gdb inside (nested case)
      const deeper = findGdbDirectory(fullPath);
      return deeper ?? fullPath;
    }
    if (entry.isDirectory()) {
      const found = findGdbDirectory(fullPath);
      if (found) return found;
    }
  }
  return null;
}

// Helper: recursively find a .shp file
function findShpFile(dir: string): string | null {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.shp')) {
      return fullPath;
    }
    if (entry.isDirectory()) {
      const found = findShpFile(fullPath);
      if (found) return found;
    }
  }
  return null;
}

export { geoRouter };
