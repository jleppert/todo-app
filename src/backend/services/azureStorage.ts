import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

function getContainerClient() {
  if (!accountName || !accountKey || !containerName) {
    throw new Error(
      'Azure Storage environment variables are not configured. ' +
      'Set AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY, and AZURE_STORAGE_CONTAINER_NAME.'
    );
  }

  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );
  return blobServiceClient.getContainerClient(containerName);
}

export async function uploadBlob(
  blobName: string,
  buffer: Buffer,
  contentType?: string
): Promise<string> {
  const containerClient = getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: contentType ? { blobContentType: contentType } : undefined,
  });

  return blockBlobClient.url;
}

export async function deleteBlob(blobName: string): Promise<void> {
  const containerClient = getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}
