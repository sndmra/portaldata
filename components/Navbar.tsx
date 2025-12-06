import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

const Navbar = () => {
    const router = useRouter();
    const { isAuthenticated, logout, isLoading, isSysadmin, user } = useAuth();

    const isActive = (path: string) => router.pathname === path;

    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-border transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
                            <img
                                src="/logo.png"
                                alt="Portal Data IKN Logo"
                                className="w-8 h-8 object-contain"
                            />
                            <span className="text-xl font-bold text-text tracking-tight">
                                Portal Data <span className="text-primary">OIKN</span>
                            </span>
                        </Link>
                        <div className="hidden sm:flex sm:space-x-2">
                            <Link
                                href="/"
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive('/')
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted hover:text-text hover:bg-gray-50'
                                    }`}
                            >
                                Beranda
                            </Link>
                            <Link
                                href="/search"
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive('/search')
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted hover:text-text hover:bg-gray-50'
                                    }`}
                            >
                                Jelajah
                            </Link>
                            <Link
                                href="/upload"
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive('/upload')
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted hover:text-text hover:bg-gray-50'
                                    }`}
                            >
                                Upload Dataset
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {!isLoading && isAuthenticated() && (
                            <>
                                {isSysadmin && (
                                    <Link
                                        href="/admin"
                                        className="px-3 py-2 text-sm font-medium text-muted hover:text-primary transition-colors"
                                    >
                                        Admin Panel
                                    </Link>
                                )}

                                <div className="h-8 w-px bg-gray-200 mx-2"></div>

                                <Link
                                    href="/profile"
                                    className="flex items-center gap-3 pl-2 pr-4 py-1 rounded-full hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-sm group-hover:shadow transition-all">
                                        {user?.fullname ? user.fullname.charAt(0).toUpperCase() : (user?.display_name ? user.display_name.charAt(0).toUpperCase() : user?.name?.charAt(0).toUpperCase() || 'U')}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
                                            {user?.fullname || user?.display_name || user?.name}
                                        </span>
                                        <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                                            {isSysadmin ? 'Administrator' : 'User'}
                                        </span>
                                    </div>
                                </Link>

                                <button
                                    onClick={logout}
                                    className="p-2 text-muted hover:text-red-600 transition-colors"
                                    title="Logout"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </>
                        )}
                        {!isLoading && !isAuthenticated() && (
                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm font-medium text-primary hover:text-secondary focus:outline-none"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav >
    );
};

export default Navbar;
