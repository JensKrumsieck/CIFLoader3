/**
 * @author JensKrumsieck / http://jenskrumsieck.de
 */

import { Loader, FileLoader, BufferGeometry, Float32BufferAttribute } from 'three';

var CIFLoader = function (manager) {
    Loader.call(this, manager);
};

/**
 * This basically is a port of the existing C# CIF Loader i wrote
 * for PorphyStruct which you can find here: https://github.com/JensKrumsieck/PorphyStruct/
 */

CIFLoader.prototype = Object.assign(
    Object.create(Loader.prototype), {
    constructor: CIFLoader,

    load: function (url, onLoad, onProgress, onError) {
        var scope = this

        var loader = new FileLoader(scope.manager);
        loader.setPath(scope.path);
        loader.load(url, function (text) {
            onLoad(scope.parse(text))
        },
            onProgress, onError);
    },

    parse: function (text) {
        var atoms = [];
        var bonds = [];

        //needed parameters for conversion of factorial to cartesian
        var lengths = cellParameters('cell_length')
        var angles = cellParameters('cell_angle')

        var loops = text.split('loop_');
        var molLoop = loops.find(s => s.includes('_atom_site_label'));
        var bondLoop = loops.find(s => s.includes('_geom_bond_atom_site_label_1'));

        //CPK Array "stolen" from PDBLoader https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/PDBLoader.js
        var CPK = { h: [255, 255, 255], he: [217, 255, 255], li: [204, 128, 255], be: [194, 255, 0], b: [255, 181, 181], c: [144, 144, 144], n: [48, 80, 248], o: [255, 13, 13], f: [144, 224, 80], ne: [179, 227, 245], na: [171, 92, 242], mg: [138, 255, 0], al: [191, 166, 166], si: [240, 200, 160], p: [255, 128, 0], s: [255, 255, 48], cl: [31, 240, 31], ar: [128, 209, 227], k: [143, 64, 212], ca: [61, 255, 0], sc: [230, 230, 230], ti: [191, 194, 199], v: [166, 166, 171], cr: [138, 153, 199], mn: [156, 122, 199], fe: [224, 102, 51], co: [240, 144, 160], ni: [80, 208, 80], cu: [200, 128, 51], zn: [125, 128, 176], ga: [194, 143, 143], ge: [102, 143, 143], as: [189, 128, 227], se: [255, 161, 0], br: [166, 41, 41], kr: [92, 184, 209], rb: [112, 46, 176], sr: [0, 255, 0], y: [148, 255, 255], zr: [148, 224, 224], nb: [115, 194, 201], mo: [84, 181, 181], tc: [59, 158, 158], ru: [36, 143, 143], rh: [10, 125, 140], pd: [0, 105, 133], ag: [192, 192, 192], cd: [255, 217, 143], in: [166, 117, 115], sn: [102, 128, 128], sb: [158, 99, 181], te: [212, 122, 0], i: [148, 0, 148], xe: [66, 158, 176], cs: [87, 23, 143], ba: [0, 201, 0], la: [112, 212, 255], ce: [255, 255, 199], pr: [217, 255, 199], nd: [199, 255, 199], pm: [163, 255, 199], sm: [143, 255, 199], eu: [97, 255, 199], gd: [69, 255, 199], tb: [48, 255, 199], dy: [31, 255, 199], ho: [0, 255, 156], er: [0, 230, 117], tm: [0, 212, 82], yb: [0, 191, 56], lu: [0, 171, 36], hf: [77, 194, 255], ta: [77, 166, 255], w: [33, 148, 214], re: [38, 125, 171], os: [38, 102, 150], ir: [23, 84, 135], pt: [208, 208, 224], au: [255, 209, 35], hg: [184, 184, 208], tl: [166, 84, 77], pb: [87, 89, 97], bi: [158, 79, 181], po: [171, 92, 0], at: [117, 79, 69], rn: [66, 130, 150], fr: [66, 0, 102], ra: [0, 125, 0], ac: [112, 171, 250], th: [0, 186, 255], pa: [0, 161, 255], u: [0, 143, 255], np: [0, 128, 255], pu: [0, 107, 255], am: [84, 92, 242], cm: [120, 92, 227], bk: [138, 79, 227], cf: [161, 54, 212], es: [179, 31, 212], fm: [179, 31, 186], md: [179, 13, 166], no: [189, 13, 135], lr: [199, 0, 102], rf: [204, 0, 89], db: [209, 0, 79], sg: [217, 0, 69], bh: [224, 0, 56], hs: [230, 0, 46], mt: [235, 0, 38], ds: [235, 0, 38], rg: [235, 0, 38], cn: [235, 0, 38], uut: [235, 0, 38], uuq: [235, 0, 38], uup: [235, 0, 38], uuh: [235, 0, 38], uus: [235, 0, 38], uuo: [235, 0, 38] };

        atoms = extractAtoms();
        bonds = extractBonds();
        return build();

        function cellParameters(type) {
            let parameters = []
            let lines = text.split('\n')
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].startsWith("_" + type)) {
                    //parameter value contains uncertainity in brackets, so strip that
                    var tmp = lines[i].split(" ");
                    var value = tmp[tmp.length - 1]; //last item
                    parameters.push(value.split('(')[0]);
                }
            }
            return parameters;
        }

        function extractAtoms() {
            let lines = molLoop.split('\n')
            let headers = lines.filter(s => s.trim().startsWith('_'));
            let body = lines.filter(s => !s.trim().startsWith('_'));
            let disorderIndex = headers.indexOf('_atom_site_disorder_group');

            let data = [];

            for (var i = 0; i < body.length; i++) {
                var raw_data = body[i].split(' ')
                if (disorderIndex >= 0
                    && disorderIndex < raw_data.length
                    && raw_data[disorderIndex] == "2" || raw_data.length != headers.length) continue;
                data.push(raw_data);
            }
            return calculateCartesian(data);
        }

        function calculateCartesian(data) {
            //variables introduced to deconfuse
            var atoms = [];

            var a = lengths[0]
            var b = lengths[1]
            var c = lengths[2]
            var alpha = angles[0]
            var beta = angles[1]
            var gamma = angles[2]

            for (var i = 0; i < data.length; i++) {
                //get xyz in fractional coordinates
                //1 is label, 2 is x, 3 is y, 4 is z
                let xFrac = data[i][2].split('(')[0]
                let yFrac = data[i][3].split('(')[0]
                let zFrac = data[i][4].split('(')[0]

                let angle = Math.PI / 180;

                //transformation matrix: see https://en.wikipedia.org/wiki/Fractional_coordinates#Conversion_to_Cartesian_coordinates
                //a21, a31, a32 = 0
                //a11 = a
                //other matrix entries as below:
                let a12 = b * Math.cos(gamma * angle)
                let a13 = c * Math.cos(beta * angle)

                let a22 = b * Math.sin(gamma * angle)
                let a23 = c * (Math.cos(alpha * angle) - Math.cos(beta * angle) * Math.cos(gamma * angle)) / Math.sin(gamma * angle)

                let a33 = c * (Math.sqrt(1 - Math.pow(Math.cos(alpha * angle), 2) - Math.pow(Math.cos(beta * angle), 2) - Math.pow(Math.cos(gamma * angle), 2) + 2 * Math.cos(alpha * angle) * Math.cos(beta * angle) * Math.cos(gamma * angle))) / Math.sin(gamma * angle)

                //xyz = [A]*(xyz)_frac
                let x = a * xFrac + a12 * yFrac + a13 * zFrac
                let y = a22 * yFrac + a23 * zFrac
                let z = a33 * zFrac

                let element = data[i][0].match(/([A-Z][a-z]*)/)[0]

                atoms.push({ id: data[i][0], element: element, x: x, y: y, z: z });
            }
            return atoms;
        }

        function extractBonds() {
            let lines = bondLoop.split('\n')
            let body = lines.filter(s => !s.trim().startsWith('_'));

            var bonds = []

            for (var i = 0; i < body.length; i++) {
                var raw_data = body[i].split(" ")
                let atom1 = raw_data[0]
                let atom2 = raw_data[1]

                //check if atoms existing
                if (atoms.filter(s => s.id == atom1).length == 1 && atoms.filter(s => s.id == atom2).length == 1)
                    bonds.push({ atom1: atom1, atom2: atom2 })
            }
            return bonds;
        }

        function build() {

            var build = {
                geometryAtoms: new BufferGeometry(),
                geometryBonds: new BufferGeometry(),
                json: {
                    atoms: atoms
                }
            };

            var geometryAtoms = build.geometryAtoms;
            var geometryBonds = build.geometryBonds;
            var vertices = [];
            var verticesBonds = [];
            var colors = [];

            for (var i = 0; i < atoms.length; i++) {
                var atom = atoms[i];

                vertices.push(atom.x, atom.y, atom.z);
                let color = CPK[atoms[i].element.toLowerCase()];
                colors.push(color[0] / 255, color[1] / 255, color[2] / 255)
            }

            geometryAtoms.setAttribute('position', new Float32BufferAttribute(vertices, 3));
            geometryAtoms.setAttribute('color', new Float32BufferAttribute(colors, 3));

            for (var i = 0; i < bonds.length; i++) {
                var bond = bonds[i];
                var atom1 = atoms.filter(s => s.id == bond.atom1)[0];
                var atom2 = atoms.filter(s => s.id == bond.atom2)[0];

                verticesBonds.push(atom1.x, atom1.y, atom1.z);
                verticesBonds.push(atom2.x, atom2.y, atom2.z);
            }

            geometryBonds.setAttribute('position', new Float32BufferAttribute(verticesBonds, 3));

            return build;
        }
    }
}
)

export { CIFLoader }