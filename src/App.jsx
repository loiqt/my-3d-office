import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Sparkles, Send, X, Users, MessageSquare } from 'lucide-react';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBzBLcsQIg8reDq6tpvs9FnLgSaxicOfY0",
  authDomain: "my-3d-office-game.firebaseapp.com",
  projectId: "my-3d-office-game",
  storageBucket: "my-3d-office-game.firebasestorage.app",
  messagingSenderId: "723982123363",
  appId: "1:723982123363:web:6c27264a5d926b08f29356",
  measurementId: "G-88L91QZNH2"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'cherry-blossom-park-3d-v5';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const CARTOON_CHARACTERS = [
  { id: 'c1', name: 'Bé Mèo Dễ Thương', icon: '🐱', color: '#ec4899', hairColor: '#be185d', skinColor: '#fde047' },
  { id: 'c2', name: 'Cậu Chàng Siêu Quậy', icon: '🦊', color: '#f97316', hairColor: '#c2410c', skinColor: '#fde047' },
  { id: 'c3', name: 'Thỏ Con Tinh Nghịch', icon: '🐰', color: '#a855f7', hairColor: '#7e22ce', skinColor: '#fde047' },
  { id: 'c4', name: 'Gấu Trúc Ngủ Gật', icon: '🐼', color: '#1e293b', hairColor: '#0f172a', skinColor: '#fde047' },
  { id: 'c5', name: 'Hổ Báo Trường Học', icon: '🐯', color: '#eab308', hairColor: '#a16207', skinColor: '#fde047' },
  { id: 'c6', name: 'Kỳ Lân Mộng Mơ', icon: '🦄', color: '#06b6d4', hairColor: '#0e7490', skinColor: '#fde047' },
  { id: 'c7', name: 'Chú Cún Trung Thành', icon: '🐶', color: '#84cc16', hairColor: '#4d7c0f', skinColor: '#fde047' },
  { id: 'c8', name: 'Khỉ Con Lém Lỉnh', icon: '🐵', color: '#b45309', hairColor: '#78350f', skinColor: '#fde047' },
  { id: 'c9', name: 'Ếch Xanh Vui Nhộn', icon: '🐸', color: '#10b981', hairColor: '#047857', skinColor: '#fde047' },
  { id: 'c10', name: 'Cánh Cụt Lạnh Lùng', icon: '🐧', color: '#3b82f6', hairColor: '#1d4ed8', skinColor: '#fde047' },
  { id: 'c11', name: 'Heo Con Mũm Mĩm', icon: '🐷', color: '#f43f5e', hairColor: '#be123c', skinColor: '#fde047' },
  { id: 'c12', name: 'Sư Tử Hùm Xám', icon: '🦁', color: '#d97706', hairColor: '#92400e', skinColor: '#fde047' },
  { id: 'c13', name: 'Cú Đêm Thông Thái', icon: '🦉', color: '#6366f1', hairColor: '#4338ca', skinColor: '#fde047' },
  { id: 'c14', name: 'Ong Vàng Chăm Chỉ', icon: '🐝', color: '#fbbf24', hairColor: '#b45309', skinColor: '#fde047' },
  { id: 'c15', name: 'Bạch Tuộc Vui Vẻ', icon: '🐙', color: '#8b5cf6', hairColor: '#6d28d9', skinColor: '#fde047' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [hasEnteredGame, setHasEnteredGame] = useState(false);
  const [selectedChar, setSelectedChar] = useState(CARTOON_CHARACTERS[0]);
  const [customName, setCustomName] = useState('Người Chơi');

  const [chatInput, setChatInput] = useState('');
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [isSitting, setIsSitting] = useState(false);

  const canvasContainerRef = useRef(null);
  const playerPosRef = useRef({ x: 0, z: 2, targetX: 0, targetZ: 2 });

  // Refs for real-time synchronization inside static Three.js animation loop
  const onlinePlayersRef = useRef([]);
  const chatBubblesRef = useRef({});
  const activeEffectsRef = useRef({});
  const screenPositionsRef = useRef({});
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [speechBubblesRender, setSpeechBubblesRender] = useState([]);

  // Load Three.js
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

  // Auth Anonymous
  useEffect(() => {
    if (!auth) return;
    signInAnonymously(auth).catch(() => {});
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // Keep onlinePlayersRef synced with onlinePlayers state
  useEffect(() => {
    onlinePlayersRef.current = onlinePlayers;
  }, [onlinePlayers]);

  // Clean expired chat bubbles every 500ms
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const currentBubbles = chatBubblesRef.current;
      const updatedList = [];
      Object.keys(currentBubbles).forEach((uid) => {
        if (now < currentBubbles[uid].expireAt) {
          updatedList.push({ uid, ...currentBubbles[uid] });
        } else {
          delete currentBubbles[uid];
        }
      });
      setSpeechBubblesRender(updatedList);
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Firestore Heartbeat & Realtime Listeners
  useEffect(() => {
    if (!db || !user || !hasEnteredGame) return;

    const playersCol = collection(db, 'artifacts', appId, 'public', 'data', 'players');
    
    // Heartbeat sending local player position & status
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
    }, 600);

    // Listen to active online players
    const unsubPlayers = onSnapshot(playersCol, (snapshot) => {
      const active = [];
      snapshot.forEach((docSnap) => {
        const p = docSnap.data();
        if (p && p.uid) {
          if (p.uid === user.uid) {
            if (p.activeEffect && p.activeEffect.expireAt > Date.now()) {
              activeEffectsRef.current[user.uid] = p.activeEffect;
            }
          } else {
            active.push(p);
            if (p.activeEffect && p.activeEffect.expireAt > Date.now()) {
              activeEffectsRef.current[p.uid] = p.activeEffect;
            }
          }
        }
      });
      setOnlinePlayers(active);
    }, (err) => console.warn("Player sync error", err));

    // Listen to real-time chat messages
    const chatCol = collection(db, 'artifacts', appId, 'public', 'data', 'chat');
    const unsubChat = onSnapshot(chatCol, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const msg = change.data();
          if (msg && msg.uid && msg.text) {
            chatBubblesRef.current[msg.uid] = {
              senderName: msg.senderName,
              text: msg.text,
              expireAt: Date.now() + 5000
            };
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

  // Send action (duck paper / faint trip) to target player
  const sendActionToPlayer = async (targetUid, effectType) => {
    if (!db || !targetUid) return;
    setTargetPlayer(null);
    const expireTime = Date.now() + 3000;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', targetUid), {
        activeEffect: { type: effectType, expireAt: expireTime }
      }, { merge: true });
    } catch (e) {}
  };

  // Main 3D Engine Setup - PERSISTENT SINGLE INIT (no rebuild on state change!)
  useEffect(() => {
    if (!threeLoaded || !hasEnteredGame || !canvasContainerRef.current) return;
    const THREE = window.THREE;
    const container = canvasContainerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 13, 17);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(renderer.domElement);

    // Warm Outdoor Cherry Blossom Lighting
    scene.add(new THREE.AmbientLight(0xfff1f2, 1.4));
    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    sunLight.position.set(12, 20, 12);
    scene.add(sunLight);

    // Park Grass Floor
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 36),
      new THREE.MeshBasicMaterial({ color: 0x064e3b })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.userData = { isFloor: true };
    scene.add(ground);

    // Park Stone Circle & Central Sakura Tree
    const centerGroup = new THREE.Group();
    const stoneBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.8, 0.3, 24),
      new THREE.MeshBasicMaterial({ color: 0x475569 })
    );
    stoneBase.position.y = 0.15;
    centerGroup.add(stoneBase);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 3.6, 12),
      new THREE.MeshBasicMaterial({ color: 0x451a03 })
    );
    trunk.position.y = 1.8;
    centerGroup.add(trunk);

    for (let i = 0; i < 10; i++) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(1.35, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xf472b6 })
      );
      const angle = (i * Math.PI * 2) / 10;
      leaf.position.set(Math.cos(angle) * 1.1, 3.6 + (i % 3) * 0.4, Math.sin(angle) * 1.1);
      centerGroup.add(leaf);
    }
    scene.add(centerGroup);

    // Park Benches with explicit seat metadata
    const createBench = (x, z, rotY) => {
      const bench = new THREE.Group();
      bench.position.set(x, 0, z);
      bench.rotation.y = rotY;

      const seatMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.7), seatMat);
      seat.position.y = 0.45;
      seat.userData = { isBench: true, benchPos: { x, z } };
      bench.add(seat);

      const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.08), seatMat);
      back.position.set(0, 0.8, -0.31);
      bench.add(back);

      [[-0.9, 0.22, -0.25], [0.9, 0.22, -0.25], [-0.9, 0.22, 0.25], [0.9, 0.22, 0.25]].forEach(([bx, by, bz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
        leg.position.set(bx, by, bz);
        bench.add(leg);
      });
      scene.add(bench);
    };

    createBench(-6.5, -5.5, 0.4);
    createBench(6.5, 5.5, -2.6);
    createBench(-6.5, 5.5, 1.2);
    createBench(6.5, -5.5, -0.4);

    // Helper: Detailed Human 3D Model with Articulated Leg Knees (Gập Chân) & Duck/Zzz FX
    const createDetailedHumanCharacter = (colorHex, hairHex, skinHex = '#fde047') => {
      const charGroup = new THREE.Group();
      const col = parseInt(colorHex.replace('#', '0x'));
      const hairCol = parseInt(hairHex.replace('#', '0x'));
      const skinCol = parseInt(skinHex.replace('#', '0x'));

      const bodyMat = new THREE.MeshBasicMaterial({ color: col });
      const skinMat = new THREE.MeshBasicMaterial({ color: skinCol });
      const pantsMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
      const hairMat = new THREE.MeshBasicMaterial({ color: hairCol });
      const shoeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.26), bodyMat);
      torso.position.y = 0.68;
      charGroup.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 14), skinMat);
      head.position.y = 1.15;
      charGroup.add(head);

      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
      hair.position.y = 1.22;
      charGroup.add(hair);

      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      [-0.07, 0.07].forEach((ex) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeMat);
        eye.position.set(ex, 1.17, 0.17);
        charGroup.add(eye);
      });

      const armGeom = new THREE.CylinderGeometry(0.05, 0.04, 0.42, 8);
      const leftArm = new THREE.Mesh(armGeom, bodyMat);
      leftArm.position.set(-0.3, 0.68, 0);
      charGroup.add(leftArm);

      const rightArm = new THREE.Mesh(armGeom, bodyMat);
      rightArm.position.set(0.3, 0.68, 0);
      charGroup.add(rightArm);

      // Articulated Leg Hierarchy for 90-degree Knees Bending (Sitting)
      const leftThighGroup = new THREE.Group();
      leftThighGroup.position.set(-0.12, 0.44, 0);
      const leftThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.24, 8), pantsMat);
      leftThighMesh.position.y = -0.12;
      leftThighGroup.add(leftThighMesh);

      const leftShinGroup = new THREE.Group();
      leftShinGroup.position.set(0, -0.24, 0);
      const leftShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.22, 8), skinMat);
      leftShinMesh.position.y = -0.11;
      const shoe1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.14), shoeMat);
      shoe1.position.set(0, -0.21, 0.03);
      leftShinGroup.add(leftShinMesh);
      leftShinGroup.add(shoe1);
      leftThighGroup.add(leftShinGroup);

      const rightThighGroup = new THREE.Group();
      rightThighGroup.position.set(0.12, 0.44, 0);
      const rightThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.24, 8), pantsMat);
      rightThighMesh.position.y = -0.12;
      rightThighGroup.add(rightThighMesh);

      const rightShinGroup = new THREE.Group();
      rightShinGroup.position.set(0, -0.24, 0);
      const rightShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.22, 8), skinMat);
      rightShinMesh.position.y = -0.11;
      const shoe2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.14), shoeMat);
      shoe2.position.set(0, -0.21, 0.03);
      rightShinGroup.add(rightShinMesh);
      rightShinGroup.add(shoe2);
      rightThighGroup.add(rightShinGroup);

      charGroup.add(leftThighGroup);
      charGroup.add(rightThighGroup);

      // Rotating Ducks Ring FX (for Duck Stun Paper action)
      const duckRingGroup = new THREE.Group();
      duckRingGroup.position.set(0, 1.5, 0);
      duckRingGroup.visible = false;
      for (let d = 0; d < 4; d++) {
        const duckMini = new THREE.Group();
        const angle = (d * Math.PI * 2) / 4;
        duckMini.position.set(Math.cos(angle) * 0.4, 0, Math.sin(angle) * 0.4);
        const dBody = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        dHead.position.set(0, 0.05, 0.03);
        const dBeak = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.03, 6), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
        dBeak.rotation.x = Math.PI / 2;
        dBeak.position.set(0, 0.05, 0.07);
        duckMini.add(dBody);
        duckMini.add(dHead);
        duckMini.add(dBeak);
        duckRingGroup.add(duckMini);
      }
      charGroup.add(duckRingGroup);

      return {
        mesh: charGroup,
        leftThigh: leftThighGroup,
        leftShin: leftShinGroup,
        rightThigh: rightThighGroup,
        rightShin: rightShinGroup,
        duckRing: duckRingGroup
      };
    };

    // Create Local Player Character 3D Mesh
    const localCharData = createDetailedHumanCharacter(selectedChar.color, selectedChar.hairColor);
    localCharData.mesh.position.set(playerPosRef.current.x, 0, playerPosRef.current.z);
    scene.add(localCharData.mesh);

    // Raycaster for Pointer Selection (Walking & Sitting)
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
          playerPosRef.current.targetZ = obj.userData.benchPos.z + 0.35;
          return;
        }

        if (obj.userData?.isFloor) {
          setIsSitting(false);
          const pt = intersects[i].point;
          playerPosRef.current.targetX = Math.max(-14, Math.min(14, pt.x));
          playerPosRef.current.targetZ = Math.max(-14, Math.min(14, pt.z));
          return;
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Single Persistent Animation Loop
    let animId;
    let clock = 0;
    const remoteMeshesMap = {};

    const animate = () => {
      animId = requestAnimationFrame(animate);
      clock += 0.05;
      const now = Date.now();

      // Update Local Player Position & Animations
      const curr = playerPosRef.current;
      curr.x += (curr.targetX - curr.x) * 0.12;
      curr.z += (curr.targetZ - curr.z) * 0.12;

      const myEffect = activeEffectsRef.current[user?.uid];
      if (myEffect && now < myEffect.expireAt) {
        if (myEffect.type === 'faint') {
          localCharData.mesh.rotation.x = -Math.PI / 2;
          localCharData.mesh.position.set(curr.x, 0.15, curr.z);
          localCharData.duckRing.visible = false;
        } else if (myEffect.type === 'duck') {
          localCharData.mesh.rotation.x = 0;
          localCharData.mesh.rotation.y += 0.2;
          localCharData.mesh.position.set(curr.x, 0, curr.z);
          localCharData.duckRing.visible = true;
          localCharData.duckRing.rotation.y = clock * 4;
        }
      } else {
        localCharData.mesh.rotation.x = 0;
        localCharData.duckRing.visible = false;

        if (isSitting) {
          localCharData.mesh.position.set(curr.x, 0.18, curr.z);
          // Knee Bending 90 degrees
          localCharData.leftThigh.rotation.x = -Math.PI / 2;
          localCharData.rightThigh.rotation.x = -Math.PI / 2;
          localCharData.leftShin.rotation.x = Math.PI / 2;
          localCharData.rightShin.rotation.x = Math.PI / 2;
        } else {
          localCharData.mesh.position.set(curr.x, 0, curr.z);
          // Standing Legs Straight
          localCharData.leftThigh.rotation.x = 0;
          localCharData.rightThigh.rotation.x = 0;
          localCharData.leftShin.rotation.x = 0;
          localCharData.rightShin.rotation.x = 0;
        }
      }

      // Update Remote Online Players
      const activeRemotes = onlinePlayersRef.current;
      const activeUids = new Set(activeRemotes.map((p) => p.uid));

      Object.keys(remoteMeshesMap).forEach((uid) => {
        if (!activeUids.has(uid)) {
          scene.remove(remoteMeshesMap[uid].mesh);
          delete remoteMeshesMap[uid];
        }
      });

      activeRemotes.forEach((p) => {
        let rChar = remoteMeshesMap[p.uid];
        if (!rChar) {
          rChar = createDetailedHumanCharacter(p.color || '#3b82f6', p.hairColor || '#1e293b');
          scene.add(rChar.mesh);
          remoteMeshesMap[p.uid] = rChar;
        }

        const pEff = activeEffectsRef.current[p.uid];
        if (pEff && now < pEff.expireAt) {
          if (pEff.type === 'faint') {
            rChar.mesh.rotation.x = -Math.PI / 2;
            rChar.mesh.position.set(p.x || 0, 0.15, p.z || 0);
            rChar.duckRing.visible = false;
          } else if (pEff.type === 'duck') {
            rChar.mesh.rotation.x = 0;
            rChar.mesh.rotation.y += 0.2;
            rChar.mesh.position.set(p.x || 0, 0, p.z || 0);
            rChar.duckRing.visible = true;
            rChar.duckRing.rotation.y = clock * 4;
          }
        } else {
          rChar.mesh.rotation.x = 0;
          rChar.duckRing.visible = false;

          if (p.isSitting) {
            rChar.mesh.position.set(p.x || 0, 0.18, p.z || 0);
            rChar.leftThigh.rotation.x = -Math.PI / 2;
            rChar.rightThigh.rotation.x = -Math.PI / 2;
            rChar.leftShin.rotation.x = Math.PI / 2;
            rChar.rightShin.rotation.x = Math.PI / 2;
          } else {
            rChar.mesh.position.set(p.x || 0, 0, p.z || 0);
            rChar.leftThigh.rotation.x = 0;
            rChar.rightThigh.rotation.x = 0;
            rChar.leftShin.rotation.x = 0;
            rChar.rightShin.rotation.x = 0;
          }
        }
      });

      // Project 3D World Positions of Players to 2D Screen Space for Speech Bubbles
      const screenPosMap = {};

      // Local player head projection
      const localWorldPos = new THREE.Vector3(curr.x, 1.75, curr.z);
      localWorldPos.project(camera);
      screenPosMap[user?.uid] = {
        x: (localWorldPos.x * 0.5 + 0.5) * container.clientWidth,
        y: (-(localWorldPos.y * 0.5) + 0.5) * container.clientHeight
      };

      // Remote players head projection
      activeRemotes.forEach((p) => {
        const rWorldPos = new THREE.Vector3(p.x || 0, 1.75, p.z || 0);
        rWorldPos.project(camera);
        screenPosMap[p.uid] = {
          x: (rWorldPos.x * 0.5 + 0.5) * container.clientWidth,
          y: (-(rWorldPos.y * 0.5) + 0.5) * container.clientHeight
        };
      });

      screenPositionsRef.current = screenPosMap;

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
  }, [threeLoaded, hasEnteredGame, selectedChar, user]);

  // Handle send chat
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

  // Onboarding Selection Screen
  if (!hasEnteredGame) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center font-sans overflow-y-auto z-50">
        <style>{`html, body, #root { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; }`}</style>
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-pink-600/20 text-pink-400 rounded-2xl border border-pink-500/30 mb-1">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">🌸 Công Viên Hoa Anh Đào 3D</h1>
            <p className="text-xs text-slate-400">Chọn nhân vật hoạt hình và đặt tên để tham gia tương tác trò chuyện!</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-pink-400 uppercase tracking-wider">Chọn Nhân Vật Hoạt Hình (15 Mẫu)</label>
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
            <Sparkles className="w-4 h-4" /> Vào Công Viên Ngay ({selectedChar.icon} {customName})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans m-0 p-0 flex flex-col">
      <style>{`html, body, #root { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; }`}</style>
      
      {/* Top Header */}
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

      {/* Main 3D Viewport */}
      <div className="flex-1 relative overflow-hidden flex flex-col w-full h-full">
        <div ref={canvasContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing relative" />

        {/* Real-time 3D Speech Bubbles Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {speechBubblesRender.map((bubble) => {
            const pos = screenPositionsRef.current[bubble.uid];
            if (!pos) return null;
            return (
              <div
                key={`${bubble.uid}-${bubble.expireAt}`}
                className="absolute transform -translate-x-1/2 -translate-y-full transition-all duration-150"
                style={{ left: `${pos.x}px`, top: `${pos.y - 20}px` }}
              >
                <div className="bg-slate-900/95 text-white px-3.5 py-2 rounded-2xl shadow-2xl border-2 border-pink-500 max-w-xs animate-in zoom-in duration-200">
                  <div className="text-[10px] font-bold text-pink-400 uppercase">💬 {bubble.senderName}</div>
                  <div className="text-xs font-semibold">{bubble.text}</div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-6 border-t-pink-500" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Players List Panel */}
        <div className="absolute top-4 left-6 z-20 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-2xl shadow-xl max-w-xs space-y-2">
          <div className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Người chơi trong công viên:
          </div>
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

        {/* Target Action Prank Modal */}
        {targetPlayer && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Chọc ghẹo: {targetPlayer.name}</h3>
                <button onClick={() => setTargetPlayer(null)} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400">Chọn hoạt ảnh 3D tác động ngay lập tức lên nhân vật:</p>
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <button
                  onClick={() => sendActionToPlayer(targetPlayer.uid, 'duck')}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-amber-600/20 border border-slate-700 hover:border-amber-500 text-amber-400 transition flex flex-col items-center gap-1"
                >
                  <span className="text-xl">📄</span> Ném Giấy (Vịt Xoay 3s)
                </button>
                <button
                  onClick={() => sendActionToPlayer(targetPlayer.uid, 'faint')}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-rose-600/20 border border-slate-700 hover:border-rose-500 text-rose-400 transition flex flex-col items-center gap-1"
                >
                  <span className="text-xl">🦶</span> Gạt Chân (Té Ngang 3s)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Chat Bar */}
        <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-center">
          <form onSubmit={handleSendChat} className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 p-2 rounded-2xl shadow-xl w-full max-w-md">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập tin nhắn chat bong bóng (5s)..."
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
```
eof
