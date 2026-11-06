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

// Initial Teammates (Optimized for 10-15 players)
const INITIAL_TEAMMATES = [
  { id: 1, name: "Bạn (Player)", gender: "male", hairStyle: "short", role: "Product Creator", isUser: true, status: "Tự do đi dạo 🚶‍♂️", emotion: "✨", color: "#3B82F6", hairColor: "#1E293B", skinColor: "#fde047" },
  { id: 2, name: "Sarah Chen", gender: "female", hairStyle: "long", role: "Lead UI/UX Designer", isUser: false, status: "Vẽ Figma Icon 🎨", emotion: "💡", color: "#EC4899", hairColor: "#BE185D", skinColor: "#fde047" },
  { id: 3, name: "Alex Rivers", gender: "male", hairStyle: "spiky", role: "Fullstack Engineer", isUser: false, status: "Fix bug 3D 🐛", emotion: "💻", color: "#10B981", hairColor: "#047857", skinColor: "#fde047" },
  { id: 4, name: "Elena Rostova", gender: "female", hairStyle: "ponytail", role: "Product Manager", isUser: false, status: "Họp Sprint 📊", emotion: "☕", color: "#8B5CF6", hairColor: "#4C1D95", skinColor: "#fde047" },
  { id: 5, name: "Marcus Vance", gender: "male", hairStyle: "short", role: "Tech Lead", isUser: false, status: "Review PR 🔍", emotion: "⚡", color: "#F59E0B", hairColor: "#78350F", skinColor: "#fde047" },
  { id: 6, name: "Chloe Dubois", gender: "female", hairStyle: "bob", role: "UX Researcher", isUser: false, status: "Phỏng vấn user 🎧", emotion: "😃", color: "#06B6D4", hairColor: "#155E75", skinColor: "#fde047" },
  { id: 7, name: "Kenji Sato", gender: "male", hairStyle: "spiky", role: "Backend Architect", isUser: false, status: "Tối ưu SQL ⚡", emotion: "🔥", color: "#EF4444", hairColor: "#991B1B", skinColor: "#fde047" },
  { id: 8, name: "Maya Lin", gender: "female", hairStyle: "long", role: "Marketing Lead", isUser: false, status: "Chiến dịch Ads 🚀", emotion: "🎉", color: "#D97706", hairColor: "#92400E", skinColor: "#fde047" },
  { id: 9, name: "David Miller", gender: "male", hairStyle: "short", role: "QA Engineer", isUser: false, status: "Chạy Cypress test 🧪", emotion: "🔍", color: "#6366F1", hairColor: "#312E81", skinColor: "#fde047" },
  { id: 10, name: "Sophia Taylor", gender: "female", hairStyle: "ponytail", role: "HR Specialist", isUser: false, status: "Onboarding mới 🤝", emotion: "💖", color: "#F43F5E", hairColor: "#881337", skinColor: "#fde047" }
];

// Item Catalog for Decorator
const DECOR_INVENTORY = {
  tech: [
    { type: 'laptop', name: 'Laptop Gaming', icon: '💻', desc: 'Máy tính xách tay với đèn LED', defaultScale: 1.0, color: '#1e293b' },
    { type: 'dual_monitors', name: 'Màn hình Kép 4K', icon: '🖥️', desc: 'Hệ thống màn hình mở rộng', defaultScale: 1.0, color: '#0f172a' },
    { type: 'keyboard', name: 'Bàn phím cơ RGB', icon: '⌨️', desc: 'Bàn phím cơ phát sáng', defaultScale: 0.9, color: '#3b82f6' }
  ],
  plants: [
    { type: 'succulent', name: 'Chậu Sen Đá Mini', icon: '🪴', desc: 'Sen đá gốm xinh xắn', defaultScale: 0.8, color: '#10b981' },
    { type: 'monstera', name: 'Cây Trầu Bà Lớn', icon: '🌿', desc: 'Chậu trầu bà lá xẻ tươi mát', defaultScale: 1.1, color: '#059669' }
  ],
  personal: [
    { type: 'teddy_bear', name: 'Gấu Bông Nhồi Bông', icon: '🧸', desc: 'Gấu bông lông mềm mại', defaultScale: 0.9, color: '#d97706' },
    { type: 'rubber_duck', name: 'Vịt Vàng Debug', icon: '🦆', desc: 'Chú vịt cao su giải code', defaultScale: 0.7, color: '#eab308' }
  ],
  accessories: [
    { type: 'coffee_mug', name: 'Ly Cà Phê Nóng', icon: '☕', desc: 'Ly cà phê bốc khói tỏa hương', defaultScale: 0.7, color: '#f97316' },
    { type: 'desk_lamp', name: 'Đèn Bàn LED', icon: '💡', desc: 'Đèn chiếu sáng ấm áp', defaultScale: 1.0, color: '#f59e0b' }
  ]
};

const DEFAULT_DESK_ITEMS = {
  1: [
    { id: 'item-1', type: 'dual_monitors', x: 0, z: -0.1, rotY: 0, scale: 1, color: '#0f172a' },
    { id: 'item-2', type: 'coffee_mug', x: -0.65, z: 0.2, rotY: 0, scale: 0.7, color: '#f97316' }
  ],
  2: [
    { id: 'item-21', type: 'dual_monitors', x: 0, z: -0.1, rotY: 0, scale: 1, color: '#0f172a' },
    { id: 'item-22', type: 'keyboard', x: 0, z: 0.25, rotY: 0, scale: 0.9, color: '#ec4899' }
  ]
};

function getDefaultDesk3DPosition(id) {
  const index = id - 1;
  if (index < 5) {
    const col = index;
    const x = (col - 2.0) * 3.0;
    return { x, z: -1.5, rotY: 0 };
  } else {
    const col = index - 5;
    const x = (col - 2.0) * 3.0;
    return { x, z: 1.5, rotY: Math.PI };
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [officeName, setOfficeName] = useState('VĂN PHÒNG TỐI ƯU FPS');

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
    for (let i = 1; i <= 10; i++) {
      pos[i] = getDefaultDesk3DPosition(i);
    }
    return pos;
  });

  const [isSitting, setIsSitting] = useState(false);
  const [seatedChairInfo, setSeatedChairInfo] = useState(null);
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [activeTargetTeammate, setActiveTargetTeammate] = useState(null);

  const [dizzyStates, setDizzyStates] = useState({});
  const [trippedStates, setTrippedStates] = useState({});
  const [speechBubbles, setSpeechBubbles] = useState([]);

  const [activeCategory, setActiveCategory] = useState('tech');
  const [activeRightTab, setActiveRightTab] = useState('chat');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingOfficeName, setIsEditingOfficeName] = useState(false);

  const playerPosRef = useRef({ x: -2.0 * 3.0, z: 3.2, targetX: -2.0 * 3.0, targetZ: 3.2 });
  const flyingProjectilesRef = useRef([]);

  const [chatMessages, setChatMessages] = useState([
    { id: 'm1', senderId: 2, senderName: 'Sarah Chen', text: 'Đã tắt hoàn toàn hiệu ứng bóng đổ để game siêu mượt! 🚀', time: '10:00 AM' }
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
        console.warn("Auth Error", err);
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
      }, (err) => console.warn("Desks sync error", err));

      const chatCol = collection(db, 'artifacts', appId, 'public', 'data', 'chat');
      const unsubChat = onSnapshot(chatCol, (snapshot) => {
        const msgs = [];
        snapshot.forEach((docSnap) => msgs.push({ id: docSnap.id, ...docSnap.data() }));
        if (msgs.length > 0) {
          msgs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
          setChatMessages(msgs);
        }
      }, (err) => console.warn("Chat sync error", err));

      return () => {
        unsubDesks();
        unsubChat();
      };
    } catch (e) {
      console.warn("Firestore error", e);
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

  // --- Optimized 3D Scene (NO SHADOWS, LOW POLYGON COUNT) ---
  useEffect(() => {
    if (!threeLoaded || !canvasContainerRef.current) return;

    const THREE = window.THREE;
    const container = canvasContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkMode ? 0x0f172a : 0xfefcf8);
    scene.fog = new THREE.FogExp2(isDarkMode ? 0x0f172a : 0xfefcf8, 0.012);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    // COMPLETELY DISABLED SHADOW MAPS FOR MAXIMUM FPS
    renderer.shadowMap.enabled = false;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    threeSceneRef.current = { scene, camera, renderer };

    // Optimized Lighting (Ambient + Single Directional, NO Shadow calculations)
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    sunLight.position.set(-15, 20, 15);
    scene.add(sunLight);

    // Simple Floor
    const floorGeo = new THREE.PlaneGeometry(36, 24);
    const floorMat = new THREE.MeshBasicMaterial({ color: isDarkMode ? 0x1e293b : 0xe2d9c5 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.userData = { isFloorPlane: true };
    scene.add(floor);

    // Static Walls (No complex textures to save GPU memory)
    const wallMat = new THREE.MeshBasicMaterial({ color: isDarkMode ? 0x0f172a : 0xf1eeeb });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(36, 9, 0.3), wallMat);
    backWall.position.set(0, 4.5, -12);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 9, 24), wallMat);
    leftWall.position.set(-18, 4.5, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 9, 24), wallMat);
    rightWall.position.set(18, 4.5, 0);
    scene.add(rightWall);

    // Static Plants (No sway animation)
    const createStaticPlant = (px, pz) => {
      const group = new THREE.Group();
      group.position.set(px, 0, pz);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.8, 8), new THREE.MeshBasicMaterial({ color: 0xcccccc }));
      pot.position.y = 0.4;
      group.add(pot);
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), new THREE.MeshBasicMaterial({ color: 0x16a34a }));
      foliage.position.y = 1.3;
      group.add(foliage);
      return group;
    };
    scene.add(createStaticPlant(-16, -10));
    scene.add(createStaticPlant(16, -10));

    const desksGroup = new THREE.Group();
    scene.add(desksGroup);

    const avatarGroupMapRef = {};
    const dizzyDucksGroupMapRef = {};
    const zzzSpriteMapRef = {};

    let playerAvatarMeshRef = null;
    let playerThighsRef = [];
    let playerShinsRef = [];
    let playerAvatarArmsRef = [];

    function create3DItemMesh(item, isSelected, deskId) {
      const group = new THREE.Group();
      const col = item.color ? parseInt(item.color.replace('#', '0x')) : 0x3b82f6;

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.1, 0.3),
        new THREE.MeshBasicMaterial({ color: col })
      );
      mesh.position.y = 0.05;
      group.add(mesh);

      if (isSelected) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.25, 0.3, 12),
          new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01;
        group.add(ring);
      }

      group.position.set(item.x || 0, 0.71, item.z || 0);
      group.rotation.y = item.rotY || 0;
      const s = item.scale || 1;
      group.scale.set(s, s, s);
      group.userData = { itemId: item.id, itemData: item, deskId };
      return group;
    }

    function createOptimizedAvatarMesh(tm, isPlayer = false, isSeated = false) {
      const avatarGroup = new THREE.Group();
      if (!isPlayer) {
        avatarGroup.position.set(0, 0, 0.75);
      }

      const shirtColor = tm.color ? parseInt(tm.color.replace('#', '0x')) : 0x3b82f6;
      const skinMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
      const clothMat = new THREE.MeshBasicMaterial({ color: shirtColor });
      const pantsMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

      const hips = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.22), pantsMat);
      hips.position.y = 0.45;
      avatarGroup.add(hips);

      const thighsGroup = new THREE.Group();
      thighsGroup.position.y = 0.42;

      const leftThighGroup = new THREE.Group();
      leftThighGroup.position.x = -0.1;
      const leftThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.22, 6), pantsMat);
      leftThighMesh.position.y = -0.11;
      leftThighGroup.add(leftThighMesh);

      const leftShinGroup = new THREE.Group();
      leftShinGroup.position.y = -0.22;
      const leftShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.2, 6), skinMat);
      leftShinMesh.position.y = -0.1;
      leftShinGroup.add(leftShinMesh);
      leftThighGroup.add(leftShinGroup);

      const rightThighGroup = new THREE.Group();
      rightThighGroup.position.x = 0.1;
      const rightThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.22, 6), pantsMat);
      rightThighMesh.position.y = -0.11;
      rightThighGroup.add(rightThighMesh);

      const rightShinGroup = new THREE.Group();
      rightShinGroup.position.y = -0.22;
      const rightShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.2, 6), skinMat);
      rightShinMesh.position.y = -0.1;
      rightShinGroup.add(rightShinMesh);
      rightThighGroup.add(rightShinGroup);

      thighsGroup.add(leftThighGroup);
      thighsGroup.add(rightThighGroup);
      avatarGroup.add(thighsGroup);

      const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.22), clothMat);
      torsoMesh.position.y = 0.7;
      avatarGroup.add(torsoMesh);

      const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), clothMat);
      arm1.position.set(-0.24, 0.7, 0);
      avatarGroup.add(arm1);

      const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), clothMat);
      arm2.position.set(0.24, 0.7, 0);
      avatarGroup.add(arm2);

      const headGroup = new THREE.Group();
      headGroup.position.y = 1.08;
      const headBase = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), skinMat);
      headGroup.add(headBase);
      avatarGroup.add(headGroup);

      if (isPlayer) {
        playerAvatarArmsRef = [arm1, arm2];
        playerThighsRef = [leftThighGroup, rightThighGroup];
        playerShinsRef = [leftShinGroup, rightShinGroup];
      }

      const dizzyRingGroup = new THREE.Group();
      dizzyRingGroup.position.set(0, 1.4, 0);
      dizzyRingGroup.visible = false;
      avatarGroup.add(dizzyRingGroup);
      dizzyDucksGroupMapRef[tm.id] = dizzyRingGroup;

      const zzzSprite = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x60a5fa }));
      zzzSprite.scale.set(0.8, 0.8, 1);
      zzzSprite.position.set(0, 1.6, 0);
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

    // Populate Desks (Optimized Low-Poly)
    teammates.forEach((tm) => {
      const pos = deskLayoutPositions[tm.id] || getDefaultDesk3DPosition(tm.id);
      const deskGroup = new THREE.Group();
      deskGroup.position.set(pos.x, 0, pos.z);
      deskGroup.rotation.y = pos.rotY;
      deskGroup.userData = { deskId: tm.id, teammate: tm, isDeskUnit: true };

      const tableTop = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.06, 1.2),
        new THREE.MeshBasicMaterial({ color: isDarkMode ? 0x334155 : 0xe2e8f0 })
      );
      tableTop.position.y = 0.71;
      tableTop.userData = { isDeskTopPlane: true, deskId: tm.id };
      deskGroup.add(tableTop);

      // Simple Legs
      const legMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
      [[-1.0, 0.35, -0.5], [1.0, 0.35, -0.5], [-1.0, 0.35, 0.5], [1.0, 0.35, 0.5]].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 4), legMat);
        leg.position.set(lx, ly, lz);
        deskGroup.add(leg);
      });

      // Chair
      const chairGroup = new THREE.Group();
      chairGroup.position.set(0, 0, 0.75);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.6), legMat);
      seat.position.y = 0.42;
      seat.userData = { isChair: true, deskId: tm.id, chairType: 'desk_chair' };
      chairGroup.add(seat);
      deskGroup.add(chairGroup);

      if (!tm.isUser) {
        const avatarMesh = createOptimizedAvatarMesh(tm, false, true);
        deskGroup.add(avatarMesh);
      }

      const items = deskConfigs[tm.id] || [];
      const itemsContainer = new THREE.Group();
      items.forEach((item) => {
        const itemMesh = create3DItemMesh(item, item.id === selectedItemIdOnDesk, tm.id);
        itemsContainer.add(itemMesh);
      });
      deskGroup.add(itemsContainer);

      desksGroup.add(deskGroup);
    });

    const playerAvatarGroup = new THREE.Group();
    playerAvatarGroup.position.set(playerPosRef.current.x, 0, playerPosRef.current.z);
    const playerAvatarMesh = createOptimizedAvatarMesh(currentUser, true, isSitting);
    playerAvatarGroup.add(playerAvatarMesh);
    scene.add(playerAvatarGroup);
    playerAvatarMeshRef = playerAvatarGroup;

    let cameraAngleX = 0;
    let cameraAngleY = 0.5;
    let cameraDistance = 20;
    let cameraTargetCenter = new THREE.Vector3(0, 0, 0);

    let isLeftMouseDown = false;
    let isRightMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const domElem = renderer.domElement;

    const getRaycastIntersects = (e) => {
      const rect = domElem.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      return raycaster.intersectObjects([floor, ...desksGroup.children], true);
    };

    const onPointerDown = (e) => {
      e.preventDefault();
      const intersects = getRaycastIntersects(e);

      if (e.button === 0 && intersects.length > 0) {
        let clickedDeskId = null;
        let clickedFloorPoint = null;
        let clickedChairObj = null;

        for (let i = 0; i < intersects.length; i++) {
          let obj = intersects[i].object;
          if (obj.userData?.isFloorPlane && !clickedFloorPoint) clickedFloorPoint = intersects[i].point;
          if (obj.userData?.isChair && !clickedChairObj) clickedChairObj = obj;

          while (obj && obj.parent !== scene) {
            if (obj.userData?.isAvatarObject) {
              const targetId = obj.userData.teammateId;
              const foundTm = teammates.find((t) => t.id === targetId);
              if (foundTm && !foundTm.isUser) {
                setActiveTargetTeammate(foundTm);
                sfx.play('click');
                return;
              }
            }
            if (obj.userData?.deskId && !clickedDeskId) clickedDeskId = obj.userData.deskId;
            obj = obj.parent;
          }
        }

        if (clickedChairObj && !isLayoutMode) {
          const deskId = clickedChairObj.userData?.deskId;
          const dPos = deskLayoutPositions[deskId] || getDefaultDesk3DPosition(deskId);
          const targetSeatWorldPos = { x: dPos.x, y: 0.42, z: dPos.z + (dPos.rotY === 0 ? 0.75 : -0.75) };
          playerPosRef.current.targetX = targetSeatWorldPos.x;
          playerPosRef.current.targetZ = targetSeatWorldPos.z;
          setSeatedChairInfo({ deskId, seatPos: targetSeatWorldPos, rot: dPos.rotY });
          sfx.play('step');
          return;
        }

        if (clickedDeskId && selectedDeskId === null && !isLayoutMode) {
          setSelectedDeskId(clickedDeskId);
          sfx.play('camera');
          return;
        }

        if (clickedFloorPoint && selectedDeskId === null && !isLayoutMode) {
          if (isSitting) {
            setIsSitting(false);
            setSeatedChairInfo(null);
            sfx.play('stand');
          }
          playerPosRef.current.targetX = Math.max(-16, Math.min(16, clickedFloorPoint.x));
          playerPosRef.current.targetZ = Math.max(-10, Math.min(10, clickedFloorPoint.z));
          sfx.play('step');
        }
      }

      if (e.button === 0 && selectedDeskId === null) {
        isLeftMouseDown = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      } else if (e.button === 2) {
        isRightMouseDown = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerMove = (e) => {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      if (isLeftMouseDown && selectedDeskId === null) {
        cameraAngleX -= deltaX * 0.006;
        cameraAngleY = Math.max(0.15, Math.min(1.2, cameraAngleY + deltaY * 0.006));
      } else if (isRightMouseDown) {
        const panSpeed = 0.02;
        cameraTargetCenter.x -= deltaX * panSpeed * Math.cos(cameraAngleX);
        cameraTargetCenter.z -= deltaX * panSpeed * Math.sin(cameraAngleX);
      }
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isLeftMouseDown = false;
      isRightMouseDown = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      cameraDistance = Math.max(6, Math.min(35, cameraDistance + e.deltaY * 0.02));
    };

    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    let animationFrameId;
    let walkClock = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // WASD Movement Logic
      const moveSpeed = 0.14;
      let dx = 0;
      let dz = 0;
      const keys = keysPressedRef.current;
      if (keys['w'] || keys['arrowup']) dz -= moveSpeed;
      if (keys['s'] || keys['arrowdown']) dz += moveSpeed;
      if (keys['a'] || keys['arrowleft']) dx -= moveSpeed;
      if (keys['d'] || keys['arrowright']) dx += moveSpeed;

      if (dx !== 0 || dz !== 0) {
        playerPosRef.current.targetX = Math.max(-16, Math.min(16, playerPosRef.current.x + dx));
        playerPosRef.current.targetZ = Math.max(-10, Math.min(10, playerPosRef.current.z + dz));
      }

      const curr = playerPosRef.current;
      const distX = curr.targetX - curr.x;
      const distZ = curr.targetZ - curr.z;
      const dist = Math.sqrt(distX * distX + distZ * distZ);

      if (dist > 0.05) {
        curr.x += distX * 0.15;
        curr.z += distZ * 0.15;
        walkClock += 0.3;

        if (playerAvatarMeshRef) {
          playerAvatarMeshRef.rotation.y = Math.atan2(distX, distZ);
        }
        playerThighsRef.forEach((thigh, idx) => {
          if (thigh) thigh.rotation.x = Math.sin(walkClock + idx * Math.PI) * 0.5;
        });
      } else {
        curr.x = curr.targetX;
        curr.z = curr.targetZ;
        if (seatedChairInfo && !isSitting) {
          setIsSitting(true);
          sfx.play('sit');
        }
      }

      if (playerAvatarMeshRef) {
        playerAvatarMeshRef.position.x = curr.x;
        playerAvatarMeshRef.position.z = curr.z;
        if (isSitting) {
          playerAvatarMeshRef.position.y = 0.15;
          if (seatedChairInfo) playerAvatarMeshRef.rotation.y = seatedChairInfo.rot;
        } else {
          playerAvatarMeshRef.position.y = 0;
        }
      }

      if (selectedDeskId !== null) {
        const deskPos = deskLayoutPositions[selectedDeskId] || getDefaultDesk3DPosition(selectedDeskId);
        camera.position.set(deskPos.x, 3.0, deskPos.z + 3.0);
        camera.lookAt(new THREE.Vector3(deskPos.x, 1.0, deskPos.z));
      } else {
        const cx = cameraTargetCenter.x + cameraDistance * Math.sin(cameraAngleX) * Math.cos(cameraAngleY);
        const cy = cameraTargetCenter.y + cameraDistance * Math.sin(cameraAngleY);
        const cz = cameraTargetCenter.z + cameraDistance * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);
        camera.position.set(cx, cy, cz);
        camera.lookAt(cameraTargetCenter);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvasContainerRef.current) return;
      const w = canvasContainerRef.current.clientWidth;
      const h = canvasContainerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
    };
  }, [threeLoaded, selectedDeskId, isDarkMode, deskLayoutPositions, isSitting, seatedChairInfo, teammates, currentUser]);

  const handleThrowPaperBall = (targetTeammate) => {
    sfx.play('throw');
    setDizzyStates((prev) => ({ ...prev, [targetTeammate.id]: Date.now() + 3000 }));
    setActiveTargetTeammate(null);
  };

  const handleTripTeammate = (targetTeammate) => {
    sfx.play('trip');
    setTrippedStates((prev) => ({ ...prev, [targetTeammate.id]: Date.now() + 3000 }));
    setActiveTargetTeammate(null);
  };

  const handleCompleteOnboarding = (e) => {
    e.preventDefault();
    if (!characterConfig.name.trim()) return;
    sfx.play('chime');
    setTeammates((prev) =>
      prev.map((tm) => (tm.isUser ? { ...tm, ...characterConfig } : tm))
    );
    setHasOnboarded(true);
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
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      
      {!hasOnboarded && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white">Văn Phòng Siêu Mượt (Optimized FPS)</h1>
              <p className="text-xs text-slate-400">Tùy chỉnh nhân vật để tham gia</p>
            </div>
            <form onSubmit={handleCompleteOnboarding} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Tên nhân vật:</label>
                <input
                  type="text"
                  required
                  value={characterConfig.name}
                  onChange={(e) => setCharacterConfig({ ...characterConfig, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg mt-4"
              >
                Vào Văn Phòng Ngay
              </button>
            </form>
          </div>
        </div>
      )}

      <header className={`h-16 border-b px-6 flex items-center justify-between z-10 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-amber-400" />
          <h1 className="font-bold text-base text-amber-400 font-serif">🏛️ {officeName} (Mode Siêu Mượt)</h1>
        </div>
        <div className="flex items-center gap-3">
          {selectedDeskId !== null ? (
            <button
              onClick={() => setSelectedDeskId(null)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl"
            >
              Toàn cảnh
            </button>
          ) : (
            <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">
              Nhấp sàn để đi dạo (WASD)
            </div>
          )}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl bg-slate-800 text-slate-300">
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative bg-slate-950">
          <div ref={canvasContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {isSitting && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-2xl shadow-2xl flex items-center gap-4 z-30">
              <span className="text-xs font-bold">Đang ngồi làm việc</span>
              <button
                onClick={() => { setIsSitting(false); setSeatedChairInfo(null); sfx.play('stand'); }}
                className="px-3 py-1 bg-white text-blue-600 font-bold text-xs rounded-xl"
              >
                Đứng Dậy
              </button>
            </div>
          )}

          {activeTargetTeammate && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 p-4 rounded-3xl z-30 flex items-center gap-4">
              <span className="text-xs text-white font-bold">{activeTargetTeammate.name}</span>
              <button onClick={() => handleThrowPaperBall(activeTargetTeammate)} className="px-3 py-1.5 bg-amber-500 text-xs rounded-xl font-bold">Ném giấy</button>
              <button onClick={() => handleTripTeammate(activeTargetTeammate)} className="px-3 py-1.5 bg-rose-600 text-white text-xs rounded-xl font-bold">Gạt chân</button>
              <button onClick={() => setActiveTargetTeammate(null)} className="p-1 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>

        <div className={`w-80 border-l flex flex-col z-10 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-blue-400">{msg.senderName}</span>
                    <span className="text-slate-500">{msg.time}</span>
                  </div>
                  <div className="p-2.5 rounded-xl text-xs bg-slate-800/70 border border-slate-700/50">
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
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none"
              />
              <button type="submit" className="p-2 bg-blue-600 text-white rounded-xl">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}