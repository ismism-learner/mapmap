declare module 'shpjs' {
  interface GeoJSONFeature {
    type: string
    geometry: {
      type: string
      coordinates: any
    }
    properties: Record<string, any>
  }

  interface GeoJSON {
    type: string
    features: GeoJSONFeature[]
  }

  interface ShapefileBuffers {
    shp: ArrayBuffer
    dbf?: ArrayBuffer
    cpg?: ArrayBuffer
    prj?: string
  }

  interface ShpJS {
    (input: string | ArrayBuffer | ShapefileBuffers): Promise<GeoJSON | GeoJSONFeature[]>
  }

  const shp: ShpJS

  export = shp
}
