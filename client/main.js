function client_start() {
  websocket_start();
  threejs_init();
  pointer_lock();
}

var container;
var renderer;
var scene;
var camera;
var controls;
var clock;
var stats;

function threejs_init() {
  container = document.getElementById('container');
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, container.offsetWidth/container.offsetHeight, 0.1, 10000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  renderer.setClearColor(0x0099FF, 1 );

  var light = new THREE.PointLight(0xFFFFFF, 1, 1000);
  light.position.set(-500, 100, -500);
  scene.add(light);

  var plane_texture = new THREE.ImageUtils.loadTexture('assets/grass.jpg');
  plane_texture.wrapS = THREE.RepeatWrapping;
  plane_texture.wrapT = THREE.RepeatWrapping;
  plane_texture.repeat.set(10, 10);

  var plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1000, 1000, 1, 1),
    new THREE.MeshBasicMaterial( {
      map: plane_texture,
      side: THREE.DoubleSide
    })
  );

  plane.rotation.x = 90 * (Math.PI/180);
  scene.add(plane);

  var sun = new THREE.Mesh(
    new THREE.SphereGeometry(50, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xFFFF00
    })
  );
  sun.position.set(-500, 100, -500);

  scene.add(sun);


  controls = new THREE.PointerLockControls(camera);
  controls.enabled = true;
  scene.add( controls.getObject() );

  stats = new Stats();
  stats.setMode(1);
  stats.domElement.style.top = '0px';

  container.appendChild(stats.domElement);
  container.appendChild(renderer.domElement);

  render();
}

var oldx, oldy, oldz;

function render() {
  controls.update();
  var c = controls.getObject();
  if(oldx != c.position.x || oldy != c.position.y || oldz != c.position.z) {
    socket.emit('coord update', {uuid: g_uuid, x : c.position.x, y: c.position.y, z: c.position.z});
    oldx = c.position.x;
    oldy = c.position.y;
    oldz = c.position.z;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
  stats.update();
}

var socket;
var g_uuid;
var gameobjects = {};

function websocket_start() {
  socket = io();

  socket.on("newcon", function(uuid) {
    $('#notifications').append($('<li>').text('new connection: ' + uuid));
    var client = new GameObject(uuid);
    gameobjects[uuid] = client;
  });

  socket.on("register", function(uuid) {
    $('#notifications').append($('<li>').text('you are: ' + uuid));
    g_uuid = uuid;
  });

  socket.on("discon", function(uuid) {
    $('#notifications').append($('<li>').text('new disconnection: ' + uuid));
    gameobjects[uuid].destroy();
    delete gameobjects[uuid];
  });

  socket.on("coord update", function(data) {
//    $('#notifications').append($('<li>').text('coord update: ' + JSON.stringify(data)));
    var data = JSON.parse(data);
    if(data.uuid in gameobjects) {
      gameobjects[data.uuid].update_position(data.x, data.y, data.z);
    } else if(data.uuid != undefined) {
      $('#notifications').append($('<li>').text('new packet/connection: ' + data.uuid));
      var client = new GameObject(data.uuid);
      client.update_position(data.x, data.y, data.z);
      gameobjects[data.uuid] = client;
    }
  });
}

function pointer_lock() {
  container.requestPointerLock = container.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
  $(container).click(function() {
    container.requestPointerLock();
  });
}
