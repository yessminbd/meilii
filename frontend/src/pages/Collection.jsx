import React, { useContext, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import { useLang } from '../context/LangContext';
import Item from '../components/Item';
import Title from '../components/Title';
import CategoryTreeFilter from '../components/CategoryTreeFilter';

export default function Collection() {
  const { products, search, setSearch, backendUrl } = useContext(ShopContext);
  const { t } = useLang();
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [priceFilter, setPriceFilter] = useState('');
  const [sortType, setSortType] = useState('relevant');

  const toggleCategoryValue = (val) => {
    setCategory((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const toggleSubCategoryValue = (val) => {
    setSubCategory((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const toggleCategory = (e) => {
    toggleCategoryValue(e.target.value);
  };

  const toggleSubCategory = (e) => {
    toggleSubCategoryValue(e.target.value);
  };

  const resetAll = () => {
    setCategory([]);
    setSubCategory([]);
    setPriceFilter('');
    setSortType('relevant');
    if (typeof setSearch === 'function') setSearch('');
  };

  const applyFilter = () => {
    let productsCopy = products.slice();

    if (search) {
      const q = search.toLowerCase();
      productsCopy = productsCopy.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.subCategory && item.subCategory.toLowerCase().includes(q)) ||
          (item.category &&
            (Array.isArray(item.category)
              ? item.category.join(' ').toLowerCase().includes(q)
              : item.category.toLowerCase().includes(q)))
      );
    }

    // Gender / Audience (category: Men, Women, Kids)
    if (category.length > 0) {
      productsCopy = productsCopy.filter((item) => {
        const itemCategories = Array.isArray(item.category)
          ? item.category
          : item.category
            ? [item.category]
            : [];
        return (
          itemCategories.some((c) => category.includes(c)) ||
          category.includes(item.gender)
        );
      });
    }

    // Brands / subCategories
    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter(
        (item) => subCategory.includes(item.subCategory) || subCategory.includes(item.brand)
      );
    }

    if (priceFilter === '0-100') {
      productsCopy = productsCopy.filter((item) => item.price <= 100);
    } else if (priceFilter === '100-200') {
      productsCopy = productsCopy.filter((item) => item.price > 100 && item.price <= 200);
    } else if (priceFilter === '200+') {
      productsCopy = productsCopy.filter((item) => item.price > 200);
    }

    // Tri appliqué dans la même passe pour ne jamais être perdu
    if (sortType === 'low-high') productsCopy.sort((a, b) => a.price - b.price);
    if (sortType === 'high-low') productsCopy.sort((a, b) => b.price - a.price);

    setFilterProducts(productsCopy);
  };

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subCategory, priceFilter, products, search, sortType]);

  const priceOptions = [
    { value: '', label: t.allPrices },
    { value: '0-100', label: t.under100 },
    { value: '100-200', label: t.between100and200 },
    { value: '200+', label: t.over200 },
  ];

  return (
    <div className='max-padd-container py-16 flex flex-col sm:flex-row gap-1 sm:gap-10 border-t border-gray-10 bg-primaryLight'>
      {/* Filter Options */}
      <div className='min-w-64'>
        <div className='flex items-center justify-between mb-5'>
          <p className='text-xl font-bold text-primary uppercase tracking-wide'>{t.filters}</p>
          {(category.length > 0 || subCategory.length > 0 || priceFilter) && (
            <button
              type='button'
              onClick={resetAll}
              className='text-xs font-semibold text-[#e63946] hover:underline cursor-pointer'
            >
              {t.resetFilters || 'Effacer'}
            </button>
          )}
        </div>

        {/* Tree Categories & SubCategories Filter */}
        <CategoryTreeFilter
          backendUrl={backendUrl}
          products={products}
          selectedCategory={category}
          selectedSubCategory={subCategory}
          onToggleCategory={toggleCategoryValue}
          onToggleSubCategory={toggleSubCategoryValue}
        />

        {/* Price Filter */}
        <div className='border border-gray-20 rounded-xl p-5 mb-5 bg-white shadow-sm'>
          <p className='mb-4 text-sm font-bold text-primary uppercase'>{t.price}</p>
          <div className='flex flex-col gap-3 text-sm text-gray-50'>
            {priceOptions.map((p) => (
              <label className='flex gap-2 items-center cursor-pointer' key={p.value || 'all'}>
                <input
                  className='appearance-none w-5 h-5 shrink-0 rounded-full border-2 border-gray-20 cursor-pointer transition-all
                 checked:border-tertiary checked:bg-tertiary checked:shadow-[inset_0_0_0_3px_white]
                 hover:border-tertiary
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary'
                  type='radio'
                  name='price'
                  value={p.value}
                  checked={priceFilter === p.value}
                  onChange={() => setPriceFilter(p.value)}
                />
                <span className={`font-medium ${priceFilter === p.value ? 'text-tertiary' : ''}`}>
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className='flex-1'>
        <div className='flex justify-between items-center text-base sm:text-2xl mb-8'>
          <Title title={t.allCollection} />

          {/* Product Sort */}
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            className='border border-gray-20 rounded-lg text-sm px-4 py-2 bg-white text-primary focus:outline-none focus:ring-1 focus:ring-tertiary font-medium'
          >
            <option value='relevant'>{t.sortRelevant}</option>
            <option value='low-high'>{t.sortLowHigh}</option>
            <option value='high-low'>{t.sortHighLow}</option>
          </select>
        </div>

        {/* Products or empty state */}
        {filterProducts.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-10'>
            {filterProducts.map((item, index) => (
              <Item key={item._id || item.id || index} product={item} />
            ))}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center text-center py-20 px-6 bg-white border border-dashed border-gray-20 rounded-3xl'>
            <div className='w-20 h-20 rounded-full bg-primaryLight flex items-center justify-center mb-6'>
              <Search className='w-9 h-9 text-tertiary' />
            </div>
            <h3 className='text-xl font-black text-primary mb-2'>{t.noProductsTitle}</h3>
            <p className='text-sm text-gray-50 max-w-sm mb-6'>{t.noProductsDesc}</p>
            <button
              onClick={resetAll}
              className='px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-colors'
            >
              {t.resetFilters}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}