import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Sparkles, MessageSquare, Send, BellRing, X } from 'lucide-react';

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

const appId = typeof __app_id !== 'undefined' ? __app_id : 'cherry-blossom-park-3d-v2';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const CARTOON_CHARACTERS = [
  { id: 'c1', name: 'Bé Mèo Dễ Thương', icon: '🐱', color: '#ec4899', hairColor: '#be185d' },
  { id: 'c2', name: 'Cậu Chàng Siêu Quậy', icon: '🦊', color: '#f97316', hairColor: '#c2410c' },
  { id: 'c3', name: 'Thỏ Con Tinh Nghịch', icon: '🐰', color: '#a855f7', hairColor: '#7e22ce' },
  { id: 'c4', name: 'Gấu Trúc Ngủ Gật', icon: '🐼', color: '#1e293b', hairColor: '#0f172a' },
  { id: 'c5', name: 'Khuôn Mặt Hổ Báo', icon: '🐯', color: '#eab308', hairColor: '#a16207' },
  { id: 'c6', name: 'Kỳ Lân Mộng Mơ', icon: '🦄', color: '#06b6d4', hairColor: '#0e7490' },
  { id: 'c7', name: 'Chú Cún Trung Thành', icon: '🐶', color: '#84cc16', hairColor: '#4d7c0f' },
  { id: 'c8', name: 'Khỉ Con Lém Lỉnh', icon: '🐵', color: '#b45309', hairColor: '#78350f' },
  { id: 'c9', name: 'Ếch Xanh Vui Nhộn', icon: '🐸', color: '#10b981', hairColor: '#047857' },
  { id: 'c10', name: 'Cánh Cụt Lạnh Lùng', icon: '🐧', color: '#3b82f6', hairColor: '#1d4ed8' },
  { id: 'c11', name: 'Heo Con Mũm Mĩm', icon: '🐷', color: '#f43f5e', hairColor: '#be123c' },
  { id: 'c12', name: 'Sư Tử Hùm Xám', icon: '🦁', color: '#d97706', hairColor: '#92400e' },
  { id: 'c13', name: 'Cú Đêm Thông Thái', icon: '🦉', color: '#6366f1', hairColor: '#4338ca' },
  { id: 'c14', name: 'Ong Vàng Chăm Chỉ', icon: '🐝', color: '#fbbf24', hairColor: '#b45309' },
  { id: 'c15', name: 'Bạch Tuộc Vui Vẻ', icon: '🐙', color: '#8b5cf6', hairColor: '#6d28d9' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [hasEnteredGame, setHasEnteredGame] = useState(false);
  const [selectedChar, setSelectedChar] = useState(CARTOON_CHARACTERS[0]);
  const [customName, setCustomName] = useState('Người Chơi');

  const [chatInput, setChatInput] = useState('');
  const [speechBubbles, setSpeechBubbles] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [uiToast, setUiToast] = useState(null);

  const [myEffect, setMyEffect] = useState(null);
  const [isSitting, setIsSitting] = useState(false);

  const canvasContainerRef = useRef(null);
  const playerPosRef = useRef({ x: (Math.random() - 0.5) * 4, z: (Math.random() - 0.5) * 4, targetX: 0, targetZ: 0 });
  const remoteGroupsRef = useRef({});
  const screenPositionsRef = useRef({});
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

  // Đồng bộ Firebase Realtime: Vị trí người chơi, chat và hiệu ứng chọc ghẹo
  useEffect(() => {
    if (!db || !user || !hasEnteredGame) return;

    const playersCol = collection(db, 'artifacts', appId, 'public', 'data', 'players');
    
    // Gửi heartbeat vị trí của bản thân liên tục
    const heartbeat = setInterval(() => {
      if (user && playerPosRef.current) {
        try {
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', user.uid), {
            uid: user.uid,
            name: customName,
            icon: selectedChar.icon,
            color: selectedChar.color,
            hairColor: selectedChar.hairColor,
            x: playerPosRef.current.x,
            z: playerPosRef.current.z,
            isSitting: isSitting,
            lastSeen: serverTimestamp()
          }, { merge: true });
        } catch (e) {}
      }
    }, 800);

    const unsubPlayers = onSnapshot(playersCol, (snapshot) => {
      const now = Date.now() / 1000;
      const active = [];
      snapshot.forEach((docSnap) => {
        const p = docSnap.data();
        if (p.uid === user.uid) {
          if (p.actionEffect && p.actionTime && (now - (p.actionTime?.seconds || 0) < 6)) {
            triggerLocalEffect(p.actionEffect, p.actorName || 'Ai đó');
          }
        } else if (p.uid && (now - (p.lastSeen?.seconds || now) < 20)) {
          active.push(p);
        }
      });
      setOnlinePlayers(active);
    }, (err) => console.warn("Player sync error", err));

    const chatCol = collection(db, 'artifacts', appId, 'public', 'data', 'chat');
    const unsubChat = onSnapshot(chatCol, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const msg = change.data();
          if (msg && msg.text) {
            setSpeechBubbles((prev) => [
              ...prev,
              { id: `b-${Date.now()}-${Math.random()}`, senderName: msg.senderName, text: msg.text, uid: msg.uid, timestamp: Date.now() }
            ]);
          }
        }
      });
    }, (err) => console.warn("Chat sync error", err));

    return () => {
      unsubPlayers();
      unsubChat();
      clearInterval(heartbeat);
    };
  }, [user, hasEnteredGame, customName, selectedChar, isSitting]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setSpeechBubbles((prev) => prev.filter((b) => now - b.timestamp < 5000));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const triggerLocalEffect = (effectType, actorName) => {
    setMyEffect(effectType);
    if (effectType === 'duck') {
      showToast('Bị Ném Giấy!', `${actorName} ném cục giấy trúng bạn! Vịt xoay 3 giây 🦆`);
    } else if (effectType === 'faint') {
      showToast('Bị Gạt Chân!', `${actorName} gạt chân làm bạn té nằm ngang 3 giây! 💤`);
    } else if (effectType === 'flower') {
      showToast('Nhận Được Hoa!', `${actorName} tặng bạn đóa hoa hồng thắm! 🌸`);
    } else if (effectType === 'candy') {
      showToast('Nhận Được Kẹo!', `${actorName} tặng bạn viên kẹo ngọt! 🍬`);
    }
    setTimeout(() => setMyEffect(null), 3500);
  };

  const sendActionToPlayer = async (targetUid, type, label) => {
    if (!db || !targetUid) return;
    setTargetPlayer(null);
    showToast('Đã Gửi Tương Tác!', `Bạn đã ${label} thành công!`);

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', targetUid), {
        actionEffect: type,
        actorName: customName,
        actionTime: serverTimestamp()
      }, { merge: true });
    } catch (e) {}
  };

  // --- 3D Scene Setup ---
  useEffect(() => {
    if (!threeLoaded || !hasEnteredGame || !canvasContainerRef.current) return;
    const THREE = window.THREE;
    const container = canvasContainerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1b4b);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 12, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    sunLight.position.set(15, 25, 15);
    scene.add(sunLight);

    // Sân cỏ công viên
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshBasicMaterial({ color: 0x065f46 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.userData = { isFloor: true };
    scene.add(ground);

    // Cây hoa anh đào tâm điểm
    const centerObj = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.2, 0.4, 16),
      new THREE.MeshBasicMaterial({ color: 0x475569 })
    );
    base.position.y = 0.2;
    centerObj.add(base);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.35, 3.2, 8),
      new THREE.MeshBasicMaterial({ color: 0x52271c })
    );
    trunk.position.y = 1.6;
    centerObj.add(trunk);

    for (let i = 0; i < 8; i++) {
      const sakuraLeaf = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xf472b6 })
      );
      const angle = (i * Math.PI * 2) / 8;
      sakuraLeaf.position.set(Math.cos(angle) * 0.9, 3.2 + (i % 2) * 0.4, Math.sin(angle) * 0.9);
      centerObj.add(sakuraLeaf);
    }
    scene.add(centerObj);

    // Ghế đá công viên hỗ trợ ngồi
    const createBench = (x, z, rotY) => {
      const bench = new THREE.Group();
      bench.position.set(x, 0, z);
      bench.rotation.y = rotY;

      const seatMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.6), seatMat);
      seat.position.y = 0.45;
      seat.userData = { isBench: true, benchPos: { x, z } };
      bench.add(seat);

      const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.08), seatMat);
      back.position.set(0, 0.75, -0.26);
      bench.add(back);

      [[-0.7, 0.22, -0.2], [0.7, 0.22, -0.2], [-0.7, 0.22, 0.2], [0.7, 0.22, 0.2]].forEach(([bx, by, bz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), new THREE.MeshBasicMaterial({ color: 0x1e293b }));
        leg.position.set(bx, by, bz);
        bench.add(leg);
      });
      scene.add(bench);
    };
    createBench(-6, -5, 0.5);
    createBench(6, 5, -2.5);
    createBench(-6, 5, 1.2);
    createBench(6, -5, -0.5);

    // Mô hình nhân vật 3D chi tiết có tay chân
    const createDetailedHumanMesh = (colorHex, hairHex) => {
      const grp = new THREE.Group();
      const col = parseInt(colorHex.replace('#', '0x'));
      const hairCol = parseInt(hairHex.replace('#', '0x'));

      const bodyMat = new THREE.MeshBasicMaterial({ color: col });
      const skinMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
      const pantsMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
      const hairMat = new THREE.MeshBasicMaterial({ color: hairCol });
      const shoeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.5, 0.24), bodyMat);
      torso.position.y = 0.65;
      grp.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), skinMat);
      head.position.y = 1.12;
      grp.add(head);

      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
      hair.position.y = 1.18;
      grp.add(hair);

      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      [-0.06, 0.06].forEach((ex) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeMat);
        eye.position.set(ex, 1.14, 0.16);
        grp.add(eye);
      });

      const armGeom = new THREE.CylinderGeometry(0.05, 0.04, 0.4, 8);
      const leftArm = new THREE.Mesh(armGeom, bodyMat);
      leftArm.position.set(-0.28, 0.65, 0);
      grp.add(leftArm);

      const rightArm = new THREE.Mesh(armGeom, bodyMat);
      rightArm.position.set(0.28, 0.65, 0);
      grp.add(rightArm);

      const legGeom = new THREE.CylinderGeometry(0.06, 0.05, 0.4, 8);
      const leftLeg = new THREE.Mesh(legGeom, pantsMat);
      leftLeg.position.set(-0.11, 0.22, 0);
      grp.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeom, pantsMat);
      rightLeg.position.set(0.11, 0.22, 0);
      grp.add(rightLeg);

      const shoeGeom = new THREE.BoxGeometry(0.08, 0.06, 0.14);
      const leftShoe = new THREE.Mesh(shoeGeom, shoeMat);
      leftShoe.position.set(-0.11, 0.03, 0.02);
      grp.add(leftShoe);

      const rightShoe = new THREE.Mesh(shoeGeom, shoeMat);
      rightShoe.position.set(0.11, 0.03, 0.02);
      grp.add(rightShoe);

      return grp;
    };

    const playerGroup = createDetailedHumanMesh(selectedChar.color, selectedChar.hairColor);
    playerGroup.position.set(playerPosRef.current.x, 0, playerPosRef.current.z);
    scene.add(playerGroup);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;

        if (obj.userData?.isBench) {
          setIsSitting(true);
          playerPosRef.current.targetX = obj.userData.benchPos.x;
          playerPosRef.current.targetZ = obj.userData.benchPos.z + 0.4;
          return;
        }

        if (obj.userData?.isFloor) {
          setIsSitting(false);
          const pt = intersects[i].point;
          playerPosRef.current.targetX = Math.max(-13, Math.min(13, pt.x));
          playerPosRef.current.targetZ = Math.max(-13, Math.min(13, pt.z));
          return;
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      const curr = playerPosRef.current;
      curr.x += (curr.targetX - curr.x) * 0.12;
      curr.z += (curr.targetZ - curr.z) * 0.12;
      playerGroup.position.set(curr.x, isSitting ? 0.25 : 0, curr.z);

      const remoteMap = remoteGroupsRef.current;
      const activeUids = new Set(onlinePlayers.map((p) => p.uid));

      Object.keys(remoteMap).forEach((uid) => {
        if (!activeUids.has(uid)) {
          scene.remove(remoteMap[uid]);
          delete remoteMap[uid];
        }
      });

      onlinePlayers.forEach((p) => {
        let rMesh = remoteMap[p.uid];
        if (!rMesh) {
          rMesh = createDetailedHumanMesh(p.color || '#3b82f6', p.hairColor || '#1e293b');
          scene.add(rMesh);
          remoteMap[p.uid] = rMesh;
        }
        rMesh.position.set(p.x || 0, p.isSitting ? 0.25 : 0, p.z || 0);
      });

      const newScreenPos = {};
      const allPeople = [{ uid: user?.uid, name: customName, x: curr.x, z: curr.z }, ...onlinePlayers];

      allPeople.forEach((p) => {
        if (!p.uid) return;
        const vPos = new THREE.Vector3(p.x, 2.2, p.z);
        vPos.project(camera);
        const x = (vPos.x * 0.5 + 0.5) * container.clientWidth;
        const y = (-(vPos.y * 0.5) + 0.5) * container.clientHeight;
        const visible = vPos.z < 1;
        newScreenPos[p.uid] = { x, y, visible };
      });
      screenPositionsRef.current = newScreenPos;

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
    if (!chatInput.trim() || !db || !user) return;
    const text = chatInput.trim();
    setChatInput('');

    try {
      const chatCol = collection(db, 'artifacts', appId, 'public', 'data', 'chat');
      await setDoc(doc(chatCol, `msg-${Date.now()}`), {
        uid: user.uid,
        senderName: customName,
        text: text,
        timestamp: serverTimestamp()
      });
    } catch (e) {}
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
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans m-0 p-0">
      
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

      {/* Main Layout Container (Cân đối hoàn toàn màn hình, không bị lệch lề) */}
      <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between z-10 bg-slate-900/90 shrink-0 w-full">
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

        {/* 3D Viewport */}
        <div className="flex-1 relative overflow-hidden flex flex-col w-full h-full">
          <div ref={canvasContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing relative" />

          {/* Bong bóng chat 3D bám chuẩn vị trí đầu từng người chơi */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
            {speechBubbles.map((bubble) => {
              const pos = screenPositionsRef.current[bubble.uid];
              if (!pos || !pos.visible) return null;
              return (
                <div
                  key={bubble.id}
                  className="absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200"
                  style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                >
                  <div className="bg-white text-slate-950 px-4 py-2 rounded-2xl shadow-xl border-2 border-pink-500 text-xs font-bold flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-pink-500" />
                    <span><b>{bubble.senderName}:</b> {bubble.text}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hiệu ứng trạng thái cá nhân */}
          {myEffect && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 animate-bounce text-center">
              <div className="px-6 py-4 rounded-3xl bg-slate-900/95 border-2 border-pink-500 shadow-2xl text-white space-y-1">
                <div className="text-4xl">
                  {myEffect === 'duck' && '🦆💫'}
                  {myEffect === 'faint' && '💤😵'}
                  {myEffect === 'flower' && '🌸💐'}
                  {myEffect === 'candy' && '🍬🍭'}
                </div>
                <div className="font-bold text-sm text-pink-300">
                  {myEffect === 'duck' && 'Đang bị ném giấy choáng váng!'}
                  {myEffect === 'faint' && 'Đang bị gạt chân ngã nằm ngang!'}
                  {myEffect === 'flower' && 'Nhận được hoa tươi thắm!'}
                  {myEffect === 'candy' && 'Nhận được kẹo ngọt ngào!'}
                </div>
              </div>
            </div>
          )}

          {/* Danh sách người chơi online để bấm vào chọc ghẹo */}
          <div className="absolute top-4 left-6 z-20 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-2xl shadow-xl max-w-xs space-y-2">
            <div className="text-xs font-bold text-pink-400 uppercase tracking-wider">Người chơi trong công viên:</div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-xs bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-white font-medium">
                <span>🟢 Bạn ({customName})</span>
                <span className="text-[10px] text-slate-400">{isSitting ? 'Đang ngồi ghế' : 'Đang đi dạo'}</span>
              </div>
              {onlinePlayers.map((p) => (
                <div
                  key={p.uid}
                  onClick={() => setTargetPlayer(p)}
                  className="flex items-center justify-between text-xs bg-slate-800 hover:bg-pink-600/20 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-pink-500 text-slate-200 cursor-pointer transition"
                >
                  <span className="truncate">👤 {p.name}</span>
                  <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-lg font-bold">Chọc Ghẹo</span>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Chọn Hành Động Chọc Ghẹo */}
          {targetPlayer && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">Chọc ghẹo: {targetPlayer.name}</h3>
                  <button onClick={() => setTargetPlayer(null)} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">Chọn hành động gửi trực tiếp đến người chơi này:</p>
                <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                  <button
                    onClick={() => sendActionToPlayer(targetPlayer.uid, 'duck', 'ném cục giấy choáng váng')}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-amber-600/20 border border-slate-700 hover:border-amber-500 text-amber-400 transition flex flex-col items-center gap-1"
                  >
                    <span className="text-xl">📄</span> Ném Giấy (Vịt Xoay 3s)
                  </button>
                  <button
                    onClick={() => sendActionToPlayer(targetPlayer.uid, 'faint', 'gạt chân té nằm ngang')}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-rose-600/20 border border-slate-700 hover:border-rose-500 text-rose-400 transition flex flex-col items-center gap-1"
                  >
                    <span className="text-xl">🦶</span> Gạt Chân (Té Ngang 3s)
                  </button>
                  <button
                    onClick={() => sendActionToPlayer(targetPlayer.uid, 'flower', 'tặng đóa hoa tươi')}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-pink-600/20 border border-slate-700 hover:border-pink-500 text-pink-400 transition flex flex-col items-center gap-1"
                  >
                    <span className="text-xl">🌸</span> Tặng Hoa
                  </button>
                  <button
                    onClick={() => sendActionToPlayer(targetPlayer.uid, 'candy', 'tặng viên kẹo ngọt')}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-purple-600/20 border border-slate-700 hover:border-purple-500 text-purple-400 transition flex flex-col items-center gap-1"
                  >
                    <span className="text-xl">🍬</span> Tặng Kẹo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Khung Chat Nhập Liệu */}
          <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-center">
            <form onSubmit={handleSendChat} className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 p-2 rounded-2xl shadow-xl w-full max-w-md">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập chat hiện bong bóng trên đầu 5 giây..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:border-pink-500 text-white"
              />
              <button type="submit" className="p-2.5 bg-pink-600 hover:bg-pink-500 rounded-xl text-white shadow-md transition">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}