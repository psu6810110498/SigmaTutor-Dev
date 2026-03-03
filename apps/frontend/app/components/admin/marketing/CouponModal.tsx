import { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { couponApi, courseApi } from "@/app/lib/api";

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

interface Course {
    id: string;
    title: string;
}

interface CouponFormData {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscount?: number;
    minPurchase?: number;
    startDate: string;
    endDate?: string;
    usageLimit?: number;
    isOneTimeUse: boolean;
    isActive: boolean;
    applicableCourseIds: string[];
}

interface CouponModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    couponToEdit?: any; // Pass existing coupon here if editing
}

export function CouponModal({ isOpen, onClose, onSuccess, couponToEdit }: CouponModalProps) {
    const [formData, setFormData] = useState<CouponFormData>({
        code: "",
        discountType: "FIXED_AMOUNT",
        discountValue: 0,
        startDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
        isOneTimeUse: false,
        isActive: true,
        applicableCourseIds: [],
    });

    const [courses, setCourses] = useState<Course[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchCourses();
            if (couponToEdit) {
                setFormData({
                    code: couponToEdit.code,
                    discountType: couponToEdit.discountType,
                    discountValue: couponToEdit.discountValue,
                    maxDiscount: couponToEdit.maxDiscount || undefined,
                    minPurchase: couponToEdit.minPurchase || undefined,
                    startDate: new Date(couponToEdit.startDate).toISOString().slice(0, 16),
                    endDate: couponToEdit.endDate ? new Date(couponToEdit.endDate).toISOString().slice(0, 16) : undefined,
                    usageLimit: couponToEdit.usageLimit || undefined,
                    isOneTimeUse: couponToEdit.isOneTimeUse ?? false,
                    isActive: couponToEdit.isActive,
                    applicableCourseIds: couponToEdit.applicableCourses?.map((c: any) => c.id) || [],
                });
            } else {
                // Reset
                setFormData({
                    code: "",
                    discountType: "FIXED_AMOUNT",
                    discountValue: 0,
                    startDate: new Date().toISOString().slice(0, 16),
                    isOneTimeUse: false,
                    isActive: true,
                    applicableCourseIds: [],
                });
            }
            setError(null);
        }
    }, [isOpen, couponToEdit]);

    const fetchCourses = async () => {
        try {
            const data = await courseApi.getAdmin({ limit: 100 });
            if (data.success) {
                setCourses(data.data?.courses || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const generateCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let autoCode = "";
        for (let i = 0; i < 8; i++) {
            autoCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData((prev) => ({ ...prev, code: autoCode }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Prepare payload (convert to proper types/nulls)
            const payload = {
                ...formData,
                discountValue: Number(formData.discountValue),
                maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
                minPurchase: formData.minPurchase ? Number(formData.minPurchase) : undefined,
                usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
                startDate: new Date(formData.startDate).toISOString(),
            };

            const data = couponToEdit
                ? await couponApi.update(couponToEdit.id, payload)
                : await couponApi.create(payload);

            if (data.success) {
                onSuccess();
            } else {
                setError(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            }
        } catch (err: any) {
            setError(err.message || "ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 p-5 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-gray-900">
                        {couponToEdit ? "แก้ไขคูปอง" : "สร้างคูปองส่วนลดใหม่"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Section 1: Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">ข้อมูลคูปอง</h3>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">รหัสคูปอง (Code) *</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    required
                                    placeholder="EX: SUMMER2026"
                                    className="flex-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase font-bold text-gray-900"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                                <Button type="button" variant="outline" onClick={generateCode} className="shrink-0 px-3">
                                    <RefreshCw size={16} className="mr-2" />
                                    สุ่มโค้ด
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ประเภทส่วนลด *</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    value={formData.discountType}
                                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                                >
                                    <option value="FIXED_AMOUNT">ลดจำนวนเงิน (บาท)</option>
                                    <option value="PERCENTAGE">ลดเป็นเปอร์เซ็นต์ (%)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    มูลค่าส่วนลด *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        inputMode="decimal"
                                        required
                                        className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={formData.discountValue === 0 ? "" : formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.valueAsNumber || 0 })}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                                        {formData.discountType === "PERCENTAGE" ? "%" : "฿"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Show Max Discount only if Percentage */}
                        {formData.discountType === "PERCENTAGE" && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ลดสูงสุด (บาท) <span className="text-gray-400 font-normal">(เว้นว่างเพื่อไม่จำกัด)</span></label>
                                <input
                                    type="number"
                                    min="1"
                                    inputMode="numeric"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    value={formData.maxDiscount || ""}
                                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.valueAsNumber || undefined })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Section 2: Conditions */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">เงื่อนไขเพิ่มเติม</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ขั้นต่ำในการซื้อ (บาท)</label>
                                <input
                                    type="number"
                                    min="0"
                                    inputMode="numeric"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    value={formData.minPurchase || ""}
                                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.valueAsNumber || undefined })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">จำกัดจำนวนสิทธิ์ (ครั้ง)</label>
                                <input
                                    type="number"
                                    min="1"
                                    inputMode="numeric"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    value={formData.usageLimit || ""}
                                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.valueAsNumber || undefined })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                เลือกคอร์สที่ร่วมรายการ <span className="text-gray-400 font-normal">(เว้นว่างเพื่อใช้ได้กับทุกคอร์ส)</span>
                            </label>
                            <div className="w-full max-h-48 overflow-y-auto bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2 custom-scrollbar">
                                {courses.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">กำลังโหลดรายชื่อคอร์ส...</p>
                                ) : (
                                    courses.map(course => (
                                        <label key={course.id} className="flex items-start gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100 hover:shadow-sm">
                                            <input
                                                type="checkbox"
                                                className="mt-0.5 w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                                checked={formData.applicableCourseIds.includes(course.id)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        applicableCourseIds: checked
                                                            ? [...prev.applicableCourseIds, course.id]
                                                            : prev.applicableCourseIds.filter(id => id !== course.id)
                                                    }));
                                                }}
                                            />
                                            <span className="text-sm text-gray-700 leading-tight block">{course.title}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                            <div className="flex justify-between items-center mt-2 px-1">
                                <p className="text-[11px] text-gray-500">เลือกคอร์สได้มากกว่า 1 รายการ</p>
                                <button
                                    type="button"
                                    className="text-[11px] text-primary font-medium hover:underline"
                                    onClick={() => {
                                        if (formData.applicableCourseIds.length === courses.length) {
                                            setFormData({ ...formData, applicableCourseIds: [] });
                                        } else {
                                            setFormData({ ...formData, applicableCourseIds: courses.map(c => c.id) });
                                        }
                                    }}
                                >
                                    {formData.applicableCourseIds.length === courses.length ? "ล้างการเลือกทั้งหมด" : "เลือกทั้งหมด"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Section 3: Time Period */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">ระยะเวลาการใช้งาน</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">เริ่มตั้งแต่ *</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">สิ้นสุดเวลา <span className="text-gray-400 font-normal">(ถ้ามี)</span></label>
                                <input
                                    type="datetime-local"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    value={formData.endDate || ""}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.isOneTimeUse}
                                    onChange={(e) => setFormData({ ...formData, isOneTimeUse: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                <span className="ml-3 text-sm font-medium text-gray-900">จำกัด 1 สิทธิ์ต่อ 1 บัญชีผู้ใช้</span>
                            </label>

                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                <span className="ml-3 text-sm font-medium text-gray-900">เปิดใช้งานทันที</span>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-100 pt-5 pb-2 -mx-6 px-6 flex justify-end gap-3 z-10">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            ยกเลิก
                        </Button>
                        <Button type="submit" variant="primary" isLoading={isSubmitting} className="px-8">
                            {couponToEdit ? "บันทึกการแก้ไข" : "สร้างคูปอง"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
