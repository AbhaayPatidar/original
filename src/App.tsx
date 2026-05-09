import { useState, useEffect, FormEvent, useMemo, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight,
  ArrowLeft,
  Instagram, 
  Twitter, 
  CheckCircle2,
  Github,
  Star,
  User,
  LogOut,
  LogIn,
  MessageSquare,
  Heart,
  Eye
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser, db } from './lib/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp, onSnapshot, deleteDoc } from 'firebase/firestore';

// --- Types ---
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  image: string;
  images: string[];
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

// --- Mock Data ---
const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'CLASSIC ESSENTIAL',
    category: 'T-Shirt // Classic',
    price: 999,
    originalPrice: 1499,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1574180563878-08053b68c0d3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Supreme comfort in our signature 220 GSM cotton.'
  },
  {
    id: '2',
    name: 'NEON MATRIX',
    category: 'Oversized T-Shirt',
    price: 1299,
    originalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1576566582402-28566b421323?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Heavyweight drop shoulder design for the modern silhouette.'
  },
  {
    id: '3',
    name: 'URBAN ECHO',
    category: 'T-Shirt // Graphic',
    price: 1199,
    originalPrice: 1799,
    image: 'https://images.unsplash.com/photo-1576566582402-28566b421323?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1576566582402-28566b421323?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1564859228273-274232fdb516?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Distinctive screen-printed aesthetics reflecting city life.'
  },
  {
    id: '4',
    name: 'DESERT STORM',
    category: 'T-Shirt // Vintage',
    price: 1499,
    originalPrice: 2199,
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3bd2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1550991152-12460a9f28d8?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Mineral washed for that perfect lived-in feel and look.'
  },
  {
    id: '5',
    name: 'UTILITY CORE',
    category: 'T-Shirt // Pocket',
    price: 1099,
    originalPrice: 1599,
    image: 'https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1524380315367-27a149c47ca6?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1525171254930-643ff641298e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Reinforced chest pocket with subtle Original branding.'
  },
  {
    id: '6',
    name: 'ORIGINAL X ZERO',
    category: 'Oversized // Limited',
    price: 2499,
    originalPrice: 3499,
    image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1582533089852-02c3cd24f09a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Exclusive collaboration piece. Only 100 units produced.'
  },
  {
    id: '7',
    name: 'PRIME LUXE POLO',
    category: 'Prime Polo',
    price: 1799,
    originalPrice: 2599,
    image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1481919974042-41444a1b0265?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Tailored fit with breathable piqué fabric and minimalist detailing.'
  },
  {
    id: '8',
    name: 'TACTICAL CARGO',
    category: 'Cargo Pants',
    price: 2999,
    originalPrice: 4499,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1621072156002-e2fcced0b170?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Multi-pocket functionality with durable ripstop construction.'
  },
  {
    id: '9',
    name: 'SUMMER BREEZE',
    category: 'Linen Shirt',
    price: 1999,
    originalPrice: 2999,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1524380315367-27a149c47ca6?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Premium linen blend for ultimate breathability and relaxed aesthetic.'
  },
  {
    id: '10',
    name: 'STEALTH OVERSIZED',
    category: 'Oversized T-Shirt',
    price: 1399,
    originalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1524380315367-27a149c47ca6?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Matte black heavy cotton with draped silhouette.'
  }
];

// --- Components ---

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Navbar = ({ cartCount, onOpenCart, user, onLogin }: { 
  cartCount: number, 
  onOpenCart: () => void,
  user: FirebaseUser | null,
  onLogin: () => void
}) => (
  <nav className="fixed top-0 left-0 w-full z-50 py-2 md:py-3 px-4 md:px-10 flex justify-between items-center bg-black/40 backdrop-blur-lg border-b border-white/10 transition-all duration-300">
    <div className="flex-1 flex justify-start items-center gap-4">
      <Link to="/" className="flex items-center gap-2 md:gap-3 relative group cursor-pointer ml-0 md:-ml-4 transition-all">
        <div className="relative flex items-center justify-center">
          {/* Advanced geometric logo */}
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-[0.5px] border-accent/20 rounded-xl"
            ></motion.div>
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border border-accent/40 rounded-lg"
            ></motion.div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-1 bg-accent rounded-full shadow-[0_0_12px_#F27D26]"></div>
            </div>
            <span className="text-white text-xl font-logo font-extrabold tracking-tighter z-10 group-hover:text-accent transition-colors duration-500">O</span>
          </div>
        </div>
        <div className="flex flex-col -space-y-1">
          <h1 className="text-xl md:text-2xl font-logo font-extrabold tracking-[-0.05em] text-white relative z-10 group-hover:accent-glow transition-all duration-500">
            ORIGINAL
          </h1>
          <span className="text-[0.4rem] md:text-[0.45rem] font-black tracking-[0.6em] text-accent uppercase opacity-80 pl-1">Archives</span>
        </div>
      </Link>
    </div>
    
    <div className="hidden md:flex flex-1 justify-center gap-6 lg:gap-8 text-[0.55rem] lg:text-[0.6rem] font-black uppercase tracking-[0.3em] opacity-60">
      <Link to="/tshirt" className="hover:text-accent transition-colors whitespace-nowrap">T–Shirt</Link>
      <Link to="/oversized" className="hover:text-accent transition-colors">Oversized T–Shirt</Link>
      <Link to="/polo" className="hover:text-accent transition-colors">Prime Polo</Link>
      <Link to="/cargo" className="hover:text-accent transition-colors">Cargo Pants</Link>
      <Link to="/linen" className="hover:text-accent transition-colors">Linen Shirts</Link>
    </div>
    <div className="flex-1 flex justify-end items-center gap-4">
        {user ? (
          <Link to="/profile" className="flex items-center gap-2 md:gap-4 group relative">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-[0.6rem] font-black uppercase tracking-widest text-white/60">{user.displayName}</span>
              <span className="text-[0.5rem] font-black uppercase tracking-[0.2em] text-accent/60 group-hover:text-accent transition-all">Profile</span>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 p-0.5 group-hover:border-accent/50 transition-colors overflow-hidden">
              <img src={user.photoURL || ''} alt="" className="w-full h-full rounded-full object-cover" />
            </div>
          </Link>
        ) : (
          <button 
            onClick={onLogin}
            className="flex items-center gap-2 text-white/60 hover:text-accent transition-colors text-[0.65rem] font-black tracking-widest uppercase"
          >
            <User size={16} className="md:w-[14px] md:h-[14px]" />
            <span className="hidden sm:inline">Login</span>
          </button>
        )}
        <button 
          onClick={onOpenCart}
          className="relative flex items-center gap-2 bg-accent px-3 md:px-5 py-1.5 md:py-2 rounded-full text-black font-black text-[0.6rem] md:text-[0.65rem] tracking-widest hover:brightness-110 transition-all mr-0 md:-mr-4 shadow-[0_0_15px_rgba(242,125,38,0.3)]"
          id="cart-button"
        >
          <ShoppingBag size={14} className="md:hidden" />
          <span className="hidden md:inline">CART</span>
          <span className="bg-black text-white px-1.5 py-0.5 rounded-full text-[0.45rem] md:text-[0.5rem]">{cartCount}</span>
        </button>
    </div>
  </nav>
);

const ProductCard = ({ product, onAddToCart, isWishlisted, onToggleWishlist, onQuickView }: { 
  product: Product, 
  onAddToCart: (p: Product) => void,
  isWishlisted?: boolean,
  onToggleWishlist?: (p: Product) => void,
  onQuickView?: (p: Product) => void,
  key?: string | number 
}) => {
  const navigate = useNavigate();
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="bg-secondary-bg border border-white/5 group overflow-hidden rounded-xl h-full flex flex-col transition-all duration-300 hover:border-accent/30 cursor-pointer relative"
      id={`product-${product.id}`}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        
        {/* Quick View Button - Desktop Only */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView?.(product);
            }}
            className="bg-white text-black px-4 py-2 rounded font-black text-[0.6rem] tracking-[0.2em] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-accent flex items-center gap-2"
          >
            <Eye size={12} />
            QUICK VIEW
          </button>
        </div>

        {onToggleWishlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md border transition-all duration-300 z-20 ${
              isWishlisted 
                ? 'bg-accent/20 border-accent/40 text-accent' 
                : 'bg-black/40 border-white/10 text-white/40 hover:text-white hover:border-white/30'
            }`}
          >
            <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={isWishlisted ? 0 : 2} />
          </button>
        )}
      </div>
      
      <div className="p-2 md:p-3 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm font-bold tracking-tight uppercase">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-accent text-sm font-black italic tracking-tighter">₹{product.price}</span>
            <span className="text-[0.65rem] opacity-30 line-through font-black italic tracking-tighter">₹{product.originalPrice}</span>
          </div>
        </div>
        <p className="text-white/40 text-[0.6rem] md:text-[0.65rem] font-medium leading-relaxed mb-2 line-clamp-2">{product.description}</p>
        
        {/* Color Options */}
        <div className="flex gap-2 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white/80 border border-white/20 cursor-pointer hover:scale-125 transition-transform" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 border border-white/20 cursor-pointer hover:scale-125 transition-transform" />
          <div className="w-2.5 h-2.5 rounded-full bg-stone-500 border border-white/20 cursor-pointer hover:scale-125 transition-transform" />
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="mt-auto md:hidden w-full bg-accent text-black py-2 font-black text-[0.6rem] tracking-widest rounded transition-all active:scale-95"
        >
          ADD TO BAG
        </button>
      </div>
    </motion.div>
  );
};

const QuickViewModal = ({ 
  product, 
  onClose, 
  onAddToCart, 
  isWishlisted, 
  onToggleWishlist 
}: { 
  product: Product | null, 
  onClose: () => void, 
  onAddToCart: (p: Product) => void,
  isWishlisted: boolean,
  onToggleWishlist: (p: Product) => void
}) => {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const navigate = useNavigate();

  // Reset indices when product changes
  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setSelectedColor(0);
      setSelectedSize('M');
    }
  }, [product]);

  const colors = [
    { name: 'Chrome', class: 'bg-white', filter: 'none' },
    { name: 'Stealth', class: 'bg-zinc-800', filter: 'grayscale(1) brightness(0.8)' },
    { name: 'Cobalt', class: 'bg-blue-900', filter: 'hue-rotate(200deg) saturate(1.5)' },
    { name: 'Oxide', class: 'bg-accent', filter: 'hue-rotate(10deg) saturate(1.2)' },
    { name: 'Forest', class: 'bg-emerald-900', filter: 'hue-rotate(100deg) saturate(1.3)' },
  ];

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-dark-bg border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh] z-10"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-50 p-2 bg-black/40 hover:bg-accent hover:text-black rounded-full transition-all text-white/60"
            >
              <X size={20} />
            </button>

            {/* Left: Image Gallery */}
            <div className="w-full md:w-1/2 h-72 md:h-full bg-secondary-bg relative flex flex-col">
              <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImageIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    src={product.images[activeImageIndex] || product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                    style={{ filter: colors[selectedColor].filter }}
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden pointer-events-none" />
                <div className="absolute bottom-6 left-6 md:hidden">
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">{product.name}</h2>
                  <div className="text-accent font-black">₹{product.price}</div>
                </div>
              </div>

              {/* Mobile Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 md:hidden">
                {product.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeImageIndex ? 'bg-accent w-4 shadow-[0_0_8px_#F27D26]' : 'bg-white/30 hover:bg-white/60'}`}
                  />
                ))}
              </div>

              {/* Desktop Thumbnails Sidebar - Scrollable */}
              <div className="hidden md:flex absolute top-6 bottom-6 left-4 flex-col gap-2 z-20 overflow-y-auto scrollbar-hide scroll-smooth">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-10 h-14 rounded border transition-all overflow-hidden flex-shrink-0 ${idx === activeImageIndex ? 'border-accent shadow-lg shadow-accent/20 ring-1 ring-accent' : 'border-white/10 hover:border-white/30 opacity-40 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Info */}
            <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-scroll scrollbar-hide">
              <style dangerouslySetInnerHTML={{ __html: `.scrollbar-hide::-webkit-scrollbar { display: none; }` }} />
              <div className="hidden md:block mb-8">
                <div className="text-[0.6rem] font-black tracking-[0.5em] text-accent uppercase mb-2">{product.category}</div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none mb-4">{product.name}</h2>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-accent italic tracking-tighter">₹{product.price}</span>
                  <span className="text-lg font-black opacity-30 line-through italic tracking-tighter">₹{product.originalPrice}</span>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[0.6rem] font-black tracking-[0.4em] text-gray-500 uppercase">Select Size // {selectedSize}</h3>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 flex items-center justify-center text-[0.7rem] font-black tracking-widest border transition-all ${selectedSize === size ? 'bg-white text-black border-white' : 'border-white/10 hover:border-white/30 text-white/40'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[0.6rem] font-black tracking-[0.4em] text-gray-500 uppercase">Select Finish // {colors[selectedColor].name}</h4>
                  <div className="flex gap-4">
                    {colors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(index)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${index === selectedColor ? 'border-accent scale-110 shadow-[0_0_10px_rgba(242,125,38,0.4)]' : 'border-white/10 hover:border-white/30'}`}
                      >
                        <div className={`w-full h-full rounded-full ${color.class}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => {
                      onAddToCart(product);
                      onClose();
                    }}
                    className="flex-1 bg-accent text-black py-4 font-black text-xs tracking-[0.4em] hover:brightness-110 transition-all shadow-[0_0_30px_rgba(242,125,38,0.2)]"
                  >
                    ADD TO BAG
                  </button>
                  <button 
                    onClick={() => onToggleWishlist(product)}
                    className={`px-5 border transition-all duration-300 ${isWishlisted ? 'border-accent bg-accent/10 text-accent' : 'border-white/10 hover:border-white/20 text-white/40'}`}
                  >
                    <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={isWishlisted ? 0 : 2} />
                  </button>
                </div>

                <button 
                  onClick={() => {
                    onClose();
                    navigate(`/product/${product.id}`);
                  }}
                  className="w-full text-center text-[0.6rem] font-black tracking-[0.4em] text-white/40 hover:text-white transition-colors uppercase pt-2"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const CartItemRow = ({ item, onUpdateQuantity, onRemove }: { 
  item: CartItem, 
  onUpdateQuantity: (id: string, delta: number) => void,
  onRemove: (id: string) => void,
  key?: string | number
}) => (
  <motion.div 
    layout
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="flex gap-4 items-center py-2 px-4 border-b border-white/5"
  >
    <div className="w-16 h-16 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
      <img 
        src={item.image} 
        alt={item.name} 
        className="w-full h-full object-cover" 
        referrerPolicy="no-referrer"
      />
    </div>
    <div className="flex flex-col flex-grow">
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-[0.7rem] uppercase tracking-tight">{item.name}</h4>
        <button onClick={() => onRemove(item.id)} className="text-gray-500 hover:text-accent transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="text-[0.6rem] opacity-40 mb-2">{item.category} // x{item.quantity}</div>
      <div className="mt-auto flex justify-between items-center">
        <div className="flex items-center gap-3 bg-white/5 rounded px-2 py-0.5">
          <button 
            onClick={() => item.quantity > 1 ? onUpdateQuantity(item.id, -1) : onRemove(item.id)}
            className="p-1 hover:text-accent"
          >
            <Minus size={12} />
          </button>
          <span className="text-[0.7rem] font-black w-4 text-center">{item.quantity}</span>
          <button 
            onClick={() => onUpdateQuantity(item.id, 1)}
            className="p-1 hover:text-accent"
          >
            <Plus size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black italic text-[0.8rem] text-accent">₹{item.price * item.quantity}</span>
          <span className="text-[0.6rem] opacity-30 line-through font-black italic tracking-tighter">₹{item.originalPrice * item.quantity}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

const HomePage = ({ addToCart, wishlistIds, onToggleWishlist, onQuickView }: { 
  addToCart: (p: Product) => void,
  wishlistIds: Set<string>,
  onToggleWishlist: (p: Product) => void,
  onQuickView: (p: Product) => void
}) => (
  <>
    {/* Hero Section */}
    <section className="relative h-auto md:h-screen flex items-center justify-center overflow-hidden border-b border-white/10 py-12 md:py-0" id="home">
      {/* Background Watermark - Animated */}
      <motion.div 
        animate={{ 
          x: [0, -20, 0],
          y: [0, 10, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0"
      >
        <span className="text-[25rem] md:text-[45rem] font-black tracking-tighter leading-none">Original</span>
      </motion.div>

      {/* Decorative vertical lines */}
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-white/5 hidden lg:block" />
      <div className="absolute top-0 right-1/4 w-[1px] h-full bg-white/5 hidden lg:block" />

      {/* Main Content Overlay */}
      <div className="container mx-auto px-6 relative z-20 flex flex-col items-center text-center pt-20 md:pt-0">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 md:mb-8 flex items-center gap-4"
        >
          <span className="h-[1px] w-12 bg-accent/40" />
          <span className="text-[0.6rem] md:text-[0.7rem] font-black tracking-[0.6em] text-accent uppercase">
            Season 01 // Catalyst
          </span>
          <span className="h-[1px] w-12 bg-accent/40" />
        </motion.div>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="relative inline-block"
        >
          <h1 className="text-[12vw] md:text-[10vw] lg:text-[9vw] font-black leading-[0.85] tracking-tighter uppercase flex flex-col items-center">
            <motion.span 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
            >
              Wear Your
            </motion.span>
            <motion.span 
              initial={{ x: 100, opacity: 0 }}
              animate={{ 
                x: 0, 
                opacity: [1, 0.3, 0.8, 0.1, 1, 0.5, 1],
              }}
              transition={{ 
                x: { delay: 0.4, type: 'spring', damping: 15 },
                opacity: { 
                  delay: 2, 
                  duration: 1,
                  times: [0, 0.1, 0.15, 0.2, 0.25, 0.35, 1],
                  repeat: Infinity,
                  repeatDelay: 4,
                  ease: "linear"
                }
              }}
              className="text-outline text-transparent italic mt-1 md:-mt-[1vw] relative inline-block"
            >
              Attitude
            </motion.span>
          </h1>
          
          {/* Accent Element */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            className="absolute -top-4 -right-12 md:-top-8 md:-right-20 pointer-events-none"
          >
            <div className="bg-accent text-black text-[0.45rem] md:text-[0.55rem] font-black px-3 py-1 md:px-4 md:py-2 rounded-full rotate-12 shadow-[0_0_20px_rgba(242,125,38,0.4)] whitespace-nowrap">
              LIMITED QUANTITY
            </div>
          </motion.div>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-4 md:mt-12 text-[0.65rem] md:text-[0.75rem] opacity-50 leading-relaxed max-w-sm md:max-w-md font-medium uppercase tracking-[0.1em]"
        >
          Premium streetwear engineered for the bold. High-density fabrics meet avant-garde silhouettes for the modern movement.
        </motion.p>
      </div>

      {/* Floating Elements */}
      <div className="absolute bottom-10 left-10 hidden xl:flex flex-col gap-2 border-l border-white/20 pl-4">
        <span className="text-[0.5rem] font-black uppercase text-accent tracking-[0.4em]">Auth // Ver: 01.32</span>
        <span className="text-[0.4rem] font-bold uppercase opacity-30 tracking-[0.6em]">Encrypted Stocking</span>
      </div>

      <div className="absolute bottom-10 right-10 hidden xl:flex flex-col items-end gap-2 border-r border-white/20 pr-4">
          <div className="flex gap-4">
            <Instagram size={14} className="opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
            <Twitter size={14} className="opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
          </div>
          <span className="text-[0.4rem] font-black uppercase text-white/30 tracking-[0.4em]">Join the movement</span>
      </div>

      {/* Hero Models - Background layer */}
      <div className="absolute inset-0 z-10 opacity-40 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 2 }}
          className="w-full h-full"
        >
          <img 
            src="https://images.unsplash.com/photo-1550991152-12460a9f28d8?auto=format&fit=crop&q=80&w=1600" 
            className="w-full h-full object-cover grayscale"
            alt=""
          />
        </motion.div>
      </div>

      {/* Gradient Fog */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-dark-bg/80 z-15 pointer-events-none" />
      
      {/* Scroll indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30"
      >
        <span className="text-[0.45rem] font-black uppercase tracking-[0.5em]">Scroll</span>
        <div className="w-[1px] h-8 bg-white/50" />
      </motion.div>
    </section>

    {/* Featured Products */}
    <section className="py-6 md:py-8" id="products">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
          <div className="space-y-3">
             <div className="text-[0.6rem] font-black text-accent tracking-[0.5em] uppercase flex items-center gap-3">
               <span className="w-8 h-[1px] bg-accent/30"></span>
               Curated Catalog
             </div>
             <h2 className="text-3xl md:text-7xl font-logo font-extrabold tracking-[-0.05em] uppercase italic leading-[0.9]">
               Latest <span className="text-outline">Drops</span>
             </h2>
          </div>
        </div>

        {/* Category Quick Links for Mobile */}
        <div className="flex md:hidden gap-3 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4">
          {[
            { label: 'T–Shirts', path: '/tshirt' },
            { label: 'Oversized', path: '/oversized' },
            { label: 'Polos', path: '/polo' },
            { label: 'Cargos', path: '/cargo' },
            { label: 'Linen', path: '/linen' }
          ].map((cat) => (
            <Link 
              key={cat.path}
              to={cat.path}
              className="flex-shrink-0 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[0.6rem] font-black tracking-[0.2em] uppercase hover:bg-accent hover:text-black transition-all"
            >
              {cat.label}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {PRODUCTS.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={addToCart} 
              isWishlisted={wishlistIds.has(product.id)}
              onToggleWishlist={onToggleWishlist}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      </div>
    </section>

    {/* About Section - Brief */}
    <section className="py-24 px-6 bg-accent text-black overflow-hidden relative">
       <motion.div 
          animate={{ x: ['-20%', '0%'] }}
          transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
          className="absolute top-0 left-0 whitespace-nowrap text-[12rem] font-black opacity-10 italic"
       >
         MODERN STREETWEAR AUTHENTIC ORIGINAL SERIES 01
       </motion.div>
       <div className="max-w-4xl mx-auto text-center relative z-10">
         <h2 className="text-5xl md:text-7xl font-black mb-8 leading-none tracking-tighter uppercase">
           Beyond Fashion.<br />A Statement of Soul.
         </h2>
         <p className="text-lg font-bold opacity-80 mb-10 max-w-2xl mx-auto leading-relaxed">
           Original isn't just about clothes. It's about the courage to be yourself. Bold designs, premium fabrics, and a vision that transcends boundaries.
         </p>
         <div className="flex flex-wrap justify-center gap-16 font-black border-t border-black/20 pt-12">
           <div className="flex flex-col items-center">
             <span className="text-4xl italic">100%</span>
             <span className="text-[0.6rem] tracking-[0.3em] uppercase opacity-70">Pre-Shrunk Cotton</span>
           </div>
           <div className="flex flex-col items-center">
             <span className="text-4xl italic">ACID</span>
             <span className="text-[0.6rem] tracking-[0.3em] uppercase opacity-70">Mineral Wash Dye</span>
           </div>
           <div className="flex flex-col items-center">
             <span className="text-4xl italic">GBL</span>
             <span className="text-[0.6rem] tracking-[0.3em] uppercase opacity-70">Worldwide Logistics</span>
           </div>
         </div>
       </div>
    </section>
  </>
);

const CategoryPage = ({ category, title, addToCart, wishlistIds, onToggleWishlist, onQuickView }: { 
  category: string, 
  title: string, 
  addToCart: (p: Product) => void,
  wishlistIds: Set<string>,
  onToggleWishlist: (p: Product) => void,
  onQuickView: (p: Product) => void
}) => {
  const filteredProducts = useMemo(() => {
    if (category === 'all') return PRODUCTS;
    return PRODUCTS.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
  }, [category]);

  return (
    <div className="pt-28 pb-16 px-6 md:px-12 max-w-7xl mx-auto min-h-[60vh]">
      <div className="mb-12">
        <div className="text-[0.6rem] font-black text-accent tracking-[0.4em] uppercase mb-2">Collection // {category}</div>
        <h2 className="text-4xl md:text-6xl font-logo font-extrabold tracking-[-0.05em] uppercase italic">{title}</h2>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center opacity-40 font-black tracking-widest uppercase text-sm">
          No products found in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={addToCart} 
              isWishlisted={wishlistIds.has(product.id)}
              onToggleWishlist={onToggleWishlist}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ReviewsSection = () => {
  const reviews = [
    { id: 1, user: "Alex K.", rating: 5, comment: "Best heavy cotton tee I've ever owned. The fit is exactly what I was looking for.", date: "2 days ago" },
    { id: 2, user: "Marcus R.", rating: 4, comment: "Premium quality is evident. Only wish it came in more colors.", date: "1 week ago" },
    { id: 3, user: "Sarah J.", rating: 5, comment: "The drop shoulder is perfect. Definitely worth the price for this level of craftsmanship.", date: "2 weeks ago" }
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-12 py-12 border-t border-white/5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Rating Summary */}
        <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
          <h2 className="text-2xl font-logo font-extrabold tracking-[-0.02em] uppercase italic mb-8">Customer <span className="text-accent underline underline-offset-8">Feedback</span></h2>
          <div className="flex items-center gap-6 mb-8">
            <div className="text-6xl font-black italic tracking-tighter">4.8</div>
            <div>
              <div className="flex gap-1 text-accent mb-2">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" stroke="none" />
                ))}
              </div>
              <p className="text-[0.6rem] font-black tracking-[0.2em] opacity-40 uppercase">Based on // 124 Reviews</p>
            </div>
          </div>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map(num => (
              <div key={num} className="flex items-center gap-4 text-[0.6rem] font-black tracking-widest opacity-40">
                <span className="w-4">{num}</span>
                <div className="flex-1 h-1 bg-white/5 relative overflow-hidden rounded-full">
                  <div className="absolute inset-0 bg-accent rounded-full" style={{ width: `${num === 5 ? 85 : num === 4 ? 12 : 3}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review List */}
        <div className="lg:col-span-8 space-y-12">
          {reviews.map(review => (
            <div key={review.id} className="border-b border-white/5 pb-10 last:border-0">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <User size={16} className="opacity-40" />
                  </div>
                  <div>
                    <h4 className="text-[0.7rem] font-black uppercase tracking-widest mb-1">{review.user}</h4>
                    <div className="flex gap-0.5 text-accent">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={10} fill="currentColor" stroke="none" />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[0.55rem] font-black uppercase tracking-[0.3em] opacity-30">{review.date}</span>
              </div>
              <p className="text-white/60 text-sm font-medium leading-relaxed italic">"{review.comment}"</p>
              <div className="mt-4 flex gap-4 text-[0.5rem] font-black uppercase tracking-widest opacity-20">
                <button className="hover:text-accent transition-colors">Helpful (12)</button>
                <button className="hover:text-accent transition-colors">Report</button>
              </div>
            </div>
          ))}
          <button className="w-full py-5 border border-white/10 text-[0.6rem] font-black tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-all">
            Load More Reviews
          </button>
        </div>
      </div>
    </section>
  );
};

const ProductDetailsPage = ({ addToCart, wishlistIds, onToggleWishlist, onQuickView }: { 
  addToCart: (p: Product) => void,
  wishlistIds: Set<string>,
  onToggleWishlist: (p: Product) => void,
  onQuickView: (p: Product) => void
}) => {
  const { id } = useParams();
  const product = PRODUCTS.find(p => p.id === id);
  const suggestions = PRODUCTS.filter(p => p.id !== id).slice(0, 4);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset indices when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImageIndex(0);
    setSelectedColor(0);
    setSelectedSize('M');
  }, [id]);

  const isWishlisted = product ? wishlistIds.has(product.id) : false;

  const colors = [
    { name: 'Chrome', class: 'bg-white', filter: 'none' },
    { name: 'Stealth', class: 'bg-zinc-800', filter: 'grayscale(1) brightness(0.8)' },
    { name: 'Cobalt', class: 'bg-blue-900', filter: 'hue-rotate(200deg) saturate(1.5)' },
    { name: 'Oxide', class: 'bg-accent', filter: 'hue-rotate(10deg) saturate(1.2)' },
    { name: 'Forest', class: 'bg-emerald-900', filter: 'hue-rotate(100deg) saturate(1.3)' },
  ];

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  if (!product) return <div className="pt-40 text-center uppercase font-black tracking-[0.5em]">Product not found</div>;

  return (
    <div className="pt-20 lg:pt-32 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col lg:flex-row gap-8 lg:gap-16 mb-8">
        {/* Left: Image Gallery */}
        <div className="w-full lg:w-[35%] flex flex-col md:flex-row gap-4">
          {/* Thumbnails Sidebar - Desktop */}
          <div className="hidden md:flex flex-col gap-3 order-1 h-fit">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-14 h-16 rounded-lg border transition-all overflow-hidden relative ${idx === activeImageIndex ? 'border-accent shadow-[0_0_15px_rgba(242,125,38,0.3)]' : 'border-white/10 hover:border-white/20 opacity-40 hover:opacity-80'}`}
              >
                <img src={img} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>

          {/* Main Image */}
          <div className="flex-1 order-2">
            <div className="aspect-[4/5] max-h-[65vh] rounded-2xl overflow-hidden bg-secondary-bg border border-white/5 relative group">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={product.images[activeImageIndex] || product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700"
                  style={{ filter: colors[selectedColor].filter }}
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              
              {/* Mobile Thumbnails Overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 md:hidden">
                {product.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeImageIndex ? 'bg-accent w-4 shadow-[0_0_8px_#F27D26]' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="w-full lg:w-[65%] flex flex-col justify-center">
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-3xl lg:text-4xl font-black tracking-tighter uppercase italic mb-2 md:mb-3 leading-tight">{product.name}</h2>
            <div className="flex items-center gap-4">
              <div className="text-xl md:text-2xl font-black text-accent italic tracking-tighter">₹{product.price}</div>
              <div className="text-base md:text-lg font-black opacity-30 line-through italic tracking-tighter">₹{product.originalPrice}</div>
            </div>
          </div>

          <div className="space-y-5 md:space-y-6 mb-8 md:mb-10">
            <div className="space-y-2 md:space-y-3">
              <h3 className="text-[0.55rem] md:text-[0.6rem] font-black tracking-[0.4em] text-gray-500 uppercase">Description</h3>
              <p className="text-white/60 leading-relaxed text-xs md:text-sm font-medium">
                {product.description} Premium quality, heavy-weight fabric engineered for durability and style. Features our signature Catalyst process for optimal texture and silhouette retention.
              </p>
            </div>

            <div className="space-y-3 md:space-y-4">
              <h3 className="text-[0.55rem] md:text-[0.6rem] font-black tracking-[0.4em] text-gray-500 uppercase">Select Size // {selectedSize}</h3>
              <div className="flex gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-[0.65rem] md:text-[0.7rem] font-black tracking-widest border transition-all ${selectedSize === size ? 'bg-white text-black border-white' : 'border-white/10 hover:border-white/30 text-white/40'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection moved after sizes */}
            <div className="space-y-3 md:space-y-4">
              <h4 className="text-[0.55rem] md:text-[0.6rem] font-black tracking-[0.4em] text-gray-500 uppercase">Select Finish // {colors[selectedColor].name}</h4>
              <div className="flex gap-4">
                {colors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedColor(index)}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${index === selectedColor ? 'border-accent scale-110' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div className={`w-full h-full rounded-full ${color.class}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:space-y-3">
              <h3 className="text-[0.55rem] md:text-[0.6rem] font-black tracking-[0.4em] text-gray-500 uppercase">Specifications</h3>
              <ul className="text-[0.65rem] md:text-[0.7rem] font-bold space-y-1 md:space-y-1.5 uppercase tracking-widest">
                <li className="flex justify-between border-b border-white/5 pb-1 md:pb-1.5"><span>Fabric</span> <span className="text-white/40 text-[0.6rem] md:text-inherit">100% Premium Cotton // 220 GSM</span></li>
                <li className="flex justify-between border-b border-white/5 pb-1 md:pb-1.5"><span>Fit</span> <span className="text-white/40 text-[0.6rem] md:text-inherit">Oversized Silhouette</span></li>
                <li className="flex justify-between border-b border-white/5 pb-1 md:pb-1.5"><span>Finish</span> <span className="text-white/40 text-[0.6rem] md:text-inherit">Enzyme Washed</span></li>
              </ul>
            </div>

            <div className="flex gap-3 md:gap-4 pt-2">
               <button 
                onClick={() => addToCart(product)}
                className="flex-1 bg-accent text-black py-3.5 md:py-4 font-black text-[0.65rem] md:text-xs tracking-[0.3em] md:tracking-[0.4em] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(242,125,38,0.2)]"
              >
                ADD TO BAG
              </button>
              <button 
                onClick={() => onToggleWishlist(product)}
                className={`px-4 md:px-5 border transition-all duration-300 ${isWishlisted ? 'border-accent bg-accent/10 text-accent' : 'border-white/10 hover:border-white/20 text-white/40'}`}
              >
                <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={isWishlisted ? 0 : 2} />
              </button>
            </div>
          </div>

          <div className="border-t border-white/5 flex gap-10 text-[0.5rem] font-black tracking-[0.3em] opacity-40 uppercase pt-4">
            <div className="flex items-center gap-2 italic"><CheckCircle2 size={12} /> Free Shipping</div>
            <div className="flex items-center gap-2 italic"><CheckCircle2 size={12} /> 14 Day Returns</div>
          </div>
        </div>
      </div>

      {/* Suggestions Section with Slider */}
      <section className="relative group/slider pt-4" id="suggestions">
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-10">
          <div>
            <h2 className="text-3xl font-logo font-extrabold tracking-[-0.02em] uppercase italic mb-2">You might also <span className="text-accent underline underline-offset-8">like</span></h2>
            <p className="text-[0.6rem] font-black tracking-[0.4em] opacity-40 uppercase">Based on your selection</p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative">
          <div 
            id="suggestion-slider"
            className="flex gap-4 md:gap-8 overflow-x-auto pb-8 scrollbar-hide snap-x scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {suggestions.map(p => (
              <div key={p.id} className="min-w-[280px] md:min-w-[320px] snap-start">
                <ProductCard 
                  product={p} 
                  onAddToCart={addToCart} 
                  isWishlisted={wishlistIds.has(p.id)}
                  onToggleWishlist={onToggleWishlist}
                  onQuickView={onQuickView}
                />
              </div>
            ))}
          </div>
        </div>
        
        <button 
          onClick={() => {
            const el = document.getElementById('suggestion-slider');
            if (el) el.scrollBy({ left: -400, behavior: 'smooth' });
          }}
          className="absolute left-4 md:left-8 top-[60%] -translate-y-1/2 w-12 h-12 bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all z-20 hover:bg-accent hover:text-black"
        >
          <ArrowRight size={20} className="rotate-180" />
        </button>
        
        <button 
          onClick={() => {
            const el = document.getElementById('suggestion-slider');
            if (el) el.scrollBy({ left: 400, behavior: 'smooth' });
          }}
          className="absolute right-4 md:right-8 top-[60%] -translate-y-1/2 w-12 h-12 bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all z-20 hover:bg-accent hover:text-black"
        >
          <ArrowRight size={20} />
        </button>
      </section>

      {/* Ratings & Reviews Section */}
      <ReviewsSection />
    </div>
  );
};

const UserProfile = ({ user, onLogout, onAddToCart }: { user: FirebaseUser | null, onLogout: () => void, onAddToCart: (p: Product) => void }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [fetchingWishlist, setFetchingWishlist] = useState(true);
  const navigate = useNavigate();
  const ordersRef = useRef<HTMLDivElement>(null);
  const wishlistRef = useRef<HTMLDivElement>(null);

  const scrollToOrders = () => {
    ordersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToWishlist = () => {
    wishlistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchOrders = () => {
      if (!user) return () => {};
      setFetchingOrders(true);
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(fetchedOrders);
        setFetchingOrders(false);
      }, (error) => {
        console.error("Error fetching orders:", error);
        setFetchingOrders(false);
      });

      return unsubscribe;
    };

    const fetchWishlist = () => {
      if (!user) return () => {};
      setFetchingWishlist(true);
      const q = query(
        collection(db, 'wishlists'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedWishlist = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWishlist(fetchedWishlist);
        setFetchingWishlist(false);
      }, (error) => {
        console.error("Error fetching wishlist:", error);
        setFetchingWishlist(false);
      });

      return unsubscribe;
    };

    const unsubOrders = fetchOrders();
    const unsubWishlist = fetchWishlist();
    return () => {
      unsubOrders();
      unsubWishlist();
    };
  }, [user, navigate]);

  const handleRemoveFromWishlist = async (wishlistId: string) => {
    try {
      await deleteDoc(doc(db, 'wishlists', wishlistId));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="pt-40 pb-24 px-6 md:px-12 max-w-4xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row gap-12 items-center md:items-start mb-20 text-center md:text-left">
        <div className="w-48 h-48 rounded-2xl border-2 border-accent/20 p-1 relative group overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-accent/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-full h-full object-cover rounded-xl relative z-10" />
        </div>
        
        <div className="flex-1 space-y-8">
          <div className="space-y-2">
            <div className="text-[0.6rem] font-black text-accent tracking-[0.5em] uppercase">Identity // Profile</div>
            <h2 className="text-4xl md:text-6xl font-logo font-extrabold tracking-[-0.05em] uppercase italic leading-none">{user.displayName}</h2>
            <p className="text-[0.7rem] font-bold text-white/30 tracking-[0.2em] uppercase">{user.email}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={scrollToOrders}
              className="bg-white text-black py-4 px-8 font-black text-[0.65rem] tracking-[0.3em] uppercase hover:brightness-90 transition-all active:scale-95"
            >
              Check Order Details
            </button>
            <button 
              onClick={scrollToWishlist}
              className="border border-white/10 py-4 px-8 font-black text-[0.65rem] tracking-[0.3em] uppercase hover:bg-white/5 transition-all active:scale-95"
            >
              View Wishlist
            </button>
            <button 
              onClick={onLogout}
              className="border border-white/10 py-4 px-8 font-black text-[0.65rem] tracking-[0.3em] uppercase hover:bg-white/5 transition-all active:scale-95 flex items-center justify-center gap-3 sm:col-span-2"
            >
              <LogOut size={14} className="text-accent" />
              Logout
            </button>
          </div>

          <div className="pt-8 border-t border-white/5">
            <div className="text-[0.55rem] font-black text-white/20 tracking-[0.4em] uppercase mb-6">Account Stats</div>
            <div className="flex justify-center md:justify-start gap-12 font-black italic">
               <div className="flex flex-col">
                 <span className="text-3xl text-accent">{orders.length.toString().padStart(2, '0')}</span>
                 <span className="text-[0.5rem] tracking-[0.3em] opacity-40 uppercase">Total Orders</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-3xl text-accent">{wishlist.length.toString().padStart(2, '0')}</span>
                 <span className="text-[0.5rem] tracking-[0.3em] opacity-40 uppercase">Wishlist Items</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={wishlistRef} className="space-y-10 py-10 border-t border-white/10 mb-20">
        <div className="space-y-2">
          <div className="text-[0.6rem] font-black text-accent tracking-[0.5em] uppercase">Saved // Wishlist</div>
          <h3 className="text-4xl font-black tracking-tighter uppercase italic">Your <span className="text-outline">Collection</span></h3>
        </div>

        {fetchingWishlist ? (
          <div className="py-10 flex justify-center">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : wishlist.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col group">
                <div className="aspect-square relative overflow-hidden">
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                  <button 
                    onClick={() => handleRemoveFromWishlist(item.id)}
                    className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white/40 hover:text-accent transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-[0.7rem] font-black uppercase tracking-tight line-clamp-1">{item.productName}</h4>
                    <span className="text-accent font-black italic text-[0.8rem]">₹{item.productPrice}</span>
                  </div>
                  <button 
                    onClick={() => onAddToCart({
                      id: item.productId,
                      name: item.productName,
                      price: item.productPrice,
                      image: item.productImage,
                      category: '', // This will be missing but fine for cart
                      description: '',
                      originalPrice: item.productPrice * 1.5 // Rough guess or we could store it
                    } as Product)}
                    className="mt-auto w-full bg-white text-black py-2.5 font-black text-[0.6rem] uppercase tracking-widest hover:bg-accent transition-colors"
                  >
                    ADD TO BAG
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl">
            <p className="text-[0.6rem] font-black text-white/40 tracking-[0.4em] uppercase">Your wishlist is empty</p>
            <Link to="/" className="mt-4 inline-block text-[0.6rem] font-black text-accent tracking-[0.4em] uppercase underline underline-offset-4">Explore Items</Link>
          </div>
        )}
      </div>

      <div ref={ordersRef} className="space-y-10 pt-10 border-t border-white/10">
        <div className="space-y-2">
          <div className="text-[0.6rem] font-black text-accent tracking-[0.5em] uppercase">History // Orders</div>
          <h3 className="text-4xl font-black tracking-tighter uppercase italic">Recent <span className="text-outline">Transactions</span></h3>
        </div>

        {fetchingOrders ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 hover:border-white/20 transition-colors">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                  <div className="space-y-1">
                    <p className="text-[0.5rem] font-black text-white/20 tracking-[0.4em] uppercase">Order ID</p>
                    <p className="font-mono text-[0.65rem] font-bold text-accent">#{order.id.slice(0, 12).toUpperCase()}</p>
                  </div>
                  <div className="space-y-1 md:text-right">
                    <p className="text-[0.5rem] font-black text-white/20 tracking-[0.4em] uppercase">Date</p>
                    <p className="text-[0.65rem] font-bold uppercase">{order.createdAt instanceof Timestamp ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Processing...'}</p>
                  </div>
                  <div className="space-y-1 md:text-right">
                    <p className="text-[0.5rem] font-black text-white/20 tracking-[0.4em] uppercase">Status</p>
                    <p className="text-[0.65rem] font-black text-emerald-400 uppercase tracking-widest">{order.status}</p>
                  </div>
                  <div className="space-y-1 md:text-right">
                    <p className="text-[0.5rem] font-black text-white/20 tracking-[0.4em] uppercase">Total</p>
                    <p className="text-lg font-black italic">₹{order.totalAmount}.00</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <p className="text-[0.5rem] font-black text-white/20 tracking-[0.4em] uppercase">Shipping Destination</p>
                    <div className="space-y-1">
                      <p className="text-[0.65rem] font-bold uppercase">{order.shippingDetails?.name}</p>
                      <p className="text-[0.55rem] opacity-60 uppercase">{order.shippingDetails?.address1}</p>
                      <p className="text-[0.55rem] opacity-60 uppercase">
                        {order.shippingDetails?.city}, {order.shippingDetails?.state} - {order.shippingDetails?.pincode}
                      </p>
                      <p className="text-[0.55rem] opacity-40 lowercase">{order.shippingDetails?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[0.5rem] font-black text-white/20 tracking-[0.4em] uppercase">Items</p>
                    <div className="grid gap-2">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2">
                          <div className="flex gap-3 items-center">
                            <span className="text-[0.55rem] font-black text-accent">{item.quantity}X</span>
                            <span className="text-[0.65rem] font-bold uppercase tracking-tight">{item.name}</span>
                          </div>
                          <span className="text-[0.65rem] font-mono opacity-60">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl">
            <p className="text-[0.6rem] font-black text-white/40 tracking-[0.4em] uppercase">No orders found yet</p>
            <Link to="/" className="mt-4 inline-block text-[0.6rem] font-black text-accent tracking-[0.4em] uppercase underline underline-offset-4">Start Shopping</Link>
          </div>
        )}
      </div>
    </div>
  );
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingShippingDetails, setPendingShippingDetails] = useState<any>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Sync user data to Firestore
      const userPath = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp() // rules use request.time
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, userPath);
      }
    } catch (error: any) {
      console.error("Login failed", error);
      let message = "Login failed. Please try again.";
      if (error.code === 'auth/unauthorized-domain') {
        message = "Authorized domain error. Please add this domain to your Firebase Console under Authentication > Settings > Authorized Domains.";
      } else if (error.code === 'auth/popup-blocked') {
        message = "Popup blocked. Please allow popups for this site.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = "Login popup was closed before completion.";
      }
      setAuthError(message);
    }
  };

  const handleLogout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }
    const q = query(collection(db, 'wishlists'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set(snapshot.docs.map(doc => doc.data().productId as string));
      setWishlistIds(ids);
    }, (error) => {
      console.error("Wishlist sync error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const toggleWishlist = async (product: Product) => {
    if (!user) {
      handleLogin();
      return;
    }
    const wishlistId = `${user.uid}_${product.id}`;
    const docRef = doc(db, 'wishlists', wishlistId);
    
    if (wishlistIds.has(product.id)) {
      try {
        await deleteDoc(docRef);
      } catch (error) {
         handleFirestoreError(error, OperationType.DELETE, `wishlists/${wishlistId}`);
      }
    } else {
      try {
        await setDoc(docRef, {
          userId: user.uid,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          productImage: product.image,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `wishlists/${wishlistId}`);
      }
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handlePlaceOrder = (e: FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const shippingDetails = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      address1: formData.get('address1') as string,
      pincode: formData.get('pincode') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
    };

    if (!user) {
      setCheckoutError("Identity verification required. Please login to confirm order.");
      return;
    }

    setPendingShippingDetails(shippingDetails);
    setIsConfirming(true);
  };

  const confirmOrderPlacement = async () => {
    setLoading(true);
    setCheckoutError(null);

    if (!user || !pendingShippingDetails) return;

    const orderPath = 'orders';
    try {
      await addDoc(collection(db, orderPath), {
        userId: user.uid,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount: subtotal,
        status: 'completed',
        shippingDetails: pendingShippingDetails,
        createdAt: serverTimestamp(),
      });

      setLoading(false);
      setOrderSuccess(true);
      setCart([]);
      setIsConfirming(false);
      setPendingShippingDetails(null);
      setTimeout(() => {
        setOrderSuccess(false);
        setCheckoutOpen(false);
      }, 5000);
    } catch (error) {
      console.error("Order placement failed", error);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.CREATE, orderPath);
      } catch (e: any) {
        setCheckoutError("Security protocols rejected the transaction. Please try again or contact support.");
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading && !cart.length && !orderSuccess) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="flex flex-col items-center -space-y-1 md:-space-y-2">
            <div className="text-3xl md:text-5xl font-logo font-extrabold tracking-[-0.05em] text-white accent-glow-white">ORIGINAL</div>
            <div className="text-[0.5rem] md:text-[0.65rem] font-black tracking-[0.5em] md:tracking-[0.8em] text-accent uppercase opacity-80 pl-2">Archives</div>
          </div>
          <div className="w-48 md:w-64 h-1 bg-white/5 relative overflow-hidden">
            <motion.div 
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 w-1/3 bg-accent"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 bg-dark-bg text-white`}>
      <ScrollToTop />
      <Navbar 
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
        onOpenCart={() => setCartOpen(true)}
        user={user}
        onLogin={handleLogin}
      />

      <AnimatePresence>
        {authError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md bg-red-500/90 backdrop-blur-xl border border-red-500/50 p-4 rounded-xl shadow-2xl flex items-start gap-4"
          >
            <div className="flex-1">
              <p className="text-[0.6rem] font-black tracking-widest uppercase mb-1">Authentication Error</p>
              <p className="text-[0.7rem] font-bold leading-relaxed">{authError}</p>
            </div>
            <button onClick={() => setAuthError(null)} className="p-1 hover:bg-black/20 rounded-full transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

        <Routes>
          <Route path="/" element={<HomePage addToCart={addToCart} wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} onQuickView={setQuickViewProduct} />} />
          <Route path="/tshirt" element={<CategoryPage category="t-shirt" title="T–Shirts" addToCart={addToCart} wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} onQuickView={setQuickViewProduct} />} />
          <Route path="/oversized" element={<CategoryPage category="oversized" title="Oversized T–Shirts" addToCart={addToCart} wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} onQuickView={setQuickViewProduct} />} />
          <Route path="/polo" element={<CategoryPage category="polo" title="Prime Polos" addToCart={addToCart} wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} onQuickView={setQuickViewProduct} />} />
          <Route path="/cargo" element={<CategoryPage category="cargo" title="Cargo Pants" addToCart={addToCart} wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} onQuickView={setQuickViewProduct} />} />
          <Route path="/linen" element={<CategoryPage category="linen" title="Linen Shirts" addToCart={addToCart} wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} onQuickView={setQuickViewProduct} />} />
          <Route path="/product/:id" element={<ProductDetailsPage addToCart={addToCart} wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} onQuickView={setQuickViewProduct} />} />
          <Route path="/profile" element={<UserProfile user={user} onLogout={handleLogout} onAddToCart={addToCart} />} />
        </Routes>

        {/* Footer */}
        <footer className="relative pt-8 pb-12 px-6 md:px-12 bg-black overflow-hidden">
          {/* Decorative background text */}
          <div className="absolute top-0 right-0 opacity-[0.02] pointer-events-none select-none -mr-40 -mt-20">
            <span className="text-[25rem] font-black italic tracking-tighter leading-none">LABS</span>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 mb-20">
              {/* Brand Column */}
              <div className="lg:col-span-4 space-y-8">
                <Link to="/" className="flex flex-col -space-y-2 group transition-all">
                  <span className="text-4xl font-logo font-extrabold tracking-[-0.05em] text-white accent-glow-white">ORIGINAL</span>
                  <span className="text-[0.55rem] font-black tracking-[0.8em] text-accent uppercase opacity-50 pl-2">Archives</span>
                </Link>
                <p className="text-[0.7rem] font-bold text-white/40 leading-relaxed uppercase tracking-widest max-w-xs">
                  Redefining modern streetwear through a lens of brutalist elegance and functional avant-garde design. Engineered for the culture.
                </p>
                <div className="flex gap-6">
                  {[
                    { icon: Instagram, label: "Instagram" },
                    { icon: Twitter, label: "Twitter" },
                    { icon: Github, label: "GitHub" }
                  ].map((social, i) => (
                    <a key={i} href="#" className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-accent hover:border-accent/40 transition-all group">
                      <social.icon size={16} className="group-hover:scale-110 transition-transform" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Links Columns */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-[0.6rem] font-black text-accent tracking-[0.4em] uppercase">Archive</h4>
                  <ul className="space-y-4 text-[0.65rem] font-bold tracking-widest text-white/30 uppercase">
                    <li><Link to="/tshirt" className="hover:text-white transition-colors">T–Shirts</Link></li>
                    <li><Link to="/oversized" className="hover:text-white transition-colors">Oversized</Link></li>
                    <li><Link to="/polo" className="hover:text-white transition-colors">Prime Polos</Link></li>
                    <li><Link to="/cargo" className="hover:text-white transition-colors">Cargos</Link></li>
                  </ul>
                </div>
                <div className="space-y-6">
                  <h4 className="text-[0.6rem] font-black text-accent tracking-[0.4em] uppercase">Service</h4>
                  <ul className="space-y-4 text-[0.65rem] font-bold tracking-widest text-white/30 uppercase">
                    <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Shipping</a></li>
                  </ul>
                </div>
              </div>

              {/* Newsletter Column */}
              <div className="lg:col-span-4">
                <div className="bg-secondary-bg border border-white/5 p-8 rounded-2xl relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl -mr-16 -mt-16 group-hover:bg-accent/10 transition-all duration-700"></div>
                  <h4 className="text-xl font-black italic tracking-tighter uppercase mb-2">Join the <span className="text-accent underline underline-offset-4">Collective</span></h4>
                  <p className="text-[0.6rem] font-bold text-white/40 tracking-widest uppercase mb-6">Access private drops and labs insights.</p>
                  
                  <form className="relative">
                    <input 
                      type="email" 
                      placeholder="EMAIL ADDRESS" 
                      className="w-full bg-black/50 border border-white/10 px-4 py-4 rounded-lg text-[0.6rem] font-black tracking-widest uppercase outline-none focus:border-accent transition-all placeholder:opacity-20" 
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-accent hover:scale-110 transition-transform">
                      <ArrowRight size={18} />
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-[0.55rem] font-black tracking-[0.4em] text-white/20 uppercase">
                © 2026 ORIGINAL STREETWEAR LABS // ALL RIGHTS RESERVED
              </p>
              <div className="flex gap-8 text-[0.55rem] font-black tracking-[0.4em] text-white/20 uppercase">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Manifesto</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Quick View Modal */}
        <QuickViewModal 
          product={quickViewProduct} 
          onClose={() => setQuickViewProduct(null)} 
          onAddToCart={addToCart}
          isWishlisted={quickViewProduct ? wishlistIds.has(quickViewProduct.id) : false}
          onToggleWishlist={toggleWishlist}
        />

        {/* Cart Sidebar */}
        <AnimatePresence>
          {cartOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCartOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-sm bg-dark-bg z-[110] flex flex-col border-l border-white/10"
              >
                <div className="p-8 border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-lg font-black italic tracking-widest">BAG ({cart.length})</h2>
                  <button 
                    onClick={() => setCartOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 p-12 text-center">
                      <ShoppingBag size={48} className="mb-4 opacity-10" />
                      <p className="text-[0.6rem] font-black uppercase tracking-[0.4em]">Bag is empty</p>
                      <Link 
                        to="/"
                        onClick={() => setCartOpen(false)}
                        className="mt-6 text-accent text-[0.6rem] font-black tracking-widest border-b border-accent pb-1"
                      >
                        EXPLORE ARCHIV
                      </Link>
                    </div>
                  ) : (
                    cart.map(item => (
                      <CartItemRow 
                        key={item.id} 
                        item={item} 
                        onUpdateQuantity={updateQuantity} 
                        onRemove={removeFromCart} 
                      />
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-8 border-t border-white/10 bg-secondary-bg">
                    <div className="space-y-3 mb-8">
                      <div className="flex justify-between text-[0.65rem] font-bold opacity-40 uppercase tracking-widest">
                        <span>Subtotal</span>
                        <span>₹{subtotal}.00</span>
                      </div>
                      <div className="flex justify-between text-[0.65rem] font-bold opacity-40 uppercase tracking-widest">
                        <span>Shipping</span>
                        <span className="text-accent">FREE</span>
                      </div>
                      <div className="flex justify-between text-xl font-black pt-4 border-t border-white/5">
                        <span>TOTAL</span>
                        <span className="text-accent">₹{subtotal}.00</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setCartOpen(false);
                        setCheckoutOpen(true);
                      }}
                      className="w-full bg-accent text-black py-5 font-black tracking-[0.3em] text-xs hover:brightness-110 transition-all active:scale-95"
                    >
                      CONTINUE TO CHECKOUT
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Checkout Modal */}
        <AnimatePresence>
          {checkoutOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-secondary-bg border border-white/10 p-5 md:p-8 w-full max-w-lg rounded-2xl relative shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar"
              >
                {!orderSuccess ? (
                  <>
                    <button 
                      onClick={() => {
                        setCheckoutOpen(false);
                        setIsConfirming(false);
                      }}
                      className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                    
                    {!isConfirming ? (
                      <>
                        <h2 className="text-2xl md:text-3xl font-logo font-extrabold tracking-[-0.05em] uppercase italic mb-8">
                          Summary <span className="text-accent underline underline-offset-8">Order</span>
                        </h2>
                        
                        <form onSubmit={handlePlaceOrder} className="space-y-5 md:space-y-6">
                          {checkoutError && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-red-500 text-[0.6rem] font-black tracking-widest uppercase">
                              {checkoutError}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[0.55rem] font-black tracking-[0.4em] text-gray-500 uppercase">Identity // Name</label>
                              <input name="name" required placeholder="FULL NAME" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-xs font-bold outline-none focus:border-accent transition-colors placeholder:opacity-20" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[0.55rem] font-black tracking-[0.4em] text-gray-500 uppercase">Communication // Mail</label>
                              <input name="email" type="email" required placeholder="EMAIL@ORIGINAL.LABS" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-xs font-bold outline-none focus:border-accent transition-colors placeholder:opacity-20" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[0.55rem] font-black tracking-[0.4em] text-gray-500 uppercase">Logistics // Street Address</label>
                            <input name="address1" required placeholder="HOUSE NO., STREET, AREA" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-xs font-bold outline-none focus:border-accent transition-colors placeholder:opacity-20" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[0.55rem] font-black tracking-[0.4em] text-gray-500 uppercase">Logistics // City</label>
                              <input name="city" required placeholder="CITY" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-xs font-bold outline-none focus:border-accent transition-colors placeholder:opacity-20" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[0.55rem] font-black tracking-[0.4em] text-gray-500 uppercase">Logistics // Pincode</label>
                              <input name="pincode" required placeholder="PINCODE" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-xs font-bold outline-none focus:border-accent transition-colors placeholder:opacity-20" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[0.55rem] font-black tracking-[0.4em] text-gray-500 uppercase">Logistics // State</label>
                            <input name="state" required placeholder="STATE / PROVINCE" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-xs font-bold outline-none focus:border-accent transition-colors placeholder:opacity-20" />
                          </div>
                          
                          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center md:items-end gap-6 md:gap-0">
                            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                              <p className="text-[0.55rem] font-black text-gray-500 tracking-[0.4em] uppercase mb-1">Authorized Total</p>
                              <p className="text-2xl md:text-3xl font-black italic tracking-tighter">₹{subtotal}.00</p>
                            </div>
                            <button 
                              type="submit"
                              className="w-full md:w-auto bg-accent text-black px-12 py-5 font-black tracking-[0.3em] text-xs hover:brightness-110 active:scale-95 transition-all"
                            >
                              REVIEW ORDER
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="space-y-8">
                        <div className="mb-6 md:mb-8">
                          <h2 className="text-2xl md:text-3xl font-logo font-extrabold tracking-[-0.05em] uppercase italic">
                            Order <span className="text-outline">Summary</span>
                          </h2>
                          <p className="text-[0.5rem] md:text-[0.55rem] text-gray-500 font-black tracking-widest mt-2 uppercase">Please verify your details before final placement</p>
                        </div>

                        <div className="space-y-4 md:space-y-6">
                          <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 space-y-4">
                            <div>
                              <p className="text-[0.45rem] md:text-[0.5rem] text-gray-500 uppercase font-black tracking-widest mb-2">Items To Be Dispatched</p>
                              <div className="space-y-2 max-h-[120px] md:max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                                {cart.map(item => (
                                  <div key={item.id} className="flex justify-between items-center text-[0.6rem] md:text-[0.65rem] font-bold">
                                    <span className="opacity-60">{item.quantity}x {item.name}</span>
                                    <span>₹{item.price * item.quantity}.00</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                              <div>
                                <p className="text-[0.45rem] md:text-[0.5rem] text-gray-500 uppercase font-black tracking-widest mb-1">Ship To</p>
                                <p className="text-[0.65rem] md:text-[0.7rem] font-black uppercase leading-tight">{pendingShippingDetails?.name}</p>
                                <p className="text-[0.55rem] md:text-[0.6rem] opacity-60 uppercase leading-relaxed mt-1">
                                  {pendingShippingDetails?.address1}<br />
                                  {pendingShippingDetails?.city}, {pendingShippingDetails?.state} - {pendingShippingDetails?.pincode}
                                </p>
                              </div>
                              <div>
                                <p className="text-[0.45rem] md:text-[0.5rem] text-gray-500 uppercase font-black tracking-widest mb-1">Identity</p>
                                <p className="text-[0.65rem] md:text-[0.7rem] font-black uppercase break-all">{pendingShippingDetails?.email}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl p-5 md:p-6">
                            <div>
                                <p className="text-[0.45rem] md:text-[0.5rem] text-gray-500 uppercase font-black tracking-widest mb-1">Final Authorization Total</p>
                                <p className="text-2xl md:text-3xl font-black italic">₹{subtotal}.00</p>
                              </div>
                          </div>
                        </div>

                        {checkoutError && (
                          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-red-500 text-[0.6rem] font-black tracking-widest uppercase">
                            {checkoutError}
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-4">
                          <button 
                            onClick={() => setIsConfirming(false)}
                            className="order-2 md:order-1 flex-1 border border-white/10 py-5 font-black text-[0.6rem] md:text-[0.65rem] tracking-[0.3em] uppercase hover:bg-white/5 transition-colors active:scale-95"
                          >
                            GO BACK
                          </button>
                          <button 
                            onClick={confirmOrderPlacement}
                            disabled={loading}
                            className="order-1 md:order-2 flex-[2] bg-accent text-black py-5 font-black text-[0.6rem] md:text-[0.65rem] tracking-[0.3em] uppercase hover:brightness-110 transition-all active:scale-95 disabled:opacity-20"
                          >
                            {loading ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                PROCESSING
                              </span>
                            ) : "PLACE PERMANENT ORDER"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-center">
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="w-24 h-24 bg-accent text-black flex items-center justify-center rounded-full mb-8 shadow-[0_0_40px_rgba(242,125,38,0.4)]"
                    >
                      <CheckCircle2 size={48} />
                    </motion.div>
                    <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">Transaction Complete</h2>
                    <p className="text-white/40 text-sm font-medium mb-8 max-w-sm mx-auto">
                      Access granted. Your order has been registered in the ORIGINAL database.
                    </p>
                    <div className="flex flex-col gap-4 items-center">
                      <button 
                        onClick={() => {
                          setCheckoutOpen(false);
                          setOrderSuccess(false);
                          navigate('/profile');
                        }}
                        className="bg-accent text-black px-12 py-4 font-black text-[0.6rem] tracking-[0.4em] hover:brightness-110 transition-all active:scale-95"
                      >
                        VIEW ORDER LIST
                      </button>
                      <button 
                        onClick={() => {
                          setCheckoutOpen(false);
                          setOrderSuccess(false);
                        }}
                        className="text-white/40 hover:text-white transition-colors text-[0.55rem] font-black tracking-[0.4em] uppercase"
                      >
                        RETURN TO TERMINAL
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
