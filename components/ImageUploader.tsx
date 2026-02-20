import React, { useCallback } from 'react';
import { Upload, ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onImageSelected(result);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelected]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors group">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="p-4 rounded-full bg-white shadow-sm group-hover:shadow-md transition-all mb-4 border border-gray-100">
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-black" />
          </div>
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-900">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400">Lumion Render (PNG, JPG)</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};
