import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { 
  Monitor, Flower2, Smile, Coffee, Volume2, VolumeX, MessageSquare, 
  Users, Plus, Trash2, Send, X, Building2, User, Move, Package, BellRing, ZoomIn
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

// --- Sound Synthesizer ---
class WorkplaceSoundSystem {
  constructor() { this.ctx = null; }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  play(type) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.ctx.destination);

      if (type === 'click') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
      } else if (type === 'pop') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
      } else if (type === 'throw') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
        gain.gain.setValueAtTime(0.18, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
      } else if (type === 'trip') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
        gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
      } else if (type === 'step') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.03);
        gain.gain.setValueAtTime(0.04, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now); osc.stop(now + 0.03);
      }
    } catch (e) {}
  }
}
const sfx = new WorkplaceSoundSystem();

// --- Item Decor Inventory ---
const DECOR_INVENTORY = {
  tech: [
    { type: 'laptop', name: 'Laptop Gaming', icon: '💻', color: '#1e293b' },
    { type: 'dual_monitors', name: 'Màn hình Kép', icon: '🖥️', color: '#0f172a' },
    { type: 'keyboard', name: 'Bàn phím cơ RGB', icon: '⌨️', color: '#3b82f6' }
  ],
  plants: [
    { type: 'succulent', name: 'Chậu Sen Đá', icon: '🪴', color: '#10b981' },
    { type: 'monstera', name: 'Cây Trầu Bà', icon: '🌿', color: '#059669' },
    { type: 'bonsai', name: 'Cây Bonsai', icon: '🌳', color: '#047857' }
  ],
  personal: [
    { type: 'teddy_bear', name: 'Gấu Bông', icon: '🧸', color: '#d97706' },
    { type: 'coffee_mug', name: 'Ly Cà Phê', icon: '☕', color: '#f97316' },
    { type: 'rubber_duck', name: 'Vịt Cao Su', icon: '🦆', color: '#eab308' }
  ]
};

const DEFAULT_DESK_ITEMS = {
  1: [
    { id: 'item-1', type: 'dual_monitors', x: 0, z: -0.1, rotY: 0, scale: 1, color: '#0f172a' },
    { id: 'item-2', type: 'coffee_mug', x: -0.6, z: 0.2, rotY: 0, scale: 0.7, color: '#f97316' },
    { id: 'item-3', type: 'rubber_duck', x: 0.6, z: -0.2, rotY: 0, scale: 0.8, color: '#eab308' }
  ],
  2: [
    { id: 'item-21', type: 'laptop', x: 0, z: 0, rotY: 0, scale: 1, color: '#1e293b' },
    { id: 'item-22', type: 'succulent', x: 0.6, z: -0.2, rotY: 0, scale: 0.8, color: '#10b981' }
  ]
};

function getDefaultDesk3DPosition(id) {
  const index = id - 1;
  if (index < 8) return { x: (index - 3.5) * 2.55, z: -1.4, rotY: 0 };
  return { x: (index - 8 - 3.0) * 2.55, z: 1.4, rotY: Math.PI };
}

const INITIAL_TEAMMATES = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: i === 0 ? "Bạn (Player)" : `Bàn trống #${i + 1}`,
  gender: i % 2 === 0 ? "male" : "female",
  role: i === 0 ? "Product Creator" : "Thành viên nhóm",
  isUser: i === 0,
  emotion: "💻",
  color: ["#3B82F6", "#EC4899", "#10B981", "#8B5CF6", "#F59E0B", "#06B6D4", "#EF4444"][i % 7],
}));

// Tạo Texture Bong Bóng Chat 3D
function createSpeechBubbleTexture(text, senderName) {
  const THREE = window.THREE;
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 6;
  if (ctx.roundRect) ctx.roundRect(16, 16, 480, 170, 24); else ctx.fillRect(16, 16, 480, 170);
  ctx.fill(); ctx.stroke();

  ctx.beginPath(); ctx.moveTo(240, 186); ctx.lineTo(256, 220); ctx.lineTo(272, 186);
  ctx.closePath(); ctx.fillStyle = '#3b82f6'; ctx.fill();

  ctx.fillStyle = '#60a5fa'; ctx.font = 'bold 24px Inter, sans-serif';
  ctx.fillText(senderName, 36, 52);

  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px Inter, sans-serif';
  const words = text.split(' '); let line = ''; let y = 92;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 420 && n > 0) {
      ctx.fillText(line, 36, y); line = words[n] + ' '; y += 36;
      if (y > 165) break;
    } else line = testLine;
  }
  ctx.fillText(line, 36, y);
  return new THREE.CanvasTexture(canvas);
}

// Xây dựng Object 3D Trang trí Bàn (Không tạo đổ bóng)
function createItemMesh(item) {
  const THREE = window.THREE;
  const group = new THREE.Group();
  const color = parseInt((item.color || '#ffffff').replace('#', '0x'));
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.2 });

  if (item.type === 'laptop') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.36), mat); base.position.y = 0.012;
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.025), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.1 }));
    screen.position.set(0, 0.16, -0.17); screen.rotation.x = -0.1;
    group.add(base, screen);
  } else if (item.type === 'dual_monitors') {
    const m1 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.32, 0.04), mat); m1.position.set(-0.27, 0.2, 0); m1.rotation.y = 0.25;
    const m2 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.32, 0.04), mat); m2.position.set(0.27, 0.2, 0); m2.rotation.y = -0.25;
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), new THREE.MeshStandardMaterial({ color: 0x64748b })); stand.position.y = 0.1;
    group.add(m1, m2, stand);
  } else if (item.type === 'coffee_mug') {
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 16), mat); mug.position.y = 0.06;
    group.add(mug);
  } else if (item.type === 'rubber_duck') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 }));
    body.position.y = 0.05; body.scale.set(1.2, 0.9, 1.4);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 }));
    head.position.set(0, 0.11, 0.05);
    group.add(body, head);
  } else if (item.type === 'succulent' || item.type === 'bonsai' || item.type === 'monstera') {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })); pot.position.y = 0.05;
    const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1), mat); plant.position.y = 0.14;
    group.add(pot, plant);
  } else if (item.type === 'teddy_bear') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), mat); body.position.y = 0.08;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), mat); head.position.y = 0.18;
    group.add(body, head);
  } else {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), mat); box.position.y = 0.1;
    group.add(box);
  }

  group.position.set(item.x || 0, 0.75, item.z || 0);
  if (item.rotY) group.rotation.y = item.rotY;
  if (item.scale) group.scale.set(item.scale, item.scale, item.scale);
  return group;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [officeName] = useState('VĂN PHÒNG SÁNG TẠO SÀI GÒN');

  const [characterConfig, setCharacterConfig] = useState({ name: 'Bạn (Player)', color: '#3b82f6' });
  const [selectedDeskId, setSelectedDeskId] = useState(null);
  const [deskConfigs, setDeskConfigs] = useState(DEFAULT_DESK_ITEMS);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [activeTargetTeammate, setActiveTargetTeammate] = useState(null);
  const [activeRightTab, setActiveRightTab] = useState('chat');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [uiToast, setUiToast] = useState(null);

  // Quản lý hiệu ứng chọc ghẹo hoạt ảnh đặc biệt
  const [duckEffectActive, setDuckEffectActive] = useState(false); // Vịt xoay 3 giây
  const [faintEffectActive, setFaintEffectActive] = useState(false); // Té xỉu 3 giây

  const [deskLayoutPositions, setDeskLayoutPositions] = useState(() => {
    const pos = {}; for (let i = 1; i <= 15; i++) pos[i] = getDefaultDesk3DPosition(i); return pos;
  });

  const [chatMessages, setChatMessages] = useState([
    { id: 'm1', senderId: 2, senderName: 'Hệ thống 3D', text: 'Chào mừng các bạn đến với Văn phòng 3D!', time: '10:00 AM', timestamp: { seconds: Date.now() / 1000 } }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [threeLoaded, setThreeLoaded] = useState(false);

  const canvasContainerRef = useRef(null);
  const playerPosRef = useRef({ x: -3.5 * 2.55, z: 3.2, targetX: -3.5 * 2.55, targetZ: 3.2 });
  
  const desk3DMeshMapRef = useRef({});
  const deskItemGroupsRef = useRef({});
  const activeBubblesRef = useRef({});
  const playerGroupRef = useRef(null); // Tham chiếu đến group nhân vật chính để làm hoạt ảnh té xỉu / vịt xoay
  const cameraTargetFocusRef = useRef(null);

  const deskLayoutPositionsRef = useRef(deskLayoutPositions); deskLayoutPositionsRef.current = deskLayoutPositions;
  const deskConfigsRef = useRef(deskConfigs); deskConfigsRef.current = deskConfigs;
  const isLayoutModeRef = useRef(isLayoutMode); isLayoutModeRef.current = isLayoutMode;
  const chatMessagesRef = useRef(chatMessages); chatMessagesRef.current = chatMessages;

  const showToast = (title, desc, colorClass) => {
    setUiToast({ title, desc, colorClass });
    setTimeout(() => setUiToast(null), 3500);
  };

  useEffect(() => {
    const saved = localStorage.getItem('user_3d_avatar');
    if (saved) { try { setCharacterConfig(JSON.parse(saved)); setHasOnboarded(true); } catch (e) {} }
  }, []);

  useEffect(() => {
    if (window.THREE) { setThreeLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true; script.onload = () => setThreeLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (e) {} };
    initAuth();
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // Firebase Realtime Sync
  useEffect(() => {
    if (!db || !user) return;

    const desksCol = collection(db, 'artifacts', appId, 'public', 'data', 'desks');
    const unsubDesks = onSnapshot(desksCol, (snapshot) => {
      const loadedDesks = { ...DEFAULT_DESK_ITEMS };
      const loadedPositions = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.items) loadedDesks[docSnap.id] = data.items;
        if (data.position) loadedPositions[docSnap.id] = data.position;
      });
      setDeskConfigs(loadedDesks);

      if (Object.keys(loadedPositions).length > 0) {
        setDeskLayoutPositions((prev) => {
          const nextPos = { ...prev, ...loadedPositions };
          Object.keys(loadedPositions).forEach((deskId) => {
            const mesh = desk3DMeshMapRef.current[deskId];
            if (mesh) {
              mesh.position.x = loadedPositions[deskId].x;
              mesh.position.z = loadedPositions[deskId].z;
              if (loadedPositions[deskId].rotY !== undefined) mesh.rotation.y = loadedPositions[deskId].rotY;
            }
          });
          return nextPos;
        });
      }
    });

    const chatCol = collection(db, 'artifacts', appId, 'public', 'data', 'chat');
    const unsubChat = onSnapshot(chatCol, (snapshot) => {
      const msgs = [];
      snapshot.forEach((docSnap) => msgs.push({ id: docSnap.id, ...docSnap.data() }));
      if (msgs.length > 0) {
        msgs.sort((a, b) => (a.createdAt || a.timestamp?.seconds || 0) - (b.createdAt || b.timestamp?.seconds || 0));
        setChatMessages(msgs);
      }
    });

    const playersCol = collection(db, 'artifacts', appId, 'public', 'data', 'players');
    const unsubPlayers = onSnapshot(playersCol, (snapshot) => {
      const now = Date.now() / 1000;
      const active = [];
      snapshot.forEach((docSnap) => {
        const p = docSnap.data();
        if (p.uid && p.uid !== user.uid && (now - (p.lastSeen?.seconds || now) < 15)) active.push(p);
      });
      setOnlinePlayers(active);
    });

    return () => { unsubDesks(); unsubChat(); unsubPlayers(); };
  }, [user]);

  const teammates = useMemo(() => {
    const list = [...INITIAL_TEAMMATES];
    list[0] = { ...list[0], name: characterConfig.name, color: characterConfig.color, isUser: true };
    onlinePlayers.forEach((p, idx) => {
      const deskIdx = idx + 1;
      if (deskIdx < list.length) {
        list[deskIdx] = {
          id: deskIdx + 1, uid: p.uid, name: p.name || `Bạn bè #${deskIdx + 1}`,
          color: p.color || '#ec4899', isUser: false, isRealPlayer: true, role: 'Online 🌐'
        };
      }
    });
    return list;
  }, [characterConfig, onlinePlayers]);

  const teammatesRef = useRef(teammates); teammatesRef.current = teammates;
  const onlinePlayersRef = useRef(onlinePlayers); onlinePlayersRef.current = onlinePlayers;

  // 3D Engine Setup (Loại bỏ toàn bộ đổ bóng để tối ưu hiệu năng mượt mà tuyệt đối)
  useEffect(() => {
    if (!threeLoaded || !canvasContainerRef.current) return;
    const THREE = window.THREE;
    const container = canvasContainerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(renderer.domElement);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    scene.add(new THREE.AmbientLight(0xfff7ed, 1.2));
    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    sunLight.position.set(-20, 35, 25);
    scene.add(sunLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 30), new THREE.MeshBasicMaterial({ color: 0x1e1b18 }));
    floor.rotation.x = -Math.PI / 2; floor.userData = { isFloorPlane: true }; scene.add(floor);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(44, 12, 0.4), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
    backWall.position.set(0, 6, -14); scene.add(backWall);

    const createPlantMesh = (x, z) => {
      const pGroup = new THREE.Group(); pGroup.position.set(x, 0, z);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.9, 12), new THREE.MeshBasicMaterial({ color: 0x334155 })); pot.position.y = 0.45; pGroup.add(pot);
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.45, 6, 6), new THREE.MeshBasicMaterial({ color: 0x059669 }));
        leaf.position.set((Math.random()-0.5)*0.3, 1 + i * 0.25, (Math.random()-0.5)*0.3); pGroup.add(leaf);
      }
      scene.add(pGroup);
    };
    createPlantMesh(-20, -12); createPlantMesh(20, -12); createPlantMesh(-20, 12); createPlantMesh(20, 12);

    const desksGroup = new THREE.Group(); scene.add(desksGroup);
    const remotePlayersGroup = new THREE.Group(); scene.add(remotePlayersGroup);

    function createHumanMesh(tm, isPlayer = false) {
      const group = new THREE.Group();
      const col = tm.color ? parseInt(tm.color.replace('#', '0x')) : 0x3b82f6;
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.24), mat); torso.position.y = 0.72; group.add(torso);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfde047 })); head.position.y = 1.1; group.add(head);
      
      // Sprite Vịt xoay trên đầu khi bị ném giấy
      const duckCanvas = document.createElement('canvas'); duckCanvas.width = 128; duckCanvas.height = 128;
      const dCtx = duckCanvas.getContext('2d'); dCtx.font = '80px sans-serif'; dCtx.fillText('🦆', 24, 96);
      const duckSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(duckCanvas), transparent: true }));
      duckSprite.scale.set(0.7, 0.7, 1); duckSprite.position.set(0, 1.5, 0); duckSprite.visible = false;
      duckSprite.name = 'duckSprite';
      group.add(duckSprite);

      if (!isPlayer) { group.position.set(0, 0, 0.75); group.position.y = 0.15; }
      group.userData = { teammateId: tm.id || tm.uid, isAvatarObject: true, name: tm.name };
      return group;
    }

    // Build Bàn
    teammatesRef.current.forEach((tm) => {
      const pos = deskLayoutPositionsRef.current[tm.id] || getDefaultDesk3DPosition(tm.id);
      const deskGroup = new THREE.Group();
      deskGroup.position.set(pos.x, 0, pos.z); deskGroup.rotation.y = pos.rotY;
      deskGroup.userData = { deskId: tm.id, isDeskUnit: true, name: tm.name };
      desk3DMeshMapRef.current[tm.id] = deskGroup;

      const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.3), new THREE.MeshBasicMaterial({ color: 0x475569 })); table.position.y = 0.71; deskGroup.add(table);
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.65), new THREE.MeshBasicMaterial({ color: 0x1e293b })); chair.position.set(0, 0.45, 0.8); chair.userData = { isChair: true, deskId: tm.id }; deskGroup.add(chair);

      const bubbleCanvas = document.createElement('canvas'); bubbleCanvas.width = 280; bubbleCanvas.height = 120; const bCtx = bubbleCanvas.getContext('2d');
      bCtx.fillStyle = 'rgba(15, 23, 42, 0.9)'; if (bCtx.roundRect) bCtx.roundRect(10, 10, 260, 100, 16); else bCtx.fillRect(10, 10, 260, 100);
      bCtx.fill(); bCtx.lineWidth = 4; bCtx.strokeStyle = tm.color || '#3b82f6'; bCtx.stroke();
      bCtx.fillStyle = '#ffffff'; bCtx.font = 'bold 24px Inter, sans-serif'; bCtx.textAlign = 'center';
      bCtx.fillText(`💻 Bàn #${tm.id}`, 140, 50); bCtx.font = '20px Inter, sans-serif'; bCtx.fillStyle = '#60a5fa'; bCtx.fillText(tm.name, 140, 85);
      const bubbleSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(bubbleCanvas), transparent: true }));
      bubbleSprite.scale.set(1.9, 0.9, 1); bubbleSprite.position.set(0, 2.35, 0); deskGroup.add(bubbleSprite);

      const itemsGroup = new THREE.Group(); deskGroup.add(itemsGroup);
      deskItemGroupsRef.current[tm.id] = itemsGroup;

      if (!tm.isUser && !tm.isRealPlayer) {
        const npcMesh = createHumanMesh(tm, false); deskGroup.add(npcMesh);
      }
      desksGroup.add(deskGroup);
    });

    const playerGroup = new THREE.Group(); playerGroup.position.set(playerPosRef.current.x, 0, playerPosRef.current.z);
    const playerMesh = createHumanMesh(teammatesRef.current[0], true);
    playerGroup.add(playerMesh); scene.add(playerGroup);
    playerGroupRef.current = playerGroup;

    let camAngleX = 0, camAngleY = 0.5, camDist = 22;
    let isMouseDown = false, prevMousePos = { x: 0, y: 0 };
    let isDraggingEntireDesk = false, activeDraggedDeskId = null;

    const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
    const getRaycastIntersects = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1; mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      return raycaster.intersectObjects([floor, ...desksGroup.children, ...remotePlayersGroup.children], true);
    };

    const onPointerDown = (e) => {
      const intersects = getRaycastIntersects(e);
      if (intersects.length > 0) {
        let clickedDeskId = null;
        for (let i = 0; i < intersects.length; i++) {
          let obj = intersects[i].object;
          while (obj && obj.parent !== scene) {
            if (obj.userData?.isAvatarObject) {
              const targetId = obj.userData.teammateId;
              const found = teammatesRef.current.find((t) => t.id === targetId || t.uid === targetId);
              if (found && !found.isUser) {
                setActiveTargetTeammate(found); sfx.play('click'); return;
              }
            }
            if (obj.userData?.isDeskUnit && !clickedDeskId) clickedDeskId = obj.userData.deskId;
            obj = obj.parent;
          }

          if (isLayoutModeRef.current && clickedDeskId) {
            isDraggingEntireDesk = true; activeDraggedDeskId = clickedDeskId; sfx.play('drag'); return;
          }
          if (clickedDeskId) {
            setSelectedDeskId(clickedDeskId);
            cameraTargetFocusRef.current = clickedDeskId;
            sfx.play('click');
            return;
          }
          if (intersects[i].object.userData?.isFloorPlane && !isLayoutModeRef.current) {
            playerPosRef.current.targetX = intersects[i].point.x; playerPosRef.current.targetZ = intersects[i].point.z;
            cameraTargetFocusRef.current = null;
            sfx.play('step');
          }
        }
      }
      isMouseDown = true; prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (isDraggingEntireDesk && activeDraggedDeskId && isLayoutModeRef.current) {
        const intersects = getRaycastIntersects(e);
        for (let i = 0; i < intersects.length; i++) {
          if (intersects[i].object.userData?.isFloorPlane) {
            const pt = intersects[i].point;
            const newX = Math.max(-19, Math.min(19, pt.x)); const newZ = Math.max(-12, Math.min(12, pt.z));
            const deskMesh = desk3DMeshMapRef.current[activeDraggedDeskId];
            if (deskMesh) { deskMesh.position.x = newX; deskMesh.position.z = newZ; }
            setDeskLayoutPositions((prev) => ({ ...prev, [activeDraggedDeskId]: { ...(prev[activeDraggedDeskId] || {}), x: newX, z: newZ } }));
            break;
          }
        }
        return;
      }
      if (isMouseDown) {
        camAngleX -= (e.clientX - prevMousePos.x) * 0.005; camAngleY = Math.max(0.2, Math.min(1.2, camAngleY + (e.clientY - prevMousePos.y) * 0.005));
      }
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      if (isDraggingEntireDesk && activeDraggedDeskId) {
        sfx.play('place');
        const pos = deskLayoutPositionsRef.current[activeDraggedDeskId];
        if (db && pos) {
          try {
            setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'desks', String(activeDraggedDeskId)), {
              position: { x: pos.x, z: pos.z, rotY: pos.rotY || 0 }
            }, { merge: true });
          } catch (err) {}
        }
      }
      isDraggingEntireDesk = false; activeDraggedDeskId = null; isMouseDown = false;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const remoteMeshMap = {};
    let lastConfigsStr = "";
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Cập nhật trang trí bàn
      const currentConfigsStr = JSON.stringify(deskConfigsRef.current);
      if (lastConfigsStr !== currentConfigsStr) {
        lastConfigsStr = currentConfigsStr;
        Object.keys(deskItemGroupsRef.current).forEach(deskId => {
          const itemsGroup = deskItemGroupsRef.current[deskId];
          while (itemsGroup.children.length > 0) itemsGroup.remove(itemsGroup.children[0]);
          const items = deskConfigsRef.current[deskId] || [];
          items.forEach(item => itemsGroup.add(createItemMesh(item)));
        });
      }

      // Di chuyển nhân vật
      const curr = playerPosRef.current;
      curr.x += (curr.targetX - curr.x) * 0.12; curr.z += (curr.targetZ - curr.z) * 0.12;
      playerGroup.position.set(curr.x, 0, curr.z);

      let targetCamLookX = 0, targetCamLookZ = 0;
      if (cameraTargetFocusRef.current && deskLayoutPositionsRef.current[cameraTargetFocusRef.current]) {
        const focusedDeskPos = deskLayoutPositionsRef.current[cameraTargetFocusRef.current];
        targetCamLookX = focusedDeskPos.x; targetCamLookZ = focusedDeskPos.z;
        camDist = 12;
      } else {
        camDist = 22;
      }

      if (user && db && (Math.abs(curr.targetX - curr.x) > 0.05 || Math.abs(curr.targetZ - curr.z) > 0.05)) {
        try {
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', user.uid), {
            uid: user.uid, name: characterConfig.name, x: curr.x, z: curr.z, color: characterConfig.color, lastSeen: serverTimestamp()
          }, { merge: true });
        } catch (e) {}
      }

      onlinePlayersRef.current.forEach((rp) => {
        let rMesh = remoteMeshMap[rp.uid];
        if (!rMesh) {
          rMesh = createHumanMesh({ id: rp.uid, name: rp.name, color: rp.color || '#ec4899' }, true);
          remotePlayersGroup.add(rMesh); remoteMeshMap[rp.uid] = rMesh;
        }
        rMesh.position.set(rp.x || 0, 0, rp.z || 0);
      });

      camera.position.set(
        targetCamLookX + camDist * Math.sin(camAngleX) * Math.cos(camAngleY),
        camDist * Math.sin(camAngleY),
        targetCamLookZ + camDist * Math.cos(camAngleX) * Math.cos(camAngleY)
      );
      camera.lookAt(targetCamLookX, 0, targetCamLookZ);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [threeLoaded]);

  // Kích hoạt hiệu ứng Ném giấy (Vịt xoay 3 giây trên đầu)
  const triggerDuckEffect = () => {
    setDuckEffectActive(true);
    sfx.play('throw');
    showToast('Bị Ném Giấy!', 'Bạn bị chọi giấy choáng váng, vịt xoay trên đầu 3 giây! 🦆', 'amber');
    
    if (playerGroupRef.current) {
      const duckSprite = playerGroupRef.current.getObjectByName('duckSprite');
      if (duckSprite) duckSprite.visible = true;
    }

    setTimeout(() => {
      setDuckEffectActive(false);
      if (playerGroupRef.current) {
        const duckSprite = playerGroupRef.current.getObjectByName('duckSprite');
        if (duckSprite) duckSprite.visible = false;
      }
    }, 3000);
  };

  // Kích hoạt hiệu ứng Gạt chân (Té xỉu nằm ngửa 3 giây)
  const triggerFaintEffect = () => {
    setFaintEffectActive(true);
    sfx.play('trip');
    showToast('Bị Ngáng Chân!', 'Bạn bị gạt chân và té xỉu dưới sàn 3 giây! 💫', 'rose');

    if (playerGroupRef.current) {
      playerGroupRef.current.rotation.z = Math.PI / 2; // Ngả ngang người ngã xuống sàn
      playerGroupRef.current.position.y = -0.4;
    }

    setTimeout(() => {
      setFaintEffectActive(false);
      if (playerGroupRef.current) {
        playerGroupRef.current.rotation.z = 0; // Đứng dậy bình thường
        playerGroupRef.current.position.y = 0;
      }
    }, 3000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault(); if (!inputMessage.trim()) return;
    const currentSec = Date.now() / 1000;
    const newMsg = { id: `msg-${Date.now()}`, senderId: user ? user.uid : 'local', senderName: characterConfig.name, text: inputMessage.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), createdAt: currentSec };
    setChatMessages((prev) => [...prev, newMsg]); setInputMessage(''); sfx.play('pop');
    if (db) { try { setDoc(doc(collection(db, 'artifacts', appId, 'public', 'data', 'chat'), newMsg.id), { ...newMsg, timestamp: serverTimestamp() }); } catch (err) {} }
  };

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Toast thông báo hoạt ảnh */}
      {uiToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-5 py-3 rounded-2xl shadow-2xl border-2 bg-slate-900 text-white flex items-center gap-3 border-${uiToast.colorClass}-500 shadow-${uiToast.colorClass}-500/20`}>
            <BellRing className={`w-5 h-5 text-${uiToast.colorClass}-400`} />
            <div>
              <h4 className={`font-bold text-sm text-${uiToast.colorClass}-400`}>{uiToast.title}</h4>
              <p className="text-xs text-slate-300 font-medium">{uiToast.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between z-10 bg-slate-900/90 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md"><Building2 className="w-5 h-5" /></div>
          <div><h1 className="font-bold text-amber-400 font-serif text-base tracking-wide">🏛️ {officeName}</h1></div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsLayoutMode(!isLayoutMode)} className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${isLayoutMode ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
            <Move className="w-3.5 h-3.5" /> {isLayoutMode ? 'Đang Sắp Xếp Bàn' : '🛠️ Sắp Xếp Bàn'}
          </button>
          <button className="px-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: characterConfig.color }} />
            {characterConfig.name}
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative bg-slate-950 overflow-hidden">
          <div ref={canvasContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing relative" />
          
          <div className="absolute top-4 left-6 bg-slate-900/85 backdrop-blur border border-slate-800 px-4 py-2 rounded-2xl text-[11px] text-slate-300 shadow-xl flex items-center gap-2">
            <ZoomIn className="w-4 h-4 text-blue-400" /> Click chọn bàn để phóng to góc nhìn trang trí chi tiết
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col z-10 shrink-0 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.3)]">
          <div className="flex border-b border-slate-800">
            <button onClick={() => setActiveRightTab('chat')} className={`flex-1 py-3 text-xs font-semibold transition ${activeRightTab === 'chat' ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-800/40' : 'text-slate-400 hover:text-white'}`}>Trò chuyện Live</button>
            <button onClick={() => setActiveRightTab('decor')} className={`flex-1 py-3 text-xs font-semibold transition ${activeRightTab === 'decor' ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-800/40' : 'text-slate-400 hover:text-white'}`}>Trang trí Bàn (#{selectedDeskId || 1})</button>
          </div>

          {activeRightTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="p-2.5 rounded-xl text-xs bg-slate-800/80 border border-slate-700/80 shadow-sm">
                    <span className="font-semibold text-blue-400 block mb-1">{msg.senderName}</span>
                    <span className="text-slate-200">{msg.text}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2 bg-slate-900">
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Nhắn tin 3D..." className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:border-blue-500 text-white" />
                <button type="submit" className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white shadow-md"><Send className="w-4 h-4" /></button>
              </form>
            </div>
          )}

          {activeRightTab === 'decor' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
              <div className="bg-blue-950/40 border border-blue-800/50 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-400 block">Đang chọn Bàn #{selectedDeskId || 1}</span>
                  <span className="text-[11px] text-slate-400">Thêm hoặc xóa vật phẩm thời gian thực</span>
                </div>
                <Package className="w-5 h-5 text-blue-400" />
              </div>

              {/* Danh sách vật phẩm có nút Xóa */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">Vật phẩm hiện tại trên bàn:</div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {(!deskConfigs[selectedDeskId || 1] || deskConfigs[selectedDeskId || 1].length === 0) ? (
                    <div className="text-slate-500 italic p-2 text-center bg-slate-950/40 rounded-xl border border-slate-800">Bàn đang trống</div>
                  ) : (
                    deskConfigs[selectedDeskId || 1].map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-xl">
                        <span className="font-medium text-white flex items-center gap-2">
                          <span className="text-base">{item.icon || '📦'}</span> {item.name}
                        </span>
                        <button
                          onClick={() => {
                            const targetDesk = selectedDeskId || 1;
                            const newItems = deskConfigs[targetDesk].filter(i => i.id !== item.id);
                            setDeskConfigs(prev => ({ ...prev, [targetDesk]: newItems }));
                            if (db) { try { setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'desks', String(targetDesk)), { items: newItems }, { merge: true }); } catch (e) {} }
                            sfx.play('pop');
                          }}
                          className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                          title="Xóa vật phẩm này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <hr className="border-slate-800" />

              {/* Kho đồ để thêm */}
              {Object.entries(DECOR_INVENTORY).map(([cat, items]) => (
                <div key={cat} className="space-y-2">
                  <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">{cat}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((it) => (
                      <button key={it.type} onClick={() => {
                        const targetDesk = selectedDeskId || 1;
                        const newItems = [...(deskConfigs[targetDesk] || []), { id: `item-${Date.now()}`, ...it, x: (Math.random()*0.8 - 0.4), z: (Math.random()*0.4 - 0.2) }];
                        setDeskConfigs((prev) => ({ ...prev, [targetDesk]: newItems }));
                        if (db) { try { setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'desks', String(targetDesk)), { items: newItems }, { merge: true }); } catch (e) {} }
                        sfx.play('pop');
                      }} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-blue-500 hover:bg-slate-800 flex flex-col items-center gap-1 transition">
                        <span className="text-xl">{it.icon}</span><span className="font-semibold text-[11px] text-slate-200">{it.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Popup Modal khi chọn Nhân vật khác */}
      {activeTargetTeammate && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Tương tác với {activeTargetTeammate.name}</h3>
              <button onClick={() => setActiveTargetTeammate(null)} className="p-1 rounded-full hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <button
                onClick={() => { triggerDuckEffect(); setActiveTargetTeammate(null); }}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-amber-600/20 border border-slate-700 hover:border-amber-500 text-amber-400 transition flex flex-col items-center gap-1.5"
              >
                <span className="text-xl">📄</span> Ném Cục Giấy (Vịt Xoay 3s)
              </button>
              <button
                onClick={() => { triggerFaintEffect(); setActiveTargetTeammate(null); }}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-rose-600/20 border border-slate-700 hover:border-rose-500 text-rose-400 transition flex flex-col items-center gap-1.5"
              >
                <span className="text-xl">💫</span> Gạt Chân (Ngã Xỉu 3s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}