import { Trash2, Tag, Flame } from 'lucide-react';
import type { CartItem } from '@/app/context/CourseContext';

interface CartItemCardProps {
    item: CartItem;
    onRemove: (id: string) => void;
}

export function CartItemCard({ item, onRemove }: CartItemCardProps) {
    // Determine course type label
    const courseTypeLabel =
        item.courseType === 'ONLINE' ? 'Online' :
            item.courseType === 'ONLINE_LIVE' ? 'Live Online' :
                item.courseType === 'ONSITE' ? 'Onsite' : null;

    const hasDiscount = item.originalPrice && item.originalPrice > item.price;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            {/* Course thumbnail */}
            <div className="w-full sm:w-24 h-32 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100 relative">
                {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl">📚</span>
                    </div>
                )}

                {/* Course Type Badge */}
                {courseTypeLabel && (
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md">
                        {courseTypeLabel}
                    </div>
                )}
            </div>

            {/* Course info */}
            <div className="flex-1 min-w-0 w-full space-y-1">
                <div className="flex items-center gap-2 mb-1">
                    {item.category && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary/80 uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-full">
                            <Tag size={10} />
                            {item.category}
                        </span>
                    )}
                    {item.isBestSeller && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-full">
                            <Flame size={12} className="fill-orange-500" />
                            HOT
                        </span>
                    )}
                </div>

                <h3 className="font-bold text-gray-900 line-clamp-2 md:line-clamp-1">{item.title}</h3>

                {item.instructor && (
                    <p className="text-sm text-gray-500">{item.instructor}</p>
                )}
            </div>

            {/* Price + Remove (Right aligned on desktop, flex-row on mobile) */}
            <div className="flex w-full sm:w-auto items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0 sm:pl-4 sm:border-l border-gray-100">
                <div className="flex flex-col items-end">
                    {hasDiscount && (
                        <span className="text-sm font-medium text-gray-400 line-through">
                            ฿{item.originalPrice?.toLocaleString()}
                        </span>
                    )}
                    <span className="font-bold text-primary text-[1.35rem] leading-none">
                        ฿{item.price.toLocaleString()}
                    </span>
                </div>

                <button
                    onClick={() => onRemove(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    title="ลบออกจากตะกร้า"
                >
                    <Trash2 size={16} />
                    <span className="sm:hidden font-medium">ลบออก</span>
                </button>
            </div>
        </div>
    );
}
