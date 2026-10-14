import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const ShopContext = createContext();



export default function ShopContextProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  // Ajouter au panier
  const addToCart = async (itemId, size, color = 'Standard', qty = 1) => {
    if (!size) {
      toast.error('Please select a size!', { autoClose: 2000 });
      return;
    }

    const colorKey = color || 'Standard';
    const amount = Number(qty) > 0 ? Number(qty) : 1;
    let cartData = structuredClone(cartItems);

    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        if (typeof cartData[itemId][size] === 'object' && cartData[itemId][size] !== null) {
          if (cartData[itemId][size][colorKey]) {
            cartData[itemId][size][colorKey] += amount;
          } else {
            cartData[itemId][size][colorKey] = amount;
          }
        } else {
          const prev = Number(cartData[itemId][size]) || 0;
          cartData[itemId][size] = { [colorKey]: prev + amount };
        }
      } else {
        cartData[itemId][size] = { [colorKey]: amount };
      }
    } else {
      cartData[itemId] = {
        [size]: {
          [colorKey]: amount,
        },
      };
    }
    setCartItems(cartData);
  };

  // Compter le nombre d'articles dans le panier
  const getCartCount = () => {
    let totalCount = 0;
    for (const itemId in cartItems) {
      for (const size in cartItems[itemId]) {
        try {
          const itemVal = cartItems[itemId][size];
          if (typeof itemVal === 'number' && itemVal > 0) {
            totalCount += itemVal;
          } else if (typeof itemVal === 'object' && itemVal !== null) {
            for (const col in itemVal) {
              if (itemVal[col] > 0) {
                totalCount += itemVal[col];
              }
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
    return totalCount;
  };

  // Mettre à jour la quantité
  const updateQuantity = async (itemId, size, colorOrQuantity, newQuantity) => {
    let cartData = structuredClone(cartItems);

    if (newQuantity !== undefined) {
      const color = colorOrQuantity || 'Standard';
      const quantity = newQuantity;
      if (cartData[itemId] && cartData[itemId][size]) {
        if (typeof cartData[itemId][size] === 'object') {
          if (quantity <= 0) {
            delete cartData[itemId][size][color];
            if (Object.keys(cartData[itemId][size]).length === 0) {
              delete cartData[itemId][size];
            }
          } else {
            cartData[itemId][size][color] = quantity;
          }
        }
      }
    } else {
      const quantity = colorOrQuantity;
      if (cartData[itemId] && cartData[itemId][size]) {
        if (typeof cartData[itemId][size] === 'number') {
          if (quantity <= 0) {
            delete cartData[itemId][size];
          } else {
            cartData[itemId][size] = quantity;
          }
        } else if (typeof cartData[itemId][size] === 'object') {
          if (quantity <= 0) {
            delete cartData[itemId][size];
          } else {
            const firstCol = Object.keys(cartData[itemId][size])[0] || 'Standard';
            cartData[itemId][size][firstCol] = quantity;
          }
        }
      }
    }

    if (cartData[itemId] && Object.keys(cartData[itemId]).length === 0) {
      delete cartData[itemId];
    }

    setCartItems(cartData);
  };

  // Calculer le montant total
  const getCartAmount = () => {
    let totalAmount = 0;
    for (const itemId in cartItems) {
      let itemInfo = products.find((product) => product._id === itemId);
      if (!itemInfo) continue;
      for (const size in cartItems[itemId]) {
        try {
          const itemVal = cartItems[itemId][size];
          if (typeof itemVal === 'number' && itemVal > 0) {
            totalAmount += itemInfo.price * itemVal;
          } else if (typeof itemVal === 'object' && itemVal !== null) {
            for (const col in itemVal) {
              if (itemVal[col] > 0) {
                totalAmount += itemInfo.price * itemVal[col];
              }
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
    return totalAmount;
  };

  // Récupération automatique des produits depuis l'API backend (/api/product/list)
  const getProductsData = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/product/list`);
      const data = await response.json();
      if (data.success && Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
      }
    } catch (error) {
      console.warn("Backend /api/product/list non joignable, utilisation des données locales :", error.message);
    }
  };

  useEffect(() => {
    getProductsData();
  }, []);

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    setCartItems({});
  };

  const value = {
    products,
    setProducts,
    backendUrl,
    getProductsData,
    currency: "DT",
    delivery_fee: 0,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    setCartItems,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    token,
    setToken,
    logout,
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}
