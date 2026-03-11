'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import ImageUpload from '@/app/components/common/ImageUpload';
import { Button } from '@/app/components/ui/Button';
import { useToast } from '@/app/components/ui/Toast';
import { Input } from '@/app/components/ui/Input';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';
import { PromptDialog } from '@/app/components/ui/PromptDialog';
import { bannerApi } from '@/app/lib/api';
import { Banner } from '@/app/lib/types';

// --- Types ---
type BannerFormData = Partial<Banner> & { imageFile?: File | null };

const formatDateForInput = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Format to YYYY-MM-DDThh:mm for datetime-local input
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getBannerStatus = (banner: Banner) => {
  if (!banner.isActive)
    return { label: 'Disabled', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  const now = new Date();
  const start = banner.startDate ? new Date(banner.startDate) : null;
  const end = banner.endDate ? new Date(banner.endDate) : null;

  if (end && now > end) return { label: 'Expired', color: 'bg-red-50 text-red-600 border-red-200' };
  if (start && now < start)
    return { label: 'Scheduled', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' };
  return { label: 'Active', color: 'bg-green-50 text-green-700 border-green-200' };
};

export default function BannerManagementPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTrashMode, setIsTrashMode] = useState(false);
  const { toast } = useToast();

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [promptAction, setPromptAction] = useState<{ id: string; title: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    subtitle: '',
    ctaText: 'เรียนรู้เพิ่มเติม',
    ctaLink: '/courses',
    isActive: true,
    priority: 0,
    imageUrl: '',
    position: 'EXPLORE_TOP',
  });

  // Fetch Banners
  const fetchBanners = async (trashMode = isTrashMode) => {
    setIsLoading(true);
    try {
      const res = await (trashMode ? bannerApi.getTrash() : bannerApi.getAll());
      if (res.success && res.data) {
        setBanners(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch banners', error);
      toast.error('ดึงข้อมูลไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners(isTrashMode);
  }, [isTrashMode]);

  // Handlers
  const handleOpenCreate = () => {
    setFormData({
      title: '',
      subtitle: '',
      ctaText: 'เรียนรู้เพิ่มเติม',
      ctaLink: '/courses',
      isActive: true,
      priority: 1,
      imageUrl: '',
      imageUrlMobile: '',
      position: 'EXPLORE_TOP',
      startDate: null,
      endDate: null,
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      ...banner,
      imageFile: null, // Reset file input
    });
    setIsCreateOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await bannerApi.delete(deletingId);
      toast.success('ย้าย Banner ลงถังขยะสำเร็จ');
      fetchBanners(isTrashMode);
    } catch (error) {
      toast.error('ย้ายลงถังขยะไม่สำเร็จ');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async () => {
    if (!restoringId) return;
    try {
      await bannerApi.restore(restoringId);
      toast.success('กู้คืน Banner สำเร็จ');
      fetchBanners(isTrashMode);
    } catch (error) {
      toast.error('กู้คืนไม่สำเร็จ');
    } finally {
      setRestoringId(null);
    }
  };

  const handleForceDelete = async () => {
    if (!promptAction) return;
    try {
      await bannerApi.forceDelete(promptAction.id);
      toast.success('ลบ Banner ถาวรสำเร็จ');
      fetchBanners(isTrashMode);
    } catch (error) {
      toast.error('ลบถาวรไม่สำเร็จ');
    } finally {
      setPromptAction(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      delete payload.imageFile; // Cleanup

      if (editingBanner) {
        await bannerApi.update(editingBanner.id, payload);
      } else {
        await bannerApi.create(payload);
      }
      setIsCreateOpen(false);
      setEditingBanner(null);
      fetchBanners();
    } catch (error) {
      console.error('Failed to save', error);
      alert('Failed to save banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active Status
  const toggleActive = async (banner: Banner) => {
    try {
      await bannerApi.update(banner.id, { isActive: !banner.isActive });
      fetchBanners(); // Refresh to reflect change
    } catch (error) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-xl font-bold ${isTrashMode ? 'text-red-700' : 'text-gray-900'}`}>
            {isTrashMode ? 'Banner ที่ถูกลบไปแล้ว' : 'รายการ Banner ปัจจุบัน'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">จัดการป้ายประชาสัมพันธ์บนหน้าแรก</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isTrashMode ? 'primary' : 'outline'}
            className={`font-bold flex items-center gap-2 ${isTrashMode ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent' : 'text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200'}`}
            onClick={() => setIsTrashMode(!isTrashMode)}
          >
            <Trash2 size={18} />
            {isTrashMode ? 'กลับไปหน้าปกติ' : 'รายการที่ถูกลบ'}
          </Button>
          {!isTrashMode && (
            <Button onClick={handleOpenCreate} icon={<Plus size={18} />}>
              เพิ่ม Banner ใหม่
            </Button>
          )}
        </div>
      </div>

      {/* List / Mobile Cards */}
      <div className="bg-gray-50 md:bg-white rounded-xl md:shadow-sm border-0 md:border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse block md:table">
          <thead className="hidden md:table-header-group">
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
              <th className="p-4">ลำดับ</th>
              <th className="p-4">รูปภาพ</th>
              <th className="p-4">หัวข้อ</th>
              <th className="p-4">ตำแหน่ง</th>
              <th className="p-4">สถานะ</th>
              <th className="p-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group space-y-4 md:space-y-0 divide-y-0 md:divide-y divide-gray-50 p-4 md:p-0">
            {isLoading ? (
              <tr className="block md:table-row">
                <td colSpan={5} className="block md:table-cell p-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : banners.length === 0 ? (
              <tr className="block md:table-row">
                <td colSpan={5} className="block md:table-cell p-8 text-center text-gray-400">
                  ยังไม่มี Banner
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr
                  key={banner.id}
                  className={`block md:table-row bg-white rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-gray-100 md:border-0 p-4 md:p-0 hover:bg-gray-50/50 transition-colors ${isTrashMode ? 'opacity-70 bg-red-50/20' : ''}`}
                >
                  <td className="hidden md:table-cell p-4 text-gray-500 font-mono">
                    {banner.priority}
                  </td>

                  {/* Mobile Card Header */}
                  <td className="block md:hidden border-b border-gray-50 pb-3 mb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-mono text-xs">#{banner.priority}</span>
                        {(() => {
                          const status = getBannerStatus(banner);
                          return isTrashMode ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-red-100 bg-red-50 text-red-500">
                              ถูกลบออกจากระบบ
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${status.color}`}
                            >
                              {status.label}
                            </span>
                          );
                        })()}
                      </div>
                      {/* Mobile Actions */}
                      <div className="flex items-center gap-2">
                        {isTrashMode ? (
                          <>
                            <button
                              onClick={() => setRestoringId(banner.id)}
                              className="p-1.5 text-green-600 bg-green-50 rounded-lg"
                            >
                              <RefreshCw size={16} />
                            </button>
                            <button
                              onClick={() =>
                                setPromptAction({ id: banner.id, title: banner.title })
                              }
                              className="p-1.5 text-red-600 bg-red-50 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(banner)}
                              className="p-1.5 text-blue-600 bg-blue-50 rounded-lg"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setDeletingId(banner.id)}
                              className="p-1.5 text-red-600 bg-red-50 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="block md:table-cell p-0 md:p-4 mb-3 md:mb-0">
                    <div className="w-full md:w-24 h-32 md:h-12 bg-gray-100 md:rounded-lg rounded-xl overflow-hidden relative border border-gray-200">
                      {banner.imageUrl ? (
                        <img
                          src={banner.imageUrlMobile || banner.imageUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300">
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="block md:table-cell p-0 md:p-4 mt-3 md:mt-0">
                    <div className="font-bold text-gray-900 line-clamp-1">{banner.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-2 max-w-xs">
                      {banner.subtitle || '-'}
                    </div>
                  </td>

                  {/* Position Badge */}
                  <td className="flex items-center justify-between md:table-cell p-0 md:p-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t border-gray-50 md:border-0">
                    <span className="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      ตำแหน่ง
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        banner.position === 'EXPLORE_TOP'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}
                    >
                      {banner.position === 'EXPLORE_TOP' ? '⬆ Top Bar' : '↔ Middle'}
                    </span>
                  </td>

                  <td className="hidden md:table-cell p-4">
                    {isTrashMode ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border border-red-100 bg-red-50 text-red-500">
                        ถูกลบออกจากระบบ
                      </span>
                    ) : (
                      (() => {
                        const status = getBannerStatus(banner);
                        return (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.color}`}
                          >
                            {status.label}
                          </span>
                        );
                      })()
                    )}
                  </td>
                  <td className="hidden md:table-cell p-4 text-right space-x-2">
                    {isTrashMode ? (
                      <>
                        <button
                          onClick={() => setRestoringId(banner.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors border border-transparent hover:border-green-200"
                          title="กู้คืน"
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button
                          onClick={() => setPromptAction({ id: banner.id, title: banner.title })}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200"
                          title="ลบถาวร"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenEdit(banner)}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingId(banner.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex-none flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">
                {editingBanner ? 'แก้ไข Banner' : 'เพิ่ม Banner ใหม่'}
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
              {/* 1. Position Selector (Visual) */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  เลือกตำแหน่งการแสดงผล (Display Position)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      id: 'EXPLORE_TOP',
                      label: 'หน้ารวมคอร์ส (Top Bar)',
                      desc: 'เน้นแนวยาว | ด้านบนสุด',
                      icon: <ArrowUp size={24} />,
                    },
                    {
                      id: 'EXPLORE_MIDDLE',
                      label: 'หน้ารวมคอร์ส (Middle)',
                      desc: 'คั่นระหว่างหมวดหมู่',
                      icon: <ImageIcon size={24} />,
                    },
                    {
                      id: 'LANDING_HERO',
                      label: 'หน้าแรก (Hero)',
                      desc: 'รูปด้านขวา Hero Section | แนะนำ 500x500',
                      icon: <ImageIcon size={24} />,
                    },
                  ].map((pos) => (
                    <div
                      key={pos.id}
                      onClick={() => setFormData({ ...formData, position: pos.id as any })}
                      className={`
                                                cursor-pointer rounded-xl border-2 p-4 transition-all relative overflow-hidden group
                                                ${
                                                  formData.position === pos.id
                                                    ? 'border-primary bg-primary/5 shadow-md'
                                                    : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                                                }
                                            `}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${formData.position === pos.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-primary'}`}
                        >
                          {pos.icon}
                        </div>
                        <div>
                          <p
                            className={`font-bold text-sm ${formData.position === pos.id ? 'text-primary' : 'text-gray-700'}`}
                          >
                            {pos.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{pos.desc}</p>
                        </div>
                      </div>
                      {formData.position === pos.id && (
                        <div className="absolute top-2 right-2 text-primary">
                          <CheckCircle size={16} className="fill-current" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                {/* Desktop Image */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    รูปภาพ Desktop (แนวนอน)
                    <span className="text-xs text-gray-400 font-normal">
                      {formData.position === 'EXPLORE_TOP'
                        ? 'แนะนำ 1920x600 px'
                        : formData.position === 'LANDING_HERO'
                          ? 'แนะนำ 500x500 px'
                          : 'แนะนำ 1200x200 px'}
                    </span>
                  </h4>
                  <ImageUpload
                    value={formData.imageUrl}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                    maxWidth={1920}
                    aspectRatio={
                      formData.position === 'EXPLORE_TOP'
                        ? 'aspect-[16/5]'
                        : formData.position === 'LANDING_HERO'
                          ? 'aspect-square'
                          : 'aspect-[6/1]'
                    }
                    label=""
                  />
                  <input
                    type="text"
                    className="mt-2 w-full text-xs text-gray-400 border border-gray-200 rounded p-1 bg-gray-50 font-mono"
                    value={formData.imageUrl}
                    readOnly
                    placeholder="URL จะปรากฏที่นี่หลังอัปโหลด"
                  />
                </div>

                {/* Mobile Image */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    รูปภาพ Mobile (แนวตั้ง/จตุรัส)
                    <span className="text-xs text-gray-400 font-normal">
                      {formData.position === 'EXPLORE_TOP' ? 'แนะนำ 800x450 px' : 'ไม่แสดงนมือถือ'}
                    </span>
                  </h4>
                  <ImageUpload
                    value={formData.imageUrlMobile}
                    onChange={(url) => setFormData({ ...formData, imageUrlMobile: url })}
                    maxWidth={800}
                    aspectRatio="aspect-[16/9]"
                    label=""
                  />
                  <input
                    type="text"
                    className="mt-2 w-full text-xs text-gray-400 border border-gray-200 rounded p-1 bg-gray-50 font-mono"
                    value={formData.imageUrlMobile || ''}
                    readOnly
                    placeholder="URL จะปรากฏที่นี่หลังอัปโหลด"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="หัวข้อแบนเนอร์"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="เช่น โปรโมชั่นพิเศษ..."
                    required
                  />
                </div>
                <div>
                  <Input
                    label="ลำดับการแสดงผล"
                    type="number"
                    value={Number.isNaN(formData.priority) ? '' : formData.priority}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFormData({ ...formData, priority: isNaN(val) ? 0 : val });
                    }}
                    min={1}
                  />
                  <p className="text-xs text-gray-400 mt-1">ใส่เลข 1 เพื่อแสดงเป็นอันดับแรก</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันเริ่มแสดง (Start)
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    value={formatDateForInput(formData.startDate)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันสิ้นสุด (End)
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    value={formatDateForInput(formData.endDate)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Input
                  label="คำอธิบายเพิ่มเติม (Subtitle)"
                  value={formData.subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="รายละเอียดสั้นๆ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="ข้อความบนปุ่ม (Optional)"
                    value={formData.ctaText || ''}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="เว้นว่างได้ถ้าไม่ต้องการปุ่ม"
                  />
                </div>
                <div>
                  <Input
                    label="ลิงก์เมื่อกดปุ่ม (เช่น /courses)"
                    value={formData.ctaLink || ''}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 select-none">
                  เปิดใช้งานทันที
                </label>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  บันทึก
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Soft */}
      <ConfirmDialog
        open={!!deletingId}
        title="ย้าย Banner ลงถังขยะ"
        message="คุณต้องการย้าย Banner นี้ไปที่ถังขยะใช่หรือไม่? (สามารถกู้คืนได้ภายหลัง)"
        confirmLabel="ย้ายลงถังขยะ"
        cancelLabel="ยกเลิก"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        variant="danger"
      />

      {/* Confirm Restore */}
      <ConfirmDialog
        open={!!restoringId}
        title="กู้คืน Banner"
        message="คุณต้องการกู้คืน Banner นี้ให้กลับมาแสดงผลใช่หรือไม่?"
        confirmLabel="กู้คืน"
        cancelLabel="ยกเลิก"
        onConfirm={handleRestore}
        onCancel={() => setRestoringId(null)}
        variant="info"
      />

      {/* Prompt Force Delete */}
      <PromptDialog
        open={!!promptAction}
        title="ลบ Banner ถาวร"
        message="การกระทำนี้จะลบข้อมูลออกจากฐานข้อมูลโดยสมบูรณ์ และ ไม่สามารถกู้คืนได้ โปรดยืนยันด้วยการพิมพ์ชื่อแบนเนอร์"
        expectedText={promptAction?.title || ''}
        confirmLabel="ลบถาวร"
        onConfirm={handleForceDelete}
        onCancel={() => setPromptAction(null)}
      />
    </div>
  );
}
