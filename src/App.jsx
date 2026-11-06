import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Sparkles, MessageSquare, Send, BellRing } from 'lucide-react';

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

const appId = typeof __app_id !== 'undefined' ? __app_id : 'cherry-blossom-park-3d';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Bối cảnh cố định: Công Viên Hoa Anh Đào
const SAKURA_THEME = {
  name: 'Công Viên Hoa Anh Đào (Sakura Dream)',
  bgColor: '#1e1b4b',
  groundColor: '#065f46',
  skyColor: '#312e81',
  accentColor: '#ec4899',
  icon: '🌸'
};

const CARTOON_CHARACTERS = [
  { id: 'c1', name: 'Bé Mèo Dễ Thương', icon: '🐱', color: '#ec4899' },
  { id: 'c2', name: 'Cậu Chàng Siêu Quậy', icon: '🦊', color: '#f97316' },
  { id: 'c3', name: 'Thỏ Con Tinh Nghịch', icon: '🐰', color: '#a855f7' },
  { id: 'c4', name: 'Gấu Trúc Ngủ Gật', icon: '🐼', color: '#1e293b' },
  { id: 'c5', name: 'Khuôn Mặt Hổ Báo', icon: '🐯', color: '#eab308' },
  { id: 'c6', name: 'Kỳ Lân Mộng Mơ', icon: '🦄', color: '#06b6d4' },
  { id: 'c7', name: 'Chú Cún Trung Thành', icon: '🐶', color: '#84cc16' },
  { id: 'c8', name: 'Khỉ Con Lém Lỉnh', icon: '🐵', color: '#b45309' },
  { id: 'c9', name: 'Ếch Xanh Vui Nhộn', icon: '🐸', color: '#10b981' },
  { id: 'c10', name: 'Cánh Cụt Lạnh Lùng', icon: '🐧', color: '#3b82f6' },
  { id: 'c11', name: 'Heo Con Mũm Mĩm', icon: '🐷', color: '#f43f5e' },
  { id: 'c12', name: 'Sư Tử Hùm Xám', icon: '🦁', color: '#d97706' },
  { id: 'c13', name: 'Cú Đêm Thông Thái', icon: '🦉', color: '#6366f1' },
  { id: 'c14', name: 'Ong Vàng Chăm Chỉ', icon: '🐝', color: '#fbbf24' },
  { id: 'c15', name: 'Bạch Tuộc Vui Vẻ', icon: '🐙', color: '#8b5cf6' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [hasEnteredGame, setHasEnteredGame] = useState(false);
  const [selectedChar, setSelectedChar] = useState(CARTOON_CHARACTERS[0]);
  const [customName, setCustomName] = useState('Bạn (Player)');

  // Trò chuyện & Tương tác
  const [chatInput, setChatInput] = useState('');
  const [activeBubble, setActiveBubble] = useState(null); // { text, senderName }
  const [statusEffect, setStatusEffect] = useState(null); // { type, text }
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [uiToast, setUiToast] = useState(null);

  const canvasContainerRef = useRef(null);
  const playerPosRef = useRef({ x: 0, z: 0, targetX: 0, targetZ: 0 });
  const playerGroupRef = useRef(null);
  const [threeLoaded, setThreeLoaded] = useState(false);

  const showToast = (title, desc) => {
    setUiToast({ title, desc });
    setTimeout(() => setUiToast(null), 3500);
  };

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
      try { await signInAnonymously(auth); } catch (e) {}
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // Firebase Realtime Sync: Đồng bộ Vị trí, Chat & Tương tác chọc ghẹo
  useEffect(() => {
    if (!db || !user || !hasEnteredGame) return;

    const playersCol = collection(db, 'artifacts', appId, 'public', 'data', 'players');
    const unsubPlayers = onSnapshot(playersCol, (snapshot) => {
      const now = Date.now() / 1000;
      const active = [];
      snapshot.forEach((docSnap) => {
        const p = docSnap.data();
        if (p.uid === user.uid && p.actionEffect && (now - (p.actionTime?.seconds || 0) < 4)) {
          triggerLocalEffect(p.actionEffect, p.actorName || 'Ai đó');
        }
        if (p.uid && p.uid !== user.uid && (now - (p.lastSeen?.seconds || now) < 15)) {
          active.push(p);
        }
      });
      setOnlinePlayers(active);
    });

    const chatCol = collection(db, 'artifacts', appId, 'public', 'data', 'chat');
    const unsubChat = onSnapshot(chatCol, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const msg = change.data();
          if (msg && msg.text) {
            setActiveBubble({ text: String(msg.text), senderName: String(msg.senderName || 'Ẩn danh') });
            setTimeout(() => setActiveBubble(null), 5000);
          }
        }
      });
    });

    const heartbeat = setInterval(() => {
      if (user && playerPosRef.current) {
        try {
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', user.uid), {
            uid: user.uid,
            name: customName,
            icon: selectedChar.icon,
            color: selectedChar.color,
            x: playerPosRef.current.x,
            z: playerPosRef.current.z,
            lastSeen: serverTimestamp()
          }, { merge: true });
        } catch (e) {}
      }
    }, 1200);

    return () => {
      unsubPlayers();
      unsubChat();
      clearInterval(heartbeat);
    };
  }, [user, hasEnteredGame, customName, selectedChar]);

  const triggerLocalEffect = (effectType, actorName) => {
    if (effectType === 'duck') {
      showToast('Bị Ném Giấy!', `${actorName} ném cục giấy vào bạn! Vịt xoay 3 giây 🦆`);
    } else if (effectType === 'faint') {
      showToast('Bị Ngáng Chân!', `${actorName} gạt chân làm bạn té xỉu 3 giây! 💤`);
    } else if (effectType === 'flower') {
      showToast('Nhận Được Hoa!', `${actorName} tặng bạn đóa hoa hồng thắm! 🌸`);
    } else if (effectType === 'candy') {
      showToast('Nhận Được Kẹo!', `${actorName} tặng bạn viên kẹo ngọt! 🍬`);
    }
  };

  // --- 3D Scene Setup ---
  useEffect(() => {
    if (!threeLoaded || !hasEnteredGame || !canvasContainerRef.current) return;
    const THREE = window.THREE;
    const container = canvasContainerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SAKURA_THEME.skyColor);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 7, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.2);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshBasicMaterial({ color: SAKURA_THEME.groundColor })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.userData = { isFloor: true };
    scene.add(ground);

    const centerObj = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.8, 0.4, 16),
      new THREE.MeshBasicMaterial({ color: 0x475569 })
    );
    base.position.y = 0.2;
    centerObj.add(base);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 2.5, 8),
      new THREE.MeshBasicMaterial({ color: 0x52271c })
    );
    trunk.position.y = 1.25;
    centerObj.add(trunk);

    for (let i = 0; i < 6; i++) {
      const sakuraLeaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xf472b6 })
      );
      const angle = (i * Math.PI * 2) / 6;
      sakuraLeaf.position.set(Math.cos(angle) * 0.5, 2.5 + (i % 2) * 0.3, Math.sin(angle) * 0.5);
      centerObj.add(sakuraLeaf);
    }
    scene.add(centerObj);

    const createHumanMesh = (iconText, colorHex) => {
      const grp = new THREE.Group();
      const col = parseInt(colorHex.replace('#', '0x'));

      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.45, 0.22),
        new THREE.MeshBasicMaterial({ color: col })
      );
      torso.position.y = 0.5;
      grp.add(torso);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xfde047 })
      );
      head.position.y = 0.95;
      grp.add(head);

      return grp;
    };

    const playerGroup = createHumanMesh(selectedChar.icon, selectedChar.color);
    playerGroup.position.set(playerPosRef.current.x, 0, playerPosRef.current.z);
    scene.add(playerGroup);
    playerGroupRef.current = playerGroup;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.userData?.isFloor) {
          playerPosRef.current.targetX = Math.max(-5.5, Math.min(5.5, intersects[i].point.x));
          playerPosRef.current.targetZ = Math.max(-5.5, Math.min(5.5, intersects[i].point.z));
          break;
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    const remoteGroups = {};
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const curr = playerPosRef.current;
      curr.x += (curr.targetX - curr.x) * 0.12;
      curr.z += (curr.targetZ - curr.z) * 0.12;
      playerGroup.position.set(curr.x, 0, curr.z);

      onlinePlayers.forEach((p) => {
        let rMesh = remoteGroups[p.uid];
        if (!rMesh) {
          rMesh = createHumanMesh(p.icon || '🐱', p.color || '#3b82f6');
          scene.add(rMesh);
          remoteGroups[p.uid] = rMesh;
        }
        rMesh.position.set(p.x || 0, 0, p.z || 0);
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [threeLoaded, hasEnteredGame, selectedChar, onlinePlayers]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !db) return;
    const text = chatInput.trim();
    setChatInput('');

    try {
      const chatCol = collection(db, 'artifacts', appId, 'public', 'data', 'chat');
      await setDoc(doc(chatCol, `msg-${Date.now()}`), {
        senderName: customName,
        text: text,
        timestamp: serverTimestamp()
      });
    } catch (e) {}
  };

  const sendAction = async (type, label) => {
    setStatusEffect({ type, text: label });
    setTimeout(() => setStatusEffect(null), 3000);

    if (db && onlinePlayers.length > 0) {
      onlinePlayers.forEach(async (p) => {
        try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', p.uid), {
            actionEffect: type,
            actorName: customName,
            actionTime: serverTimestamp()
          }, { merge: true });
        } catch (e) {}
      });
    }
  };

  if (!hasEnteredGame) {
    return (
      <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 p-6 items-center justify-center font-sans overflow-y-auto">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-pink-600/20 text-pink-400 rounded-2xl border border-pink-500/30 mb-1">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">🌸 Công Viên Hoa Anh Đào 3D</h1>
            <p className="text-xs text-slate-400">Chọn nhân vật hoạt hình và tên của bạn để tham gia vào công viên ngay!</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-pink-400 uppercase tracking-wider">Chọn Nhân Vật Hoạt Hình</label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-56 overflow-y-auto pr-1">
              {CARTOON_CHARACTERS.map((char) => (
                <div
                  key={char.id}
                  onClick={() => setSelectedChar(char)}
                  className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${
                    selectedChar?.id === char.id
                      ? 'bg-slate-800 border-pink-500 shadow-lg shadow-pink-500/20 scale-102'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-2xl p-2 rounded-xl bg-slate-800">{char.icon}</div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-xs text-white truncate">{char.name}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Tên hiển thị của bạn:</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Nhập tên của bạn..."
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          <button
            onClick={() => setHasEnteredGame(true)}
            className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-2xl shadow-xl transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Vào Công Viên Hoa Anh Đào Ngay ({selectedChar.icon} {customName})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {uiToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-5 py-3 rounded-2xl shadow-2xl border-2 bg-slate-900 text-white flex items-center gap-3 border-pink-500 shadow-pink-500/20">
            <BellRing className="w-5 h-5 text-pink-400" />
            <div>
              <h4 className="font-bold text-sm text-pink-400">Tương Tác Công Viên</h4>
              <p className="text-xs text-slate-300 font-medium">{String(uiToast.desc)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between z-10 bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-600 rounded-xl text-white shadow-md"><Sparkles className="w-5 h-5" /></div>
          <div>
            <h1 className="font-bold text-pink-400 text-base">🌸 Công Viên Hoa Anh Đào (50m2)</h1>
            <p className="text-[11px] text-slate-400">Đang online: {onlinePlayers.length + 1} người chơi</p>
          </div>
        </div>
        <button
          onClick={() => setHasEnteredGame(false)}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold rounded-xl text-slate-300 transition"
        >
          Đổi Nhân Vật
        </button>
      </header>

      {/* Main 3D Viewport */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <div ref={canvasContainerRef} className="w-full flex-1 cursor-grab active:cursor-grabbing relative" />

        {/* Bong bóng chat 3D trên đầu (5 giây) */}
        {activeBubble && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-12 z-30 animate-bounce">
            <div className="bg-white text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border-2 border-pink-500 text-xs font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-pink-500" />
              <span><b>{String(activeBubble.senderName)}:</b> {String(activeBubble.text)}</span>
            </div>
          </div>
        )}

        {/* Hiệu ứng trạng thái */}
        {statusEffect && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 animate-pulse text-center">
            <div className="px-6 py-4 rounded-3xl bg-slate-900/90 border-2 border-pink-400 shadow-2xl text-white space-y-1">
              <div className="text-3xl">
                {statusEffect.type === 'duck' && '🦆💫'}
                {statusEffect.type === 'faint' && '💤😵'}
                {statusEffect.type === 'flower' && '🌸💐'}
                {statusEffect.type === 'candy' && '🍬🍭'}
              </div>
              <div className="font-bold text-sm text-pink-300">{String(statusEffect.text)}</div>
            </div>
          </div>
        )}

        {/* Menu Tương Tác & Chat */}
        <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 p-2 rounded-2xl shadow-xl overflow-x-auto max-w-full">
            <button
              onClick={() => sendAction('duck', 'Ném cục giấy trúng đồng đội! Vịt xoay 3 giây 🦆')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-amber-600/20 border border-slate-700 hover:border-amber-500 text-amber-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>📄</span> Ném Cục Giấy (Choáng 3s)
            </button>
            <button
              onClick={() => sendAction('faint', 'Gạt chân đồng đội té xỉu dưới sàn 3 giây! 💫')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-rose-600/20 border border-slate-700 hover:border-rose-500 text-rose-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>🦶</span> Gạt Chân (Xỉu 3s)
            </button>
            <button
              onClick={() => sendAction('flower', 'Tặng đồng đội đóa hoa tươi thắm! 🌸')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-pink-600/20 border border-slate-700 hover:border-pink-500 text-pink-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>🌸</span> Tặng Hoa
            </button>
            <button
              onClick={() => sendAction('candy', 'Tặng đồng đội viên kẹo ngọt ngào! 🍬')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-purple-600/20 border border-slate-700 hover:border-purple-500 text-purple-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>🍬</span> Tặng Kẹo
            </button>
          </div>

          <form onSubmit={handleSendChat} className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 p-2 rounded-2xl shadow-xl w-full md:w-96">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập chat hiển thị bong bóng 5s..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:border-pink-500 text-white"
            />
            <button type="submit" className="p-2.5 bg-pink-600 hover:bg-pink-500 rounded-xl text-white shadow-md transition">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}