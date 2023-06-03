// Author: Zacharie Mizeret (inspired by Computer Graphics course EPFL)

/**
 * @param {Number} divisions Number of divisions of the sphere
 * @returns Dictionary with all the mesh information needed for REGL.
 */
export function createSphere(divisions){
    const {sin, cos, PI} = Math;
	const v_resolution = divisions | 0; // tell optimizer this is an int
	const u_resolution = 2*divisions;
	const vertex_positions = [];
	const tex_coords = [];
	for(let iv = 0; iv < v_resolution; iv++) {
		const v = iv / (v_resolution-1);
		const phi = v * PI;
		const sin_phi = sin(phi);
		const cos_phi = cos(phi);

		for(let iu = 0; iu < u_resolution; iu++) {
			const u = iu / (u_resolution-1);

			const theta = 2*u*PI;
            let vert_position = [
                cos(theta) * sin_phi,
                sin(theta) * sin_phi,
                cos_phi, 
            ]
            
			tex_coords.push([
                u,
				v,
			])

            vertex_positions.push(vert_position)
		}
	}
	const faces = [];
	for(let iv = 0; iv < v_resolution-1; iv++) {
		for(let iu = 0; iu < u_resolution-1; iu++) {
			const i0 = iu + iv * u_resolution;
			const i1 = iu + 1 + iv * u_resolution;
			const i2 = iu + 1 + (iv+1) * u_resolution;
			const i3 = iu + (iv+1) * u_resolution;

			faces.push([i0, i1, i2]);
			faces.push([i0, i2, i3]);
		}
	}
	return {
		vertices: vertex_positions,
		normals: vertex_positions, // on a unit sphere, position is equivalent to normal
		uvs: tex_coords,
		faces: faces,
	}
}

