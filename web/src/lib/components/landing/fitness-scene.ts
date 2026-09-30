import * as THREE from 'three';

/** A decorative scene. No remote models or textures are required. */
export function createFitnessScene(host: HTMLElement, motionAllowed: () => boolean) {
	const renderer = new THREE.WebGLRenderer({
		alpha: true,
		antialias: true,
		powerPreference: 'low-power'
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
	renderer.setClearColor(0x000000, 0);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.25;
	renderer.domElement.setAttribute('aria-hidden', 'true');
	host.appendChild(renderer.domElement);
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
	camera.position.set(0, 0.15, 8.7);
	camera.zoom = 1.25;
	camera.lookAt(0, 0, 0);
	scene.add(new THREE.HemisphereLight(0xffffff, 0xb2bdbd, 2.8));
	const key = new THREE.DirectionalLight(0xffffff, 5);
	key.position.set(-3, 5, 5);
	scene.add(key);
	const fill = new THREE.DirectionalLight(0xd7f6fa, 2);
	fill.position.set(4, 1, -2);
	scene.add(fill);
	const cyan = new THREE.MeshStandardMaterial({
		color: 0x51d6e7,
		roughness: 0.28,
		metalness: 0.18
	});
	const handleMaterial = new THREE.MeshStandardMaterial({
		color: 0xf2f3f1,
		roughness: 0.32,
		metalness: 0.65
	});
	const neutral = new THREE.MeshStandardMaterial({
		color: 0xd9deda,
		roughness: 0.48,
		metalness: 0.06
	});
	const dark = new THREE.MeshStandardMaterial({ color: 0x26333a, roughness: 0.6, metalness: 0.1 });
	const objects = new THREE.Group();
	objects.position.x = 0.38;
	scene.add(objects);
	const dumbbell = new THREE.Group();
	const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 1.7, 32), handleMaterial);
	grip.rotation.z = Math.PI / 2;
	dumbbell.add(grip);
	// Fine grip rings communicate a real training object without expensive textures.
	for (let i = -5; i <= 5; i++) {
		const ring = new THREE.Mesh(new THREE.TorusGeometry(0.146, 0.008, 6, 28), neutral);
		ring.rotation.y = Math.PI / 2;
		ring.position.x = i * 0.09;
		dumbbell.add(ring);
	}
	const hex = new THREE.Shape();
	for (let i = 0; i < 6; i++) {
		const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
		const x = Math.cos(angle) * 0.77,
			y = Math.sin(angle) * 0.77;
		if (i === 0) hex.moveTo(x, y);
		else hex.lineTo(x, y);
	}
	hex.closePath();
	const weightGeometry = new THREE.ExtrudeGeometry(hex, {
		depth: 0.52,
		bevelEnabled: true,
		bevelSegments: 4,
		steps: 1,
		bevelSize: 0.08,
		bevelThickness: 0.08,
		curveSegments: 12
	});
	weightGeometry.center();
	for (const side of [-1, 1]) {
		const weight = new THREE.Mesh(weightGeometry, cyan);
		weight.rotation.y = Math.PI / 2;
		weight.position.x = side * 1.05;
		dumbbell.add(weight);
		const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.016, 32), dark);
		cap.rotation.z = Math.PI / 2;
		cap.position.x = side * 1.395;
		dumbbell.add(cap);
		const capRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.014, 8, 32), handleMaterial);
		capRing.rotation.y = Math.PI / 2;
		capRing.position.x = side * 1.411;
		dumbbell.add(capRing);
	}
	dumbbell.rotation.set(0.35, -0.42, -0.43);
	dumbbell.position.set(0.28, 0.56, 0.4);
	objects.add(dumbbell);
	const plate = new THREE.Group();
	const plateBody = new THREE.Mesh(new THREE.TorusGeometry(0.91, 0.31, 20, 64), neutral);
	plate.add(plateBody);
	for (const radius of [0.72, 1.07]) {
		const groove = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012, 8, 64), handleMaterial);
		groove.position.z = 0.27;
		plate.add(groove);
	}
	plate.position.set(-0.58, -0.85, -0.35);
	plate.rotation.set(-0.57, 0.38, -0.3);
	objects.add(plate);
	// Soft contact shadow, created locally rather than downloaded.
	const shadowCanvas = document.createElement('canvas');
	shadowCanvas.width = shadowCanvas.height = 128;
	const context = shadowCanvas.getContext('2d');
	let shadowTexture: THREE.CanvasTexture | undefined;
	if (context) {
		const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64);
		gradient.addColorStop(0, 'rgba(26,47,50,0.2)');
		gradient.addColorStop(1, 'rgba(26,47,50,0)');
		context.fillStyle = gradient;
		context.fillRect(0, 0, 128, 128);
		shadowTexture = new THREE.CanvasTexture(shadowCanvas);
		const shadow = new THREE.Mesh(
			new THREE.PlaneGeometry(4.3, 0.7),
			new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })
		);
		shadow.position.set(0.38, -1.98, -0.5);
		scene.add(shadow);
	}
	let inView = true,
		disposed = false,
		targetX = 0,
		targetY = 0;
	let elapsed = 0,
		previousTime = 0;
	function render(time: number) {
		const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
		previousTime = time;
		elapsed += delta;
		objects.rotation.y += (targetX * 0.09 - objects.rotation.y) * 0.035;
		objects.rotation.x += (targetY * 0.06 - objects.rotation.x) * 0.035;
		dumbbell.position.y = 0.56 + Math.sin(elapsed * 0.65) * 0.055;
		dumbbell.rotation.z = -0.43 + Math.sin(elapsed * 0.4) * 0.025;
		plate.rotation.z = -0.3 + Math.sin(elapsed * 0.45) * 0.025;
		renderer.render(scene, camera);
	}
	function syncMotion() {
		if (disposed) return;
		previousTime = 0;
		const animate = inView && !document.hidden && motionAllowed();
		renderer.setAnimationLoop(animate ? render : null);
		if (!animate) {
			targetX = targetY = 0;
			objects.rotation.set(0, 0, 0);
			renderer.render(scene, camera);
		}
	}
	const resizeObserver = new ResizeObserver(() => {
		const { width, height } = host.getBoundingClientRect();
		if (!width || !height) return;
		camera.aspect = width / height;
		// Preserve the rightward composition and leave a margin around the moving objects.
		camera.zoom = Math.min(1.25, camera.aspect * 1.12);
		camera.updateProjectionMatrix();
		renderer.setSize(width, height);
		renderer.render(scene, camera);
	});
	resizeObserver.observe(host);
	const intersectionObserver = new IntersectionObserver(([entry]) => {
		inView = entry.isIntersecting;
		syncMotion();
	});
	intersectionObserver.observe(host);
	function pointerMove(event: PointerEvent) {
		if (!motionAllowed() || event.pointerType !== 'mouse') return;
		const rect = host.getBoundingClientRect();
		targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
		targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
	}
	function pointerLeave() {
		targetX = targetY = 0;
	}
	host.addEventListener('pointermove', pointerMove);
	host.addEventListener('pointerleave', pointerLeave);
	document.addEventListener('visibilitychange', syncMotion);
	syncMotion();
	return {
		syncMotion,
		destroy() {
			disposed = true;
			renderer.setAnimationLoop(null);
			resizeObserver.disconnect();
			intersectionObserver.disconnect();
			host.removeEventListener('pointermove', pointerMove);
			host.removeEventListener('pointerleave', pointerLeave);
			document.removeEventListener('visibilitychange', syncMotion);
			scene.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					const materials = Array.isArray(object.material) ? object.material : [object.material];
					materials.forEach((material) => material.dispose());
				}
			});
			shadowTexture?.dispose();
			renderer.dispose();
			renderer.domElement.remove();
		}
	};
}
