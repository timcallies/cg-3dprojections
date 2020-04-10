// set values of mat4x4 to the parallel projection / view matrix
function Mat4x4Parallel(mat4x4, prp, srp, vup, clip) {
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

    let n_axis = prp.subtract(srp);
    n_axis.normalize();
    let u_axis = vup.cross(n_axis);
    u_axis.normalize();
    let v_axis = n_axis.cross(u_axis);
    

    // 1. translate PRP to origin
    let t_par = new Matrix(4,4);
    Mat4x4Translate(t_par, -prp.x, -prp.y, -prp.z);

    // 2. rotate VRC such that (u,v,n) align with (x,y,z)
    let r_par = new Matrix(4,4);
    r_par.values = [
        [u_axis.x, u_axis.y, u_axis.z, 0],
        [v_axis.x, v_axis.y, v_axis.z, 0],
        [n_axis.x, n_axis.y, n_axis.z, 0],
        [0,0,0,1]
    ];

    // 3. shear such that CW is on the z-axis
    let sh_par = new Matrix(4,4);
    Mat4x4ShearXY(sh_par, (-dop.x)/dop.z, (-dop.y)/dop.z);
    //Mat4x4Identity(sh_par)

    // 4. translate near clipping plane to origin
    let t_clip = new Matrix(4,4);
    t_clip.values = [
        [1,0,0,0],
        [0,1,0,0],
        [0,0,1,clip_val.near],
        [0,0,0,1]
    ];

    // 5. scale such that view volume bounds are ([-1,1], [-1,1], [-1,0])
    let s_par = new Matrix(4,4);
    Mat4x4Scale(s_par,
        2/(clip_val.right - clip_val.left),
        2/(clip_val.top - clip_val.bottom),
        1/clip_val.far
    );

    var transform = Matrix.multiply([s_par,t_clip,sh_par,r_par,t_par]);
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
    mat4x4.values = [[1, 0, 0, 0],
                     [0, 1, 0, 0],
                     [0, 0, 0, 0],
                     [0, 0, 0, 1]];
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