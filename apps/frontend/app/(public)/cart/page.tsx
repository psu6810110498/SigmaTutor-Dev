// 🛒 /cart เปลี่ยนเส้นทางถาวรไปยัง /checkout
// เหตุผล: ยุบรวม Cart และ Checkout ให้เป็นหน้าเดียวกันเพื่อประสบการณ์ที่ดีกว่า

import { redirect } from 'next/navigation';

export default function CartPage() {
  redirect('/checkout');
}
