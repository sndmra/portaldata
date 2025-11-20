import Layout from '@/components/Layout';

export default function Help() {
    return (
        <Layout title="Bantuan - Portal Data Nusantara">
            <div className="max-w-4xl mx-auto px-4 py-12 animate-fadeIn">
                <h1 className="text-3xl font-bold text-text mb-6">Pusat Bantuan</h1>
                <div className="grid gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                        <h2 className="text-xl font-bold text-text mb-3">Cara Mengunduh Dataset</h2>
                        <p className="text-muted">
                            Anda dapat mencari dataset melalui halaman "Jelajah", pilih dataset yang diinginkan, dan klik tombol unduh pada resource yang tersedia.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                        <h2 className="text-xl font-bold text-text mb-3">Cara Mengunggah Dataset</h2>
                        <p className="text-muted">
                            Untuk mengunggah dataset, Anda perlu mendaftar dan login terlebih dahulu. Setelah login, klik menu "Upload Dataset" di navbar.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                        <h2 className="text-xl font-bold text-text mb-3">Format File yang Didukung</h2>
                        <p className="text-muted">
                            Kami mendukung berbagai format file data terbuka seperti CSV, JSON, XML, serta format geospasial seperti GeoJSON dan KML.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
