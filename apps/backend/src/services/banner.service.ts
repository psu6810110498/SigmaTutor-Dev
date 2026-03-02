import { prisma } from '@sigma/db';



export class BannerService {
    // Service for managing and retrieving promotional banners
    /**
     * Get all active banners for display (Frontend)
     * Ordered by priority (desc) then specific updates
     */
    async getActiveBanners(position: 'EXPLORE_TOP' | 'EXPLORE_MIDDLE' = 'EXPLORE_TOP') {
        const now = new Date();
        return prisma.banner.findMany({
            where: {
                isActive: true,
                deletedAt: null, // Ignore deleted
                position: position, // Filter by position
                AND: [
                    {
                        OR: [
                            { startDate: null },
                            { startDate: { lte: now } }
                        ]
                    },
                    {
                        OR: [
                            { endDate: null },
                            { endDate: { gte: now } }
                        ]
                    }
                ]
            },
            orderBy: [
                { priority: 'asc' }, // Order 1, 2, 3...
                { updatedAt: 'desc' }
            ],
            select: {
                id: true,
                title: true,
                subtitle: true,
                imageUrl: true,
                imageUrlMobile: true, // Add mobile image
                ctaLink: true,
                ctaText: true,
                position: true,
            }
        });
    }

    /**
     * Get all banners (Admin)
     */
    async getAllBanners() {
        return prisma.banner.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get trashed banners (Admin Recycle Bin)
     */
    async getTrashBanners() {
        return prisma.banner.findMany({
            where: { deletedAt: { not: null } },
            orderBy: { deletedAt: 'desc' }
        });
    }

    /**
     * Create a new banner
     */
    async create(data: any) {
        return prisma.banner.create({ data });
    }

    /**
     * Update a banner
     */
    async update(id: string, data: any) {
        return prisma.banner.update({
            where: { id },
            data
        });
    }

    /**
     * Delete a banner (Soft Delete)
     */
    async delete(id: string) {
        return prisma.banner.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }

    /**
     * Restore a soft-deleted banner
     */
    async restore(id: string) {
        return prisma.banner.update({
            where: { id },
            data: { deletedAt: null }
        });
    }

    /**
     * Permanent Delete
     */
    async forceDelete(id: string) {
        return prisma.banner.delete({
            where: { id }
        });
    }

    /**
     * Toggle banner active status
     */
    async toggleActive(id: string, isActive: boolean) {
        return prisma.banner.update({
            where: { id },
            data: { isActive }
        });
    }
}

export const bannerService = new BannerService();
