"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaCreditCard, FaQrcode, FaUniversity, FaCheckCircle, FaLock } from 'react-icons/fa';

export default function PaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'qr' | 'bank'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // ข้อมูลจำลองสำหรับสรุปรายการ
  const mockOrder = {
    subtotal: 2499,
    discount: 0,
    total: 2499,
    items: [
      { id: 1, title: "ฟิสิกส์ A-Level (ฉบับแม่นยำ)", price: 2499 }
    ]
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // จำลองการโหลด (รอ 2 วินาที)
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

  // หน้าแสดงผลเมื่อจ่ายเงินสำเร็จ (Success State)
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-green-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 animate-bounce-short">
            <FaCheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ชำระเงินสำเร็จ!</h2>
          <p className="text-gray-500 mb-8">ขอบคุณที่สมัครเรียนกับเรา คอร์สเรียนของคุณพร้อมใช้งานแล้ว</p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left">
            <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">หมายเลขคำสั่งซื้อ</span>
                <span className="font-bold text-gray-900">#ORD-2024-8899</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">ยอดชำระ</span>
                <span className="font-bold text-primary">฿{mockOrder.total.toLocaleString()}</span>
            </div>
          </div>

          <Link href="/courses">
            <button className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30">
              ไปที่คอร์สเรียนของฉัน
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* Navbar แบบย่อ */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/courses" className="flex items-center text-gray-500 hover:text-primary transition-colors">
            <FaArrowLeft className="mr-2" /> ย้อนกลับ
          </Link>
          <div className="flex items-center gap-2">
             <div className="relative w-8 h-8">
               <Image src="/Sigma-logo.png" alt="Logo" fill className="object-contain"/>
             </div>
             <span className="font-bold text-lg text-gray-800">Secure Checkout</span>
          </div>
          <div className="w-20"></div> {/* Spacer จัดกึ่งกลาง */}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">เลือกวิธีการชำระเงิน</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Payment Methods Tabs */}
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <FaCreditCard size={24} />
                <span className="text-sm font-bold">บัตรเครดิต</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('qr')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'qr' ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <FaQrcode size={24} />
                <span className="text-sm font-bold">QR Code</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('bank')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'bank' ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <FaUniversity size={24} />
                <span className="text-sm font-bold">โอนเงิน</span>
              </button>
            </div>

            {/* Credit Card Form (แสดงเมื่อเลือกบัตรเครดิต) */}
            {paymentMethod === 'card' && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800">ข้อมูลบัตรเครดิต</h3>
                    <div className="flex gap-2">
                        {/* Mock Icons */}
                        <div className="w-8 h-5 bg-gray-200 rounded"></div>
                        <div className="w-8 h-5 bg-gray-200 rounded"></div>
                    </div>
                </div>
                <form onSubmit={handlePayment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">หมายเลขบัตร</label>
                        <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">วันหมดอายุ (MM/YY)</label>
                            <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CVC / CVV</label>
                            <input type="text" placeholder="123" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบนบัตร</label>
                        <input type="text" placeholder="JOHN DOE" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none uppercase" required />
                    </div>
                    
                    <button type="submit" disabled={isProcessing} className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center">
                        {isProcessing ? (
                             <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> กำลังประมวลผล...</>
                        ) : (
                             <>ยืนยันการชำระเงิน ฿{mockOrder.total.toLocaleString()}</>
                        )}
                    </button>
                    
                    <div className="text-center mt-4 text-xs text-gray-400 flex items-center justify-center gap-1">
                        <FaLock size={10} /> ข้อมูลของคุณถูกเข้ารหัสด้วยมาตรฐานความปลอดภัยระดับสูง (SSL)
                    </div>
                </form>
              </div>
            )}

            {/* QR Code Placeholder */}
            {paymentMethod === 'qr' && (
                <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm text-center animate-fade-in-up">
                    <div className="w-48 h-48 bg-gray-100 mx-auto rounded-lg mb-4 flex items-center justify-center text-gray-400">
                        <FaQrcode size={64} />
                    </div>
                    <p className="text-gray-500 mb-6">สแกน QR Code ผ่านแอปธนาคารเพื่อชำระเงิน</p>
                    <button onClick={handlePayment} disabled={isProcessing} className="w-full bg-primary text-white font-bold py-3 rounded-xl">
                        {isProcessing ? 'กำลังตรวจสอบ...' : 'ฉันโอนเงินแล้ว'}
                    </button>
                </div>
            )}
            
            {/* Bank Transfer Placeholder */}
            {paymentMethod === 'bank' && (
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm animate-fade-in-up">
                    <div className="flex items-center gap-4 mb-6 p-4 border border-blue-100 bg-blue-50 rounded-lg">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">K</div>
                        <div>
                            <p className="font-bold text-gray-900">ธนาคารกสิกรไทย</p>
                            <p className="text-gray-600">012-3-45678-9</p>
                            <p className="text-sm text-gray-500">บจก. ซิกม่า ติวเตอร์ อะคาเดมี</p>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">อัปโหลดสลิปโอนเงิน</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:bg-blue-50/50 transition-colors cursor-pointer">
                            <span>คลิกเพื่ออัปโหลดสลิป</span>
                        </div>
                    </div>
                    <button onClick={handlePayment} disabled={isProcessing} className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-6">
                        {isProcessing ? 'กำลังตรวจสอบ...' : 'แจ้งชำระเงิน'}
                    </button>
                </div>
            )}

          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-24">
                <h3 className="font-bold text-lg text-gray-900 mb-4">สรุปรายการสั่งซื้อ</h3>
                
                <div className="space-y-4 mb-6">
                    {mockOrder.items.map((item) => (
                        <div key={item.id} className="flex gap-3 text-sm">
                            <div className="w-16 h-12 bg-gray-100 rounded flex-shrink-0"></div>
                            <div className="flex-grow">
                                <p className="text-gray-800 font-medium line-clamp-2">{item.title}</p>
                                <p className="text-gray-500">฿{item.price.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                        <span>ยอดรวม</span>
                        <span>฿{mockOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>ส่วนลด</span>
                        <span className="text-green-500">-฿{mockOrder.discount}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-100 mt-2">
                        <span>ยอดชำระสุทธิ</span>
                        <span className="text-primary">฿{mockOrder.total.toLocaleString()}</span>
                    </div>
                </div>

                <div className="mt-6 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700 border border-yellow-100">
                    <span className="font-bold">✨ การันตีความพึงพอใจ:</span> หากไม่พอใจยินดีคืนเงินภายใน 7 วัน
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}