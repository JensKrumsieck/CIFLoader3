import { Loader, LoadingManager, BufferGeometry } from "three";

export interface CIF {
	geometryAtoms: BufferGeometry;
	geometryBonds: BufferGeometry;
	json: {
		atoms: any[][]
	}
}

export class CIFLoader extends Loader {

	constructor( manager?: LoadingManager );

	load( url: string, onLoad: ( cif: CIF ) => void, onProgress?: ( event: ProgressEvent ) => void, onError?: ( event: ErrorEvent ) => void ) : void;
	parse( text: string ) : CIF;

}