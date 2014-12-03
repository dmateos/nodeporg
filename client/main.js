function client_start() {
  websocket_start();
  threejs_init();
}

var container;
var renderer;
var scene;
var camera;
var controls;
var clock;

function threejs_init() {
  container = document.getElementById('container');
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, container.offsetWidth/container.offsetHeight, 0.1, 10000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  renderer.setClearColorHex( 0xffffff, 1 );

  var light = new THREE.PointLight(0xFFFFFF, 1, 1000);
  light.position.set(50, 20, 50);
  scene.add(light);

  var plane = new THREE.Mesh(
    new THREE.PlaneGeometry(100*10, 100*10, 100, 100),
    new THREE.MeshBasicMaterial( {
      color: 0x0000FF,
      wireframe: true
    })
  );

  plane.rotation.x = 90 * (Math.PI/180); 
  scene.add(plane);

  camera.position.y = 10;
  camera.position.z = 0;

  controls = new THREE.FirstPersonControls(camera);
  controls.movementSpeed = 20;
  controls.lookSpeed = 0.100;
  controls.nofly = true;
  controls.lookVertical = false;

  container.appendChild(renderer.domElement);

  render();
}

function render() {
  if(controls.dirty) {
    socket.emit('coord update', {uuid: g_uuid, x : camera.position.x, y: camera.position.y, z: camera.position.z});
    controls.dirty = false;
  }
  controls.update(clock.getDelta());
  requestAnimationFrame(render);
  renderer.render(scene, camera);
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
