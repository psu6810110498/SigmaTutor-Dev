import { SigmaLogo } from "@/app/components/icons/SigmaLogo";

export default function AboutPage() {
    return (
        <div className="bg-white">
            {/* Hero */}
            <div className="bg-slate-900 py-20 text-white text-center">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="flex justify-center mb-6">
                        <SigmaLogo size="lg" variant="light" />
                    </div>
                    <h1 className="text-4xl font-bold mb-6">เกี่ยวกับ Sigma Tutor</h1>
                    <p className="text-xl text-slate-300">
                        แพลตฟอร์มการเรียนรู้ออนไลน์ที่มุ่งมั่นยกระดับการศึกษาไทย ด้วยคอร์สเรียนคุณภาพจากติวเตอร์ชั้นนำ
                    </p>
                </div>
            </div>

            {/* Mission */}
            <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">ภารกิจของเรา</h2>
                        <p className="text-gray-600 text-lg leading-relaxed mb-6">
                            เราเชื่อว่าทุกคนควรเข้าถึงการศึกษาที่มีคุณภาพได้ทุกที่ ทุกเวลา Sigma Tutor จึงถูกสร้างขึ้นเพื่อเป็นสะพานเชื่อมระหว่างผู้เรียนและผู้สอนที่มีความเชี่ยวชาญ
                        </p>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            ด้วยเทคโนโลยีที่ทันสมัยและเนื้อหาที่เข้มข้น เราพร้อมที่จะเป็นส่วนหนึ่งในความสำเร็จทางการศึกษาของคุณ
                        </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl h-80 flex items-center justify-center">
                        <span className="text-gray-400 font-medium">ภาพประกอบ Team / Mission</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-primary/5 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { label: "ผู้เรียน", value: "10,000+" },
                            { label: "คอร์สเรียน", value: "500+" },
                            { label: "ติวเตอร์", value: "50+" },
                            { label: "ความพึงพอใจ", value: "4.9/5" },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                                <div className="text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
