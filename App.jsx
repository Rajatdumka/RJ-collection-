import { useEffect, useMemo, useState } from "react";
import { db, storage, auth } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState(null);

  const UPI = "8218293413@ybl";
  const delivery = 30;

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "products"));
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load();
  }, []);

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch {
      alert("Login failed");
    }
  };

  const logout = () => signOut(auth);

  const addProduct = async () => {
    const imgRef = ref(storage, "products/" + Date.now());
    await uploadBytes(imgRef, file);
    const img = await getDownloadURL(imgRef);

    const data = { name, price: Number(price), img };

    const docRef = await addDoc(collection(db, "products"), data);

    setProducts([...products, { id: docRef.id, ...data }]);
  };

  const addToCart = (p) => {
    setCart([...cart, { ...p, qty: 1 }]);
  };

  const total = useMemo(() => cart.reduce((s, i) => s + i.price, 0), [cart]);

  const placeOrder = () => {
    window.open(`https://wa.me/?text=Order%20Total%20₹${total}`, "_blank");
    window.location.href = `upi://pay?pa=${UPI}&am=${total + delivery}&cu=INR`;
  };

  return (
    <div style={{ padding: 10 }}>
      <h2>R.J Collection</h2>

      {!user ? (
        <div>
          <input placeholder="email" onChange={e => setEmail(e.target.value)} />
          <input placeholder="password" type="password" onChange={e => setPass(e.target.value)} />
          <button onClick={login}>Login</button>
        </div>
      ) : (
        <button onClick={logout}>Logout</button>
      )}

      {user && (
        <div>
          <h3>Add Product</h3>
          <input onChange={e => setName(e.target.value)} placeholder="name" />
          <input onChange={e => setPrice(e.target.value)} placeholder="price" />
          <input type="file" onChange={e => setFile(e.target.files[0])} />
          <button onClick={addProduct}>Add</button>
        </div>
      )}

      <h3>Products</h3>
      {products.map(p => (
        <div key={p.id}>
          <img src={p.img} width="100" />
          <p>{p.name} - ₹{p.price}</p>
          <button onClick={() => addToCart(p)}>Add</button>
        </div>
      ))}

      <h3>Cart: {cart.length}</h3>
      <button onClick={placeOrder}>Place Order ₹{total}</button>
    </div>
  );
}
