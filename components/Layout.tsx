import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
    children: ReactNode;
    title?: string;
    noContainer?: boolean;
}

const Layout = ({ children, title = 'Portal Data Nusantara', noContainer = false }: LayoutProps) => {
    const { isLoading } = useAuth();

    // Show loading screen while validating session
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-background font-sans">
                <Head>
                    <title>{title}</title>
                    <meta name="description" content="Portal Data Nusantara Prototype" />
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                        <p className="mt-4 text-muted">Memvalidasi sesi...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background font-sans">
            <Head>
                <title>{title}</title>
                <meta name="description" content="Portal Data Nusantara Prototype" />
                <link rel="icon" href="/favicon.ico" />
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
            </Head>
            <Navbar />
            <main className={`flex-grow w-full ${noContainer ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
