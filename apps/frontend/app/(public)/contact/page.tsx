import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">ติดต่อเรา</h1>
        <p className="text-xl text-gray-600">
          มีคำถามหรือข้อสงสัย? ทีมงานของเราพร้อมให้ความช่วยเหลือ
        </p>
      </div>

      {/* Google Maps Embed */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 mb-12">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1980.0098549990269!2d100.50180154634094!3d7.006961747682355!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x304d29a35221ef43%3A0x1f32585bafa40d2a!2z4Liq4Liy4LiC4Liy4Lin4Li04LiK4Liy4Lin4Li04Lio4Lin4LiB4Lij4Lij4Lih4LiE4Lit4Lih4Lie4Li04Lin4LmA4LiV4Lit4Lij4LmMIOC4hOC4k-C4sOC4p-C4tOC4qOC4p-C4geC4o-C4o-C4oeC4qOC4suC4quC4leC4o-C5jCDguKHguKvguLLguKfguLTguJfguKLguLLguKXguLHguKLguKrguIfguILguKXguLLguJnguITguKPguLTguJnguJfguKPguYw!5e0!3m2!1sth!2sth!4v1771528192458!5m2!1sth!2sth"
          width="100%"
          height="300"
          style={{ border: 'none' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="แผนที่ Sigma Tutor"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Contact Info */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">ข้อมูลติดต่อ</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">อีเมล</p>
                  <p className="text-gray-600">support@sigmatutor.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">โทรศัพท์</p>
                  <p className="text-gray-600">02-123-4567</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">ที่อยู่</p>
                  <p className="text-gray-600">
                    สาขาวิชาวิศวกรรมคอมพิวเตอร์ คณะวิศวกรรมศาสตร์ มหาวิทยาลัยสงขลานครินทร์
                    <br />
                    15 ถ. กาญจนวนิช ตำบล คอหงส์ อำเภอหาดใหญ่ สงขลา 90110
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">ส่งข้อความถึงเรา</h3>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="ชื่อ-นามสกุล" placeholder="กรอกชื่อของคุณ" />
                <Input label="อีเมล" type="email" placeholder="example@email.com" />
              </div>
              <Input label="หัวข้อเรื่อง" placeholder="ระบุหัวข้อที่ต้องการติดต่อ" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ข้อความ</label>
                <textarea
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                  placeholder="รายละเอียดสั้นๆ..."
                ></textarea>
              </div>
              <Button size="lg" className="w-full md:w-auto">
                ส่งข้อความ
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
