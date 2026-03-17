import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'เงื่อนไขการใช้งาน | Sigma Tutor',
};

export default function TermsPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-6">
            เงื่อนไขการใช้งาน (Terms of Use)
          </h1>
          
          <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed space-y-6">
            <p>
              ยินดีต้อนรับสู่ Sigma Tutor เว็บไซต์นี้จัดทำขึ้นเพื่อให้บริการแพลตฟอร์มการเรียนการสอนออนไลน์ 
              การที่คุณเข้าใช้งานเว็บไซต์นี้ถือว่าคุณได้อ่าน เข้าใจ และตกลงยอมรับเงื่อนไขการใช้งานต่างๆ ที่ระบุไว้ด้านล่างนี้
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. การสมัครใช้งาน</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>ผู้ใช้งานต้องให้ข้อมูลที่เป็นความจริง แตะต้องอัปเดตข้อมูลให้เป็นปัจจุบัน</li>
              <li>ผู้ใช้งานมีหน้าที่รักษาความลับของรหัสผ่านของตนเอง และรับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของท่าน</li>
              <li>ห้ามมิให้โอนสิทธิ์การใช้บัญชีให้แก่บุคคลอื่น หรือนำบัญชีไปใช้ในทางที่ผิดวัตถุประสงค์</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. ข้อจำกัดการใช้งานเนื้อหา</h2>
            <p>
              เนื้อหาทั้งหมดบนเว็บไซต์นี้ รวมถึง วิดีโอ เอกสาร รูปภาพ และข้อความ เป็นลิขสิทธิ์ของ Sigma Tutor และ/หรือผู้สอน 
              ผู้ใช้งานมีสิทธิ์เข้าถึงเนื้อหาเพื่อการศึกษาของตนเองเท่านั้น
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>ห้ามทำซ้ำ ดัดแปลง แจกจ่าย ดาวน์โหลด(วิดีโอ) หรือเผยแพร่เนื้อหาในเชิงพาณิชย์ หรือสาธารณะ โดยไม่ได้รับอนุญาต</li>
              <li>การบันทึกภาพหน้าจอหรือวิดีโอ(Screen-recording) อาจทำให้บัญชีของท่านถูกระงับการใช้งานถาวร</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. การซื้อคอร์สเรียนและการคืนเงิน</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>เมื่อทำการซื้อและชำระเงินเรียบร้อยแล้ว ผู้ใช้งานสามารถเข้าถึงคอร์สเรียนได้ตามระยะเวลาที่กำหนด</li>
              <li>Sigma Tutor ขอสงวนสิทธิ์ในการไม่คืนเงินสำหรับคอร์สเรียนที่ได้ทำการสั่งซื้อและเปิดใช้งานแล้วในทุกกรณี ยกเว้นเกิดจากความผิดพลาดของระบบ</li>
            </ul>

            <p className="text-sm text-gray-500 mt-12 bg-gray-50 p-4 rounded-xl">
              ประกาศเมื่อวันที่ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} <br/>
              ทางเราขอสงวนสิทธิ์ในการแก้ไขหรือเปลี่ยนแปลงเงื่อนไขการใช้งานนี้โดยไม่ต้องแจ้งให้ทราบล่วงหน้า
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
