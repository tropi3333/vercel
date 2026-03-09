(function () {
    const canvas = document.getElementById('three-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 35;

    // Colors — Swift orange, Xcode blue, accent teal
    const swiftOrange = 0xF05138;
    const xcodeBlue = 0x147EFB;
    const accentTeal = 0x00C7BE;
    const purple = 0x6C63FF;
    const white = 0xFFFFFF;

    const nodeColors = [swiftOrange, xcodeBlue, accentTeal, purple];

    // --- Create network nodes ---
    const nodeCount = 80;
    const nodes = [];
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    for (let i = 0; i < nodeCount; i++) {
        const color = nodeColors[Math.floor(Math.random() * nodeColors.length)];
        const size = 0.08 + Math.random() * 0.15;

        // Glowing sphere
        const geo = new THREE.SphereGeometry(size, 12, 12);
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.8,
        });
        const sphere = new THREE.Mesh(geo, mat);

        // Outer glow ring
        const glowGeo = new THREE.RingGeometry(size * 1.5, size * 2.5, 20);
        const glowMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.lookAt(camera.position);

        const group = new THREE.Group();
        group.add(sphere);
        group.add(glow);

        const x = (Math.random() - 0.5) * 70;
        const y = (Math.random() - 0.5) * 50;
        const z = (Math.random() - 0.5) * 30 - 5;
        group.position.set(x, y, z);

        nodeGroup.add(group);

        nodes.push({
            mesh: group,
            sphere,
            glow,
            glowMat,
            basePos: new THREE.Vector3(x, y, z),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.012,
                (Math.random() - 0.5) * 0.012,
                (Math.random() - 0.5) * 0.005
            ),
            pulseSpeed: 1 + Math.random() * 2,
            pulseOffset: Math.random() * Math.PI * 2,
            color: new THREE.Color(color),
            size,
        });
    }

    // --- Connection lines (dynamic) ---
    const maxConnections = 400;
    const linePositions = new Float32Array(maxConnections * 6);
    const lineColors = new Float32Array(maxConnections * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // --- Pulse waves that travel along connections ---
    const pulseCount = 15;
    const pulses = [];
    const pulseGeo = new THREE.SphereGeometry(0.06, 8, 8);

    for (let i = 0; i < pulseCount; i++) {
        const mat = new THREE.MeshBasicMaterial({
            color: nodeColors[Math.floor(Math.random() * nodeColors.length)],
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
        });
        const mesh = new THREE.Mesh(pulseGeo, mat);
        mesh.visible = false;
        scene.add(mesh);

        pulses.push({
            mesh,
            startNode: 0,
            endNode: 1,
            progress: 0,
            speed: 0.005 + Math.random() * 0.01,
            active: false,
            cooldown: Math.random() * 3,
        });
    }

    // --- Background ambient particles ---
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
        dustPositions[i * 3] = (Math.random() - 0.5) * 100;
        dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 80;
        dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 15;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
        color: 0x4444AA,
        size: 0.3,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // --- Architecture labels (subtle text-like markers) ---
    const labelConfigs = [
        { text: 'MVVM', pos: [-25, 15, -8] },
        { text: 'VIPER', pos: [25, -12, -10] },
        { text: 'SwiftUI', pos: [-18, -18, -6] },
        { text: 'Combine', pos: [20, 16, -12] },
    ];

    const labelSprites = [];
    labelConfigs.forEach((config) => {
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 256;
        labelCanvas.height = 64;
        const ctx = labelCanvas.getContext('2d');
        ctx.font = '600 28px Inter, sans-serif';
        ctx.fillStyle = 'rgba(108, 99, 255, 0.12)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.text, 128, 32);

        const texture = new THREE.CanvasTexture(labelCanvas);
        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(config.pos[0], config.pos[1], config.pos[2]);
        sprite.scale.set(12, 3, 1);
        scene.add(sprite);
        labelSprites.push({
            sprite,
            baseY: config.pos[1],
            floatSpeed: 0.2 + Math.random() * 0.3,
            floatOffset: Math.random() * Math.PI * 2,
        });
    });

    // --- Mouse ---
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

    // --- Helpers ---
    const connectionThreshold = 12;

    function findNearbyPair() {
        const a = Math.floor(Math.random() * nodeCount);
        let closest = -1;
        let closestDist = Infinity;

        for (let b = 0; b < nodeCount; b++) {
            if (b === a) continue;
            const dist = nodes[a].mesh.position.distanceTo(nodes[b].mesh.position);
            if (dist < connectionThreshold && dist < closestDist) {
                closestDist = dist;
                closest = b;
            }
        }
        return closest >= 0 ? [a, closest] : null;
    }

    // --- Animation ---
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();
        const delta = clock.getDelta();

        // Move nodes
        nodes.forEach((node) => {
            node.mesh.position.x += node.velocity.x;
            node.mesh.position.y += node.velocity.y;
            node.mesh.position.z += node.velocity.z;

            // Soft boundary — bounce back
            const bounds = { x: 35, y: 25, z: 20 };
            ['x', 'y', 'z'].forEach((axis) => {
                if (Math.abs(node.mesh.position[axis]) > bounds[axis]) {
                    node.velocity[axis] *= -1;
                }
            });

            // Pulse glow
            const pulse = 0.08 + Math.sin(elapsed * node.pulseSpeed + node.pulseOffset) * 0.06;
            node.glowMat.opacity = pulse;

            // Billboard glow ring
            node.glow.lookAt(camera.position);
        });

        // Update connections
        let lineIdx = 0;
        const posArr = lineGeometry.attributes.position.array;
        const colArr = lineGeometry.attributes.color.array;

        for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
                if (lineIdx >= maxConnections) break;

                const posA = nodes[i].mesh.position;
                const posB = nodes[j].mesh.position;
                const dist = posA.distanceTo(posB);

                if (dist < connectionThreshold) {
                    const fade = 1 - dist / connectionThreshold;
                    const idx = lineIdx * 6;

                    posArr[idx] = posA.x;
                    posArr[idx + 1] = posA.y;
                    posArr[idx + 2] = posA.z;
                    posArr[idx + 3] = posB.x;
                    posArr[idx + 4] = posB.y;
                    posArr[idx + 5] = posB.z;

                    // Gradient between node colors
                    const cA = nodes[i].color;
                    const cB = nodes[j].color;
                    colArr[idx] = cA.r * fade;
                    colArr[idx + 1] = cA.g * fade;
                    colArr[idx + 2] = cA.b * fade;
                    colArr[idx + 3] = cB.r * fade;
                    colArr[idx + 4] = cB.g * fade;
                    colArr[idx + 5] = cB.b * fade;

                    lineIdx++;
                }
            }
            if (lineIdx >= maxConnections) break;
        }

        // Clear remaining
        for (let i = lineIdx * 6; i < posArr.length; i++) {
            posArr[i] = 0;
            colArr[i] = 0;
        }

        lineGeometry.attributes.position.needsUpdate = true;
        lineGeometry.attributes.color.needsUpdate = true;
        lineGeometry.setDrawRange(0, lineIdx * 2);

        // Animate pulses
        pulses.forEach((pulse) => {
            if (!pulse.active) {
                pulse.cooldown -= 0.016;
                if (pulse.cooldown <= 0) {
                    const pair = findNearbyPair();
                    if (pair) {
                        pulse.startNode = pair[0];
                        pulse.endNode = pair[1];
                        pulse.progress = 0;
                        pulse.active = true;
                        pulse.mesh.visible = true;
                    }
                    pulse.cooldown = 1 + Math.random() * 4;
                }
                return;
            }

            pulse.progress += pulse.speed;
            if (pulse.progress >= 1) {
                pulse.active = false;
                pulse.mesh.visible = false;
                return;
            }

            const startPos = nodes[pulse.startNode].mesh.position;
            const endPos = nodes[pulse.endNode].mesh.position;
            pulse.mesh.position.lerpVectors(startPos, endPos, pulse.progress);
            pulse.mesh.material.opacity = Math.sin(pulse.progress * Math.PI) * 0.9;
        });

        // Float labels
        labelSprites.forEach((label) => {
            label.sprite.position.y = label.baseY + Math.sin(elapsed * label.floatSpeed + label.floatOffset) * 1.5;
        });

        // Dust rotation
        dust.rotation.y = elapsed * 0.008;
        dust.rotation.x = Math.sin(elapsed * 0.03) * 0.01;

        // Camera follows mouse
        camera.position.x += (mouse.x * 4 - camera.position.x) * 0.015;
        camera.position.y += (mouse.y * 3 - camera.position.y) * 0.015;

        // Scroll parallax
        const scrollOffset = scrollY * 0.005;
        nodeGroup.position.y = scrollOffset;
        dust.position.y = scrollOffset * 0.3;

        // Fade on scroll
        const heroHeight = window.innerHeight;
        const opacity = Math.max(0, 1 - scrollY / (heroHeight * 1.2));
        canvas.style.opacity = opacity;

        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
    }

    animate();
})();
