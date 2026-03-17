import { PublicNavbar } from "@/app/components/layouts/PublicNavbar";
import { PublicFooter } from "@/app/components/layouts/PublicFooter";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <PublicNavbar />
            <main className="flex-1 pt-20">{children}</main>
            <PublicFooter />
        </div>
    );
}
