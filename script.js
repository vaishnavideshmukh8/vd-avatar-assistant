document.addEventListener('DOMContentLoaded', function () {
    initAvatarViewer();
    disableAvatarSelection();
});

// Global variables for lip sync
let morphTargets = [];
let isSpeaking = false;
let speakStartTime = 0;

function initAvatarViewer() {
    const container = document.getElementById('avatar-viewer');
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Improved lighting setup for facial features
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(0.5, 0.5, 1);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-0.5, 0.3, 1);
    scene.add(fillLight);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 2);
    camera.lookAt(0, 1.4, 0);

    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Disable all controls for fixed view
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = false;

    const loader = new THREE.GLTFLoader();
    loader.load(
        'https://models.readyplayer.me/6841a76d7eb5771b7dee9b38.glb',
        function (gltf) {
            const model = gltf.scene;

            // Position adjustments for upper body view
            model.position.y = -1.3;
            model.position.z = 0.2;
            model.position.x = 0;
            model.scale.set(1.3, 1.3, 1.3);
            model.rotation.y = 0;

            scene.add(model);

            // Create clipping plane to hide everything below chest
            const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1);
            renderer.localClippingEnabled = true;
            
            // Find morph targets for lip sync
            model.traverse(function(child) {
                if (child.isMesh && child.morphTargetInfluences) {
                    // Store references to morph targets
                    morphTargets = child.morphTargetInfluences;
                    
                    // Ensure materials are visible with clipping
                    if (child.material instanceof THREE.MeshStandardMaterial) {
                        child.material.needsUpdate = true;
                        child.material.clippingPlanes = [clipPlane];
                        child.material.clipShadows = true;
                    }
                }
            });

            // Speak greeting with basic lip sync
            speakWithBasicLipSync("Hi, I am VD. How may I assist you today?");

            // Animation loop
            function animate() {
                requestAnimationFrame(animate);
                
                // Basic lip sync animation when speaking
                if (isSpeaking) {
                    const timeSinceStart = (performance.now() - speakStartTime) / 1000;
                    // Create a simple talking animation
                    const talkIntensity = 0.5 + 0.5 * Math.sin(timeSinceStart * 10);
                    if (morphTargets.length > 0) {
                        // Assuming index 0 is mouth open/close
                        morphTargets[0] = talkIntensity;
                    }
                } else if (morphTargets.length > 0) {
                    // Reset to neutral when not speaking
                    morphTargets[0] = 0;
                }
                
                renderer.render(scene, camera);
            }
            animate();
        },
        undefined,
        function (error) {
            console.error('Error loading avatar:', error);
            container.innerHTML = `
                <div style="width:100%;height:100%;display:flex;justify-content:center;align-items:center;background:#f0f0f0;border-radius:10px;">
                    <img src="https://via.placeholder.com/300x300?text=VD+Call+Center+Agent" alt="VD Avatar" style="max-width:100%;max-height:100%;border-radius:10px;">
                </div>
            `;
        }
    );

    window.addEventListener('resize', function () {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function speakWithBasicLipSync(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.pitch = 1;
    utterance.rate = 0.9;

    // Start speaking
    utterance.onstart = function() {
        isSpeaking = true;
        speakStartTime = performance.now();
    };

    // Stop speaking
    utterance.onend = function() {
        isSpeaking = false;
    };

    speechSynthesis.speak(utterance);
}

function disableAvatarSelection() {
    const selectors = document.querySelectorAll('.avatar-selector, .avatar-option');
    selectors.forEach(el => el.remove());

    document.addEventListener('click', function (e) {
        if (e.target.closest('.avatar-selector, .avatar-option')) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
}