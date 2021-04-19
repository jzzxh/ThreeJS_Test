// GLOBALS - ALLOCATE THESE OUTSIDE OF THE RENDER LOOP - CHANGED
var cubes = [],
  marker,
  spline;
var matrix = new THREE.Matrix4();
var up = new THREE.Vector3(1, 0, 0);
var axis = new THREE.Vector3();
var pt, radians, axis, tangent, path;

// the getPoint starting variable - !important - You get me ;)
var t = 0;

//This function generates the cube and chooses a random color for it
//on intial load.

function getCube() {
  // cube mats and cube
  var mats = [];
  for (var i = 0; i < 6; i++) {
    mats.push(
      new THREE.MeshBasicMaterial({
        color: Math.random() * 0xffffff,
        opacity: 0.6,
        transparent: true,
      })
    );
  }

  var cube = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshFaceMaterial(mats)
  );

  return cube;
}

// Ellipse class, which extends the virtual base class Curve
function Ellipse(xRadius, yRadius) {
  THREE.Curve.call(this);

  // add radius as a property
  this.xRadius = xRadius;
  this.yRadius = yRadius;
}

Ellipse.prototype = Object.create(THREE.Curve.prototype);
Ellipse.prototype.constructor = Ellipse;

// define the getPoint function for the subClass
Ellipse.prototype.getPoint = function(t) {
  var radians = 2 * Math.PI * t;

  return new THREE.Vector3(
    this.xRadius * Math.cos(radians),
    0,
    this.yRadius * Math.sin(radians)
  );
};

//

var mesh, renderer, scene, camera, controls;

function MysvgLoader(data) {
  // instantiate a loader
  const loader = new THREE.SVGLoader();

  // load a SVG resource
  loader.load(
    // resource URL
    data,
    // called when the resource is loaded
    function(data) {
      const paths = data.paths;
      const group = new THREE.Group();
      group.scale.multiplyScalar(0.02);
      group.scale.y *= -1;
      group.rotation.x = 90;
      group.position.set(0,0,0);

      // console.log(paths);

      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];

        const material = new THREE.MeshBasicMaterial({
          color: "red",
          side: THREE.DoubleSide,
          depthWrite: false,
        });

        const shapes = new THREE.SVGLoader.createShapes(path);

        for (let j = 0; j < shapes.length; j++) {
          const shape = shapes[j];
          const geometry = new THREE.ShapeGeometry(shape);
          const mesh = new THREE.Mesh(geometry, material);
          group.add(mesh);
        }
      }

      scene.add(group);
    },
    // called when loading is in progresses
    function(xhr) {
      console.log(xhr.loaded / xhr.total * 100 + "% loaded");
    },
    // called when loading has errors
    function(error) {
      console.log("An error happened" + error);
    }
  );
}

function init() {
  // renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // scene
  scene = new THREE.Scene();

  /////////////////////////////////
  //      Load SVG               //
  /////////////////////////////////
  MysvgLoader("./cc.svg");

  scene.background = new THREE.Color("#838b8b");
  // camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(20, 20, 20);

  // controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render); // use if there is no animation loop
  controls.minDistance = 10;
  controls.maxDistance = 50;

  // light
  //   var light = new THREE.AmbientLight(0xfff);
  //   camera.add(light);
  //   scene.add(camera); // add to scene only because the camera  has a child
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0.75, 0.75, 1.0).normalize();
  scene.add(directionalLight);

  // axes
  scene.add(new THREE.AxisHelper(10));

  ////////////////////////////////////////
  //      Create the cube               //
  ////////////////////////////////////////

  marker = getCube();
  marker.position.set(0, 0, 0);
  scene.add(marker);

  ////////////////////////////////////////
  //      Create an Extruded shape      //
  ////////////////////////////////////////

  // path
  path = new Ellipse(3, 12);

  // params
  var pathSegments = 64;
  var tubeRadius = 0.1;
  var radiusSegments = 16;
  var closed = true;

  var geometry = new THREE.TubeBufferGeometry(
    path,
    pathSegments,
    tubeRadius,
    radiusSegments,
    closed
  );

  // material
  var material = new THREE.MeshPhongMaterial({
    color: 0x0080ff,
    opacity: 0.5,
    transparent: true,
  });

  // mesh
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  //////////////////////////////////////////////////////////////////////////
  //       Create the path which is based on our shape above              //
  //////////////////////////////////////////////////////////////////////////

  //Please note that this red ellipse was only created has a guide so that I could  be certain that the square is true to the tangent and positioning.

  // Ellipse class, which extends the virtual base class Curve
  var curve = new THREE.EllipseCurve(
    0,
    0, // ax, aY
    6,
    11, // xRadius, yRadius
    0,
    2 * Math.PI, // aStartAngle, aEndAngle
    false, // aClockwise
    0 // aRotation
  );

  //defines the amount of points the path will have
  var path2 = new THREE.Path(curve.getPoints(100));
  // var geometrycirc = path2.createPointsGeometry( 100 );
  const geometrys = new THREE.BufferGeometry().setFromPoints(100);
  var materialcirc = new THREE.LineBasicMaterial({
    color: 0x0000ff,
  });

  // Create the final object to add to the scene
  var ellipse = new THREE.Line(geometrys, materialcirc);
  ellipse.position.set(0, 0, 0);
  scene.add(ellipse);
}

function animate() {
  requestAnimationFrame(animate);

  render();
}

function render() {
  // set the marker position
  pt = path.getPoint(t);

  // set the marker position
  marker.position.set(pt.x, pt.y, pt.z);

  // get the tangent to the curve
  tangent = path.getTangent(t).normalize();

  // calculate the axis to rotate around
  axis.crossVectors(up, tangent).normalize();

  // calcluate the angle between the up vector and the tangent
  // radians = Math.acos( up.dot( tangent ) );
  radians = Math.acos(up.dot(tangent));

  // set the quaternion
  marker.quaternion.setFromAxisAngle(axis, radians);

  t = t >= 1 ? 0 : (t += 0.001);

  renderer.render(scene, camera);
}

init();
animate();
