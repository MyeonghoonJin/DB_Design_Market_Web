'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/types';

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: '',
    description: '',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        alert('로그인이 필요합니다.');
        router.push('/auth/login');
        return;
      }
      setIsLoggedIn(true);
    } catch {
      router.push('/auth/login');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

      setImageFiles((prev) => [...prev, ...newFiles].slice(0, 5));
      setImagePreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) {
      newErrors.title = '제목을 입력해주세요.';
    }

    if (!formData.price) {
      newErrors.price = '가격을 입력해주세요.';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = '올바른 가격을 입력해주세요.';
    }

    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요.';
    }

    if (!formData.description) {
      newErrors.description = '상품 설명을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // 1. 이미지 업로드
      let imageUrls: string[] = [];

      if (imageFiles.length > 0) {
        const uploadFormData = new FormData();
        imageFiles.forEach((file) => {
          uploadFormData.append('files', file);
        });

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('이미지 업로드에 실패했습니다.');
        }

        const uploadData = await uploadResponse.json();
        imageUrls = uploadData.urls;
      }

      // 2. 상품 등록
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          price: Number(formData.price),
          category: formData.category,
          description: formData.description,
          images: imageUrls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.error || '상품 등록에 실패했습니다.' });
        return;
      }

      alert('상품이 등록되었습니다!');
      router.push('/mypage');
    } catch (error) {
      console.error('상품 등록 오류:', error);
      setErrors({ submit: '서버 연결에 실패했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">상품 등록</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 이미지 업로드 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            상품 이미지 (최대 5장)
          </label>
          <div className="flex gap-3 flex-wrap">
            {imagePreviews.map((image, index) => (
              <div key={index} className="relative w-24 h-24">
                <img
                  src={image}
                  alt={`상품 이미지 ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
            {imagePreviews.length < 5 && (
              <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </label>
            )}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="상품 제목을 입력하세요"
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>

        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            카테고리 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">카테고리를 선택하세요</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
        </div>

        {/* 가격 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            가격 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value.replace(/[^0-9]/g, '') })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="가격을 입력하세요"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">원</span>
          </div>
          {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
        </div>

        {/* 상품 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            상품 설명 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={6}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="상품 상태, 거래 방법 등을 자세히 적어주세요"
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>

        {/* 등록 안내 */}
        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-2">등록 시 유의사항</p>
          <ul className="list-disc list-inside space-y-1">
            <li>최대 10개의 물품만 등록할 수 있습니다.</li>
            <li>허위 정보 등록 시 제재를 받을 수 있습니다.</li>
            <li>거래 금지 품목은 등록할 수 없습니다.</li>
          </ul>
        </div>

        {errors.submit && (
          <div className="bg-red-50 text-red-500 px-4 py-3 rounded-lg text-sm">
            {errors.submit}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
          >
            {isLoading ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
