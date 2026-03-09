(function () {
    const canvas = document.getElementById('three-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // Colors matching the portfolio theme
    const blue = 0x0071E3;
    const teal = 0x00C7BE;
    const lightBlue = 0x5AC8FA;

    // --- Floating particles ---
    const particleCount = 600;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = [];

    const palette = [
        new THREE.Color(blue),
        new THREE.Color(teal),
        new THREE.Color(lightBlue),
        new THREE.Color(0xFFFFFF),
    ];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

        const color = palette[Math.floor(Math.random() * palette.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        sizes[i] = Math.random() * 2.5 + 0.5;

        velocities.push({
            x: (Math.random() - 0.5) * 0.015,
            y: (Math.random() - 0.5) * 0.015,
            z: (Math.random() - 0.5) * 0.008,
        });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // --- Floating wireframe shapes ---
    const shapes = [];
    const shapeMaterialBase = {
        wireframe: true,
        transparent: true,
        opacity: 0.15,
    };

    function createShape(geometry, color, pos, scale) {
        const mat = new THREE.MeshBasicMaterial({ ...shapeMaterialBase, color });
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(pos.x, pos.y, pos.z);
        mesh.scale.setScalar(scale);
        mesh.userData = {
            rotSpeed: {
                x: (Math.random() - 0.5) * 0.008,
                y: (Math.random() - 0.5) * 0.008,
                z: (Math.random() - 0.5) * 0.004,
            },
            floatSpeed: 0.3 + Math.random() * 0.5,
            floatOffset: Math.random() * Math.PI * 2,
            baseY: pos.y,
        };
        scene.add(mesh);
        shapes.push(mesh);
    }

    // Icosahedron (top-right)
    createShape(
        new THREE.IcosahedronGeometry(1, 0),
        blue,
        { x: 18, y: 10, z: -5 },
        3
    );

    // Octahedron (bottom-left)
    createShape(
        new THREE.OctahedronGeometry(1, 0),
        teal,
        { x: -20, y: -8, z: -8 },
        2.5
    );

    // Torus (mid-right)
    createShape(
        new THREE.TorusGeometry(1, 0.35, 12, 40),
        lightBlue,
        { x: 22, y: -12, z: -3 },
        2
    );

    // Dodecahedron (top-left)
    createShape(
        new THREE.DodecahedronGeometry(1, 0),
        blue,
        { x: -16, y: 14, z: -6 },
        2
    );

    // Torus knot (center-back)
    createShape(
        new THREE.TorusKnotGeometry(1, 0.3, 64, 8),
        teal,
        { x: 0, y: -18, z: -12 },
        1.5
    );

    // Tetrahedron (far right)
    createShape(
        new THREE.TetrahedronGeometry(1, 0),
        lightBlue,
        { x: -8, y: -20, z: -4 },
        2.2
    );

    // --- Connection lines between nearby particles ---
    const linePositions = new Float32Array(particleCount * particleCount * 0.01 * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
        color: blue,
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // --- Mouse interaction ---
    const mouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // --- Scroll-based parallax ---
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
        const posArray = particleGeometry.attributes.position.array;

        // Animate particles
        for (let i = 0; i < particleCount; i++) {
            posArray[i * 3] += velocities[i].x;
            posArray[i * 3 + 1] += velocities[i].y;
            posArray[i * 3 + 2] += velocities[i].z;

            // Wrap around
            if (posArray[i * 3] > 40) posArray[i * 3] = -40;
            if (posArray[i * 3] < -40) posArray[i * 3] = 40;
            if (posArray[i * 3 + 1] > 40) posArray[i * 3 + 1] = -40;
            if (posArray[i * 3 + 1] < -40) posArray[i * 3 + 1] = 40;
        }
        particleGeometry.attributes.position.needsUpdate = true;

        // Update connection lines (check subset for performance)
        let lineIndex = 0;
        const maxDist = 8;
        const lineArray = lineGeometry.attributes.position.array;

        for (let i = 0; i < particleCount; i += 3) {
            for (let j = i + 3; j < particleCount; j += 3) {
                const dx = posArray[i * 3] - posArray[j * 3];
                const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
                const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
                const dist = dx * dx + dy * dy + dz * dz;

                if (dist < maxDist * maxDist && lineIndex < lineArray.length - 6) {
                    lineArray[lineIndex++] = posArray[i * 3];
                    lineArray[lineIndex++] = posArray[i * 3 + 1];
                    lineArray[lineIndex++] = posArray[i * 3 + 2];
                    lineArray[lineIndex++] = posArray[j * 3];
                    lineArray[lineIndex++] = posArray[j * 3 + 1];
                    lineArray[lineIndex++] = posArray[j * 3 + 2];
                }
            }
        }

        // Clear remaining line positions
        for (let i = lineIndex; i < lineArray.length; i++) {
            lineArray[i] = 0;
        }
        lineGeometry.attributes.position.needsUpdate = true;
        lineGeometry.setDrawRange(0, lineIndex / 3);

        // Animate shapes
        shapes.forEach((mesh) => {
            const d = mesh.userData;
            mesh.rotation.x += d.rotSpeed.x;
            mesh.rotation.y += d.rotSpeed.y;
            mesh.rotation.z += d.rotSpeed.z;
            mesh.position.y = d.baseY + Math.sin(elapsed * d.floatSpeed + d.floatOffset) * 1.5;
        });

        // Camera reacts to mouse
        camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
        camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02;

        // Scroll parallax — shift scene slightly
        const scrollOffset = scrollY * 0.008;
        particles.position.y = scrollOffset;
        shapes.forEach((mesh) => {
            mesh.userData.baseY += (scrollOffset * 0.3 - mesh.userData.baseY) * 0.01;
        });

        // Fade out canvas based on scroll
        const heroHeight = window.innerHeight;
        const opacity = Math.max(0, 1 - scrollY / (heroHeight * 1.5));
        canvas.style.opacity = opacity;

        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
    }

    animate();
})();
