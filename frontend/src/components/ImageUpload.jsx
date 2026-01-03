import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = 'namma_tirupur';
const CLOUDINARY_CLOUD_NAME = 'dccb3xff5';

const ImageUpload = ({ 
  value, 
  onChange, 
  required = false, 
  label = 'Image',
  // Multi-image mode props
  onImagesChange,
  maxImages = 1,
  currentImages = []
}) => {
  const isMultiMode = maxImages > 1 || onImagesChange;
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [images, setImages] = useState(currentImages || []);
  const fileInputRef = useRef(null);

  // Sync images with currentImages prop
  useEffect(() => {
    if (isMultiMode && currentImages) {
      setImages(currentImages);
    }
  }, [currentImages, isMultiMode]);

  // Sync preview with value prop
  useEffect(() => {
    if (!isMultiMode && value !== undefined) {
      setPreview(value);
    }
  }, [value, isMultiMode]);

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Cloudinary error:', data);
      throw new Error(data.error?.message || 'Upload failed');
    }

    return data.secure_url;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Check max images for multi mode
    if (isMultiMode && images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);

    try {
      const url = await uploadToCloudinary(file);

      if (isMultiMode) {
        const newImages = [...images, url];
        setImages(newImages);
        if (onImagesChange) {
          onImagesChange(newImages);
        }
      } else {
        setPreview(url);
        if (onChange) {
          onChange(url);
        }
      }
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index) => {
    if (isMultiMode) {
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      if (onImagesChange) {
        onImagesChange(newImages);
      }
    } else {
      setPreview(null);
      if (onChange) {
        onChange(null);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Multi-image mode render
  if (isMultiMode) {
    return (
      <div className="space-y-3">
        {/* Image previews */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button - show if under max */}
        {images.length < maxImages && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              uploading
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-300 hover:border-gov-blue hover:bg-gov-blue/5'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-6 w-6 text-gov-blue mb-1.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs text-gov-blue">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 text-gray-400 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-xs text-gray-600">Add photo ({images.length}/{maxImages})</span>
              </div>
            )}
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // Single image mode render (original)
  return (
    <div className="mb-3 sm:mb-4">
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-20 sm:w-40 sm:h-28 object-cover rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={() => handleRemove()}
            className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors ${
            uploading
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mb-1.5 sm:mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs sm:text-sm text-blue-600">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-1.5 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs sm:text-sm text-gray-600">Click to upload image</span>
              <span className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">PNG, JPG up to 5MB</span>
            </div>
          )}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
