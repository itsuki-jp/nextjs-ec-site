'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

type CartContextValue = {
  cartItems: CartItem[];
  isLoaded: boolean;
  addItem: (product: Omit<CartItem, "quantity">, addQuantity?: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  isInCart: (id: string) => boolean;
  totalPrice: number;
  totalQuantity: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "cartItems";

export const useCart = () => {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error("useCartはCartProviderの内部でのみ使用してください。");
  }

  return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      try {
        const storedCart = window.localStorage.getItem(STORAGE_KEY);
        if (storedCart) {
          const parsedCart: unknown = JSON.parse(storedCart);
          if (Array.isArray(parsedCart)) {
            const validItems = parsedCart.filter(
              (item): item is CartItem =>
                typeof item === "object" &&
                item !== null &&
                typeof item.id === "string" &&
                typeof item.title === "string" &&
                typeof item.price === "number" &&
                typeof item.quantity === "number" &&
                item.quantity > 0,
            );
            setCartItems(validItems);
          }
        }
      } catch (error) {
        console.error("カート読み込みエラー:", error);
      } finally {
        setIsLoaded(true);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("カート保存エラー:", error);
    }
  }, [cartItems, isLoaded]);

  const addItem = useCallback(
    (targetProduct: Omit<CartItem, "quantity">, addQuantity = 1) => {
      if (addQuantity <= 0) return;

      setCartItems((previousItems) => {
        const existingItem = previousItems.find(
          (item) => item.id === targetProduct.id,
        );

        if (existingItem) {
          return previousItems.map((item) =>
            item.id === targetProduct.id
              ? { ...item, quantity: item.quantity + addQuantity }
              : item,
          );
        }

        return [...previousItems, { ...targetProduct, quantity: addQuantity }];
      });
    },
    [],
  );

  const removeItem = useCallback((targetId: string) => {
    setCartItems((previousItems) =>
      previousItems.filter((item) => item.id !== targetId),
    );
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const updateQuantity = useCallback((targetId: string, quantity: number) => {
    setCartItems((previousItems) =>
      quantity > 0
        ? previousItems.map((item) =>
            item.id === targetId ? { ...item, quantity } : item,
          )
        : previousItems.filter((item) => item.id !== targetId),
    );
  }, []);

  const isInCart = useCallback(
    (targetId: string) => cartItems.some((item) => item.id === targetId),
    [cartItems],
  );

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );
  const totalQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const value = useMemo(
    () => ({
      cartItems,
      isLoaded,
      addItem,
      removeItem,
      clearCart,
      updateQuantity,
      isInCart,
      totalPrice,
      totalQuantity,
    }),
    [
      cartItems,
      isLoaded,
      addItem,
      removeItem,
      clearCart,
      updateQuantity,
      isInCart,
      totalPrice,
      totalQuantity,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
