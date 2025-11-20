import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Head from 'next/head';

interface LayoutProps {
    children: ReactNode;
    title?: string;
    noContainer?: boolean;
}

const Layout = ({ children, title = 'Portal Data Nusantara', noContainer = false }: LayoutProps) => {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans">
            <Head>
                <title>{title}</title>
                <meta name="description" content="Portal Data Nusantara Prototype" />
                <link rel="icon" href="/favicon.ico" />
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
