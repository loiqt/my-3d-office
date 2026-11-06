import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Send, X, Users, Smile, MessageSquare } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyBzBLcsQIg8reDq6tpvs9FnLgSaxicOfY0",
  authDomain: "my-3d-office-game.firebaseapp.com",
  projectId: "my-3d-office-game",
  storageBucket: "my-3d-office-game.firebasestorage.app",
  messagingSenderId: "723982123363",
  appId: "1:723982123363:web:6c27264a5d926b08f29356"
};

const appId = 'cherry-park-3d';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Tạo Texture Bong Bóng Chat 3D
function createBubbleTexture(text, name, color) {
  const THREE = window.THREE;
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = color || '#ec4899';
  ctx.lineWidth = 6;
  
  if (ctx.roundRect) ctx.roundRect(10, 10, 492, 180, 24);
  else ctx.fillRect(10, 10, 492, 180);
  ctx.fill(); ctx.stroke();

  // Đuôi bong bóng
  ctx.beginPath();
  ctx.moveTo(236, 190); ctx.lineTo(256, 230); ctx.lineTo(276, 190);
  ctx.closePath();
  ctx.fillStyle = color || '#ec4899';
  ctx.fill();

  // Tên
  ctx.fillStyle = color || '#f472b6';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(name, 30, 50);

  // Nội dung chat
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  const words = text.split(' ');
  let line = '', y = 95;
  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > 430 && n > 0) {
      ctx.fillText(line, 30, y);
      line = words[n] + ' ';
      y += 38;
      if (y > 170) break;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 30, y);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('park_player_name') || 'Người chơi ' + Math.floor(Math.random() * 899 + 100));
  const [chatText, setChatText] = useState('');
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const canvasRef = useRef(null);
  const threeLoadedRef = useRef(false);
  const [threeReady, setThreeReady] = useState(false);

  const myPosRef = useRef({ x: 0, z: 2, targetX: 0, targetZ: 2, isSitting: false });
  const remotePlayersMapRef = useRef({});
  const sceneRef = useRef(null);

  // 1. Tải thư viện Three.js
  useEffect(() => {
    if (window.THREE) {
      setThreeReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = () => setThreeReady(true);
    document.head.appendChild(script);
  }, []);

  // 2. Khởi tạo Auth
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return auth.onAuthStateChanged((u) => setUser(u));
  }, []);

  // 3. Khởi tạo Three.js Scene (Đúng 1 lần duy nhất)
  useEffect(() => {
    if (!threeReady || !canvasRef.current || threeLoadedRef.current) return;
    threeLoadedRef.current = true;
    const THREE = window.THREE;
    const container = canvasRef.current;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.025);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 12, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Ánh sáng
    scene.add(new THREE.AmbientLight(0xfff0f5, 1.2));
    const sun = new THREE.DirectionalLight(0xffb6c1, 1.0);
    sun.position.set(10, 20, 10);
    scene.add(sun);

    // Sàn công viên (Cỏ)
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0x15803d }));
    grass.rotation.x = -Math.PI / 2;
    grass.userData = { isFloor: true };
    scene.add(grass);

    // Cây Hoa Anh Đào ở giữa
    const treeGroup = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 3), new THREE.MeshBasicMaterial({ color: 0x78350f }));
    trunk.position.y = 1.5;
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 12), new THREE.MeshBasicMaterial({ color: 0xf472b6 }));
    foliage.position.y = 3.8;
    treeGroup.add(trunk, foliage);
    scene.add(treeGroup);

    // Ghế đá công viên
    const benchesGroup = new THREE.Group();
    const benchPositions = [
      { x: -4, z: -2, rot: 0 },
      { x: 4, z: -2, rot: 0 },
      { x: 0, z: 5, rot: Math.PI }
    ];
    benchPositions.forEach((bp, idx) => {
      const bench = new THREE.Group();
      bench.position.set(bp.x, 0, bp.z);
      bench.rotation.y = bp.rot;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.8), new THREE.MeshBasicMaterial({ color: 0x64748b }));
      seat.position.y = 0.5;
      seat.userData = { isBench: true, benchIdx: idx, x: bp.x, z: bp.z };
      bench.add(seat);
      benchesGroup.add(bench);
    });
    scene.add(benchesGroup);

    // Tạo Mesh Nhân Vật (có Pivot Khớp Chân & Thân)
    function buildCharacterMesh(colorHex, nameStr) {
      const pGroup = new THREE.Group(); // Base Group (di chuyển X, Z)

      const pivot = new THREE.Group(); // Pivot xoay (để té nằm ngang)
      pivot.name = 'pivot';
      pGroup.add(pivot);

      // Thân
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), new THREE.MeshBasicMaterial({ color: colorHex }));
      torso.position.y = 0.7;
      pivot.add(torso);

      // Đầu
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
      head.position.y = 1.15;
      pivot.add(head);

      // Đùi & Cẳng chân (Để ngồi)
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.18), new THREE.MeshBasicMaterial({ color: 0x1e293b }));
      legL.position.set(-0.14, 0.2, 0);
      legL.name = 'legL';
      pivot.add(legL);

      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.18), new THREE.MeshBasicMaterial({ color: 0x1e293b }));
      legR.position.set(0.14, 0.2, 0);
      legR.name = 'legR';
      pivot.add(legR);

      // Con vịt xoay trên đầu (Hiệu ứng choáng)
      const duckCanvas = document.createElement('canvas');
      duckCanvas.width = 128; duckCanvas.height = 128;
      const dCtx = duckCanvas.getContext('2d');
      dCtx.font = '70px sans-serif'; dCtx.fillText('🦆', 20, 90);
      const duckSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(duckCanvas), transparent: true }));
      duckSprite.scale.set(0.8, 0.8, 1);
      duckSprite.position.set(0, 1.7, 0);
      duckSprite.visible = false;
      duckSprite.name = 'duckSprite';
      pivot.add(duckSprite);

      // Bong bóng chat
      const chatGroup = new THREE.Group();
      chatGroup.name = 'chatGroup';
      chatGroup.position.set(0, 1.9, 0);
      chatGroup.visible = false;
      pGroup.add(chatGroup);

      pGroup.userData = { name: nameStr };
      return pGroup;
    }

    // Nhân vật của bản thân
    const myMesh = buildCharacterMesh(0x3b82f6, playerName);
    scene.add(myMesh);

    // Raycaster bắt sự kiện Click chuột
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        for (let i = 0; i < intersects.length; i++) {
          const obj = intersects[i].object;
          if (obj.userData?.isBench) {
            myPosRef.current.targetX = obj.userData.x;
            myPosRef.current.targetZ = obj.userData.z;
            myPosRef.current.isSitting = true;
            return;
          }
          if (obj.userData?.isFloor) {
            myPosRef.current.targetX = intersects[i].point.x;
            myPosRef.current.targetZ = intersects[i].point.z;
            myPosRef.current.isSitting = false;
            return;
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Vòng lặp Render 60 FPS
    let animId;
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);

      // Cập nhật vị trí bản thân
      const p = myPosRef.current;
      p.x += (p.targetX - p.x) * 0.15;
      p.z += (p.targetZ - p.z) * 0.15;
      myMesh.position.set(p.x, 0, p.z);

      // Động tác ngồi ghế
      const legL = myMesh.getObjectByName('legL');
      const legR = myMesh.getObjectByName('legR');
      if (p.isSitting && Math.abs(p.x - p.targetX) < 0.2) {
        if (legL) { legL.rotation.x = -Math.PI / 2; legL.position.z = 0.15; }
        if (legR) { legR.rotation.x = -Math.PI / 2; legR.position.z = 0.15; }
        myMesh.position.y = -0.15;
      } else {
        if (legL) { legL.rotation.x = 0; legL.position.z = 0; }
        if (legR) { legR.rotation.x = 0; legR.position.z = 0; }
        myMesh.position.y = 0;
      }

      // Vịt xoay nếu đang bị choáng
      const duck = myMesh.getObjectByName('duckSprite');
      if (duck && duck.visible) duck.rotation.z += 0.08;

      // Render tất cả người chơi khác
      Object.keys(remotePlayersMapRef.current).forEach((uid) => {
        const rData = remotePlayersMapRef.current[uid];
        if (rData && rData.mesh) {
          rData.mesh.position.x += (rData.targetX - rData.mesh.position.x) * 0.15;
          rData.mesh.position.z += (rData.targetZ - rData.mesh.position.z) * 0.15;

          const rDuck = rData.mesh.getObjectByName('duckSprite');
          if (rDuck && rDuck.visible) rDuck.rotation.z += 0.08;
        }
      });

      renderer.render(scene, camera);
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    };
  }, [threeReady]);

  // 4. Đồng bộ vị trí & Hành động qua Firebase Realtime
  useEffect(() => {
    if (!user || !db) return;

    // Phát tọa độ cá nhân (1 giây / lần)
    const interval = setInterval(() => {
      setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', user.uid), {
        uid: user.uid,
        name: playerName,
        x: myPosRef.current.x,
        z: myPosRef.current.z,
        lastSeen: serverTimestamp()
      }, { merge: true });
    }, 1000);

    // Lắng nghe người chơi khác
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'players'), (snapshot) => {
      const now = Date.now() / 1000;
      const list = [];

      snapshot.forEach((docSnap) => {
        const p = docSnap.data();
        if (p.uid && p.uid !== user.uid && (now - (p.lastSeen?.seconds || now) < 15)) {
          list.push(p);

          // Cập nhật mô hình 3D người chơi khác
          if (sceneRef.current) {
            let rObj = remotePlayersMapRef.current[p.uid];
            if (!rObj) {
              const THREE = window.THREE;
              const g = new THREE.Group();
              const pivot = new THREE.Group(); pivot.name = 'pivot'; g.add(pivot);
              const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), new THREE.MeshBasicMaterial({ color: 0xec4899 }));
              torso.position.y = 0.7; pivot.add(torso);
              const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
              head.position.y = 1.15; pivot.add(head);

              const duckCanvas = document.createElement('canvas'); duckCanvas.width = 128; duckCanvas.height = 128;
              const dCtx = duckCanvas.getContext('2d'); dCtx.font = '70px sans-serif'; dCtx.fillText('🦆', 20, 90);
              const duckSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(duckCanvas), transparent: true }));
              duckSprite.scale.set(0.8, 0.8, 1); duckSprite.position.set(0, 1.7, 0); duckSprite.visible = false; duckSprite.name = 'duckSprite';
              pivot.add(duckSprite);

              const chatGroup = new THREE.Group(); chatGroup.name = 'chatGroup'; chatGroup.position.set(0, 1.9, 0); g.add(chatGroup);
              g.position.set(p.x || 0, 0, p.z || 0);

              sceneRef.current.add(g);
              remotePlayersMapRef.current[p.uid] = { mesh: g, targetX: p.x || 0, targetZ: p.z || 0 };
              rObj = remotePlayersMapRef.current[p.uid];
            } else {
              rObj.targetX = p.x || 0;
              rObj.targetZ = p.z || 0;
            }

            // Kích hoạt hiệu ứng Chọc Ghẹo nếu có
            if (p.actionEffect && (now - (p.actionTime?.seconds || 0) < 4)) {
              const pivot = rObj.mesh.getObjectByName('pivot');
              const duck = rObj.mesh.getObjectByName('duckSprite');
              if (p.actionEffect === 'duck' && duck) {
                duck.visible = true;
                setTimeout(() => { if (duck) duck.visible = false; }, 3000);
              } else if (p.actionEffect === 'faint' && pivot) {
                pivot.rotation.z = Math.PI / 2;
                pivot.position.y = -0.4;
                setTimeout(() => { if (pivot) { pivot.rotation.z = 0; pivot.position.y = 0; } }, 3000);
              }
            }
          }
        }
      });
      setOnlinePlayers(list);
    });

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [user, playerName]);

  // Gửi Chat & Hiện Bong Bóng 3D (5 giây)
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatText.trim() || !sceneRef.current) return;

    const THREE = window.THREE;
    const text = chatText.trim();
    setChatText('');

    // Hiện bong bóng trên đầu mình
    const myMesh = sceneRef.current.children.find(c => c.userData?.name === playerName);
    if (myMesh) {
      const chatGroup = myMesh.getObjectByName('chatGroup');
      if (chatGroup) {
        while (chatGroup.children.length > 0) chatGroup.remove(chatGroup.children[0]);
        const texture = createBubbleTexture(text, playerName, '#3b82f6');
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
        sprite.scale.set(2.4, 1.2, 1);
        chatGroup.add(sprite);
        chatGroup.visible = true;

        setTimeout(() => { chatGroup.visible = false; }, 5000);
      }
    }
  };

  // Ném giấy / Gạt chân người chơi khác
  const triggerAction = async (targetUid, effectType) => {
    if (!db || !targetUid) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', targetUid), {
      actionEffect: effectType,
      actionTime: serverTimestamp()
    }, { merge: true });
    setSelectedTarget(null);
    setToastMsg(effectType === 'duck' ? 'Đã Ném Giấy! 🦆' : 'Đã Gạt Chân! 💫');
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-slate-950 relative font-sans text-white select-none">
      
      {/* Toast Thông Báo */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-5 py-2 rounded-full font-bold shadow-2xl animate-bounce text-sm">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌸</span>
          <h1 className="font-bold text-pink-400 text-sm">Công Viên Hoa Anh Đào (50m²)</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-400" /> {onlinePlayers.length + 1} online
          </span>
          <input
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              localStorage.setItem('park_player_name', e.target.value);
            }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-pink-500"
          />
        </div>
      </header>

      {/* Canvas 3D */}
      <div ref={canvasRef} className="w-full h-full cursor-pointer" />

      {/* Danh sách người chơi để Chọc Ghẹo */}
      <div className="absolute top-16 left-4 z-10 bg-slate-900/85 backdrop-blur p-3 rounded-2xl border border-slate-800 w-56">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-2">Người chơi xung quanh:</h3>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs bg-slate-800/60 p-2 rounded-xl">
            <span className="font-medium text-blue-400">{playerName} (Bạn)</span>
          </div>
          {onlinePlayers.map((p) => (
            <div key={p.uid} className="flex items-center justify-between text-xs bg-slate-800/80 p-2 rounded-xl border border-slate-700">
              <span className="font-medium text-pink-300 truncate max-w-[100px]">{p.name || 'Người chơi'}</span>
              <button
                onClick={() => setSelectedTarget(p)}
                className="px-2 py-1 bg-pink-600 hover:bg-pink-500 rounded-lg text-[10px] font-bold"
              >
                Chọc
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Khung Chat */}
      <form onSubmit={handleSendChat} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 w-full max-w-md px-4">
        <input
          type="text"
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          placeholder="Nhập chat nổi bong bóng 5s..."
          className="flex-1 bg-slate-900/90 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500 shadow-xl"
        />
        <button type="submit" className="bg-pink-600 hover:bg-pink-500 px-4 py-2.5 rounded-2xl text-white shadow-xl">
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Modal Chọc Ghẹo */}
      {selectedTarget && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl w-full max-w-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-pink-400">Chọc: {selectedTarget.name}</h3>
              <button onClick={() => setSelectedTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => triggerAction(selectedTarget.uid, 'duck')}
                className="p-3 bg-slate-800 hover:bg-amber-600/30 border border-slate-700 rounded-2xl flex flex-col items-center gap-1 font-semibold text-amber-400"
              >
                <span className="text-xl">🦆</span> Ném Giấy (3s)
              </button>
              <button
                onClick={() => triggerAction(selectedTarget.uid, 'faint')}
                className="p-3 bg-slate-800 hover:bg-rose-600/30 border border-slate-700 rounded-2xl flex flex-col items-center gap-1 font-semibold text-rose-400"
              >
                <span className="text-xl">💫</span> Gạt Chân (3s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}