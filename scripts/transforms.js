// set values of mat4x4 to the parallel projection / view matrix
function Mat4x4Parallel(mat4x4, prp, srp, vup, clip) {
	
	var translate = new Matrix(4,4);
	var rotate = new Matrix(4,4);
	var shear = new Matrix(4,4);
	var scale = new Matrix(4,4);
	var translateNear = new Matrix(4,4);
    // 1. translate PRP to origin
	Mat4x4Translate(translate, -(prp.x), -(prp.y), -(prp.z));
	
    // 2. rotate VRC such that (u,v,n) align with (x,y,z)
	var n = prp.subtract(srp);
	n.normalize();
	var u = vup.cross(n);
	u.normalize();
	var v = n.cross(u); // already normalized so we dont need to do it again.
	rotate.values = 
		[
			[u.x, u.y, u.z, 0],
			[v.x, v.y, v.z, 0],
			[n.x, n.y, n.z, 0],
			[0, 0, 0, 1]
		];
		
    // 3. shear such that CW is on the z-axis
	var CW = new Vector3((clip[0] + clip[1]) / 2, (clip[2] + clip[3]) / 2, -(clip[4]));
	var DOP = CW.subtract(prp);
	var shx = -DOP.x / DOP.z;
	var shy = -DOP.y / DOP.z;

	Mat4x4ShearXY(shear, shx, shy);
	
    // 4. translate near clipping plane to origin
	Mat4x4Translate(translateNear, 0, 0, clip[4]);
	
    // 5. scale such that view volume bounds are ([-1,1], [-1,1], [-1,0]
	var sx = 2 / (clip[1] - clip[0]);
	var sy = 2 / (clip[3] - clip[2]);
	var sz = 1 / clip[5];
	Mat4x4Scale(scale, sx, sy, sz);
    // ...
    var transform = Matrix.multiply([scale, translateNear, shear, rotate, translate]);
    mat4x4.values = transform.values;
}

// set values of mat4x4 to the perspective projection / view matrix
function Mat4x4Projection(mat4x4, prp, srp, vup, clip) {
    let clip_val = {
        left: clip[0],
        right: clip[1],
        bottom: clip[2],
        top: clip[3],
        near: clip[4],
        far: clip[5]
    };

    let cw = new Vector3((clip_val.left+clip_val.right)/2, (clip_val.top+clip_val.bottom)/2, -clip_val.near);

    let dop = cw;

    //VR PRP = cw - origin

    let n_axis = prp.subtract(srp);
    n_axis.normalize();
    let u_axis = vup.cross(n_axis);
    u_axis.normalize();
    let v_axis = n_axis.cross(u_axis);

    // 1. translate PRP to origin
    let t_per = new Matrix(4,4);
    Mat4x4Translate(t_per, -prp.x, -prp.y, -prp.z);

    // 2. rotate VRC such that (u,v,n) align with (x,y,z)
    let r_per = new Matrix(4,4);
    r_per.values = [
        [u_axis.x, u_axis.y, u_axis.z, 0],
        [v_axis.x, v_axis.y, v_axis.z, 0],
        [n_axis.x, n_axis.y, n_axis.z, 0],
        [0,0,0,1]
    ];

    // 3. shear such that CW is on the z-axis
    let sh_per = new Matrix(4,4);
    Mat4x4ShearXY(sh_per, (-dop.x)/dop.z, (-dop.y)/dop.z);
    //Mat4x4Identity(sh_per);

    // 4. scale such that view volume bounds are ([z,-z], [z,-z], [-1,zmin])
    let s_per = new Matrix(4,4);
    Mat4x4Scale(s_per,
        (2*clip_val.near)/((clip_val.right-clip_val.left)*clip_val.far),
        (2*clip_val.near)/((clip_val.top-clip_val.bottom)*clip_val.far),
        1/clip_val.far
    );

    var transform = Matrix.multiply([s_per,sh_per,r_per,t_per]);
    mat4x4.values = transform.values;
}

// set values of mat4x4 to project a parallel image on the z=0 plane
function Mat4x4MPar(mat4x4) {
    //mat4x4.values = ...;
}

// set values of mat4x4 to project a perspective image on the z=-1 plane
function Mat4x4MPer(mat4x4) {
    mat4x4.values = [[1, 0, 0, 0],
                     [0, 1, 0, 0],
                     [0, 0, 1, 0],
                     [0, 0, -1, 0]];
}



///////////////////////////////////////////////////////////////////////////////////
// 4x4 Transform Matrices                                                         //
///////////////////////////////////////////////////////////////////////////////////

// set values of mat4x4 to the identity matrix
function Mat4x4Identity(mat4x4) {
    mat4x4.values = [[1, 0, 0, 0],
                     [0, 1, 0, 0],
                     [0, 0, 1, 0],
                     [0, 0, 0, 1]];
}

// set values of mat4x4 to the translate matrix
function Mat4x4Translate(mat4x4, tx, ty, tz) {
    mat4x4.values = [[1, 0, 0, tx],
                     [0, 1, 0, ty],
                     [0, 0, 1, tz],
                     [0, 0, 0, 1]];
}

// set values of mat4x4 to the scale matrix
function Mat4x4Scale(mat4x4, sx, sy, sz) {
    mat4x4.values = [[sx,  0,  0, 0],
                     [ 0, sy,  0, 0],
                     [ 0,  0, sz, 0],
                     [ 0,  0,  0, 1]];
}

// set values of mat4x4 to the rotate about x-axis matrix
function Mat4x4RotateX(mat4x4, theta) {
    mat4x4.values = [[1,               0,                0, 0],
                     [0, Math.cos(theta), -Math.sin(theta), 0],
                     [0, Math.sin(theta),  Math.cos(theta), 0],
                     [0,               0,                0, 1]];
}

// set values of mat4x4 to the rotate about y-axis matrix
function Mat4x4RotateY(mat4x4, theta) {
    mat4x4.values = [[ Math.cos(theta), 0, Math.sin(theta), 0],
                     [               0, 1,               0, 0],
                     [-Math.sin(theta), 0, Math.cos(theta), 0],
                     [0, 0, 0, 1]];
}

// set values of mat4x4 to the rotate about z-axis matrix
function Mat4x4RotateZ(mat4x4, theta) {
    mat4x4.values = [[Math.cos(theta), -Math.sin(theta), 0, 0],
                     [Math.sin(theta),  Math.cos(theta), 0, 0],
                     [              0,                0, 1, 0],
                     [              0,                0, 0, 1]];
}

// set values of mat4x4 to the shear parallel to the xy-plane matrix
function Mat4x4ShearXY(mat4x4, shx, shy) {
    mat4x4.values = [[1, 0, shx, 0],
                     [0, 1, shy, 0],
                     [0, 0,   1, 0],
                     [0, 0,   0, 1]];
}

// create a new 3-component vector with values x,y,z
function Vector3(x, y, z) {
    let vec3 = new Vector(3);
    vec3.values = [x, y, z];
    return vec3;
}

// create a new 4-component vector with values x,y,z,w
function Vector4(x, y, z, w) {
    let vec4 = new Vector(4);
    vec4.values = [x, y, z, w];
    return vec4;
}
