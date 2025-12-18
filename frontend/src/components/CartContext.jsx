import React, { createContext, useState, useContext, useEffect } from "react";
import { 
    fetchCart as fetchCartAPI, 
    addToCart as addToCartAPI, 
    removeFromCart as removeFromCartAPI, 
    updateCartQuantity as updateCartQuantityAPI 
} from "../services/api";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const fetchCart = async () => {
        const currentId = localStorage.getItem("user_id");
        if (!currentId) {
            setCartItems([]);
            return;
        }

        try {
            const data = await fetchCartAPI(currentId);
            setCartItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Cart Load Error (GET /api/cart):", error);
        }
    };

    useEffect(() => {
        fetchCart();

        const handleStorageUpdate = () => fetchCart();
        
        window.addEventListener("cart-updated", handleStorageUpdate);
        window.addEventListener("storage", handleStorageUpdate);

        return () => {
            window.removeEventListener("cart-updated", handleStorageUpdate);
            window.removeEventListener("storage", handleStorageUpdate);
        };
    }, []);

    const addToCart = async (product) => {
        const currentId = localStorage.getItem("user_id");
        if (!currentId) {
            alert("Please login first to add items.");
            return;
        }

        const productId = product.id; 

        const prevCart = [...cartItems];
        setCartItems((prev) => {
            const existing = prev.find((item) => item.product_id === productId); 
            if (existing) {
                return prev.map((item) =>
                    item.product_id === productId ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            
            return [
                ...prev, 
                { 
                    id: Date.now(),
                    product_id: productId,
                    name: product.name,
                    price: product.price,
                    img: product.img || product.image,
                    quantity: 1, 
                    seller_id: product.seller_id 
                }
            ];
        });

        try {
            await addToCartAPI({
                user_id: currentId,
                product_id: productId,
                quantity: 1
            });
            
            fetchCart();
        } catch (error) {
            console.error("POST /api/cart Error:", error);
            setCartItems(prevCart);
            alert("Failed to save to cart. Check if Product ID exists in database.");
        }
    };

    const removeFromCart = async (productId) => {
        const currentId = localStorage.getItem("user_id");
        
        setCartItems((prev) => prev.filter((item) => item.product_id !== productId)); 

        try {
            await removeFromCartAPI(productId, currentId); 
            window.dispatchEvent(new Event("cart-updated")); 
        } catch (error) {
            console.error("Remove Error:", error);
            fetchCart(); 
        }
    };

    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) return;
        const currentId = localStorage.getItem("user_id");

        setCartItems((prev) =>
            prev.map((item) =>
                item.product_id === productId ? { ...item, quantity: newQuantity } : item
            )
        );

        try {
            await updateCartQuantityAPI(productId, {
                user_id: currentId,
                quantity: newQuantity
            });
        } catch (error) {
            console.error("Update Error:", error);
            fetchCart();
        }
    };

    const clearCart = () => setCartItems([]);

    return (
        <CartContext.Provider
            value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);