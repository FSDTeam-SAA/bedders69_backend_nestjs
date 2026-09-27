/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { memoryStorage } from 'multer';
import streamifier from 'streamifier';
import { v2 as cloudinary } from 'cloudinary';
import { HttpException } from '@nestjs/common';
import config from '../config';
import { console } from 'node:inspector';

cloudinary.config({
  cloud_name: config.cloudinary.name,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const uploadConfig = {
  storage: memoryStorage(),
  // limits: {
  //   fileSize: 10 * 1024 * 1024, // 10 MB
  // },
};

const uploadToCloudinary = async (
  file: Express.Multer.File,
  preserveOriginal = false,
): Promise<{ url: string; public_id: string; resource_type: 'image' | 'raw' }> => {
  if (!file) throw new HttpException('No file provided', 400);
  if (
    !config.cloudinary.name ||
    !config.cloudinary.apiKey ||
    !config.cloudinary.apiSecret
  ) {
    throw new HttpException('Cloudinary is not configured', 500);
  }

  console.log('Uploading file to Cloudinary:', file.originalname);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: config.cloudinary.folder,
        // Raw delivery prevents Cloudinary's image pipeline from producing a
        // resized or quality-optimized derivative. Use it where the exact
        // source file must be displayed (for example, website banners).
        resource_type: preserveOriginal ? 'raw' : 'auto',
        // Do not set `transformation`, `format`, or `quality` here. Omitting
        // incoming transformations stores the uploaded asset as-is.
      },
      (error, result) => {
        if (error) return reject(error);

        if (!result) {
          return reject(new Error('Upload failed - no result returned'));
        }
        // `fl_original` opts out of Cloudinary's optional account-level
        // automatic delivery optimization, which can otherwise serve a
        // smaller lossy image despite the original upload being intact.
        const resourceType =
          result.resource_type === 'raw' ? 'raw' : 'image';
        const url =
          resourceType === 'image'
            ? cloudinary.url(result.public_id, {
                secure: true,
                resource_type: 'image',
                type: 'upload',
                version: String(result.version),
                format: result.format,
                flags: 'original',
              })
            : result.secure_url;

        resolve({
          url,
          public_id: result.public_id,
          resource_type: resourceType,
        });
      },
    );
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

const deleteFromCloudinary = async (
  public_id: string,
  resource_type: 'image' | 'raw' = 'image',
): Promise<void> => {
  if (!public_id) return;
  try {
    await cloudinary.uploader.destroy(public_id, { resource_type });
  } catch (error) {
    console.error('Cloudinary delete failed:', error);
  }
};

export const fileUpload = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadConfig,
};
