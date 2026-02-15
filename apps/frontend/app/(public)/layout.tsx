import { PublicNavbar } from "@/app/components/layouts/PublicNavbar";
import { PublicFooter } from "@/app/components/layouts/PublicFooter";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <PublicNavbar />
            <main className="pt-20 min-h-screen">{children}</main>
            <PublicFooter />
        </>
    );
}
