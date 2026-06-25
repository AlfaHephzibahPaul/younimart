"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface CreateListingFormProps {
  userId: string;
  universityId: string;
}

const CATEGORIES = [
  "Electronics",
  "Books",
  "Fashion",
  "Food & Drinks",
  "Home Essentials",
  "Services",
  "Other",
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function CreateListingForm({
  userId,
  universityId,
}: CreateListingFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState(CONDITIONS[0].value);
  const [description, setDescription] = useState("");
  
  // Selected files & previews
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // File drag state
  const [isDragging, setIsDragging] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  }

  function addFiles(files: File[]) {
    setError(null);
    const maxFiles = 6;
    const maxBytes = 5 * 1024 * 1024; // 5MB

    if (selectedFiles.length + files.length > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} photos.`);
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPG, JPEG, and PNG images are allowed.");
        return;
      }
      if (file.size > maxBytes) {
        setError(`File "${file.name}" exceeds the 5MB size limit.`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  }

  function removeFile(index: number) {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index]);
    
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Drag handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    addFiles(files);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    // Validate images count
    if (selectedFiles.length < 1) {
      setError("Please upload at least 1 photo for your listing.");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid price greater than 0.");
      return;
    }

    setIsLoading(true);

    try {
      const uploadedUrls: string[] = [];

      // 1. Upload each photo to 'listing-photos' storage bucket
      for (let i = 0; i < selectedFiles.length; i++) {
        setProgressMessage(`Uploading photo ${i + 1} of ${selectedFiles.length}...`);
        
        const file = selectedFiles[i];
        const fileExt = file.name.split(".").pop();
        const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Failed to upload image ${i + 1}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("listing-images")
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          throw new Error(`Failed to retrieve URL for image ${i + 1}`);
        }

        uploadedUrls.push(urlData.publicUrl);
      }

      setProgressMessage("Saving listing draft...");

      // 2. Insert record in listings table as draft
      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .insert({
          user_id: userId,
          university_id: universityId,
          title: title.trim(),
          description: description.trim(),
          price: priceNum,
          category,
          condition,
          image_urls: uploadedUrls,
          status: "draft",
        })
        .select("id")
        .single();

      if (listingError) {
        throw new Error(`Failed to save listing: ${listingError.message}`);
      }

      setProgressMessage("Listing saved! Redirecting to plans...");
      router.push(`/subscription-plans?listing=${listingData.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <svg
            className="h-5 w-5 shrink-0 text-red-500 mt-0.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {/* Main Details Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-sm font-semibold text-gray-700"
          >
            Listing Title
          </label>
          <input
            id="title"
            type="text"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. iPhone 13 Pro Max - 256GB"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none ring-brand-green focus:border-brand-green focus:ring-2"
          />
        </div>

        {/* Category & Condition Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="category"
              className="mb-1.5 block text-sm font-semibold text-gray-700"
            >
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none ring-brand-green focus:border-brand-green focus:ring-2"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="condition"
              className="mb-1.5 block text-sm font-semibold text-gray-700"
            >
              Condition
            </label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none ring-brand-green focus:border-brand-green focus:ring-2"
            >
              {CONDITIONS.map((cond) => (
                <option key={cond.value} value={cond.value}>
                  {cond.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price */}
        <div>
          <label
            htmlFor="price"
            className="mb-1.5 block text-sm font-semibold text-gray-700"
          >
            Price (₦)
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <span className="text-gray-500 font-medium">₦</span>
            </div>
            <input
              id="price"
              type="number"
              required
              min="1"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="50,000"
              className="w-full rounded-lg border border-gray-300 pl-8 pr-4 py-2.5 text-gray-900 outline-none ring-brand-green focus:border-brand-green focus:ring-2"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-semibold text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your item in detail (e.g. battery health, receipt available, cosmetic wear, meet-up location)..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none ring-brand-green focus:border-brand-green focus:ring-2"
          />
        </div>
      </div>

      {/* Photo Uploader Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Product Photos</h3>
          <p className="text-xs text-gray-500">
            Upload between 1 and 6 photos. The first photo will be the listing cover.
          </p>
        </div>

        {/* Drag Drop Area */}
        {selectedFiles.length < 6 && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${
              isDragging
                ? "border-brand-green bg-green-50/10"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
            />
            <div className="mx-auto text-gray-400">
              <svg
                className="h-10 w-10 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-semibold text-brand-green hover:underline">
                Click to upload
              </span>{" "}
              or drag and drop
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Supports PNG, JPG, JPEG (Max. 5MB per file)
            </div>
          </div>
        )}

        {/* Previews Grid */}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mt-4">
            {previews.map((preview, index) => (
              <div
                key={preview}
                className="group relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                
                {/* Cover badge on first image */}
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded bg-brand-green px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    Cover
                  </span>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute right-2 top-2 rounded-full bg-red-600 p-1.5 text-white shadow-sm opacity-90 transition-opacity hover:bg-red-700"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Submit */}
      <button
        type="submit"
        disabled={isLoading || !title || !price || !description || selectedFiles.length === 0}
        className="w-full rounded-lg bg-brand-orange py-3.5 font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isLoading && (
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {isLoading ? progressMessage || "Creating listing..." : "Continue to Plans"}
      </button>
    </form>
  );
}
