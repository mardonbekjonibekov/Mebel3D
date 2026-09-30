"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MODES = [
  ["rotate", "Aylantirish", "Modelni aylantirish va yaqinlashtirish"],
  ["part", "Rangi o'zgaradigan joy", "Bo'yalgan joy mijoz rang tanlaganda o'zgaradi. Qolgan joy asl rangida qoladi"],
  ["delete", "O'chiriladigan joy", "Bo'yalgan joy modeldan butunlay olib tashlanadi (masalan, pol, atrofdagi ortiqcha narsa)"],
  ["erase", "Silgi", "Bo'yalgan joyni tozalaydi"],
];
const LABEL = { part: 1, delete: 2, erase: 0 };
const TINT = [[1, 1, 1], [1, 0.3, 0.65], [1, 0.12, 0.12]];
const INDICATOR = { part: 0xff4da6, delete: 0xff2222, erase: 0x2288ff };

export default function ModelEditor({ src, onSave, onClose }) {
  const box = useRef(null);
  const api = useRef(null);
  const [mode, setMode] = useState("part");
  const [brush, setBrush] = useState(0.06);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ part: 0, del: 0 });
  const [canUndo, setCanUndo] = useState(false);
  const [floor, setFloor] = useState(null);
  const [thick, setThick] = useState(0.008);

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
        const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
        const { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");
        const bvh = await import("three-mesh-bvh");
        if (cancelled) return;

        const gltf = await new GLTFLoader().loadAsync(src);
        if (cancelled) return;
        gltf.scene.updateMatrixWorld(true);

        const root = new THREE.Group();
        const ms = [];
        gltf.scene.traverse((o) => {
          if (!o.isMesh || o.isSkinnedMesh || !o.geometry?.attributes?.position) return;
          const g = o.geometry.clone();
          g.applyMatrix4(o.matrixWorld);
          if (!g.attributes.normal) g.computeVertexNormals();
          if (!g.index) {
            const n = g.attributes.position.count;
            g.setIndex(new THREE.BufferAttribute(n > 65535 ? new Uint32Array(n) : new Uint16Array(n), 1).copyArray(Array.from({ length: n }, (_, i) => i)));
          }
          const mat = Array.isArray(o.material) ? o.material[0] : o.material;
          const d = g.toNonIndexed();
          const tri = d.attributes.position.count / 3;
          const base = new Float32Array(tri * 9).fill(1);
          const oc = d.attributes.color;
          if (oc) for (let v = 0; v < oc.count; v++) for (let c = 0; c < 3; c++) base[v * 3 + c] = oc.getComponent(v, c);
          for (const name of Object.keys(d.attributes)) if (!["position", "normal", "uv"].includes(name)) d.deleteAttribute(name);
          const col = new THREE.BufferAttribute(new Float32Array(base), 3);
          d.setAttribute("color", col);
          const dm = mat.clone();
          dm.vertexColors = true;
          dm.side = THREE.DoubleSide;
          const mesh = new THREE.Mesh(d, dm);
          d.boundsTree = new bvh.MeshBVH(d);
          mesh.raycast = bvh.acceleratedRaycast;
          root.add(mesh);

          const pos = d.attributes.position.array;
          const cent = new Float32Array(tri * 3);
          const fn = new Float32Array(tri * 3);
          const ar = new Float32Array(tri);
          const a = new THREE.Vector3();
          const b = new THREE.Vector3();
          const c2 = new THREE.Vector3();
          for (let i = 0; i < tri; i++) {
            a.fromArray(pos, i * 9);
            b.fromArray(pos, i * 9 + 3);
            c2.fromArray(pos, i * 9 + 6);
            cent[i * 3] = (a.x + b.x + c2.x) / 3;
            cent[i * 3 + 1] = (a.y + b.y + c2.y) / 3;
            cent[i * 3 + 2] = (a.z + b.z + c2.z) / 3;
            b.sub(a);
            c2.sub(a);
            b.cross(c2);
            ar[i] = b.length() / 2;
            b.normalize();
            fn[i * 3] = b.x;
            fn[i * 3 + 1] = b.y;
            fn[i * 3 + 2] = b.z;
          }
          ms.push({ g, mat, mesh, tri, base, col, cent, fn, ar, auto: new Uint8Array(tri), labels: new Uint8Array(tri) });
        });
        if (ms.length === 0) throw new Error("Modelda ko'rinadigan qism topilmadi");

        const el = box.current;
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
        el.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf4f4f5);
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.add(root);

        const bounds = new THREE.Box3().setFromObject(root);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const diag = size.length() || 1;
        const camera = new THREE.PerspectiveCamera(40, 1, diag / 200, diag * 20);
        camera.position.copy(center).add(new THREE.Vector3(0.7, 0.5, 1.2).multiplyScalar(diag * 0.9));
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.copy(center);
        controls.enableDamping = true;
        controls.update();

        const indicator = new THREE.Mesh(
          new THREE.SphereGeometry(1, 20, 14),
          new THREE.MeshBasicMaterial({ color: 0xff4da6, transparent: true, opacity: 0.28, depthWrite: false }),
        );
        indicator.visible = false;
        scene.add(indicator);

        const resize = () => {
          const w = el.clientWidth || 1;
          const h = el.clientHeight || 1;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(el);

        const st = { mode: "part", brush: 0.06, thick: 0.008, floor: null };
        const history = [];
        const raycaster = new THREE.Raycaster();
        raycaster.firstHitOnly = true;
        const meshes = ms.map((m) => m.mesh);
        const ndc = new THREE.Vector2();

        const setTri = (m, i, L) => {
          const t = TINT[L];
          const arr = m.col.array;
          const o = i * 9;
          for (let k = 0; k < 9; k++) arr[o + k] = m.base[o + k] * t[k % 3];
        };
        const refreshStats = () => {
          let total = 0;
          let p = 0;
          let d = 0;
          for (const m of ms) {
            total += m.tri;
            for (let i = 0; i < m.tri; i++) {
              if (m.labels[i] === 1) p++;
              else if (m.labels[i] === 2) d++;
            }
          }
          setStats({ part: Math.round((p / total) * 100), del: Math.round((d / total) * 100) });
        };
        const pick = (e) => {
          const r = renderer.domElement.getBoundingClientRect();
          ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
          raycaster.setFromCamera(ndc, camera);
          return raycaster.intersectObjects(meshes, false)[0];
        };
        const paint = (hit) => {
          const R = st.brush * diag;
          const r2 = R * R;
          const L = LABEL[st.mode];
          const { x: px, y: py, z: pz } = hit.point;
          const hn = hit.face.normal;
          let changed = false;
          for (const m of ms) {
            let touched = false;
            for (let i = 0; i < m.tri; i++) {
              const j = i * 3;
              const dx = m.cent[j] - px;
              if (dx > R || dx < -R) continue;
              const dy = m.cent[j + 1] - py;
              const dz = m.cent[j + 2] - pz;
              if (dx * dx + dy * dy + dz * dz > r2) continue;
              if (m.fn[j] * hn.x + m.fn[j + 1] * hn.y + m.fn[j + 2] * hn.z < 0.1) continue;
              if (m.labels[i] === L) continue;
              m.labels[i] = L;
              m.auto[i] = 0;
              setTri(m, i, L);
              touched = true;
            }
            if (touched) {
              m.col.needsUpdate = true;
              changed = true;
            }
          }
          return changed;
        };

        let painting = false;
        let strokeChanged = false;
        const dom = renderer.domElement;
        const onDown = (e) => {
          if (st.mode === "rotate" || e.button > 0) return;
          history.push(ms.map((m) => m.labels.slice()));
          if (history.length > 15) history.shift();
          painting = true;
          strokeChanged = false;
          dom.setPointerCapture(e.pointerId);
          const hit = pick(e);
          if (hit && paint(hit)) strokeChanged = true;
        };
        const onMove = (e) => {
          if (st.mode === "rotate") {
            indicator.visible = false;
            return;
          }
          const hit = pick(e);
          if (hit) {
            indicator.position.copy(hit.point);
            indicator.scale.setScalar(st.brush * diag);
            indicator.visible = true;
            if (painting && paint(hit)) strokeChanged = true;
          } else {
            indicator.visible = false;
          }
        };
        const onUp = () => {
          if (!painting) return;
          painting = false;
          if (strokeChanged) {
            refreshStats();
            setCanUndo(true);
          } else {
            history.pop();
          }
        };
        const onLeave = () => {
          indicator.visible = false;
        };
        dom.addEventListener("pointerdown", onDown);
        dom.addEventListener("pointermove", onMove);
        dom.addEventListener("pointerup", onUp);
        dom.addEventListener("pointercancel", onUp);
        dom.addEventListener("pointerleave", onLeave);

        let raf = 0;
        const loop = () => {
          controls.update();
          renderer.render(scene, camera);
          raf = requestAnimationFrame(loop);
        };
        loop();

        const restore = (snap) => {
          ms.forEach((m, k) => {
            m.labels.set(snap[k]);
            m.auto.fill(0);
            for (let i = 0; i < m.tri; i++) setTri(m, i, m.labels[i]);
            m.col.needsUpdate = true;
          });
          refreshStats();
        };

        const compact = (m, tris) => {
          const idx = m.g.index.array;
          const map = new Int32Array(m.g.attributes.position.count).fill(-1);
          const order = [];
          const newIndex = new Uint32Array(tris.length * 3);
          tris.forEach((t, k) => {
            for (let c = 0; c < 3; c++) {
              const v = idx[t * 3 + c];
              if (map[v] < 0) {
                map[v] = order.length;
                order.push(v);
              }
              newIndex[k * 3 + c] = map[v];
            }
          });
          const geo = new THREE.BufferGeometry();
          for (const name of ["position", "normal", "uv", "uv1", "color", "tangent"]) {
            const a = m.g.attributes[name];
            if (!a) continue;
            const arr = new Float32Array(order.length * a.itemSize);
            for (let n = 0; n < order.length; n++) for (let c = 0; c < a.itemSize; c++) arr[n * a.itemSize + c] = a.getComponent(order[n], c);
            geo.setAttribute(name, new THREE.BufferAttribute(arr, a.itemSize));
          }
          geo.setIndex(new THREE.BufferAttribute(newIndex, 1));
          return geo;
        };

        const applyFloor = () => {
          const { n, p } = st.floor;
          const t = st.thick * diag;
          for (const m of ms) {
            let touched = false;
            for (let i = 0; i < m.tri; i++) {
              const j = i * 3;
              if (m.auto[i] && m.labels[i] === 2) {
                m.labels[i] = 0;
                m.auto[i] = 0;
                setTri(m, i, 0);
                touched = true;
              }
              if (m.labels[i] !== 0) continue;
              const dist = (m.cent[j] - p.x) * n.x + (m.cent[j + 1] - p.y) * n.y + (m.cent[j + 2] - p.z) * n.z;
              const nd = m.fn[j] * n.x + m.fn[j + 1] * n.y + m.fn[j + 2] * n.z;
              if (dist < -2 * t || (dist < t && Math.abs(nd) > 0.7)) {
                m.labels[i] = 2;
                m.auto[i] = 1;
                setTri(m, i, 2);
                touched = true;
              }
            }
            if (touched) m.col.needsUpdate = true;
          }
          dropIslands(n, p, t);
          refreshStats();
        };

        // Pol o'chgach qolgan mayda ajralgan parchalarni (pol chetlari va h.k.) ham o'chiramiz
        let weld = null;
        const buildWeld = () => {
          const q = diag * 1e-4;
          const ids = new Map();
          let next = 0;
          for (const m of ms) {
            const pos = m.mesh.geometry.attributes.position.array;
            m.vid = new Int32Array(m.tri * 3);
            for (let v = 0; v < m.tri * 3; v++) {
              const key = `${Math.round(pos[v * 3] / q)},${Math.round(pos[v * 3 + 1] / q)},${Math.round(pos[v * 3 + 2] / q)}`;
              let id = ids.get(key);
              if (id === undefined) {
                id = next++;
                ids.set(key, id);
              }
              m.vid[v] = id;
            }
          }
          weld = next;
        };
        const dropIslands = (n, p, t) => {
          if (weld === null) buildWeld();
          const parent = new Int32Array(weld);
          for (let i = 0; i < weld; i++) parent[i] = i;
          const find = (x) => {
            while (parent[x] !== x) {
              parent[x] = parent[parent[x]];
              x = parent[x];
            }
            return x;
          };
          for (const m of ms) {
            for (let i = 0; i < m.tri; i++) {
              if (m.labels[i] === 2) continue;
              const a = find(m.vid[i * 3]);
              const b = find(m.vid[i * 3 + 1]);
              const c = find(m.vid[i * 3 + 2]);
              if (a !== b) parent[b] = a;
              if (a !== c) parent[find(c)] = find(a);
            }
          }
          const area = new Map();
          const height = new Map();
          let biggest = 0;
          let biggestRoot = -1;
          for (const m of ms) {
            for (let i = 0; i < m.tri; i++) {
              if (m.labels[i] === 2) continue;
              const r = find(m.vid[i * 3]);
              const v = (area.get(r) || 0) + m.ar[i];
              area.set(r, v);
              if (v > biggest) {
                biggest = v;
                biggestRoot = r;
              }
              const j = i * 3;
              const h = (m.cent[j] - p.x) * n.x + (m.cent[j + 1] - p.y) * n.y + (m.cent[j + 2] - p.z) * n.z;
              if (h > (height.get(r) ?? -Infinity)) height.set(r, h);
            }
          }
          for (const m of ms) {
            let touched = false;
            for (let i = 0; i < m.tri; i++) {
              if (m.labels[i] !== 0) continue;
              const r = find(m.vid[i * 3]);
              if (r !== biggestRoot && (area.get(r) < biggest * 0.03 || height.get(r) < 3 * t)) {
                m.labels[i] = 2;
                m.auto[i] = 1;
                setTri(m, i, 2);
                touched = true;
              }
            }
            if (touched) m.col.needsUpdate = true;
          }
        };

        const detectFloor = () => {
          const all = [];
          const ups = [];
          let totalArea = 0;
          for (const m of ms) {
            for (let i = 0; i < m.tri; i++) {
              totalArea += m.ar[i];
              if (m.fn[i * 3 + 1] > 0.82) ups.push(m, i);
            }
          }
          const stepAll = Math.max(1, Math.floor(ms.reduce((s2, m) => s2 + m.tri, 0) / 40000));
          let c = 0;
          for (const m of ms) for (let i = 0; i < m.tri; i++) if (c++ % stepAll === 0) all.push(m, i);
          if (ups.length < 40) return false;
          const upCount = ups.length / 2;
          const stepUp = Math.max(1, Math.floor(upCount / 40000));
          const sample = [];
          for (let k = 0; k < upCount; k += stepUp) sample.push(ups[k * 2], ups[k * 2 + 1]);
          const sN = sample.length / 2;
          const aN = all.length / 2;
          let sampledArea = 0;
          for (let k = 0; k < aN; k++) sampledArea += all[k * 2].ar[all[k * 2 + 1]];
          sampledArea = sampledArea || 1;
          const tol = 0.004 * diag;
          const deep = 0.02 * diag;
          let best = null;
          for (let it = 0; it < 300; it++) {
            const r = Math.floor(Math.random() * sN);
            const m0 = sample[r * 2];
            const i0 = sample[r * 2 + 1];
            const nx = m0.fn[i0 * 3];
            const ny = m0.fn[i0 * 3 + 1];
            const nz = m0.fn[i0 * 3 + 2];
            const d0 = -(nx * m0.cent[i0 * 3] + ny * m0.cent[i0 * 3 + 1] + nz * m0.cent[i0 * 3 + 2]);
            let score = 0;
            for (let k = 0; k < sN; k++) {
              const m = sample[k * 2];
              const i = sample[k * 2 + 1];
              const j = i * 3;
              if (Math.abs(nx * m.cent[j] + ny * m.cent[j + 1] + nz * m.cent[j + 2] + d0) > tol) continue;
              if (m.fn[j] * nx + m.fn[j + 1] * ny + m.fn[j + 2] * nz < 0.966) continue;
              score += m.ar[i];
            }
            if (best && score <= best.score) continue;
            let below = 0;
            for (let k = 0; k < aN; k++) {
              const m = all[k * 2];
              const i = all[k * 2 + 1];
              const j = i * 3;
              if (nx * m.cent[j] + ny * m.cent[j + 1] + nz * m.cent[j + 2] + d0 < -deep) below += m.ar[i];
            }
            if (below / sampledArea > 0.08) continue;
            best = { score, nx, ny, nz, d0 };
          }
          if (!best || best.score < totalArea * 0.004) return false;

          // Aniqlashtirish: barcha mos uchburchaklar bo'yicha o'rtacha tekislik
          const n = new THREE.Vector3();
          const p = new THREE.Vector3();
          let w = 0;
          for (let k = 0; k < upCount; k++) {
            const m = ups[k * 2];
            const i = ups[k * 2 + 1];
            const j = i * 3;
            if (Math.abs(best.nx * m.cent[j] + best.ny * m.cent[j + 1] + best.nz * m.cent[j + 2] + best.d0) > tol) continue;
            if (m.fn[j] * best.nx + m.fn[j + 1] * best.ny + m.fn[j + 2] * best.nz < 0.966) continue;
            n.x += m.fn[j] * m.ar[i];
            n.y += m.fn[j + 1] * m.ar[i];
            n.z += m.fn[j + 2] * m.ar[i];
            p.x += m.cent[j] * m.ar[i];
            p.y += m.cent[j + 1] * m.ar[i];
            p.z += m.cent[j + 2] * m.ar[i];
            w += m.ar[i];
          }
          if (w === 0) return false;
          n.normalize();
          p.multiplyScalar(1 / w);
          history.push(ms.map((m) => m.labels.slice()));
          if (history.length > 15) history.shift();
          st.floor = { n, p };
          applyFloor();
          setCanUndo(true);
          return true;
        };

        const save = async () => {
          const out = new THREE.Group();
          let k = 0;
          for (const m of ms) {
            for (const L of [0, 1]) {
              const tris = [];
              for (let i = 0; i < m.tri; i++) if (m.labels[i] === L) tris.push(i);
              if (tris.length === 0) continue;
              let mat = m.mat;
              if (L === 1) {
                mat = m.mat.clone();
                mat.name = `rang-qism-${k++}`;
              }
              out.add(new THREE.Mesh(compact(m, tris), mat));
            }
          }
          if (out.children.length === 0) throw new Error("Hamma joy o'chirilgan. Hech narsa qolmadi");
          if (st.floor) {
            const q = new THREE.Quaternion().setFromUnitVectors(st.floor.n, new THREE.Vector3(0, 1, 0));
            out.children.forEach((ch) => ch.geometry.applyQuaternion(q));
          }
          const box3 = new THREE.Box3().setFromObject(out);
          const c = box3.getCenter(new THREE.Vector3());
          out.children.forEach((ch) => ch.geometry.translate(-c.x, -box3.min.y, -c.z));
          const buf = await new GLTFExporter().parseAsync(out, { binary: true, maxTextureSize: 4096 });
          const dv = new DataView(buf);
          const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, dv.getUint32(12, true))));
          const all = json.materials || [];
          const parts = all.map((m, i) => (m.name?.startsWith("rang-qism-") ? i : -1)).filter((i) => i >= 0);
          return { buf, parts: parts.length && parts.length < all.length ? parts : null };
        };

        api.current = {
          setMode: (v) => {
            st.mode = v;
            controls.enabled = v === "rotate";
            indicator.material.color.setHex(INDICATOR[v] || 0xffffff);
            if (v === "rotate") indicator.visible = false;
          },
          setBrush: (v) => {
            st.brush = v;
          },
          undo: () => {
            const snap = history.pop();
            if (snap) restore(snap);
            setCanUndo(history.length > 0);
          },
          reset: () => {
            history.push(ms.map((m) => m.labels.slice()));
            st.floor = null;
            setFloor(null);
            restore(ms.map((m) => new Uint8Array(m.tri)));
            setCanUndo(true);
          },
          detectFloor,
          setThick: (v) => {
            st.thick = v;
            if (st.floor) applyFloor();
          },
          save,
        };
        api.current.setMode("part");
        setState("ready");

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          dom.removeEventListener("pointerdown", onDown);
          dom.removeEventListener("pointermove", onMove);
          dom.removeEventListener("pointerup", onUp);
          dom.removeEventListener("pointercancel", onUp);
          dom.removeEventListener("pointerleave", onLeave);
          controls.dispose();
          ms.forEach((m) => {
            m.mesh.geometry.dispose();
            m.mesh.material.dispose();
          });
          pmrem.dispose();
          renderer.dispose();
          dom.remove();
        };
        if (cancelled) cleanup();
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Modelni ochib bo'lmadi");
          setState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      api.current = null;
      cleanup();
    };
  }, [src]);

  useEffect(() => api.current?.setMode(mode), [mode, state]);
  useEffect(() => api.current?.setBrush(brush), [brush, state]);
  useEffect(() => api.current?.setThick(thick), [thick]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function handleSave() {
    if (!api.current) return;
    setState("saving");
    try {
      const { buf, parts } = await api.current.save();
      const file = new File([buf], "model-tahrirlangan.glb", { type: "model/gltf-binary" });
      onSave(file, parts);
    } catch (err) {
      setError(err?.message || "Saqlab bo'lmadi");
      setState("ready");
    }
  }

  const hint = MODES.find((m) => m[0] === mode)?.[2];
  const btn = "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors";

  return createPortal(
    <div className="fixed inset-0 z-200 flex flex-col bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2">
        <p className="mr-auto text-sm font-bold">Modelni tahrirlash</p>
        <button type="button" onClick={onClose} className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>
          Bekor qilish
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={state !== "ready"}
          className={`${btn} bg-brand text-white hover:opacity-90 disabled:opacity-40`}
        >
          {state === "saving" ? "Tayyorlanmoqda..." : "Qo'llash"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        {MODES.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            aria-pressed={mode === key}
            className={`${btn} ${mode === key ? (key === "delete" ? "bg-red-500 text-white" : "bg-brand text-white") : "border border-slate-200 bg-white text-slate-600"}`}
          >
            {label}
          </button>
        ))}
        <label className="ml-1 flex items-center gap-2 text-xs text-slate-500">
          Cho&apos;tka
          <input type="range" min="0.01" max="0.25" step="0.005" value={brush} onChange={(e) => setBrush(parseFloat(e.target.value))} className="w-28 accent-orange-600" />
        </label>
        <button
          type="button"
          onClick={() => setFloor(api.current?.detectFloor() ? "found" : "none")}
          disabled={state !== "ready"}
          className={`${btn} bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40`}
        >
          Polni avtomatik topish
        </button>
        {floor === "found" && (
          <label className="flex items-center gap-2 text-xs text-slate-500">
            Pol qalinligi
            <input type="range" min="0.002" max="0.04" step="0.001" value={thick} onChange={(e) => setThick(parseFloat(e.target.value))} className="w-24 accent-orange-600" />
          </label>
        )}
        <button type="button" onClick={() => api.current?.undo()} disabled={!canUndo} className={`${btn} border border-slate-200 bg-white text-slate-600 disabled:opacity-40`}>
          Ortga
        </button>
        <button type="button" onClick={() => api.current?.reset()} className={`${btn} border border-slate-200 bg-white text-slate-600`}>
          Hammasini tozalash
        </button>
      </div>

      <div ref={box} className="relative min-h-0 flex-1">
        {state === "loading" && <p className="absolute inset-0 grid place-items-center animate-pulse text-sm font-medium text-brand">Model yuklanmoqda...</p>}
      </div>

      <div className="space-y-1 border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600">{error}</p>}
        {floor === "none" && <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">Pol topilmadi. Polni &quot;O&apos;chiriladigan joy&quot; cho&apos;tkasi bilan qo&apos;lda bo&apos;yang.</p>}
        {floor === "found" && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">Pol topildi va qizil bo&apos;ldi. Oyoqlar qizarib qolgan bo&apos;lsa, qalinlikni kamaytiring yoki silgi bilan tozalang. Model qiyshiq bo&apos;lsa, &quot;Qo&apos;llash&quot;da o&apos;zi to&apos;g&apos;rilanadi.</p>}
        <p>{hint}.</p>
        <p>
          <span className="font-semibold text-pink-600">Rangi o&apos;zgaradi: {stats.part}%</span>
          {"  "}
          <span className="font-semibold text-red-600">O&apos;chiriladi: {stats.del}%</span>
          {"  "}Model saqlanganda o&apos;chirilgan joy olib tashlanadi va pastki qismi yerga tekislanadi.
        </p>
      </div>
    </div>,
    document.body,
  );
}
