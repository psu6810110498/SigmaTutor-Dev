"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Power, MoreVertical, ExternalLink, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/components/ui/Toast";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { PromptDialog } from "@/app/components/ui/PromptDialog";
import { couponApi } from "@/app/lib/api";
import { CouponModal } from "@/app/components/admin/marketing/CouponModal";

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

interface Coupon {
    id: string;
    code: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscount: number | null;
    minPurchase: number | null;
    startDate: string;
    endDate: string | null;
    usageLimit: number | null;
    usedCount: number;
    isOneTimeUse: boolean;
    isActive: boolean;
    applicableCourses: { id: string; title: string }[];
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [couponToEdit, setCouponToEdit] = useState<Coupon | null>(null);
    const [isTrashMode, setIsTrashMode] = useState(false);

    // Modal states for delete/restore/force delete actions
    const [confirmAction, setConfirmAction] = useState<{ id: string, type: 'delete' | 'restore' } | null>(null);
    const [promptAction, setPromptAction] = useState<{ id: string, code: string } | null>(null);

    const { toast } = useToast();

    const fetchCoupons = async (trashMode = isTrashMode) => {
        setIsLoading(true);
        try {
            const data = await (trashMode ? couponApi.getTrash() : couponApi.list());
            if (data.success) {
                setCoupons(data.data || []);
            }
        } catch (err) {
            console.error(err);
            toast.error("ไม่สามารถโหลดข้อมูลคูปองได้");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons(isTrashMode);
    }, [isTrashMode]);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const data = await couponApi.update(id, { isActive: !currentStatus });
            if (data.success) {
                toast.success("อัปเดตสถานะสำเร็จ");
                fetchCoupons();
            }
        } catch (err) {
            console.error(err);
            toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
        }
    };

    const deleteCoupon = async (id: string) => {
        try {
            const data = await couponApi.delete(id);
            if (data.success) {
                toast.success("ย้ายลงถังขยะสำเร็จ");
                fetchCoupons(isTrashMode);
            }
        } catch (err) {
            console.error(err);
            toast.error("เกิดข้อผิดพลาดในการย้ายข้อมูล");
        } finally {
            setConfirmAction(null);
        }
    };

    const restoreCoupon = async (id: string) => {
        try {
            const data = await couponApi.restore(id);
            if (data.success) {
                toast.success("กู้คืนคูปองสำเร็จ");
                fetchCoupons(isTrashMode);
            }
        } catch (err) {
            console.error(err);
            toast.error("เกิดข้อผิดพลาดในการกู้คืน");
        } finally {
            setConfirmAction(null);
        }
    };

    const forceDeleteCoupon = async (id: string) => {
        try {
            const data = await couponApi.forceDelete(id);
            if (data.success) {
                toast.success("ลบคูปองถาวรสำเร็จ");
                fetchCoupons(isTrashMode);
            }
        } catch (err) {
            console.error(err);
            toast.error("เกิดข้อผิดพลาดในการลบถาวร");
        } finally {
            setPromptAction(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className={`text-xl font-bold ${isTrashMode ? 'text-red-700' : 'text-gray-900'}`}>
                        {isTrashMode ? 'คูปองส่วนลดที่ถูกลบไปแล้ว' : 'รายการคูปองส่วนลด'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">จัดการแคมเปญโปรโมชันทั้งหมดของระบบ</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={isTrashMode ? "primary" : "outline"}
                        className={`font-bold flex items-center gap-2 ${isTrashMode ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent' : 'text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200'}`}
                        onClick={() => setIsTrashMode(!isTrashMode)}
                    >
                        <Trash2 size={18} />
                        {isTrashMode ? "กลับไปหน้าปกติ" : "รายการที่ถูกลบ"}
                    </Button>
                    {!isTrashMode && (
                        <Button
                            variant="primary"
                            className="font-bold flex items-center gap-2"
                            onClick={() => {
                                setCouponToEdit(null);
                                setIsModalOpen(true);
                            }}
                        >
                            <Plus size={18} />
                            สร้างคูปองใหม่
                        </Button>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <CouponModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    couponToEdit={couponToEdit}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchCoupons();
                        toast.success("บันทึกข้อมูลคูปองสำเร็จ");
                    }}
                />
            )}

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Table / Mobile Cards */}
                <div className="overflow-x-hidden md:overflow-x-auto p-4 md:p-0 bg-gray-50 md:bg-white">
                    <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal block md:table">
                        <thead className="hidden md:table-header-group bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">รหัสคูปอง</th>
                                <th className="px-6 py-4">รายละเอียดส่วนลด</th>
                                <th className="px-6 py-4 text-center">การใช้งาน (สิทธิ์)</th>
                                <th className="px-6 py-4">ระยะเวลา</th>
                                <th className="px-6 py-4 text-center">สถานะ</th>
                                <th className="px-6 py-4 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="block md:table-row-group space-y-4 md:space-y-0 divide-y-0 md:divide-y divide-gray-100">
                            {isLoading ? (
                                <tr className="block md:table-row">
                                    <td colSpan={6} className="block md:table-cell px-6 py-10 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            กำลังโหลดข้อมูล...
                                        </div>
                                    </td>
                                </tr>
                            ) : coupons.length === 0 ? (
                                <tr className="block md:table-row">
                                    <td colSpan={6} className="block md:table-cell px-6 py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="bg-gray-100 p-3 rounded-full text-gray-400">
                                                <Search size={24} />
                                            </div>
                                            <p>ไม่มีข้อมูลคูปองส่วนลดในระบบ</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id} className={`block md:table-row bg-white rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-gray-100 md:border-0 p-4 md:p-0 hover:bg-gray-50/50 transition-colors group ${isTrashMode ? 'opacity-70 bg-red-50/20' : ''}`}>
                                        <td className="block md:table-cell px-0 md:px-6 py-3 md:py-4 border-b border-gray-50 md:border-0">
                                            <div className="flex items-center justify-between md:block">
                                                <span className="inline-block bg-primary/10 text-primary font-black px-3 py-1.5 rounded-lg border border-primary/20 tracking-wide uppercase">
                                                    {coupon.code}
                                                </span>
                                                {/* Action buttons on mobile (Header right) */}
                                                <div className="flex md:hidden items-center justify-end gap-2">
                                                    {isTrashMode ? (
                                                        <>
                                                            <button onClick={() => setConfirmAction({ id: coupon.id, type: 'restore' })} className="p-1.5 text-green-600 bg-green-50 rounded-lg">
                                                                <RefreshCw size={16} />
                                                            </button>
                                                            <button onClick={() => setPromptAction({ id: coupon.id, code: coupon.code })} className="p-1.5 text-red-600 bg-red-50 rounded-lg">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => { setCouponToEdit(coupon); setIsModalOpen(true); }} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => setConfirmAction({ id: coupon.id, type: 'delete' })} className="p-1.5 text-red-600 bg-red-50 rounded-lg">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {coupon.applicableCourses?.length > 0 && (
                                                <p className="text-[11px] text-gray-500 mt-2 md:mt-1 flex items-center gap-1">
                                                    <ExternalLink size={10} /> เฉพาะคอร์สที่ระบุ ({coupon.applicableCourses.length})
                                                </p>
                                            )}
                                        </td>
                                        <td className="flex items-center justify-between md:table-cell px-0 md:px-6 py-3 md:py-4 border-b border-gray-50 md:border-0">
                                            <span className="md:hidden text-xs text-gray-400 font-medium uppercase tracking-wider">รายละเอียด</span>
                                            <div className="text-right md:text-left">
                                                <div className="font-bold text-gray-900">
                                                    {coupon.discountType === "PERCENTAGE"
                                                        ? `ลด ${coupon.discountValue}%`
                                                        : `ลด ${coupon.discountValue.toLocaleString()} บาท`}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                                    {coupon.minPurchase && <span>ขั้นต่ำ ฿{coupon.minPurchase.toLocaleString()}</span>}
                                                    {coupon.maxDiscount && coupon.discountType === "PERCENTAGE" && (
                                                        <span className="text-orange-500">สูงสุด ฿{coupon.maxDiscount.toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="flex items-center justify-between md:table-cell px-0 md:px-6 py-3 md:py-4 border-b border-gray-50 md:border-0 md:text-center">
                                            <span className="md:hidden text-xs text-gray-400 font-medium uppercase tracking-wider">สิทธิ์การใช้</span>
                                            <div className="text-right md:text-center">
                                                <div className="inline-flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
                                                    <span className="font-bold text-gray-900">{coupon.usedCount.toLocaleString()}</span>
                                                    <span className="text-gray-400">/</span>
                                                    <span className="text-gray-600 font-medium">{coupon.usageLimit ? coupon.usageLimit.toLocaleString() : 'ไม่จำกัด'}</span>
                                                </div>
                                                {coupon.usageLimit && coupon.usedCount >= coupon.usageLimit && (
                                                    <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">สิทธิ์เต็มแล้ว</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="flex items-start justify-between md:table-cell px-0 md:px-6 py-3 md:py-4 border-b border-gray-50 md:border-0">
                                            <span className="md:hidden text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">ระยะเวลา</span>
                                            <div className="text-right md:text-left">
                                                <div className="text-xs text-gray-700">
                                                    เริ่ม: <span className="font-medium">{format(new Date(coupon.startDate), "dd MMM yyyy, HH:mm", { locale: th })}</span>
                                                </div>
                                                {coupon.endDate && (
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        สิ้นสุด: <span className="font-medium">{format(new Date(coupon.endDate), "dd MMM yyyy, HH:mm", { locale: th })}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="flex items-center justify-between md:table-cell px-0 md:px-6 py-3 md:py-4 md:text-center">
                                            <span className="md:hidden text-xs text-gray-400 font-medium uppercase tracking-wider">สถานะ</span>
                                            <div>
                                                {isTrashMode ? (
                                                    <div className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg inline-block whitespace-nowrap border border-red-100">
                                                        ลบออกจากระบบ
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => toggleStatus(coupon.id, coupon.isActive)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${coupon.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                                                        title={coupon.isActive ? "ระงับใช้งาน" : "เปิดใช้งาน"}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${coupon.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 text-right">
                                            {/* Action buttons on Desktop */}
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isTrashMode ? (
                                                    <>
                                                        <button
                                                            onClick={() => setConfirmAction({ id: coupon.id, type: 'restore' })}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-200"
                                                            title="กู้คืนคูปอง"
                                                        >
                                                            <RefreshCw size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setPromptAction({ id: coupon.id, code: coupon.code })}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                                            title="ลบถาวร (ลบออกจากฐานข้อมูล)"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setCouponToEdit(coupon);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="แก้ไขคูปอง"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmAction({ id: coupon.id, type: 'delete' })}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="ย้ายลงถังขยะ"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirmation & Prompt Dialogs */}
            <ConfirmDialog
                open={!!confirmAction}
                title={confirmAction?.type === 'delete' ? "ย้ายคูปองลงถังขยะ" : "กู้คืนคูปองส่วนลด"}
                message={confirmAction?.type === 'delete'
                    ? "คุณต้องการย้ายคูปองนี้ไปที่ถังขยะใช่หรือไม่? (สามารถกู้คืนได้ภายหลัง)"
                    : "คุณต้องการกู้คืนคูปองนี้ให้กลับมาใช้งานได้ตามปกติใช่หรือไม่?"}
                confirmLabel={confirmAction?.type === 'delete' ? "ย้ายลงถังขยะ" : "กู้คืนข้อมูล"}
                cancelLabel="ยกเลิก"
                variant={confirmAction?.type === 'delete' ? "danger" : "info"}
                onConfirm={() => {
                    if (confirmAction?.type === 'delete') deleteCoupon(confirmAction.id);
                    else if (confirmAction?.type === 'restore') restoreCoupon(confirmAction.id);
                }}
                onCancel={() => setConfirmAction(null)}
            />

            <PromptDialog
                open={!!promptAction}
                title="ลบคูปองถาวร"
                message="การกระทำนี้จะลบข้อมูลออกจากฐานข้อมูลโดยสมบูรณ์ และ ไม่สามารถกู้คืนได้ โปรดยืนยันด้วยการพิมพ์รหัสคูปอง"
                expectedText={promptAction?.code || ""}
                confirmLabel="ลบถาวร"
                onConfirm={() => forceDeleteCoupon(promptAction!.id)}
                onCancel={() => setPromptAction(null)}
            />
        </div>
    );
}
