import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner, BannerDocument } from './entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { fileUpload } from 'src/app/helpers/fileUploder';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';

/**
 * Cloudinary may apply account-level delivery optimization to legacy URLs.
 * Add `fl_original` only to Cloudinary image URLs so every banner response
 * requests the exact uploaded image, including records created before the
 * upload helper started returning original-delivery URLs.
 */
const originalBannerImageUrl = (imageUrl: string): string => {
  const marker = '/image/upload/';
  if (!imageUrl.includes('res.cloudinary.com') || !imageUrl.includes(marker)) {
    return imageUrl;
  }

  return imageUrl.includes('/image/upload/fl_original/')
    ? imageUrl
    : imageUrl.replace(marker, '/image/upload/fl_original/');
};

@Injectable()
export class BannerService {
  constructor(
    @InjectModel(Banner.name)
    private readonly bannerModel: Model<BannerDocument>,
  ) {}

  async createBanner(
    dto: CreateBannerDto,
    file?: Express.Multer.File,
  ): Promise<Banner> {
    let imageUrl = dto.image;
    let imagePublicId: string | undefined;
    let imageResourceType: 'image' | 'raw' | undefined;

    if (file) {
      const uploadResult = await fileUpload.uploadToCloudinary(file, true);
      imageUrl = uploadResult.url;
      imagePublicId = uploadResult.public_id;
      imageResourceType = uploadResult.resource_type;
    }

    if (!imageUrl) {
      throw new BadRequestException('Banner image is required (file or image URL)');
    }

    const createdBanner = new this.bannerModel({
      ...dto,
      image: imageUrl,
      imagePublicId,
      imageResourceType,
    });

    return createdBanner.save();
  }

  async getAllBanners(options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const [total, banners] = await Promise.all([
      this.bannerModel.countDocuments(),
      this.bannerModel
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .exec(),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: banners.map((banner) => {
        const item = banner.toObject();
        item.image = originalBannerImageUrl(item.image);
        return item;
      }),
    };
  }

  async getSingleBanner(id: string): Promise<Banner> {
    const banner = await this.bannerModel.findById(id).exec();
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }
    return banner;
  }

  async updateBanner(
    id: string,
    dto: UpdateBannerDto,
    file?: Express.Multer.File,
  ): Promise<Banner> {
    const banner = await this.bannerModel.findById(id).exec();
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    let imageUrl = dto.image ?? banner.image;
    let imagePublicId = banner.imagePublicId;
    let imageResourceType = banner.imageResourceType ?? 'image';

    if (file) {
      if (banner.imagePublicId) {
        await fileUpload.deleteFromCloudinary(
          banner.imagePublicId,
          imageResourceType,
        );
      }
      const uploadResult = await fileUpload.uploadToCloudinary(file, true);
      imageUrl = uploadResult.url;
      imagePublicId = uploadResult.public_id;
      imageResourceType = uploadResult.resource_type;
    }

    const updated = await this.bannerModel
      .findByIdAndUpdate(
        id,
        {
          ...dto,
          image: imageUrl,
          imagePublicId,
          imageResourceType,
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Banner not found');
    }

    return updated;
  }

  async deleteBanner(id: string): Promise<Banner> {
    const banner = await this.bannerModel.findByIdAndDelete(id).exec();
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    if (banner.imagePublicId) {
      await fileUpload.deleteFromCloudinary(
        banner.imagePublicId,
        banner.imageResourceType ?? 'image',
      );
    }

    return banner;
  }
}
