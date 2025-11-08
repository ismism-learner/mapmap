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

  function shp(path: string): Promise<GeoJSON | GeoJSONFeature[]>

  export = shp
}
