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

var socket;
var g_uuid;

var clients = {};

var Client = function(uuid) {
  this.position = [0.0, 0.0, 0.0];
  this.uuid = null;

  var geometry = new THREE.BoxGeometry(1,1,1);
  var material = new THREE.MeshPhongMaterial({
        color: 0x00FF00,
        specular: 0xFFFFFF,
        shininess: 30,
        shading: THREE.FlatShading
  });

  this.mesh = new THREE.Mesh(geometry, material);
  scene.add(this.mesh);
}

Client.prototype.destroy = function() {
  scene.remove(this.mesh);
};

Client.prototype.update_position = function(x,y,z) {
  this.mesh.position.x = x;
  this.mesh.position.y = y;
  this.mesh.position.z = z;
};

function threejs_init() {
  container = document.getElementById('container');
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, container.offsetWidth/container.offsetHeight, 0.1, 10000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  renderer.setClearColorHex( 0xffffff, 1 );

  var light = new THREE.PointLight(0xFFFFFF, 1, 100);
  light.position.set(10, 10, 10, 10);
  scene.add(light);

  var geometry = new THREE.BoxGeometry(6,6,6);
  var material = new THREE.MeshPhongMaterial({
        color: 0x0000FF,
        specular: 0xFFFFFF,
        shininess: 30,
        shading: THREE.FlatShading
  });

  this.mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  camera.position.y = 0;
  camera.position.z = 10;

  controls = new THREE.FirstPersonControls(camera);
  controls.movementSpeed = 20;
  controls.lookSpeed = 0.100;
  controls.nofly = true;
  controls.lookVertical = false;

  container.appendChild(renderer.domElement);

  render();
}

var oldx, oldy, oldz;
function render() {
  if(oldx != camera.position.x || oldy != camera.position.y || oldz != camera.position.z) {
    socket.emit('coord update', {uuid: g_uuid, x : camera.position.x, y: camera.position.y, z: camera.position.z});
    oldx = camera.position.x;
    oldy = camera.position.y;
    oldz = camera.position.z;
  }
  controls.update(clock.getDelta());
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

function websocket_start() {
  socket = io();

  socket.on("newcon", function(uuid) {
    $('#notifications').append($('<li>').text('new connection: ' + uuid));
    var client = new Client(uuid);
    clients[uuid] = client;
  });

  socket.on("register", function(uuid) {
    $('#notifications').append($('<li>').text('you are: ' + uuid));
    g_uuid = uuid;
  });

  socket.on("discon", function(uuid) {
    $('#notifications').append($('<li>').text('new disconnection: ' + uuid));
    clients[uuid].destroy();
    delete clients[uuid];
  });

  socket.on("coord update", function(data) {
//    $('#notifications').append($('<li>').text('coord update: ' + JSON.stringify(data)));
    var data = JSON.parse(data);
    if(data.uuid in clients) {
      clients[data.uuid].update_position(data.x, data.y, data.z);
    } else if(data.uuid != undefined) {
      $('#notifications').append($('<li>').text('new connection: ' + data.uuid));
      var client = new Client(data.uuid);
      client.update_position(data.x, data.y, data.z);
      clients[data.uuid] = client;
    }
  });
}
