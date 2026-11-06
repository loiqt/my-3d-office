import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Monitor, Flower2, Smile, Coffee, Volume2, VolumeX, MessageSquare, 
  Users, RotateCcw, Plus, Trash2, Sun, Moon, Send, X, Building2,
  User, RotateCw, Edit3, Check, Navigation, LayoutGrid, Armchair, LogOut
} from 'lucide-react';

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyBzBLcsQIg8reDq6tpvs9FnLgSaxicOfY0",
  authDomain: "my-3d-office-game.firebaseapp.com",
  projectId: "my-3d-office-game",
  storageBucket: "my-3d-office-game.firebasestorage.app",
  messagingSenderId: "723982123363",
  appId: "1:723982123363:web:6c27264a5d926b08f29356",
  measurementId: "G-88L91QZNH2"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'virtual-workplace-3d';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Web Audio Synthesizer ---
class WorkplaceSoundSystem {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  play(type) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'pop_bubble') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'drag') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(340, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'place') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'sit') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'stand') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'delete') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'step') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.03);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === 'throw') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'thwack') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'trip') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'camera') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (err) {
      console.warn("Audio synth error", err);
    }
  }
}
const sfx = new WorkplaceSoundSystem();

// Initial 15 Teammates Templates
const INITIAL_TEAMMATES = [
  { id: 1, name: "Bạn (Player)", gender: "male", hairStyle: "short", role: "Product Creator", isUser: true, status: "Tự do đi dạo 🚶‍♂️", emotion: "✨", color: "#3B82F6", hairColor: "#1E293B", skinColor: "#fde047" },
  { id: 2, name: "Bàn trống #2", gender: "female", hairStyle: "long", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "💡", color: "#EC4899", hairColor: "#BE185D", skinColor: "#fde047" },
  { id: 3, name: "Bàn trống #3", gender: "male", hairStyle: "spiky", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "💻", color: "#10B981", hairColor: "#047857", skinColor: "#fde047" },
  { id: 4, name: "Bàn trống #4", gender: "female", hairStyle: "ponytail", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "☕", color: "#8B5CF6", hairColor: "#4C1D95", skinColor: "#fde047" },
  { id: 5, name: "Bàn trống #5", gender: "male", hairStyle: "short", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "⚡", color: "#F59E0B", hairColor: "#78350F", skinColor: "#fde047" },
  { id: 6, name: "Bàn trống #6", gender: "female", hairStyle: "bob", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "😃", color: "#06B6D4", hairColor: "#155E75", skinColor: "#fde047" },
  { id: 7, name: "Bàn trống #7", gender: "male", hairStyle: "spiky", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "🔥", color: "#EF4444", hairColor: "#991B1B", skinColor: "#fde047" },
  { id: 8, name: "Bàn trống #8", gender: "female", hairStyle: "long", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "🎉", color: "#D97706", hairColor: "#92400E", skinColor: "#fde047" },
  { id: 9, name: "Bàn trống #9", gender: "male", hairStyle: "short", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "🔍", color: "#6366F1", hairColor: "#312E81", skinColor: "#fde047" },
  { id: 10, name: "Bàn trống #10", gender: "female", hairStyle: "ponytail", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "💖", color: "#F43F5E", hairColor: "#881337", skinColor: "#fde047" },
  { id: 11, name: "Bàn trống #11", gender: "male", hairStyle: "beanie", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "🛠️", color: "#14B8A6", hairColor: "#0F766E", skinColor: "#fde047" },
  { id: 12, name: "Bàn trống #12", gender: "female", hairStyle: "bob", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "📊", color: "#84CC16", hairColor: "#3F6212", skinColor: "#fde047" },
  { id: 13, name: "Bàn trống #13", gender: "male", hairStyle: "afro", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "🚀", color: "#A855F7", hairColor: "#6B21A8", skinColor: "#fde047" },
  { id: 14, name: "Bàn trống #14", gender: "female", hairStyle: "long", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "📝", color: "#F97316", hairColor: "#C2410C", skinColor: "#fde047" },
  { id: 15, name: "Bàn trống #15", gender: "male", hairStyle: "spiky", role: "Thành viên nhóm", isUser: false, status: "Đợi người chơi vào...", emotion: "🔒", color: "#64748B", hairColor: "#334155", skinColor: "#fde047" }
];

// Item Catalog for Decorator
const DECOR_INVENTORY = {
  tech: [
    { type: 'laptop', name: 'Laptop Gaming', icon: '💻', desc: 'Máy tính xách tay với đèn LED', defaultScale: 1.0, color: '#1e293b' },
    { type: 'dual_monitors', name: 'Màn hình Kép 4K', icon: '🖥️', desc: 'Hệ thống màn hình mở rộng', defaultScale: 1.0, color: '#0f172a' },
    { type: 'keyboard', name: 'Bàn phím cơ RGB', icon: '⌨️', desc: 'Bàn phím cơ phát sáng', defaultScale: 0.9, color: '#3b82f6' },
    { type: 'desk_mat', name: 'Thảm Di Chuột RGB', icon: '🟦', desc: 'Thảm lót bàn siêu lớn', defaultScale: 1.1, color: '#3b82f6' },
    { type: 'headphones', name: 'Tai nghe Chụp tai', icon: '🎧', desc: 'Tai nghe Studio cao cấp', defaultScale: 0.85, color: '#ec4899' }
  ],
  plants: [
    { type: 'succulent', name: 'Chậu Sen Đá Mini', icon: '🪴', desc: 'Sen đá gốm xinh xắn', defaultScale: 0.8, color: '#10b981' },
    { type: 'monstera', name: 'Cây Trầu Bà Lớn', icon: '🌿', desc: 'Chậu trầu bà lá xẻ tươi mát', defaultScale: 1.1, color: '#059669' },
    { type: 'bonsai', name: 'Cây Bonsai Zen', icon: '🌳', desc: 'Cây bonsai uốn nghệ thuật', defaultScale: 1.0, color: '#047857' },
    { type: 'cactus', name: 'Xương Rồng Hoa', icon: '🌵', desc: 'Xương rồng có bông hồng', defaultScale: 0.75, color: '#84cc16' }
  ],
  personal: [
    { type: 'teddy_bear', name: 'Gấu Bông Nhồi Bông', icon: '🧸', desc: 'Gấu bông lông mềm mại', defaultScale: 0.9, color: '#d97706' },
    { type: 'action_figure', name: 'Mô hình Siêu Nhân', icon: '🦸', desc: 'Mô hình nhân vật trang trí', defaultScale: 0.8, color: '#ef4444' },
    { type: 'framed_photo', name: 'Khung Ảnh Kỷ Niệm', icon: '🖼️', desc: 'Khung ảnh gỗ chụp team', defaultScale: 0.85, color: '#b45309' },
    { type: 'rubber_duck', name: 'Vịt Vàng Debug', icon: '🦆', desc: 'Chú vịt cao su giải code', defaultScale: 0.7, color: '#eab308' },
    { type: 'plush_cat', name: 'Mèo Bông Ngủ', icon: '🐱', desc: 'Mèo bông mềm cuộn tròn', defaultScale: 0.85, color: '#a855f7' }
  ],
  accessories: [
    { type: 'coffee_mug', name: 'Ly Cà Phê Nóng', icon: '☕', desc: 'Ly cà phê bốc khói tỏa hương', defaultScale: 0.7, color: '#f97316' },
    { type: 'desk_lamp', name: 'Đèn Bàn LED', icon: '💡', desc: 'Đèn chiếu sáng ấm áp', defaultScale: 1.0, color: '#f59e0b' },
    { type: 'pen_holder', name: 'Cốc Cắm Bút', icon: '✏️', desc: 'Cốc đựng bút chì & chì màu', defaultScale: 0.75, color: '#06b6d4' },
    { type: 'sticky_notes', name: 'Tập Giấy Ghi Chú', icon: '📝', desc: 'Giấy note màu vàng', defaultScale: 0.65, color: '#facc15' },
    { type: 'water_flask', name: 'Bình Nước Thể Thao', icon: '🥤', desc: 'Bình nước giữ nhiệt inox', defaultScale: 0.75, color: '#3b82f6' }
  ]
};

// Initial desk items mapping
const DEFAULT_DESK_ITEMS = {
  1: [
    { id: 'item-1', type: 'dual_monitors', x: 0, z: -0.1, rotY: 0, scale: 1, color: '#0f172a' },
    { id: 'item-2', type: 'coffee_mug', x: -0.65, z: 0.2, rotY: 0, scale: 0.7, color: '#f97316' },
    { id: 'item-3', type: 'teddy_bear', x: 0.65, z: -0.2, rotY: -0.4, scale: 0.9, color: '#d97706' }
  ],
  2: [
    { id: 'item-21', type: 'dual_monitors', x: 0, z: -0.1, rotY: 0, scale: 1, color: '#0f172a' },
    { id: 'item-22', type: 'keyboard', x: 0, z: 0.25, rotY: 0, scale: 0.9, color: '#ec4899' },
    { id: 'item-23', type: 'monstera', x: 0.75, z: -0.15, rotY: -0.3, scale: 1.1, color: '#059669' }
  ],
  3: [
    { id: 'item-31', type: 'laptop', x: 0, z: 0, rotY: 0, scale: 1, color: '#1e293b' },
    { id: 'item-32', type: 'rubber_duck', x: -0.6, z: 0.2, rotY: 0.5, scale: 0.7, color: '#eab308' },
    { id: 'item-33', type: 'desk_lamp', x: 0.7, z: -0.2, rotY: -0.8, scale: 1, color: '#f59e0b' }
  ]
};

function getDefaultDesk3DPosition(id) {
  const index = id - 1;
  if (index < 8) {
    const col = index;
    const x = (col - 3.5) * 2.55;
    return { x, z: -1.4, rotY: 0 };
  } else {
    const col = index - 8;
    const x = (col - 3.0) * 2.55;
    return { x, z: 1.4, rotY: Math.PI };
  }
}

const LEAF_OFFSETS = [
  { x: 0.05, z: 0.04 },
  { x: -0.06, z: 0.05 },
  { x: 0.04, z: -0.06 },
  { x: -0.05, z: -0.03 },
  { x: 0.0, z: 0.0 }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [officeName, setOfficeName] = useState('VĂN PHÒNG SÁNG TẠO SÀI GÒN');

  const [characterConfig, setCharacterConfig] = useState({
    name: 'Bạn (Player)',
    gender: 'male',
    hairStyle: 'short',
    hairColor: '#1e293b',
    skinColor: '#fde047',
    color: '#3b82f6'
  });

  const [selectedDeskId, setSelectedDeskId] = useState(null);
  const [selectedItemIdOnDesk, setSelectedItemIdOnDesk] = useState(null);
  const [deskConfigs, setDeskConfigs] = useState(DEFAULT_DESK_ITEMS);
  const [onlinePlayers, setOnlinePlayers] = useState([]);

  const [deskLayoutPositions, setDeskLayoutPositions] = useState(() => {
    const pos = {};
    for (let i = 1; i <= 15; i++) {
      pos[i] = getDefaultDesk3DPosition(i);
    }
    return pos;
  });

  const [isSitting, setIsSitting] = useState(false);
  const [seatedChairInfo, setSeatedChairInfo] = useState(null);
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [selectedDeskToMove, setSelectedDeskToMove] = useState(null);
  const [activeTargetTeammate, setActiveTargetTeammate] = useState(null);

  const [dizzyStates, setDizzyStates] = useState({});
  const [trippedStates, setTrippedStates] = useState({});
  const [speechBubbles, setSpeechBubbles] = useState([]);

  const [activeCategory, setActiveCategory] = useState('tech');
  const [activeRightTab, setActiveRightTab] = useState('chat');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingOfficeName, setIsEditingOfficeName] = useState(false);

  const playerPosRef = useRef({ x: -3.5 * 2.55, z: 3.2, targetX: -3.5 * 2.55, targetZ: 3.2 });
  const lastSyncedPosRef = useRef({ x: 0, z: 0 });
  const lastPosSyncTimeRef = useRef(0);
  const flyingProjectilesRef = useRef([]);

  // --- Tự động gán Bàn riêng cho Người chơi online thực sự ---
  const teammates = useMemo(() => {
    const updated = [...INITIAL_TEAMMATES];

    // Bàn 1: Cố định cho Bạn (User hiện tại)
    updated[0] = {
      ...updated[0],
      name: characterConfig.name || 'Bạn (Player)',
      gender: characterConfig.gender || 'male',
      hairStyle: characterConfig.hairStyle || 'short',
      hairColor: characterConfig.hairColor || '#1e293b',
      skinColor: characterConfig.skinColor || '#fde047',
      color: characterConfig.color || '#3b82f6',
      isUser: true,
      status: 'Tự do đi dạo 🚶‍♂️'
    };

    // Bàn 2 trở đi: Tự động gán cho từng người chơi online kết nối vào
    onlinePlayers.forEach((player, index) => {
      const deskIndex = index + 1; // Bàn 2, Bàn 3...
      if (deskIndex < updated.length) {
        updated[deskIndex] = {
          id: deskIndex + 1,
          uid: player.uid,
          name: player.name || `Bạn bè ${deskIndex + 1}`,
          gender: player.gender || 'male',
          hairStyle: player.hairStyle || 'short',
          hairColor: player.hairColor || '#1e293b',
          skinColor: player.skinColor || '#fde047',
          color: player.color || '#ec4899',
          role: 'Người chơi Online 🌐',
          isUser: false,
          status: player.isSitting ? 'Đang ngồi làm việc 🪑' : 'Đang online 🟢',
          emotion: '🎮'
        };
      }
    });

    return updated;
  }, [characterConfig, onlinePlayers]);

  const currentUser = useMemo(() => teammates[0], [teammates]);

  // Ref bindings
  const deskConfigsRef = useRef(deskConfigs);
  deskConfigsRef.current = deskConfigs;

  const deskLayoutPositionsRef = useRef(deskLayoutPositions);
  deskLayoutPositionsRef.current = deskLayoutPositions;

  const dizzyStatesRef = useRef(dizzyStates);
  dizzyStatesRef.current = dizzyStates;

  const trippedStatesRef = useRef(trippedStates);
  trippedStatesRef.current = trippedStates;

  const speechBubblesRef = useRef(speechBubbles);
  speechBubblesRef.current = speechBubbles;

  const selectedDeskIdRef = useRef(selectedDeskId);
  selectedDeskIdRef.current = selectedDeskId;

  const isLayoutModeRef = useRef(isLayoutMode);
  isLayoutModeRef.current = isLayoutMode;

  const isSittingRef = useRef(isSitting);
  isSittingRef.current = isSitting;

  const seatedChairInfoRef = useRef(seatedChairInfo);
  seatedChairInfoRef.current = seatedChairInfo;

  const teammatesRef = useRef(teammates);
  teammatesRef.current = teammates;

  const onlinePlayersRef = useRef(onlinePlayers);
  onlinePlayersRef.current = onlinePlayers;

  const desk3DMeshMapRef = useRef({});

  const [chatMessages, setChatMessages] = useState([
    { id: 'm1', senderId: 2, senderName: 'Hệ thống 3D', text: 'Chào mừng các bạn đến với Văn phòng 3D Châu Âu! 🎉', time: '10:00 AM' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [threeLoaded, setThreeLoaded] = useState(false);

  const canvasContainerRef = useRef(null);
  const threeSceneRef = useRef(null);
  const screenPositionsRef = useRef({});
  const keysPressedRef = useRef({});

  // 1. KHÔI PHỤC ONBOARDING ĐÃ LƯU TỪ LOCALSTORAGE
  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_3d_avatar');
    if (savedAvatar) {
      try {
        const parsed = JSON.parse(savedAvatar);
        setCharacterConfig(parsed);
        setHasOnboarded(true);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSpeechBubbles((prev) => prev.filter((b) => now - b.timestamp < 5000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (window.THREE) {
      setThreeLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = () => setThreeLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn("Firebase Auth Error", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Sync Firebase Data
  useEffect(() => {
    if (!db || !user) return;
    try {
      const desksCol = collection(db, 'artifacts', appId, 'public', 'data', 'desks');
      const unsubDesks = onSnapshot(desksCol, (snapshot) => {
        const loadedDesks = { ...DEFAULT_DESK_ITEMS };
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.items) loadedDesks[docSnap.id] = data.items;
        });
        setDeskConfigs(loadedDesks);
      });

      const chatCol = collection(db, 'artifacts', appId, 'public', 'data', 'chat');
      const unsubChat = onSnapshot(chatCol, (snapshot) => {
        const msgs = [];
        snapshot.forEach((docSnap) => msgs.push({ id: docSnap.id, ...docSnap.data() }));
        if (msgs.length > 0) {
          msgs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
          setChatMessages(msgs);
        }
      });

      const playersCol = collection(db, 'artifacts', appId, 'public', 'data', 'players');
      const unsubPlayers = onSnapshot(playersCol, (snapshot) => {
        const nowSec = Date.now() / 1000;
        const activeRemotePlayers = [];

        snapshot.forEach((docSnap) => {
          const p = docSnap.data();
          if (p.uid && p.uid !== user.uid) {
            const lastSeenSec = p.lastSeen?.seconds || nowSec;
            if (nowSec - lastSeenSec < 15) {
              activeRemotePlayers.push(p);
            }
          }
        });
        setOnlinePlayers(activeRemotePlayers);
      });

      const handleBeforeUnload = () => {
        try {
          const pDoc = doc(db, 'artifacts', appId, 'public', 'data', 'players', user.uid);
          deleteDoc(pDoc);
        } catch (e) {}
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        unsubDesks();
        unsubChat();
        unsubPlayers();
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    } catch (e) {
      console.warn("Firestore sync error", e);
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressedRef.current[e.key.toLowerCase()] = true;
      if (isSitting && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        setIsSitting(false);
        setSeatedChairInfo(null);
        sfx.play('stand');
      }
    };
    const handleKeyUp = (e) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSitting]);

  // --- 3D Scene ---
  useEffect(() => {
    if (!threeLoaded || !canvasContainerRef.current) return;

    const THREE = window.THREE;
    const container = canvasContainerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkMode ? 0x0f172a : 0xfefcf8);
    scene.fog = new THREE.FogExp2(isDarkMode ? 0x0f172a : 0xfefcf8, 0.015);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    renderer.domElement.style.display = 'block';

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    threeSceneRef.current = { scene, camera, renderer };

    const ambientLight = new THREE.AmbientLight(0xfff7ed, isDarkMode ? 0.95 : 1.25);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, isDarkMode ? 1.2 : 1.5);
    sunLight.position.set(-20, 30, 22);
    scene.add(sunLight);

    // Floor
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fCtx = floorCanvas.getContext('2d');
    fCtx.fillStyle = isDarkMode ? '#241d17' : '#dcb085';
    fCtx.fillRect(0, 0, 512, 512);

    const bw = 32, bh = 128;
    for (let y = -128; y < 640; y += 64) {
      for (let x = -128; x < 640; x += 128) {
        fCtx.save();
        fCtx.translate(x, y);
        fCtx.rotate(Math.PI / 4);
        fCtx.fillStyle = isDarkMode ? '#332920' : '#d29f70';
        fCtx.fillRect(0, 0, bw - 2, bh - 2);
        fCtx.restore();
      }
    }
    const parquetTexture = new THREE.CanvasTexture(floorCanvas);
    parquetTexture.wrapS = THREE.RepeatWrapping;
    parquetTexture.wrapT = THREE.RepeatWrapping;
    parquetTexture.repeat.set(10, 8);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 30),
      new THREE.MeshStandardMaterial({ map: parquetTexture, roughness: 0.35 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.userData = { isFloorPlane: true };
    scene.add(floor);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: isDarkMode ? 0x1e293b : 0xf8f6f0, roughness: 0.6 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(44, 11, 0.4), wallMat);
    backWall.position.set(0, 5.5, -14);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 11, 30), wallMat);
    leftWall.position.set(-22, 5.5, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 11, 30), wallMat);
    rightWall.position.set(22, 5.5, 0);
    scene.add(rightWall);

    // Signboard
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 256;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = isDarkMode ? '#0f172a' : '#2a1a08';
    sCtx.fillRect(0, 0, 1024, 256);
    sCtx.strokeStyle = '#d4a373';
    sCtx.lineWidth = 12;
    sCtx.strokeRect(16, 16, 992, 224);
    sCtx.fillStyle = '#fef08a';
    sCtx.font = 'bold italic 44px Georgia, serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText(`🏛️ ${officeName.toUpperCase()}`, 512, 128);

    const signTexture = new THREE.CanvasTexture(signCanvas);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 2.75),
      new THREE.MeshBasicMaterial({ map: signTexture, transparent: true })
    );
    signMesh.position.set(0, 4.8, -13.68);
    scene.add(signMesh);

    const desksGroup = new THREE.Group();
    scene.add(desksGroup);

    const remotePlayersGroup = new THREE.Group();
    scene.add(remotePlayersGroup);

    const avatarGroupMapRef = {};
    const dizzyDucksGroupMapRef = {};
    const zzzSpriteMapRef = {};
    const remotePlayerMeshMapRef = {};

    let playerAvatarMeshRef = null;
    let playerAvatarArmsRef = [];
    let playerThighsRef = [];
    let playerShinsRef = [];

    function create3DItemMesh(item, isSelected, deskId) {
      const group = new THREE.Group();
      const col = item.color ? parseInt(item.color.replace('#', '0x')) : 0x3b82f6;

      if (item.type === 'laptop') {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.45), new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.8 }));
        base.position.y = 0.015;
        group.add(base);
        const screen = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.02), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
        screen.position.set(0, 0.22, -0.2);
        screen.rotation.x = -0.2;
        group.add(screen);
      } else if (item.type === 'dual_monitors') {
        const m1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.48, 0.03), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
        m1.position.set(-0.42, 0.45, 0);
        group.add(m1);
        const m2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.48, 0.03), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
        m2.position.set(0.42, 0.45, 0);
        group.add(m2);
      } else {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), new THREE.MeshStandardMaterial({ color: col }));
        box.position.y = 0.09;
        group.add(box);
      }

      group.position.set(item.x || 0, 0.75, item.z || 0);
      group.rotation.y = item.rotY || 0;
      const s = item.scale || 1;
      group.scale.set(s, s, s);
      group.userData = { itemId: item.id, itemData: item, deskId };
      return group;
    }

    function createDetailedHumanAvatarMesh(tm, isPlayer = false, isSeated = false) {
      const avatarGroup = new THREE.Group();
      if (!isPlayer) avatarGroup.position.set(0, 0, 0.75);

      const shirtColor = tm.color ? parseInt(tm.color.replace('#', '0x')) : 0x3b82f6;
      const hairColor = tm.hairColor ? parseInt(tm.hairColor.replace('#', '0x')) : 0x1e293b;
      const skinColor = tm.skinColor ? parseInt(tm.skinColor.replace('#', '0x')) : 0xfde047;

      const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5 });
      const clothMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
      const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.8 });

      const hips = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.24), pantsMat);
      hips.position.y = 0.45;
      avatarGroup.add(hips);

      const thighsGroup = new THREE.Group();
      thighsGroup.position.y = 0.42;

      const leftThighGroup = new THREE.Group();
      leftThighGroup.position.x = -0.11;
      const leftThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.25, 12), pantsMat);
      leftThighMesh.position.y = -0.125;
      leftThighGroup.add(leftThighMesh);

      const rightThighGroup = new THREE.Group();
      rightThighGroup.position.x = 0.11;
      const rightThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.25, 12), pantsMat);
      rightThighMesh.position.y = -0.125;
      rightThighGroup.add(rightThighMesh);

      thighsGroup.add(leftThighGroup);
      thighsGroup.add(rightThighGroup);
      avatarGroup.add(thighsGroup);

      const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.24), clothMat);
      torsoMesh.position.y = 0.72;
      avatarGroup.add(torsoMesh);

      const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.38, 10), clothMat);
      arm1.position.set(-0.27, 0.7, 0);
      avatarGroup.add(arm1);

      const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.38, 10), clothMat);
      arm2.position.set(0.27, 0.7, 0);
      avatarGroup.add(arm2);

      const headGroup = new THREE.Group();
      headGroup.position.y = 1.1;
      const headBase = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), skinMat);
      headGroup.add(headBase);

      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
      hair.position.y = 0.03;
      headGroup.add(hair);

      avatarGroup.add(headGroup);

      if (isPlayer) {
        playerAvatarArmsRef = [arm1, arm2];
        playerThighsRef = [leftThighGroup, rightThighGroup];
      }

      if (!isPlayer || isSeated) {
        leftThighGroup.rotation.x = -Math.PI / 2;
        rightThighGroup.rotation.x = -Math.PI / 2;
        avatarGroup.position.y = 0.15;
      }

      avatarGroup.userData = { teammateId: tm.id || tm.uid, isAvatarObject: true };
      avatarGroupMapRef[tm.id || tm.uid] = avatarGroup;

      return avatarGroup;
    }

    // Render 15 Desks
    teammatesRef.current.forEach((tm) => {
      const pos = deskLayoutPositionsRef.current[tm.id] || getDefaultDesk3DPosition(tm.id);
      const deskGroup = new THREE.Group();
      deskGroup.position.set(pos.x, 0, pos.z);
      deskGroup.rotation.y = pos.rotY;
      deskGroup.userData = { deskId: tm.id, teammate: tm, isDeskUnit: true };
      desk3DMeshMapRef.current[tm.id] = deskGroup;

      const tableTop = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.08, 1.3),
        new THREE.MeshStandardMaterial({ color: isDarkMode ? 0x334155 : 0xe2e8f0, roughness: 0.4 })
      );
      tableTop.position.y = 0.71;
      deskGroup.add(tableTop);

      const chairGroup = new THREE.Group();
      chairGroup.position.set(0, 0, 0.8);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.65), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      seat.position.y = 0.45;
      seat.userData = { isChair: true, deskId: tm.id, chairType: 'desk_chair' };
      chairGroup.add(seat);
      deskGroup.add(chairGroup);

      if (!tm.isUser) {
        const avatarMesh = createDetailedHumanAvatarMesh(tm, false, true);
        deskGroup.add(avatarMesh);
      }

      // Nametag บน bàn
      const bubbleCanvas = document.createElement('canvas');
      bubbleCanvas.width = 280;
      bubbleCanvas.height = 120;
      const bCtx = bubbleCanvas.getContext('2d');
      bCtx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      if (bCtx.roundRect) bCtx.roundRect(10, 10, 260, 100, 16); else bCtx.fillRect(10, 10, 260, 100);
      bCtx.fill();
      bCtx.lineWidth = 4;
      bCtx.strokeStyle = tm.color || '#3b82f6';
      bCtx.stroke();
      bCtx.fillStyle = '#ffffff';
      bCtx.font = 'bold 24px Inter, sans-serif';
      bCtx.textAlign = 'center';
      bCtx.fillText(`${tm.emotion || '💻'} Bàn #${tm.id}`, 140, 50);
      bCtx.font = '20px Inter, sans-serif';
      bCtx.fillStyle = '#60a5fa';
      bCtx.fillText(tm.name, 140, 85);

      const bubbleTexture = new THREE.CanvasTexture(bubbleCanvas);
      const bubbleSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTexture, transparent: true }));
      bubbleSprite.scale.set(1.9, 0.9, 1);
      bubbleSprite.position.set(0, 2.35, 0);
      deskGroup.add(bubbleSprite);

      const items = deskConfigsRef.current[tm.id] || [];
      const itemsContainer = new THREE.Group();
      items.forEach((item) => itemsContainer.add(create3DItemMesh(item, item.id === selectedItemIdOnDesk, tm.id)));
      deskGroup.add(itemsContainer);

      desksGroup.add(deskGroup);
    });

    const playerAvatarGroup = new THREE.Group();
    playerAvatarGroup.position.set(playerPosRef.current.x, 0, playerPosRef.current.z);
    const playerAvatarMesh = createDetailedHumanAvatarMesh(currentUser, true, isSittingRef.current);
    playerAvatarGroup.add(playerAvatarMesh);
    scene.add(playerAvatarGroup);
    playerAvatarMeshRef = playerAvatarGroup;

    let cameraAngleX = 0;
    let cameraAngleY = 0.52;
    let cameraDistance = 24;
    let cameraTargetCenter = new THREE.Vector3(0, 0, 0);

    let isLeftMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const domElem = renderer.domElement;

    const getRaycastIntersects = (e) => {
      const rect = domElem.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      return raycaster.intersectObjects([floor, ...desksGroup.children, ...remotePlayersGroup.children], true);
    };

    const onPointerDown = (e) => {
      e.preventDefault();
      const intersects = getRaycastIntersects(e);

      if (e.button === 0) {
        if (intersects.length > 0) {
          let clickedFloorPoint = null;
          let clickedChairObj = null;

          for (let i = 0; i < intersects.length; i++) {
            let obj = intersects[i].object;

            if (obj.userData?.isFloorPlane && !clickedFloorPoint) {
              clickedFloorPoint = intersects[i].point;
            }
            if (obj.userData?.isChair && !clickedChairObj) {
              clickedChairObj = obj;
            }

            // TƯƠNG TÁC CLICK VÀO NGƯỜI CHƠI KHÁC HOẶC BẠN BÈ ONLINE
            while (obj && obj.parent !== scene) {
              if (obj.userData?.isAvatarObject) {
                const targetId = obj.userData.teammateId;
                let foundTm = teammatesRef.current.find((t) => t.id === targetId || t.uid === targetId);

                if (!foundTm) {
                  const remoteP = onlinePlayersRef.current.find((p) => p.uid === targetId);
                  if (remoteP) {
                    foundTm = {
                      id: remoteP.uid,
                      name: remoteP.name || 'Bạn bè Online',
                      role: 'Người chơi Online 🌐',
                      color: remoteP.color || '#3b82f6',
                      hairStyle: remoteP.hairStyle || 'short',
                      emotion: '🎮',
                      isUser: false
                    };
                  }
                }

                if (foundTm && !foundTm.isUser) {
                  setActiveTargetTeammate(foundTm);
                  sfx.play('click');
                  return;
                }
              }
              obj = obj.parent;
            }
          }

          if (clickedChairObj) {
            const deskId = clickedChairObj.userData?.deskId;
            if (deskId) {
              const dPos = deskLayoutPositionsRef.current[deskId] || getDefaultDesk3DPosition(deskId);
              const targetSeatWorldPos = { x: dPos.x, y: 0.45, z: dPos.z + (dPos.rotY === 0 ? 0.8 : -0.8) };
              playerPosRef.current.targetX = targetSeatWorldPos.x;
              playerPosRef.current.targetZ = targetSeatWorldPos.z;
              setSeatedChairInfo({ deskId, seatPos: targetSeatWorldPos, rot: dPos.rotY });
              sfx.play('step');
              return;
            }
          }

          if (clickedFloorPoint) {
            if (isSittingRef.current) {
              setIsSitting(false);
              setSeatedChairInfo(null);
              sfx.play('stand');
            }
            playerPosRef.current.targetX = Math.max(-20, Math.min(20, clickedFloorPoint.x));
            playerPosRef.current.targetZ = Math.max(-13, Math.min(13, clickedFloorPoint.z));
            sfx.play('step');
          }
        }

        isLeftMouseDown = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerMove = (e) => {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      if (isLeftMouseDown && selectedDeskIdRef.current === null) {
        cameraAngleX -= deltaX * 0.006;
        cameraAngleY = Math.max(0.15, Math.min(1.25, cameraAngleY + deltaY * 0.006));
      }
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => { isLeftMouseDown = false; };
    const onWheel = (e) => {
      e.preventDefault();
      cameraDistance = Math.max(8, Math.min(45, cameraDistance + e.deltaY * 0.02));
    };

    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    let animationFrameId;
    let walkClock = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const nowTime = Date.now();

      // Đồng bộ Nhân vật 3D Bạn bè Online
      const activeUids = new Set();
      onlinePlayersRef.current.forEach((rPlayer) => {
        activeUids.add(rPlayer.uid);
        let rMeshGroup = remotePlayerMeshMapRef[rPlayer.uid];

        if (!rMeshGroup) {
          rMeshGroup = createDetailedHumanAvatarMesh({
            id: rPlayer.uid,
            name: rPlayer.name || 'Bạn bè',
            color: rPlayer.color || '#ec4899',
            gender: rPlayer.gender || 'male',
            hairStyle: rPlayer.hairStyle || 'short',
            hairColor: rPlayer.hairColor || '#1e293b',
            skinColor: rPlayer.skinColor || '#fde047'
          }, false, rPlayer.isSitting);

          rMeshGroup.position.set(rPlayer.x || 0, 0, rPlayer.z || 0);
          remotePlayersGroup.add(rMeshGroup);
          remotePlayerMeshMapRef[rPlayer.uid] = rMeshGroup;
        }

        rMeshGroup.position.x += (rPlayer.x - rMeshGroup.position.x) * 0.15;
        rMeshGroup.position.z += (rPlayer.z - rMeshGroup.position.z) * 0.15;
        if (rPlayer.rotY !== undefined) rMeshGroup.rotation.y = rPlayer.rotY;
      });

      Object.keys(remotePlayerMeshMapRef).forEach((uid) => {
        if (!activeUids.has(uid)) {
          remotePlayersGroup.remove(remotePlayerMeshMapRef[uid]);
          delete remotePlayerMeshMapRef[uid];
        }
      });

      // Di chuyển WASD
      const moveSpeed = 0.12;
      let dx = 0, dz = 0;
      const keys = keysPressedRef.current;
      if (keys['w'] || keys['arrowup']) dz -= moveSpeed;
      if (keys['s'] || keys['arrowdown']) dz += moveSpeed;
      if (keys['a'] || keys['arrowleft']) dx -= moveSpeed;
      if (keys['d'] || keys['arrowright']) dx += moveSpeed;

      if (dx !== 0 || dz !== 0) {
        playerPosRef.current.targetX = Math.max(-20, Math.min(20, playerPosRef.current.x + dx));
        playerPosRef.current.targetZ = Math.max(-13, Math.min(13, playerPosRef.current.z + dz));
      }

      const curr = playerPosRef.current;
      const distX = curr.targetX - curr.x;
      const distZ = curr.targetZ - curr.z;
      const dist = Math.sqrt(distX * distX + distZ * distZ);

      if (dist > 0.05) {
        curr.x += distX * 0.12;
        curr.z += distZ * 0.12;
        walkClock += 0.25;

        if (playerAvatarMeshRef) playerAvatarMeshRef.rotation.y = Math.atan2(distX, distZ);
        playerThighsRef.forEach((thigh, idx) => {
          if (thigh) thigh.rotation.x = Math.sin(walkClock + idx * Math.PI) * 0.6;
        });
      } else {
        curr.x = curr.targetX;
        curr.z = curr.targetZ;
        if (seatedChairInfoRef.current && !isSittingRef.current) {
          setIsSitting(true);
          sfx.play('sit');
        }
      }

      if (playerAvatarMeshRef) {
        playerAvatarMeshRef.position.x = curr.x;
        playerAvatarMeshRef.position.z = curr.z;
      }

      // Đẩy tọa độ di chuyển lên Firebase (Throttle 150ms)
      if (user && db) {
        const distToLastSynced = Math.sqrt(
          Math.pow(lastSyncedPosRef.current.x - curr.x, 2) + Math.pow(lastSyncedPosRef.current.z - curr.z, 2)
        );
        if ((distToLastSynced > 0.1 || nowTime - lastPosSyncTimeRef.current > 3000) && (nowTime - lastPosSyncTimeRef.current > 150)) {
          lastSyncedPosRef.current = { x: curr.x, z: curr.z };
          lastPosSyncTimeRef.current = nowTime;
          try {
            const playerDoc = doc(db, 'artifacts', appId, 'public', 'data', 'players', user.uid);
            setDoc(playerDoc, {
              uid: user.uid,
              name: currentUser.name,
              x: curr.x,
              z: curr.z,
              rotY: playerAvatarMeshRef ? playerAvatarMeshRef.rotation.y : 0,
              color: currentUser.color,
              gender: currentUser.gender,
              hairStyle: currentUser.hairStyle,
              hairColor: currentUser.hairColor,
              skinColor: currentUser.skinColor,
              isSitting: isSittingRef.current,
              lastSeen: serverTimestamp()
            }, { merge: true });
          } catch (e) {}
        }
      }

      const cx = cameraTargetCenter.x + cameraDistance * Math.sin(cameraAngleX) * Math.cos(cameraAngleY);
      const cy = cameraTargetCenter.y + cameraDistance * Math.sin(cameraAngleY);
      const cz = cameraTargetCenter.z + cameraDistance * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);
      camera.position.set(cx, cy, cz);
      camera.lookAt(cameraTargetCenter);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
    };
  }, [threeLoaded, isDarkMode, officeName, user]);

  // 2. HÀM TỰ LƯU ONBOARDING VÀO LOCALSTORAGE + FIREBASE
  const handleCompleteOnboarding = async (e) => {
    e.preventDefault();
    if (!characterConfig.name.trim()) return;
    sfx.play('chime');

    // Lưu vào trình duyệt để không bắt tạo lại lần sau
    localStorage.setItem('user_3d_avatar', JSON.stringify(characterConfig));
    setHasOnboarded(true);

    // Đẩy trực tiếp lên Firebase
    if (user && db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', user.uid), {
          uid: user.uid,
          name: characterConfig.name.trim(),
          gender: characterConfig.gender,
          hairStyle: characterConfig.hairStyle,
          hairColor: characterConfig.hairColor,
          skinColor: characterConfig.skinColor,
          color: characterConfig.color,
          x: playerPosRef.current.x,
          z: playerPosRef.current.z,
          lastSeen: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn("Error saving onboarding data", err);
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sfx.play('pop_bubble');

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    if (db) {
      try {
        const chatCol = collection(db, 'artifacts', appId, 'public', 'data', 'chat');
        setDoc(doc(chatCol, newMsg.id), { ...newMsg, timestamp: serverTimestamp() });
      } catch (err) {}
    }
  };

  return (
    <div className={`w-screen h-screen overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      
      <style>{`
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          overflow: hidden !important;
        }
      `}</style>
      
      {/* ONBOARDING MODAL TỰ LƯU */}
      {!hasOnboarded && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30 mb-1">
                <Building2 className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-white">Tạo Nhân Vật Văn Phòng 3D</h1>
              <p className="text-xs text-slate-400">Tùy chỉnh diện mạo & sở hữu Bàn làm việc riêng trong 3D</p>
            </div>

            <form onSubmit={handleCompleteOnboarding} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Tên hiển thị nhân vật:</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên của bạn..."
                  value={characterConfig.name}
                  onChange={(e) => setCharacterConfig({ ...characterConfig, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Màu áo hiển thị 3D:</label>
                <div className="flex items-center gap-3">
                  {['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCharacterConfig({ ...characterConfig, color: c })}
                      className={`w-9 h-9 rounded-full border-2 transition ${characterConfig.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl transition shadow-xl shadow-blue-600/40 mt-4 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> Bước Vào Văn Phòng 3D Ngay
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className={`h-16 border-b px-6 flex items-center justify-between z-10 shadow-sm shrink-0 ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight flex items-center gap-2 text-amber-400 font-serif">
              🏛️ {officeName}
            </h1>
            <p className="text-[11px] text-slate-400">Click ghế để ngồi • Bạn bè online tự động gán vào Bàn riêng</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setIsEditingProfile(true); sfx.play('click'); }}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition text-xs font-semibold"
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: currentUser.color }}>
              {currentUser.name.substring(0, 1).toUpperCase()}
            </div>
            <span>{currentUser.name}</span>
            <Edit3 className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 bg-slate-800 border border-slate-700 rounded-xl">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative bg-slate-950 overflow-hidden">
          <div ref={canvasContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing relative" />

          {/* Controls HUD */}
          <div className="absolute top-4 left-6 bg-slate-900/85 backdrop-blur border border-slate-800 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-4 shadow-xl z-20 text-slate-300">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">L-Click Ghế</span> Ngồi vào ghế
            </div>
            <div className="h-4 w-[1px] bg-slate-700" />
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              🟢 Live: {onlinePlayers.length + 1} người chơi online
            </div>
          </div>

          {/* Quick Desk Navigation */}
          <div className="absolute bottom-6 left-6 right-80 flex items-center gap-2 overflow-x-auto p-2 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl z-10 shadow-2xl">
            <span className="text-xs font-semibold px-3 text-slate-400 uppercase tracking-wider">
              Bàn:
            </span>
            {teammates.map((tm) => (
              <button
                key={tm.id}
                onClick={() => { sfx.play('camera'); setSelectedDeskId(tm.id); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                  selectedDeskId === tm.id
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-700/80'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tm.color }} />
                #{tm.id} {tm.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right Community & Chat Panel */}
        <div className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col z-10 shadow-lg shrink-0">
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveRightTab('chat')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                activeRightTab === 'chat' ? 'border-blue-500 text-blue-400 bg-slate-800/40' : 'border-transparent text-slate-400'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Trò chuyện Live
            </button>
            <button
              onClick={() => setActiveRightTab('members')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                activeRightTab === 'members' ? 'border-blue-500 text-blue-400 bg-slate-800/40' : 'border-transparent text-slate-400'
              }`}
            >
              <Users className="w-4 h-4" /> Online ({onlinePlayers.length + 1})
            </button>
          </div>

          {activeRightTab === 'chat' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-blue-400">{msg.senderName}</span>
                      <span className="text-slate-500">{msg.time}</span>
                    </div>
                    <div className="p-2.5 rounded-xl text-xs bg-slate-800 border border-slate-700">
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="Nhắn tin..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {activeRightTab === 'members' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase px-2 mb-1">
                Bạn (Bàn #1)
              </div>
              <div className="p-2.5 rounded-xl border border-blue-500/50 bg-blue-600/10 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md" style={{ backgroundColor: currentUser.color }}>
                  ✨
                </div>
                <div>
                  <div className="font-semibold text-xs text-white">{currentUser.name}</div>
                  <div className="text-[10px] text-blue-400 font-medium">Đang trong Bàn #1</div>
                </div>
              </div>

              <div className="text-[11px] font-bold text-slate-400 uppercase px-2 mb-1 mt-4">
                Bạn bè Online ({onlinePlayers.length})
              </div>
              {onlinePlayers.map((p, idx) => (
                <div key={p.uid} className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md" style={{ backgroundColor: p.color || '#ec4899' }}>
                    🌐
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">{p.name || 'Friend'}</div>
                    <div className="text-[10px] text-emerald-400 font-medium">Được gán vào Bàn #{idx + 2}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" /> Đổi Tên & Ngoại Hình Nhân Vật 3D
              </h3>
              <button onClick={() => setIsEditingProfile(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tên của bạn:</label>
                <input
                  type="text"
                  value={characterConfig.name}
                  onChange={(e) => {
                    const newConfig = { ...characterConfig, name: e.target.value };
                    setCharacterConfig(newConfig);
                    localStorage.setItem('user_3d_avatar', JSON.stringify(newConfig));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Màu áo:</label>
                <div className="flex items-center gap-2">
                  {['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        const newConfig = { ...characterConfig, color: c };
                        setCharacterConfig(newConfig);
                        localStorage.setItem('user_3d_avatar', JSON.stringify(newConfig));
                      }}
                      className={`w-7 h-7 rounded-full border-2 transition ${characterConfig.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button onClick={() => setIsEditingProfile(false)} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg">
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}