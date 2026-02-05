'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

interface FilterOptions {
  categories: Array<{ category_id: string; name: string }>;
  brands: Array<{ brand_id: string; name: string }>;
  colours: string[];
  sizes: string[];
}

interface FilterSidebarProps {
  filterOptions: FilterOptions;
  subCategories?: Array<{ sub_category_id: string; name: string }>;
}

export default function FilterSidebar({ filterOptions, subCategories: initialSubCategories = [] }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedSubCategory, setSelectedSubCategory] = useState(searchParams.get('subcategory') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [selectedColour, setSelectedColour] = useState(searchParams.get('colour') || '');
  const [selectedSize, setSelectedSize] = useState(searchParams.get('size') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'newest');
  const [subCategories, setSubCategories] = useState<Array<{ sub_category_id: string; name: string }>>(
    Array.isArray(initialSubCategories) ? initialSubCategories : [],
  );
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);


  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
  ];

  const updateURL = (params: Record<string, string>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
    });

    // Reset to page 1 when filters change
    current.set('page', '1');

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };

  const handleCategoryChange = async (value: string) => {
    setSelectedCategory(value);
    setSelectedSubCategory(''); // Reset subcategory when category changes
    if (value) {
      setLoadingSubCategories(true);
      try {
        const response = await fetch(`/api/subcategories?category=${value}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setSubCategories(data);
        } else {
          setSubCategories([]);
        }
      } catch (error) {
        console.error('Failed to fetch subcategories:', error);
        setSubCategories([]);
      } finally {
        setLoadingSubCategories(false);
      }
    } else {
      setSubCategories([]);
    }
    updateURL({
      category: value,
      subcategory: '',
      brand: selectedBrand,
      colour: selectedColour,
      size: selectedSize,
      minPrice,
      maxPrice,
      sort: selectedSort,
      query: searchParams.get('query') || '',
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    const setters: Record<string, (val: string) => void> = {
      category: setSelectedCategory,
      subcategory: setSelectedSubCategory,
      brand: setSelectedBrand,
      colour: setSelectedColour,
      size: setSelectedSize,
      sort: setSelectedSort,
    };

    setters[key]?.(value);

    updateURL({
      category: selectedCategory,
      subcategory: key === 'subcategory' ? value : selectedSubCategory,
      brand: key === 'brand' ? value : selectedBrand,
      colour: key === 'colour' ? value : selectedColour,
      size: key === 'size' ? value : selectedSize,
      minPrice,
      maxPrice,
      sort: key === 'sort' ? value : selectedSort,
      query: searchParams.get('query') || '',
    });
  };

  const handlePriceChange = () => {
    updateURL({
      category: selectedCategory,
      subcategory: selectedSubCategory,
      brand: selectedBrand,
      colour: selectedColour,
      size: selectedSize,
      minPrice,
      maxPrice,
      sort: selectedSort,
      query: searchParams.get('query') || '',
    });
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSelectedBrand('');
    setSelectedColour('');
    setSelectedSize('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedSort('newest');
    router.push(pathname);
  };

  const hasActiveFilters = selectedCategory || selectedSubCategory || selectedBrand || 
    selectedColour || selectedSize || minPrice || maxPrice || selectedSort !== 'newest';

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-secondary w-full justify-center gap-2 glow-none"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-[color:var(--accent-blue)] text-[color:var(--bg-base)] text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-[rgba(6,11,20,0.7)] z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 lg:top-24 left-0 h-screen lg:h-auto w-80 bg-[color:var(--bg-panel)] border-r border-[color:var(--border-subtle)] lg:border lg:border-[color:var(--border-subtle)] lg:rounded-[var(--radius-card)]
          transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">Filters</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] text-[color:var(--text-muted)] glow-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn btn-danger w-full mb-4 px-4 py-2 text-sm glow-none"
            >
              Clear All Filters
            </button>
          )}

          {/* Sort */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[color:var(--text-muted)] mb-2">
              Sort By
            </label>
            <select
              value={selectedSort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="w-full"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-[color:var(--bg-panel)] text-[color:var(--text-primary)]">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[color:var(--text-muted)] mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full"
            >
              <option value="" className="bg-[color:var(--bg-panel)] text-[color:var(--text-primary)]">All Categories</option>
              {filterOptions.categories.map((category) => (
                <option key={category.category_id} value={category.category_id} className="bg-[color:var(--bg-panel)] text-[color:var(--text-primary)]">
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sub Category */}
          {selectedCategory && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[color:var(--text-muted)] mb-2">
                Sub Category
              </label>
              <select
                value={selectedSubCategory}
              onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                disabled={loadingSubCategories}
                className="w-full disabled:opacity-60"
              >
                <option value="" className="bg-[color:var(--bg-panel)] text-[color:var(--text-primary)]">{loadingSubCategories ? 'Loading...' : 'All Sub Categories'}</option>
                {subCategories.map((subCategory) => (
                  <option key={subCategory.sub_category_id} value={subCategory.sub_category_id}>
                    {subCategory.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Brand */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[color:var(--text-muted)] mb-2">
              Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              className="w-full"
            >
              <option value="" className="bg-[color:var(--bg-panel)] text-[color:var(--text-primary)]">All Brands</option>
              {filterOptions.brands.map((brand) => (
                <option key={brand.brand_id} value={brand.brand_id} className="bg-[color:var(--bg-panel)] text-[color:var(--text-primary)]">
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Colour */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[color:var(--text-muted)] mb-2">
              Colour
            </label>
            <select
              value={selectedColour}
              onChange={(e) => handleFilterChange('colour', e.target.value)}
              className="w-full"
            >
              <option value="" className="bg-[color:var(--bg-panel)] text-[color:var(--text-primary)]">All Colours</option>
              {filterOptions.colours.map((colour) => (
                <option key={colour} value={colour} className="bg-[color:var(--bg-panel)] text-[color:var(--text-primary)]">
                  {colour}
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[color:var(--text-muted)] mb-2">
              Size
            </label>
            <select
              value={selectedSize}
              onChange={(e) => handleFilterChange('size', e.target.value)}
              className="w-full"
            >
              <option value="" className="bg-[color:var(--bg-panel)] text-[color:var(--text-primary)]">All Sizes</option>
              {filterOptions.sizes.map((size) => (
                <option key={size} value={size} className="bg-[color:var(--bg-panel)] text-[color:var(--text-primary)]">
                  {size}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[color:var(--text-muted)] mb-2">
              Price Range
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onBlur={handlePriceChange}
                className="w-full"
              />
              <span className="text-[color:var(--text-muted)]">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={handlePriceChange}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}



