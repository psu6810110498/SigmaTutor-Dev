interface PromoBannerProps {
    text: string;
    isVisible?: boolean;
}

export default function PromoBanner({ text, isVisible = true }: PromoBannerProps) {
    if (!isVisible) return null;

    return (
        <div className="w-full bg-gray-100 border-y border-gray-200 py-3 px-4 text-center">
            <p className="text-sm md:text-base font-medium text-gray-800">
                {text}
            </p>
        </div>
    );
}
