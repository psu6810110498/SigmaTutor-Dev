'use client';

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { availabilityApi } from '@/app/lib/api';

interface Props {
  courseId: string;
  courseTitle: string;
}

export function NotifyWhenAvailable({ courseId, courseTitle }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const res = await availabilityApi.notifyWhenAvailable(courseId, email.trim());

    if (res.success) {
      setIsSubmitted(true);
    } else {
      setError(res.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-orange-300 text-orange-600 text-sm font-medium hover:bg-orange-50 transition-colors"
      >
        <Bell size={15} />
        แจ้งเตือนเมื่อมีที่ว่าง
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">แจ้งเตือนเมื่อมีที่ว่าง</h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{courseTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            {isSubmitted ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell size={20} className="text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">รับทราบแล้ว!</p>
                <p className="text-xs text-gray-500 mt-1">
                  เราจะแจ้งเตือนคุณทันทีที่มีที่นั่งว่าง
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-4 text-sm text-primary font-medium"
                >
                  ปิด
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-sm text-gray-600">
                  กรอกอีเมลของคุณ เราจะแจ้งทันทีเมื่อที่นั่งว่าง
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-orange-300 outline-none"
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'แจ้งเตือนฉัน'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
