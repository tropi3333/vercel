(function () {
    const canvas = document.getElementById('three-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // Aurora color palette
    const purple = new THREE.Color(0x6C63FF);
    const teal = new THREE.Color(0x00C7BE);
    const pink = new THREE.Color(0xFF6B9D);
    const deepBlue = new THREE.Color(0x1a1a3e);

    // --- Aurora Wave Ribbons ---
    const ribbonCount = 5;
    const ribbons = [];
    const ribbonConfigs = [
        { color1: 0x6C63FF, color2: 0x00C7BE, yBase: 6, amplitude: 4, speed: 0.3, width: 0.8, zPos: -10 },
        { color1: 0x8B5CF6, color2: 0xFF6B9D, yBase: 2, amplitude: 3.5, speed: 0.25, width: 0.6, zPos: -12 },
        { color1: 0x00C7BE, color2: 0x6C63FF, yBase: -2, amplitude: 5, speed: 0.35, width: 0.5, zPos: -14 },
        { color1: 0xFF6B9D, color2: 0x8B5CF6, yBase: -6, amplitude: 3, speed: 0.2, width: 0.7, zPos: -11 },
        { color1: 0x4F46E5, color2: 0x00C7BE, yBase: 10, amplitude: 2.5, speed: 0.15, width: 0.4, zPos: -16 },
    ];

    ribbonConfigs.forEach((config) => {
        const segments = 200;
        const geometry = new THREE.PlaneGeometry(80, config.width, segments, 1);

        const vertexShader = `
            uniform float uTime;
            uniform float uAmplitude;
            uniform float uSpeed;
            uniform float uYBase;
            varying vec2 vUv;
            varying float vWave;

            void main() {
                vUv = uv;
                vec3 pos = position;

                float wave1 = sin(pos.x * 0.15 + uTime * uSpeed) * uAmplitude;
                float wave2 = sin(pos.x * 0.08 + uTime * uSpeed * 0.7 + 1.5) * uAmplitude * 0.5;
                float wave3 = cos(pos.x * 0.12 + uTime * uSpeed * 0.5 + 3.0) * uAmplitude * 0.3;

                pos.y += wave1 + wave2 + wave3 + uYBase;
                pos.z += sin(pos.x * 0.1 + uTime * 0.2) * 2.0;

                vWave = (wave1 + wave2 + wave3) / (uAmplitude * 1.8);

                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform float uTime;
            varying vec2 vUv;
            varying float vWave;

            void main() {
                float mixFactor = vUv.x + sin(uTime * 0.3 + vUv.x * 3.0) * 0.2;
                mixFactor = clamp(mixFactor, 0.0, 1.0);

                vec3 color = mix(uColor1, uColor2, mixFactor);

                // Fade edges
                float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
                float vertFade = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);

                // Shimmer
                float shimmer = sin(vUv.x * 40.0 + uTime * 2.0) * 0.1 + 0.9;

                float alpha = edgeFade * vertFade * shimmer * 0.18;

                gl_FragColor = vec4(color, alpha);
            }
        `;

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uAmplitude: { value: config.amplitude },
                uSpeed: { value: config.speed },
                uYBase: { value: config.yBase },
                uColor1: { value: new THREE.Color(config.color1) },
                uColor2: { value: new THREE.Color(config.color2) },
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = config.zPos;
        scene.add(mesh);
        ribbons.push(mesh);
    });

    // --- Floating geometric shapes (WWDC style) ---
    const shapes = [];
    const shapeDefs = [
        { geo: new THREE.IcosahedronGeometry(1.2, 0), pos: [18, 8, -5], color: 0x6C63FF, scale: 1.5 },
        { geo: new THREE.OctahedronGeometry(1, 0), pos: [-20, -6, -8], color: 0x00C7BE, scale: 1.2 },
        { geo: new THREE.TorusGeometry(1, 0.3, 12, 40), pos: [22, -10, -3], color: 0xFF6B9D, scale: 1 },
        { geo: new THREE.DodecahedronGeometry(0.8, 0), pos: [-16, 12, -6], color: 0x8B5CF6, scale: 1.3 },
        { geo: new THREE.TetrahedronGeometry(1, 0), pos: [8, -16, -4], color: 0x00C7BE, scale: 1 },
        { geo: new THREE.BoxGeometry(1, 1, 1), pos: [-10, -14, -7], color: 0x6C63FF, scale: 0.9 },
        { geo: new THREE.TorusKnotGeometry(0.6, 0.2, 64, 8), pos: [0, 16, -10], color: 0xFF6B9D, scale: 1.1 },
    ];

    shapeDefs.forEach((def) => {
        const edges = new THREE.EdgesGeometry(def.geo);
        const material = new THREE.LineBasicMaterial({
            color: def.color,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
        });
        const wireframe = new THREE.LineSegments(edges, material);
        wireframe.position.set(def.pos[0], def.pos[1], def.pos[2]);
        wireframe.scale.setScalar(def.scale);
        wireframe.userData = {
            rotSpeed: {
                x: (Math.random() - 0.5) * 0.006,
                y: (Math.random() - 0.5) * 0.006,
                z: (Math.random() - 0.5) * 0.003,
            },
            floatSpeed: 0.3 + Math.random() * 0.4,
            floatOffset: Math.random() * Math.PI * 2,
            baseY: def.pos[1],
        };
        scene.add(wireframe);
        shapes.push(wireframe);
    });

    // --- Ambient particles (stars) ---
    const starCount = 300;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 100;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 80;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;

        const brightness = 0.3 + Math.random() * 0.7;
        const colorChoice = Math.random();
        if (colorChoice < 0.3) {
            starColors[i * 3] = purple.r * brightness;
            starColors[i * 3 + 1] = purple.g * brightness;
            starColors[i * 3 + 2] = purple.b * brightness;
        } else if (colorChoice < 0.6) {
            starColors[i * 3] = teal.r * brightness;
            starColors[i * 3 + 1] = teal.g * brightness;
            starColors[i * 3 + 2] = teal.b * brightness;
        } else {
            starColors[i * 3] = brightness;
            starColors[i * 3 + 1] = brightness;
            starColors[i * 3 + 2] = brightness;
        }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // --- Mouse interaction ---
    const mouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // --- Scroll ---
    let scrollY = 0;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });

    // --- Resize ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- Animation loop ---
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Update aurora ribbons
        ribbons.forEach((ribbon) => {
            ribbon.material.uniforms.uTime.value = elapsed;
        });

        // Animate shapes
        shapes.forEach((mesh) => {
            const d = mesh.userData;
            mesh.rotation.x += d.rotSpeed.x;
            mesh.rotation.y += d.rotSpeed.y;
            mesh.rotation.z += d.rotSpeed.z;
            mesh.position.y = d.baseY + Math.sin(elapsed * d.floatSpeed + d.floatOffset) * 2;
        });

        // Twinkle stars
        const opacityPulse = 0.5 + Math.sin(elapsed * 0.8) * 0.2;
        starMaterial.opacity = opacityPulse;

        // Gentle star drift
        stars.rotation.y = elapsed * 0.01;
        stars.rotation.x = Math.sin(elapsed * 0.05) * 0.02;

        // Camera follows mouse
        camera.position.x += (mouse.x * 3 - camera.position.x) * 0.015;
        camera.position.y += (mouse.y * 2 - camera.position.y) * 0.015;

        // Scroll parallax
        const scrollOffset = scrollY * 0.006;
        ribbons.forEach((ribbon, i) => {
            ribbon.position.y = scrollOffset * (0.5 + i * 0.15);
        });
        stars.position.y = scrollOffset * 0.3;

        // Fade canvas on scroll
        const heroHeight = window.innerHeight;
        const opacity = Math.max(0, 1 - scrollY / (heroHeight * 1.2));
        canvas.style.opacity = opacity;

        camera.lookAt(0, 0, -5);
        renderer.render(scene, camera);
    }

    animate();
})();
