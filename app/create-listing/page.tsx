'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from "@/components/Navbar";

// 🛠️ Core Marketplace Categories Array (Matches Homepage Pills exactly)
const MARKETPLACE_CATEGORIES = [
  "Electronics",
  "Books",
  "Fashion",
  "Food & Drinks",
  "Home Essentials",
  "Services"
];

export default function CreateListingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [universityId, setUniversityId] = useState<string | null>(null);

  // Form Field States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('Good');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Multi-Image State configuration (Max 5 files)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Fetch the active user session and their profile university link
  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Fetch profile to secure the campus mapping parameter
      const { data: profile } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('id', user.id)
        .single();

      if (profile?.university_id) {
        setUniversityId(profile.university_id);
      }
    };
    getUserAndProfile();

    // Clean up temporary image preview object URLs on component unmount
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [router, supabase]);

  // Handle appending files safely up to a maximum count of 5
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const incomingFiles = Array.from(e.target.files);
      const totalAvailableSlots = 5 - imageFiles.length;

      if (totalAvailableSlots <= 0) {
        alert("You have reached the maximum allocation limit of 5 images.");
        return;
      }

      const filesToAdd = incomingFiles.slice(0, totalAvailableSlots);

      const updatedFiles = [...imageFiles, ...filesToAdd];
      const updatedPreviews = [
        ...imagePreviews,
        ...filesToAdd.map((file) => URL.createObjectURL(file))
      ];

      setImageFiles(updatedFiles);
      setImagePreviews(updatedPreviews);
    }
  };

  // Remove a specific staged picture before initiating remote storage pipelines
  const removeImage = (indexToRemove: number) => {
    // Revoke object URL to clean up browser memory leaks
    URL.revokeObjectURL(imagePreviews[indexToRemove]);

    setImageFiles(imageFiles.filter((_, idx) => idx !== indexToRemove));
    setImagePreviews(imagePreviews.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("Session expired. Please re-authenticate.");
      return;
    }

    if (imageFiles.length === 0) {
      setError("Please upload at least one image showing your item.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const targetBucket = 'listing-images';
      const uploadedImageNames: string[] = []; // 🛠️ Track relative file path names instead of full external URLs

      // Loop and upload all files concurrently
      await Promise.all(
        imageFiles.map(async (file, index) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId}-${Date.now()}-${index}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from(targetBucket)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            throw new Error(`Storage Upload Failed for image ${index + 1}: ${uploadError.message}`);
          }

          // 🛠️ Save ONLY the path filename relative to the bucket storage system
          uploadedImageNames.push(fileName);
        })
      );

      // Extract the first item name to serve as the main cover image placeholder
      const primaryCoverName = uploadedImageNames[0] || null;

      // Submit listing values to database payload columns
      const { error: insertError } = await supabase
        .from('listings')
        .insert({
          seller_id: userId,
          university_id: universityId,
          title,
          description,
          price: parseFloat(price),
          is_negotiable: isNegotiable,
          category,
          condition,
          location,
          image_url: primaryCoverName, // 🛠️ Saves relative key reference name string
          image_urls: uploadedImageNames, // 🛠️ Saves array of key filenames
          whatsapp_number: whatsappNumber,
          status: 'active'
        });

      if (insertError) throw insertError;

      router.push('/');
      router.refresh();

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Navbar />

      <main className="flex-1 mx-auto max-w-2xl w-full px-6 py-12">
        <div className="mb-8 text-left space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Create a New Listing
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Fill out the details below to list your item on the student marketplace.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 font-medium text-left">
                ⚠️ {error}
              </div>
            )}

            {/* Listing Title */}
            <div className="text-left">
              <label className="block text-sm font-bold text-slate-700">Listing Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50 placeholder-slate-400"
                placeholder="Iphone 12 pro"
              />
            </div>

            {/* Category & Condition Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div>
                <label className="block text-sm font-bold text-slate-700">Category</label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select category</option>
                  {MARKETPLACE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700">Condition</label>
                <select
                  required
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
            </div>

            {/* Price Input & Price Type Selection Dropdown Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div>
                <label className="block text-sm font-bold text-slate-700">Price (₦)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50 placeholder-slate-400"
                  placeholder="230000"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700">Price Type</label>
                <select
                  required
                  value={isNegotiable ? "true" : "false"}
                  onChange={(e) => setIsNegotiable(e.target.value === "true")}
                  className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="true">Negotiable</option>
                  <option value="false">Non-negotiable</option>
                </select>
              </div>
            </div>

            {/* Item Location / Hostel */}
            <div className="text-left">
              <label className="block text-sm font-bold text-slate-700">Item Location / Hostel</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50 placeholder-slate-400"
                placeholder="e.g., Gida Dubu, Gandu, Hostel Block C"
              />
            </div>

            {/* WhatsApp Phone Number */}
            <div className="text-left">
              <label className="block text-sm font-bold text-slate-700">WhatsApp Phone Number</label>
              <input
                type="tel"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50 placeholder-slate-400"
                placeholder="e.g., +2348012345678"
              />
            </div>

            {/* Description */}
            <div className="text-left">
              <label className="block text-sm font-bold text-slate-700">Description</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50 resize-none placeholder-slate-400"
                placeholder="Describe the item condition, specs, meeting spot preferences..."
              />
            </div>

            {/* Upload Multi-Image Matrix (Allows up to 5 pictures) */}
            <div className="text-left">
              <div className="flex justify-between items-baseline">
                <label className="block text-sm font-bold text-slate-700">Upload Product Images</label>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {imageFiles.length} / 5 Images Selected
                </span>
              </div>

              <div className="mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors relative min-h-[120px]">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={imageFiles.length >= 5}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="text-center space-y-1 pointer-events-none">
                  <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-slate-500 font-medium">
                    {imageFiles.length >= 5 ? 'Maximum limit reached' : 'Select or drop up to 5 photos'}
                  </p>
                </div>
              </div>

              {/* Horizontal Multi-Thumbnail Previews Row Grid */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {imagePreviews.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                      <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-red-600 text-white shadow transition-colors"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3.5 w-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-orange-600/90 text-[10px] text-center text-white py-0.5 font-bold tracking-wide uppercase">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 transition-colors disabled:bg-slate-300 text-sm shadow-sm tracking-wide"
            >
              {loading ? 'Publishing Listing...' : 'Publish Listing'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}