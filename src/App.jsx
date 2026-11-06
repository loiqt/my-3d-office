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

// Initial 15 Teammates & Workstations
const INITIAL_TEAMMATES = [
  { id: 1, name: "Bạn (Player)", gender: "male", hairStyle: "short", role: "Product Creator", isUser: true, status: "Tự do đi dạo 🚶‍♂️", emotion: "✨", color: "#3B82F6", hairColor: "#1E293B", skinColor: "#fde047" },
  { id: 2, name: "Sarah Chen", gender: "female", hairStyle: "long", role: "Lead UI/UX Designer", isUser: false, status: "Vẽ Figma Icon 🎨", emotion: "💡", color: "#EC4899", hairColor: "#BE185D", skinColor: "#fde047" }
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

// Default Desk Layout Positions
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

// Cố định vị trí tán lá cây tĩnh
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
  const [teammates, setTeammates] = useState(INITIAL_TEAMMATES);

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
  const flyingProjectilesRef = useRef([]);

  // Dynamic References to avoid re-mounting Three.js canvas on state change
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

  const desk3DMeshMapRef = useRef({});

  const [chatMessages, setChatMessages] = useState([
    { id: 'm1', senderId: 2, senderName: 'Sarah Chen', text: 'Chào mừng các bạn đến với Văn phòng 3D Châu Âu siêu mượt! 🎉', time: '10:00 AM' },
    { id: 'm2', senderId: 3, senderName: 'Alex Rivers', text: 'Bạn có thể nhấp chọn ghế bất kỳ để ngồi vào ghế nghỉ ngơi nhé! 🪑', time: '10:02 AM' },
    { id: 'm3', senderId: 4, senderName: 'Elena Rostova', text: 'Thử bật Chế độ Sắp Xếp Bàn để kéo di chuyển toàn bộ bàn làm việc xem! 📐', time: '10:05 AM' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [threeLoaded, setThreeLoaded] = useState(false);

  const canvasContainerRef = useRef(null);
  const threeSceneRef = useRef(null);
  const screenPositionsRef = useRef({});
  const keysPressedRef = useRef({});

  const currentUser = useMemo(() => teammates.find(t => t.isUser) || teammates[0], [teammates]);

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
      }, (err) => console.warn("Firestore desks error", err));

      const chatCol = collection(db, 'artifacts', appId, 'public', 'data', 'chat');
      const unsubChat = onSnapshot(chatCol, (snapshot) => {
        const msgs = [];
        snapshot.forEach((docSnap) => msgs.push({ id: docSnap.id, ...docSnap.data() }));
        if (msgs.length > 0) {
          msgs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
          setChatMessages(msgs);
        }
      }, (err) => console.warn("Firestore chat error", err));

      return () => {
        unsubDesks();
        unsubChat();
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

  // --- 3D Scene Initialization ---
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
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    threeSceneRef.current = { scene, camera, renderer };

    // Warm & European Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xfff7ed, isDarkMode ? 0.95 : 1.25);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, isDarkMode ? 1.2 : 1.5);
    sunLight.position.set(-20, 30, 22);
    scene.add(sunLight);

    const fillLight1 = new THREE.PointLight(0xfde047, 0.9, 25);
    fillLight1.position.set(-10, 6, 0);
    scene.add(fillLight1);

    const fillLight2 = new THREE.PointLight(0xf97316, 0.9, 25);
    fillLight2.position.set(10, 6, 0);
    scene.add(fillLight2);

    // Parquet Floor Texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fCtx = floorCanvas.getContext('2d');
    fCtx.fillStyle = isDarkMode ? '#241d17' : '#dcb085';
    fCtx.fillRect(0, 0, 512, 512);

    const bw = 32;
    const bh = 128;
    for (let y = -128; y < 640; y += 64) {
      for (let x = -128; x < 640; x += 128) {
        fCtx.save();
        fCtx.translate(x, y);
        fCtx.rotate(Math.PI / 4);
        fCtx.fillStyle = isDarkMode ? '#332920' : '#d29f70';
        fCtx.fillRect(0, 0, bw - 2, bh - 2);
        fCtx.fillStyle = isDarkMode ? '#1f1812' : '#c38f5f';
        fCtx.fillRect(bw, 0, bw - 2, bh - 2);
        fCtx.restore();
      }
    }
    const parquetTexture = new THREE.CanvasTexture(floorCanvas);
    parquetTexture.wrapS = THREE.RepeatWrapping;
    parquetTexture.wrapT = THREE.RepeatWrapping;
    parquetTexture.repeat.set(10, 8);

    const floorGeo = new THREE.PlaneGeometry(44, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      map: parquetTexture,
      roughness: 0.35,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.userData = { isFloorPlane: true };
    scene.add(floor);

    // Central Rug
    const rugMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x3b82f6 : 0x2563eb,
      roughness: 0.95
    });
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(14, 5.5), rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.01, 7.5);
    scene.add(rug);

    // European Wall Architecture & Moldings
    const wallMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x1e293b : 0xf8f6f0,
      roughness: 0.6
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x334155 : 0xe2ded4,
      roughness: 0.4
    });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(44, 11, 0.4), wallMat);
    backWall.position.set(0, 5.5, -14);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 11, 30), wallMat);
    leftWall.position.set(-22, 5.5, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 11, 30), wallMat);
    rightWall.position.set(22, 5.5, 0);
    scene.add(rightWall);

    const wainscotBase = new THREE.Mesh(new THREE.BoxGeometry(44, 0.35, 0.48), trimMat);
    wainscotBase.position.set(0, 0.175, -13.95);
    scene.add(wainscotBase);

    const wainscotRail = new THREE.Mesh(new THREE.BoxGeometry(44, 0.2, 0.48), trimMat);
    wainscotRail.position.set(0, 3.4, -13.95);
    scene.add(wainscotRail);

    for (let x = -20; x <= 20; x += 4.5) {
      const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.6, 0.06), trimMat);
      panelFrame.position.set(x, 1.8, -13.75);
      scene.add(panelFrame);
    }

    for (let wx of [-14, -6, 6, 14]) {
      const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 5.2, 0.12), trimMat);
      windowFrame.position.set(wx, 6.8, -13.85);
      scene.add(windowFrame);

      const archTop = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.12, 16, 1, false, 0, Math.PI), trimMat);
      archTop.rotation.x = Math.PI / 2;
      archTop.position.set(wx, 9.4, -13.85);
      scene.add(archTop);

      const glassGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 4.8), new THREE.MeshBasicMaterial({
        color: isDarkMode ? 0x38bdf8 : 0xffedd5,
        transparent: true,
        opacity: isDarkMode ? 0.3 : 0.7
      }));
      glassGlow.position.set(wx, 6.8, -13.78);
      scene.add(glassGlow);
    }

    // Dynamic Custom Office Signboard
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 256;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = isDarkMode ? '#0f172a' : '#2a1a08';
    sCtx.fillRect(0, 0, 1024, 256);
    sCtx.strokeStyle = '#d4a373';
    sCtx.lineWidth = 12;
    sCtx.strokeRect(16, 16, 992, 224);
    sCtx.strokeStyle = '#f59e0b';
    sCtx.lineWidth = 4;
    sCtx.strokeRect(26, 26, 972, 204);

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

    // Wall Sconces
    [-18, -10, 10, 18].forEach((sx) => {
      const sconceMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85 });
      const sconce = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.35, 12), sconceMat);
      sconce.position.set(sx, 5.2, -13.7);
      scene.add(sconce);

      const sLight = new THREE.PointLight(0xfde047, 1.2, 8);
      sLight.position.set(sx, 5.2, -13.2);
      scene.add(sLight);
    });

    // Corner Velvet Lounge Sofas & Coffee Table
    const sofaGroup = new THREE.Group();
    sofaGroup.position.set(0, 0, 7.5);

    const velvetMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 });
    const sofaSeat = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.4, 1.6), velvetMat);
    sofaSeat.position.y = 0.3;
    sofaSeat.userData = { isChair: true, chairType: 'sofa', seatWorldPos: { x: 0, y: 0.5, z: 7.5 }, seatRot: 0 };
    sofaGroup.add(sofaSeat);

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 0.4), velvetMat);
    sofaBack.position.set(0, 0.85, 0.7);
    sofaGroup.add(sofaBack);

    const glassTable = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.08, 24),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, roughness: 0.1 })
    );
    glassTable.position.set(0, 0.5, -1.8);
    sofaGroup.add(glassTable);

    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 }));
    tableLeg.position.set(0, 0.25, -1.8);
    sofaGroup.add(tableLeg);

    scene.add(sofaGroup);

    // Potted Trees (Static)
    const createPottedTree = (px, pz, scale = 1.0) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(px, 0, pz);

      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.6 * scale, 0.45 * scale, 1.1 * scale, 16), new THREE.MeshStandardMaterial({ color: 0xf5f5f4 }));
      pot.position.y = 0.55 * scale;
      treeGroup.add(pot);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 2.2 * scale, 8), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
      trunk.position.y = 1.5 * scale;
      treeGroup.add(trunk);

      const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
      for (let i = 0; i < 5; i++) {
        const foliage = new THREE.Mesh(new THREE.SphereGeometry((0.7 - i * 0.08) * scale, 12, 12), leafMat);
        const off = LEAF_OFFSETS[i];
        foliage.position.set(off.x * scale, (2.2 + i * 0.4) * scale, off.z * scale);
        treeGroup.add(foliage);
      }
      return treeGroup;
    };

    scene.add(createPottedTree(-19, -11, 1.4));
    scene.add(createPottedTree(19, -11, 1.4));
    scene.add(createPottedTree(-19, 11, 1.3));
    scene.add(createPottedTree(19, 11, 1.3));
    scene.add(createPottedTree(-8, -12, 1.0));
    scene.add(createPottedTree(8, -12, 1.0));

    // Floor Standing Lamps
    [[-16, 5], [16, 5]].forEach(([fx, fz]) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(fx, 0, fz);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 }));
      base.position.y = 0.04;
      lampGroup.add(base);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.6, 12), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 }));
      pole.position.y = 1.8;
      lampGroup.add(pole);

      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 }));
      shade.rotation.x = Math.PI;
      shade.position.y = 3.6;
      lampGroup.add(shade);

      const fLight = new THREE.PointLight(0xfef08a, 1.4, 10);
      fLight.position.y = 3.4;
      lampGroup.add(fLight);

      scene.add(lampGroup);
    });

    const desksGroup = new THREE.Group();
    scene.add(desksGroup);

    const avatarGroupMapRef = {};
    const dizzyDucksGroupMapRef = {};
    const zzzSpriteMapRef = {};

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

        const glowScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.34), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
        glowScreen.position.set(0, 0.22, -0.188);
        glowScreen.rotation.x = -0.2;
        group.add(glowScreen);
      } else if (item.type === 'dual_monitors') {
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 }));
        stand.position.y = 0.25;
        group.add(stand);

        const m1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.48, 0.03), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
        m1.position.set(-0.42, 0.45, 0);
        m1.rotation.y = 0.15;
        group.add(m1);

        const screen1 = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.44), new THREE.MeshBasicMaterial({ color: 0x1e293b }));
        screen1.position.set(-0.42, 0.45, 0.018);
        screen1.rotation.y = 0.15;
        group.add(screen1);

        const m2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.48, 0.03), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
        m2.position.set(0.42, 0.45, 0);
        m2.rotation.y = -0.15;
        group.add(m2);

        const screen2 = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.44), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
        screen2.position.set(0.42, 0.45, 0.018);
        screen2.rotation.y = -0.15;
        group.add(screen2);
      } else if (item.type === 'keyboard') {
        const kbd = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.2), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
        kbd.position.y = 0.015;
        group.add(kbd);
        const rgb = new THREE.Mesh(new THREE.PlaneGeometry(0.53, 0.01), new THREE.MeshBasicMaterial({ color: col }));
        rgb.position.set(0, 0.031, 0.09);
        rgb.rotation.x = -Math.PI / 2;
        group.add(rgb);
      } else if (item.type === 'desk_mat') {
        const mat = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.01, 0.45), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 }));
        mat.position.y = 0.005;
        group.add(mat);
      } else if (item.type === 'headphones') {
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 }));
        stand.position.y = 0.2;
        group.add(stand);
        const arc = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: col }));
        arc.position.set(0, 0.38, 0);
        arc.rotation.x = Math.PI / 2;
        group.add(arc);
      } else if (item.type === 'succulent') {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.16, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
        pot.position.y = 0.08;
        group.add(pot);
        for (let i = 0; i < 5; i++) {
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.06 - i * 0.008, 8, 8), new THREE.MeshStandardMaterial({ color: col }));
          leaf.position.set(Math.cos(i) * 0.04, 0.16 + i * 0.02, Math.sin(i) * 0.04);
          group.add(leaf);
        }
      } else if (item.type === 'monstera') {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.3, 16), new THREE.MeshStandardMaterial({ color: 0x78350f }));
        pot.position.y = 0.15;
        group.add(pot);
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x15803d }));
          stem.position.set(Math.cos(angle) * 0.08, 0.3, Math.sin(angle) * 0.08);
          stem.rotation.z = Math.cos(angle) * 0.3;
          stem.rotation.x = Math.sin(angle) * 0.3;
          group.add(stem);
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: col }));
          leaf.scale.set(1, 0.1, 1.5);
          leaf.position.set(Math.cos(angle) * 0.2, 0.48, Math.sin(angle) * 0.2);
          leaf.rotation.y = angle;
          group.add(leaf);
        }
      } else if (item.type === 'teddy_bear') {
        const bodyMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), bodyMat);
        body.position.y = 0.14;
        group.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), bodyMat);
        head.position.y = 0.3;
        group.add(head);
        const ear1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), bodyMat);
        ear1.position.set(-0.08, 0.38, 0);
        group.add(ear1);
        const ear2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), bodyMat);
        ear2.position.set(0.08, 0.38, 0);
        group.add(ear2);
      } else if (item.type === 'rubber_duck') {
        const duckMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), duckMat);
        body.position.y = 0.08;
        group.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), duckMat);
        head.position.set(0, 0.15, 0.04);
        group.add(head);
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 8), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.14, 0.09);
        group.add(beak);
      } else if (item.type === 'coffee_mug') {
        const mugMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3 });
        const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 16), mugMat);
        mug.position.y = 0.07;
        group.add(mug);
        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 16, Math.PI), mugMat);
        handle.position.set(0.065, 0.07, 0);
        handle.rotation.z = -Math.PI / 2;
        group.add(handle);
      } else if (item.type === 'desk_lamp') {
        const lampMat = new THREE.MeshStandardMaterial({ color: col, metalness: 0.7 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16), lampMat);
        base.position.y = 0.01;
        group.add(base);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8), lampMat);
        pole.position.set(0, 0.22, -0.05);
        pole.rotation.x = 0.2;
        group.add(pole);
        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.12, 16, 1, true), lampMat);
        shade.position.set(0, 0.42, 0.05);
        shade.rotation.x = Math.PI / 1.3;
        group.add(shade);
        const pLight = new THREE.PointLight(0xfef08a, 1.2, 3);
        pLight.position.set(0, 0.38, 0.08);
        group.add(pLight);
      } else {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.18, 0.12), new THREE.MeshStandardMaterial({ color: col }));
        box.position.y = 0.09;
        group.add(box);
      }

      if (isSelected) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.2, 0.26, 24),
          new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.008;
        group.add(ring);
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
      if (!isPlayer) {
        avatarGroup.position.set(0, 0, 0.75);
      }

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

      const leftShinGroup = new THREE.Group();
      leftShinGroup.position.y = -0.25;
      const leftShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.22, 12), skinMat);
      leftShinMesh.position.y = -0.11;
      const shoe1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.16), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      shoe1.position.set(0, -0.22, 0.03);
      leftShinGroup.add(leftShinMesh);
      leftShinGroup.add(shoe1);
      leftThighGroup.add(leftShinGroup);

      const rightThighGroup = new THREE.Group();
      rightThighGroup.position.x = 0.11;
      const rightThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.25, 12), pantsMat);
      rightThighMesh.position.y = -0.125;
      rightThighGroup.add(rightThighMesh);

      const rightShinGroup = new THREE.Group();
      rightShinGroup.position.y = -0.25;
      const rightShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.22, 12), skinMat);
      rightShinMesh.position.y = -0.11;
      const shoe2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.16), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      shoe2.position.set(0, -0.22, 0.03);
      rightShinGroup.add(rightShinMesh);
      rightShinGroup.add(shoe2);
      rightThighGroup.add(rightShinGroup);

      thighsGroup.add(leftThighGroup);
      thighsGroup.add(rightThighGroup);
      avatarGroup.add(thighsGroup);

      let torsoMesh;
      if (tm.gender === 'female') {
        torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.45, 14), clothMat);
      } else {
        torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.24), clothMat);
      }
      torsoMesh.position.y = 0.72;
      avatarGroup.add(torsoMesh);

      const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.38, 10), clothMat);
      arm1.position.set(-0.27, 0.7, 0);
      avatarGroup.add(arm1);

      const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.38, 10), clothMat);
      arm2.position.set(0.27, 0.7, 0);
      avatarGroup.add(arm2);

      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.08, 12), skinMat);
      neck.position.y = 0.98;
      avatarGroup.add(neck);

      const headGroup = new THREE.Group();
      headGroup.position.y = 1.1;

      const headBase = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), skinMat);
      headGroup.add(headBase);

      const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

      [-0.06, 0.06].forEach((ex) => {
        const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), eyeWhiteMat);
        eyeW.position.set(ex, 0.02, 0.145);
        headGroup.add(eyeW);

        const eyeP = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), eyePupilMat);
        eyeP.position.set(ex, 0.02, 0.168);
        headGroup.add(eyeP);

        const eyebrow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.01), hairMat);
        eyebrow.position.set(ex, 0.06, 0.155);
        headGroup.add(eyebrow);
      });

      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), skinMat);
      nose.position.set(0, -0.01, 0.175);
      headGroup.add(nose);

      const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.01), new THREE.MeshBasicMaterial({ color: 0x991b1b }));
      mouth.position.set(0, -0.05, 0.16);
      headGroup.add(mouth);

      [-0.17, 0.17].forEach((earX) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), skinMat);
        ear.position.set(earX, 0, 0);
        ear.scale.set(0.4, 1, 0.8);
        headGroup.add(ear);
      });

      if (tm.hairStyle === 'short' || (!tm.hairStyle && tm.gender === 'male')) {
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
        hair.position.y = 0.03;
        headGroup.add(hair);
      } else if (tm.hairStyle === 'spiky') {
        for (let i = 0; i < 9; i++) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 6), hairMat);
          const a = (i * Math.PI * 2) / 9;
          spike.position.set(Math.cos(a) * 0.08, 0.15, Math.sin(a) * 0.08);
          headGroup.add(spike);
        }
      } else if (tm.hairStyle === 'long' || (!tm.hairStyle && tm.gender === 'female')) {
        const topHair = new THREE.Mesh(new THREE.SphereGeometry(0.185, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
        topHair.position.y = 0.03;
        headGroup.add(topHair);
        const backHair = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.08), hairMat);
        backHair.position.set(0, -0.1, -0.12);
        headGroup.add(backHair);
      } else if (tm.hairStyle === 'ponytail') {
        const topHair = new THREE.Mesh(new THREE.SphereGeometry(0.185, 14, 14), hairMat);
        topHair.position.y = 0.03;
        headGroup.add(topHair);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.35, 8), hairMat);
        tail.position.set(0, 0.05, -0.22);
        tail.rotation.x = -0.6;
        headGroup.add(tail);
      } else if (tm.hairStyle === 'bob') {
        const bob = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 14), hairMat);
        bob.position.y = 0.03;
        headGroup.add(bob);
      } else if (tm.hairStyle === 'afro') {
        const afro = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), hairMat);
        afro.position.y = 0.06;
        headGroup.add(afro);
      } else if (tm.hairStyle === 'beanie') {
        const beanie = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.16, 16), hairMat);
        beanie.position.y = 0.12;
        headGroup.add(beanie);
      }

      avatarGroup.add(headGroup);

      if (isPlayer) {
        playerAvatarArmsRef = [arm1, arm2];
        playerThighsRef = [leftThighGroup, rightThighGroup];
        playerShinsRef = [leftShinGroup, rightShinGroup];
      }

      const dizzyRingGroup = new THREE.Group();
      dizzyRingGroup.position.set(0, 1.45, 0);
      dizzyRingGroup.visible = false;

      for (let d = 0; d < 4; d++) {
        const duckMiniGroup = new THREE.Group();
        const angle = (d * Math.PI * 2) / 4;
        duckMiniGroup.position.set(Math.cos(angle) * 0.38, 0, Math.sin(angle) * 0.38);

        const duckMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const dBody = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), duckMat);
        const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), duckMat);
        dHead.position.set(0, 0.06, 0.03);
        const dBeak = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.03, 6), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
        dBeak.rotation.x = Math.PI / 2;
        dBeak.position.set(0, 0.05, 0.07);

        duckMiniGroup.add(dBody);
        duckMiniGroup.add(dHead);
        duckMiniGroup.add(dBeak);
        dizzyRingGroup.add(duckMiniGroup);
      }
      avatarGroup.add(dizzyRingGroup);
      dizzyDucksGroupMapRef[tm.id] = dizzyRingGroup;

      const zzzCanvas = document.createElement('canvas');
      zzzCanvas.width = 128;
      zzzCanvas.height = 128;
      const zCtx = zzzCanvas.getContext('2d');
      zCtx.fillStyle = '#60a5fa';
      zCtx.font = 'bold italic 60px Inter, sans-serif';
      zCtx.textAlign = 'center';
      zCtx.fillText('Zzz...', 64, 80);
      const zzzTexture = new THREE.CanvasTexture(zzzCanvas);
      const zzzSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: zzzTexture, transparent: true }));
      zzzSprite.scale.set(1.2, 1.2, 1);
      zzzSprite.position.set(0, 1.8, 0);
      zzzSprite.visible = false;
      avatarGroup.add(zzzSprite);
      zzzSpriteMapRef[tm.id] = zzzSprite;

      if (!isPlayer || isSeated) {
        leftThighGroup.rotation.x = -Math.PI / 2;
        rightThighGroup.rotation.x = -Math.PI / 2;
        leftShinGroup.rotation.x = Math.PI / 2;
        rightShinGroup.rotation.x = Math.PI / 2;
        avatarGroup.position.y = 0.15;
      }

      avatarGroup.userData = { teammateId: tm.id, isAvatarObject: true };
      avatarGroupMapRef[tm.id] = avatarGroup;

      return avatarGroup;
    }

    // Populate 15 Desks
    teammatesRef.current.forEach((tm) => {
      const pos = deskLayoutPositionsRef.current[tm.id] || getDefaultDesk3DPosition(tm.id);
      const deskGroup = new THREE.Group();
      deskGroup.position.set(pos.x, 0, pos.z);
      deskGroup.rotation.y = pos.rotY;
      deskGroup.userData = { deskId: tm.id, teammate: tm, isDeskUnit: true };

      desk3DMeshMapRef.current[tm.id] = deskGroup;

      const tableGeo = new THREE.BoxGeometry(2.4, 0.08, 1.3);
      const tableMat = new THREE.MeshStandardMaterial({
        color: isDarkMode ? 0x334155 : 0xe2e8f0,
        roughness: 0.4,
        metalness: 0.1
      });
      const tableTop = new THREE.Mesh(tableGeo, tableMat);
      tableTop.position.y = 0.71;
      tableTop.userData = { isDeskTopPlane: true, deskId: tm.id };
      deskGroup.add(tableTop);

      const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      [[-1.1, 0.35, -0.55], [1.1, 0.35, -0.55], [-1.1, 0.35, 0.55], [1.1, 0.35, 0.55]].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), legMat);
        leg.position.set(lx, ly, lz);
        deskGroup.add(leg);
      });

      const dividerGeo = new THREE.BoxGeometry(2.4, 0.35, 0.03);
      const dividerMat = new THREE.MeshPhysicalMaterial({
        color: tm.color ? parseInt(tm.color.replace('#', '0x')) : 0x3b82f6,
        transparent: true,
        opacity: 0.4,
        roughness: 0.2
      });
      const divider = new THREE.Mesh(dividerGeo, dividerMat);
      divider.position.set(0, 0.9, -0.62);
      deskGroup.add(divider);

      const chairGroup = new THREE.Group();
      chairGroup.position.set(0, 0, 0.8);

      const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.65), seatMat);
      seat.position.y = 0.45;
      seat.userData = { isChair: true, deskId: tm.id, chairType: 'desk_chair' };
      chairGroup.add(seat);

      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 0.06), seatMat);
      backrest.position.set(0, 0.82, 0.3);
      chairGroup.add(backrest);
      deskGroup.add(chairGroup);

      if (!tm.isUser) {
        const avatarMesh = createDetailedHumanAvatarMesh(tm, false, true);
        deskGroup.add(avatarMesh);
      }

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
      bCtx.font = 'bold 26px Inter, sans-serif';
      bCtx.textAlign = 'center';
      bCtx.fillText(`${tm.emotion || '💻'} Bàn ${tm.id}`, 140, 52);
      bCtx.font = '20px Inter, sans-serif';
      bCtx.fillStyle = '#60a5fa';
      bCtx.fillText(tm.name, 140, 88);

      const bubbleTexture = new THREE.CanvasTexture(bubbleCanvas);
      const bubbleSpriteMat = new THREE.SpriteMaterial({ map: bubbleTexture, transparent: true });
      const bubbleSprite = new THREE.Sprite(bubbleSpriteMat);
      bubbleSprite.scale.set(1.9, 0.9, 1);
      bubbleSprite.position.set(0, 2.35, 0);
      deskGroup.add(bubbleSprite);

      const items = deskConfigsRef.current[tm.id] || [];
      const itemsContainer = new THREE.Group();
      itemsContainer.name = 'deskItemsContainer';
      items.forEach((item) => {
        const itemMesh = create3DItemMesh(item, item.id === selectedItemIdOnDesk, tm.id);
        itemsContainer.add(itemMesh);
      });
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
    let isRightMouseDown = false;
    let isDraggingItemOnDesk = false;
    let activeDraggedItemId = null;
    let activeDraggedItemMesh = null;

    let isDraggingEntireDesk = false;
    let activeDraggedDeskId = null;

    let previousMousePosition = { x: 0, y: 0 };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const domElem = renderer.domElement;

    const getRaycastIntersects = (e) => {
      const rect = domElem.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      return raycaster.intersectObjects([floor, sofaSeat, ...desksGroup.children], true);
    };

    const onPointerDown = (e) => {
      e.preventDefault();
      const intersects = getRaycastIntersects(e);

      if (e.button === 0) {
        if (intersects.length > 0) {
          let clickedItemObject = null;
          let clickedDeskId = null;
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
            while (obj && obj.parent !== scene) {
              if (obj.userData?.isAvatarObject) {
                const targetId = obj.userData.teammateId;
                const foundTm = teammatesRef.current.find((t) => t.id === targetId);
                if (foundTm && !foundTm.isUser) {
                  setActiveTargetTeammate(foundTm);
                  sfx.play('click');
                  return;
                }
              }
              if (obj.userData?.itemId && !clickedItemObject) {
                clickedItemObject = obj;
              }
              if (obj.userData?.deskId && !clickedDeskId) {
                clickedDeskId = obj.userData.deskId;
              }
              obj = obj.parent;
            }
          }

          if (isLayoutModeRef.current && clickedDeskId) {
            isDraggingEntireDesk = true;
            activeDraggedDeskId = clickedDeskId;
            setSelectedDeskToMove(clickedDeskId);
            sfx.play('drag');
            return;
          }

          if (clickedDeskId && selectedDeskIdRef.current === clickedDeskId && clickedItemObject) {
            isDraggingItemOnDesk = true;
            activeDraggedItemId = clickedItemObject.userData.itemId;
            activeDraggedItemMesh = clickedItemObject;
            setSelectedItemIdOnDesk(clickedItemObject.userData.itemId);
            sfx.play('drag');
            return;
          }

          if (clickedChairObj && !isLayoutModeRef.current) {
            const deskId = clickedChairObj.userData?.deskId;
            let targetSeatWorldPos;
            let chairRot = 0;

            if (clickedChairObj.userData?.chairType === 'sofa') {
              targetSeatWorldPos = clickedChairObj.userData.seatWorldPos;
              chairRot = 0;
            } else if (deskId) {
              const dPos = deskLayoutPositionsRef.current[deskId] || getDefaultDesk3DPosition(deskId);
              targetSeatWorldPos = { x: dPos.x, y: 0.45, z: dPos.z + (dPos.rotY === 0 ? 0.8 : -0.8) };
              chairRot = dPos.rotY;
            }

            if (targetSeatWorldPos) {
              playerPosRef.current.targetX = targetSeatWorldPos.x;
              playerPosRef.current.targetZ = targetSeatWorldPos.z;
              setSeatedChairInfo({ deskId, seatPos: targetSeatWorldPos, rot: chairRot });
              sfx.play('step');
              return;
            }
          }

          if (clickedDeskId && selectedDeskIdRef.current === null && !isLayoutModeRef.current) {
            setSelectedDeskId(clickedDeskId);
            sfx.play('camera');
            return;
          }

          if (clickedFloorPoint && selectedDeskIdRef.current === null && !isLayoutModeRef.current) {
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

        if (selectedDeskIdRef.current === null) {
          isLeftMouseDown = true;
          previousMousePosition = { x: e.clientX, y: e.clientY };
        }
      } else if (e.button === 2) {
        isRightMouseDown = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerMove = (e) => {
      if (isDraggingEntireDesk && activeDraggedDeskId && isLayoutModeRef.current) {
        const intersects = getRaycastIntersects(e);
        for (let i = 0; i < intersects.length; i++) {
          if (intersects[i].object.userData?.isFloorPlane) {
            const pt = intersects[i].point;
            const newX = Math.max(-19, Math.min(19, pt.x));
            const newZ = Math.max(-12, Math.min(12, pt.z));

            const deskMesh = desk3DMeshMapRef.current[activeDraggedDeskId];
            if (deskMesh) {
              deskMesh.position.x = newX;
              deskMesh.position.z = newZ;
            }

            setDeskLayoutPositions((prev) => ({
              ...prev,
              [activeDraggedDeskId]: { ...prev[activeDraggedDeskId], x: newX, z: newZ }
            }));
            break;
          }
        }
        return;
      }

      if (isDraggingItemOnDesk && activeDraggedItemId && selectedDeskIdRef.current !== null) {
        const intersects = getRaycastIntersects(e);
        const deskPos = deskLayoutPositionsRef.current[selectedDeskIdRef.current] || getDefaultDesk3DPosition(selectedDeskIdRef.current);

        for (let i = 0; i < intersects.length; i++) {
          const pt = intersects[i].point;
          if (pt) {
            let localX = Math.max(-1.0, Math.min(1.0, pt.x - deskPos.x));
            let localZ = Math.max(-0.55, Math.min(0.55, pt.z - deskPos.z));

            if (activeDraggedItemMesh) {
              activeDraggedItemMesh.position.x = localX;
              activeDraggedItemMesh.position.z = localZ;
            }

            setDeskConfigs((prev) => {
              const currentList = prev[selectedDeskIdRef.current] || [];
              const updated = currentList.map((item) =>
                item.id === activeDraggedItemId ? { ...item, x: localX, z: localZ } : item
              );
              return { ...prev, [selectedDeskIdRef.current]: updated };
            });
            break;
          }
        }
        return;
      }

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      if (isLeftMouseDown && selectedDeskIdRef.current === null) {
        cameraAngleX -= deltaX * 0.006;
        cameraAngleY = Math.max(0.15, Math.min(1.25, cameraAngleY + deltaY * 0.006));
      } else if (isRightMouseDown) {
        const panSpeed = 0.02;
        cameraTargetCenter.x -= deltaX * panSpeed * Math.cos(cameraAngleX);
        cameraTargetCenter.z -= deltaX * panSpeed * Math.sin(cameraAngleX);
        cameraTargetCenter.y += deltaY * panSpeed;
      }

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      if (isDraggingItemOnDesk) {
        sfx.play('place');
        const deskId = selectedDeskIdRef.current;
        if (db && deskId) {
          try {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'desks', String(deskId));
            setDoc(docRef, { items: deskConfigsRef.current[deskId] || [] }, { merge: true });
          } catch (e) {}
        }
      }
      if (isDraggingEntireDesk) {
        sfx.play('place');
      }
      isDraggingItemOnDesk = false;
      isDraggingEntireDesk = false;
      activeDraggedItemId = null;
      activeDraggedItemMesh = null;
      activeDraggedDeskId = null;
      isLeftMouseDown = false;
      isRightMouseDown = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      cameraDistance = Math.max(8, Math.min(45, cameraDistance + e.deltaY * 0.02));
    };

    const onContextMenu = (e) => e.preventDefault();

    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });
    domElem.addEventListener('contextmenu', onContextMenu);

    // Tự động căn chỉnh lại kích thước Canvas 3D khi cửa sổ thay đổi
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    resizeObserver.observe(container);

    let animationFrameId;
    let walkClock = 0;
    let prankClock = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      prankClock += 0.05;
      const nowTime = Date.now();

      teammatesRef.current.forEach((tm) => {
        const avatarGrp = avatarGroupMapRef[tm.id];
        const duckRing = dizzyDucksGroupMapRef[tm.id];
        const zzzSpr = zzzSpriteMapRef[tm.id];

        const dizzyUntil = dizzyStatesRef.current[tm.id] || 0;
        if (nowTime < dizzyUntil) {
          if (duckRing) {
            duckRing.visible = true;
            duckRing.rotation.y = prankClock * 4;
          }
          if (avatarGrp) {
            avatarGrp.rotation.z = Math.sin(prankClock * 6) * 0.15;
          }
        } else {
          if (duckRing) duckRing.visible = false;
          if (avatarGrp && (!trippedStatesRef.current[tm.id] || nowTime >= trippedStatesRef.current[tm.id])) {
            avatarGrp.rotation.z = 0;
          }
        }

        const tripUntil = trippedStatesRef.current[tm.id] || 0;
        if (nowTime < tripUntil) {
          if (avatarGrp) {
            avatarGrp.rotation.x = -Math.PI / 2 + 0.1;
            avatarGrp.position.y = 0.15;
          }
          if (zzzSpr) {
            zzzSpr.visible = true;
            zzzSpr.position.y = 1.6 + Math.sin(prankClock * 3) * 0.15;
          }
        } else {
          if (zzzSpr) zzzSpr.visible = false;
          if (avatarGrp && (!tm.isUser || !isSittingRef.current)) {
            if (avatarGrp.rotation.x !== 0 && !tm.isUser) {
              avatarGrp.rotation.x = 0;
              avatarGrp.position.y = 0;
            }
          }
        }
      });

      // Update Paper Ball Projectiles
      const projList = flyingProjectilesRef.current;
      for (let i = projList.length - 1; i >= 0; i--) {
        const proj = projList[i];
        proj.progress += 0.04;

        if (proj.progress >= 1) {
          scene.remove(proj.mesh);
          if (proj.mesh.geometry) proj.mesh.geometry.dispose();
          projList.splice(i, 1);
          sfx.play('thwack');
          setDizzyStates((prev) => ({ ...prev, [proj.targetId]: Date.now() + 4500 }));
        } else {
          const t = proj.progress;
          const p0 = proj.startPos;
          const p2 = proj.targetPos;
          const p1 = new THREE.Vector3((p0.x + p2.x) / 2, Math.max(p0.y, p2.y) + 3.2, (p0.z + p2.z) / 2);

          proj.mesh.position.x = Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x;
          proj.mesh.position.y = Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y;
          proj.mesh.position.z = Math.pow(1 - t, 2) * p0.z + 2 * (1 - t) * t * p1.z + Math.pow(t, 2) * p2.z;
          proj.mesh.rotation.x += 0.3;
          proj.mesh.rotation.y += 0.3;
        }
      }

      // WASD / Keyboard Movement Logic
      const moveSpeed = 0.12;
      let dx = 0;
      let dz = 0;
      const keys = keysPressedRef.current;
      if (keys['w'] || keys['arrowup']) dz -= moveSpeed;
      if (keys['s'] || keys['arrowdown']) dz += moveSpeed;
      if (keys['a'] || keys['arrowleft']) dx -= moveSpeed;
      if (keys['d'] || keys['arrowright']) dx += moveSpeed;

      if (dx !== 0 || dz !== 0) {
        playerPosRef.current.targetX = Math.max(-20, Math.min(20, playerPosRef.current.x + dx));
        playerPosRef.current.targetZ = Math.max(-13, Math.min(13, playerPosRef.current.z + dz));
      }

      // Smooth Position Linear Interpolation
      const curr = playerPosRef.current;
      const distX = curr.targetX - curr.x;
      const distZ = curr.targetZ - curr.z;
      const dist = Math.sqrt(distX * distX + distZ * distZ);

      if (dist > 0.05) {
        curr.x += distX * 0.12;
        curr.z += distZ * 0.12;
        walkClock += 0.25;

        if (playerAvatarMeshRef) {
          playerAvatarMeshRef.rotation.y = Math.atan2(distX, distZ);
        }

        playerThighsRef.forEach((thigh, idx) => {
          if (thigh) thigh.rotation.x = Math.sin(walkClock + idx * Math.PI) * 0.6;
        });
        playerShinsRef.forEach((shin, idx) => {
          if (shin) shin.rotation.x = Math.max(0, Math.sin(walkClock + idx * Math.PI) * 0.4);
        });
        playerAvatarArmsRef.forEach((arm, idx) => {
          if (arm) arm.rotation.x = Math.sin(walkClock + (1 - idx) * Math.PI) * 0.4;
        });
      } else {
        curr.x = curr.targetX;
        curr.z = curr.targetZ;

        if (seatedChairInfoRef.current && !isSittingRef.current) {
          setIsSitting(true);
          sfx.play('sit');
        }

        playerThighsRef.forEach((thigh) => { if (thigh) thigh.rotation.x = isSittingRef.current ? -Math.PI / 2 : 0; });
        playerShinsRef.forEach((shin) => { if (shin) shin.rotation.x = isSittingRef.current ? Math.PI / 2 : 0; });
        playerAvatarArmsRef.forEach((arm) => { if (arm) arm.rotation.x = 0; });
      }

      if (playerAvatarMeshRef) {
        playerAvatarMeshRef.position.x = curr.x;
        playerAvatarMeshRef.position.z = curr.z;
        if (isSittingRef.current) {
          playerAvatarMeshRef.position.y = 0.15;
          if (seatedChairInfoRef.current) playerAvatarMeshRef.rotation.y = seatedChairInfoRef.current.rot;
        } else {
          playerAvatarMeshRef.position.y = 0;
        }
      }

      const activeDeskId = selectedDeskIdRef.current;
      if (activeDeskId !== null) {
        const deskPos = deskLayoutPositionsRef.current[activeDeskId] || getDefaultDesk3DPosition(activeDeskId);
        const camTargetPos = new THREE.Vector3(deskPos.x, 1.2, deskPos.z);
        camera.position.set(deskPos.x, 3.2, deskPos.z + 3.4);
        camera.lookAt(camTargetPos);
      } else {
        const cx = cameraTargetCenter.x + cameraDistance * Math.sin(cameraAngleX) * Math.cos(cameraAngleY);
        const cy = cameraTargetCenter.y + cameraDistance * Math.sin(cameraAngleY);
        const cz = cameraTargetCenter.z + cameraDistance * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);
        camera.position.set(cx, cy, cz);
        camera.lookAt(cameraTargetCenter);
      }

      // Project 3D Speech Bubbles Coordinates to 2D Screen Space
      const newScreenPos = {};
      const cWidth = container.clientWidth || window.innerWidth;
      const cHeight = container.clientHeight || window.innerHeight;

      speechBubblesRef.current.forEach((bubble) => {
        let worldPos = new THREE.Vector3();
        if (bubble.deskId === currentUser.id && playerAvatarMeshRef) {
          worldPos.set(playerPosRef.current.x, 1.9, playerPosRef.current.z);
        } else {
          const dPos = deskLayoutPositionsRef.current[bubble.deskId] || getDefaultDesk3DPosition(bubble.deskId);
          worldPos.set(dPos.x, 2.2, dPos.z);
        }
        worldPos.project(camera);

        const x = (worldPos.x * 0.5 + 0.5) * cWidth;
        const y = (-(worldPos.y * 0.5) + 0.5) * cHeight;
        const visible = worldPos.z < 1;
        newScreenPos[bubble.deskId] = { x, y, visible };
      });
      screenPositionsRef.current = newScreenPos;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      domElem.removeEventListener('contextmenu', onContextMenu);
    };
  }, [threeLoaded, isDarkMode, officeName]);

  // --- Handlers ---
  const handleThrowPaperBall = (targetTeammate) => {
    if (!targetTeammate || !threeSceneRef.current) return;
    sfx.play('throw');

    const scene = threeSceneRef.current.scene;
    const THREE = window.THREE;

    const paperGeo = new THREE.DodecahedronGeometry(0.12, 1);
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const paperMesh = new THREE.Mesh(paperGeo, paperMat);

    const startP = new THREE.Vector3(playerPosRef.current.x, 1.4, playerPosRef.current.z);
    let endP;

    if (targetTeammate.isUser) {
      endP = new THREE.Vector3(playerPosRef.current.x, 1.3, playerPosRef.current.z);
    } else {
      const targetDeskPos = deskLayoutPositions[targetTeammate.id] || getDefaultDesk3DPosition(targetTeammate.id);
      endP = new THREE.Vector3(targetDeskPos.x, 1.4, targetDeskPos.z + (targetDeskPos.rotY === 0 ? 0.75 : -0.75));
    }

    paperMesh.position.copy(startP);
    scene.add(paperMesh);

    flyingProjectilesRef.current.push({
      mesh: paperMesh,
      startPos: startP,
      targetPos: endP,
      targetId: targetTeammate.id,
      progress: 0
    });

    setDizzyStates((prev) => ({ ...prev, [targetTeammate.id]: Date.now() + 4500 }));

    setSpeechBubbles((prev) => [
      ...prev,
      {
        id: `b-prank-${Date.now()}`,
        deskId: currentUser.id,
        senderName: currentUser.name,
        text: `🎯 Ném cục giấy trúng ${targetTeammate.name}! 🦆`,
        timestamp: Date.now()
      }
    ]);
    setActiveTargetTeammate(null);
  };

  const handleTripTeammate = (targetTeammate) => {
    if (!targetTeammate) return;
    sfx.play('trip');

    setTrippedStates((prev) => ({ ...prev, [targetTeammate.id]: Date.now() + 3200 }));

    setSpeechBubbles((prev) => [
      ...prev,
      {
        id: `b-trip-${Date.now()}`,
        deskId: currentUser.id,
        senderName: currentUser.name,
        text: `🦶 Gạt chân làm ${targetTeammate.name} té xỉu! 💤`,
        timestamp: Date.now()
      }
    ]);
    setActiveTargetTeammate(null);
  };

  const handleCompleteOnboarding = (e) => {
    e.preventDefault();
    if (!characterConfig.name.trim()) return;
    sfx.play('chime');

    setTeammates((prev) =>
      prev.map((tm) =>
        tm.isUser
          ? {
              ...tm,
              name: characterConfig.name.trim(),
              gender: characterConfig.gender,
              hairStyle: characterConfig.hairStyle,
              hairColor: characterConfig.hairColor,
              skinColor: characterConfig.skinColor,
              color: characterConfig.color
            }
          : tm
      )
    );
    setHasOnboarded(true);
  };

  const handleAddItemToDesk = (itemTemplate) => {
    if (!selectedDeskId) return;
    sfx.play('place');

    const newItem = {
      id: `item-${Date.now()}`,
      type: itemTemplate.type,
      category: activeCategory,
      x: (Math.random() - 0.5) * 0.8,
      z: (Math.random() - 0.5) * 0.4,
      rotY: 0,
      scale: itemTemplate.defaultScale || 1,
      color: itemTemplate.color || '#3b82f6'
    };

    setDeskConfigs((prev) => {
      const currentList = prev[selectedDeskId] || [];
      const updated = [...currentList, newItem];
      if (db) {
        try {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'desks', String(selectedDeskId));
          setDoc(docRef, { items: updated, updatedAt: serverTimestamp() }, { merge: true });
        } catch (e) {}
      }
      return { ...prev, [selectedDeskId]: updated };
    });

    setSelectedItemIdOnDesk(newItem.id);
  };

  const handleUpdateItemProperty = (itemId, prop, value) => {
    if (!selectedDeskId) return;
    setDeskConfigs((prev) => {
      const currentList = prev[selectedDeskId] || [];
      const updated = currentList.map((item) =>
        item.id === itemId ? { ...item, [prop]: value } : item
      );
      if (db) {
        try {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'desks', String(selectedDeskId));
          setDoc(docRef, { items: updated }, { merge: true });
        } catch (e) {}
      }
      return { ...prev, [selectedDeskId]: updated };
    });
  };

  const handleDeleteItem = (itemId) => {
    if (!selectedDeskId) return;
    sfx.play('delete');
    setDeskConfigs((prev) => {
      const currentList = prev[selectedDeskId] || [];
      const updated = currentList.filter((item) => item.id !== itemId);
      if (db) {
        try {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'desks', String(selectedDeskId));
          setDoc(docRef, { items: updated }, { merge: true });
        } catch (e) {}
      }
      return { ...prev, [selectedDeskId]: updated };
    });
    setSelectedItemIdOnDesk(null);
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

    setSpeechBubbles((prev) => [
      ...prev,
      {
        id: `bubble-${Date.now()}`,
        deskId: currentUser.id,
        senderName: currentUser.name,
        text: newMsg.text,
        timestamp: Date.now()
      }
    ]);

    if (db) {
      try {
        const chatCol = collection(db, 'artifacts', appId, 'public', 'data', 'chat');
        setDoc(doc(chatCol, newMsg.id), { ...newMsg, timestamp: serverTimestamp() });
      } catch (err) {}
    }
  };

  const currentDeskItems = selectedDeskId ? deskConfigs[selectedDeskId] || [] : [];

  return (
    <div className={`w-screen h-screen overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      
      {/* CSS Reset Ép Full Màn Hình Cố Định */}
      <style>{`
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
        }
        canvas {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
      
      {/* 1. MANDATORY ONBOARDING MODAL */}
      {!hasOnboarded && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30 mb-1">
                <Building2 className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-white">Tạo Nhân Vật Văn Phòng Châu Âu</h1>
              <p className="text-xs text-slate-400">Tùy chỉnh diện mạo, ngồi ghế & di chuyển tự do trong không gian 3D</p>
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
                <label className="block text-slate-300 mb-1 font-semibold">Giới tính nhân vật:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'male', label: 'Nam (Male)' },
                    { id: 'female', label: 'Nữ (Female)' },
                    { id: 'nonbinary', label: 'Phi giới tính' }
                  ].map((g) => (
                    <button
                      type="button"
                      key={g.id}
                      onClick={() => setCharacterConfig({ ...characterConfig, gender: g.id })}
                      className={`py-2.5 rounded-xl border font-semibold transition ${
                        characterConfig.gender === g.id
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Kiểu tóc 3D:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'short', label: 'Ngắn' },
                    { id: 'spiky', label: 'Spiky' },
                    { id: 'long', label: 'Tóc Dài' },
                    { id: 'ponytail', label: 'Đuôi Ngựa' },
                    { id: 'bob', label: 'Tóc Bob' },
                    { id: 'afro', label: 'Xoăn Afro' },
                    { id: 'beanie', label: 'Mũ Beanie' }
                  ].map((h) => (
                    <button
                      type="button"
                      key={h.id}
                      onClick={() => setCharacterConfig({ ...characterConfig, hairStyle: h.id })}
                      className={`py-2 rounded-xl border text-center transition ${
                        characterConfig.hairStyle === h.id ? 'bg-blue-600/30 border-blue-400 text-blue-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Màu áo:</label>
                  <div className="flex items-center gap-2">
                    {['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'].map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setCharacterConfig({ ...characterConfig, color: c })}
                        className={`w-7 h-7 rounded-full border-2 transition ${characterConfig.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Màu tóc:</label>
                  <div className="flex items-center gap-2">
                    {['#1e293b', '#78350f', '#be185d', '#4c1d95', '#d97706', '#059669'].map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setCharacterConfig({ ...characterConfig, hairColor: c })}
                        className={`w-7 h-7 rounded-full border-2 transition ${characterConfig.hairColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
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
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base leading-tight flex items-center gap-2 text-amber-400 font-serif">
                🏛️ {officeName}
              </h1>
              <button
                onClick={() => { setIsEditingOfficeName(true); sfx.play('click'); }}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Đổi tên Văn Phòng 3D"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Click ghế để ngồi • Bật Chế độ Sắp Xếp Bàn để di chuyển cả bàn</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsLayoutMode(!isLayoutMode);
              sfx.play('click');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm ${
              isLayoutMode
                ? 'bg-amber-500 border-amber-400 text-slate-950 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            {isLayoutMode ? 'Đang Sắp Xếp Bàn (Kéo 3D)' : 'Sắp Xếp Bàn'}
          </button>

          <button
            onClick={() => { setIsEditingProfile(true); sfx.play('click'); }}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition text-xs font-semibold"
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: currentUser.color }}>
              {currentUser.name.substring(0, 1).toUpperCase()}
            </div>
            <span>{currentUser.name}</span>
            <span className="text-[10px] capitalize px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
              {currentUser.gender === 'male' ? 'Nam' : currentUser.gender === 'female' ? 'Nữ' : 'Khác'}
            </span>
            <Edit3 className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          <div className="h-6 w-[1px] bg-slate-700/50" />

          {selectedDeskId !== null ? (
            <button
              onClick={() => {
                sfx.play('camera');
                setSelectedDeskId(null);
                setSelectedItemIdOnDesk(null);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl transition shadow-md shadow-blue-600/30"
            >
              <RotateCcw className="w-4 h-4" /> Toàn cảnh Văn phòng
            </button>
          ) : (
            <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-blue-400" /> Nhấp sàn nhà để đi dạo (WASD)
            </div>
          )}

          <button
            onClick={() => { setSoundEnabled(!soundEnabled); sfx.play('click'); }}
            className={`p-2 rounded-xl transition border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'}`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={() => { setIsDarkMode(!isDarkMode); sfx.play('click'); }}
            className={`p-2 rounded-xl transition border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'}`}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative bg-slate-950 overflow-hidden">
          <div ref={canvasContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing relative" />

          {/* 3D Floating Speech Bubbles Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {speechBubbles.map((bubble) => {
              const pos = screenPositionsRef.current[bubble.deskId];
              if (!pos || !pos.visible) return null;
              return (
                <div
                  key={bubble.id}
                  className="absolute transform -translate-x-1/2 -translate-y-full transition-all duration-300 ease-out"
                  style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                >
                  <div className="bg-white text-slate-900 px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-blue-500 max-w-xs animate-in zoom-in slide-in-from-bottom-2 duration-200">
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                      💬 {bubble.senderName}
                    </div>
                    <div className="text-xs font-semibold leading-snug">
                      {bubble.text}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stand Up HUD Banner */}
          {isSitting && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2.5 rounded-2xl shadow-2xl border border-blue-400 flex items-center gap-4 z-30">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Armchair className="w-5 h-5 text-amber-300" />
                <span>Đang ngồi trên ghế làm việc / Sofa Châu Âu</span>
              </div>
              <button
                onClick={() => {
                  setIsSitting(false);
                  setSeatedChairInfo(null);
                  sfx.play('stand');
                }}
                className="px-4 py-1.5 bg-white text-blue-600 hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" /> Đứng Dậy
              </button>
            </div>
          )}

          {/* Controls Instructions HUD */}
          <div className="absolute top-4 left-6 bg-slate-900/85 backdrop-blur border border-slate-800 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-4 shadow-xl z-20 text-slate-300">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">L-Click Ghế</span> Ngồi vào ghế
            </div>
            <div className="h-4 w-[1px] bg-slate-700" />
            <div className="flex items-center gap-1.5 font-medium">
              <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white font-bold">L-Click Đồng Nghiệp</span> Ném Giấy / Gạt Chân Té
            </div>
          </div>

          {/* Target Interaction Prank HUD */}
          {activeTargetTeammate && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-blue-500/40 p-4 rounded-3xl shadow-2xl z-30 flex items-center gap-4">
              <div className="flex items-center gap-3 pr-3 border-r border-slate-800">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md" style={{ backgroundColor: activeTargetTeammate.color }}>
                  {activeTargetTeammate.emotion || '👤'}
                </div>
                <div>
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    {activeTargetTeammate.name}
                    <span className="text-[10px] text-blue-400 font-normal">Bàn #{activeTargetTeammate.id}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{activeTargetTeammate.role}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleThrowPaperBall(activeTargetTeammate)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  📄 Ném Cục Giấy (Vịt Vàng Quay)
                </button>
                <button
                  onClick={() => handleTripTeammate(activeTargetTeammate)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  🦶 Gạt Chân Té (Ngủ Zzz 3s)
                </button>
                <button
                  onClick={() => {
                    sfx.play('camera');
                    setSelectedDeskId(activeTargetTeammate.id);
                    setActiveTargetTeammate(null);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  🪑 Ghé Xem Bàn
                </button>
                <button
                  onClick={() => setActiveTargetTeammate(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Desk Navigation Bar */}
          <div className="absolute bottom-6 left-6 right-80 flex items-center gap-2 overflow-x-auto p-2 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl z-10 shadow-2xl">
            <span className="text-xs font-semibold px-3 text-slate-400 uppercase tracking-wider">
              Bàn:
            </span>
            {teammates.map((tm) => {
              const isSelected = selectedDeskId === tm.id;
              return (
                <button
                  key={tm.id}
                  onClick={() => { sfx.play('camera'); setSelectedDeskId(tm.id); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tm.color }} />
                  {tm.id}. {tm.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desk Decorator Panel */}
        {selectedDeskId !== null && (
          <div className={`w-96 border-l flex flex-col z-20 shadow-2xl backdrop-blur-xl shrink-0 ${isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow" style={{ backgroundColor: teammates[selectedDeskId - 1]?.color }}>
                  {selectedDeskId}
                </div>
                <div>
                  <h2 className="font-bold text-sm">Trang trí Bàn #{selectedDeskId}</h2>
                  <p className="text-xs text-slate-400">{teammates[selectedDeskId - 1]?.name} • {teammates[selectedDeskId - 1]?.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDeskId(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inventory Category Tabs */}
            <div className="p-3 border-b border-slate-800/60 grid grid-cols-4 gap-1">
              {[
                { id: 'tech', label: 'Công nghệ', icon: Monitor },
                { id: 'plants', label: 'Cây cảnh', icon: Flower2 },
                { id: 'personal', label: 'Cá nhân', icon: Smile },
                { id: 'accessories', label: 'Phụ kiện', icon: Coffee }
              ].map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); sfx.play('click'); }}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-medium transition ${
                      isActive ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {DECOR_INVENTORY[activeCategory].map((itemTemplate) => (
                  <button
                    key={itemTemplate.type}
                    onClick={() => handleAddItemToDesk(itemTemplate)}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition group hover:scale-[1.02] active:scale-95 ${
                      isDarkMode ? 'bg-slate-800/60 border-slate-700/60 hover:border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{itemTemplate.icon}</span>
                      <Plus className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <span className="font-semibold text-xs mt-1">{itemTemplate.name}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{itemTemplate.desc}</span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Vật phẩm trên bàn ({currentDeskItems.length})
                </h3>

                <div className="space-y-2">
                  {currentDeskItems.map((item) => {
                    const isSelected = selectedItemIdOnDesk === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItemIdOnDesk(item.id)}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          isSelected ? 'bg-blue-600/15 border-blue-500' : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            {item.type.replace('_', ' ')}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateItemProperty(item.id, 'rotY', (item.rotY || 0) + Math.PI / 2);
                                sfx.play('click');
                              }}
                              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-400">Xoay góc:</span>
                              <input
                                type="range"
                                min="0"
                                max={Math.PI * 2}
                                step="0.1"
                                value={item.rotY || 0}
                                onChange={(e) => handleUpdateItemProperty(item.id, 'rotY', parseFloat(e.target.value))}
                                className="flex-1 accent-blue-500 h-1 bg-slate-700 rounded"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-400">Kích thước:</span>
                              <input
                                type="range"
                                min="0.5"
                                max="1.8"
                                step="0.1"
                                value={item.scale || 1}
                                onChange={(e) => handleUpdateItemProperty(item.id, 'scale', parseFloat(e.target.value))}
                                className="flex-1 accent-blue-500 h-1 bg-slate-700 rounded"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Community & Chat Panel */}
        <div className={`w-80 border-l flex flex-col z-10 shadow-lg shrink-0 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => { setActiveRightTab('chat'); sfx.play('click'); }}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                activeRightTab === 'chat' ? 'border-blue-500 text-blue-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Trò chuyện Live
            </button>
            <button
              onClick={() => { setActiveRightTab('members'); sfx.play('click'); }}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                activeRightTab === 'members' ? 'border-blue-500 text-blue-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" /> Thành viên (15)
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
                    <div className={`p-2.5 rounded-xl text-xs leading-relaxed ${isDarkMode ? 'bg-slate-800/70 border border-slate-700/50' : 'bg-slate-100 text-slate-800'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="Nhắn tin (hiện bong bóng 3D)..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300'}`}
                />
                <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shadow-md shadow-blue-600/30">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {activeRightTab === 'members' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {teammates.map((tm) => (
                <div
                  key={tm.id}
                  onClick={() => {
                    if (!tm.isUser) {
                      setActiveTargetTeammate(tm);
                      sfx.play('click');
                    } else {
                      sfx.play('camera');
                      setSelectedDeskId(tm.id);
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer hover:border-blue-500 ${
                    selectedDeskId === tm.id ? 'bg-blue-600/15 border-blue-500' : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md" style={{ backgroundColor: tm.color }}>
                      {tm.emotion || '💻'}
                    </div>
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-1.5">
                        {tm.name}
                        {tm.isUser && <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 rounded">Bạn</span>}
                      </div>
                      <div className="text-[10px] text-slate-400">{tm.status}</div>
                    </div>
                  </div>
                  {!tm.isUser && (
                    <span className="text-[10px] text-amber-400 font-bold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30">
                      Tương Tác
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Office Name Modal */}
      {isEditingOfficeName && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" /> Đổi Tên Văn Phòng 3D
              </h3>
              <button onClick={() => setIsEditingOfficeName(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-slate-300 font-semibold">Tên mới cho Văn Phòng (Cập nhật trực tiếp lên bảng hiệu 3D):</label>
              <input
                type="text"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="Nhập tên văn phòng..."
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => { setIsEditingOfficeName(false); sfx.play('chime'); }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Lưu Tên Bảng Hiệu 3D
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
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
                  value={currentUser.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setTeammates((prev) => prev.map((tm) => (tm.isUser ? { ...tm, name } : tm)));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Giới tính:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['male', 'female', 'nonbinary'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setTeammates((prev) => prev.map((tm) => (tm.isUser ? { ...tm, gender: g } : tm)))}
                      className={`py-2 rounded-xl border font-medium capitalize ${
                        currentUser.gender === g ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}