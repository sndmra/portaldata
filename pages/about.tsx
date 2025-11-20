import Layout from '@/components/Layout';
import React from 'react';
import FadeIn from '@/components/FadeIn';

export default function About() {
    return (
        <Layout title="Tentang Kami - Portal Data OIKN" noContainer>
            {/* Section 1: Introduction & Mission */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Intro Text */}
                <div className="max-w-4xl mx-auto text-center mb-20 space-y-6">
                    <FadeIn direction="up">
                        <p className="text-lg text-muted leading-relaxed">
                            Portal digital terpadu ini dirancang untuk mendukung pengelolaan data strategis dalam mewujudkan Ibu Kota Nusantara (IKN) sebagai kota cerdas, berkelanjutan, dan inklusif. Portal ini mengintegrasikan berbagai sistem dan sumber data, memungkinkan pengambilan keputusan berbasis data di sektor pemerintahan, infrastruktur, transportasi, lingkungan, kesehatan, pendidikan, dan ekonomi.
                        </p>
                    </FadeIn>
                    <FadeIn direction="up" delay={200}>
                        <p className="text-lg text-muted leading-relaxed">
                            Dengan fitur seperti dashboard analitik, pelaporan real-time, dan teknologi cerdas seperti IoT, AI, dan big data, portal ini meningkatkan efisiensi operasional kota, meminimalkan dampak lingkungan, serta menciptakan inklusivitas. Fokus pada keberlanjutan meliputi pemantauan emisi karbon, pengelolaan energi terbarukan, dan pelestarian lingkungan, menjadikannya katalisator transformasi IKN sebagai model kota masa depan yang inovatif dan berwawasan sosial.
                        </p>
                    </FadeIn>
                </div>

                {/* Mission Header */}
                <FadeIn direction="up" delay={300}>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#8B7355] mb-10 text-center md:text-left">Misi Satu Data Ibu Kota Nusantara</h2>
                </FadeIn>

                {/* Mission Cards */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6 space-y-4">
                    {/* Card 1 */}
                    <FadeIn direction="left" delay={400}>
                        <div className="bg-[#F5E6D3] p-8 rounded-2xl flex items-center gap-6 hover:shadow-lg transition-shadow">
                            <div className="flex-shrink-0">
                                <svg className="w-16 h-16 text-[#6D5B45]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#6D5B45] mb-2">Pengambilan Keputusan Berbasis Data</h3>
                                <p className="text-[#8B7355]">Data relevan untuk transparansi dan efektivitas keputusan.</p>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Card 2 */}
                    <FadeIn direction="left" delay={500}>
                        <div className="bg-[#D9AB6C] p-8 rounded-2xl flex items-center gap-6 hover:shadow-lg transition-shadow">
                            <div className="flex-shrink-0">
                                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Ekosistem Data Terintegrasi</h3>
                                <p className="text-white/90">Kolaborasi lintas sektor untuk pengelolaan data berkelanjutan.</p>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Card 3 */}
                    <FadeIn direction="left" delay={600}>
                        <div className="bg-[#F5E6D3] p-8 rounded-2xl flex items-center gap-6 hover:shadow-lg transition-shadow">
                            <div className="flex-shrink-0">
                                <svg className="w-16 h-16 text-[#6D5B45]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#6D5B45] mb-2">Ketepatan dan Keakuratan Data</h3>
                                <p className="text-[#8B7355]">Data terintegrasi, valid, dan selalu diperbarui.</p>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </div>

            {/* Section 2: Access Data */}
            <div className="bg-[#3A4A5B] py-20 relative overflow-hidden">
                {/* Background Overlay/Image placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2C3E50] to-[#4CA1AF] opacity-90"></div>
                <div className="absolute inset-0 bg-[url('/hero.jpg')] bg-cover bg-center mix-blend-overlay opacity-20"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <FadeIn direction="up">
                        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
                            Akses Data untuk Masa Depan Ibu Kota<br />Nusantara
                        </h2>
                    </FadeIn>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column: Investor (Large) */}
                        <FadeIn direction="right" delay={200} className="h-full">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-10 flex flex-col justify-center min-h-[300px] h-full hover:bg-white/15 transition-colors group">
                                <div className="mb-6">
                                    <svg className="w-20 h-20 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-[#D9AB6C] mb-3">Investor & Pelaku Bisnis</h3>
                                <p className="text-gray-200 text-lg">Data terintegrasi, valid, dan selalu diperbarui.</p>
                            </div>
                        </FadeIn>

                        {/* Right Column: 2 Cards */}
                        <div className="flex flex-col gap-6">
                            {/* Top Right: Govt */}
                            <FadeIn direction="left" delay={300}>
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 flex items-center gap-6 hover:bg-white/15 transition-colors group flex-1">
                                    <div className="flex-shrink-0">
                                        <svg className="w-16 h-16 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#D9AB6C] mb-2">Lembaga Pemerintah</h3>
                                        <p className="text-gray-200">Data relevan untuk transparansi dan efektivitas keputusan.</p>
                                    </div>
                                </div>
                            </FadeIn>

                            {/* Bottom Right: International */}
                            <FadeIn direction="left" delay={400}>
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 flex items-center gap-6 hover:bg-white/15 transition-colors group flex-1">
                                    <div className="flex-shrink-0">
                                        <svg className="w-16 h-16 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#D9AB6C] mb-2">Komunitas Internasional</h3>
                                        <p className="text-gray-200">Kolaborasi lintas sektor untuk pengelolaan data berkelanjutan.</p>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Why Satu Data */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left: Title */}
                    <div className="lg:col-span-4">
                        <FadeIn direction="right">
                            <h2 className="text-4xl md:text-5xl font-bold text-[#8B7355] leading-tight">
                                Mengapa Satu Data<br />Ibu Kota Nusantara ?
                            </h2>
                        </FadeIn>
                    </div>

                    {/* Right: Cards Grid */}
                    <div className="lg:col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Card 1: Alat Pendukung (Beige) */}
                            <FadeIn direction="up" delay={100}>
                                <div className="bg-[#F5E6D3] p-8 rounded-3xl hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                                    <div className="mb-4">
                                        <svg className="w-10 h-10 text-[#6D5B45]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#6D5B45] mb-3">Alat Pendukung Keputusan</h3>
                                    <p className="text-[#8B7355] text-sm leading-relaxed">
                                        Menyediakan data terintegrasi dan terpercaya untuk mendukung pengambilan keputusan yang tepat, efektif, dan berbasis bukti dalam pembangunan IKN.
                                    </p>
                                </div>
                            </FadeIn>

                            {/* Card 2: Dasbor Interaktif (Gold) */}
                            <FadeIn direction="up" delay={200} className="md:mt-12">
                                <div className="bg-[#D9AB6C] p-8 rounded-3xl hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                                    <div className="mb-4">
                                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">Dasbor Interaktif</h3>
                                    <p className="text-white/90 text-sm leading-relaxed">
                                        Menampilkan visualisasi data yang mudah dipahami melalui dasbor dinamis, memungkinkan pemantauan kinerja, evaluasi, dan analisis secara real-time.
                                    </p>
                                </div>
                            </FadeIn>

                            {/* Card 3: Satu Data Pembangunan (Gold) */}
                            <FadeIn direction="up" delay={300}>
                                <div className="bg-[#D9AB6C] p-8 rounded-3xl hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                                    <div className="mb-4">
                                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">Satu Data Pembangunan IKN</h3>
                                    <p className="text-white/90 text-sm leading-relaxed">
                                        Mengintegrasikan data lintas sektor untuk memastikan keselarasan, akurasi, dan konsistensi informasi dalam perencanaan dan pelaksanaan pembangunan IKN.
                                    </p>
                                </div>
                            </FadeIn>

                            {/* Card 4: Partner (Beige) */}
                            <FadeIn direction="up" delay={400} className="md:mt-12">
                                <div className="bg-[#F5E6D3] p-8 rounded-3xl hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                                    <div className="mb-4">
                                        <svg className="w-10 h-10 text-[#6D5B45]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#6D5B45] mb-3">Partner dan Sumber Data</h3>
                                    <p className="text-[#8B7355] text-sm leading-relaxed">
                                        Bersumber dari IKN dan berkolaborasi dengan berbagai pemangku kepentingan untuk menciptakan ekosistem data yang holistik dan berkelanjutan.
                                    </p>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
