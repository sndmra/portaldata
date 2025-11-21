import { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Layout from '@/components/Layout';
import DatasetCard from '@/components/DatasetCard';
import { useAuth } from '@/hooks/useAuth';

import { getCkanUrl } from '@/lib/ckan';

// Use localhost:5001 for server-side/client-side consistency in this prototype
// const CKAN_API = 'http://localhost:5001/api/3';

interface Dataset {
  id: string;
  title: string;
  notes?: string;
  num_resources?: number;
  metadata_modified?: string;
  private?: boolean;
  organization?: {
    title: string;
    image_url?: string;
  };
  tags?: { name: string }[];
}

const useCountUp = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  // Adjust duration based on count size to prevent "hanging" on small numbers
  const actualDuration = useMemo(() => {
    if (end < 20) return end * 100; // 6 -> 600ms
    if (end < 100) return 1500;
    return duration;
  }, [end, duration]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / actualDuration, 1);

      // Use linear easing for small numbers for steady counting
      // Use easeOutCubic for larger numbers for "landing" effect
      const currentCount = end < 20
        ? Math.floor(percentage * end)
        : Math.floor((1 - Math.pow(1 - percentage, 3)) * end);

      if (currentCount !== countRef.current) {
        countRef.current = currentCount;
        setCount(currentCount);
      }

      if (progress < actualDuration) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, actualDuration]);

  return count;
};

const MetricCard = ({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) => {
  const count = useCountUp(value);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-border flex items-center space-x-4 hover:shadow-md transition-shadow duration-300">
      <div className="p-3 bg-primary/10 rounded-lg text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted font-medium">{label}</p>
        <p className="text-2xl font-bold text-text">{count.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default function Home() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    datasets: 0,
    organizations: 0,
    groups: 0
  });

  const { getApiKey, isLoading: authLoading, apiKey } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [apiKey, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers: any = {};
      const key = getApiKey();
      if (key) headers.Authorization = key;

      // Fetch Top 3 Datasets and Statistics using proxy API
      const datasetsReq = axios.get('/api/search', {
        params: { rows: 3, sort: 'metadata_modified desc', include_private: true },
        headers
      });

      const statsReq = axios.get('/api/stats', { headers });

      const [datasetsRes, statsRes] = await Promise.all([
        datasetsReq,
        statsReq
      ]);

      setDatasets(datasetsRes.data.result.results);
      setMetrics({
        datasets: statsRes.data.result.datasets,
        organizations: statsRes.data.result.organizations,
        groups: statsRes.data.result.groups
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout noContainer>
      {/* Hero Section */}
      <div className="relative bg-gray-900 min-h-[calc(100vh-64px)] flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/hero.jpg"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-gray-900/90"></div>
        </div>

        <div className="relative text-center px-4 sm:px-6 lg:px-8 w-full max-w-5xl mx-auto -mt-20">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl animate-fadeIn drop-shadow-2xl tracking-wide">
            Portal Data <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200">Otorita Ibu Kota Nusantara</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-100 animate-fadeIn-delay-1 drop-shadow-lg font-light leading-relaxed">
            Temukan, jelajahi, dan gunakan data terbuka dari pemerintah untuk inovasi dan transparansi pembangunan ibu kota masa depan.
          </p>

          {/* Fake Search Bar (Redirects to /search) */}
          <div className="mt-12 animate-fadeIn-delay-2 relative max-w-3xl mx-auto">
            <Link href="/search" className="block group">
              <div className="relative transition-transform duration-300 hover:-translate-y-1 transform">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                  <svg className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="block w-full pl-16 pr-24 py-5 border-0 rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl text-left text-gray-500 text-lg cursor-pointer group-hover:bg-white transition-all ring-1 ring-white/20 group-hover:ring-primary/50">
                  Cari dataset, organisasi, grup...
                </div>
                <div className="absolute inset-y-0 right-2 flex items-center">
                  <span className="bg-primary hover:bg-secondary text-white px-8 py-3 rounded-xl text-base font-semibold shadow-lg transition-all duration-300 transform group-hover:scale-105">
                    Cari
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Metrics Section */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 animate-fadeIn-delay-3 relative z-10 -mt-24 mb-16">
          <MetricCard
            label="Total Dataset"
            value={metrics.datasets}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            }
          />
          <MetricCard
            label="Organisasi"
            value={metrics.organizations}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <MetricCard
            label="Grup Data"
            value={metrics.groups}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
        </div>


        {/* Latest Datasets */}
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-text">Dataset Terkini</h2>
              <p className="text-muted mt-1">Data terbaru yang baru saja dipublikasikan</p>
            </div>
            <Link href="/search" className="text-primary hover:text-secondary font-medium flex items-center gap-1 transition-colors">
              Lihat Semua
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-border h-64 animate-pulse">
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : datasets.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {datasets.map((dataset) => (
                <DatasetCard key={dataset.id} dataset={dataset} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-text">Belum ada dataset</h3>
              <p className="mt-1 text-sm text-muted">Jadilah yang pertama mempublikasikan data.</p>
            </div>
          )}
        </div>
      </div>
    </Layout >
  );
}
