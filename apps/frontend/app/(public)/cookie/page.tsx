import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'นโยบายคุกกี้ | Sigma Tutor',
};

export default function CookiePage() {
  return (
    <div className="bg-gray-50 min-h-screen py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-6">
            นโยบายคุกกี้ (Cookie Policy)
          </h1>
          
          <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed space-y-6">
            <p>
              เมื่อท่านเข้าชมเว็บไซต์ Sigma Tutor อาจมีการจัดเก็บหรือกู้คืนข้อมูลจากเบราว์เซอร์ของท่าน 
              ส่วนใหญ่แล้วจะอยู่ในรูปแบบของคุกกี้ ข้อมูลเหล่านี้อาจเกี่ยวกับท่าน เกี่ยวกับความพึงพอใจของท่าน 
              หรือเกี่ยวกับอุปกรณ์ของท่าน นโยบายนี้อธิบายการใช้งานคุกกี้ของเรา
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">คุกกี้คืออะไร?</h2>
            <p>
              คุกกี้ (Cookies) คือไฟล์ข้อมูลขนาดเล็กที่ถูกส่งและลงบันทึกในอุปกรณ์ของท่าน (เช่น คอมพิวเตอร์ สมาร์ทโฟน แท็บเล็ต) 
              เมื่อท่านเข้าเยี่ยมชมเว็บไซต์ คุกกี้เป็นสิ่งที่มีประโยชน์ในการช่วยให้เว็บไซต์สามารถจดจำอุปกรณ์ของท่านได้
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">เราใช้คุกกี้เพื่ออะไร?</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-gray-900">คุกกี้ที่จำเป็นอย่างยิ่ง (Strictly Necessary Cookies):</strong> จำเป็นสำหรับการทำงานของเว็บไซต์ เช่น การเข้าสู่ระบบบัญชีผู้ใช้ หรือการจดจำสินค้าในตะกร้า ไม่สามารถปิดการใช้งานในระบบของเราได้</li>
              <li><strong className="text-gray-900">คุกกี้เพื่อประสิทธิภาพ (Performance Cookies):</strong> ช่วยให้เรานับจำนวนการเข้าชมและแหล่งที่มาของการเข้าชม เพื่อปรับปรุงการทำงานของเว็บไซต์ให้ดีขึ้น</li>
              <li><strong className="text-gray-900">คุกกี้เพื่อการทำงานของเว็บไซต์ (Functional Cookies):</strong> ช่วยให้เว็บไซต์สามารถให้ฟังก์ชั่นและการปรับแต่งเนื้อหาให้เข้ากับผู้ใช้ได้มากขึ้น เช่น การจดจำรายละเอียดการตั้งค่า</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">การจัดการคุกกี้</h2>
            <p>
              คุณสามารถแก้ไขการตั้งค่าเบราว์เซอร์ของคุณเพื่อปฏิเสธคุกกี้ทั้งหมดหรือแจ้งเตือนเมื่อมีคุกกี้ถูกส่งมาได้ 
              อย่างไรก็ตาม หากคุณไม่ยอมรับคุกกี้ คุณอาจไม่สามารถใช้ฟังก์ชันบางส่วนของเว็บไซต์เราได้อย่างเต็มรูปแบบ โดยเฉพาะการเข้าสู่ระบบ
            </p>

            <p className="text-sm text-gray-500 mt-12 bg-gray-50 p-4 rounded-xl">
              หากคุณใช้งานเว็บไซต์ของเราต่อไปโดยไม่มีการเปลี่ยนแปลงการตั้งค่า เราจะถือว่าคุณยินยอมให้เราใช้คุกกี้ตามนโยบายนี้
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
