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

  interface ShpJS {
    (path: string): Promise<GeoJSON | GeoJSONFeature[]>
    parseShp(buffer: ArrayBuffer, prj?: string): any
    parseDbf(buffer: ArrayBuffer, encoding?: string): any[]
    combine(arr: any[]): GeoJSON
  }

  const shp: ShpJS

  export = shp
}
