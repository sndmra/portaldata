import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-border mt-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <img
                            src="/logo.png"
                            alt="Portal Data OIKN Logo"
                            className="w-8 h-8 object-contain"
                        />
                        <p className="text-sm text-muted">
                            &copy; {new Date().getFullYear()} Portal Data Otorita Ibu Kota Nusantara. All rights reserved.
                        </p>
                    </div>
                    <div className="flex space-x-8">
                        <Link href="/about" className="text-sm text-muted hover:text-primary transition-all duration-300 hover:translate-y-[-2px] inline-block">
                            Tentang Kami
                        </Link>
                        <Link href="/contact" className="text-sm text-muted hover:text-primary transition-all duration-300 hover:translate-y-[-2px] inline-block">
                            Kontak
                        </Link>
                        <Link href="/help" className="text-sm text-muted hover:text-primary transition-all duration-300 hover:translate-y-[-2px] inline-block">
                            Bantuan
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
