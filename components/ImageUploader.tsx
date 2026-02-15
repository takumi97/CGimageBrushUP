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
      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors group">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="p-4 rounded-full bg-gray-700 group-hover:bg-gray-600 transition-colors mb-4">
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-400" />
          </div>
          <p className="mb-2 text-sm text-gray-400">
            <span className="font-semibold text-gray-200">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">Lumion Render (PNG, JPG)</p>
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
