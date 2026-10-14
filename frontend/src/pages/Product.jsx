import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { useLang } from '../context/LangContext';
import {
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Check,
  Minus,
  Plus,
  Flame,
  Package,
  ArrowLeft,
} from 'lucide-react';
import RelatedProducts from '../components/RelatedProducts';
import { toast } from 'react-toastify';

// Color palette matching admin constants and standard sneaker colors
const COLOR_PALETTE = {
  black: '#1a1a1a',
  white: '#f5f5f5',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  grey: '#9ca3af',
  gray: '#9ca3af',
  orange: '#f97316',
  pink: '#ec4899',
  brown: '#a16207',
  beige: '#d2b48c',
  navy: '#1e3a8a',
  purple: '#a855f7',
  gold: '#eab308',
  silver: '#d1d5db',
};

// Helper to resolve hex code or fallback
const getColorHex = (colorName) => {
  if (!colorName) return '#e5e7eb';
  const clean = String(colorName).trim().toLowerCase();
  if (clean.startsWith('#') || clean.startsWith('rgb')) return colorName;
  return COLOR_PALETTE[clean] || clean;
};

export default function Product() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, currency, addToCart, backendUrl } = useContext(ShopContext);
  const { t } = useLang();

  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'specs' | 'shipping'

  // Fetch product from context or direct backend API call (/api/product/single)
  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      setLoading(true);

      // 1. Look in context products first
      if (Array.isArray(products) && products.length > 0) {
        const found = products.find((item) => String(item._id) === String(productId));
        if (found) {
          if (isMounted) {
            setupProduct(found);
            setLoading(false);
          }
          return;
        }
      }

      // 2. Fetch directly from backend single product endpoint
      try {
        const url = `${backendUrl || 'http://localhost:4000'}/api/product/single?productId=${productId}`;
        const res = await fetch(url);
        const data = await res.json();

        if (isMounted) {
          if (data.success && data.product) {
            setupProduct(data.product);
          } else {
            setProductData(null);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching single product:", err);
        if (isMounted) {
          setProductData(null);
          setLoading(false);
        }
      }
    };

    const setupProduct = (item) => {
      setProductData(item);
      const firstImage = Array.isArray(item.image) ? item.image[0] : item.image;
      setImage(firstImage || '');

      // Pre-select first size if available
      if (Array.isArray(item.sizes) && item.sizes.length > 0) {
        setSize(item.sizes[0]);
      } else {
        setSize('');
      }

      // Pre-select first color if available
      if (Array.isArray(item.colors) && item.colors.length > 0) {
        setColor(item.colors[0]);
      } else {
        setColor('');
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId, products, backendUrl]);

  // Cart addition handler
  const handleAddToCart = () => {
    if (!productData) return;

    if (productData.sizes && productData.sizes.length > 0 && !size) {
      toast.error(t.selectSizePrompt);
      return;
    }

    addToCart(productData._id, size || 'Standard', color || 'Standard', quantity);
  };

  // Direct checkout
  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-padd-container py-16 animate-pulse">
        <div className="h-6 bg-gray-200 rounded-md w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="h-[460px] bg-gray-200 rounded-3xl"></div>
          <div className="space-y-5">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-14 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Product not found
  if (!productData) {
    return (
      <div className="max-padd-container py-24 text-center">
        <div className="w-20 h-20 bg-gray-10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-gray-30" />
        </div>
        <h2 className="text-3xl font-extrabold text-primary mb-3">Product Not Found</h2>
        <p className="text-gray-50 max-w-md mx-auto mb-8 text-sm">
          The requested sneaker does not exist or has been removed from the catalog.
        </p>
        <Link
          to="/collection"
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-tertiary transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> {t.discoverCollection}
        </Link>
      </div>
    );
  }

  const imagesList = Array.isArray(productData.image)
    ? productData.image.filter(Boolean)
    : (productData.image ? [productData.image] : []);

  const sizesList = Array.isArray(productData.sizes) ? productData.sizes : [];
  const colorsList = Array.isArray(productData.colors) ? productData.colors : [];

  return (
    <div className="bg-primaryLight/40 min-h-screen border-t border-gray-10/80 pt-6 pb-20">
      <div className="max-padd-container">

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-gray-50 mb-8 overflow-x-auto whitespace-nowrap py-1">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-30" />
          <Link to="/collection" className="hover:text-primary transition-colors">{t.collection}</Link>
          {productData.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-gray-30" />
              <span className="text-gray-50">{t(productData.category)}</span>
            </>
          )}
          {productData.subCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-gray-30" />
              <span className="text-tertiary font-bold">{t(productData.subCategory)}</span>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-gray-30" />
          <span className="text-primary font-bold truncate max-w-[200px]">{t(productData.name)}</span>
        </nav>

        {/* Main Product Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-gray-10">

          {/* Images Gallery Column */}
          <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-4">

            {/* Thumbnails */}
            {imagesList.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:w-24 shrink-0 pb-2 sm:pb-0">
                {imagesList.map((imgUrl, index) => {
                  const isActive = image === imgUrl;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setImage(imgUrl)}
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-10/50 border-2 transition-all shrink-0 cursor-pointer ${isActive
                          ? 'border-tertiary shadow-md scale-102 ring-2 ring-tertiary/20'
                          : 'border-transparent hover:border-gray-20 opacity-80 hover:opacity-100'
                        }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 relative rounded-3xl overflow-hidden bg-gradient-to-b from-gray-10/40 to-gray-10/80 border border-gray-10 flex items-center justify-center min-h-[380px] sm:min-h-[480px]">
              {productData.popular && (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-tertiary text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  <span>Popular</span>
                </div>
              )}

              {image ? (
                <img
                  src={image}
                  alt={productData.name}
                  className="w-full h-full max-h-[500px] object-contain p-4 transition-transform duration-500 hover:scale-105 select-none"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-30">
                  <Package className="w-12 h-12" />
                  <span className="text-xs">No image available</span>
                </div>
              )}
            </div>
          </div>

          {/* Details & Purchase Column */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              {/* Brand, Category & Stock Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {productData.subCategory && (
                  <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-extrabold uppercase tracking-wider">
                    {t(productData.subCategory)}
                  </span>
                )}
                {productData.category && (
                  <span className="px-3 py-1 rounded-full bg-gray-10 text-gray-50 text-xs font-bold uppercase tracking-wider">
                    {t(productData.category)}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {t("In Stock")}
                </span>
              </div>

              {/* Product Name */}
              <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-tight leading-tight">
                {t(productData.name)}
              </h1>



              {/* Price & Original Price */}
              <div className="mt-5 flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl font-black text-primary">
                  {productData.price}{' '}
                  <span className="text-2xl font-bold text-tertiary">{currency || 'DT'}</span>
                </span>

                <span className="text-xs font-semibold text-gray-50 bg-gray-10 px-2.5 py-1 rounded-md">
                  {t.cashOnDelivery}
                </span>
              </div>

              {/* Description */}
              <p className="mt-4 text-sm text-gray-50 leading-relaxed">
                {t(productData.description)}
              </p>

              <hr className="my-6 border-gray-10" />

              {/* Colors Selection */}
              {colorsList.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                      {t.selectColor}:
                    </span>
                    <span className="text-xs font-bold text-tertiary">
                      {color || t.selectColor}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {colorsList.map((colName, index) => {
                      const isSelected = color === colName;
                      const hex = getColorHex(colName);
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setColor(colName)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isSelected
                              ? 'border-tertiary bg-tertiary/5 text-primary shadow-sm ring-2 ring-tertiary/20'
                              : 'border-gray-20/80 bg-white text-gray-50 hover:border-primary'
                            }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/15 shrink-0 shadow-xs"
                            style={{ backgroundColor: hex }}
                          />
                          <span>{colName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-tertiary ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sizes Selection */}
              {sizesList.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                      {t.sizeLabel} (EU):
                    </span>
                    <span className="text-xs font-bold text-tertiary">
                      {size ? `${t.sizeLabel} ${size}` : t.selectSize}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                    {sizesList.map((s, index) => {
                      const isSelected = size === s;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSize(s)}
                          className={`py-3 rounded-xl text-sm font-bold border transition-all cursor-pointer flex items-center justify-center ${isSelected
                              ? 'bg-primary text-white border-primary shadow-md scale-102'
                              : 'bg-white text-primary border-gray-20/80 hover:border-primary hover:bg-gray-10/40'
                            }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity & Action Buttons */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-4">
                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-gray-10 rounded-2xl p-1 border border-gray-20/60">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-primary hover:bg-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-black text-primary text-sm">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-primary hover:bg-white transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 bg-tertiary text-white font-extrabold uppercase tracking-wider py-4 px-6 rounded-2xl hover:bg-primary active:scale-98 transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl cursor-pointer"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>{t.addToCart}</span>
                  </button>
                </div>

                {/* Buy Now Button */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full bg-primary text-white font-extrabold uppercase tracking-wider py-3.5 px-6 rounded-2xl hover:bg-black active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <span>{t.buyNow}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Service & Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-gray-10">
              <div className="flex items-center gap-3 p-3 bg-gray-10/60 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-tertiary shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold text-primary">{t.authenticGuarantee}</p>
                  <p className="text-[10px] text-gray-50">{t.highQualityBadge}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-10/60 rounded-xl">
                <Truck className="w-5 h-5 text-tertiary shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold text-primary">{t.fastDeliveryTitle}</p>
                  <p className="text-[10px] text-gray-50">{t.expressShippingNote}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-10/60 rounded-xl">
                <RotateCcw className="w-5 h-5 text-tertiary shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold text-primary">{t.easyReturnsNote}</p>
                  <p className="text-[10px] text-gray-50">14 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details & Specs Tabs */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-gray-10 shadow-sm">
          <div className="flex items-center gap-6 border-b border-gray-10 pb-4 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`text-sm font-extrabold uppercase tracking-wider pb-2 border-b-2 transition-all cursor-pointer ${activeTab === 'description'
                  ? 'border-tertiary text-primary'
                  : 'border-transparent text-gray-30 hover:text-primary'
                }`}
            >
              {t.tabDescription}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`text-sm font-extrabold uppercase tracking-wider pb-2 border-b-2 transition-all cursor-pointer ${activeTab === 'specs'
                  ? 'border-tertiary text-primary'
                  : 'border-transparent text-gray-30 hover:text-primary'
                }`}
            >
              {t.tabSpecs}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shipping')}
              className={`text-sm font-extrabold uppercase tracking-wider pb-2 border-b-2 transition-all cursor-pointer ${activeTab === 'shipping'
                  ? 'border-tertiary text-primary'
                  : 'border-transparent text-gray-30 hover:text-primary'
                }`}
            >
              {t.tabShipping}
            </button>
          </div>

          {activeTab === 'description' && (
            <div className="prose max-w-none text-gray-50 text-sm leading-relaxed space-y-3">
              <p>{t(productData.description)}</p>
              <p>
                {t("Each product in the Měilì collection goes through a rigorous quality check to ensure excellent craftsmanship and a perfect fit")}
              </p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-10/50 rounded-2xl">
                <span className="text-[11px] font-bold uppercase text-gray-30">{t.brandLabel}</span>
                <p className="text-base font-extrabold text-primary mt-1">
                  {productData.subCategory || 'Not specified'}
                </p>
              </div>
              <div className="p-4 bg-gray-10/50 rounded-2xl">
                <span className="text-[11px] font-bold uppercase text-gray-30">{t.categoryLabel}</span>
                <p className="text-base font-extrabold text-primary mt-1">
                  {productData.category || 'Unisex'}
                </p>
              </div>
              <div className="p-4 bg-gray-10/50 rounded-2xl">
                <span className="text-[11px] font-bold uppercase text-gray-30">{t.colorLabel}</span>
                <p className="text-base font-extrabold text-primary mt-1">
                  {colorsList.length > 0 ? colorsList.join(', ') : 'Standard'}
                </p>
              </div>
              <div className="p-4 bg-gray-10/50 rounded-2xl">
                <span className="text-[11px] font-bold uppercase text-gray-30">{t.sizeLabel}</span>
                <p className="text-base font-extrabold text-primary mt-1">
                  {sizesList.length > 0 ? `EU ${sizesList[0]} to EU ${sizesList[sizesList.length - 1]}` : 'On request'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="text-sm text-gray-50 space-y-3 leading-relaxed">
              <p>
                <strong>Express Delivery:</strong> We deliver nationwide in Tunisia within 24 to 48 business hours.
              </p>
              <p>
                <strong>Cash on Delivery:</strong> Pay cash to the courier only after receiving and inspecting your package.
              </p>
              <p>
                <strong>Exchange Policy:</strong> If the size does not fit, you have 14 days to request a free size exchange.
              </p>
            </div>
          )}
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <RelatedProducts
            category={productData.category}
            subCategory={productData.subCategory}
            currentProductId={productData._id}
          />
        </div>

      </div>
    </div>
  );
}
