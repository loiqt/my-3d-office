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
  User, RotateCw, Edit3, Check, Navigation, LayoutGrid, Armchair, LogOut,
  Move, Package, Sparkles
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
      osc.connect(gain);
      gain.connect(this.ctx.destination);

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
      } else if (type === 'drag') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(340, now + 0.04);
        gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.start(now); osc.stop(now + 0.04);
      } else if (type === 'place') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
        gain.gain.setValueAtTime(0.18, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now); osc.stop(now + 0.08);
      } else if (type === 'throw') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now); osc.stop(now + 0.12);
      } else if (type === 'trip') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
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
    { type: 'dual_monitors', name: 'Màn hình Kép 4K', icon: '🖥️', color: '#0f172a' },
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
    { type: 'rubber_duck', name: 'Vịt Cao Su Debug', icon: '🦆', color: '#eab308' },
    { type: 'desk_lamp', name: 'Đèn Bàn LED', icon: '💡', color: '#f59e0b' }
  ]
};

const DEFAULT_DESK_ITEMS = {
  1: [
    { id: 'item-1', type: 'dual_monitors', x: 0, z: -0.1, rotY: 0, scale: 1, color: '#0f172a' },
    { id: 'item-2', type: 'coffee_mug', x: -0.6, z: 0.2, rotY: 0, scale: 0.7, color: '#f97316' },
    { id: 'item-3', type: 'teddy_bear', x: 0.6, z: -0.2, rotY: -0.4, scale: 0.9, color: '#d97706' }
  ],
  2: [
    { id: 'item-21', type: 'laptop', x: 0, z: 0, rotY: 0, scale: 1, color: '#1e293b' },
    { id: 'item-22', type: 'succulent', x: 0.6, z: -0.2, rotY: 0, scale: 0.8, color: '#10b981' }
  ]
};

function getDefaultDesk3DPosition(id) {
  const index = id - 1;
  if (index < 8) {
    return { x: (index - 3.5) * 2.55, z: -1.4, rotY: 0 };
  } else {
    return { x: (index - 8 - 3.0) * 2.55, z: 1.4, rotY: Math.PI };
  }
}

const INITIAL_TEAMMATES = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: i === 0 ? "Bạn (Player)" : `Bàn trống #${i + 1}`,
  gender: i % 2 === 0 ? "male" : "female",
  hairStyle: "short",
  role: i === 0 ? "Product Creator" : "Thành viên nhóm",
  isUser: i === 0,
  status: "Đang online 🟢",
  emotion: "💻",
  color: ["#3B82F6", "#EC4899", "#10B981", "#8B5CF6", "#F59E0B", "#06B6D4", "#EF4444"][i % 7],
  hairColor: "#1E293B",
  skinColor: "#fde047"
}));

// Tạo Texture Bong Bóng Chat 3D
function createSpeechBubbleTexture(text, senderName) {
  const THREE = window.THREE;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Khung viền Bong bóng
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 6;

  if (ctx.roundRect) {
    ctx.roundRect(16, 16, 480, 170, 24);
  } else {
    ctx.fillRect(16, 16, 480, 170);
  }
  ctx.fill();
  ctx.stroke();

  // Mũi tên chỉ xuống đầu nhân vật
  ctx.beginPath();
  ctx.moveTo(240, 186);
  ctx.lineTo(256, 220);
  ctx.lineTo(272, 186);
  ctx.closePath();
  ctx.fillStyle = '#3b82f6';
  ctx.fill();

  // Tên người gửi
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.fillText(senderName, 36, 52);

  // Nội dung tin nhắn (xuống dòng tự động)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Inter, sans-serif';
  
  const words = text.split(' ');
  let line = '';
  let y = 92;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 420 && n > 0) {
      ctx.fillText(line, 36, y);
      line = words[n] + ' ';
      y += 36;
      if (y > 165) break;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 36, y);

  return new THREE.CanvasTexture(canvas);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [officeName] = useState('VĂN PHÒNG SÁNG TẠO SÀI GÒN');

  const [characterConfig, setCharacterConfig] = useState({
    name: 'Bạn (Player)',
    gender: 'male',
    hairStyle: 'short',
    hairColor: '#1e293b',
    skinColor: '#fde047',
    color: '#3b82f6'
  });

  const [selectedDeskId, setSelectedDeskId] = useState(null);
  const [deskConfigs, setDeskConfigs] = useState(DEFAULT_DESK_ITEMS);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [activeTargetTeammate, setActiveTargetTeammate] = useState(null);
  const [activeRightTab, setActiveRightTab] = useState('chat');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [deskLayoutPositions, setDeskLayoutPositions] = useState(() => {
    const pos = {};
    for (let i = 1; i <= 15; i++) pos[i] = getDefaultDesk3DPosition(i);
    return pos;
  });

  const [chatMessages, setChatMessages] = useState([
    { id: 'm1', senderId: 2, senderName: 'Hệ thống 3D', text: 'Chào mừng các bạn đến với Văn phòng 3D!', time: '10:00 AM', timestamp: { seconds: Date.now() / 1000 } }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [threeLoaded, setThreeLoaded] = useState(false);

  const canvasContainerRef = useRef(null);
  const playerPosRef = useRef({ x: -3.5 * 2.55, z: 3.2, targetX: -3.5 * 2.55, targetZ: 3.2 });
  const desk3DMeshMapRef = useRef({});
  const activeBubblesRef = useRef({}); // Lưu trữ Bong bóng chat 3D đang hiển thị

  const deskLayoutPositionsRef = useRef(deskLayoutPositions);
  deskLayoutPositionsRef.current = deskLayoutPositions;

  const deskConfigsRef = useRef(deskConfigs);
  deskConfigsRef.current = deskConfigs;

  const isLayoutModeRef = useRef(isLayoutMode);
  isLayoutModeRef.current = isLayoutMode;

  const selectedDeskIdRef = useRef(selectedDeskId);
  selectedDeskIdRef.current = selectedDeskId;

  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;

  // 1. Tải Onboarding đã lưu
  useEffect(() => {
    const saved = localStorage.getItem('user_3d_avatar');
    if (saved) {
      try {
        setCharacterConfig(JSON.parse(saved));
        setHasOnboarded(true);
      } catch (e) {}
    }
  }, []);

  // 2. Nạp thư viện Three.js
  useEffect(() => {
    if (window.THREE) { setThreeLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = () => setThreeLoaded(true);
    document.head.appendChild(script);
  }, []);

  // 3. Đăng nhập Firebase
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {}
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // 4. Đồng bộ vị trí Bàn & Người chơi & Tin nhắn Chat từ Firestore
  useEffect(() => {
    if (!db || !user) return;

    const desksCol = collection(db, 'artifacts', appId, 'public', 'data', 'desks');
    const unsubDesks = onSnapshot(desksCol, (snapshot) => {
      const loadedDesks = { ...DEFAULT_DESK_ITEMS };
      const loadedPositions = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const deskId = docSnap.id;
        if (data.items) loadedDesks[deskId] = data.items;
        if (data.position) loadedPositions[deskId] = data.position;
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
        if (p.uid && p.uid !== user.uid) {
          if (now - (p.lastSeen?.seconds || now) < 15) active.push(p);
        }
      });
      setOnlinePlayers(active);
    });

    return () => {
      unsubDesks();
      unsubChat();
      unsubPlayers();
    };
  }, [user]);

  // Gán bàn thực tế cho người chơi online & tự động bỏ NPC trùng
  const teammates = useMemo(() => {
    const list = [...INITIAL_TEAMMATES];
    list[0] = {
      ...list[0],
      name: characterConfig.name || 'Bạn (Player)',
      color: characterConfig.color || '#3b82f6',
      isUser: true
    };
    onlinePlayers.forEach((p, idx) => {
      const deskIdx = idx + 1;
      if (deskIdx < list.length) {
        list[deskIdx] = {
          id: deskIdx + 1,
          uid: p.uid,
          name: p.name || `Bạn bè #${deskIdx + 1}`,
          color: p.color || '#ec4899',
          isUser: false,
          isRealPlayer: true,
          role: 'Người chơi Online 🌐'
        };
      }
    });
    return list;
  }, [characterConfig, onlinePlayers]);

  const teammatesRef = useRef(teammates);
  teammatesRef.current = teammates;
  const onlinePlayersRef = useRef(onlinePlayers);
  onlinePlayersRef.current = onlinePlayers;

  // 5. Khởi tạo 3D Canvas Engine
  useEffect(() => {
    if (!threeLoaded || !canvasContainerRef.current) return;
    const THREE = window.THREE;
    const container = canvasContainerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff7ed, 1.1));
    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    sunLight.position.set(-20, 30, 22);
    scene.add(sunLight);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 30),
      new THREE.MeshStandardMaterial({ color: 0x241d17, roughness: 0.4 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.userData = { isFloorPlane: true };
    scene.add(floor);

    // Wall
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(44, 11, 0.4), wallMat);
    backWall.position.set(0, 5.5, -14);
    scene.add(backWall);

    // Signboard
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 256;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 0, 1024, 256);
    sCtx.strokeStyle = '#d4a373';
    sCtx.lineWidth = 12;
    sCtx.strokeRect(16, 16, 992, 224);
    sCtx.fillStyle = '#fef08a';
    sCtx.font = 'bold 44px Georgia, serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText(`🏛️ ${officeName.toUpperCase()}`, 512, 128);
    const signTexture = new THREE.CanvasTexture(signCanvas);
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.75), new THREE.MeshBasicMaterial({ map: signTexture, transparent: true }));
    signMesh.position.set(0, 4.8, -13.68);
    scene.add(signMesh);

    // Plants
    const createPlantMesh = (x, z) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(x, 0, z);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      pot.position.y = 0.4;
      pGroup.add(pot);
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
        leaf.position.set((Math.random() - 0.5) * 0.3, 0.9 + i * 0.25, (Math.random() - 0.5) * 0.3);
        pGroup.add(leaf);
      }
      scene.add(pGroup);
    };
    createPlantMesh(-20, -12);
    createPlantMesh(20, -12);
    createPlantMesh(-20, 12);
    createPlantMesh(20, 12);

    const desksGroup = new THREE.Group();
    scene.add(desksGroup);
    const remotePlayersGroup = new THREE.Group();
    scene.add(remotePlayersGroup);

    function createHumanMesh(tm, isPlayer = false) {
      const group = new THREE.Group();
      const col = tm.color ? parseInt(tm.color.replace('#', '0x')) : 0x3b82f6;
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047 });
      const clothMat = new THREE.MeshStandardMaterial({ color: col });

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.24), clothMat);
      torso.position.y = 0.72;
      group.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), skinMat);
      head.position.y = 1.1;
      group.add(head);

      if (!isPlayer) {
        group.position.set(0, 0, 0.75);
        group.position.y = 0.15;
      }
      group.userData = { teammateId: tm.id || tm.uid, isAvatarObject: true, name: tm.name };
      return group;
    }

    // Render 15 Desks & Nametags
    teammatesRef.current.forEach((tm) => {
      const pos = deskLayoutPositionsRef.current[tm.id] || getDefaultDesk3DPosition(tm.id);
      const deskGroup = new THREE.Group();
      deskGroup.position.set(pos.x, 0, pos.z);
      deskGroup.rotation.y = pos.rotY;
      deskGroup.userData = { deskId: tm.id, isDeskUnit: true, name: tm.name };
      desk3DMeshMapRef.current[tm.id] = deskGroup;

      const table = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.08, 1.3),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
      );
      table.position.y = 0.71;
      deskGroup.add(table);

      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.65), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      chair.position.set(0, 0.45, 0.8);
      chair.userData = { isChair: true, deskId: tm.id };
      deskGroup.add(chair);

      // Render Nametag Sprite
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

      if (!tm.isUser && !tm.isRealPlayer) {
        const npcMesh = createHumanMesh(tm, false);
        deskGroup.add(npcMesh);
      }

      desksGroup.add(deskGroup);
    });

    // Player Mesh
    const playerGroup = new THREE.Group();
    playerGroup.position.set(playerPosRef.current.x, 0, playerPosRef.current.z);
    const playerMesh = createHumanMesh(teammatesRef.current[0], true);
    playerGroup.add(playerMesh);
    scene.add(playerGroup);

    let camAngleX = 0, camAngleY = 0.5, camDist = 24;
    let isMouseDown = false, prevMousePos = { x: 0, y: 0 };
    let isDraggingEntireDesk = false;
    let activeDraggedDeskId = null;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getRaycastIntersects = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
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
                setActiveTargetTeammate(found);
                sfx.play('click');
                return;
              }
            }
            if (obj.userData?.isDeskUnit && !clickedDeskId) {
              clickedDeskId = obj.userData.deskId;
            }
            obj = obj.parent;
          }

          if (isLayoutModeRef.current && clickedDeskId) {
            isDraggingEntireDesk = true;
            activeDraggedDeskId = clickedDeskId;
            sfx.play('drag');
            return;
          }

          if (clickedDeskId) {
            setSelectedDeskId(clickedDeskId);
            sfx.play('click');
            return;
          }

          if (intersects[i].object.userData?.isFloorPlane && !isLayoutModeRef.current) {
            playerPosRef.current.targetX = intersects[i].point.x;
            playerPosRef.current.targetZ = intersects[i].point.z;
            sfx.play('step');
          }
        }
      }
      isMouseDown = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
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
              [activeDraggedDeskId]: { ...(prev[activeDraggedDeskId] || {}), x: newX, z: newZ }
            }));
            break;
          }
        }
        return;
      }

      if (isMouseDown) {
        camAngleX -= (e.clientX - prevMousePos.x) * 0.005;
        camAngleY = Math.max(0.2, Math.min(1.2, camAngleY + (e.clientY - prevMousePos.y) * 0.005));
      }
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      if (isDraggingEntireDesk && activeDraggedDeskId) {
        sfx.play('place');
        const pos = deskLayoutPositionsRef.current[activeDraggedDeskId];
        if (db && pos) {
          try {
            const deskDoc = doc(db, 'artifacts', appId, 'public', 'data', 'desks', String(activeDraggedDeskId));
            setDoc(deskDoc, {
              position: { x: pos.x, z: pos.z, rotY: pos.rotY || 0 }
            }, { merge: true });
          } catch (err) {}
        }
      }
      isDraggingEntireDesk = false;
      activeDraggedDeskId = null;
      isMouseDown = false;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const remoteMeshMap = {};

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const nowSec = Date.now() / 1000;
      const curr = playerPosRef.current;
      curr.x += (curr.targetX - curr.x) * 0.12;
      curr.z += (curr.targetZ - curr.z) * 0.12;
      playerGroup.position.set(curr.x, 0, curr.z);

      if (user && db && (Math.abs(curr.targetX - curr.x) > 0.05 || Math.abs(curr.targetZ - curr.z) > 0.05)) {
        try {
          const pDoc = doc(db, 'artifacts', appId, 'public', 'data', 'players', user.uid);
          setDoc(pDoc, {
            uid: user.uid,
            name: characterConfig.name,
            x: curr.x,
            z: curr.z,
            color: characterConfig.color,
            lastSeen: serverTimestamp()
          }, { merge: true });
        } catch (e) {}
      }

      onlinePlayersRef.current.forEach((rp) => {
        let rMesh = remoteMeshMap[rp.uid];
        if (!rMesh) {
          rMesh = createHumanMesh({ id: rp.uid, name: rp.name, color: rp.color || '#ec4899' }, true);
          remotePlayersGroup.add(rMesh);
          remoteMeshMap[rp.uid] = rMesh;
        }
        rMesh.position.set(rp.x || 0, 0, rp.z || 0);
      });

      // --- CẬP NHẬT / HIỂN THỊ BONG BÓNG CHAT 3D NỔI TRÊN ĐẦU ---
      const recentMsgs = chatMessagesRef.current;
      const latestSenderMsgs = {};
      recentMsgs.forEach((m) => {
        const mTime = m.createdAt || m.timestamp?.seconds || (Date.now() / 1000);
        if (nowSec - mTime < 6) { // Bong bóng hiển thị trong 6 giây
          latestSenderMsgs[m.senderName] = m;
        }
      });

      // Xóa các bong bóng hết hạn
      Object.keys(activeBubblesRef.current).forEach((senderKey) => {
        if (!latestSenderMsgs[senderKey]) {
          const bubbleObj = activeBubblesRef.current[senderKey];
          if (bubbleObj && bubbleObj.parent) {
            bubbleObj.parent.remove(bubbleObj);
          }
          delete activeBubblesRef.current[senderKey];
        }
      });

      // Tạo/gán bong bóng thoại 3D lên đầu nhân vật
      Object.entries(latestSenderMsgs).forEach(([senderName, msg]) => {
        let targetMesh = null;
        if (senderName === characterConfig.name) {
          targetMesh = playerGroup;
        } else {
          // Tìm trong danh sách online
          const foundOnline = onlinePlayersRef.current.find((p) => p.name === senderName);
          if (foundOnline && remoteMeshMap[foundOnline.uid]) {
            targetMesh = remoteMeshMap[foundOnline.uid];
          } else {
            // Tìm bàn được gán tên người chơi
            const foundTeammate = teammatesRef.current.find((t) => t.name === senderName);
            if (foundTeammate && desk3DMeshMapRef.current[foundTeammate.id]) {
              targetMesh = desk3DMeshMapRef.current[foundTeammate.id];
            }
          }
        }

        if (targetMesh) {
          let bubbleSprite = activeBubblesRef.current[senderName];
          if (!bubbleSprite || bubbleSprite.userData?.text !== msg.text) {
            if (bubbleSprite && bubbleSprite.parent) bubbleSprite.parent.remove(bubbleSprite);
            const texture = createSpeechBubbleTexture(msg.text, senderName);
            bubbleSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
            bubbleSprite.scale.set(3.2, 1.6, 1);
            bubbleSprite.position.set(0, targetMesh.userData?.isDeskUnit ? 3.3 : 2.1, 0);
            bubbleSprite.userData = { text: msg.text };
            targetMesh.add(bubbleSprite);
            activeBubblesRef.current[senderName] = bubbleSprite;
          }
        }
      });

      camera.position.set(
        camDist * Math.sin(camAngleX) * Math.cos(camAngleY),
        camDist * Math.sin(camAngleY),
        camDist * Math.cos(camAngleX) * Math.cos(camAngleY)
      );
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [threeLoaded]);

  const handleCompleteOnboarding = (e) => {
    e.preventDefault();
    if (!characterConfig.name.trim()) return;
    localStorage.setItem('user_3d_avatar', JSON.stringify(characterConfig));
    setHasOnboarded(true);
    sfx.play('pop');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const currentSec = Date.now() / 1000;
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: user ? user.uid : 'local',
      senderName: characterConfig.name,
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: currentSec
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    sfx.play('pop');

    if (db) {
      try {
        const chatCol = collection(db, 'artifacts', appId, 'public', 'data', 'chat');
        setDoc(doc(chatCol, newMsg.id), { ...newMsg, timestamp: serverTimestamp() });
      } catch (err) {}
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100">
      
      {/* ONBOARDING MODAL */}
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
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between z-10 bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-amber-400 font-serif text-base leading-tight">🏛️ {officeName}</h1>
            <p className="text-[11px] text-slate-400">Bong bóng Chat 3D hiển thị thời gian thực nổi trên đầu avatar</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLayoutMode(!isLayoutMode)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              isLayoutMode ? 'bg-amber-600 border-amber-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Move className="w-3.5 h-3.5" /> {isLayoutMode ? 'Đang Sắp Xếp Bàn (Kéo 3D)' : '🛠️ Sắp Xếp Bàn'}
          </button>
          <button
            onClick={() => { setIsEditingProfile(true); sfx.play('click'); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition text-xs font-semibold"
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: characterConfig.color }}>
              {characterConfig.name.substring(0, 1).toUpperCase()}
            </div>
            <span>{characterConfig.name}</span>
          </button>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 bg-slate-800 border border-slate-700 rounded-xl">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative bg-slate-950 overflow-hidden">
          <div ref={canvasContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing relative" />

          {/* Controls HUD */}
          <div className="absolute top-4 left-6 bg-slate-900/85 backdrop-blur border border-slate-800 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-4 shadow-xl z-20 text-slate-300">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">L-Click</span> Di chuyển / Tương tác
            </div>
            <div className="h-4 w-[1px] bg-slate-700" />
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              🟢 Live: {onlinePlayers.length + 1} người chơi online
            </div>
          </div>

          {/* Quick Desk Navigation */}
          <div className="absolute bottom-6 left-6 right-84 flex items-center gap-2 overflow-x-auto p-2 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl z-10 shadow-2xl">
            <span className="text-xs font-semibold px-3 text-slate-400 uppercase tracking-wider">
              Bàn:
            </span>
            {teammates.map((tm) => (
              <button
                key={tm.id}
                onClick={() => { sfx.play('click'); setSelectedDeskId(tm.id); }}
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
              onClick={() => setActiveRightTab('decor')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                activeRightTab === 'decor' ? 'border-blue-500 text-blue-400 bg-slate-800/40' : 'border-transparent text-slate-400'
              }`}
            >
              <Package className="w-4 h-4" /> Trang trí Bàn (#{selectedDeskId || 1})
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
                  placeholder="Nhắn tin (Hiện bong bóng 3D)..."
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

          {activeRightTab === 'decor' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="font-bold text-slate-300">Vật phẩm trang trí Bàn #{selectedDeskId || 1}:</div>
              {Object.entries(DECOR_INVENTORY).map(([cat, items]) => (
                <div key={cat} className="space-y-2">
                  <div className="font-semibold text-slate-400 uppercase text-[10px]">{cat}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((it) => (
                      <button
                        key={it.type}
                        onClick={() => {
                          const targetDesk = selectedDeskId || 1;
                          const newItems = [...(deskConfigs[targetDesk] || []), { id: `item-${Date.now()}`, ...it }];
                          setDeskConfigs((prev) => ({ ...prev, [targetDesk]: newItems }));
                          if (db) {
                            try {
                              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'desks', String(targetDesk)), { items: newItems }, { merge: true });
                            } catch (e) {}
                          }
                          sfx.play('pop');
                        }}
                        className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500 flex flex-col items-center gap-1 transition"
                      >
                        <span className="text-xl">{it.icon}</span>
                        <span className="font-semibold text-[11px]">{it.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Popup Modal khi chọn Nhân vật */}
      {activeTargetTeammate && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">{activeTargetTeammate.name}</h3>
              <button onClick={() => setActiveTargetTeammate(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <button
                onClick={() => { sfx.play('throw'); alert(`Bạn đã ném giấy vào ${activeTargetTeammate.name}! 📄`); setActiveTargetTeammate(null); }}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 transition"
              >
                📄 Ném Cục Giấy
              </button>
              <button
                onClick={() => { sfx.play('trip'); alert(`Bạn đã gạt chân ${activeTargetTeammate.name}! 🦶`); setActiveTargetTeammate(null); }}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-400 transition"
              >
                🦶 Gạt Chân Té
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
                <User className="w-5 h-5 text-blue-500" /> Cập Nhật Thông Tin Nhân Vật
              </h3>
              <button onClick={() => setIsEditingProfile(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tên hiển thị:</label>
                <input
                  type="text"
                  value={characterConfig.name}
                  onChange={(e) => {
                    const nextCfg = { ...characterConfig, name: e.target.value };
                    setCharacterConfig(nextCfg);
                    localStorage.setItem('user_3d_avatar', JSON.stringify(nextCfg));
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
                        const nextCfg = { ...characterConfig, color: c };
                        setCharacterConfig(nextCfg);
                        localStorage.setItem('user_3d_avatar', JSON.stringify(nextCfg));
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