'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DashboardPage() {
    const router = useRouter();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [listings, setListings] = useState<any[]>([]);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                    router.push('/login');
                    return;
                }

                // Fetch user profile
                const { data: profileRow, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError || !profileRow?.is_verified) {
                    router.push('/verify');
                    return;
                }
                setProfile(profileRow);

                // Fetch user's active items from the listings table using 'seller_id'
                const { data: userListings } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('seller_id', user.id) // Fixed: Changed from user_id to seller_id
                    .order('created_at', { ascending: false });

                if (userListings) {
                    setListings(userListings);
                }

            } catch (err) {
                console.error('Error loading dashboard data:', err);
            } finally {
                setLoading(false);
            }
        }

        loadDashboardData();
    }, [router, supabase]);

    // Handle Avatar Image Upload directly into root bucket to prevent bucket-not-found issues
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploadingAvatar(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            // Saved directly in root directory of bucket
            const filePath = `avatar-${profile.id}-${Date.now()}.${fileExt}`;

            // Upload directly to root of 'listing-images' bucket
            const { error: uploadError } = await supabase.storage
                .from('listing-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Generate public url access link
            const { data: { publicUrl } } = supabase.storage
                .from('listing-images')
                .getPublicUrl(filePath);

            // Update user database row profile sync
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', profile.id);

            if (updateError) throw updateError;

            setProfile({ ...profile, avatar_url: publicUrl });
            alert('Profile picture updated successfully!');
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Error updating profile image.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
                    <p className="text-sm font-semibold text-gray-500">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">

            {/* Sharp Top Navbar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-2xl font-bold tracking-tight text-orange-600">
                        YOUnimart
                    </Link>
                    <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
                        <Link href="/" className="hover:text-orange-600 transition-colors">Marketplace</Link>
                        <Link href="/dashboard" className="text-orange-600">Dashboard</Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLogout}
                        className="text-sm font-semibold text-slate-600 hover:text-slate-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-all"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Container */}
            <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">

                {/* Profile Card Block */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        {/* Circle Profile Image Component */}
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center relative">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-slate-400">
                                        {profile?.full_name?.charAt(0).toUpperCase() || 'S'}
                                    </span>
                                )}

                                {/* Upload Hover Overlay */}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                    <span className="text-[10px] text-white font-bold text-center px-1">CHANGE</span>
                                </div>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">{profile?.full_name}</h1>
                                <span className="text-[11px] bg-orange-50 text-orange-600 font-bold px-2.5 py-0.5 rounded-full border border-orange-100 flex items-center gap-1 shadow-sm">
                                    ✓ Verified Student
                                </span>
                            </div>
                            <p className="text-sm font-medium text-slate-500">{profile?.university || 'Federal University Dutse'}</p>
                            <p className="text-xs font-mono text-slate-400 bg-gray-100 px-2 py-0.5 rounded-md inline-block">{profile?.matric_number}</p>
                        </div>
                    </div>

                    <Link
                        href="/create-listing"
                        className="w-full md:w-auto text-center font-bold text-white bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-xl transition-all shadow-sm text-sm tracking-wide"
                    >
                        {uploadingAvatar ? 'Uploading Picture...' : '+ Post New Item'}
                    </Link>
                </div>

                {/* Dynamic Analytics Stats Panel */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Your Active Items', value: listings.length },
                        { label: 'Total Views', value: '0' },
                        { label: 'Offers Received', value: '0' },
                        { label: 'Items Sold', value: '0' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Marketplace Management Layout */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Manage Your Active Listings</h2>

                    {listings.length === 0 ? (
                        <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
                            <div className="h-14 w-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto text-orange-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-700">No products uploaded yet</p>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto">Got old textbooks, electronics, or hostel accessories? Turn them into fast cash on campus right now.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {listings.map((item) => (
                                <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                                    <div className="h-44 bg-gray-50 relative flex items-center justify-center border-b border-gray-100">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-semibold text-slate-400">No Product Image</span>
                                        )}
                                        <span className="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-wider bg-white px-2 py-0.5 rounded-md shadow-sm text-slate-600 border border-gray-100">
                                            {item.category}
                                        </span>
                                    </div>
                                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{item.title}</h3>
                                            <p className="text-slate-500 text-xs line-clamp-2 mt-0.5">{item.description}</p>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                            <span className="text-sm font-bold text-orange-600">₦{item.price.toLocaleString()}</span>
                                            <span className="text-[11px] font-semibold text-slate-400">{item.location}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}