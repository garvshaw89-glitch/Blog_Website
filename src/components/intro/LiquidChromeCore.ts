import * as THREE from 'three';

/**
 * LIQUID CHROME CORE — GPU-ACCELERATED FLUID MERCURIAL SCULPTURE
 *
 * - Blooms immediately from t = 0 in centered composition
 * - Responds organically to scroll progress (wave wake & rotation acceleration)
 * - GPU vertex & perturbed-normal displacement via MeshPhysicalMaterial.onBeforeCompile
 * - Futuristic portal warp expansion on entry transition
 */
export class LiquidChromeCore {
  public group: THREE.Group;

  private ribbonMesh: THREE.Mesh;
  private ribbonGeometry: THREE.BufferGeometry;
  private ribbonMaterial: THREE.MeshPhysicalMaterial;
  private dropletMaterial: THREE.MeshPhysicalMaterial;

  private shaderUniforms = {
    uTime: { value: 0 },
    uRippleIntensity: { value: 0.18 },
    uRippleSpeed: { value: 1.55 },
  };

  private dropletsGroup: THREE.Group;
  private droplets: {
    mesh: THREE.Mesh;
    baseY: number;
    speed: number;
    phase: number;
    orbitRadius: number;
  }[] = [];

  private specularLight: THREE.PointLight;
  private envTexture: THREE.CanvasTexture;

  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  private currentScale = 0.02;
  private warpProgress = 0;

  constructor() {
    this.group = new THREE.Group();

    // 1. High-resolution Procedural Studio Softbox Environment Map
    this.envTexture = (() => {
      const cvs = document.createElement('canvas');
      cvs.width = 1024;
      cvs.height = 512;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0.0, '#020409');
        grad.addColorStop(0.32, '#131d2e');
        grad.addColorStop(0.45, '#cbd5e1');
        grad.addColorStop(0.495, '#ffffff');
        grad.addColorStop(0.525, '#e2e8f0');
        grad.addColorStop(0.64, '#0f172a');
        grad.addColorStop(1.0, '#020408');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 512);

        const strip = ctx.createLinearGradient(0, 40, 0, 130);
        strip.addColorStop(0, 'rgba(224, 242, 254, 0)');
        strip.addColorStop(0.5, 'rgba(224, 242, 254, 0.55)');
        strip.addColorStop(1, 'rgba(224, 242, 254, 0)');
        ctx.fillStyle = strip;
        ctx.fillRect(0, 40, 1024, 90);

        const grad2 = ctx.createRadialGradient(512, 256, 32, 512, 256, 360);
        grad2.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        grad2.addColorStop(0.55, 'rgba(14, 165, 233, 0.14)');
        grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, 1024, 512);
      }
      const tex = new THREE.CanvasTexture(cvs);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
    })();

    // 2. Smooth Torus Knot Sculpture with GPU shader wave displacement
    this.ribbonGeometry = new THREE.TorusKnotGeometry(1.62, 0.4, 220, 40, 2, 3);
    this.geometries.push(this.ribbonGeometry);

    this.ribbonMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd4dbe6,
      metalness: 0.98,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      envMap: this.envTexture,
      envMapIntensity: 2.35,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
    });

    this.ribbonMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.shaderUniforms.uTime;
      shader.uniforms.uRippleIntensity = this.shaderUniforms.uRippleIntensity;
      shader.uniforms.uRippleSpeed = this.shaderUniforms.uRippleSpeed;

      const glslHelpers = `
        uniform float uTime;
        uniform float uRippleIntensity;
        uniform float uRippleSpeed;

        vec3 displaceLiquid(vec3 p) {
          float w1 = sin(p.x * 1.85 + uTime * uRippleSpeed)
                   * cos(p.y * 1.85 + uTime * (uRippleSpeed * 0.88))
                   * uRippleIntensity;
          float w2 = sin((p.x + p.z) * 2.35 - uTime * (uRippleSpeed * 1.18))
                   * (uRippleIntensity * 0.48);
          return p * (1.0 + w1 + w2);
        }
      `;

      shader.vertexShader = glslHelpers + '\n' + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>
        {
          float eps = 0.035;
          vec3 p0 = displaceLiquid(position);
          vec3 px = displaceLiquid(position + vec3(eps, 0.0, 0.0));
          vec3 py = displaceLiquid(position + vec3(0.0, eps, 0.0));
          vec3 pz = displaceLiquid(position + vec3(0.0, 0.0, eps));
          vec3 grad = vec3((px.x - p0.x) / eps, (py.y - p0.y) / eps, (pz.z - p0.z) / eps);
          objectNormal = normalize(objectNormal + (grad - vec3(1.0)) * 0.55);
        }
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        transformed = displaceLiquid(transformed);
        `
      );
    };
    this.ribbonMaterial.customProgramCacheKey = () => 'liquid-chrome-ribbon-v1';
    this.materials.push(this.ribbonMaterial);

    this.ribbonMesh = new THREE.Mesh(this.ribbonGeometry, this.ribbonMaterial);
    this.group.add(this.ribbonMesh);

    // 3. Orbiting Liquid Mercury Droplets
    this.dropletMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdce3ee,
      metalness: 0.98,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMap: this.envTexture,
      envMapIntensity: 2.3,
    });
    this.materials.push(this.dropletMaterial);

    this.dropletsGroup = new THREE.Group();
    const dropletGeo = new THREE.SphereGeometry(0.115, 24, 24);
    this.geometries.push(dropletGeo);

    const dropletCount = 12;
    for (let i = 0; i < dropletCount; i++) {
      const dMesh = new THREE.Mesh(dropletGeo, this.dropletMaterial);
      const orbitRadius = 2.45 + (i % 3) * 0.48 + Math.random() * 0.35;
      const phase = (i / dropletCount) * Math.PI * 2;
      const baseY = (Math.random() - 0.5) * 1.65;

      dMesh.position.set(
        Math.cos(phase) * orbitRadius,
        baseY,
        Math.sin(phase) * orbitRadius
      );

      const s = 0.55 + (i % 4) * 0.22;
      dMesh.scale.set(s, s, s);

      this.droplets.push({
        mesh: dMesh,
        baseY,
        speed: 0.36 + (i % 5) * 0.09,
        phase,
        orbitRadius,
      });
      this.dropletsGroup.add(dMesh);
    }
    this.group.add(this.dropletsGroup);

    // 4. Internal cyan specular point light
    this.specularLight = new THREE.PointLight(0x38bdf8, 0.5, 9.5, 1.7);
    this.group.add(this.specularLight);

    this.group.visible = true;
    this.group.scale.set(0.02, 0.02, 0.02);
  }

  public update(
    time: number,
    delta: number,
    elapsed: number,
    scrollProgress: number,
    mouseX: number,
    mouseY: number,
    isTransitioning: boolean
  ) {
    let targetScale = 1.0 + scrollProgress * 0.28;
    let targetSpecular = 2.0 + scrollProgress * 1.6;

    if (elapsed < 1.8) {
      const p = THREE.MathUtils.clamp(elapsed / 1.8, 0, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      targetScale = (0.05 + ease * 0.95) * (1.0 + scrollProgress * 0.28);
      targetSpecular = 0.4 + ease * 1.6 + scrollProgress * 1.4;
    } else {
      const breath = Math.sin((elapsed - 1.8) * 1.6) * 0.025;
      targetScale = 1.0 + scrollProgress * 0.28 + breath;
    }

    if (isTransitioning) {
      this.warpProgress = THREE.MathUtils.damp(this.warpProgress, 1.0, 4.4, delta);
      targetScale = 1.25 + this.warpProgress * 5.8;
      targetSpecular = 3.2 + this.warpProgress * 14.0;
      this.ribbonMaterial.roughness = THREE.MathUtils.damp(this.ribbonMaterial.roughness, 0.01, 5.0, delta);
    }

    this.currentScale = THREE.MathUtils.damp(
      this.currentScale,
      targetScale,
      isTransitioning ? 5.0 : 4.8,
      delta
    );
    this.specularLight.intensity = THREE.MathUtils.damp(
      this.specularLight.intensity,
      targetSpecular,
      4.5,
      delta
    );

    this.group.scale.setScalar(this.currentScale);
    this.group.position.x = 0;

    // GPU shader uniforms respond to scroll wake & transition energy
    this.shaderUniforms.uTime.value = time;
    this.shaderUniforms.uRippleIntensity.value = THREE.MathUtils.damp(
      this.shaderUniforms.uRippleIntensity.value,
      isTransitioning ? 0.42 : 0.18 + scrollProgress * 0.14,
      4.5,
      delta
    );
    this.shaderUniforms.uRippleSpeed.value = THREE.MathUtils.damp(
      this.shaderUniforms.uRippleSpeed.value,
      isTransitioning ? 3.3 : 1.5 + scrollProgress * 1.1,
      4.5,
      delta
    );

    // Rotation accelerates smoothly with scroll sweep
    const targetRotY = mouseX * 0.42 + time * 0.24 + scrollProgress * 2.1;
    const targetRotX = -mouseY * 0.28 + Math.sin(time * 0.45) * 0.14 + scrollProgress * 0.45;

    this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, targetRotY, 4.8, delta);
    this.group.rotation.x = THREE.MathUtils.damp(this.group.rotation.x, targetRotX, 4.8, delta);
    this.ribbonMesh.rotation.z += delta * (0.14 + scrollProgress * 0.35);

    // Orbiting droplets expand slightly during scroll
    const orbitBoost = 1.0 + scrollProgress * 0.25 + (isTransitioning ? this.warpProgress * 1.4 : 0);
    for (let i = 0; i < this.droplets.length; i++) {
      const d = this.droplets[i];
      d.phase += delta * d.speed * (1.0 + scrollProgress * 0.8);
      const r = (d.orbitRadius + Math.sin(time * 1.35 + d.phase) * 0.18) * orbitBoost;
      d.mesh.position.x = Math.cos(d.phase) * r;
      d.mesh.position.z = Math.sin(d.phase) * r;
      d.mesh.position.y = d.baseY + Math.sin(time * 1.8 + d.phase) * 0.3;
    }
  }

  public dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.envTexture.dispose();
  }
}
