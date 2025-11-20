import Layout from '@/components/Layout';

export default function Contact() {
    return (
        <Layout title="Kontak - Portal Data Nusantara">
            <div className="max-w-4xl mx-auto px-4 py-12 animate-fadeIn">
                <h1 className="text-3xl font-bold text-text mb-6">Hubungi Kami</h1>
                <div className="bg-white rounded-xl shadow-sm border border-border p-8">
                    <p className="text-muted mb-6">
                        Kami menghargai masukan dan pertanyaan Anda. Silakan hubungi kami melalui saluran berikut:
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-medium text-text">Email</h3>
                                <p className="text-muted">kontak@portaldatanusantara.id</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-medium text-text">Alamat</h3>
                                <p className="text-muted">Jakarta, Indonesia</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
