var GameObject = function(uuid) {
  this.position = [0.0, 0.0, 0.0];
  this.uuid = null;

  var geometry = new THREE.SphereGeometry(5, 32, 32);
  var material = new THREE.MeshPhongMaterial({
        color: 0x00FF00,
        specular: 0xFFFFFF,
        shininess: 30,
        shading: THREE.FlatShading
  });

  this.mesh = new THREE.Mesh(geometry, material);
  scene.add(this.mesh);
}

GameObject.prototype.destroy = function() {
  scene.remove(this.mesh);
};

GameObject.prototype.update_position = function(x,y,z) {
  this.mesh.position.x = x;
  this.mesh.position.y = y;
  this.mesh.position.z = z;
};


